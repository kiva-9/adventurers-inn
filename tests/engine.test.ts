import { describe, expect, it } from 'vitest';
import { advance, command, createWorld, validateWorld } from '../src/engine';

describe('世界账本与规则', () => {
  it('采购扣款和库存一致，非法数值不能污染账本', () => {
    const w=createWorld(1); const gold=w.gold, food=w.food; command(w,{type:'travel',place:'market'});
    expect(command(w,{type:'buy',item:'food',amount:3})).toBe(true);
    expect(w.gold).toBe(gold-12); expect(w.food).toBe(food+3);
    expect(command(w,{type:'buy',item:'food',amount:NaN})).toBe(false);
    expect(Number.isFinite(w.gold)).toBe(true);
  });

  it('赊账和还款转移一次，不能重复收取', () => {
    const w=createWorld(2); const n=w.npc[0];
    n.hunger=99; n.money=0; w.credit=true;
    const food=w.food; advance(w,60);
    expect(w.food).toBeLessThan(food); expect(n.debt).toBe(w.mealPrice);
    n.money=20; const gold=w.gold, debt=n.debt; command(w,{type:'travel',place:n.place}); while(Math.abs(w.player.x-n.x)+Math.abs(w.player.y-n.y)>2) command(w,{type:'move',dx:Math.sign(n.x-w.player.x),dy:Math.sign(n.y-w.player.y)});
    expect(command(w,{type:'talk',npcId:n.id,topic:'还款'})).toBe(true);
    expect(n.debt).toBe(0); expect(n.money).toBe(20-debt); expect(w.gold).toBe(gold+debt);
    expect(command(w,{type:'talk',npcId:n.id,topic:'还款'})).toBe(false);
    expect(w.gold).toBe(gold+debt);
  });

  it('采购委托可以先接受后采购再交付，奖励只结算一次', () => {
    const w=createWorld(3); w.herbs=0; command(w,{type:'travel',place:'guild'});
    expect(command(w,{type:'quest',id:'q0'})).toBe(true);
    expect(w.quests[0].status).toBe('进行中');
    command(w,{type:'travel',place:'market'}); expect(command(w,{type:'buy',item:'herbs',amount:4})).toBe(true); command(w,{type:'travel',place:'guild'});
    expect(command(w,{type:'quest',id:'q0'})).toBe(true);
    expect(w.herbs).toBe(0); expect(w.quests[0].status).toBe('完成');
    const gold=w.gold; expect(command(w,{type:'quest',id:'q0'})).toBe(false); expect(w.gold).toBe(gold);
  });

  it('床位不会超额，远征队离镇期间不参与镇上活动且归来只结算一次', () => {
    const w=createWorld(4); const members=['n0','n1','n2']; command(w,{type:'travel',place:'guild'});
    expect(command(w,{type:'expedition',region:'森林',members,supply:4,strategy:'谨慎'})).toBe(true);
    expect(command(w,{type:'expedition',region:'森林',members,supply:4,strategy:'谨慎'})).toBe(false);
    for(let t=0;t<180;t++) {
      advance(w,1);
      expect(w.npc.filter(n=>n.bed).length).toBeLessThanOrEqual(w.beds);
      if(w.expedition?.phase!=='归来') for(const id of members) {
        const n=w.npc.find(x=>x.id===id)!; expect(n.away).toBe(true); expect(n.bed).toBe(false); expect(n.action).toBe('远征中');
      }
    }
    expect(w.expedition?.phase).toBe('归来');
    for(const id of members) expect(w.npc.find(n=>n.id===id)?.away).toBe(false);
    const returns=()=>w.events.filter(e=>e.kind==='远征'&&e.text.includes('远征归来')).length;
    expect(returns()).toBe(1); advance(w,10); expect(returns()).toBe(1);
  });

  it('相同种子和命令在存读档与分段推进后保持一致', () => {
    const a=createWorld(17); const b=createWorld(17);
    for(const w of [a,b]) { command(w,{type:'travel',place:'guild'}); command(w,{type:'quest',id:'q0'}); command(w,{type:'expedition',region:'森林',members:['n0','n1'],supply:4,strategy:'谨慎'}); }
    advance(a,600); advance(b,200);
    const loaded=JSON.parse(JSON.stringify(b)); expect(validateWorld(loaded)).toBe(true); advance(loaded,400);
    expect(loaded).toEqual(a);
  });

  it('损坏的嵌套状态和非有限数值不能被当作合法存档', () => {
    const noInventory:Record<string,unknown>=JSON.parse(JSON.stringify(createWorld(1))); delete noInventory.food;
    expect(validateWorld(noInventory)).toBe(false);
    const badNpc=createWorld(1); badNpc.npc[0].health=NaN;
    expect(validateWorld(badNpc)).toBe(false);
    const brokenParty=createWorld(1); command(brokenParty,{type:'travel',place:'guild'}); command(brokenParty,{type:'expedition',region:'森林',members:['n0'],supply:2,strategy:'谨慎'});
    brokenParty.npc[0].away=false;
    expect(validateWorld(brokenParty)).toBe(false);
    const nullNpc:unknown=JSON.parse(JSON.stringify(createWorld(1)));
    (nullNpc as {npc:unknown[]}).npc[0]=null;
    expect(() => validateWorld(nullNpc)).not.toThrow();
    expect(validateWorld(nullNpc)).toBe(false);
  });

  it('房价改变实际入住行为', () => {
    const cheap=createWorld(5), expensive=createWorld(5);
    command(cheap,{type:'policy',price:3}); command(expensive,{type:'policy',price:20});
    advance(cheap,720); advance(expensive,720);
    expect(cheap.events.filter(e=>e.kind==='入住').length).toBeGreaterThan(expensive.events.filter(e=>e.kind==='入住').length);
  });

  it('私下帮助只进入亲历者和在场见证者的记忆', () => {
    const w=createWorld(6); const n=w.npc[0]; n.health=50;
    const elsewhere=w.npc.find(p=>p.place!==n.place)!;
    expect(command(w,{type:'talk',npcId:n.id,topic:'帮助'})).toBe(true);
    const event=w.events.at(-1)!;
    expect(n.memories.some(m=>m.eventId===event.id&&m.source==='亲历')).toBe(true);
    expect(elsewhere.memories.some(m=>m.eventId===event.id)).toBe(false);
  });

  it('日结后真实存档有效并可从同一状态继续', () => {
    const w=createWorld(777); advance(w,1500);
    const restored=JSON.parse(JSON.stringify(w));
    expect(validateWorld(restored)).toBe(true);
    advance(w,300); advance(restored,300); expect(restored).toEqual(w);
  });

  it('策略、移动和等待拒绝非有限输入，保持账本和位置有效', () => {
    const w=createWorld(8); const price=w.price, x=w.player.x, tick=w.tick;
    expect(command(w,{type:'policy',price:NaN})).toBe(false);
    expect(command(w,{type:'move',dx:NaN,dy:0})).toBe(false);
    expect(command(w,{type:'wait',minutes:NaN})).toBe(false);
    expect(w.price).toBe(price); expect(w.player.x).toBe(x); expect(w.tick).toBe(tick);
  });

  it('调解完成后即便旧记忆被淘汰也不能再次领取支持', () => {
    const w=createWorld(9); const n=w.npc[1]; command(w,{type:'travel',place:'guild'});
    expect(command(w,{type:'talk',npcId:n.id,topic:'调解'})).toBe(true);
    const gold=w.gold, support=w.support.守望者;
    n.memories=[];
    expect(command(w,{type:'talk',npcId:n.id,topic:'调解'})).toBe(false);
    expect(w.gold).toBe(gold); expect(w.support.守望者).toBe(support);
  });

  it('正在移动时经过 JSON 存档恢复，仍走完同一条路径', () => {
    const w=createWorld(11); const n=w.npc[1]; n.hunger=99;
    advance(w,180);
    expect(n.destination).toBe('inn');
    const restored=JSON.parse(JSON.stringify(w));
    expect(validateWorld(restored)).toBe(true);
    advance(w,120); advance(restored,120); expect(restored).toEqual(w);
  });

  it('无人值守时不能自动供餐，帮手在岗时可以', () => {
    const staffed=createWorld(12), empty=createWorld(12);
    for(const w of [staffed,empty]) { w.player.place='guild'; w.npc[0].hunger=99; }
    empty.helper=false;
    advance(staffed,60); advance(empty,60);
    expect(staffed.npc[0].hunger).toBeLessThan(empty.npc[0].hunger);
    expect(staffed.events.some(e=>e.kind==='用餐'&&e.people.includes('n0'))).toBe(true);
    expect(empty.events.some(e=>e.kind==='用餐'&&e.people.includes('n0'))).toBe(false);
  });

  it('厨房改善丰盛餐食恢复疲劳，公共空间改变可接受房价', () => {
    const base=createWorld(13), improved=createWorld(13);
    for(const w of [base,improved]) {w.npc[0].hunger=99;w.npc[0].fatigue=60;w.npc[0].money=100;}
    improved.kitchen=1; advance(base,60); advance(improved,60);
    expect(improved.npc[0].fatigue).toBe(base.npc[0].fatigue-2);

    const plain=createWorld(14), hall=createWorld(14);
    for(const w of [plain,hall]) {
      w.price=9; w.beds=14; w.minute=1080;
      const n=w.npc[5]; n.place='inn';n.x=5;n.y=5;n.hunger=0;n.fatigue=99;
    }
    hall.hall=1; advance(plain,60); advance(hall,60);
    expect(plain.npc[5].bed).toBe(false); expect(hall.npc[5].bed).toBe(true);
  });

  it('持续采购并支付服务后，第四天仍有可参加远征的健康角色', () => {
    const w=createWorld(101);
    command(w,{type:'policy',mealPrice:7,credit:false,helper:true});
    for(let i=0;i<65;i++) {
      if(w.food<=10 && w.gold>=80) {
        command(w,{type:'travel',place:'market'});
        command(w,{type:'buy',item:'food',amount:20});
        command(w,{type:'travel',place:'inn'});
      }
      advance(w,60);
    }
    expect(w.day).toBeGreaterThanOrEqual(4);
    expect(w.npc.filter(n=>n.health>=50&&n.fatigue<=85).length).toBeGreaterThanOrEqual(3);
  });
  it('等待到明早正常执行每分钟并只产生一次日结', () => {
    const w=createWorld(21); const startTick=w.tick;
    expect(command(w,{type:'waitUntil',target:'morning'})).toBe(true);
    expect(w.day).toBe(2); expect(w.minute).toBe(480); expect(w.tick-startTick).toBe(1440);
    expect(w.events.filter(e=>e.kind==='日结'&&e.day===1)).toHaveLength(1);
    expect(w.events.filter(e=>e.kind==='租金'&&e.day===1)).toHaveLength(1);
  });

  it('等待远征遇途中抉择时中断并保留队伍，处理后正常归来', () => {
    const w=createWorld(22); command(w,{type:'travel',place:'guild'});
    expect(command(w,{type:'expedition',region:'森林',members:['n0','n1'],supply:4,strategy:'谨慎'})).toBe(true);
    expect(command(w,{type:'waitUntil',target:'expedition'})).toBe(true);
    expect(w.expedition?.phase).toBe('抉择'); expect(w.expedition?.remaining).toBe(90);
    expect(w.npc.filter(n=>n.away).map(n=>n.id)).toEqual(['n0','n1']);
    const tick=w.tick; expect(command(w,{type:'waitUntil',target:'morning'})).toBe(false);expect(w.tick).toBe(tick);
    expect(command(w,{type:'choice',choice:'继续'})).toBe(true);
    expect(command(w,{type:'waitUntil',target:'expedition'})).toBe(true);
    expect(w.expedition?.phase).toBe('归来');expect(w.npc.some(n=>n.away)).toBe(false);
    expect(w.events.filter(e=>e.kind==='远征'&&e.text.includes('远征归来'))).toHaveLength(1);
  });

  it('调解初始争议后双方关系恢复，不能向另一方重复结算', () => {
    const w=createWorld(23), a=w.npc[1], b=w.npc[9];
    expect(a.relations[b.id]).toBe(-1);expect(b.relations[a.id]).toBe(-1);
    command(w,{type:'travel',place:'guild'});
    const before=w.gold;expect(command(w,{type:'talk',npcId:a.id,topic:'调解'})).toBe(true);
    expect(w.gold).toBe(before-5);expect(a.dispute).toBe(false);expect(b.dispute).toBe(false);
    expect(a.relations[b.id]).toBe(0);expect(b.relations[a.id]).toBe(0);
    const support={...w.support};command(w,{type:'travel',place:'square'});
    expect(command(w,{type:'talk',npcId:b.id,topic:'调解'})).toBe(false);
    expect(w.gold).toBe(before-5);expect(w.support).toEqual(support);
    expect(w.events.filter(e=>e.kind==='调解')).toHaveLength(1);
  });

});
