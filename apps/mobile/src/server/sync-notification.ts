import {requireOptionalNativeModule} from 'expo';
const native=requireOptionalNativeModule<{publishUpload(count:number,nextAttempt:number,uploading:boolean,active:boolean):Promise<void>}>('RecorderNotification');
export async function uploadNotification(count:number,nextAttempt:number,uploading:boolean,active:boolean){
 try{await native?.publishUpload(count,nextAttempt,uploading,active);}catch{/* Notification permission must not block saved recordings or uploads. */}
}
