/**
 * Utilitário para busca de endereços por CEP usando a API ViaCEP
 */

export interface AddressData {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

/**
 * Busca dados de endereço a partir de um CEP
 * @param cep - CEP no formato 00000-000 ou 00000000
 * @returns Dados do endereço ou null em caso de erro
 */
export async function fetchAddressFromCEP(cep: string): Promise<AddressData | null> {
  try {
    // Remove caracteres não numéricos do CEP
    const cleanCep = cep.replace(/\D/g, '');
    
    // Valida se o CEP tem 8 dígitos
    if (cleanCep.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }
    
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro na consulta do CEP');
    }
    
    const data = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }
    
    return {
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      estado: data.uf || '',
      cep: formatCep(cleanCep)
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}

/**
 * Formata um CEP para o padrão 00000-000
 * @param cep - CEP sem formatação
 * @returns CEP formatado
 */
export function formatCep(cep: string): string {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Valida se um CEP está no formato correto
 * @param cep - CEP a ser validado
 * @returns true se válido, false caso contrário
 */
export function isValidCep(cep: string): boolean {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.length === 8 && /^\d{8}$/.test(cleanCep);
}