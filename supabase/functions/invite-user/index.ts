import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar se o usuário está autenticado
    const authHeader = req.headers.get('Authorization')!
    if (!authHeader) {
      throw new Error('Não autorizado')
    }

    // Criar cliente Supabase com privilégios de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Criar cliente regular para verificar permissões do usuário atual
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Verificar se o usuário atual tem permissão para convidar
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Usuário não encontrado')
    }

    // Buscar perfil do usuário para verificar permissões
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tipo_usuario, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Perfil não encontrado')
    }

    // Verificar se o usuário tem permissão para convidar
    if (!['admin', 'diretor'].includes(profile.tipo_usuario)) {
      throw new Error('Sem permissão para convidar usuários')
    }

    // Obter dados do corpo da requisição
    const { email, nome_completo, tipo_usuario, school_id } = await req.json()

    // Validar se o school_id corresponde ao do usuário atual
    if (school_id !== profile.school_id) {
      throw new Error('Não é possível convidar usuários para outra escola')
    }

    // Validar dados obrigatórios
    if (!email || !nome_completo || !tipo_usuario || !school_id) {
      throw new Error('Dados obrigatórios não fornecidos')
    }

    // Validar tipo de usuário
    if (!['professor', 'aluno', 'secretario'].includes(tipo_usuario)) {
      throw new Error('Tipo de usuário inválido')
    }

    console.log('Convidando usuário:', { email, nome_completo, tipo_usuario, school_id })

    // Convidar usuário usando a API de admin
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        nome_completo,
        tipo_usuario,
        school_id
      },
      redirectTo: `${req.headers.get('origin')}/auth/callback`
    })

    if (inviteError) {
      console.error('Erro ao convidar usuário:', inviteError)
      throw inviteError
    }

    console.log('Usuário convidado com sucesso:', inviteData.user?.email)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite enviado com sucesso',
        user_id: inviteData.user?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Erro na função invite-user:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})