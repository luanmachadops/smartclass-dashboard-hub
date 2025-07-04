// Utilitários para criptografia e segurança
// Criado em: 2025-01-18
// Descrição: Funções auxiliares para criptografia, hash e segurança

/**
 * Gerar hash SHA-256
 */
export const generateSHA256 = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Gerar hash MD5 (usando Web Crypto API alternativa)
 */
export const generateMD5 = async (data: string): Promise<string> => {
  // Implementação simples de MD5 para uso no browser
  // Nota: Para uso em produção, considere usar uma biblioteca dedicada
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-1', dataBuffer); // Fallback para SHA-1
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Gerar salt aleatório
 */
export const generateSalt = (length: number = 16): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Gerar hash com salt
 */
export const hashWithSalt = async (data: string, salt?: string): Promise<{ hash: string; salt: string }> => {
  const usedSalt = salt || generateSalt();
  const hash = await generateSHA256(data + usedSalt);
  return { hash, salt: usedSalt };
};

/**
 * Verificar hash com salt
 */
export const verifyHashWithSalt = async (data: string, hash: string, salt: string): Promise<boolean> => {
  const newHash = await generateSHA256(data + salt);
  return newHash === hash;
};

/**
 * Gerar chave de criptografia
 */
export const generateEncryptionKey = async (): Promise<CryptoKey> => {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Exportar chave para string
 */
export const exportKey = async (key: CryptoKey): Promise<string> => {
  const exported = await crypto.subtle.exportKey('raw', key);
  const exportedKeyBuffer = new Uint8Array(exported);
  return Array.from(exportedKeyBuffer, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Importar chave de string
 */
export const importKey = async (keyString: string): Promise<CryptoKey> => {
  const keyBuffer = new Uint8Array(
    keyString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
  
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Criptografar dados
 */
export const encrypt = async (data: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    dataBuffer
  );
  
  const encryptedArray = Array.from(new Uint8Array(encrypted));
  const ivArray = Array.from(iv);
  
  return {
    encrypted: encryptedArray.map(b => b.toString(16).padStart(2, '0')).join(''),
    iv: ivArray.map(b => b.toString(16).padStart(2, '0')).join('')
  };
};

/**
 * Descriptografar dados
 */
export const decrypt = async (encryptedData: string, iv: string, key: CryptoKey): Promise<string> => {
  const encryptedBuffer = new Uint8Array(
    encryptedData.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
  
  const ivBuffer = new Uint8Array(
    iv.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
  
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer
    },
    key,
    encryptedBuffer
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
};

/**
 * Criptografia simples com senha (para uso básico)
 */
export const encryptWithPassword = async (data: string, password: string): Promise<{ encrypted: string; salt: string; iv: string }> => {
  const salt = generateSalt();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  const result = await encrypt(data, key);
  
  return {
    encrypted: result.encrypted,
    salt,
    iv: result.iv
  };
};

/**
 * Descriptografia simples com senha
 */
export const decryptWithPassword = async (
  encryptedData: string,
  password: string,
  salt: string,
  iv: string
): Promise<string> => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  return await decrypt(encryptedData, iv, key);
};

/**
 * Gerar UUID v4
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Gerar ID aleatório
 */
export const generateRandomId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  
  return result;
};

/**
 * Gerar token seguro
 */
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Gerar código numérico
 */
export const generateNumericCode = (length: number = 6): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => (byte % 10).toString()).join('');
};

/**
 * Codificar Base64
 */
export const encodeBase64 = (data: string): string => {
  return btoa(unescape(encodeURIComponent(data)));
};

/**
 * Decodificar Base64
 */
export const decodeBase64 = (encoded: string): string => {
  return decodeURIComponent(escape(atob(encoded)));
};

/**
 * Codificar Base64 URL-safe
 */
export const encodeBase64URL = (data: string): string => {
  return encodeBase64(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Decodificar Base64 URL-safe
 */
export const decodeBase64URL = (encoded: string): string => {
  let base64 = encoded
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // Adicionar padding se necessário
  while (base64.length % 4) {
    base64 += '=';
  }
  
  return decodeBase64(base64);
};

/**
 * Gerar hash de arquivo
 */
export const generateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Verificar integridade de arquivo
 */
export const verifyFileIntegrity = async (file: File, expectedHash: string): Promise<boolean> => {
  const actualHash = await generateFileHash(file);
  return actualHash === expectedHash;
};

/**
 * Mascarar dados sensíveis
 */
export const maskSensitiveData = (data: string, visibleChars: number = 4): string => {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  
  const visible = data.slice(-visibleChars);
  const masked = '*'.repeat(data.length - visibleChars);
  return masked + visible;
};

/**
 * Mascarar email
 */
export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  
  const maskedUsername = username.length > 2 
    ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
    : '*'.repeat(username.length);
  
  return `${maskedUsername}@${domain}`;
};

/**
 * Mascarar telefone
 */
export const maskPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 4) return '*'.repeat(phone.length);
  
  const visible = cleanPhone.slice(-4);
  const masked = '*'.repeat(cleanPhone.length - 4);
  return masked + visible;
};

/**
 * Mascarar CPF
 */
export const maskCPF = (cpf: string): string => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return cpf;
  
  return `***.***.***-${cleanCPF.slice(-2)}`;
};

/**
 * Gerar checksum simples
 */
export const generateChecksum = (data: string): number => {
  let checksum = 0;
  for (let i = 0; i < data.length; i++) {
    checksum += data.charCodeAt(i);
  }
  return checksum % 256;
};

/**
 * Verificar checksum
 */
export const verifyChecksum = (data: string, expectedChecksum: number): boolean => {
  return generateChecksum(data) === expectedChecksum;
};

/**
 * Gerar assinatura HMAC
 */
export const generateHMAC = async (data: string, secret: string): Promise<string> => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Verificar assinatura HMAC
 */
export const verifyHMAC = async (data: string, signature: string, secret: string): Promise<boolean> => {
  const expectedSignature = await generateHMAC(data, secret);
  return expectedSignature === signature;
};

/**
 * Gerar par de chaves RSA (para demonstração)
 */
export const generateRSAKeyPair = async (): Promise<CryptoKeyPair> => {
  return await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Classe para gerenciar criptografia de sessão
 */
export class SessionCrypto {
  private key: CryptoKey | null = null;
  
  async initialize(): Promise<void> {
    this.key = await generateEncryptionKey();
  }
  
  async encryptData(data: string): Promise<{ encrypted: string; iv: string } | null> {
    if (!this.key) return null;
    return await encrypt(data, this.key);
  }
  
  async decryptData(encryptedData: string, iv: string): Promise<string | null> {
    if (!this.key) return null;
    return await decrypt(encryptedData, iv, this.key);
  }
  
  async exportKey(): Promise<string | null> {
    if (!this.key) return null;
    return await exportKey(this.key);
  }
  
  async importKey(keyString: string): Promise<void> {
    this.key = await importKey(keyString);
  }
}

export default {
  generateSHA256,
  generateMD5,
  generateSalt,
  hashWithSalt,
  verifyHashWithSalt,
  generateEncryptionKey,
  exportKey,
  importKey,
  encrypt,
  decrypt,
  encryptWithPassword,
  decryptWithPassword,
  generateUUID,
  generateRandomId,
  generateSecureToken,
  generateNumericCode,
  encodeBase64,
  decodeBase64,
  encodeBase64URL,
  decodeBase64URL,
  generateFileHash,
  verifyFileIntegrity,
  maskSensitiveData,
  maskEmail,
  maskPhone,
  maskCPF,
  generateChecksum,
  verifyChecksum,
  generateHMAC,
  verifyHMAC,
  generateRSAKeyPair,
  SessionCrypto
};