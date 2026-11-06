export type Place = 'inn'|'guild'|'market'|'clinic'|'square'|'gate';
export type Faction = '商会'|'守望者'|'中立';
export interface Memory { eventId:number; day:number; text:string; source:'亲历'|'目击'|'听说'|'公告'; importance:number }
export interface NPC { id:string; name:string; role:string; faction:Faction; color:number; skill:'武力'|'探索'|'医术'|'交涉'; trait:string; goal:string; money:number; health:number; hunger:number; fatigue:number; place:Place; x:number; y:number; action:string; plan:string; trust:number; closeness:number; grudge:number; debt:number; bed:boolean; away:boolean; memories:Memory[]; reason:string; candidate:string[]; mediated:boolean; dispute:boolean; lastRestNight:number; relations:Record<string,number>; destination?:Place; route?:Array<{x:number;y:number}> }
export interface LogEvent { id:number; day:number; minute:number; kind:string; text:string; people:string[]; public:boolean; importance:number }
export interface Quest { id:string; title:string; kind:'采购'|'调查'|'护送'|'救援'; publisher:string; reward:number; availableDay:number; deadline:number; status:'可接'|'进行中'|'完成'|'失败'|'被接走'|'他人进行中'|'他人完成'|'他人失败'|'过期'; detail:string; assignee?:string }
export interface Expedition { id:number; region:'森林'|'废矿'|'遗迹'; members:string[]; supply:number; strategy:'谨慎'|'冒险'; remaining:number; duration:number; phase:'途中'|'抉择'|'归来'; choiceDue:number; decision?:'继续'|'折返'; summary:string[] }
export interface NpcContract { questId:string; npcId:string; phase:'赴镇门'|'采购中'|'送诊所'; remaining:number; cost:number; cargoHerbs:number }
export interface World { version:1; seed:number; rng:number; tick:number; day:number; minute:number; gold:number; food:number; herbs:number; materials:number; price:number; mealPrice:number; credit:boolean; helper:boolean; beds:number; kitchen:number; hall:number; building?:{kind:'beds'|'kitchen'|'hall'; due:number}; support:{商会:number;守望者:number}; reputation:number; debt:number; npc:NPC[]; quests:Quest[]; npcContract?:NpcContract; expedition?:Expedition; events:LogEvent[]; nextEvent:number; income:number; expense:number; dailyIncome:number; dailyExpense:number; chapter:'进行中'|'商路复兴'|'守望相助'|'失败'; endingReason:string; player:{place:Place;x:number;y:number}; paused:boolean; speed:1|2|4; lastMessage:string }
export type Command =
 | {type:'move'; dx:number;dy:number} | {type:'travel';place:Place} | {type:'policy';price?:number;mealPrice?:number;credit?:boolean;helper?:boolean}
 | {type:'buy';item:'food'|'herbs';amount:number} | {type:'upgrade';kind:'beds'|'kitchen'|'hall'} | {type:'talk';npcId:string;topic:'近况'|'消息'|'关系'|'帮助'|'还款'|'调解'|'交易'}
 | {type:'quest';id:string} | {type:'expedition';region:'森林'|'废矿'|'遗迹';members:string[];supply:number;strategy:'谨慎'|'冒险'} | {type:'choice';choice:'继续'|'折返'}
 | {type:'waitUntil';target:'morning'|'expedition'} | {type:'repay';amount:number} | {type:'speed';speed:1|2|4} | {type:'pause';paused:boolean} | {type:'wait';minutes:number} | {type:'continue'};
export type WorkerRequest = {type:'new';seed:number}|{type:'load';world:World}|{type:'command';command:Command}|{type:'snapshot'};
export type WorkerResponse = {type:'snapshot';world:World}|{type:'error';message:string};
