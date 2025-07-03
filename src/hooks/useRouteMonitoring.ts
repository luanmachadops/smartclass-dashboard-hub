import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { monitoring } from '@/services/monitoring';

export const useRouteMonitoring = () => {
  const location = useLocation();

  useEffect(() => {
    // Registra a navegação para a nova rota
    monitoring.recordEvent({
      name: 'route_navigation',
      properties: {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
        timestamp: new Date().toISOString(),
        referrer: document.referrer
      }
    });

    // Registra métricas de performance da página
    const startTime = performance.now();
    
    const recordPageLoad = () => {
      const loadTime = performance.now() - startTime;
      monitoring.recordMetric('page_load_time', loadTime, {
        pathname: location.pathname
      });
    };

    // Registra o tempo de carregamento quando a página estiver completamente carregada
    if (document.readyState === 'complete') {
      recordPageLoad();
    } else {
      window.addEventListener('load', recordPageLoad);
      return () => window.removeEventListener('load', recordPageLoad);
    }
  }, [location]);

  return {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash
  };
};