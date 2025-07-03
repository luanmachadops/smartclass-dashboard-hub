/**
 * Serviço de testes automatizados
 * Utilitários para facilitar a criação e execução de testes
 */

import { logger } from './logger'
import { monitoring } from './monitoring'
import { config } from '@/config/environment'

// Tipos para testes
export interface TestCase {
  name: string
  description?: string
  fn: () => Promise<void> | void
  timeout?: number
  skip?: boolean
  only?: boolean
}

export interface TestSuite {
  name: string
  description?: string
  tests: TestCase[]
  beforeAll?: () => Promise<void> | void
  afterAll?: () => Promise<void> | void
  beforeEach?: () => Promise<void> | void
  afterEach?: () => Promise<void> | void
}

export interface TestResult {
  name: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: Error
  logs?: string[]
}

export interface SuiteResult {
  name: string
  results: TestResult[]
  duration: number
  passed: number
  failed: number
  skipped: number
}

// Mock utilities
export class MockBuilder {
  private mocks: Map<string, any> = new Map()
  
  mock<T = any>(name: string, implementation?: T): T {
    const mockFn = implementation || this.createMockFunction()
    this.mocks.set(name, mockFn)
    return mockFn as T
  }
  
  spy<T extends (...args: any[]) => any>(fn: T): T & { calls: any[][]; callCount: number } {
    const calls: any[][] = []
    const spyFn = ((...args: any[]) => {
      calls.push(args)
      return fn(...args)
    }) as T & { calls: any[][]; callCount: number }
    
    Object.defineProperty(spyFn, 'calls', { get: () => calls })
    Object.defineProperty(spyFn, 'callCount', { get: () => calls.length })
    
    return spyFn
  }
  
  stub<T = any>(name: string, returnValue?: T): () => T {
    const stubFn = () => returnValue
    this.mocks.set(name, stubFn)
    return stubFn
  }
  
  restore(name?: string) {
    if (name) {
      this.mocks.delete(name)
    } else {
      this.mocks.clear()
    }
  }
  
  private createMockFunction() {
    const calls: any[][] = []
    const mockFn = (...args: any[]) => {
      calls.push(args)
      return undefined
    }
    
    Object.defineProperty(mockFn, 'calls', { get: () => calls })
    Object.defineProperty(mockFn, 'callCount', { get: () => calls.length })
    
    return mockFn
  }
}

// Assertion utilities
export class Assertions {
  static assertEqual<T>(actual: T, expected: T, message?: string) {
    if (actual !== expected) {
      throw new Error(
        message || `Assertion failed: expected ${expected}, got ${actual}`
      )
    }
  }
  
  static assertDeepEqual<T>(actual: T, expected: T, message?: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        message || `Deep assertion failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      )
    }
  }
  
  static assertTrue(condition: boolean, message?: string) {
    if (!condition) {
      throw new Error(message || 'Assertion failed: expected true')
    }
  }
  
  static assertFalse(condition: boolean, message?: string) {
    if (condition) {
      throw new Error(message || 'Assertion failed: expected false')
    }
  }
  
  static assertThrows(fn: () => any, expectedError?: string | RegExp, message?: string) {
    try {
      fn()
      throw new Error(message || 'Expected function to throw')
    } catch (error) {
      if (expectedError) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (typeof expectedError === 'string') {
          if (!errorMessage.includes(expectedError)) {
            throw new Error(`Expected error to contain "${expectedError}", got "${errorMessage}"`)
          }
        } else if (expectedError instanceof RegExp) {
          if (!expectedError.test(errorMessage)) {
            throw new Error(`Expected error to match ${expectedError}, got "${errorMessage}"`)
          }
        }
      }
    }
  }
  
  static async assertThrowsAsync(fn: () => Promise<any>, expectedError?: string | RegExp, message?: string) {
    try {
      await fn()
      throw new Error(message || 'Expected async function to throw')
    } catch (error) {
      if (expectedError) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (typeof expectedError === 'string') {
          if (!errorMessage.includes(expectedError)) {
            throw new Error(`Expected error to contain "${expectedError}", got "${errorMessage}"`)
          }
        } else if (expectedError instanceof RegExp) {
          if (!expectedError.test(errorMessage)) {
            throw new Error(`Expected error to match ${expectedError}, got "${errorMessage}"`)
          }
        }
      }
    }
  }
  
  static assertContains<T>(array: T[], item: T, message?: string) {
    if (!array.includes(item)) {
      throw new Error(
        message || `Assertion failed: array does not contain ${item}`
      )
    }
  }
  
  static assertNotContains<T>(array: T[], item: T, message?: string) {
    if (array.includes(item)) {
      throw new Error(
        message || `Assertion failed: array should not contain ${item}`
      )
    }
  }
}

// Test runner
export class TestRunner {
  private suites: TestSuite[] = []
  private mockBuilder = new MockBuilder()
  
  addSuite(suite: TestSuite) {
    this.suites.push(suite)
  }
  
  async runSuite(suite: TestSuite): Promise<SuiteResult> {
    const startTime = performance.now()
    const results: TestResult[] = []
    
    logger.info(`Executando suite de testes: ${suite.name}`, {
      testsCount: suite.tests.length
    })
    
    try {
      // Setup da suite
      if (suite.beforeAll) {
        await suite.beforeAll()
      }
      
      // Executar testes
      for (const test of suite.tests) {
        if (test.skip) {
          results.push({
            name: test.name,
            status: 'skipped',
            duration: 0
          })
          continue
        }
        
        const testResult = await this.runTest(test, suite)
        results.push(testResult)
      }
      
      // Cleanup da suite
      if (suite.afterAll) {
        await suite.afterAll()
      }
    } catch (error) {
      logger.error(`Erro na execução da suite ${suite.name}`, {}, error as Error)
    }
    
    const duration = performance.now() - startTime
    const passed = results.filter(r => r.status === 'passed').length
    const failed = results.filter(r => r.status === 'failed').length
    const skipped = results.filter(r => r.status === 'skipped').length
    
    const suiteResult: SuiteResult = {
      name: suite.name,
      results,
      duration,
      passed,
      failed,
      skipped
    }
    
    logger.info(`Suite ${suite.name} concluída`, {
      duration: Math.round(duration),
      passed,
      failed,
      skipped
    })
    
    return suiteResult
  }
  
  private async runTest(test: TestCase, suite: TestSuite): Promise<TestResult> {
    const startTime = performance.now()
    const logs: string[] = []
    
    // Capturar logs durante o teste
    const originalLog = console.log
    console.log = (...args) => {
      logs.push(args.join(' '))
      originalLog(...args)
    }
    
    try {
      // Setup do teste
      if (suite.beforeEach) {
        await suite.beforeEach()
      }
      
      // Executar teste com timeout
      const timeout = test.timeout || 5000
      await Promise.race([
        Promise.resolve(test.fn()),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout)
        )
      ])
      
      // Cleanup do teste
      if (suite.afterEach) {
        await suite.afterEach()
      }
      
      const duration = performance.now() - startTime
      
      logger.debug(`Teste ${test.name} passou`, {
        duration: Math.round(duration)
      })
      
      return {
        name: test.name,
        status: 'passed',
        duration,
        logs
      }
    } catch (error) {
      const duration = performance.now() - startTime
      const testError = error as Error
      
      logger.error(`Teste ${test.name} falhou`, {
        duration: Math.round(duration),
        error: testError.message
      }, testError)
      
      monitoring.recordError({
        message: `Test failed: ${test.name}`,
        error: testError,
        type: 'test',
        context: {
          testName: test.name,
          suiteName: suite.name
        }
      })
      
      return {
        name: test.name,
        status: 'failed',
        duration,
        error: testError,
        logs
      }
    } finally {
      // Restaurar console.log
      console.log = originalLog
      
      // Limpar mocks
      this.mockBuilder.restore()
    }
  }
  
  async runAll(): Promise<SuiteResult[]> {
    const results: SuiteResult[] = []
    
    logger.info('Iniciando execução de todos os testes', {
      suitesCount: this.suites.length
    })
    
    for (const suite of this.suites) {
      const result = await this.runSuite(suite)
      results.push(result)
    }
    
    // Relatório final
    const totalTests = results.reduce((sum, r) => sum + r.results.length, 0)
    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0)
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0)
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
    
    logger.info('Execução de testes concluída', {
      totalTests,
      totalPassed,
      totalFailed,
      totalSkipped,
      totalDuration: Math.round(totalDuration),
      successRate: Math.round((totalPassed / totalTests) * 100)
    })
    
    return results
  }
  
  getMockBuilder(): MockBuilder {
    return this.mockBuilder
  }
}

// Utilitários para testes de componentes React
export class ReactTestUtils {
  static createMockProps<T extends Record<string, any>>(overrides?: Partial<T>): T {
    const defaultProps = {
      onClick: () => {},
      onChange: () => {},
      onSubmit: () => {},
      className: 'test-class',
      children: 'Test Content'
    }
    
    return { ...defaultProps, ...overrides } as T
  }
  
  static createMockUser() {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'student',
      school_id: 'test-school-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
  
  static createMockSupabaseClient() {
    return {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        onAuthStateChange: jest.fn()
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
      }))
    }
  }
}

// Instância global do test runner
export const testRunner = new TestRunner()
export const assert = Assertions
export const mockBuilder = testRunner.getMockBuilder()

// Funções de conveniência
export const describe = (name: string, fn: () => void) => {
  const suite: TestSuite = {
    name,
    tests: []
  }
  
  // Context para coletar testes
  const originalDescribe = (global as any).currentSuite
  ;(global as any).currentSuite = suite
  
  fn()
  
  ;(global as any).currentSuite = originalDescribe
  testRunner.addSuite(suite)
}

export const it = (name: string, fn: () => Promise<void> | void, options?: { timeout?: number; skip?: boolean }) => {
  const currentSuite = (global as any).currentSuite as TestSuite
  if (currentSuite) {
    currentSuite.tests.push({
      name,
      fn,
      timeout: options?.timeout,
      skip: options?.skip
    })
  }
}

export const beforeAll = (fn: () => Promise<void> | void) => {
  const currentSuite = (global as any).currentSuite as TestSuite
  if (currentSuite) {
    currentSuite.beforeAll = fn
  }
}

export const afterAll = (fn: () => Promise<void> | void) => {
  const currentSuite = (global as any).currentSuite as TestSuite
  if (currentSuite) {
    currentSuite.afterAll = fn
  }
}

export const beforeEach = (fn: () => Promise<void> | void) => {
  const currentSuite = (global as any).currentSuite as TestSuite
  if (currentSuite) {
    currentSuite.beforeEach = fn
  }
}

export const afterEach = (fn: () => Promise<void> | void) => {
  const currentSuite = (global as any).currentSuite as TestSuite
  if (currentSuite) {
    currentSuite.afterEach = fn
  }
}

// Executar testes apenas em desenvolvimento
if (config.isDevelopment && config.features.enableTesting) {
  // Auto-executar testes quando disponível
  if (typeof window !== 'undefined') {
    (window as any).runTests = () => testRunner.runAll()
    console.log('Testes disponíveis. Execute window.runTests() para executar todos os testes.')
  }
}