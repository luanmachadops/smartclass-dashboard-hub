// Utilitários para formatação e manipulação de datas
// Criado em: 2025-01-18
// Descrição: Funções auxiliares para trabalhar com datas

/**
 * Formatar data em formato brasileiro
 */
export const formatDate = (
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  },
  locale: string = 'pt-BR'
): string => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/**
 * Formatar data e hora
 */
export const formatDateTime = (
  date: Date | string | number,
  locale: string = 'pt-BR'
): string => {
  return formatDate(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }, locale);
};

/**
 * Formatar apenas a hora
 */
export const formatTime = (
  date: Date | string | number,
  locale: string = 'pt-BR'
): string => {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit'
  }, locale);
};

/**
 * Formatar data de forma relativa (ex: "há 2 horas")
 */
export const formatRelativeTime = (
  date: Date | string | number,
  locale: string = 'pt-BR'
): string => {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }
  
  // Se for no futuro
  if (diffInSeconds < 0) {
    const absDiff = Math.abs(diffInSeconds);
    
    if (absDiff < 60) return 'em alguns segundos';
    if (absDiff < 3600) return `em ${Math.floor(absDiff / 60)} minutos`;
    if (absDiff < 86400) return `em ${Math.floor(absDiff / 3600)} horas`;
    if (absDiff < 2592000) return `em ${Math.floor(absDiff / 86400)} dias`;
    
    return formatDate(dateObj);
  }
  
  // Se for no passado
  if (diffInSeconds < 60) return 'agora mesmo';
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 2592000) return `há ${Math.floor(diffInSeconds / 86400)} dias`;
  
  return formatDate(dateObj);
};

/**
 * Formatar duração em milissegundos
 */
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Formatar duração em segundos
 */
export const formatDurationFromSeconds = (seconds: number): string => {
  return formatDuration(seconds * 1000);
};

/**
 * Obter início do dia
 */
export const startOfDay = (date: Date | string | number): Date => {
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
};

/**
 * Obter fim do dia
 */
export const endOfDay = (date: Date | string | number): Date => {
  const dateObj = new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
};

/**
 * Obter início da semana (segunda-feira)
 */
export const startOfWeek = (date: Date | string | number): Date => {
  const dateObj = new Date(date);
  const day = dateObj.getDay();
  const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para segunda-feira
  const startDate = new Date(dateObj.setDate(diff));
  return startOfDay(startDate);
};

/**
 * Obter fim da semana (domingo)
 */
export const endOfWeek = (date: Date | string | number): Date => {
  const startDate = startOfWeek(date);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return endOfDay(endDate);
};

/**
 * Obter início do mês
 */
export const startOfMonth = (date: Date | string | number): Date => {
  const dateObj = new Date(date);
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
};

/**
 * Obter fim do mês
 */
export const endOfMonth = (date: Date | string | number): Date => {
  const dateObj = new Date(date);
  return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0, 23, 59, 59, 999);
};

/**
 * Obter início do ano
 */
export const startOfYear = (date: Date | string | number): Date => {
  const dateObj = new Date(date);
  return new Date(dateObj.getFullYear(), 0, 1);
};

/**
 * Obter fim do ano
 */
export const endOfYear = (date: Date | string | number): Date => {
  const dateObj = new Date(date);
  return new Date(dateObj.getFullYear(), 11, 31, 23, 59, 59, 999);
};

/**
 * Adicionar dias a uma data
 */
export const addDays = (date: Date | string | number, days: number): Date => {
  const dateObj = new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};

/**
 * Adicionar meses a uma data
 */
export const addMonths = (date: Date | string | number, months: number): Date => {
  const dateObj = new Date(date);
  dateObj.setMonth(dateObj.getMonth() + months);
  return dateObj;
};

/**
 * Adicionar anos a uma data
 */
export const addYears = (date: Date | string | number, years: number): Date => {
  const dateObj = new Date(date);
  dateObj.setFullYear(dateObj.getFullYear() + years);
  return dateObj;
};

/**
 * Verificar se uma data é hoje
 */
export const isToday = (date: Date | string | number): boolean => {
  const dateObj = new Date(date);
  const today = new Date();
  
  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear();
};

/**
 * Verificar se uma data é ontem
 */
export const isYesterday = (date: Date | string | number): boolean => {
  const yesterday = addDays(new Date(), -1);
  return isToday(yesterday) && isToday(date);
};

/**
 * Verificar se uma data é amanhã
 */
export const isTomorrow = (date: Date | string | number): boolean => {
  const tomorrow = addDays(new Date(), 1);
  const dateObj = new Date(date);
  
  return dateObj.getDate() === tomorrow.getDate() &&
         dateObj.getMonth() === tomorrow.getMonth() &&
         dateObj.getFullYear() === tomorrow.getFullYear();
};

/**
 * Verificar se uma data está nesta semana
 */
export const isThisWeek = (date: Date | string | number): boolean => {
  const dateObj = new Date(date);
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  
  return dateObj >= weekStart && dateObj <= weekEnd;
};

/**
 * Verificar se uma data está neste mês
 */
export const isThisMonth = (date: Date | string | number): boolean => {
  const dateObj = new Date(date);
  const today = new Date();
  
  return dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear();
};

/**
 * Verificar se uma data está neste ano
 */
export const isThisYear = (date: Date | string | number): boolean => {
  const dateObj = new Date(date);
  const today = new Date();
  
  return dateObj.getFullYear() === today.getFullYear();
};

/**
 * Calcular diferença entre duas datas em dias
 */
export const diffInDays = (
  date1: Date | string | number,
  date2: Date | string | number
): number => {
  const dateObj1 = new Date(date1);
  const dateObj2 = new Date(date2);
  
  const diffTime = Math.abs(dateObj2.getTime() - dateObj1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calcular diferença entre duas datas em horas
 */
export const diffInHours = (
  date1: Date | string | number,
  date2: Date | string | number
): number => {
  const dateObj1 = new Date(date1);
  const dateObj2 = new Date(date2);
  
  const diffTime = Math.abs(dateObj2.getTime() - dateObj1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60));
};

/**
 * Calcular diferença entre duas datas em minutos
 */
export const diffInMinutes = (
  date1: Date | string | number,
  date2: Date | string | number
): number => {
  const dateObj1 = new Date(date1);
  const dateObj2 = new Date(date2);
  
  const diffTime = Math.abs(dateObj2.getTime() - dateObj1.getTime());
  return Math.ceil(diffTime / (1000 * 60));
};

/**
 * Calcular idade a partir da data de nascimento
 */
export const calculateAge = (birthDate: Date | string | number): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Obter nome do mês
 */
export const getMonthName = (
  date: Date | string | number,
  locale: string = 'pt-BR'
): string => {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString(locale, { month: 'long' });
};

/**
 * Obter nome do dia da semana
 */
export const getDayName = (
  date: Date | string | number,
  locale: string = 'pt-BR'
): string => {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString(locale, { weekday: 'long' });
};

/**
 * Formatar período (ex: "Janeiro 2024")
 */
export const formatPeriod = (
  date: Date | string | number,
  locale: string = 'pt-BR'
): string => {
  return formatDate(date, {
    month: 'long',
    year: 'numeric'
  }, locale);
};

/**
 * Formatar trimestre
 */
export const formatQuarter = (
  date: Date | string | number,
  locale: string = 'pt-BR'
): string => {
  const dateObj = new Date(date);
  const quarter = Math.floor(dateObj.getMonth() / 3) + 1;
  return `Q${quarter} ${dateObj.getFullYear()}`;
};

/**
 * Verificar se um ano é bissexto
 */
export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * Obter número de dias no mês
 */
export const getDaysInMonth = (date: Date | string | number): number => {
  const dateObj = new Date(date);
  return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
};

/**
 * Obter lista de datas entre duas datas
 */
export const getDateRange = (
  startDate: Date | string | number,
  endDate: Date | string | number
): Date[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates: Date[] = [];
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

/**
 * Formatar data para input HTML
 */
export const formatDateForInput = (date: Date | string | number): string => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Formatar datetime para input HTML
 */
export const formatDateTimeForInput = (date: Date | string | number): string => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Formatar time para input HTML
 */
export const formatTimeForInput = (date: Date | string | number): string => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

/**
 * Verificar se uma data é válida
 */
export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Converter timezone
 */
export const convertTimezone = (
  date: Date | string | number,
  timezone: string
): Date => {
  const dateObj = new Date(date);
  
  return new Date(dateObj.toLocaleString('en-US', { timeZone: timezone }));
};

/**
 * Obter timezone do usuário
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatDuration,
  formatDurationFromSeconds,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addMonths,
  addYears,
  isToday,
  isYesterday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  isThisYear,
  diffInDays,
  diffInHours,
  diffInMinutes,
  calculateAge,
  getMonthName,
  getDayName,
  formatPeriod,
  formatQuarter,
  isLeapYear,
  getDaysInMonth,
  getDateRange,
  formatDateForInput,
  formatDateTimeForInput,
  formatTimeForInput,
  isValidDate,
  convertTimezone,
  getUserTimezone
};