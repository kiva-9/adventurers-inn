import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';

async function exported(p:Page){
 const download=p.waitForEvent('download');
 await p.getByRole('button',{name:'导出 JSON'}).click();
 const filename=await (await download).path();
 if(!filename) throw new Error('无法读取导出的存档');
 return JSON.parse(await readFile(filename,'utf8'));
}
test('旧档窗格迁移后，真实键盘无法穿窗但可离开',async({page:p})=>{
 await p.goto('/');
 await p.getByRole('button',{name:'开始新旅程'}).click();
 await p.getByRole('button',{name:'▣ 存档管理'}).click();
 const legacy=await exported(p);
 legacy.player={place:'clinic',x:4,y:1};
 await p.locator('input[type=file]').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});
 await expect(p.locator('.location-label')).toContainText('诊所');
 await p.getByRole('button',{name:'▣ 存档管理'}).click();
 const migrated=await exported(p);
 expect(migrated.player).toEqual({place:'clinic',x:3,y:1});
 const normalize=(w:any)=>{const copy=structuredClone(w);delete copy.player;delete copy.lastMessage;delete copy.paused;return copy};
 expect(normalize(migrated)).toEqual(normalize(legacy));
 await p.getByRole('button',{name:'关闭',exact:true}).click();
 await p.keyboard.press('ArrowRight');
 await p.waitForTimeout(250);
 await p.getByRole('button',{name:'▣ 存档管理'}).click();
 expect((await exported(p)).player).toEqual({place:'clinic',x:3,y:1});
 await p.getByRole('button',{name:'关闭',exact:true}).click();
 await p.keyboard.press('ArrowDown');await p.waitForTimeout(250);
 await p.keyboard.press('ArrowRight');await p.waitForTimeout(250);
 await p.getByRole('button',{name:'▣ 存档管理'}).click();
 expect((await exported(p)).player).toEqual({place:'clinic',x:4,y:2});
});
