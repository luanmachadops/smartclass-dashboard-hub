/**
 * Exemplo de testes usando o serviço de testes customizado
 * Demonstra como criar e executar testes para diferentes partes da aplicação
 */

import {
  describe,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  assert,
  mockBuilder,
  ReactTestUtils
} from '@/services/testing'
import { logger } from '@/services/logger'
import { monitoring } from '@/services/monitoring'
import { validateEmail, validatePassword } from '@/schemas/validation'

// Testes de validação
describe('Validation Service', () => {
  it('should validate correct email', () => {
    const result = validateEmail('test@example.com')
    assert.assertTrue(result.success, 'Email válido deve passar na validação')
  })
  
  it('should reject invalid email', () => {
    const result = validateEmail('invalid-email')
    assert.assertFalse(result.success, 'Email inválido deve falhar na validação')
  })
  
  it('should validate strong password', () => {
    const result = validatePassword('MinhaSenh@123')
    assert.assertTrue(result.success, 'Senha forte deve passar na validação')
  })
  
  it('should reject weak password', () => {
    const result = validatePassword('123')
    assert.assertFalse(result.success, 'Senha fraca deve falhar na validação')
  })
})

// Testes do serviço de logging
describe('Logger Service', () => {
  beforeEach(() => {
    // Limpar logs antes de cada teste
    logger.clearLogs()
  })
  
  it('should log info messages', () => {
    logger.info('Test message', { test: true })
    const logs = logger.getLogs()
    
    assert.assertEqual(logs.length, 1, 'Deve ter 1 log')
    assert.assertEqual(logs[0].level, 'INFO', 'Nível deve ser INFO')
    assert.assertEqual(logs[0].message, 'Test message', 'Mensagem deve estar correta')
  })
  
  it('should log error messages with stack trace', () => {
    const error = new Error('Test error')
    logger.error('Error occurred', { context: 'test' }, error)
    
    const logs = logger.getLogs()
    assert.assertEqual(logs.length, 1, 'Deve ter 1 log')
    assert.assertEqual(logs[0].level, 'ERROR', 'Nível deve ser ERROR')
    assert.assertTrue(logs[0].stack !== undefined, 'Deve ter stack trace')
  })
  
  it('should filter logs by level', () => {
    logger.info('Info message')
    logger.warn('Warning message')
    logger.error('Error message')
    
    const errorLogs = logger.getLogs('ERROR')
    assert.assertEqual(errorLogs.length, 1, 'Deve ter apenas 1 log de erro')
    assert.assertEqual(errorLogs[0].level, 'ERROR', 'Log deve ser de erro')
  })
})

// Testes do serviço de monitoramento
describe('Monitoring Service', () => {
  let mockConsoleError: any
  
  beforeAll(() => {
    // Mock console.error para evitar spam nos testes
    mockConsoleError = mockBuilder.spy(console.error)
  })
  
  afterAll(() => {
    mockBuilder.restore()
  })
  
  it('should record performance metrics', async () => {
    const result = await monitoring.measureAsync('test-operation', async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      return 'test-result'
    })
    
    assert.assertEqual(result, 'test-result', 'Deve retornar o resultado da operação')
    
    const metrics = monitoring.getMetrics()
    const testMetric = metrics.find(m => m.name === 'test-operation')
    
    assert.assertTrue(testMetric !== undefined, 'Deve ter registrado a métrica')
    assert.assertTrue(testMetric!.duration >= 100, 'Duração deve ser pelo menos 100ms')
  })
  
  it('should record errors', () => {
    const error = new Error('Test error')
    
    monitoring.recordError({
      message: 'Test error occurred',
      error,
      type: 'custom',
      context: { test: true }
    })
    
    const errors = monitoring.getErrors()
    assert.assertEqual(errors.length, 1, 'Deve ter 1 erro registrado')
    assert.assertEqual(errors[0].message, 'Test error occurred', 'Mensagem deve estar correta')
  })
  
  it('should record user actions', () => {
    monitoring.recordUserAction({
      action: 'test-action',
      category: 'test',
      label: 'Test Label',
      value: 123
    })
    
    const actions = monitoring.getUserActions()
    assert.assertEqual(actions.length, 1, 'Deve ter 1 ação registrada')
    assert.assertEqual(actions[0].action, 'test-action', 'Ação deve estar correta')
  })
})

// Testes de utilitários React
describe('React Test Utils', () => {
  it('should create mock props', () => {
    const props = ReactTestUtils.createMockProps({
      title: 'Test Title',
      disabled: true
    })
    
    assert.assertEqual(props.title, 'Test Title', 'Prop customizada deve estar presente')
    assert.assertEqual(props.disabled, true, 'Prop customizada deve estar presente')
    assert.assertTrue(typeof props.onClick === 'function', 'Deve ter prop onClick padrão')
  })
  
  it('should create mock user', () => {
    const user = ReactTestUtils.createMockUser()
    
    assert.assertTrue(user.id.startsWith('test-'), 'ID deve começar com test-')
    assert.assertEqual(user.email, 'test@example.com', 'Email deve estar correto')
    assert.assertEqual(user.role, 'student', 'Role deve ser student')
  })
  
  it('should create mock Supabase client', () => {
    const client = ReactTestUtils.createMockSupabaseClient()
    
    assert.assertTrue(typeof client.auth.signUp === 'function', 'Deve ter método signUp')
    assert.assertTrue(typeof client.auth.signInWithPassword === 'function', 'Deve ter método signInWithPassword')
    assert.assertTrue(typeof client.from === 'function', 'Deve ter método from')
  })
})

// Testes de integração
describe('Integration Tests', () => {
  it('should handle async operations with timeout', async () => {
    const startTime = Date.now()
    
    await monitoring.measureAsync('async-test', async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
      logger.info('Async operation completed')
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    assert.assertTrue(duration >= 50, 'Operação deve ter levado pelo menos 50ms')
    
    const logs = logger.getLogs()
    const asyncLog = logs.find(log => log.message === 'Async operation completed')
    assert.assertTrue(asyncLog !== undefined, 'Deve ter log da operação async')
  }, { timeout: 1000 })
  
  it('should handle errors in async operations', async () => {
    const errorMessage = 'Async error test'
    
    await assert.assertThrowsAsync(async () => {
      await monitoring.measureAsync('failing-operation', async () => {
        throw new Error(errorMessage)
      })
    }, errorMessage)
    
    const errors = monitoring.getErrors()
    const asyncError = errors.find(error => error.message.includes(errorMessage))
    assert.assertTrue(asyncError !== undefined, 'Deve ter registrado o erro async')
  })
})

// Testes de performance
describe('Performance Tests', () => {
  it('should complete operations within acceptable time', async () => {
    const maxDuration = 100 // ms
    
    const result = await monitoring.measureAsync('performance-test', async () => {
      // Simular operação rápida
      for (let i = 0; i < 1000; i++) {
        Math.random()
      }
      return 'completed'
    })
    
    assert.assertEqual(result, 'completed', 'Operação deve completar')
    
    const metrics = monitoring.getMetrics()
    const perfMetric = metrics.find(m => m.name === 'performance-test')
    
    assert.assertTrue(perfMetric !== undefined, 'Deve ter métrica de performance')
    assert.assertTrue(perfMetric!.duration < maxDuration, `Operação deve ser mais rápida que ${maxDuration}ms`)
  })
  
  it('should handle multiple concurrent operations', async () => {
    const operations = Array.from({ length: 5 }, (_, i) => 
      monitoring.measureAsync(`concurrent-op-${i}`, async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50))
        return i
      })
    )
    
    const results = await Promise.all(operations)
    
    assert.assertEqual(results.length, 5, 'Deve ter 5 resultados')
    results.forEach((result, index) => {
      assert.assertEqual(result, index, `Resultado ${index} deve estar correto`)
    })
    
    const metrics = monitoring.getMetrics()
    const concurrentMetrics = metrics.filter(m => m.name.startsWith('concurrent-op-'))
    assert.assertEqual(concurrentMetrics.length, 5, 'Deve ter 5 métricas de operações concorrentes')
  })
})

// Exemplo de como executar os testes
if (typeof window !== 'undefined') {
  console.log('Testes de exemplo carregados. Execute window.runTests() para executar.')
}