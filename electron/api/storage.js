import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

function getStorageDir() {
  return app ? app.getPath('userData') : process.cwd();
}

const CONFIG_FILE = path.join(getStorageDir(), 'config.json');
const TOKEN_FILE = path.join(getStorageDir(), 'token.json');

export async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      apiKey: 'THACO2017',
      scheduleTime: '10:30',
      scheduleTimes: ['10:30'],
      autoStart: true,
      minimizeToTray: true,
      notifyEnabled: true,
      theme: 'dark',
    };
  }
}

export async function saveConfig(configData) {
  const current = await loadConfig();
  const updated = { ...current, ...configData };
  await fs.writeFile(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

export async function loadSavedToken() {
  try {
    const data = await fs.readFile(TOKEN_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveTokenStorage(tokenData) {
  await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2), 'utf-8');
  return tokenData;
}

export function isTokenExpired(tokenData) {
  if (!tokenData || !tokenData.expires || !tokenData.token) {
    return true;
  }
  const expiryTime = new Date(tokenData.expires).getTime();
  const currentTime = Date.now();
  const BUFFER_MS = 5 * 60 * 1000;
  return currentTime + BUFFER_MS >= expiryTime;
}
