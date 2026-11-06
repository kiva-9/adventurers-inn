import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js';
import type { NPC, Place, World } from './types';

const TILE=32, COLS=31, ROWS=17;
/** The simulation owns coordinates; this class only paints its snapshots. */
export class WorldRenderer {
 private app:Application|null=null; private scene=new Container(); private actors=new Container(); private tileSheet:Texture|null=null; private peopleSheet:Texture|null=null; private buildings:Texture|null=null; private current:Place|null=null; private currentBeds=0; private sprites=new Map<string,Sprite>(); private names=new Map<string,Text>(); private previous=new Map<string,{x:number;y:number;direction:number}>(); private night=new Graphics().rect(0,0,COLS*TILE,ROWS*TILE).fill({color:0x182641,alpha:1}); private dead=false;
 async mount(host:HTMLElement){
  const app=new Application(); await app.init({width:COLS*TILE,height:ROWS*TILE,background:'#445d4b',antialias:false,preference:'webgl',resolution:1});
  if(this.dead){app.destroy(true);return} this.app=app;app.canvas.setAttribute('aria-label','像素小镇游戏画面');host.prepend(app.canvas);app.stage.addChild(this.scene,this.actors,this.night);this.night.eventMode='none';
  const [tiles,people,buildings]=await Promise.all([Assets.load('/assets/town-tiles.png'),Assets.load('/assets/people.png'),Assets.load('/assets/buildings.png')]);
  if(this.dead)return;this.tileSheet=tiles as Texture;this.peopleSheet=people as Texture;this.buildings=buildings as Texture;
  this.tileSheet.source.scaleMode='nearest';this.peopleSheet.source.scaleMode='nearest';this.buildings.source.scaleMode='nearest';
 }
 private texture(sheet:Texture,x:number,y:number,w=32,h=32){return new Texture({source:sheet.source,frame:new Rectangle(x,y,w,h)});}
 private tile(col:number,row:number,x:number,y:number){if(!this.tileSheet)return;const s=new Sprite(this.texture(this.tileSheet,col*TILE,row*TILE));s.x=x*TILE;s.y=y*TILE;this.scene.addChild(s);}
 private building(index:number,x:number,y:number){if(!this.buildings)return;const s=new Sprite(this.texture(this.buildings,index*96,0,96,96));s.x=x*TILE;s.y=y*TILE;this.scene.addChild(s);}
 private label(text:string,x:number,y:number){const t=new Text({text,style:{fontFamily:'Microsoft YaHei, sans-serif',fontSize:13,fill:0xffedc7,stroke:{color:0x342a24,width:3}}});t.x=x;t.y=y;this.scene.addChild(t);}
 private makeScene(place:Place,beds:number){
  this.scene.removeChildren().forEach(c=>c.destroy());this.current=place;this.currentBeds=beds;
  // An intentionally compact, fixed grid. All scene art comes from local pixel atlases.
  const inside=place==='inn'||place==='guild'||place==='clinic';
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
   let col=inside?2:0;if(!inside&&(y>=7&&y<=10||x>=13&&x<=16))col=1;if(inside&&(y===0||y===ROWS-1||x===0||x===COLS-1))col=4;
   this.tile(col,0,x,y);
  }
  if(place==='inn'){
   for(let x=1;x<30;x++)this.tile(4,0,x,1);
   for(let x=3;x<10;x++)this.tile(2,1,x,4);
   [13,17,21].forEach(x=>{this.tile(1,1,x,7);this.tile(3,1,x-1,7);this.tile(3,1,x+1,7);});
   for(let i=0;i<beds;i++){const x=3+(i%7)*4,y=11+Math.floor(i/7)*2;if(y<15){this.tile(0,1,x,y);this.tile(5,1,x+1,y)}}
   [4,10,19,26].forEach(x=>this.tile(0,3,x,1));this.tile(4,2,27,4);this.tile(6,1,2,3);this.tile(6,1,28,12);this.tile(7,1,15,15);
   [2,3,4].forEach(x=>this.tile(2,3,x,2));[23,24,25].forEach(x=>this.tile(2,3,x,2));
   [[4,5],[8,5],[16,8],[20,8],[24,8]].forEach(([x,y])=>this.tile(3,3,x,y));
   [[2,5],[10,5],[26,4],[27,11],[19,12]].forEach(([x,y])=>this.tile(5,1,x,y));
   [13,14,15,16,17].forEach(x=>this.tile(7,2,x,13));this.tile(4,1,12,4);this.tile(4,1,21,4);this.tile(6,1,27,8);this.tile(6,1,3,14);this.tile(3,2,25,11);
   this.label('吧台',4*32,3*32);this.label('客房',3*32,10*32);this.label('公共厅',16*32,6*32);
  } else if(place==='guild'){
   for(let x=4;x<13;x++)this.tile(2,1,x,4);[6,12,18,24].forEach(x=>this.tile(2,3,x,2));[15,20,25].forEach(x=>this.tile(1,1,x,8));this.tile(1,3,23,3);this.tile(5,1,3,11);this.tile(7,1,15,15);this.label('委托与远征',5*32,3*32);
  } else if(place==='clinic'){
   [5,10,15,20,25].forEach(x=>{this.tile(0,1,x,6);this.tile(5,1,x+1,6)});[4,9,14,19,24].forEach(x=>this.tile(0,3,x,1));this.tile(2,1,4,3);this.tile(6,1,27,4);this.tile(7,1,15,15);this.label('诊疗室',4*32,2*32);
  } else {
   const objects:Record<Exclude<Place,'inn'|'guild'|'clinic'>,[number,number,number][]>={market:[[2,3,3],[1,13,3],[2,23,3]],square:[[4,13,3],[0,4,3],[1,24,3]],gate:[[5,14,2],[0,4,4],[2,24,4]]};
   for(const [b,x,y] of objects[place])this.building(b,x,y);
   for(let x=1;x<30;x+=4){if((x*7)%3===0)this.tile(0,2,x,13);else this.tile(2,2,x,14)}
   if(place==='market'){[6,12,20,25].forEach(x=>{this.tile(1,1,x,5);this.tile(6,2,x,6)});this.label('集市摊位',9*32,4*32)}
   if(place==='square'){this.tile(1,3,9,5);this.tile(4,2,20,6);this.label('镇广场',13*32,6*32)}
   if(place==='gate')this.label('通往旷野',14*32,6*32);
  }
  const shade=new Graphics().rect(0,0,COLS*TILE,ROWS*TILE).fill({color:0x182a26,alpha:.035});this.scene.addChild(shade);
 }
 private actor(id:string,row:number,x:number,y:number,action:string,tick:number,player=false){
  if(!this.peopleSheet)return;let sprite=this.sprites.get(id);let name=this.names.get(id);const old=this.previous.get(id);let direction=old?.direction??0;
  if(old){if(x<old.x)direction=1;else if(x>old.x)direction=2;else if(y<old.y)direction=3;else if(y>old.y)direction=0;}
  const moving=old&&(old.x!==x||old.y!==y);const frame=direction*3+(moving?1+(tick%2):0);
  const texture=this.texture(this.peopleSheet,frame*32,(row%14)*32);if(!sprite){sprite=new Sprite(texture);this.actors.addChild(sprite);this.sprites.set(id,sprite);name=new Text({text:id,style:{fontFamily:'Microsoft YaHei, sans-serif',fontSize:11,fill:0xfff6d9,stroke:{color:0x1d2823,width:3}}});this.names.set(id,name);this.actors.addChild(name);}else sprite.texture=texture;
  sprite.x=x*TILE;sprite.y=y*TILE;name!.x=x*TILE;name!.y=y*TILE-10-(player?10:(row%2)*10);name!.text=player?'你':id;
  sprite.alpha=action.includes('休息')?.85:1;this.previous.set(id,{x,y,direction});
 }
 update(world:World){if(!this.tileSheet||!this.peopleSheet)return;if(this.current!==world.player.place||(world.player.place==='inn'&&this.currentBeds!==world.beds))this.makeScene(world.player.place,world.beds);const hour=world.minute/60;this.night.alpha=hour<5||hour>=21?.25:hour<7||hour>=19?.12:0;
  const visible=new Set<string>(['__player']);this.actor('__player',13,world.player.x,world.player.y,'',world.tick,true);
  world.npc.forEach((n:NPC,i:number)=>{if(!n.away&&n.place===world.player.place){visible.add(n.name);this.actor(n.name,i,n.x,n.y,n.action,world.tick)}});
  for(const [id,s] of this.sprites){s.visible=visible.has(id);const name=this.names.get(id);if(name)name.visible=visible.has(id)}
 }
 destroy(){this.dead=true;if(this.app){this.app.destroy(true,{children:true});this.app=null;}}
}
