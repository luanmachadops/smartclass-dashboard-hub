import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { monitoring } from '@/services/monitoring';

interface BundleInfo {
  size: number;
  gzipSize: number;
  chunks: ChunkInfo[];
  recommendations: string[];
}

interface ChunkInfo {
  name: string;
  size: number;
  modules: string[];
  isLazy: boolean;
}

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export const BundleAnalyzer = () => {
  const [bundleInfo, setBundleInfo] = useState<BundleInfo | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    analyzeBundlePerformance();
    collectPerformanceMetrics();
  }, []);

  const analyzeBundlePerformance = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simula análise do bundle (em produção, isso viria de uma API ou ferramenta de build)
      const mockBundleInfo: BundleInfo = {
        size: 2.5 * 1024 * 1024, // 2.5MB
        gzipSize: 800 * 1024, // 800KB
        chunks: [
          {
            name: 'main',
            size: 500 * 1024,
            modules: ['react', 'react-dom', 'react-router-dom'],
            isLazy: false
          },
          {
            name: 'dashboard',
            size: 300 * 1024,
            modules: ['recharts', 'date-fns'],
            isLazy: true
          },
          {
            name: 'forms',
            size: 200 * 1024,
            modules: ['react-hook-form', 'zod'],
            isLazy: true
          }
        ],
        recommendations: [
          'Considere usar tree-shaking para remover código não utilizado',
          'Implemente code splitting mais granular',
          'Otimize imagens e assets estáticos',
          'Use compressão Brotli no servidor'
        ]
      };

      setBundleInfo(mockBundleInfo);
      
      // Registra métricas no sistema de monitoramento
      monitoring.recordMetric('bundle_size', mockBundleInfo.size);
      monitoring.recordMetric('bundle_gzip_size', mockBundleInfo.gzipSize);
      
    } catch (error) {
      monitoring.recordError({
        message: 'Erro ao analisar bundle',
        type: 'bundle_analysis',
        context: { error }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const collectPerformanceMetrics = () => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      const lcp = 0; // Seria coletado via PerformanceObserver
      const fid = 0; // Seria coletado via PerformanceObserver
      const cls = 0; // Seria coletado via PerformanceObserver
      const ttfb = navigation.responseStart - navigation.requestStart;

      const metrics: PerformanceMetrics = {
        fcp,
        lcp,
        fid,
        cls,
        ttfb
      };

      setPerformanceMetrics(metrics);
      
      // Registra métricas de performance
      Object.entries(metrics).forEach(([key, value]) => {
        monitoring.recordMetric(`performance_${key}`, value);
      });
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPerformanceScore = (metric: number, thresholds: [number, number]): 'good' | 'needs-improvement' | 'poor' => {
    if (metric <= thresholds[0]) return 'good';
    if (metric <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  };

  const getScoreColor = (score: string): string => {
    switch (score) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Analisando Bundle...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações do Bundle */}
      {bundleInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Análise do Bundle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tamanho Total</p>
                <p className="text-2xl font-bold">{formatBytes(bundleInfo.size)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tamanho Comprimido (Gzip)</p>
                <p className="text-2xl font-bold">{formatBytes(bundleInfo.gzipSize)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">Taxa de Compressão</p>
              <Progress 
                value={(bundleInfo.gzipSize / bundleInfo.size) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {((bundleInfo.gzipSize / bundleInfo.size) * 100).toFixed(1)}% do tamanho original
              </p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Chunks</p>
              <div className="space-y-2">
                {bundleInfo.chunks.map((chunk) => (
                  <div key={chunk.name} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{chunk.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {chunk.modules.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={chunk.isLazy ? 'default' : 'secondary'}>
                        {chunk.isLazy ? 'Lazy' : 'Eager'}
                      </Badge>
                      <span className="text-sm">{formatBytes(chunk.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas de Performance */}
      {performanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Métricas de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">First Contentful Paint</p>
                <p className={`text-lg font-bold ${getScoreColor(getPerformanceScore(performanceMetrics.fcp, [1800, 3000]))}`}>
                  {performanceMetrics.fcp.toFixed(0)}ms
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time to First Byte</p>
                <p className={`text-lg font-bold ${getScoreColor(getPerformanceScore(performanceMetrics.ttfb, [800, 1800]))}`}>
                  {performanceMetrics.ttfb.toFixed(0)}ms
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Largest Contentful Paint</p>
                <p className={`text-lg font-bold ${getScoreColor(getPerformanceScore(performanceMetrics.lcp, [2500, 4000]))}`}>
                  {performanceMetrics.lcp.toFixed(0)}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {bundleInfo && bundleInfo.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Recomendações de Otimização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bundleInfo.recommendations.map((recommendation, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{recommendation}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};