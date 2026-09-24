// Private operator export. Never import this module into the website.
// Requires pg and @aws-sdk/client-s3 in BACKUP_TOOLS_DIR, and sharp in the project.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash, randomUUID} from 'node:crypto';
import {loadConfig,toolsPackage} from './config.mjs';
import sharp from 'sharp';
const require = createRequire(toolsPackage);
const {Client} = require('pg');
const {S3Client, PutObjectCommand, GetObjectCommand} = require('@aws-sdk/client-s3');
const env = await loadConfig();
for (const name of ['DATABASE_PASSWORD','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','R2_ACCOUNT_ID','R2_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','BACKUP_DIR']) {
  if (!env[name]) throw new Error(`Missing ${name}`);
}
const tables = ['catch_upload_sessions','catch_submissions','catch_photos','catch_email_outbox','catch_review_history','drop_signups','launch_rate_limits'];
const db = new Client({host:'aws-0-us-west-2.pooler.supabase.com',port:5432,user:'postgres.bwurlegzpowqyzmfxxjb',database:'postgres',password:env.DATABASE_PASSWORD,ssl:{rejectUnauthorized:true,ca:await fs.readFile(new URL('./supabase-ca.crt',import.meta.url),'utf8')},connectionTimeoutMillis:20000,query_timeout:60000});
const id = new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8);
const dir = path.join(env.BACKUP_DIR,id);
await fs.mkdir(path.join(dir,'photos'),{recursive:true,mode:0o700});
const snapshot = {format:'big-uns-records-v1',created_at:new Date().toISOString(),scope:'Seven submission application tables; not a full Supabase database dump',tables:{},columns:{}};
await db.connect();
try {
  await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  for (const table of tables) {
    snapshot.tables[table] = (await db.query(`SELECT to_jsonb(t) AS row FROM public.${table} t`)).rows.map(r=>r.row);
    snapshot.columns[table] = (await db.query('SELECT column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema=\'public\' AND table_name=$1 ORDER BY ordinal_position',[table])).rows;
  }
  await db.query('COMMIT');
} finally { await db.end(); }
const manifest = {format:'big-uns-backup-v1',created_at:snapshot.created_at,scope:snapshot.scope,counts:Object.fromEntries(tables.map(t=>[t,snapshot.tables[t].length])),files:[]};
const hash = bytes=>createHash('sha256').update(bytes).digest('hex');
async function save(file,bytes,extra={}) {
  await fs.writeFile(path.join(dir,file),bytes,{mode:0o600,flag:'wx'});
  manifest.files.push({file,bytes:bytes.length,sha256:hash(bytes),...extra});
}
await save('records.json',Buffer.from(JSON.stringify(snapshot)));
await save('submission-schema.sql',await fs.readFile(new URL('./submission-schema.sql',import.meta.url)));
const paths = new Set(snapshot.tables.catch_photos.flatMap(p=>[p.original_path,p.preview_path]));
for (const storagePath of paths) {
  if (!/^[a-f0-9-]+\/(original|preview)-\d+\.(jpg|png|webp)$/.test(storagePath)) throw new Error('Unexpected photo path');
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/authenticated/catch-photos/${storagePath}`,{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`},signal:AbortSignal.timeout(60000)});
  if (!res.ok) throw new Error(`Photo download failed: HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  // Fully decode each image, not merely its header.
  const decoded = await sharp(bytes,{failOn:'error'}).raw().toBuffer({resolveWithObject:true});
  await save('photos/'+storagePath.replace('/','__'),bytes,{storage_path:storagePath,width:decoded.info.width,height:decoded.info.height});
}
const s3 = new S3Client({region:'auto',endpoint:`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,credentials:{accessKeyId:env.R2_ACCESS_KEY_ID,secretAccessKey:env.R2_SECRET_ACCESS_KEY}});
const prefix = `record-exports/${id}/`;
for (const file of manifest.files) {
  const bytes = await fs.readFile(path.join(dir,file.file));
  await s3.send(new PutObjectCommand({Bucket:env.R2_BUCKET,Key:prefix+file.file,Body:bytes,IfNoneMatch:'*',Metadata:{sha256:file.sha256}}));
  const restored = await s3.send(new GetObjectCommand({Bucket:env.R2_BUCKET,Key:prefix+file.file}));
  const actual = Buffer.from(await restored.Body.transformToByteArray());
  if (actual.length!==file.bytes || hash(actual)!==file.sha256) throw new Error('Remote backup checksum mismatch');
}
manifest.remote_readback_verified = true;
manifest.full_database_restore_verified = false;
await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2),{mode:0o600});
await s3.send(new PutObjectCommand({Bucket:env.R2_BUCKET,Key:prefix+'manifest.json',Body:JSON.stringify(manifest,null,2),IfNoneMatch:'*'}));
console.log(JSON.stringify({directory:dir,remote_prefix:prefix,counts:manifest.counts,photo_objects:paths.size,all_images_decoded:true,remote_readback_verified:true,full_database_restore_verified:false}));
