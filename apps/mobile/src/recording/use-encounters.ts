import {useEffect,useMemo,useRef,useState} from 'react';
import type {WorldView,EncounterRecap} from '@sporeward/protocol';
import {previewEncounters,type ContactPreview} from './encounters';
import type {Fix} from './model';
import {contactPreviews,rememberContacts} from './store';
export function useEncounters(id:string|null,fixes:Fix[],world:WorldView|null,recap:EncounterRecap|null){
 const [saved,setSaved]=useState<{id:string|null;contacts:ContactPreview[]}>({id:null,contacts:[]});
 const current=useRef(id);current.current=id;
 useEffect(()=>{let alive=true;if(id)void contactPreviews(id).then(contacts=>{if(alive)setSaved({id,contacts});}).catch(()=>{if(alive)setSaved({id,contacts:[]});});return()=>{alive=false;};},[id]);
 const known=saved.id===id?saved.contacts:[];
 const preview=useMemo(()=>previewEncounters(fixes,world,recap,Date.now(),known),[fixes,world,recap,known]);
 useEffect(()=>{
  if(!id||saved.id!==id||JSON.stringify(saved.contacts)===JSON.stringify(preview.observations))return;
  const contacts=preview.observations;
  void rememberContacts(id,contacts).then(()=>{if(current.current===id)setSaved(previous=>{
   const merged=new Map((previous.id===id?previous.contacts:[]).map(c=>[c.outbreakId,c]));
   for(const c of contacts){const old=merged.get(c.outbreakId);if(!old||c.timestamp<old.timestamp)merged.set(c.outbreakId,c);}
   return {id,contacts:[...merged.values()].sort((a,b)=>a.timestamp-b.timestamp||a.outbreakId.localeCompare(b.outbreakId))};
  });}).catch(()=>{});
 },[id,saved,preview]);
 return preview;
}
