/**
 * Schemas de validação usando Zod
 * Centraliza todas as validações de dados da aplicação
 */

import { z } from 'zod';
import { authLogger } from '../services/logger';

// Tipos de usuário permitidos
export const USER_TYPES = ['diretor', 'professor', 'aluno'] as const;
export type UserType = typeof USER_TYPES[number];

// Validações customizadas
const passwordValidation = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial');

const emailValidation = z
  .string()
  .email('Email inválido')
  .toLowerCase()
  .transform(email => email.trim());

const nameValidation = z
  .string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome deve ter no máximo 100 caracteres')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
  .transform(name => name.trim().replace(/\s+/g, ' '));

const schoolNameValidation = z
  .string()
  .min(3, 'Nome da escola deve ter pelo menos 3 caracteres')
  .max(200, 'Nome da escola deve ter no máximo 200 caracteres')
  .transform(name => name.trim().replace(/\s+/g, ' '));

const phoneValidation = z
  .string()
  .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, 'Telefone inválido')
  .transform(phone => phone.replace(/\D/g, ''));

// Schema para validação de email
export const emailSchema = emailValidation;

// Schema para validação de senha
export const passwordSchema = passwordValidation;

// Schema para validação de nome
export const nameSchema = nameValidation;

// Schema para registro de usuário
export const registerSchema = z.object({
  email: emailValidation,
  password: passwordValidation,
  confirmPassword: z.string(),
  directorName: nameValidation,
  schoolName: schoolNameValidation,
  phone: phoneValidation.optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Você deve aceitar os termos de uso'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
})

// Schema para login
export const loginSchema = z.object({
  email: emailValidation,
  password: z.string().min(1, 'Senha é obrigatória')
})

// Schema para convite de usuário
export const inviteUserSchema = z.object({
  email: emailValidation,
  nomeCompleto: nameValidation,
  tipoUsuario: z.enum(USER_TYPES, {
    errorMap: () => ({ message: 'Tipo de usuário inválido' })
  }),
  schoolId: z.string().uuid('ID da escola inválido'),
  phone: phoneValidation.optional(),
  observacoes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional()
})

// Schema para dados de aluno
export const alunoSchema = z.object({
  nome: nameSchema,
  email: emailSchema.optional(),
  telefone: z.string()
    .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, 'Telefone inválido')
    .optional(),
  dataNascimento: z.string().optional(),
  turmaId: z.string().uuid('ID da turma inválido').optional(),
  responsavel: z.object({
    nome: nameSchema,
    telefone: z.string()
      .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, 'Telefone do responsável inválido'),
    email: emailSchema.optional()
  }).optional()
})

// Schema para dados de professor
export const professorSchema = z.object({
  nome: nameSchema,
  email: emailSchema,
  telefone: z.string()
    .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, 'Telefone inválido')
    .optional(),
  especialidade: z.string().min(2, 'Especialidade deve ter pelo menos 2 caracteres').optional(),
  salario: z.number().positive('Salário deve ser positivo').optional()
})

// Schema para dados de turma
export const turmaSchema = z.object({
  nome: z.string().min(2, 'Nome da turma deve ter pelo menos 2 caracteres'),
  cursoId: z.string().uuid('ID do curso inválido'),
  professorId: z.string().uuid('ID do professor inválido').optional(),
  horario: z.string().min(1, 'Horário é obrigatório'),
  capacidadeMaxima: z.number().int().positive('Capacidade deve ser um número positivo'),
  valor: z.number().positive('Valor deve ser positivo')
})

// Schema para dados de curso
export const cursoSchema = z.object({
  nome: z.string().min(2, 'Nome do curso deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  duracaoMeses: z.number().int().positive('Duração deve ser um número positivo'),
  valor: z.number().positive('Valor deve ser positivo')
})

// Schema para dados financeiros
export const financeiroSchema = z.object({
  alunoId: z.string().uuid('ID do aluno inválido'),
  valor: z.number().positive('Valor deve ser positivo'),
  dataVencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  dataPagamento: z.string().optional(),
  status: z.enum(['pendente', 'pago', 'atrasado'], {
    errorMap: () => ({ message: 'Status inválido' })
  }),
  descricao: z.string().optional()
})

// Função de validação com logging
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    
    if (context) {
      authLogger.trace('Validação bem-sucedida', {
        action: 'validation',
        context,
        dataKeys: Object.keys(data as Record<string, any>)
      });
    }
    
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      
      if (context) {
        authLogger.warn('Falha na validação', {
          action: 'validation',
          context,
          errors,
          dataKeys: Object.keys(data as Record<string, any>)
        });
      }
      
      return { success: false, errors };
    }
    
    if (context) {
      authLogger.error('Erro inesperado na validação', {
        action: 'validation',
        context
      }, error as Error);
    }
    
    return { success: false, errors: ['Erro de validação inesperado'] };
  }
}

// Função para validação assíncrona com verificações de banco de dados
export async function validateDataAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string,
  customValidations?: Array<(data: T) => Promise<string | null>>
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
  // Primeiro, validação básica do schema
  const basicValidation = validateData(schema, data, context);
  if (!basicValidation.success) {
    return basicValidation;
  }
  
  // Validações customizadas assíncronas
  if (customValidations && customValidations.length > 0) {
    const customErrors: string[] = [];
    
    for (const validation of customValidations) {
      try {
        const error = await validation(basicValidation.data);
        if (error) {
          customErrors.push(error);
        }
      } catch (err) {
        authLogger.error('Erro em validação customizada', {
          action: 'customValidation',
          context
        }, err as Error);
        customErrors.push('Erro na validação customizada');
      }
    }
    
    if (customErrors.length > 0) {
      if (context) {
        authLogger.warn('Falha em validações customizadas', {
          action: 'customValidation',
          context,
          errors: customErrors
        });
      }
      return { success: false, errors: customErrors };
    }
  }
  
  return basicValidation;
}

// Função utilitária para sanitizar dados de entrada
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove caracteres potencialmente perigosos
    .replace(/\s+/g, ' '); // Normaliza espaços
}

// Função para validar arquivos de upload
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // em bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { success: true } | { success: false; error: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB por padrão
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
  } = options;
  
  // Verificar tamanho
  if (file.size > maxSize) {
    return {
      success: false,
      error: `Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }
  
  // Verificar tipo MIME
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
    };
  }
  
  // Verificar extensão
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return {
      success: false,
      error: `Extensão não permitida. Extensões aceitas: ${allowedExtensions.join(', ')}`
    };
  }
  
  return { success: true };
}

// Schemas adicionais para outras entidades
export const profileSchema = z.object({
  nome_completo: nameValidation,
  telefone: phoneValidation.optional(),
  data_nascimento: z.string().date('Data de nascimento inválida').optional(),
  endereco: z.string().max(300, 'Endereço deve ter no máximo 300 caracteres').optional(),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional()
});

export const schoolSchema = z.object({
  nome: schoolNameValidation,
  endereco: z.string().min(10, 'Endereço deve ter pelo menos 10 caracteres').max(300),
  telefone: phoneValidation,
  email: emailValidation.optional(),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido').optional(),
  site: z.string().url('URL inválida').optional(),
  descricao: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional()
});

export const courseSchema = z.object({
  nome: z.string().min(2, 'Nome do curso deve ter pelo menos 2 caracteres').max(100),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  duracao_meses: z.number().int().min(1, 'Duração deve ser pelo menos 1 mês').max(120),
  preco: z.number().min(0, 'Preço deve ser positivo'),
  ativo: z.boolean().default(true)
});

// Tipos TypeScript derivados dos schemas
export type RegisterData = z.infer<typeof registerSchema>
export type LoginData = z.infer<typeof loginSchema>
export type InviteUserData = z.infer<typeof inviteUserSchema>
export type AlunoData = z.infer<typeof alunoSchema>
export type ProfessorData = z.infer<typeof professorSchema>
export type TurmaData = z.infer<typeof turmaSchema>
export type CursoData = z.infer<typeof cursoSchema>
export type FinanceiroData = z.infer<typeof financeiroSchema>
export type ProfileData = z.infer<typeof profileSchema>
export type SchoolData = z.infer<typeof schoolSchema>
export type CourseData = z.infer<typeof courseSchema>