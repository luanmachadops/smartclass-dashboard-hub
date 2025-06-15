
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface Aluno {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  responsavel: string | null
  telefone_responsavel: string | null
  turma_id: string | null
  ativo: boolean
  foto_url: string | null
  created_at: string | null
  instrumento: string | null
  turma?: {
    nome: string
  }
}

export function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlunos = async () => {
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select(`
          *,
          turmas (nome)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to match our Aluno interface
      const transformedData = data?.map(aluno => ({
        id: aluno.id,
        nome: aluno.nome,
        email: aluno.email,
        telefone: aluno.telefone,
        responsavel: aluno.responsavel,
        telefone_responsavel: aluno.telefone_responsavel,
        turma_id: aluno.turma_id,
        ativo: aluno.ativo,
        foto_url: aluno.foto_url,
        created_at: aluno.created_at,
        instrumento: aluno.instrumento,
        turma: aluno.turmas ? { nome: aluno.turmas.nome } : undefined
      })) || []

      setAlunos(transformedData)
    } catch (error) {
      console.error('Erro ao buscar alunos:', error)
      toast.error('Erro ao carregar alunos')
    } finally {
      setLoading(false)
    }
  }

  const createAluno = async (alunoData: any) => {
    try {
      let fotoUrl = null
      
      // Upload da foto se fornecida
      if (alunoData.foto) {
        const fileExt = alunoData.foto.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('alunos-fotos')
          .upload(filePath, alunoData.foto)

        if (uploadError) {
          console.error('Erro no upload:', uploadError)
          toast.error('Erro ao fazer upload da foto')
          return { success: false, error: uploadError }
        }

        const { data: publicUrlData } = supabase.storage
          .from('alunos-fotos')
          .getPublicUrl(filePath)
        
        fotoUrl = publicUrlData.publicUrl
      }

      // Buscar ID da turma pelo nome
      let turmaId = null
      if (alunoData.turma) {
        const { data: turmaData } = await supabase
          .from('turmas')
          .select('id')
          .eq('nome', alunoData.turma)
          .single()
        
        turmaId = turmaData?.id
      }

      const { error } = await supabase
        .from('alunos')
        .insert([{
          nome: alunoData.nome,
          email: alunoData.email || null,
          telefone: alunoData.telefone || null,
          responsavel: alunoData.responsavel || null,
          telefone_responsavel: alunoData.telefoneResponsavel || null,
          turma_id: turmaId,
          foto_url: fotoUrl,
          instrumento: alunoData.instrumento || null
        }])

      if (error) throw error

      // Atualizar vagas ocupadas da turma manualmente
      if (turmaId) {
        const { data: turmaAtual } = await supabase
          .from('turmas')
          .select('vagas_ocupadas')
          .eq('id', turmaId)
          .single()

        if (turmaAtual) {
          await supabase
            .from('turmas')
            .update({ vagas_ocupadas: (turmaAtual.vagas_ocupadas || 0) + 1 })
            .eq('id', turmaId)
        }
      }

      toast.success('Aluno registrado com sucesso!')
      fetchAlunos()
      return { success: true }
    } catch (error) {
      console.error('Erro ao criar aluno:', error)
      toast.error('Erro ao registrar aluno')
      return { success: false, error }
    }
  }

  useEffect(() => {
    fetchAlunos()
  }, [])

  return {
    alunos,
    loading,
    createAluno,
    refetch: fetchAlunos
  }
}
