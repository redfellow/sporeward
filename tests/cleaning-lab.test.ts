import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { expect, it } from 'vitest';
/** Execute the actual embedded lab and its test-button scenarios with a minimal DOM. */
it('runs all 17 lab assertions using the embedded shared engine, repeatably',async()=> {
 const html=readFileSync(new URL('../docs/visualizations/sporeward-cleaning-lab.html',import.meta.url),'utf8');
 const controls=new Map<string,ReturnType<typeof element>>();
 function element() {
  return {value:'',clientWidth:736,dataset:{},children:[] as unknown[],handlers:{} as Record<string,unknown>,style:{},
   append(x:unknown){this.children.push(x);},replaceChildren(){this.children=[];},setAttribute(){},addEventListener(k:string,f:unknown){this.handlers[k]=f;},
   querySelector(s:string){return controls.get(s.slice(4));},querySelectorAll(){return [];}};
 }
 for(const id of ['field','effort','mode','clock','targets','strength','state','pending','more','score','bonus','player','contact','visit','next','events','map','test','scenario','results']) controls.set(id,element());
 controls.get('effort')!.value='4';controls.get('mode')!.value='gentle';controls.get('scenario')!.value='all';
 const root=element();
 const context=vm.createContext({document:{getElementById:()=>root,createElementNS:element,createElement:element},window:{matchMedia:()=>({matches:true}),addEventListener(){}},ResizeObserver:class{observe(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},performance:{now:()=>0},setTimeout:(f:()=>void)=>f()});
 const script=Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g),m=>m[1]).join('\n');
 const marker='\n\tstate = initial();\n';expect(script).toContain(marker);
 vm.runInContext(script.replace(marker,'\n globalThis.lab = {runTests,getState:()=>state,getResults:()=>results};\n\tstate = initial();\n'),context);
 const lab=context.lab as {runTests:()=>Promise<void>;getState:()=>unknown;getResults:()=>{passed:boolean;checks:number}[]};
 await lab.runTests();const first=JSON.stringify(lab.getState());
 expect(lab.getResults()).toHaveLength(3);expect(lab.getResults().every(r=>r.passed)).toBe(true);expect(lab.getResults().reduce((n,r)=>n+r.checks,0)).toBe(17);
 await lab.runTests();expect(JSON.stringify(lab.getState())).toBe(first);
});
