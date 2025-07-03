import React, { useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { UserService } from '@/services/userService'
import { toast } from '@/hooks/use-toast'
import {
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Calendar,
  Edit,
  Save,
  X
} from 'lucide-react'

export function Profile() {
  const { user } = useAuth()
  const { profile, updateProfile } = useUserProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nome_completo: profile?.nome_completo || '',
    telefone: profile?.telefone || ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleEdit = () => {
    setFormData({
      nome_completo: profile?.nome_completo || '',
      telefone: profile?.telefone || ''
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData({
      nome_completo: profile?.nome_completo || '',
      telefone: profile?.telefone || ''
    })
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!profile) return

    setIsLoading(true)
    try {
      const success = await updateProfile({
        nome_completo: formData.nome_completo || null,
        telefone: formData.telefone || null
      })

      if (success) {
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar o perfil.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleDisplayName = (role: string | null) => {
    const roleMap: Record<string, string> = {
      'diretor': 'Diretor',
      'admin': 'Administrador',
      'professor': 'Professor',
      'aluno': 'Aluno',
      'secretario': 'Secretário'
    }
    return role ? roleMap[role] || role : 'Não definido'
  }

  const getRoleBadgeVariant = (role: string | null) => {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'diretor': 'default',
      'admin': 'default',
      'professor': 'secondary',
      'aluno': 'outline',
      'secretario': 'secondary'
    }
    return role ? variantMap[role] || 'outline' : 'outline'
  }

  if (!profile) {
    return (
      <DashboardLayout title="Meu Perfil">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando perfil...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Meu Perfil">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
              <p className="text-muted-foreground">
                Visualize e edite suas informações pessoais
              </p>
            </div>
            {!isEditing && (
              <Button onClick={handleEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>

          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Suas informações básicas de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome_completo">Nome Completo</Label>
                  {isEditing ? (
                    <Input
                      id="nome_completo"
                      value={formData.nome_completo}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
                      placeholder="Digite seu nome completo"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.nome_completo || 'Não informado'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  {isEditing ? (
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="Digite seu telefone"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.telefone || 'Não informado'}</span>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" disabled={isLoading}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações da Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informações da Conta
              </CardTitle>
              <CardDescription>
                Informações sobre sua conta e permissões
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user?.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Usuário</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Badge variant={getRoleBadgeVariant(profile.tipo_usuario)}>
                      {getRoleDisplayName(profile.tipo_usuario)}
                    </Badge>
                  </div>
                </div>
              </div>

              {profile.school && (
                <div className="space-y-2">
                  <Label>Escola</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.school.name}</span>
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Criado em: {profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : 'Não informado'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Atualizado em: {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('pt-BR') : 'Não informado'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissões */}
          <Card>
            <CardHeader>
              <CardTitle>Permissões</CardTitle>
              <CardDescription>
                Funcionalidades que você tem acesso baseado no seu papel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {UserService.hasPermission(profile.tipo_usuario, ['diretor', 'admin', 'secretario', 'professor']) && (
                  <Badge variant="outline">Gerenciar Turmas</Badge>
                )}
                {UserService.hasPermission(profile.tipo_usuario, ['diretor', 'admin']) && (
                  <Badge variant="outline">Gerenciar Cursos</Badge>
                )}
                {UserService.hasPermission(profile.tipo_usuario, ['diretor', 'admin', 'secretario', 'professor']) && (
                  <Badge variant="outline">Visualizar Alunos</Badge>
                )}
                {UserService.hasPermission(profile.tipo_usuario, ['diretor', 'admin', 'secretario']) && (
                  <Badge variant="outline">Gerenciar Professores</Badge>
                )}
                {UserService.hasPermission(profile.tipo_usuario, ['diretor', 'admin']) && (
                  <Badge variant="outline">Relatórios</Badge>
                )}
                {UserService.hasPermission(profile.tipo_usuario, ['diretor', 'admin', 'secretario']) && (
                  <Badge variant="outline">Financeiro</Badge>
                )}
                {UserService.hasPermission(profile.tipo_usuario, ['diretor', 'admin', 'professor', 'aluno', 'secretario']) && (
                  <Badge variant="outline">Comunicação</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Profile