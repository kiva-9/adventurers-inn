/** 续营压力检查：只通过新游戏、合法命令和普通时间推进产生状态。 */
import assert from 'node:assert/strict';
import { advance, command, createWorld, marketUnitPrices, validateWorld } from '../src/engine';
import { findPath } from '../src/pathfinding';
import { isSceneBlocked } from '../src/collision';
import type { World, Command, Quest } from '../src/types';

type ContinuedWorld = World & { continued?:boolean; chapterDay?:number; lastGuildWorkDay?:number; questHistory?:Quest[] };
// Kept independent of the implementation branch until it is merged.
const sendCommand = command as (world:World, input:Command | {type:'guildWork'}) => boolean;
const seeds = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : [101,202];
if(seeds.some(s=>!Number.isSafeInteger(s)||s<1||s>4294967295)) throw Error('种子必须为有效正整数');

function play(seed:number) {
  const w=createWorld(seed) as ContinuedWorld;
  const rejects:string[]=[];
  let launches=0, recurringCompletions=0, guildAttempts=0, guildCompletions=0, guildInterruptions=0, midTripChecks=0, treatments=0;
  const supplyChoices:unknown[]=[];
  const send=(input:Command|{type:'guildWork'}, allowReject=false)=>{
    const ok=sendCommand(w,input); if(!ok&&!allowReject) rejects.push(`${w.day}:${input.type}:${w.lastMessage}`); return ok;
  };
  const go=(place:World['player']['place'])=>{if(w.player.place!==place)send({type:'travel',place});};
  const buyFood=()=>{
    if(w.food<=10&&w.gold>=80){go('market');send({type:'buy',item:'food',amount:20});}
    // 保留诊疗余量，避免所有草药被交付采购委托后伤员长期得不到治疗。
    if(w.herbs<=3&&w.gold>=30){go('market');send({type:'buy',item:'herbs',amount:10});}
    go('inn');
  };
  const buyOneHerbAtActualPrice=()=>{
    go('market'); const before=w.gold,unit=marketUnitPrices(w).herbs;
    assert.ok(send({type:'buy',item:'herbs',amount:1}));
    assert.equal(before-w.gold,unit,'草药实际扣款与报价不一致');return unit;
  };
  const treatInjured=()=>{
    const n=w.npc.find(x=>!x.away&&!x.destination&&x.health<=80);
    if(!n||w.herbs<1)return;
    go(n.place);
    const destinations=[];
    for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)if(Math.abs(dx)+Math.abs(dy)<=2) {
      const x=n.x+dx,y=n.y+dy;if(!isSceneBlocked(n.place,x,y,w.beds))destinations.push({x,y});
    }
    const route=destinations.map(p=>findPath(w.player,p,(x,y)=>isSceneBlocked(n.place,x,y,w.beds))).find(p=>p!==null);
    if(!route)return;
    for(const step of route)send({type:'move',dx:step.x-w.player.x,dy:step.y-w.player.y});
    const health=n.health,herbs=w.herbs;
    if(send({type:'talk',npcId:n.id,topic:'帮助'},true)) {
      assert.ok(n.health>health);assert.equal(w.herbs,herbs-1);treatments++;
    }
  };
  const chooseParty=(region:'森林'|'废矿'|'遗迹')=>w.npc.filter(n=>!n.away&&n.id!==w.npcContract?.npcId&&n.health>=50&&n.fatigue<=85&&!(region==='遗迹'&&n.trait==='谨慎'&&n.trust<2)&&n.grudge<=n.trust+2)
    .sort((a,b)=>Number(b.skill===(region==='森林'?'探索':region==='废矿'?'武力':'医术'))-Number(a.skill===(region==='森林'?'探索':region==='废矿'?'武力':'医术'))).slice(0,3).map(n=>n.id);
  const roundTrip=(steps:number)=>{
    const saved:unknown=JSON.parse(JSON.stringify(w)); assert.ok(validateWorld(saved),`第 ${w.day} 日有效状态被拒绝`);
    const a=structuredClone(w),b=saved as World;
    advance(a,steps); advance(b,steps); assert.deepStrictEqual(b,a,`第 ${w.day} 日读档后随机状态或世界分歧`);
  };
  const launch=(region:'森林'|'废矿'|'遗迹')=>{
    const members=chooseParty(region); if(!members.length||w.food<4||w.gold<12)return false;
    go('guild'); if(!send({type:'expedition',region,members,supply:4,strategy:'谨慎'},true))return false;
    launches++; advance(w,20); roundTrip(120); midTripChecks++;
    while(w.expedition&&w.expedition.phase!=='归来') {
      if(w.expedition.phase==='抉择')send({type:'choice',choice:'继续'});
      advance(w,1);
    }
    const completedGold=w.gold,completedMaterials=w.materials;
    send({type:'choice',choice:'继续'},true);
    assert.equal(w.gold,completedGold,'归来后重复选择产生额外金币');
    assert.equal(w.materials,completedMaterials,'归来后重复选择产生额外材料');
    return true;
  };
  send({type:'policy',price:8,mealPrice:7,credit:false,helper:true});
  go('guild');send({type:'quest',id:'q0'});go('inn');
  let attemptedDay=0;
  while(w.chapter==='进行中') {
    if(w.supplyCrisis?.status==='开放')send({type:'supplyCrisis',choice:'保留'});
    const quest=w.quests.find(q=>q.id==='q1');
    if(w.day>=4 && quest && ['可接','进行中'].includes(quest.status)&&attemptedDay!==w.day) {
      go('guild');if(quest.status==='可接')send({type:'quest',id:'q1'});
      attemptedDay=w.day;launch('森林');
    }
    buyFood();advance(w,60);
  }
  assert.notEqual(w.chapter,'失败',`种子 ${seed} 在正常篇章中未成功：${w.endingReason}`);
  const original={chapter:w.chapter,reason:w.endingReason,day:w.day};
  assert.ok(send({type:'continue'}),'续营命令被拒绝');
  assert.equal(w.continued,true);
  let lastWork=0,lastRecurringDay=0,lastTreatmentDay=0;
  const milestones=[];
  for(const target of [90,180,365]) {
    while(w.day<target) {
      assert.equal(w.continued,true,'续营意外停止');
      buyFood();
      const crisis=w.supplyCrisis;
      if(crisis?.status==='开放'&&(crisis.cycle===1||crisis.cycle===2)) {
        const beforeSupport={...w.support},beforePrice=buyOneHerbAtActualPrice();
        const choice=crisis.cycle===1?'守望者':'商会';
        assert.ok(send({type:'supplyCrisis',choice}));
        const afterChoice={food:w.food,herbs:w.herbs,support:{...w.support}};
        assert.equal(send({type:'supplyCrisis',choice},true),false,'供需请求重复选择成功');
        assert.deepStrictEqual({food:w.food,herbs:w.herbs,support:w.support},afterChoice,'供需请求重复扣款或发奖');
        const afterPrice=buyOneHerbAtActualPrice();
        supplyChoices.push({cycle:crisis.cycle,day:w.day,choice,beforeSupport,afterSupport:{...w.support},beforeHerbPrice:beforePrice,afterHerbPrice:afterPrice});
      }
      if(w.day%7===0&&lastTreatmentDay!==w.day){lastTreatmentDay=w.day;treatInjured();}
      if(w.debt>0&&w.gold>150){go('inn');send({type:'repay',amount:Math.min(w.debt,10)});}
      if(lastWork!==w.day) {
        go('guild'); const day=w.day;
        if(send({type:'guildWork'},true)) {
          guildAttempts++; lastWork=day;
          const text=w.lastMessage;
          if(text.includes('短工')&&text.includes('中断'))guildInterruptions++;
          else if(text.includes('短工')&&text.includes('完成'))guildCompletions++;
          else throw Error(`第 ${day} 日短工未产生可解释的结束事件`);
          if(w.day===day){const gold=w.gold,tick=w.tick;assert.equal(send({type:'guildWork'},true),false,'同日短工重复成功');assert.equal(w.gold,gold);assert.equal(w.tick,tick);}
        } else lastWork=day;
      }
      // 前两次供需选择前不领取周期委托，单独观测支持阈值造成的价格变化。
      if(w.day>60&&lastRecurringDay!==w.day) {
        lastRecurringDay=w.day;
        const q=w.quests.find(x=>x.id.startsWith('r')&&x.status==='可接');
        if(q) {
          if(q.kind==='采购'&&w.herbs<4&&w.gold>=12){go('market');send({type:'buy',item:'herbs',amount:4});}
          go('guild');
          if(send({type:'quest',id:q.id},true)) {
            if(q.kind==='采购'&&q.status==='完成') recurringCompletions++;
            else if(q.kind!=='采购') {
              const region=q.kind==='调查'?'森林':q.kind==='护送'?'废矿':'遗迹';
              if(launch(region)&&q.status==='完成')recurringCompletions++;
            }
            if(q.status==='完成') {
              go('guild');const gold=w.gold,rep=w.reputation,herbs=w.herbs,support={...w.support};
              assert.equal(send({type:'quest',id:q.id},true),false,'完成的周期委托重复领取成功');
              assert.deepStrictEqual({gold:w.gold,rep:w.reputation,herbs:w.herbs,support:w.support},{gold,rep,herbs,support},'周期委托重复结算');
            }
          }
        }
      }
      go('inn');advance(w,60);
      assert.ok(w.day<=target+1, '推进越过里程碑');
    }
    assert.equal(w.chapter,original.chapter,'原有章节结局被改写');
    assert.equal(w.endingReason,original.reason,'原有结算说明被改写');
    assert.ok(w.events.length<=400 && w.npc.every(n=>n.memories.length<=30));
    assert.ok((w.questHistory?.length??0)<=40);
    assert.ok(w.npc.filter(n=>n.bed).length<=w.beds);
    assert.ok(w.gold>=0&&w.food>=0&&w.herbs>=0&&w.debt>=0);
    roundTrip(180);
    milestones.push({day:w.day,gold:w.gold,debt:w.debt,food:w.food,herbs:w.herbs,income:w.income,expense:w.expense,
      healthyAvailable:w.npc.filter(n=>n.health>=50&&n.fatigue<=85&&!n.away).length,
      healthRange:[Math.min(...w.npc.map(n=>n.health)),Math.max(...w.npc.map(n=>n.health))],
      fatigueRange:[Math.min(...w.npc.map(n=>n.fatigue)),Math.max(...w.npc.map(n=>n.fatigue))],
      npcAway:w.npc.filter(n=>n.away).length,events:w.events.length,maxMemories:Math.max(...w.npc.map(n=>n.memories.length)),
      quests:w.quests.length,questHistory:w.questHistory?.length??0,rng:w.rng});
  }
  return {seed,original,milestones,launches,recurringCompletions,guildAttempts,guildCompletions,guildInterruptions,midTripChecks,treatments,supplyChoices,rejects};
}
for(const seed of seeds)console.log(JSON.stringify(play(seed)));
