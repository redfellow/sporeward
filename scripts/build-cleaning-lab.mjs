import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
const file = new URL('../docs/visualizations/sporeward-cleaning-lab.html', import.meta.url);
const start = '<!-- shared-engine:start -->', end = '<!-- shared-engine:end -->';
const built = await build({entryPoints:[new URL('../packages/game/src/index.ts',import.meta.url).pathname],bundle:true,format:'iife',globalName:'SporewardEngine',minify:true,target:'es2022',write:false});
const embedded = `${start}\n<script>\n${built.outputFiles[0].text.trim()}\n</script>\n${end}`;
const source = await readFile(file,'utf8');
const first=source.indexOf(start),last=source.indexOf(end);
if(first<0||last<first) throw new Error('Shared engine markers are missing from the lab.');
const output=source.slice(0,first)+embedded+source.slice(last+end.length);
if(process.argv.includes('--check')) {
 if(output!==source) throw new Error('Cleaning lab engine is stale. Run npm run build:lab.');
 console.log('Cleaning lab uses the current shared engine.');
} else {await writeFile(file,output);console.log('Updated cleaning lab from packages/game.');}
