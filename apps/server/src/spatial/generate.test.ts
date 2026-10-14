import {describe,it,expect} from 'vitest';
import {loadTampereAccess} from './tampere.ts';
import {generateOutbreaks} from './generate.ts';
import {cellKey,neighbours,publicAccess} from './access.ts';
describe('accessible Tampere spawns',()=>{
 it('reproduces twenty connected, distinct five-cell outbreaks without occupied neighbours',async()=>{
  const {cells}=await loadTampereAccess(),available=new Set(cells.map(cellKey));
  const outbreaks=generateOutbreaks(cells,73,20);expect(generateOutbreaks(cells,73,20)).toEqual(outbreaks);
  expect(generateOutbreaks(cells,74,20)).not.toEqual(outbreaks);
  const owners=new Map<string,string>();
  for(const o of outbreaks){expect(o.cells).toHaveLength(5);const reached=new Set([cellKey(o.cells[0])]);
   for(let i=0;i<5;i++)for(const c of o.cells)if(neighbours(c).some(n=>reached.has(cellKey(n))))reached.add(cellKey(c));
   expect(reached.size).toBe(5);
   for(const c of o.cells){expect(available.has(cellKey(c))).toBe(true);expect(owners.has(cellKey(c))).toBe(false);owners.set(cellKey(c),o.id);}
  }
  for(const o of outbreaks)for(const c of o.cells)for(const n of neighbours(c))expect([undefined,o.id]).toContain(owners.get(cellKey(n)));
 });
 it('excludes private access and routes closed to both supported modes',()=>{
  const way={id:1,tags:{highway:'path'},geometry:[]};
  expect(publicAccess({...way,tags:{...way.tags,access:'private'}})).toBe(false);
  expect(publicAccess({...way,tags:{...way.tags,foot:'no',bicycle:'no'}})).toBe(false);
  expect(publicAccess({...way,tags:{...way.tags,foot:'yes',bicycle:'no'}})).toBe(true);
 });
});
