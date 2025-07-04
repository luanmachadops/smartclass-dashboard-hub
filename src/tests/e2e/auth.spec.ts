import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página inicial
    await page.goto('/');
  });

  test('deve exibir a página de login', async ({ page }) => {
    // Verificar se a página de login está sendo exibida
    await expect(page).toHaveTitle(/SmartClass/);
    
    // Verificar elementos da página de login
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Preencher formulário com credenciais inválidas
    await page.fill('input[type="email"]', 'usuario@invalido.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Verificar se a mensagem de erro é exibida
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('[role="alert"]')).toContainText(/credenciais|inválid|erro/i);
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    // Preencher formulário com credenciais válidas
    await page.fill('input[type="email"]', 'diretor.teste@escola.com');
    await page.fill('input[type="password"]', 'senha123');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento para o dashboard
    await page.waitForURL('**/dashboard');
    
    // Verificar se o dashboard está sendo exibido
    await expect(page.locator('h1')).toContainText(/dashboard|painel/i);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('deve fazer logout corretamente', async ({ page }) => {
    // Fazer login primeiro
    await page.fill('input[type="email"]', 'diretor.teste@escola.com');
    await page.fill('input[type="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Clicar no menu do usuário
    await page.click('[data-testid="user-menu"]');
    
    // Clicar em logout
    await page.click('[data-testid="logout-button"]');
    
    // Verificar se foi redirecionado para a página de login
    await page.waitForURL('**/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('deve redirecionar usuário não autenticado', async ({ page }) => {
    // Tentar acessar página protegida sem estar logado
    await page.goto('/dashboard');
    
    // Verificar se foi redirecionado para login
    await page.waitForURL('**/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('deve lembrar do usuário com "Lembrar de mim"', async ({ page }) => {
    // Preencher formulário
    await page.fill('input[type="email"]', 'diretor.teste@escola.com');
    await page.fill('input[type="password"]', 'senha123');
    
    // Marcar "Lembrar de mim"
    await page.check('input[type="checkbox"]');
    
    // Fazer login
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Recarregar a página
    await page.reload();
    
    // Verificar se ainda está logado
    await expect(page.locator('h1')).toContainText(/dashboard|painel/i);
  });

  test('deve validar formato de email', async ({ page }) => {
    // Preencher email inválido
    await page.fill('input[type="email"]', 'email-invalido');
    await page.fill('input[type="password"]', 'senha123');
    
    // Tentar submeter
    await page.click('button[type="submit"]');
    
    // Verificar validação HTML5 ou mensagem de erro customizada
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('deve mostrar indicador de carregamento durante login', async ({ page }) => {
    // Interceptar requisição para simular lentidão
    await page.route('**/auth/v1/token**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    // Preencher e submeter formulário
    await page.fill('input[type="email"]', 'diretor.teste@escola.com');
    await page.fill('input[type="password"]', 'senha123');
    await page.click('button[type="submit"]');
    
    // Verificar se o indicador de carregamento aparece
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Verificar se o botão fica desabilitado
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('deve funcionar com navegação por teclado', async ({ page }) => {
    // Navegar pelos campos usando Tab
    await page.keyboard.press('Tab'); // Email
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Password
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Checkbox (se existir)
    await page.keyboard.press('Tab'); // Submit button
    await expect(page.locator('button[type="submit"]')).toBeFocused();
    
    // Preencher usando teclado
    await page.focus('input[type="email"]');
    await page.keyboard.type('diretor.teste@escola.com');
    
    await page.focus('input[type="password"]');
    await page.keyboard.type('senha123');
    
    // Submeter usando Enter
    await page.keyboard.press('Enter');
    
    // Verificar se o login foi processado
    await page.waitForURL('**/dashboard');
  });
});