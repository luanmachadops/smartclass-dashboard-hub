// Componente para gerenciar integrações
// Criado em: 2025-01-18
// Descrição: Interface para configurar e gerenciar integrações com APIs externas

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Timeline as TimelineIcon,
  Webhook as WebhookIcon,
  Api as ApiIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useIntegrationService } from '../../hooks/useIntegrationService';
import {
  Integration,
  IntegrationType,
  SyncStatus,
  IntegrationTemplate,
  SyncResult,
  IntegrationStats,
  SyncLog,
  WebhookLog,
  IntegrationAlert
} from '../../types/integration';
import { formatDate, formatDuration } from '../../utils/dateUtils';
import { formatBytes } from '../../utils/formatUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`integration-tabpanel-${index}`}
      aria-labelledby={`integration-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const IntegrationManager: React.FC = () => {
  const {
    integrations,
    loading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testConnection,
    syncIntegration,
    pauseIntegration,
    resumeIntegration,
    getStats,
    refresh
  } = useIntegrationService();

  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<Partial<Integration>>({});
  const [showCredentials, setShowCredentials] = useState(false);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [alerts, setAlerts] = useState<IntegrationAlert[]>([]);
  const [templates, setTemplates] = useState<IntegrationTemplate[]>([]);
  const [syncingIntegrations, setSyncingIntegrations] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await refresh();
      // Carregar dados adicionais
      // const statsData = await getStats();
      // setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (mode: 'create' | 'edit' | 'view', integration?: Integration) => {
    setDialogMode(mode);
    setSelectedIntegration(integration || null);
    setFormData(integration || {
      name: '',
      type: IntegrationType.PAYMENT,
      provider: '',
      description: '',
      isActive: true,
      config: {},
      credentials: {},
      syncStatus: SyncStatus.IDLE
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedIntegration(null);
    setFormData({});
    setShowCredentials(false);
  };

  const handleSaveIntegration = async () => {
    try {
      if (dialogMode === 'create') {
        await createIntegration(formData as Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>);
      } else if (dialogMode === 'edit' && selectedIntegration) {
        await updateIntegration(selectedIntegration.id, formData);
      }
      handleCloseDialog();
      await refresh();
    } catch (error) {
      console.error('Erro ao salvar integração:', error);
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta integração?')) {
      try {
        await deleteIntegration(id);
        await refresh();
      } catch (error) {
        console.error('Erro ao excluir integração:', error);
      }
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      const result = await testConnection(id);
      alert(result ? 'Conexão bem-sucedida!' : 'Falha na conexão!');
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      alert('Erro ao testar conexão!');
    }
  };

  const handleSyncIntegration = async (id: string) => {
    try {
      setSyncingIntegrations(prev => new Set(prev).add(id));
      const result = await syncIntegration(id);
      alert(`Sincronização concluída! ${result.recordsProcessed} registros processados.`);
    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro na sincronização!');
    } finally {
      setSyncingIntegrations(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleToggleIntegration = async (id: string, isActive: boolean) => {
    try {
      if (isActive) {
        await resumeIntegration(id);
      } else {
        await pauseIntegration(id);
      }
      await refresh();
    } catch (error) {
      console.error('Erro ao alterar status da integração:', error);
    }
  };

  const getStatusColor = (status: SyncStatus) => {
    switch (status) {
      case SyncStatus.SUCCESS:
        return 'success';
      case SyncStatus.ERROR:
        return 'error';
      case SyncStatus.SYNCING:
        return 'warning';
      case SyncStatus.PAUSED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: SyncStatus) => {
    switch (status) {
      case SyncStatus.SUCCESS:
        return <CheckCircleIcon />;
      case SyncStatus.ERROR:
        return <ErrorIcon />;
      case SyncStatus.SYNCING:
        return <SyncIcon />;
      case SyncStatus.PAUSED:
        return <PauseIcon />;
      default:
        return <PlayIcon />;
    }
  };

  const getTypeIcon = (type: IntegrationType) => {
    switch (type) {
      case IntegrationType.PAYMENT:
        return '💳';
      case IntegrationType.EMAIL:
        return '📧';
      case IntegrationType.SMS:
        return '📱';
      case IntegrationType.CALENDAR:
        return '📅';
      case IntegrationType.VIDEO_CONFERENCE:
        return '🎥';
      case IntegrationType.STORAGE:
        return '☁️';
      case IntegrationType.ANALYTICS:
        return '📊';
      default:
        return '🔧';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Carregando integrações...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gerenciar Integrações
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Nova Integração
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Integrações" icon={<ApiIcon />} />
          <Tab label="Logs de Sincronização" icon={<TimelineIcon />} />
          <Tab label="Webhooks" icon={<WebhookIcon />} />
          <Tab label="Alertas" icon={<WarningIcon />} />
          <Tab label="Estatísticas" icon={<SpeedIcon />} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {integrations.map((integration) => (
            <Grid item xs={12} md={6} lg={4} key={integration.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ mr: 1 }}>
                      {getTypeIcon(integration.type)} {integration.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={integration.provider}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {integration.description || 'Sem descrição'}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      size="small"
                      icon={getStatusIcon(integration.syncStatus)}
                      label={integration.syncStatus}
                      color={getStatusColor(integration.syncStatus) as any}
                      sx={{ mr: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={integration.isActive}
                          onChange={(e) => handleToggleIntegration(integration.id, e.target.checked)}
                          size="small"
                        />
                      }
                      label="Ativo"
                    />
                  </Box>

                  {integration.lastSync && (
                    <Typography variant="caption" color="text.secondary">
                      Última sincronização: {formatDate(integration.lastSync)}
                    </Typography>
                  )}

                  {integration.lastError && (
                    <Alert severity="error" sx={{ mt: 1, fontSize: '0.75rem' }}>
                      {integration.lastError}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Box>
                      <Tooltip title="Visualizar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('view', integration)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('edit', integration)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteIntegration(integration.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box>
                      <Tooltip title="Testar Conexão">
                        <IconButton
                          size="small"
                          onClick={() => handleTestConnection(integration.id)}
                        >
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sincronizar">
                        <IconButton
                          size="small"
                          onClick={() => handleSyncIntegration(integration.id)}
                          disabled={syncingIntegrations.has(integration.id)}
                        >
                          <SyncIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {integrations.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              Nenhuma integração configurada
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Comece criando sua primeira integração
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
            >
              Criar Integração
            </Button>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Integração</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Registros</TableCell>
                <TableCell>Duração</TableCell>
                <TableCell>Iniciado em</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {syncLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {integrations.find(i => i.id === log.integrationId)?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={log.success ? <CheckCircleIcon /> : <ErrorIcon />}
                      label={log.success ? 'Sucesso' : 'Erro'}
                      color={log.success ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    {log.recordsProcessed} processados
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {log.recordsCreated} criados, {log.recordsUpdated} atualizados
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDuration(log.duration)}</TableCell>
                  <TableCell>{formatDate(log.startedAt)}</TableCell>
                  <TableCell>
                    <IconButton size="small">
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Integração</TableCell>
                <TableCell>Evento</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Tempo de Resposta</TableCell>
                <TableCell>Processado em</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {webhookLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {integrations.find(i => i.id === log.integrationId)?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{log.payload.event}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={log.success ? <CheckCircleIcon /> : <ErrorIcon />}
                      label={log.success ? 'Sucesso' : 'Erro'}
                      color={log.success ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>{log.responseTime}ms</TableCell>
                  <TableCell>{formatDate(log.processedAt)}</TableCell>
                  <TableCell>
                    <IconButton size="small">
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <List>
          {alerts.map((alert) => (
            <ListItem key={alert.id}>
              <ListItemIcon>
                <WarningIcon color={alert.severity === 'critical' ? 'error' : 'warning'} />
              </ListItemIcon>
              <ListItemText
                primary={alert.message}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {integrations.find(i => i.id === alert.integrationId)?.name || 'N/A'}
                    </Typography>
                    {' — '}{formatDate(alert.createdAt)}
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Chip
                  size="small"
                  label={alert.severity}
                  color={alert.severity === 'critical' ? 'error' : 'warning'}
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {stats && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Total de Integrações</Typography>
                  <Typography variant="h4">{stats.totalIntegrations}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.activeIntegrations} ativas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Sincronizações</Typography>
                  <Typography variant="h4">{stats.totalSyncs}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.successfulSyncs} bem-sucedidas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Webhooks</Typography>
                  <Typography variant="h4">{stats.totalWebhooks}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.successfulWebhooks} bem-sucedidos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Taxa de Erro</Typography>
                  <Typography variant="h4">{(stats.averageErrorRate * 100).toFixed(2)}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Média geral
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Dialog para criar/editar integração */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Nova Integração' : 
           dialogMode === 'edit' ? 'Editar Integração' : 'Visualizar Integração'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as IntegrationType })}
                  disabled={dialogMode === 'view'}
                >
                  {Object.values(IntegrationType).map((type) => (
                    <MenuItem key={type} value={type}>
                      {getTypeIcon(type)} {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Provedor"
                value={formData.provider || ''}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive || false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    disabled={dialogMode === 'view'}
                  />
                }
                label="Ativo"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descrição"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>

            {/* Configurações */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Configurações</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Configuração (JSON)"
                    value={JSON.stringify(formData.config || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const config = JSON.parse(e.target.value);
                        setFormData({ ...formData, config });
                      } catch (error) {
                        // Ignorar erro de parsing durante digitação
                      }
                    }}
                    disabled={dialogMode === 'view'}
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Credenciais */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SecurityIcon sx={{ mr: 1 }} />
                    <Typography>Credenciais</Typography>
                    <IconButton
                      size="small"
                      onClick={() => setShowCredentials(!showCredentials)}
                      sx={{ ml: 1 }}
                    >
                      {showCredentials ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Credenciais (JSON)"
                    type={showCredentials ? 'text' : 'password'}
                    value={JSON.stringify(formData.credentials || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const credentials = JSON.parse(e.target.value);
                        setFormData({ ...formData, credentials });
                      } catch (error) {
                        // Ignorar erro de parsing durante digitação
                      }
                    }}
                    disabled={dialogMode === 'view'}
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSaveIntegration} variant="contained">
              Salvar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegrationManager;