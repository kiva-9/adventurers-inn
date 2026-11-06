import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture, type Ticker } from 'pixi.js';
import type { NPC, Place, World } from './types';
import { SQUARE_DOORS } from './scene-transitions';
import { activityOf, nightOpacity, planVisualMovement, sampleVisualPath, type Activity, type VisualPoint } from './animation';

const TILE=32, COLS=31, ROWS=17;
interface ActorView { sprite:Sprite; name:Text; icon:Graphics; row:number; direction:number; frame:number; activity:Activity; phase:number; visible:boolean; x:number; y:number; toX:number; toY:number; progress:number; duration:number; path:VisualPoint[]; segment:number; previousRoute?:readonly VisualPoint[]; player:boolean }
/** The simulation owns coordinates; this class only paints its snapshots. */
export class WorldRenderer {
 private app:Application|null=null; private scene=new Container(); private actors=new Container(); private lights=new Container();
 private tileSheet:Texture|null=null; private peopleSheet:Texture|null=null; private buildings:Texture|null=null;
 private current:Place|null=null; private currentBeds=0; private views=new Map<string,ActorView>();
 private textureCache=new Map<string,Texture>(); private glows:Graphics[]=[]; private flames:Graphics[]=[];
 private night=new Graphics().rect(0,0,COLS*TILE,ROWS*TILE).fill({color:0x182641,alpha:1});
 private dead=false; private elapsed=0; private targetNight=0; private paused=true;
 async mount(host:HTMLElement){
  const app=new Application(); await app.init({width:COLS*TILE,height:ROWS*TILE,background:'#445d4b',antialias:false,preference:'webgl',resolution:1});
  if(this.dead){app.destroy(true);return} this.app=app;app.canvas.setAttribute('aria-label','像素小镇游戏画面');host.prepend(app.canvas);app.stage.addChild(this.scene,this.actors,this.night,this.lights);this.night.eventMode='none';this.night.alpha=0;this.lights.eventMode='none';
  const assetBase=`${import.meta.env.BASE_URL}assets/`;
  const [tiles,people,buildings]=await Promise.all([Assets.load(`${assetBase}town-tiles.png`),Assets.load(`${assetBase}people.png`),Assets.load(`${assetBase}buildings.png`)]);
  if(this.dead)return;this.tileSheet=tiles as Texture;this.peopleSheet=people as Texture;this.buildings=buildings as Texture;
  this.tileSheet.source.scaleMode='nearest';this.peopleSheet.source.scaleMode='nearest';this.buildings.source.scaleMode='nearest';
  app.ticker.add(this.animate);
 }
 private texture(sheet:Texture,x:number,y:number,w=32,h=32){
  const prefix=sheet===this.tileSheet?'t':sheet===this.peopleSheet?'p':'b';const key=`${prefix}:${x}:${y}:${w}:${h}`;
  let texture=this.textureCache.get(key);if(!texture){texture=new Texture({source:sheet.source,frame:new Rectangle(x,y,w,h)});this.textureCache.set(key,texture);}return texture;
 }
 private tile(col:number,row:number,x:number,y:number){if(!this.tileSheet)return;const s=new Sprite(this.texture(this.tileSheet,col*TILE,row*TILE));s.x=x*TILE;s.y=y*TILE;this.scene.addChild(s);}
 private building(index:number,x:number,y:number){if(!this.buildings)return;const s=new Sprite(this.texture(this.buildings,index*96,0,96,96));s.x=x*TILE;s.y=y*TILE;this.scene.addChild(s);}
 private label(text:string,x:number,y:number){const t=new Text({text,style:{fontFamily:'Microsoft YaHei, sans-serif',fontSize:13,fill:0xffedc7,stroke:{color:0x342a24,width:3}}});t.x=x;t.y=y;this.scene.addChild(t);}
 private makeScene(place:Place,beds:number){
  this.scene.removeChildren().forEach(c=>c.destroy());this.lights.removeChildren().forEach(c=>c.destroy());this.glows=[];this.flames=[];this.current=place;this.currentBeds=beds;
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
   this.label('返回广场',14*32,14*32);this.label('吧台',4*32,3*32);this.label('客房',3*32,10*32);this.label('公共厅',16*32,6*32);
  } else if(place==='guild'){
   for(let x=4;x<13;x++)this.tile(2,1,x,4);[6,12,18,24].forEach(x=>this.tile(2,3,x,2));[15,20,25].forEach(x=>this.tile(1,1,x,8));this.tile(1,3,23,3);this.tile(5,1,3,11);this.tile(7,1,15,15);this.label('返回广场',14*32,14*32);this.label('委托与远征',5*32,3*32);
  } else if(place==='clinic'){
   [5,10,15,20,25].forEach(x=>{this.tile(0,1,x,6);this.tile(5,1,x+1,6)});[4,9,14,19,24].forEach(x=>this.tile(0,3,x,1));this.tile(2,1,4,3);this.tile(6,1,27,4);this.tile(7,1,15,15);this.label('返回广场',14*32,14*32);this.label('诊疗室',4*32,2*32);
  } else {
   const objects:Record<Exclude<Place,'inn'|'guild'|'clinic'>,[number,number,number][]>={market:[[2,3,3],[1,13,3],[2,23,3]],square:SQUARE_DOORS.map(d=>[d.building,d.x-1,3] as [number,number,number]),gate:[[5,14,2],[0,4,4],[2,24,4]]};
   for(const [b,x,y] of objects[place])this.building(b,x,y);
   for(let x=1;x<30;x+=4){if((x*7)%3===0)this.tile(0,2,x,13);else this.tile(2,2,x,14)}
   if(place==='market'){[6,12,20,25].forEach(x=>{this.tile(1,1,x,5);this.tile(6,2,x,6)});this.label('集市摊位',9*32,4*32)}
   if(place==='square'){for(const door of SQUARE_DOORS)this.label(door.label,(door.x-1)*32,2*32);this.label('靠近门口按 E 进入',11*32,8*32)}
   else {this.tile(7,1,15,15);this.label('返回广场',14*32,14*32)}
   if(place==='gate')this.label('通往旷野',14*32,6*32);
  }
  const shade=new Graphics().rect(0,0,COLS*TILE,ROWS*TILE).fill({color:0x182a26,alpha:.035});this.scene.addChild(shade);
  // Small block-shaped lights are separate from the darkening layer and reused every frame.
  if(place==='inn'){
   for(const x of [4,10,19,26])this.addGlow(x,1);
   for(const x of [12,21])this.addGlow(x,4);
   this.addFire(27,4);
  } else if(place==='guild'||place==='clinic') {
   for(const x of (place==='clinic'?[4,9,14,19,24]:[6,12,18,24]))this.addGlow(x,1);
  } else if(place==='gate') {this.addGlow(13,5);this.addGlow(18,5);}

 }
 private addGlow(x:number,y:number){
  const g=new Graphics().rect(x*TILE+9,y*TILE+7,14,12).fill({color:0xffd27b,alpha:1});g.alpha=.05;this.glows.push(g);this.lights.addChild(g);
 }
 private addFire(x:number,y:number){
  for(let i=0;i<3;i++){
   const g=new Graphics();
   g.rect(x*TILE+10,y*TILE+16,12,8).fill(0xcf6741);
   g.rect(x*TILE+12+(i===1?1:0),y*TILE+11+(i===2?2:0),7,11).fill(0xf5b45e);
   g.rect(x*TILE+14+(i===2?1:0),y*TILE+17,4,6).fill(0xffe29c);
   g.visible=i===0;this.flames.push(g);this.lights.addChild(g);
  }
 }
 private drawActivity(v:ActorView,activity:Activity){
  if(v.activity===activity)return;v.activity=activity;const g=v.icon;g.clear();
  if(activity==='eat'){
   g.rect(1,4,10,4).fill(0x553b2e).rect(2,3,8,3).fill(0xf1d59b).rect(4,2,4,2).fill(0xa95f40);
  }else if(activity==='rest'){
   g.rect(1,1,8,2).fill(0xf7e7bc).rect(6,3,3,2).fill(0xf7e7bc).rect(3,5,3,2).fill(0xf7e7bc).rect(1,7,8,2).fill(0xf7e7bc);
  }else if(activity==='hurt'){
   g.rect(0,0,10,10).fill(0xf5e4c3).rect(4,1,2,8).fill(0xb84d45).rect(1,4,8,2).fill(0xb84d45);
  }else if(activity==='talk'){
   g.rect(0,0,12,8).fill(0xf6e7c4).rect(2,8,3,2).fill(0xf6e7c4).rect(2,3,2,2).fill(0x765a45).rect(5,3,2,2).fill(0x765a45).rect(8,3,2,2).fill(0x765a45);
  }
  g.visible=activity!=='idle';
 }
 private actor(id:string,row:number,x:number,y:number,activity:Activity,player=false,route?:readonly VisualPoint[]){
  if(!this.peopleSheet)return;let v=this.views.get(id);const tx=x*TILE,ty=y*TILE;
  if(!v){
   const sprite=new Sprite(this.texture(this.peopleSheet,0,(row%14)*TILE));
   const name=new Text({text:player?'你':id,style:{fontFamily:'Microsoft YaHei, sans-serif',fontSize:11,fill:0xfff6d9,stroke:{color:0x1d2823,width:3}}});
   const icon=new Graphics();this.actors.addChild(sprite,name,icon);
   v={sprite,name,icon,row,direction:0,frame:0,activity:'idle',phase:(row*173)%1200,visible:true,x:tx,y:ty,toX:tx,toY:ty,progress:1,duration:180,path:[],segment:0,previousRoute:route,player};this.views.set(id,v);
  }
  if(!v.visible||tx!==v.toX||ty!==v.toY){
   const remaining=v.progress<1?v.path.slice(v.segment+1):[];
   const plan=planVisualMovement({visible:v.visible,current:{x:v.x/TILE,y:v.y/TILE},previousTarget:{x:v.toX/TILE,y:v.toY/TILE},target:{x,y},remaining,previousRoute:v.previousRoute});
   if(plan.kind==='snap'){
    v.x=tx;v.y=ty;v.progress=1;v.path=[];v.segment=0;
    // Set immediately, before the next render, even when the logical target did not change.
    v.sprite.x=tx;v.sprite.y=ty;v.name.x=tx;v.name.y=ty-10-(player?10:(row%2)*10);v.icon.x=tx+22;v.icon.y=ty-13;
    if(!v.visible){v.direction=0;v.frame=0;v.sprite.texture=this.texture(this.peopleSheet,0,(row%14)*TILE);}
   }else if(plan.kind==='animate'){
    v.path=plan.points;v.segment=0;v.progress=0;v.duration=player?180:240;
   }
   v.toX=tx;v.toY=ty;
  }
  v.previousRoute=route;
  v.visible=true;v.sprite.visible=true;v.name.visible=true;this.drawActivity(v,activity);v.icon.visible=activity!=='idle';
 }
 private animate=(ticker:Ticker)=>{
  if(this.dead||!this.peopleSheet)return;
  const dt=Math.min(50,Math.max(0,ticker.deltaMS));this.elapsed+=dt;
  // Time of day follows snapshots only; smoothing and all other motion are cosmetic.
  this.night.alpha+=(this.targetNight-this.night.alpha)*Math.min(1,dt/450);
  for(let i=0;i<this.glows.length;i++)this.glows[i].alpha=.05+this.night.alpha*.7+(.025*(1+Math.sin(this.elapsed/430+i*1.7)));
  if(this.flames.length){const frame=Math.floor(this.elapsed/180)%this.flames.length;for(let i=0;i<this.flames.length;i++)this.flames[i].visible=i===frame;}
  for(const v of this.views.values()){
   if(!v.visible)continue;
   if(v.progress<1){
    v.progress=Math.min(1,v.progress+dt/v.duration);const point=sampleVisualPath(v.path,v.progress);v.x=point.x*TILE;v.y=point.y*TILE;v.segment=point.segment;
    if(Math.abs(point.dx)>Math.abs(point.dy))v.direction=point.dx<0?1:2;else if(point.dy)v.direction=point.dy<0?3:0;
   }
   const moving=v.progress<1;
   const idleBob=Math.floor((this.elapsed+v.phase)/820)%2;
   const bodyBob=moving?0:(v.activity==='rest'?0:idleBob);
   let step=0;
   if(moving)step=1+Math.floor((this.elapsed+v.phase)/120)%2;
   else if(v.activity==='eat'&&!this.paused)step=Math.floor((this.elapsed+v.phase)/480)%2;
   const frame=v.direction*3+step;
   if(v.frame!==frame){v.sprite.texture=this.texture(this.peopleSheet,frame*TILE,(v.row%14)*TILE);v.frame=frame;}
   const x=Math.round(v.x),y=Math.round(v.y);
   v.sprite.x=x;v.sprite.y=y-bodyBob;v.name.x=x;v.name.y=y-10-(v.player?10:(v.row%2)*10);
   v.icon.x=x+22;v.icon.y=y-13-(v.activity==='rest'?Math.floor((this.elapsed+v.phase)/550)%3:0);
   v.icon.alpha=v.activity==='hurt'?.72+.28*(.5+.5*Math.sin((this.elapsed+v.phase)/350)):1;
  }
 };
 update(world:World){
  if(!this.tileSheet||!this.peopleSheet)return;
  const changedScene=this.current!==world.player.place;
  if(changedScene||(world.player.place==='inn'&&this.currentBeds!==world.beds))this.makeScene(world.player.place,world.beds);
  if(changedScene)for(const v of this.views.values())v.visible=false;
  this.paused=world.paused;this.targetNight=nightOpacity(world.minute);
  const visible=new Set<string>(['__player']);this.actor('__player',13,world.player.x,world.player.y,'idle',true);
  world.npc.forEach((n:NPC,i:number)=>{if(!n.away&&n.place===world.player.place){visible.add(n.name);this.actor(n.name,i,n.x,n.y,activityOf(n),false,n.route);}});
  for(const [id,v] of this.views)if(!visible.has(id)){v.visible=false;v.sprite.visible=false;v.name.visible=false;v.icon.visible=false;}
 }
 destroy(){
  this.dead=true;if(this.app){this.app.ticker.remove(this.animate);this.app.destroy(true,{children:true});this.app=null;}
  for(const texture of this.textureCache.values())texture.destroy(false);this.textureCache.clear();this.views.clear();this.glows=[];this.flames=[];
 }
}
