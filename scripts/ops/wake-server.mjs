import dgram from 'node:dgram';
const {WOL_HOST,WOL_PORT,WOL_MAC}=process.env,port=Number(WOL_PORT);
if(!WOL_HOST||!Number.isInteger(port)||port<1||port>65535||!/^([a-f0-9]{2}[:-]){5}[a-f0-9]{2}$/i.test(WOL_MAC??''))throw new Error('Set WOL_HOST, WOL_PORT and WOL_MAC in the ignored local server .env.');
const mac=Buffer.from(WOL_MAC.replace(/[:-]/g,''),'hex'),packet=Buffer.concat([Buffer.alloc(6,255),...Array.from({length:16},()=>mac)]),socket=dgram.createSocket('udp4');
let done=false;
const finish=error=>{if(done)return;done=true;clearTimeout(timer);socket.close();if(error){console.error('Wake packet could not be sent.');process.exitCode=1;}else console.log('Wake packet sent. Host startup and SSH availability must still be checked.');};
const timer=setTimeout(()=>finish(true),8000);
socket.once('error',()=>finish(true));socket.send(packet,port,WOL_HOST,error=>finish(error));
