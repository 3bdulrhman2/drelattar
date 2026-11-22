import {readFile,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
assert.ok(process.env.CLINIC_NATIVE_STATUS,'Supply disposable CLI status JSON through CLINIC_NATIVE_STATUS');
const status=JSON.parse(await readFile(process.env.CLINIC_NATIVE_STATUS,'utf8'));
assert.equal(status.runtime,'native');assert.equal(new URL(status.env.API_URL).hostname,'127.0.0.1');
for(const filename of ['.env','.env.local','.env.production','.env.production.local','.env.isolated','.env.isolated.local']){
 let present=false;try{await access(filename);present=true;}catch{}
 assert.equal(present,false,'Do not build this isolated test over real environment files: '+filename);
}
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('VITE_')&&!key.startsWith('SUPABASE_')));
env.VITE_SUPABASE_URL=status.env.API_URL;env.VITE_SUPABASE_ANON_KEY=status.env.PUBLISHABLE_KEY;
const result=spawnSync('npm',['run','build:isolated'],{env,stdio:'inherit'});
process.exit(result.status??1);
