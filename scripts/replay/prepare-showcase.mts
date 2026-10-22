import {writeFile} from 'node:fs/promises';
import {renderShowcase} from '../../apps/server/src/replay/showcase.ts';
const output=process.argv[2];if(!output)throw new Error('Provide a NEW output JSON path.');
await writeFile(output,JSON.stringify(await renderShowcase(Date.now())),{flag:'wx',mode:0o600});
console.log('Exported complete read-only visual review fixture; no world or recordings changed.');
