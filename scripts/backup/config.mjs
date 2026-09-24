import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export async function loadConfig() {
  const env = {};
  if (process.env.BACKUP_CONFIG_JSON) Object.assign(env,JSON.parse(process.env.BACKUP_CONFIG_JSON));
  else if (process.env.BACKUP_ENV_FILE) {
    for (const line of (await fs.readFile(process.env.BACKUP_ENV_FILE,'utf8')).split(/\r?\n/)) {
      const m=line.match(/^([A-Z_0-9]+)=(.*)$/);
      if(m) env[m[1]]=m[2].trim().replace(/^(["'])(.*)\1$/,'$2');
    }
  }
  env.BACKUP_DIR = process.env.BACKUP_DIR || env.BACKUP_DIR;
  return env;
}
export const toolsPackage = process.env.BACKUP_TOOLS_DIR
  ? `${process.env.BACKUP_TOOLS_DIR}/package.json`
  : fileURLToPath(new URL('./package.json',import.meta.url));
