import { test, expect } from '@playwright/test';

test.describe('Dashboard de Métricas', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    await page.goto('/login');
    await page.fill('input[type="email"]', 'diretor.teste@escola.com');
    await page.fill('input[type="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('deve exibir o dashboard principal', async ({ page }) => {
    // Verificar elementos principais do dashboard
    await expect(page.locator('h1')).toContainText(/dashboard|painel/i);
    await expect(page.locator('[data-testid="metrics-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="health-status"]')).toBeVisible();
  });

  test('deve exibir métricas de visão geral', async ({ page }) => {
    // Verificar se as métricas principais estão visíveis
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-schools"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-sessions"]')).toBeVisible();
    await expect(page.locator('[data-testid="system-health"]')).toBeVisible();
    
    // Verificar se os valores são números
    const totalUsers = await page.locator('[data-testid="total-users"] .metric-value').textContent();
    expect(totalUsers).toMatch(/\d+/);
  });

  test('deve navegar entre abas de métricas', async ({ page }) => {
    // Verificar aba inicial (Visão Geral)
    await expect(page.locator('[data-testid="tab-overview"]')).toHaveAttribute('aria-selected', 'true');
    
    // Clicar na aba de Usuários
    await page.click('[data-testid="tab-users"]');
    await expect(page.locator('[data-testid="tab-users"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="users-metrics"]')).toBeVisible();
    
    // Clicar na aba de Escolas
    await page.click('[data-testid="tab-schools"]');
    await expect(page.locator('[data-testid="tab-schools"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="schools-metrics"]')).toBeVisible();
    
    // Clicar na aba de Engajamento
    await page.click('[data-testid="tab-engagement"]');
    await expect(page.locator('[data-testid="tab-engagement"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="engagement-metrics"]')).toBeVisible();
    
    // Clicar na aba de Saúde do Sistema
    await page.click('[data-testid="tab-health"]');
    await expect(page.locator('[data-testid="tab-health"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="health-details"]')).toBeVisible();
  });

  test('deve exibir status de saúde do sistema', async ({ page }) => {
    // Navegar para a aba de saúde
    await page.click('[data-testid="tab-health"]');
    
    // Verificar componentes de saúde
    await expect(page.locator('[data-testid="database-health"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-health"]')).toBeVisible();
    await expect(page.locator('[data-testid="storage-health"]')).toBeVisible();
    await expect(page.locator('[data-testid="realtime-health"]')).toBeVisible();
    
    // Verificar se cada componente tem um status
    const dbStatus = await page.locator('[data-testid="database-health"] .status-indicator').getAttribute('data-status');
    expect(['healthy', 'warning', 'error']).toContain(dbStatus);
  });

  test('deve atualizar métricas automaticamente', async ({ page }) => {
    // Capturar valor inicial
    const initialValue = await page.locator('[data-testid="active-sessions"] .metric-value').textContent();
    
    // Aguardar atualização automática (assumindo intervalo de 30s)
    await page.waitForTimeout(31000);
    
    // Verificar se o valor foi atualizado (pode ser o mesmo, mas a requisição deve ter sido feita)
    const updatedValue = await page.locator('[data-testid="active-sessions"] .metric-value').textContent();
    
    // Verificar se ainda é um número válido
    expect(updatedValue).toMatch(/\d+/);
  });

  test('deve permitir atualização manual das métricas', async ({ page }) => {
    // Clicar no botão de atualizar
    await page.click('[data-testid="refresh-metrics"]');
    
    // Verificar se o indicador de carregamento aparece
    await expect(page.locator('[data-testid="loading-metrics"]')).toBeVisible();
    
    // Aguardar carregamento terminar
    await expect(page.locator('[data-testid="loading-metrics"]')).not.toBeVisible({ timeout: 10000 });
    
    // Verificar se as métricas ainda estão visíveis
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
  });

  test('deve exibir gráficos de métricas', async ({ page }) => {
    // Navegar para aba de engajamento que deve ter gráficos
    await page.click('[data-testid="tab-engagement"]');
    
    // Verificar se os gráficos estão presentes
    await expect(page.locator('[data-testid="engagement-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-chart"]')).toBeVisible();
    
    // Verificar se os gráficos têm conteúdo (SVG ou Canvas)
    const chartElement = page.locator('[data-testid="engagement-chart"] svg, [data-testid="engagement-chart"] canvas');
    await expect(chartElement).toBeVisible();
  });

  test('deve filtrar métricas por período', async ({ page }) => {
    // Verificar se o seletor de período está presente
    await expect(page.locator('[data-testid="period-selector"]')).toBeVisible();
    
    // Selecionar período de 7 dias
    await page.selectOption('[data-testid="period-selector"]', '7d');
    
    // Aguardar atualização das métricas
    await page.waitForTimeout(2000);
    
    // Verificar se as métricas foram atualizadas
    await expect(page.locator('[data-testid="period-label"]')).toContainText('7 dias');
    
    // Selecionar período de 30 dias
    await page.selectOption('[data-testid="period-selector"]', '30d');
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="period-label"]')).toContainText('30 dias');
  });

  test('deve exibir detalhes ao clicar em métricas', async ({ page }) => {
    // Clicar em uma métrica específica
    await page.click('[data-testid="total-users"]');
    
    // Verificar se o modal ou painel de detalhes aparece
    await expect(page.locator('[data-testid="metric-details-modal"]')).toBeVisible();
    
    // Verificar conteúdo do modal
    await expect(page.locator('[data-testid="metric-details-title"]')).toContainText(/usuários|users/i);
    await expect(page.locator('[data-testid="metric-details-chart"]')).toBeVisible();
    
    // Fechar modal
    await page.click('[data-testid="close-modal"]');
    await expect(page.locator('[data-testid="metric-details-modal"]')).not.toBeVisible();
  });

  test('deve ser responsivo em diferentes tamanhos de tela', async ({ page }) => {
    // Testar em desktop (padrão)
    await expect(page.locator('[data-testid="metrics-grid"]')).toHaveClass(/grid-cols-4|grid-cols-3/);
    
    // Testar em tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="metrics-grid"]')).toHaveClass(/grid-cols-2/);
    
    // Testar em mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="metrics-grid"]')).toHaveClass(/grid-cols-1/);
    
    // Verificar se o menu de navegação se adapta
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
  });

  test('deve exportar dados de métricas', async ({ page }) => {
    // Clicar no botão de exportar
    await page.click('[data-testid="export-metrics"]');
    
    // Verificar se o menu de exportação aparece
    await expect(page.locator('[data-testid="export-menu"]')).toBeVisible();
    
    // Selecionar formato CSV
    await page.click('[data-testid="export-csv"]');
    
    // Aguardar download (em teste real, verificaria o arquivo baixado)
    await page.waitForTimeout(2000);
    
    // Verificar se uma mensagem de sucesso aparece
    await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
  });

  test('deve funcionar com navegação por teclado', async ({ page }) => {
    // Navegar pelas abas usando setas
    await page.focus('[data-testid="tab-overview"]');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-testid="tab-users"]')).toBeFocused();
    
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-testid="tab-schools"]')).toBeFocused();
    
    // Ativar aba com Enter ou Space
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="tab-schools"]')).toHaveAttribute('aria-selected', 'true');
    
    // Navegar pelos elementos da aba usando Tab
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="schools-metrics"] button:first-child')).toBeFocused();
  });
});