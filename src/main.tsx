import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Inicializar serviços
import { setupGlobalErrorHandling } from '@/services/logger'
import { monitoring } from '@/services/monitoring'
import { config } from '@/config/environment'

// Configurar tratamento global de erros
setupGlobalErrorHandling()

// Inicializar monitoramento
monitoring.init()

// Log de inicialização
console.log(`🚀 SmartClass Dashboard iniciando em modo ${config.mode}`)
console.log(`📊 Monitoramento: ${config.monitoring.enablePerformanceMonitoring ? 'Ativado' : 'Desativado'}`)
console.log(`🔧 Features ativas:`, Object.entries(config.features).filter(([, enabled]) => enabled).map(([feature]) => feature))

createRoot(document.getElementById("root")!).render(<App />)
