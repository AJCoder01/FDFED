import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {writeFile} from 'node:fs/promises';
import {login} from './helpers';
import {routes as paths} from './routes';

for(const [role,routes] of Object.entries(paths)) test(`${role} light and dark accessibility`,async({page},info)=>{
  test.setTimeout(180000);
  await page.emulateMedia({reducedMotion:'reduce'});
  if(role==='public')await page.goto('/');else await login(page,role);
  const failures=[];
  for(const theme of ['light','dark']){
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;localStorage.setItem('servicehub_theme',theme);},theme);
    for(const path of routes){
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.setViewportSize({width:375,height:900});
      const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      if(scan.violations.length)failures.push({path,theme,violations:scan.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary,html:n.html}))}))});
      if(path===routes[0])await page.screenshot({path:info.outputPath(`${role}-${theme}.png`),fullPage:true});
    }
  }
  await writeFile(info.outputPath('accessibility-report.json'),JSON.stringify(failures,null,2));
  expect(failures.map(f=>`${f.path} (${f.theme}): ${f.violations.map(v=>v.id).join(', ')}`),'WCAG violations; see accessibility-report.json').toEqual([]);
});
