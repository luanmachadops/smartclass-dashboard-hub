import React, { createContext, useContext, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Accessibility, 
  Eye, 
  Volume2, 
  Keyboard, 
  MousePointer,
  Settings,
  X
} from 'lucide-react';
import { monitoring } from '@/services/monitoring';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  fontSize: number;
  focusIndicator: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetSettings: () => void;
  announceToScreenReader: (message: string) => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReader: false,
  keyboardNavigation: true,
  fontSize: 16,
  focusIndicator: true,
  colorBlindMode: 'none'
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility deve ser usado dentro de AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    applyAccessibilitySettings(settings);
    
    // Registra uso de recursos de acessibilidade
    monitoring.recordEvent({
      name: 'accessibility_settings_changed',
      properties: settings
    });
  }, [settings]);

  useEffect(() => {
    // Detecta preferências do sistema
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      largeText: window.matchMedia('(prefers-reduced-data: reduce)')
    };

    const handleMediaChange = () => {
      setSettings(prev => ({
        ...prev,
        reducedMotion: mediaQueries.reducedMotion.matches,
        highContrast: mediaQueries.highContrast.matches
      }));
    };

    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', handleMediaChange);
    });

    handleMediaChange();

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', handleMediaChange);
      });
    };
  }, []);

  const applyAccessibilitySettings = (settings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // Aplicar configurações de CSS
    root.style.setProperty('--font-size-base', `${settings.fontSize}px`);
    
    // Classes CSS condicionais
    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('large-text', settings.largeText);
    root.classList.toggle('reduced-motion', settings.reducedMotion);
    root.classList.toggle('focus-indicator', settings.focusIndicator);
    root.classList.toggle(`color-blind-${settings.colorBlindMode}`, settings.colorBlindMode !== 'none');
    
    // Configurações de navegação por teclado
    if (settings.keyboardNavigation) {
      root.setAttribute('data-keyboard-navigation', 'true');
    } else {
      root.removeAttribute('data-keyboard-navigation');
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    announceToScreenReader('Configurações de acessibilidade redefinidas para o padrão');
  };

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const togglePanel = () => {
    setShowPanel(!showPanel);
    announceToScreenReader(showPanel ? 'Painel de acessibilidade fechado' : 'Painel de acessibilidade aberto');
  };

  return (
    <AccessibilityContext.Provider value={{
      settings,
      updateSetting,
      resetSettings,
      announceToScreenReader
    }}>
      {children}
      
      {/* Botão flutuante de acessibilidade */}
      <Button
        onClick={togglePanel}
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0"
        aria-label="Abrir painel de acessibilidade"
        title="Configurações de Acessibilidade"
      >
        <Accessibility className="w-6 h-6" />
      </Button>

      {/* Painel de configurações */}
      {showPanel && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Accessibility className="w-5 h-5" />
                  Acessibilidade
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePanel}
                  aria-label="Fechar painel"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configurações visuais */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Visual
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="high-contrast">Alto Contraste</label>
                    <Switch
                      id="high-contrast"
                      checked={settings.highContrast}
                      onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="large-text">Texto Grande</label>
                    <Switch
                      id="large-text"
                      checked={settings.largeText}
                      onCheckedChange={(checked) => updateSetting('largeText', checked)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="font-size" className="block text-sm mb-2">
                      Tamanho da Fonte: {settings.fontSize}px
                    </label>
                    <Slider
                      id="font-size"
                      min={12}
                      max={24}
                      step={1}
                      value={[settings.fontSize]}
                      onValueChange={([value]) => updateSetting('fontSize', value)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="color-blind-mode" className="block text-sm mb-2">
                      Modo Daltonismo
                    </label>
                    <select
                      id="color-blind-mode"
                      value={settings.colorBlindMode}
                      onChange={(e) => updateSetting('colorBlindMode', e.target.value as any)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="none">Nenhum</option>
                      <option value="protanopia">Protanopia</option>
                      <option value="deuteranopia">Deuteranopia</option>
                      <option value="tritanopia">Tritanopia</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Configurações de movimento */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <MousePointer className="w-4 h-4" />
                  Movimento
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="reduced-motion">Movimento Reduzido</label>
                    <Switch
                      id="reduced-motion"
                      checked={settings.reducedMotion}
                      onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="focus-indicator">Indicador de Foco</label>
                    <Switch
                      id="focus-indicator"
                      checked={settings.focusIndicator}
                      onCheckedChange={(checked) => updateSetting('focusIndicator', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Configurações de navegação */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Keyboard className="w-4 h-4" />
                  Navegação
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="keyboard-navigation">Navegação por Teclado</label>
                    <Switch
                      id="keyboard-navigation"
                      checked={settings.keyboardNavigation}
                      onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="screen-reader">Leitor de Tela</label>
                    <Switch
                      id="screen-reader"
                      checked={settings.screenReader}
                      onCheckedChange={(checked) => updateSetting('screenReader', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Status das configurações */}
              <div>
                <h3 className="font-medium mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(settings).map(([key, value]) => {
                    if (typeof value === 'boolean' && value) {
                      return (
                        <Badge key={key} variant="secondary">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Badge>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Button onClick={resetSettings} variant="outline" className="flex-1">
                  Redefinir
                </Button>
                <Button onClick={togglePanel} className="flex-1">
                  Aplicar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Região para anúncios do leitor de tela */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" />
    </AccessibilityContext.Provider>
  );
};