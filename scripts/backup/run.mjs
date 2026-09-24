import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as Sentry from '@sentry/node';
import {loadConfig} from './config.mjs';

const monitorSlug='big-uns-nightly-submission-backup';
const monitorConfig={schedule:{type:'crontab',value:'17 6 * * *'},timezone:'UTC',checkinMargin:120,maxRuntime:35,failureIssueThreshold:1,recoveryThreshold:1};
const alertTest=process.argv.includes('--alert-test');
let checkInId, stage='configuration';
const started=Date.now();
function run(script,extra={}) {
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[fileURLToPath(new URL(script,import.meta.url))],{env:{...process.env,...extra},stdio:['ignore','pipe','ignore']});
    let output='';
    const timer=setTimeout(()=>child.kill('SIGTERM'),25*60*1000);
    child.stdout.on('data',chunk=>{output+=chunk;if(output.length>1000000)child.kill('SIGTERM');});
    child.once('error',()=>{clearTimeout(timer);reject(new Error('Backup subprocess could not start'));});
    child.once('close',code=>{clearTimeout(timer);if(code!==0)return reject(new Error('Backup subprocess failed'));try{resolve(JSON.parse(output.trim()));}catch{reject(new Error('Invalid backup result'));}});
  });
}
try {
  const config=await loadConfig();
  if (!config.SENTRY_DSN) throw new Error('Missing monitoring configuration');
  Sentry.init({dsn:config.SENTRY_DSN,environment:'backup-production',defaultIntegrations:false,sendDefaultPii:false,tracesSampleRate:0});
  if(alertTest) {
    Sentry.captureMessage('Big Uns backup alert TEST — no backup failure and no customer data',{level:'error',tags:{component:'submission-backup',test:'true'}});
    if(!await Sentry.flush(15000))throw new Error('Alert delivery timeout');
    console.log('Backup alert test sent. Confirm receipt in Sentry and email.');
  } else {
    checkInId=Sentry.captureCheckIn({monitorSlug,status:'in_progress'},monitorConfig);
    if(!await Sentry.flush(15000))throw new Error('Monitoring start timeout');
    stage='export-and-file-verification';
    const exported=await run('./export-records.mjs');
    stage='isolated-record-restore';
    const restored=await run('./verify-record-restore.mjs',{BACKUP_PREFIX:exported.remote_prefix});
    if(!exported.remote_readback_verified || !restored.all_record_values_match)throw new Error('Verification incomplete');
    stage='success-check-in';
    Sentry.captureCheckIn({checkInId,monitorSlug,status:'ok',duration:(Date.now()-started)/1000});
    if(!await Sentry.flush(15000))throw new Error('Monitoring success timeout');
    console.log(JSON.stringify({status:'verified',prefix:exported.remote_prefix,counts:exported.counts,photo_objects:exported.photo_objects,remote_readback_verified:true,record_restore_verified:true,full_supabase_restore:false}));
  }
} catch {
  // Never log raw database errors: they may include names, emails, or row contents.
  if(checkInId)Sentry.captureCheckIn({checkInId,monitorSlug,status:'error',duration:(Date.now()-started)/1000});
  Sentry.captureMessage('Big Uns scheduled submission backup failed',{level:'error',tags:{component:'submission-backup',stage}});
  await Sentry.flush(15000).catch(()=>false);
  console.error(`Backup failed at ${stage}. No backup should be treated as verified without its restore report.`);
  process.exitCode=1;
} finally { await Sentry.close(15000); }
