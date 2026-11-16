import {login} from './helpers';
import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import {routes} from './routes';

for (const [role, paths] of Object.entries(routes)) {
  test(`${role} pages fit desktop, tablet and phone widths`, async ({page}, info) => {
    test.setTimeout(120000);
    const errors=[], pending=new Set(), responses=[];
    page.on('pageerror', e=>errors.push(e.message));
    page.on('request', r=>{ if(r.url().includes('/api/')) pending.add(r); });
    page.on('requestfinished', r=>pending.delete(r));
    page.on('requestfailed', r=>pending.delete(r));
    page.on('response', r=>{if(r.url().includes('/api/') && r.status()>=400 && !r.url().includes('/auth/refresh')) responses.push(`${r.status()} ${r.url()}`);});
    if(role==='public') await page.goto('/'); else await login(page,role);
    const results=[];
    for(const path of paths) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect.poll(()=>pending.size).toBe(0);
      await expect(page.locator('main')).not.toBeEmpty();
      for(const width of [320,375,414,768,1440]) {
        await page.setViewportSize({width,height:900});
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
        const layout=await page.evaluate(()=>{
          const viewport=document.documentElement.clientWidth;
          const offenders=[...document.querySelectorAll('body *')].filter(el=>{
            const rect=el.getBoundingClientRect();
            if(!rect.width || !rect.height || getComputedStyle(el).visibility==='hidden') return false;
            if(rect.right<=viewport+1 && rect.left>=-1) return false;
            for(let p=el.parentElement;p && p!==document.body;p=p.parentElement){
              const s=getComputedStyle(p);
              if(['auto','scroll','hidden','clip'].includes(s.overflowX) && p.clientWidth<p.scrollWidth) return false;
            }
            return true;
          }).map(el=>({tag:el.tagName,class:el.className,text:el.textContent?.trim().slice(0,70),right:Math.round(el.getBoundingClientRect().right)})).slice(0,12);
          return {viewport,document:document.documentElement.scrollWidth,offenders};
        });
        results.push({path,width,...layout});
        if((path===paths[0]) || ((width===375 || width===1440) && (path.includes('/profile') || path==='/services/srv-1')))
          await page.screenshot({path:info.outputPath(`${role}-${paths.indexOf(path)}-${width}.png`),fullPage:true});
      }
    }
    await writeFile(info.outputPath('layout-report.json'),JSON.stringify({results,errors,responses},null,2));
    const broken=results.filter(r=>r.document>r.width+1 || r.offenders.length);
    expect(errors,'browser JavaScript errors').toEqual([]);
    expect(responses,'failed API responses').toEqual([]);
    expect(broken.map(r=>`${r.path} @ ${r.width}: document ${r.document}, ${r.offenders.length} overflowing elements`),'responsive overflow; see layout-report.json').toEqual([]);
  });
}
