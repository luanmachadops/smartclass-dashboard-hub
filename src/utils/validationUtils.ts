// Utilitários para validação de dados
// Criado em: 2025-01-18
// Descrição: Funções auxiliares para validação de formulários e dados

/**
 * Validar email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar CPF
 */
export const isValidCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

/**
 * Validar CNPJ
 */
export const isValidCNPJ = (cnpj: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;
  
  return true;
};

/**
 * Validar telefone brasileiro
 */
export const isValidPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Aceita telefones com 10 ou 11 dígitos (com ou sem 9 no celular)
  return /^\d{10,11}$/.test(cleanPhone);
};

/**
 * Validar CEP
 */
export const isValidCEP = (cep: string): boolean => {
  const cleanCEP = cep.replace(/\D/g, '');
  return /^\d{8}$/.test(cleanCEP);
};

/**
 * Validar senha forte
 */
export const isStrongPassword = (password: string): boolean => {
  // Pelo menos 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

/**
 * Validar URL
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validar número
 */
export const isValidNumber = (value: any): boolean => {
  return !isNaN(value) && !isNaN(parseFloat(value));
};

/**
 * Validar número inteiro
 */
export const isValidInteger = (value: any): boolean => {
  return Number.isInteger(Number(value));
};

/**
 * Validar número positivo
 */
export const isPositiveNumber = (value: any): boolean => {
  return isValidNumber(value) && Number(value) > 0;
};

/**
 * Validar número não negativo
 */
export const isNonNegativeNumber = (value: any): boolean => {
  return isValidNumber(value) && Number(value) >= 0;
};

/**
 * Validar data
 */
export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Validar data no formato string
 */
export const isValidDateString = (dateString: string): boolean => {
  const date = new Date(dateString);
  return isValidDate(date);
};

/**
 * Validar se data é futura
 */
export const isFutureDate = (date: Date | string): boolean => {
  const dateObj = new Date(date);
  return isValidDate(dateObj) && dateObj > new Date();
};

/**
 * Validar se data é passada
 */
export const isPastDate = (date: Date | string): boolean => {
  const dateObj = new Date(date);
  return isValidDate(dateObj) && dateObj < new Date();
};

/**
 * Validar idade mínima
 */
export const isMinimumAge = (birthDate: Date | string, minimumAge: number): boolean => {
  const birth = new Date(birthDate);
  const today = new Date();
  
  if (!isValidDate(birth)) return false;
  
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= minimumAge;
  }
  
  return age >= minimumAge;
};

/**
 * Validar string não vazia
 */
export const isNonEmptyString = (value: any): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Validar comprimento mínimo
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return typeof value === 'string' && value.length >= minLength;
};

/**
 * Validar comprimento máximo
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return typeof value === 'string' && value.length <= maxLength;
};

/**
 * Validar se valor está em uma lista
 */
export const isInList = (value: any, list: any[]): boolean => {
  return list.includes(value);
};

/**
 * Validar se valor está em um range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return isValidNumber(value) && Number(value) >= min && Number(value) <= max;
};

/**
 * Validar formato de cartão de crédito
 */
export const isValidCreditCard = (cardNumber: string): boolean => {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  // Verifica se tem entre 13 e 19 dígitos
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
  
  // Algoritmo de Luhn
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i));
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * Validar código de segurança do cartão (CVV)
 */
export const isValidCVV = (cvv: string): boolean => {
  const cleanCVV = cvv.replace(/\D/g, '');
  return /^\d{3,4}$/.test(cleanCVV);
};

/**
 * Validar código de cores hexadecimal
 */
export const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Validar IP v4
 */
export const isValidIPv4 = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};

/**
 * Validar MAC Address
 */
export const isValidMACAddress = (mac: string): boolean => {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
};

/**
 * Validar JSON
 */
export const isValidJSON = (jsonString: string): boolean => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validar Base64
 */
export const isValidBase64 = (base64: string): boolean => {
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(base64) && base64.length % 4 === 0;
};

/**
 * Validar UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validar slug (URL amigável)
 */
export const isValidSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
};

/**
 * Validar nome de usuário
 */
export const isValidUsername = (username: string): boolean => {
  // Apenas letras, números, underscore e hífen, 3-20 caracteres
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validar coordenadas geográficas
 */
export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return isValidNumber(lat) && isValidNumber(lng) &&
         lat >= -90 && lat <= 90 &&
         lng >= -180 && lng <= 180;
};

/**
 * Validar arquivo por extensão
 */
export const isValidFileExtension = (filename: string, allowedExtensions: string[]): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
};

/**
 * Validar tamanho de arquivo
 */
export const isValidFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

/**
 * Validar tipo MIME
 */
export const isValidMimeType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Validar se é uma imagem
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Validar se é um documento
 */
export const isDocumentFile = (file: File): boolean => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  return documentTypes.includes(file.type);
};

/**
 * Validar múltiplos campos obrigatórios
 */
export const validateRequiredFields = (data: Record<string, any>, requiredFields: string[]): string[] => {
  const errors: string[] = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors.push(`Campo '${field}' é obrigatório`);
    }
  });
  
  return errors;
};

/**
 * Validar objeto com schema personalizado
 */
export const validateWithSchema = (
  data: Record<string, any>,
  schema: Record<string, (value: any) => boolean | string>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  Object.keys(schema).forEach(field => {
    const validator = schema[field];
    const result = validator(data[field]);
    
    if (typeof result === 'string') {
      errors[field] = result;
    } else if (result === false) {
      errors[field] = `Campo '${field}' é inválido`;
    }
  });
  
  return errors;
};

/**
 * Sanitizar string (remover caracteres perigosos)
 */
export const sanitizeString = (str: string): string => {
  return str
    .replace(/[<>"'&]/g, '')
    .trim();
};

/**
 * Sanitizar HTML básico
 */
export const sanitizeHTML = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Validar força da senha
 */
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;
  
  // Comprimento
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use pelo menos 8 caracteres');
  }
  
  // Letras minúsculas
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Inclua letras minúsculas');
  }
  
  // Letras maiúsculas
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Inclua letras maiúsculas');
  }
  
  // Números
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Inclua números');
  }
  
  // Caracteres especiais
  if (/[@$!%*?&]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Inclua caracteres especiais (@$!%*?&)');
  }
  
  return {
    score,
    feedback,
    isStrong: score >= 4
  };
};

export default {
  isValidEmail,
  isValidCPF,
  isValidCNPJ,
  isValidPhone,
  isValidCEP,
  isStrongPassword,
  isValidURL,
  isValidNumber,
  isValidInteger,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidDate,
  isValidDateString,
  isFutureDate,
  isPastDate,
  isMinimumAge,
  isNonEmptyString,
  hasMinLength,
  hasMaxLength,
  isInList,
  isInRange,
  isValidCreditCard,
  isValidCVV,
  isValidHexColor,
  isValidIPv4,
  isValidMACAddress,
  isValidJSON,
  isValidBase64,
  isValidUUID,
  isValidSlug,
  isValidUsername,
  isValidCoordinates,
  isValidFileExtension,
  isValidFileSize,
  isValidMimeType,
  isImageFile,
  isDocumentFile,
  validateRequiredFields,
  validateWithSchema,
  sanitizeString,
  sanitizeHTML,
  getPasswordStrength
};