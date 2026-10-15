/** Shared by the API and private provisioning commands; never log the result. */
export function databaseConnection(env:Record<string,string|undefined>=process.env){
 if(env.DATABASE_URL)return env.DATABASE_URL;
 if(!env.DATABASE_HOST)return undefined;
 if(!env.DATABASE_PASSWORD)throw new Error('DATABASE_PASSWORD is required.');
 const url=new URL('postgresql://localhost');url.hostname=env.DATABASE_HOST;url.port=env.DATABASE_PORT??'5432';url.username=env.DATABASE_USER??'sporeward';url.password=env.DATABASE_PASSWORD;url.pathname='/'+encodeURIComponent(env.DATABASE_NAME??'sporeward');return url.toString();
}
