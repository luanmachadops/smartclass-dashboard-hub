import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { createMockUser, createMockSchool, createMockMetrics, createMockHealthCheck } from '../setup';

// Dados mock para testes
const mockUsers = [
  createMockUser({ id: '1', email: 'diretor@teste.com', tipo_usuario: 'diretor' }),
  createMockUser({ id: '2', email: 'professor@teste.com', tipo_usuario: 'professor' }),
  createMockUser({ id: '3', email: 'aluno@teste.com', tipo_usuario: 'aluno' }),
];

const mockSchools = [
  createMockSchool({ id: '1', nome: 'Escola Teste 1' }),
  createMockSchool({ id: '2', nome: 'Escola Teste 2' }),
];

const mockMetrics = createMockMetrics();
const mockHealthCheck = createMockHealthCheck();

// Handlers para diferentes endpoints
const handlers = [
  // Auth endpoints
  rest.post('*/auth/v1/signup', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: createMockUser(),
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
        },
      })
    );
  }),

  rest.post('*/auth/v1/token', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: createMockUser(),
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
        },
      })
    );
  }),

  rest.get('*/auth/v1/user', (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return res(
        ctx.status(401),
        ctx.json({ error: 'Unauthorized' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        user: createMockUser(),
      })
    );
  }),

  rest.post('*/auth/v1/logout', (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  // Database endpoints - Profiles
  rest.get('*/rest/v1/profiles', (req, res, ctx) => {
    const select = req.url.searchParams.get('select');
    const userId = req.url.searchParams.get('id');
    
    let data = mockUsers;
    
    if (userId) {
      data = mockUsers.filter(user => user.id === userId);
    }
    
    return res(
      ctx.status(200),
      ctx.json(data)
    );
  }),

  rest.post('*/rest/v1/profiles', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json(createMockUser())
    );
  }),

  rest.patch('*/rest/v1/profiles', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(createMockUser())
    );
  }),

  rest.delete('*/rest/v1/profiles', (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  // Database endpoints - Schools
  rest.get('*/rest/v1/schools', (req, res, ctx) => {
    const schoolId = req.url.searchParams.get('id');
    
    let data = mockSchools;
    
    if (schoolId) {
      data = mockSchools.filter(school => school.id === schoolId);
    }
    
    return res(
      ctx.status(200),
      ctx.json(data)
    );
  }),

  rest.post('*/rest/v1/schools', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json(createMockSchool())
    );
  }),

  rest.patch('*/rest/v1/schools', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(createMockSchool())
    );
  }),

  rest.delete('*/rest/v1/schools', (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  // Storage endpoints
  rest.post('*/storage/v1/object/*', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        Key: 'mock-file-key',
        Id: 'mock-file-id',
      })
    );
  }),

  rest.get('*/storage/v1/object/list/*', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          name: 'mock-file.jpg',
          id: 'mock-file-id',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
          metadata: {
            size: 1024,
            mimetype: 'image/jpeg',
          },
        },
      ])
    );
  }),

  rest.delete('*/storage/v1/object/*', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ message: 'Successfully deleted' })
    );
  }),

  // Realtime endpoints
  rest.get('*/realtime/v1/*', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ status: 'ok' })
    );
  }),

  // Custom API endpoints para métricas
  rest.get('/api/metrics/users', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockMetrics.users)
    );
  }),

  rest.get('/api/metrics/schools', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockMetrics.schools)
    );
  }),

  rest.get('/api/metrics/engagement', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockMetrics.engagement)
    );
  }),

  rest.get('/api/metrics/business', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockMetrics)
    );
  }),

  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockHealthCheck)
    );
  }),

  // Endpoints para simular erros
  rest.get('/api/error/500', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ error: 'Internal Server Error' })
    );
  }),

  rest.get('/api/error/404', (req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json({ error: 'Not Found' })
    );
  }),

  rest.get('/api/error/timeout', (req, res, ctx) => {
    return res(
      ctx.delay('infinite')
    );
  }),

  // Endpoints para simular rate limiting
  rest.post('/api/rate-limit', (req, res, ctx) => {
    return res(
      ctx.status(429),
      ctx.json({ error: 'Too Many Requests' })
    );
  }),

  // Endpoints para upload de arquivos
  rest.post('/api/upload', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        url: 'https://mock-storage.com/file.jpg',
        id: 'mock-file-id',
        name: 'file.jpg',
      })
    );
  }),

  // Endpoints para notificações
  rest.get('/api/notifications', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          title: 'Notificação Teste',
          message: 'Esta é uma notificação de teste',
          type: 'info',
          read: false,
          created_at: new Date().toISOString(),
        },
      ])
    );
  }),

  rest.patch('/api/notifications/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: req.params.id,
        read: true,
      })
    );
  }),

  // Endpoints para relatórios
  rest.get('/api/reports/users', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: mockUsers,
        total: mockUsers.length,
        page: 1,
        limit: 10,
      })
    );
  }),

  rest.get('/api/reports/schools', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: mockSchools,
        total: mockSchools.length,
        page: 1,
        limit: 10,
      })
    );
  }),

  // Endpoints para configurações
  rest.get('/api/settings', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        theme: 'light',
        language: 'pt-BR',
        notifications: true,
        autoSave: true,
      })
    );
  }),

  rest.patch('/api/settings', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Settings updated successfully',
      })
    );
  }),

  // Fallback para requisições não mapeadas
  rest.all('*', (req, res, ctx) => {
    console.warn(`Unhandled ${req.method} request to ${req.url}`);
    return res(
      ctx.status(404),
      ctx.json({ error: `Endpoint not found: ${req.method} ${req.url}` })
    );
  }),
];

// Handlers específicos para diferentes cenários de teste
export const errorHandlers = [
  rest.get('*/rest/v1/profiles', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ error: 'Database connection failed' })
    );
  }),

  rest.post('*/auth/v1/token', (req, res, ctx) => {
    return res(
      ctx.status(401),
      ctx.json({ error: 'Invalid credentials' })
    );
  }),
];

export const slowHandlers = [
  rest.get('*/rest/v1/profiles', (req, res, ctx) => {
    return res(
      ctx.delay(5000),
      ctx.status(200),
      ctx.json(mockUsers)
    );
  }),
];

export const emptyHandlers = [
  rest.get('*/rest/v1/profiles', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([])
    );
  }),

  rest.get('*/rest/v1/schools', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([])
    );
  }),
];

// Configurar servidor MSW
export const server = setupServer(...handlers);

// Utilitários para testes
export const resetToDefaultHandlers = () => {
  server.resetHandlers(...handlers);
};

export const useErrorHandlers = () => {
  server.use(...errorHandlers);
};

export const useSlowHandlers = () => {
  server.use(...slowHandlers);
};

export const useEmptyHandlers = () => {
  server.use(...emptyHandlers);
};

// Helpers para criar mocks customizados
export const createCustomHandler = (method: 'get' | 'post' | 'patch' | 'delete', url: string, response: any, status = 200) => {
  return rest[method](url, (req, res, ctx) => {
    return res(
      ctx.status(status),
      ctx.json(response)
    );
  });
};

export const createDelayedHandler = (method: 'get' | 'post' | 'patch' | 'delete', url: string, response: any, delay = 1000) => {
  return rest[method](url, (req, res, ctx) => {
    return res(
      ctx.delay(delay),
      ctx.status(200),
      ctx.json(response)
    );
  });
};

// Interceptadores para debugging
if (process.env.NODE_ENV === 'test' && process.env.VITEST_VERBOSE) {
  server.events.on('request:start', ({ request }) => {
    console.log('MSW intercepted:', request.method, request.url);
  });

  server.events.on('request:match', ({ request }) => {
    console.log('MSW matched:', request.method, request.url);
  });

  server.events.on('request:unhandled', ({ request }) => {
    console.warn('MSW unhandled:', request.method, request.url);
  });
}