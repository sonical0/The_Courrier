let keyCache = null;

async function getKey() {
  if (keyCache) return keyCache;
  const raw = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("the-courrier-v1"),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  keyCache = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("the-courrier-salt-v1"),
      iterations: 100000,
      hash: "SHA-256",
    },
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return keyCache;
}

const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export async function encryptValue(plain) {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plain)
  );
  return `${toB64(iv.buffer)}.${toB64(cipher)}`;
}

export async function decryptValue(stored) {
  const dotIdx = stored.indexOf(".");
  if (dotIdx === -1) throw new Error("Invalid encrypted format");
  const ivB64 = stored.slice(0, dotIdx);
  const cipherB64 = stored.slice(dotIdx + 1);
  const key = await getKey();
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(ivB64) },
    key,
    fromB64(cipherB64)
  );
  return new TextDecoder().decode(plain);
}
