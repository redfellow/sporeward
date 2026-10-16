import {Pool} from 'pg';
import {tampereWorldFixtures} from '../../apps/server/src/spatial/tampere.ts';
import {resizeOutbreak} from '../../apps/server/src/spatial/resize.ts';
import {cellKey} from '../../apps/server/src/spatial/access.ts';
const url=process.env.DATABASE_URL;if(!url)throw new Error('Use the isolated replay DATABASE_URL. This check only runs read-only spatial queries.');
const pool=new Pool({connectionString:url,max:1,connectionTimeoutMillis:8000});let checked=0;
try{
 for(let seed=1;seed<=10;seed++){
  const {fixtures,access}=await tampereWorldFixtures(seed,20);
  for(const size of [5.01,5.25,5.75,6,7.5,6.25,4.5,3.125,.5]){
   for(let i=0;i<fixtures.length;i++){
    const occupied=new Set(fixtures.filter((_,j)=>j!==i).flatMap(f=>f.cells.map(cellKey)));
    fixtures[i]=resizeOutbreak(fixtures[i],size,access.cells,occupied);
   }
   const shapes=fixtures.map(f=>({id:f.id,shape:{type:'Polygon',coordinates:[[...f.ring,f.ring[0]]]}}));
   const result=await pool.query(`WITH shapes AS (SELECT p.id,ST_SetSRID(ST_GeomFromGeoJSON(p.shape::text),4326) AS g FROM jsonb_to_recordset($1::jsonb) AS p(id text,shape jsonb)),
    bad AS (SELECT a.id FROM shapes a JOIN shapes b ON a.id<b.id AND a.g&&b.g WHERE ST_Area(ST_Transform(ST_Intersection(a.g,b.g),32635))>0.01)
    SELECT (SELECT count(*) FROM shapes WHERE NOT ST_IsValid(g)) AS invalid,(SELECT count(*) FROM bad) AS overlaps`,[JSON.stringify(shapes)]);
   if(Number(result.rows[0].invalid)||Number(result.rows[0].overlaps))throw new Error('Invalid/overlapping contours: seed '+seed+', size '+size+' '+JSON.stringify(result.rows[0]));checked+=shapes.length;
  }
 }
 console.log(JSON.stringify({checked,valid:true,overlapToleranceSquareMetres:.01}));
}finally{await pool.end();}
