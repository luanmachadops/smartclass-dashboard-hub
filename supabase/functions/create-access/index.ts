
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  nome_completo: string
  tipo_usuario: 'professor' | 'aluno' | 'diretor'
  school_id: string
  metadata?: {
    especialidades?: string[]
    telefone?: string
    endereco?: string
    responsavel?: string
    telefone_responsavel?: string
    data_nascimento?: string
    instrumento?: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
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

    // Get request data
    const { email, password, nome_completo, tipo_usuario, school_id, metadata }: CreateUserRequest = await req.json()

    console.log('Creating user:', { email, nome_completo, tipo_usuario, school_id })

    // Validate required fields
    if (!email || !password || !nome_completo || !tipo_usuario || !school_id) {
      throw new Error('Campos obrigatórios em falta: email, senha, nome completo, tipo de usuário e ID da escola')
    }

    // Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        nome_completo,
        tipo_usuario,
        ...metadata
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      throw new Error(`Erro ao criar usuário: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado')
    }

    console.log('Auth user created:', authData.user.id)

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        nome_completo,
        tipo_usuario,
        school_id,
        telefone: metadata?.telefone || null
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // If profile creation fails, clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Erro ao criar perfil: ${profileError.message}`)
    }

    console.log('Profile created successfully')

    // If creating a professor, add to professores table
    if (tipo_usuario === 'professor') {
      const { error: professorError } = await supabaseAdmin
        .from('professores')
        .insert({
          user_id: authData.user.id,
          nome: nome_completo,
          email,
          telefone: metadata?.telefone || null,
          especialidades: metadata?.especialidades || null,
          school_id,
          ativo: true
        })

      if (professorError) {
        console.error('Error creating professor:', professorError)
        // Clean up auth user and profile
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw new Error(`Erro ao criar professor: ${professorError.message}`)
      }
    }

    // If creating an aluno, add to alunos table
    if (tipo_usuario === 'aluno') {
      const { error: alunoError } = await supabaseAdmin
        .from('alunos')
        .insert({
          nome: nome_completo,
          email,
          telefone: metadata?.telefone || null,
          endereco: metadata?.endereco || null,
          responsavel: metadata?.responsavel || null,
          telefone_responsavel: metadata?.telefone_responsavel || null,
          data_nascimento: metadata?.data_nascimento || null,
          instrumento: metadata?.instrumento || null,
          school_id,
          ativo: true
        })

      if (alunoError) {
        console.error('Error creating aluno:', alunoError)
        // Clean up auth user and profile
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw new Error(`Erro ao criar aluno: ${alunoError.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        message: `${tipo_usuario} criado com sucesso!`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in create-access function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
