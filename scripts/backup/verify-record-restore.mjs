// Restore an R2 record export into an isolated, in-memory PostgreSQL database.
// This script has no connection to the live database.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {loadConfig,toolsPackage} from './config.mjs';
const require = createRequire(toolsPackage);
const {S3Client,GetObjectCommand,PutObjectCommand} = require('@aws-sdk/client-s3');
const env = await loadConfig();
const prefix = process.env.BACKUP_PREFIX;
if (!/^record-exports\/[a-zA-Z0-9-]+\/$/.test(prefix)) throw new Error('Invalid backup prefix');
const s3 = new S3Client({region:'auto',endpoint:`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,credentials:{accessKeyId:env.R2_ACCESS_KEY_ID,secretAccessKey:env.R2_SECRET_ACCESS_KEY}});
async function read(file) {
  const obj = await s3.send(new GetObjectCommand({Bucket:env.R2_BUCKET,Key:prefix+file}));
  return Buffer.from(await obj.Body.transformToByteArray());
}
const manifest = JSON.parse(await read('manifest.json'));
async function verified(file) {
  const bytes = await read(file), entry = manifest.files.find(f=>f.file===file);
  if (!entry || bytes.length!==entry.bytes || createHash('sha256').update(bytes).digest('hex')!==entry.sha256) throw new Error('Checksum mismatch');
  return bytes.toString('utf8');
}
const records = JSON.parse(await verified('records.json'));
const schema = await verified('submission-schema.sql');
const tables = ['catch_upload_sessions','catch_submissions','catch_photos','catch_email_outbox','catch_review_history','drop_signups','launch_rate_limits'];
const db = new PGlite();
const counts = {};
try {
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
  await db.exec(schema);
  for (const table of tables) {
    const columns = records.columns[table].map(c=>c.column_name);
    if (columns.some(c=>! /^[a-z_]+$/.test(c))) throw new Error('Invalid column');
    const columnSql = columns.map(c=>`"${c}"`).join(',');
    const json = JSON.stringify(records.tables[table]);
    await db.query(`INSERT INTO public.${table} (${columnSql}) OVERRIDING SYSTEM VALUE SELECT ${columnSql} FROM jsonb_populate_recordset(NULL::public.${table},$1::jsonb)`,[json]);
    const result = await db.query(`SELECT count(*)::integer AS count FROM public.${table}`);
    counts[table] = result.rows[0].count;
    if (counts[table]!==records.tables[table].length) throw new Error('Restore count mismatch');
    const diff = await db.query(`WITH expected AS (SELECT * FROM jsonb_populate_recordset(NULL::public.${table},$1::jsonb)), differences AS ((SELECT * FROM public.${table} EXCEPT ALL SELECT * FROM expected) UNION ALL (SELECT * FROM expected EXCEPT ALL SELECT * FROM public.${table})) SELECT count(*)::integer AS count FROM differences`,[json]);
    if (diff.rows[0].count!==0) throw new Error('Restored record mismatch');
  }
  await db.exec("SELECT setval('public.catch_review_history_id_seq',coalesce((SELECT max(id) FROM public.catch_review_history),1),exists(SELECT 1 FROM public.catch_review_history));");
} finally { await db.close(); }
const report = {verified_at:new Date().toISOString(),source:'R2 read-back',scope:'Seven application tables restored with their migration, constraints and foreign keys into isolated PGlite',counts,all_record_values_match:true,full_supabase_restore:false};
await s3.send(new PutObjectCommand({Bucket:env.R2_BUCKET,Key:prefix+'restore-verification.json',Body:JSON.stringify(report,null,2),IfNoneMatch:'*'}));
await fs.writeFile(path.join(env.BACKUP_DIR,prefix.split('/')[1],'restore-verification.json'),JSON.stringify(report,null,2),{mode:0o600,flag:'wx'});
console.log(JSON.stringify(report));
