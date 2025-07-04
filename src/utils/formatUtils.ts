// Utilitários para formatação de dados
// Criado em: 2025-01-18
// Descrição: Funções auxiliares para formatação de dados diversos

/**
 * Formatar bytes em formato legível
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Formatar números com separadores de milhares
 */
export const formatNumber = (num: number, locale: string = 'pt-BR'): string => {
  return new Intl.NumberFormat(locale).format(num);
};

/**
 * Formatar moeda
 */
export const formatCurrency = (
  amount: number, 
  currency: string = 'BRL', 
  locale: string = 'pt-BR'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Formatar porcentagem
 */
export const formatPercentage = (
  value: number, 
  decimals: number = 2,
  locale: string = 'pt-BR'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Formatar telefone brasileiro
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

/**
 * Formatar CPF
 */
export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  return cpf;
};

/**
 * Formatar CNPJ
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return cnpj;
};

/**
 * Formatar CEP
 */
export const formatCEP = (cep: string): string => {
  const cleaned = cep.replace(/\D/g, '');
  
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  return cep;
};

/**
 * Truncar texto com reticências
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalizar primeira letra
 */
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Capitalizar cada palavra
 */
export const capitalizeWords = (text: string): string => {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Formatar nome próprio
 */
export const formatName = (name: string): string => {
  const prepositions = ['de', 'da', 'do', 'das', 'dos', 'e'];
  
  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (prepositions.includes(word)) {
        return word;
      }
      return capitalize(word);
    })
    .join(' ');
};

/**
 * Remover acentos
 */
export const removeAccents = (text: string): string => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Gerar slug a partir de texto
 */
export const generateSlug = (text: string): string => {
  return removeAccents(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

/**
 * Formatar tamanho de arquivo
 */
export const formatFileSize = (bytes: number): string => {
  return formatBytes(bytes);
};

/**
 * Formatar velocidade de internet
 */
export const formatSpeed = (bitsPerSecond: number): string => {
  const units = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  let value = bitsPerSecond;
  let unitIndex = 0;
  
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }
  
  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * Formatar coordenadas geográficas
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
};

/**
 * Formatar código de cores hexadecimal
 */
export const formatHexColor = (color: string): string => {
  const cleaned = color.replace('#', '');
  
  if (cleaned.length === 3) {
    return `#${cleaned.split('').map(c => c + c).join('')}`;
  }
  
  if (cleaned.length === 6) {
    return `#${cleaned}`;
  }
  
  return color;
};

/**
 * Formatar versão de software
 */
export const formatVersion = (version: string): string => {
  const parts = version.split('.');
  
  while (parts.length < 3) {
    parts.push('0');
  }
  
  return parts.slice(0, 3).join('.');
};

/**
 * Formatar hash/ID curto
 */
export const formatShortId = (id: string, length: number = 8): string => {
  return id.substring(0, length);
};

/**
 * Formatar lista de itens
 */
export const formatList = (
  items: string[], 
  separator: string = ', ', 
  lastSeparator: string = ' e '
): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(lastSeparator);
  
  const allButLast = items.slice(0, -1);
  const last = items[items.length - 1];
  
  return allButLast.join(separator) + lastSeparator + last;
};

/**
 * Formatar range de valores
 */
export const formatRange = (
  min: number, 
  max: number, 
  unit: string = '',
  locale: string = 'pt-BR'
): string => {
  const formattedMin = formatNumber(min, locale);
  const formattedMax = formatNumber(max, locale);
  
  if (min === max) {
    return `${formattedMin}${unit}`;
  }
  
  return `${formattedMin}${unit} - ${formattedMax}${unit}`;
};

/**
 * Formatar status com emoji
 */
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'active': '🟢 Ativo',
    'inactive': '🔴 Inativo',
    'pending': '🟡 Pendente',
    'success': '✅ Sucesso',
    'error': '❌ Erro',
    'warning': '⚠️ Aviso',
    'info': 'ℹ️ Info',
    'loading': '⏳ Carregando',
    'syncing': '🔄 Sincronizando',
    'paused': '⏸️ Pausado',
    'stopped': '⏹️ Parado',
    'running': '▶️ Executando'
  };
  
  return statusMap[status.toLowerCase()] || capitalize(status);
};

/**
 * Formatar prioridade
 */
export const formatPriority = (priority: string | number): string => {
  const priorityMap: Record<string, string> = {
    '1': '🔴 Alta',
    '2': '🟡 Média',
    '3': '🟢 Baixa',
    'high': '🔴 Alta',
    'medium': '🟡 Média',
    'low': '🟢 Baixa',
    'critical': '🚨 Crítica',
    'urgent': '⚡ Urgente'
  };
  
  return priorityMap[priority.toString().toLowerCase()] || capitalize(priority.toString());
};

/**
 * Formatar tipo de arquivo com ícone
 */
export const formatFileType = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const typeMap: Record<string, string> = {
    'pdf': '📄 PDF',
    'doc': '📝 Word',
    'docx': '📝 Word',
    'xls': '📊 Excel',
    'xlsx': '📊 Excel',
    'ppt': '📽️ PowerPoint',
    'pptx': '📽️ PowerPoint',
    'jpg': '🖼️ Imagem',
    'jpeg': '🖼️ Imagem',
    'png': '🖼️ Imagem',
    'gif': '🖼️ GIF',
    'mp4': '🎥 Vídeo',
    'avi': '🎥 Vídeo',
    'mov': '🎥 Vídeo',
    'mp3': '🎵 Áudio',
    'wav': '🎵 Áudio',
    'zip': '📦 Arquivo',
    'rar': '📦 Arquivo',
    'txt': '📄 Texto',
    'csv': '📊 CSV',
    'json': '⚙️ JSON',
    'xml': '⚙️ XML'
  };
  
  return typeMap[extension] || `📄 ${extension.toUpperCase()}`;
};

/**
 * Formatar duração em formato legível
 */
export const formatReadableDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Formatar score/pontuação
 */
export const formatScore = (score: number, maxScore: number = 100): string => {
  const percentage = (score / maxScore) * 100;
  
  if (percentage >= 90) return `⭐ ${score}/${maxScore} (Excelente)`;
  if (percentage >= 80) return `🌟 ${score}/${maxScore} (Muito Bom)`;
  if (percentage >= 70) return `✨ ${score}/${maxScore} (Bom)`;
  if (percentage >= 60) return `⚡ ${score}/${maxScore} (Regular)`;
  
  return `💫 ${score}/${maxScore} (Precisa Melhorar)`;
};

export default {
  formatBytes,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatPhone,
  formatCPF,
  formatCNPJ,
  formatCEP,
  truncateText,
  capitalize,
  capitalizeWords,
  formatName,
  removeAccents,
  generateSlug,
  formatFileSize,
  formatSpeed,
  formatCoordinates,
  formatHexColor,
  formatVersion,
  formatShortId,
  formatList,
  formatRange,
  formatStatus,
  formatPriority,
  formatFileType,
  formatReadableDuration,
  formatScore
};