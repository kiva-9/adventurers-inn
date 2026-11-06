import {isSceneBlocked} from './collision';
import type {World} from './types';
/** Old saves may contain a player cell later occupied by new scene art. */
export function repairPlayerPosition(w:World):boolean {
 const {x,y,place}=w.player;if(!isSceneBlocked(place,x,y,w.beds))return false;
 for(let radius=1;radius<=46;radius++)for(let dy=-radius;dy<=radius;dy++){
  const dx=radius-Math.abs(dy);
  for(const offsetX of dx===0?[0]:[-dx,dx]){const nx=x+offsetX,ny=y+dy;if(!isSceneBlocked(place,nx,ny,w.beds)){w.player.x=nx;w.player.y=ny;w.lastMessage='存档中的位置被新版场景占用，已移动到附近可行走处。';return true;}}
 }
 return false;
}
