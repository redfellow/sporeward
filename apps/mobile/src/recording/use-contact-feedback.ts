import {useEffect,useMemo,useRef,useState} from 'react';
import {AppState} from 'react-native';
import type {EncounterRecap,WorldView,FieldLabOffer} from '@sporeward/protocol';
import type {Activity} from './store';
import * as store from './store';
import type {Fix} from './model';
import type {ContactPreview} from './encounters';
import {ContactFeedbackController,contactEvidence} from './feedback-controller';
import {advanceContactNotice,emptyNotices,enqueueContactNotice,mergeContactEntries,scopeKey,type ContactEntry,type FeedbackScope} from './contact-feedback';

type Input={activity:Activity|null;owner:string|null;environment:string;world:WorldView|null;fixes:Fix[];observations:ContactPreview[];evidenceReady:boolean;recap:EncounterRecap|null;offer:FieldLabOffer|null;mapVisible:boolean;blocked:boolean;resetKey:number;eligibleDistance:number};
const NO_ENTRIES:ContactEntry[]=[];
export function useContactFeedback(input:Input){
 const {activity,owner,environment,world,fixes,observations,evidenceReady,recap,mapVisible,blocked,resetKey}=input;
 const [foreground,setForeground]=useState(AppState.currentState==='active');
 const [view,setView]=useState<{key:string;rows:ContactEntry[];error:string}>({key:'',rows:[],error:''});
 const [notices,setNotices]=useState(emptyNotices);
 const scope=useMemo<FeedbackScope|null>(()=>activity&&owner&&world?{owner,activity:activity.id,environment,world:world.worldStartedAt}:null,[activity?.id,owner,environment,world?.worldStartedAt]);
 const key=scope?scopeKey(scope):'',allowed=foreground&&mapVisible&&!blocked&&activity?.status==='recording';
 const identity=`${owner}|${environment}|${resetKey}`;
 const live=useRef({key,identity,allowed});live.current={key,identity,allowed};
 const session=useRef<ContactFeedbackController|null>(null),lastScope=useRef<FeedbackScope|null>(null);
 const entries=useMemo(()=>contactEvidence(world,observations,fixes,activity?.id,input.offer),[world,observations,fixes,activity?.id,input.offer]);
 const latest=fixes.at(-1)?.timestamp??0;
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>setForeground(state==='active'));return()=>sub.remove();},[]);
 useEffect(()=>{lastScope.current=null;},[identity]);
 useEffect(()=>{
  setNotices(emptyNotices());setView({key,rows:[],error:''});
  if(!scope){session.current=null;return;}
  lastScope.current=scope;
  const valid=()=>live.current.key===key&&live.current.identity===identity;
  const controller=new ContactFeedbackController(scope.activity,{load:()=>store.contactFeedback(scope),save:rows=>store.rememberContactFeedback(scope,rows)},rows=>{
   if(valid())setView({key,rows,error:''});
  },rows=>{if(valid()&&live.current.allowed)setNotices(previous=>enqueueContactNotice(previous,rows,Date.now()));});
  session.current=controller;
  return()=>{controller.dispose();if(session.current===controller)session.current=null;};
 },[key,identity]);
 useEffect(()=>{
  const controller=session.current;if(!controller)return;
  controller.gate(allowed,Date.now());
  if(!allowed)setNotices(previous=>previous.active||previous.pending?emptyNotices():previous);
  if(!evidenceReady)return;
  void controller.update({entries,latestFix:latest,worldReady:!!world,recap,now:Date.now()}).catch(()=>{
   if(live.current.key===key&&live.current.identity===identity)setView(previous=>({key,rows:previous.key===key?previous.rows:[],error:'Contact log is unavailable. Your GPS recording is unaffected.'}));
  });
 },[key,identity,allowed,entries,latest,evidenceReady,recap,!!world]);
 // Finished outings keep the standard recap UI. Reconcile this session's saved log quietly.
 useEffect(()=>{
  const previous=lastScope.current;
  if(activity||!previous||previous.owner!==owner||previous.environment!==environment||previous.world!==world?.worldStartedAt||recap?.activityId!==previous.activity)return;
  void store.contactFeedback(previous).then(async rows=>{
   if(live.current.identity!==identity)return;
   const reconciled=mergeContactEntries(rows,[],recap,previous.activity);
   if(JSON.stringify(rows)!==JSON.stringify(reconciled))await store.rememberContactFeedback(previous,reconciled);
  }).catch(()=>{});
 },[activity?.id,owner,environment,world?.worldStartedAt,recap,identity]);
 useEffect(()=>{
  const deadline=notices.active?.at??notices.pending?.at;if(deadline===undefined)return;
  const timer=setTimeout(()=>setNotices(previous=>advanceContactNotice(previous,Date.now())),Math.max(0,deadline-Date.now()));
  return()=>clearTimeout(timer);
 },[notices]);
 const rows=key&&view.key===key?view.rows:NO_ENTRIES;
 return {rows,qualified:input.eligibleDistance>=500,notice:allowed&&view.key===key?notices.active:null,status:view.key===key&&view.error?view.error:!world?'Contact information unavailable until a world snapshot is loaded. Your recording is saved.':!key?'Contact information is loading for this outing.':!rows.length?'No contacts recorded yet on this outing.':''};
}
