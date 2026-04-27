const Redis = require('ioredis');

let client = null;

function getClient() {
  if (!client) {
    if (!process.env.REDIS_URL) {
      return null; // gracefully degrade without Redis
    }
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    client.on('error', err => console.warn('Redis error:', err.message));
  }
  return client;
}

async function get(key) {
  const r = getClient();
  if (!r) return null;
  try {
    const val = await r.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

async function set(key, value, ttlSeconds = 3600) {
  const r = getClient();
  if (!r) return;
  try {
    await r.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {}
}

async function del(key) {
  const r = getClient();
  if (!r) return;
  try {
    await r.del(key);
  } catch {}
}

async function incr(key, ttlSeconds) {
  const r = getClient();
  if (!r) return 0;
  try {
    const val = await r.incr(key);
    if (val === 1 && ttlSeconds) await r.expire(key, ttlSeconds);
    return val;
  } catch {
    return 0;
  }
}

async function ttl(key) {
  const r = getClient();
  if (!r) return -1;
  try {
    return await r.ttl(key);
  } catch {
    return -1;
  }
}

module.exports = { get, set, del, incr, ttl };
