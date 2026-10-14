import { createHash, randomUUID } from 'node:crypto';
import { mkdir,readFile,writeFile,link,unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { activityReceipt,type ActivityChunk,type ActivityReceipt } from '@sporeward/protocol';
export class UploadConflict extends Error {}
export class UploadIncomplete extends Error {}
/** Immutable atomic files make retries safe across concurrent requests and restarts. */
export class ActivityStore {
 constructor(private root:string,private owner:string,private now:()=>number=Date.now) {}
 private directory(id:string) {return join(this.root,createHash('sha256').update(this.owner+'\0'+id).digest('hex'));}
 private async immutable(path:string,value:unknown) {
  const content=JSON.stringify(value),temporary=path+'.'+randomUUID()+'.tmp';await writeFile(temporary,content,{mode:0o600});
  try {await link(temporary,path);}catch(e) {
   if((e as NodeJS.ErrnoException).code!=='EEXIST') throw e;
   if(await readFile(path,'utf8')!==content) throw new UploadConflict('This activity already has different uploaded data.');
  }finally{await unlink(temporary);}
 }
 async put(id:string,index:number,batch:ActivityChunk) {
  const dir=this.directory(id);await mkdir(dir,{recursive:true,mode:0o700});
  await this.immutable(join(dir,'manifest.json'),{activity:batch.activity,totalFixes:batch.totalFixes,chunkCount:batch.chunkCount});
  await this.immutable(join(dir,`chunk-${index}.json`),batch.fixes);
 }
 async read(id:string):Promise<{activity:ActivityChunk['activity'];fixes:ActivityChunk['fixes']}> {
  const dir=this.directory(id);
  let manifest:Omit<ActivityChunk,'fixes'>;
  try{manifest=JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')throw new UploadIncomplete('Upload batches first.');throw e;}
  const fixes:ActivityChunk['fixes']=[];
  for(let i=0;i<manifest.chunkCount;i++) {
   try{fixes.push(...JSON.parse(await readFile(join(dir,`chunk-${i}.json`),'utf8')));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')throw new UploadIncomplete('Some upload batches are missing.');throw e;}
  }
  if(fixes.length!==manifest.totalFixes)throw new UploadIncomplete('Some GPS fixes are missing.');
  return {activity:manifest.activity,fixes};
 }
 async finish(id:string):Promise<ActivityReceipt> {
  const dir=this.directory(id);
  try{return JSON.parse(await readFile(join(dir,'receipt.json'),'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  const {activity,fixes}=await this.read(id);
  const receipt=activityReceipt(activity,fixes,this.now());
  // Concurrent completion keeps the first persisted receipt, including its timestamp.
  try{await this.immutable(join(dir,'receipt.json'),receipt);}catch(e){if(!(e instanceof UploadConflict))throw e;}
  return JSON.parse(await readFile(join(dir,'receipt.json'),'utf8'));
 }
}
