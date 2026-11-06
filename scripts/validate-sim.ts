/** Deterministic, legal-command strategies. No fixture mutates the world directly. */
import { advance, command, createWorld } from '../src/engine';
import type { Command, NPC, World } from '../src/types';

const defaults = [101, 202, 303, 404, 505, 606, 707, 808, 1709, 2811];
const seeds = process.argv.length>2 ? process.argv.slice(2).map(Number) : defaults;
if(seeds.some(s=>!Number.isSafeInteger(s)||s<1||s>4294967295)) throw new Error('种子必须是 1 至 4294967295 的整数');
type Strategy = '守望' | '商路';

function play(seed:number, strategy:Strategy) {
  const w = createWorld(seed);
  let failedCommands = 0;
  let launches = 0;
  const send = (c:Command) => { const ok = command(w, c); if (!ok) failedCommands++; return ok; };
  const go = (place:World['player']['place']) => { if (w.player.place!==place) send({type:'travel',place}); };
  send({ type:'policy', price:8, mealPrice:7, credit:strategy === '守望', helper:true });
  const upkeep = () => {
    if(strategy==='守望' && w.day>=3 && w.credit) { go('inn'); send({type:'policy',credit:false}); }
    if(w.food<=10 && w.gold>=80) { go('market'); send({type:'buy',item:'food',amount:20}); }
    go('inn'); advance(w,60);
  };
  const destinations = strategy === '守望'
    ? [{quest:'q1',region:'森林' as const, skill:'探索' as const}]
    : [{quest:'q2',region:'废矿' as const, skill:'武力' as const},{quest:'q3',region:'遗迹' as const, skill:'医术' as const}];
  if (strategy === '守望') {go('guild');send({ type:'quest', id:'q0' });}
  for (const target of destinations) {
    const opening=w.quests.find(q=>q.id===target.quest)?.availableDay??1;
    while(w.day<opening && w.chapter==='进行中')upkeep();
    if (w.chapter !== '进行中') break;
    go('guild');
    const q=w.quests.find(q=>q.id===target.quest)!;
    while(w.day<q.availableDay && w.chapter==='进行中') upkeep();
    if(w.chapter!=='进行中') break;
    send({type:'travel',place:'guild'});send({ type:'quest', id:target.quest });
    // Retry a legitimate unsuccessful expedition while its contract remains available.
    for (let attempt=0; attempt<4 && w.quests.find(q=>q.id===target.quest)?.status==='进行中'; attempt++) {
      if (w.food<4 && w.gold>=80) {go('market');send({type:'buy',item:'food',amount:20});go('guild');}
      const available = w.npc.filter(n=>!n.away && n.health>=50 && n.fatigue<=85 && !(target.region==='遗迹' && n.trait==='谨慎' && n.trust<2) && n.grudge<=n.trust+2)
        .sort((a:NPC,b:NPC)=>Number(b.skill===target.skill)-Number(a.skill===target.skill));
      if (available.length===0 || w.food<4) break;
      if (!send({type:'expedition',region:target.region,members:available.slice(0,3).map(n=>n.id),supply:4,strategy:'谨慎'})) break;
      launches++;
      // Minute-by-minute only during journeys to make the legal midpoint choice.
      while (w.expedition && w.expedition.phase!=='归来' && w.chapter==='进行中') {
        if(w.expedition.phase==='抉择') send({type:'choice',choice:'继续'});
        advance(w,1);
      }
    }
  }
  const achieved = { day:w.day, reputation:w.reputation, support:{...w.support}, quests:w.quests.map(q=>`${q.id}:${q.status}`) };
  // Normal simulation steps; no direct jumps over daily accounting.
  while(w.chapter==='进行中') {
    upkeep();
  }
  return { seed, seedSet:process.argv.length>2?'命令行指定':'调试观察（非最终留出验证）', strategy, result:w.chapter, day:w.day, gold:w.gold, food:w.food,
    reputation:w.reputation, support:w.support, debt:w.debt, launches, failedCommands, achieved,
    events:w.events.length, away:w.npc.filter(n=>n.away).length, bedUse:w.npc.filter(n=>n.bed).length, beds:w.beds };
}

for(const strategy of ['守望','商路'] as const) for(const seed of seeds) console.log(JSON.stringify(play(seed,strategy)));
