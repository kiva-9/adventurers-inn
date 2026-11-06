import {test,expect,Page} from '@playwright/test';
import {findPath} from '../../src/pathfinding';
import {isSceneBlocked} from '../../src/collision';
import type {Place} from '../../src/types';
async function walk(page:Page,place:Place,start:{x:number,y:number},end:{x:number,y:number}){const route=findPath(start,end,(x,y)=>isSceneBlocked(place,x,y,3));expect(route).not.toBeNull();let prev=start;for(const step of route!){const key=step.x>prev.x?'d':step.x<prev.x?'a':step.y>prev.y?'s':'w';await page.keyboard.press(key);await page.waitForTimeout(220);prev=step;}await page.waitForTimeout(500)}
test('从旅店步行至广场，再走到旅店门口进入',async({page})=>{await page.goto('/');await page.getByRole('button',{name:'开始新旅程'}).click();await expect(page.locator('.location-label')).toContainText('归途旅店');await walk(page,'inn',{x:5,y:7},{x:15,y:14});await page.keyboard.press('e');await expect(page.locator('.location-label')).toContainText('镇广场');await page.screenshot({path:'docs/evidence/town-square.png'});await walk(page,'square',{x:14,y:9},{x:4,y:6});await page.keyboard.press('e');await expect(page.locator('.location-label')).toContainText('归途旅店')});
