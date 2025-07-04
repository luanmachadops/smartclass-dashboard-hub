import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';

/**
 * Hook para verificar se é o primeiro acesso do usuário e redirecionar
 * para a página de configurações da escola se necessário
 */
export function useFirstTimeSetup() {
  const { user } = useAuth();
  const { school, loading } = useSchool();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Não faz nada se ainda estiver carregando ou se não há usuário
    if (loading || !user || !school) {
      return;
    }

    // Não redireciona se já estiver na página de configurações
    if (location.pathname === '/school-settings') {
      setIsChecking(false);
      return;
    }

    // Verifica se é diretor e se os dados básicos da escola estão preenchidos
    const isDirector = user.user_metadata?.tipo_usuario === 'diretor';
    const hasBasicSchoolData = school.cnpj || school.telefone || school.cep;

    // Se é diretor e não tem dados básicos da escola, redireciona para configurações
    if (isDirector && !hasBasicSchoolData) {
      console.log('🔄 Redirecionando para configurações da escola (primeiro acesso)');
      navigate('/school-settings', { replace: true });
    }

    setIsChecking(false);
  }, [user, school, loading, location.pathname, navigate]);

  return {
    isChecking: loading || isChecking,
    needsSetup: user?.user_metadata?.tipo_usuario === 'diretor' && 
                school && 
                !(school.cnpj || school.telefone || school.cep)
  };
}