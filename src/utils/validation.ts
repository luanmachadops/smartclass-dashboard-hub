import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

// Mensagens de erro personalizadas em português
const errorMessages = {
  required: 'Este campo é obrigatório',
  email: 'Digite um email válido',
  minLength: (min: number) => `Deve ter pelo menos ${min} caracteres`,
  maxLength: (max: number) => `Deve ter no máximo ${max} caracteres`,
  password: 'A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número',
  phone: 'Digite um telefone válido (formato: (11) 99999-9999)',
  cpf: 'Digite um CPF válido',
  cnpj: 'Digite um CNPJ válido',
  cep: 'Digite um CEP válido (formato: 12345-678)',
  date: 'Digite uma data válida',
  url: 'Digite uma URL válida',
  number: 'Digite um número válido',
  positive: 'O valor deve ser positivo',
  integer: 'Digite um número inteiro',
};

// Configuração personalizada do Zod
const customZod = z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === 'string') {
        return { message: errorMessages.required };
      }
      break;
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: errorMessages.minLength(issue.minimum as number) };
      }
      break;
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: errorMessages.maxLength(issue.maximum as number) };
      }
      break;
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        return { message: errorMessages.email };
      }
      if (issue.validation === 'url') {
        return { message: errorMessages.url };
      }
      break;
  }
  return { message: ctx.defaultError };
});

// Validadores customizados
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
const cepRegex = /^\d{5}-\d{3}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

// Função para validar CPF
function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  
  return remainder === parseInt(cleanCPF.charAt(10));
}

// Função para validar CNPJ
function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14 || /^(\d)\1{13}$/.test(cleanCNPJ)) {
    return false;
  }
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return digit2 === parseInt(cleanCNPJ.charAt(13));
}

// Schemas de validação comuns
export const commonSchemas = {
  email: z.string().email(errorMessages.email),
  
  password: z.string()
    .min(8, errorMessages.minLength(8))
    .regex(passwordRegex, errorMessages.password),
  
  phone: z.string()
    .regex(phoneRegex, errorMessages.phone),
  
  cpf: z.string()
    .regex(cpfRegex, errorMessages.cpf)
    .refine(isValidCPF, errorMessages.cpf),
  
  cnpj: z.string()
    .regex(cnpjRegex, errorMessages.cnpj)
    .refine(isValidCNPJ, errorMessages.cnpj),
  
  cep: z.string()
    .regex(cepRegex, errorMessages.cep),
  
  name: z.string()
    .min(2, errorMessages.minLength(2))
    .max(100, errorMessages.maxLength(100)),
  
  url: z.string().url(errorMessages.url).optional().or(z.literal('')),
  
  positiveNumber: z.number()
    .positive(errorMessages.positive),
  
  currency: z.string()
    .regex(/^R\$\s\d{1,3}(\.\d{3})*(,\d{2})?$/, 'Digite um valor monetário válido (ex: R$ 1.000,00)'),
  
  date: z.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Digite uma data válida (DD/MM/AAAA)'),
};

// Schema para login
export const loginSchema = z.object({
  email: commonSchemas.email,
  password: z.string().min(1, errorMessages.required),
});

// Schema para registro
export const registerSchema = z.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
  confirmPassword: z.string(),
  name: commonSchemas.name,
  phone: commonSchemas.phone.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

// Schema para aluno
export const alunoSchema = z.object({
  nome: commonSchemas.name,
  email: commonSchemas.email,
  telefone: commonSchemas.phone,
  cpf: commonSchemas.cpf,
  data_nascimento: commonSchemas.date,
  endereco: z.string().min(10, 'Digite um endereço completo'),
  cep: commonSchemas.cep,
  responsavel_nome: commonSchemas.name.optional(),
  responsavel_telefone: commonSchemas.phone.optional(),
  observacoes: z.string().max(500, errorMessages.maxLength(500)).optional(),
});

// Schema para professor
export const professorSchema = z.object({
  nome: commonSchemas.name,
  email: commonSchemas.email,
  telefone: commonSchemas.phone,
  cpf: commonSchemas.cpf,
  especialidade: z.string().min(2, 'Digite a especialidade'),
  experiencia: z.string().min(10, 'Descreva a experiência profissional'),
  valor_hora: commonSchemas.currency,
});

// Schema para curso
export const cursoSchema = z.object({
  nome: commonSchemas.name,
  descricao: z.string().min(20, 'Digite uma descrição detalhada'),
  duracao_meses: z.number().min(1, 'Duração deve ser de pelo menos 1 mês'),
  valor_mensal: commonSchemas.currency,
  nivel: z.enum(['iniciante', 'intermediario', 'avancado'], {
    errorMap: () => ({ message: 'Selecione um nível válido' })
  }),
  idade_minima: z.number().min(3, 'Idade mínima deve ser pelo menos 3 anos'),
  idade_maxima: z.number().max(100, 'Idade máxima deve ser no máximo 100 anos'),
}).refine((data) => data.idade_minima <= data.idade_maxima, {
  message: 'Idade mínima deve ser menor que a máxima',
  path: ['idade_maxima'],
});

// Schema para turma
export const turmaSchema = z.object({
  nome: commonSchemas.name,
  curso_id: z.string().min(1, 'Selecione um curso'),
  professor_id: z.string().min(1, 'Selecione um professor'),
  horario: z.string().regex(/^\d{2}:\d{2}$/, 'Digite um horário válido (HH:MM)'),
  dia_semana: z.enum(['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'], {
    errorMap: () => ({ message: 'Selecione um dia da semana válido' })
  }),
  vagas_total: z.number().min(1, 'Deve ter pelo menos 1 vaga'),
  data_inicio: commonSchemas.date,
  data_fim: commonSchemas.date,
}).refine((data) => {
  const inicio = new Date(data.data_inicio.split('/').reverse().join('-'));
  const fim = new Date(data.data_fim.split('/').reverse().join('-'));
  return inicio < fim;
}, {
  message: 'Data de início deve ser anterior à data de fim',
  path: ['data_fim'],
});

// Função para validar formulário e exibir erros
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      
      // Exibir toast com primeiro erro
      const firstError = error.errors[0];
      toast({
        title: 'Erro de validação',
        description: firstError.message,
        variant: 'destructive',
      });
      
      return { success: false, errors };
    }
    
    return { success: false, errors: { general: 'Erro de validação desconhecido' } };
  }
}

// Função para validar campo individual
export function validateField<T>(schema: z.ZodSchema<T>, value: unknown): {
  success: boolean;
  error?: string;
} {
  try {
    schema.parse(value);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message };
    }
    return { success: false, error: 'Erro de validação' };
  }
}

// Hook para validação em tempo real
export function useFormValidation<T>(schema: z.ZodSchema<T>) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  
  const validateField = React.useCallback((name: string, value: unknown) => {
    try {
      // Validar apenas o campo específico
      const fieldSchema = schema.shape?.[name as keyof typeof schema.shape];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({
          ...prev,
          [name]: error.errors[0]?.message || 'Erro de validação'
        }));
      }
    }
  }, [schema]);
  
  const validateForm = React.useCallback((data: unknown) => {
    const result = validateForm(schema, data);
    if (!result.success && result.errors) {
      setErrors(result.errors);
    } else {
      setErrors({});
    }
    return result;
  }, [schema]);
  
  const clearErrors = React.useCallback(() => {
    setErrors({});
  }, []);
  
  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0
  };
}

export { z };