export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alunos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          foto_url: string | null
          id: string
          instrumento: string | null
          nome: string
          responsavel: string | null
          school_id: string
          telefone: string | null
          telefone_responsavel: string | null
          turma_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          foto_url?: string | null
          id?: string
          instrumento?: string | null
          nome: string
          responsavel?: string | null
          school_id: string
          telefone?: string | null
          telefone_responsavel?: string | null
          turma_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          foto_url?: string | null
          id?: string
          instrumento?: string | null
          nome?: string
          responsavel?: string | null
          school_id?: string
          telefone?: string | null
          telefone_responsavel?: string | null
          turma_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alunos_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          created_at: string | null
          data_aula: string
          horario_fim: string
          horario_inicio: string
          id: string
          observacoes: string | null
          professor_id: string | null
          school_id: string
          status: string | null
          turma_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_aula: string
          horario_fim: string
          horario_inicio: string
          id?: string
          observacoes?: string | null
          professor_id?: string | null
          school_id: string
          status?: string | null
          turma_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_aula?: string
          horario_fim?: string
          horario_inicio?: string
          id?: string
          observacoes?: string | null
          professor_id?: string | null
          school_id?: string
          status?: string | null
          turma_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aulas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      chamadas: {
        Row: {
          created_at: string | null
          data_aula: string
          id: string
          observacoes: string | null
          professor_id: string
          school_id: string
          turma_id: string
        }
        Insert: {
          created_at?: string | null
          data_aula: string
          id?: string
          observacoes?: string | null
          professor_id: string
          school_id: string
          turma_id: string
        }
        Update: {
          created_at?: string | null
          data_aula?: string
          id?: string
          observacoes?: string | null
          professor_id?: string
          school_id?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamadas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamadas_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamadas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string | null
          id: string
          joined_at: string | null
          last_read_at: string | null
          profile_id: string
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          profile_id: string
        }
        Update: {
          conversation_id?: string | null
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          group_chat_class_id: string | null
          id: string
          is_group_chat: boolean | null
          school_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_chat_class_id?: string | null
          id?: string
          is_group_chat?: boolean | null
          school_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_chat_class_id?: string | null
          id?: string
          is_group_chat?: boolean | null
          school_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_group_chat_class_id_fkey"
            columns: ["group_chat_class_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          school_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          school_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cursos_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro: {
        Row: {
          aluno_id: string | null
          categoria: string
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          id: string
          metodo_pagamento: string | null
          observacoes: string | null
          professor_id: string | null
          school_id: string
          status: string | null
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          aluno_id?: string | null
          categoria: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          professor_id?: string | null
          school_id: string
          status?: string | null
          tipo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          aluno_id?: string | null
          categoria?: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          professor_id?: string | null
          school_id?: string
          status?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_file_name: string | null
          attachment_file_url: string | null
          attachment_type: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          poll_id: string | null
          sender_profile_id: string
          text_content: string | null
        }
        Insert: {
          attachment_file_name?: string | null
          attachment_file_url?: string | null
          attachment_type?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          poll_id?: string | null
          sender_profile_id: string
          text_content?: string | null
        }
        Update: {
          attachment_file_name?: string | null
          attachment_file_url?: string | null
          attachment_type?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          poll_id?: string | null
          sender_profile_id?: string
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_options: {
        Row: {
          created_at: string | null
          id: string
          poll_id: string | null
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          poll_id?: string | null
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          poll_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          poll_option_id: string | null
          voter_profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          poll_option_id?: string | null
          voter_profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          poll_option_id?: string | null
          voter_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_option_id_fkey"
            columns: ["poll_option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string | null
          id: string
          question: string
          school_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question: string
          school_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question?: string
          school_id?: string
        }
        Relationships: []
      }
      presencas: {
        Row: {
          aluno_id: string
          chamada_id: string
          created_at: string | null
          id: string
          observacoes: string | null
          presente: boolean
        }
        Insert: {
          aluno_id: string
          chamada_id: string
          created_at?: string | null
          id?: string
          observacoes?: string | null
          presente: boolean
        }
        Update: {
          aluno_id?: string
          chamada_id?: string
          created_at?: string | null
          id?: string
          observacoes?: string | null
          presente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "presencas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_chamada_id_fkey"
            columns: ["chamada_id"]
            isOneToOne: false
            referencedRelation: "chamadas"
            referencedColumns: ["id"]
          },
        ]
      }
      professores: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string
          especialidades: string[] | null
          id: string
          nome: string
          school_id: string
          telefone: string | null
          updated_at: string | null
          user_id: string | null
          valor_hora: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email: string
          especialidades?: string[] | null
          id?: string
          nome: string
          school_id: string
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor_hora?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string
          especialidades?: string[] | null
          id?: string
          nome?: string
          school_id?: string
          telefone?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor_hora?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professores_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          nome_completo: string | null
          school_id: string | null
          telefone: string | null
          tipo_usuario: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          nome_completo?: string | null
          school_id?: string | null
          telefone?: string | null
          tipo_usuario?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome_completo?: string | null
          school_id?: string | null
          telefone?: string | null
          tipo_usuario?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      turma_professores: {
        Row: {
          created_at: string | null
          id: string
          professor_id: string
          turma_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          professor_id: string
          turma_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          professor_id?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turma_professores_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turma_professores_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          ativa: boolean | null
          created_at: string | null
          curso_id: string | null
          dia_semana: string
          horario_fim: string
          horario_inicio: string
          id: string
          instrumento: string
          nivel: string
          nome: string
          school_id: string
          updated_at: string | null
          vagas_ocupadas: number | null
          vagas_total: number | null
          valor_mensal: number | null
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          curso_id?: string | null
          dia_semana: string
          horario_fim: string
          horario_inicio: string
          id?: string
          instrumento: string
          nivel: string
          nome: string
          school_id: string
          updated_at?: string | null
          vagas_ocupadas?: number | null
          vagas_total?: number | null
          valor_mensal?: number | null
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          curso_id?: string | null
          dia_semana?: string
          horario_fim?: string
          horario_inicio?: string
          id?: string
          instrumento?: string
          nivel?: string
          nome?: string
          school_id?: string
          updated_at?: string | null
          vagas_ocupadas?: number | null
          vagas_total?: number | null
          valor_mensal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "turmas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_school_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      user_can_access_conversation: {
        Args: { conversation_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
