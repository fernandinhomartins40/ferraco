const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticateToken, requirePermission, requireRole } = require('../middleware/authMiddleware');
const { inputValidation } = require('../middleware/security');

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// ==========================================
// CRIAÇÃO DE BACKUPS
// ==========================================

/**
 * @route POST /api/backup/full
 * @desc Criar backup completo
 * @body includeFiles, compression
 * @access Private (Admin only)
 */
router.post('/full',
  requireRole('Admin'),
  inputValidation({
    body: {
      includeFiles: { type: 'boolean' },
      compression: { type: 'boolean' }
    }
  }),
  backupController.createFullBackup
);

/**
 * @route POST /api/backup/incremental
 * @desc Criar backup incremental
 * @body includeFiles, compression
 * @access Private (Admin only)
 */
router.post('/incremental',
  requireRole('Admin'),
  inputValidation({
    body: {
      includeFiles: { type: 'boolean' },
      compression: { type: 'boolean' }
    }
  }),
  backupController.createIncrementalBackup
);

// ==========================================
// CONSULTA DE BACKUPS
// ==========================================

/**
 * @route GET /api/backup/list
 * @desc Listar backups
 * @query type, status, startDate, endDate, page, limit
 * @access Private (Admin/Manager)
 */
router.get('/list',
  requirePermission('backup.read'),
  inputValidation({
    query: {
      type: { pattern: /^(full|incremental)$/ },
      status: { pattern: /^(completed|failed|in_progress)$/ },
      startDate: { type: 'date' },
      endDate: { type: 'date' },
      page: { type: 'int', min: 1 },
      limit: { type: 'int', min: 1, max: 100 }
    }
  }),
  backupController.listBackups
);

/**
 * @route GET /api/backup/:backupId
 * @desc Obter detalhes de um backup específico
 * @access Private (Admin/Manager)
 */
router.get('/:backupId',
  requirePermission('backup.read'),
  inputValidation({
    params: {
      backupId: { required: true, type: 'uuid' }
    }
  }),
  backupController.getBackupDetails
);

/**
 * @route GET /api/backup/stats
 * @desc Obter estatísticas de backup
 * @query period
 * @access Private (Admin/Manager)
 */
router.get('/stats',
  requirePermission('backup.read'),
  inputValidation({
    query: {
      period: { pattern: /^(day|week|month|quarter|year)$/ }
    }
  }),
  backupController.getBackupStats
);

/**
 * @route GET /api/backup/dashboard
 * @desc Dashboard de backup (resumo executivo)
 * @query period
 * @access Private (Admin/Manager)
 */
router.get('/dashboard',
  requirePermission('backup.read'),
  backupController.getBackupDashboard
);

// ==========================================
// OPERAÇÕES DE BACKUP
// ==========================================

/**
 * @route POST /api/backup/:backupId/restore
 * @desc Restaurar um backup
 * @body restoreDatabase, restoreFiles, confirmRestore
 * @access Private (Admin only)
 */
router.post('/:backupId/restore',
  requireRole('Admin'),
  inputValidation({
    params: {
      backupId: { required: true, type: 'uuid' }
    },
    body: {
      restoreDatabase: { type: 'boolean' },
      restoreFiles: { type: 'boolean' },
      confirmRestore: { required: true, type: 'boolean' }
    }
  }),
  backupController.restoreBackup
);

/**
 * @route DELETE /api/backup/:backupId
 * @desc Deletar um backup
 * @body confirmDelete
 * @access Private (Admin only)
 */
router.delete('/:backupId',
  requireRole('Admin'),
  inputValidation({
    params: {
      backupId: { required: true, type: 'uuid' }
    },
    body: {
      confirmDelete: { required: true, type: 'boolean' }
    }
  }),
  backupController.deleteBackup
);

/**
 * @route POST /api/backup/:backupId/verify
 * @desc Verificar integridade de um backup
 * @access Private (Admin/Manager)
 */
router.post('/:backupId/verify',
  requirePermission('backup.manage'),
  inputValidation({
    params: {
      backupId: { required: true, type: 'uuid' }
    }
  }),
  backupController.verifyBackup
);

// ==========================================
// CONFIGURAÇÕES E MANUTENÇÃO
// ==========================================

/**
 * @route GET /api/backup/settings
 * @desc Obter configurações de backup
 * @access Private (Admin/Manager)
 */
router.get('/settings',
  requirePermission('backup.read'),
  backupController.getBackupSettings
);

/**
 * @route PUT /api/backup/settings
 * @desc Atualizar configurações de backup
 * @body autoBackupEnabled, backupSchedule, retentionDays, maxBackups, compressionEnabled, webhookUrl
 * @access Private (Admin only)
 */
router.put('/settings',
  requireRole('Admin'),
  inputValidation({
    body: {
      autoBackupEnabled: { type: 'boolean' },
      backupSchedule: { pattern: /^(\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([12]?\d|3[01])) (\*|([1-9]|1[012])) (\*|[0-6])$/ },
      retentionDays: { type: 'int', min: 1, max: 3650 },
      maxBackups: { type: 'int', min: 1, max: 1000 },
      compressionEnabled: { type: 'boolean' },
      webhookUrl: { type: 'url' }
    }
  }),
  backupController.updateBackupSettings
);

/**
 * @route POST /api/backup/cleanup
 * @desc Limpar backups antigos
 * @body dryRun
 * @access Private (Admin only)
 */
router.post('/cleanup',
  requireRole('Admin'),
  inputValidation({
    body: {
      dryRun: { type: 'boolean' }
    }
  }),
  backupController.cleanupOldBackups
);

module.exports = router;