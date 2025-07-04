import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import { fetchAddressFromCEP, formatCep, isValidCep, AddressData } from '@/utils/cep';
import { Loader2, MapPin, Building2 } from 'lucide-react';

interface SchoolData {
  cnpj: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const SchoolSettings: React.FC = () => {
  const { user } = useAuth();
  const { school, updateSchool } = useSchool();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<SchoolData>({
    cnpj: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: ''
  });
  
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFirstSetup, setIsFirstSetup] = useState(false);

  useEffect(() => {
    if (school) {
      // Verifica se é a primeira configuração (dados básicos não preenchidos)
      const hasBasicData = school.cnpj || school.telefone || school.cep;
      setIsFirstSetup(!hasBasicData);
      
      setFormData({
        cnpj: school.cnpj || '',
        telefone: school.telefone || '',
        cep: school.cep || '',
        logradouro: school.logradouro || '',
        numero: school.numero || '',
        bairro: school.bairro || '',
        cidade: school.cidade || '',
        estado: school.estado || ''
      });
    }
  }, [school]);

  const handleInputChange = (field: keyof SchoolData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCepChange = async (cep: string) => {
    const formattedCep = formatCep(cep);
    handleInputChange('cep', formattedCep);
    
    // Busca automática quando CEP estiver completo
    if (isValidCep(cep)) {
      setIsLoadingCep(true);
      const addressData = await fetchAddressFromCEP(cep);
      
      if (addressData) {
        setFormData(prev => ({
          ...prev,
          cep: addressData.cep,
          logradouro: addressData.logradouro,
          bairro: addressData.bairro,
          cidade: addressData.cidade,
          estado: addressData.estado
        }));
        toast.success('Endereço encontrado!');
      } else {
        toast.error('CEP não encontrado. Verifique e tente novamente.');
      }
      
      setIsLoadingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!school) {
      toast.error('Dados da escola não encontrados');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const success = await updateSchool(school.id, formData);
      
      if (success) {
        toast.success('Dados da escola atualizados com sucesso!');
        
        if (isFirstSetup) {
          // Redireciona para o dashboard após primeira configuração
          navigate('/dashboard');
        }
      } else {
        toast.error('Erro ao atualizar dados da escola');
      }
    } catch (error) {
      console.error('Erro ao salvar dados da escola:', error);
      toast.error('Erro inesperado ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCnpj = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 10) {
      return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          {isFirstSetup ? 'Complete os dados da sua escola' : 'Configurações da Escola'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isFirstSetup 
            ? 'Para finalizar seu cadastro, complete as informações da escola abaixo.'
            : 'Gerencie as informações da sua escola.'
          }
        </p>
      </div>

      {/* Informações do Administrador */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Administrador da Escola</CardTitle>
          <CardDescription>
            Informações do usuário responsável pela escola
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome do Diretor</Label>
              <Input 
                value={user?.nome_completo || ''} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                value={user?.email || ''} 
                disabled 
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Dados da Escola */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Escola</CardTitle>
          <CardDescription>
            Complete as informações da sua escola
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome da Escola */}
            <div>
              <Label>Nome da Escola</Label>
              <Input 
                value={school?.name || ''} 
                disabled 
                className="bg-muted"
              />
            </div>

            <Separator />

            {/* Dados Básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange('cnpj', formatCnpj(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </div>

            <Separator />

            {/* Endereço */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Endereço</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {isLoadingCep && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.logradouro}
                    onChange={(e) => handleInputChange('logradouro', e.target.value)}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                    placeholder="123"
                  />
                </div>
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange('bairro', e.target.value)}
                    placeholder="Centro"
                  />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value.toUpperCase())}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-4 pt-6">
              {!isFirstSetup && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                >
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isFirstSetup ? 'Finalizar Cadastro' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolSettings;