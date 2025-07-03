/**
 * Schemas de validação usando Zod
 * Centraliza todas as validações de dados da aplicação
 */

import { z } from 'zod'

// Schema para validação de email
export const emailSchema = z.string()
  .email('Email inválido')
  .min(1, 'Email é obrigatório')

// Schema para validação de senha
export const passwordSchema = z.string()
  .min(6, 'Senha deve ter pelo menos 6 caracteres')
  .max(100, 'Senha muito longa')

// Schema para validação de nome
export const nameSchema = z.string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')

// Schema para registro de usuário
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  directorName: nameSchema,
  schoolName: z.string()
    .min(2, 'Nome da escola deve ter pelo menos 2 caracteres')
    .max(200, 'Nome da escola muito longo')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
})

// Schema para login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória')
})

// Schema para convite de usuário
export const inviteUserSchema = z.object({
  email: emailSchema,
  nomeCompleto: nameSchema,
  tipoUsuario: z.enum(['professor', 'aluno', 'secretario'], {
    errorMap: () => ({ message: 'Tipo de usuário inválido' })
  }),
  schoolId: z.string().uuid('ID da escola inválido')
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

// Função helper para validar dados
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      return { success: false, errors }
    }
    return { success: false, errors: ['Erro de validação desconhecido'] }
  }
}

// Função helper para validar dados de forma assíncrona
export const validateDataAsync = async <T>(schema: z.ZodSchema<T>, data: unknown): Promise<{ success: true; data: T } | { success: false; errors: string[] }> => {
  try {
    const validatedData = await schema.parseAsync(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      return { success: false, errors }
    }
    return { success: false, errors: ['Erro de validação desconhecido'] }
  }
}

// Tipos TypeScript derivados dos schemas
export type RegisterData = z.infer<typeof registerSchema>
export type LoginData = z.infer<typeof loginSchema>
export type InviteUserData = z.infer<typeof inviteUserSchema>
export type AlunoData = z.infer<typeof alunoSchema>
export type ProfessorData = z.infer<typeof professorSchema>
export type TurmaData = z.infer<typeof turmaSchema>
export type CursoData = z.infer<typeof cursoSchema>
export type FinanceiroData = z.infer<typeof financeiroSchema>