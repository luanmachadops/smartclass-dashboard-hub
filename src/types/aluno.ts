
export interface Aluno {
  id: string
  school_id: string
  user_id?: string | null
  nome: string
  email?: string | null
  telefone?: string | null
  endereco?: string | null
  data_nascimento?: string | null
  responsavel?: string | null
  telefone_responsavel?: string | null
  ativo?: boolean
  turma_id?: string | null
  created_at?: string | null
  updated_at?: string | null
  turma?: { nome: string }
  foto_url?: string
  instrumento?: string
}
