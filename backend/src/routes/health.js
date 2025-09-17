/**
 * Health Check Routes
 * Provides system health and status information
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const fs = require('fs');
const path = require('path');
const healthController = require('../controllers/healthController');
const { authenticateToken, requirePermission, requireRole } = require('../middleware/authMiddleware');
const { inputValidation } = require('../middleware/security');

// Simple health check
router.get('/', (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      service: 'ferraco-crm-backend'
    };

    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Detailed health check
router.get('/detailed', (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Check disk space
    let diskSpace = {};
    try {
      const stats = fs.statSync(path.join(__dirname, '../..', 'data'));
      diskSpace = {
        available: true,
        path: path.join(__dirname, '../..', 'data'),
        accessible: stats.isDirectory()
      };
    } catch (error) {
      diskSpace = {
        available: false,
        error: 'Data directory not accessible'
      };
    }

    // Check if logs directory is writable
    let logsWritable = false;
    try {
      const logsDir = path.join(__dirname, '../..', 'logs');
      fs.accessSync(logsDir, fs.constants.W_OK);
      logsWritable = true;
    } catch (error) {
      logsWritable = false;
    }

    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: {
        name: 'ferraco-crm-backend',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: {
          seconds: Math.floor(process.uptime()),
          human: formatUptime(process.uptime())
        }
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        hostname: os.hostname(),
        loadAverage: os.loadavg(),
        cpus: os.cpus().length,
        totalMemory: formatBytes(os.totalmem()),
        freeMemory: formatBytes(os.freemem())
      },
      process: {
        pid: process.pid,
        memory: {
          rss: formatBytes(memoryUsage.rss),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsed: formatBytes(memoryUsage.heapUsed),
          external: formatBytes(memoryUsage.external)
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      },
      dependencies: {
        database: {
          type: 'SQLite',
          status: diskSpace.available ? 'connected' : 'error',
          path: './data/ferraco.db'
        },
        logs: {
          writable: logsWritable,
          path: './logs/'
        }
      },
      checks: [
        {
          name: 'disk_space',
          status: diskSpace.available ? 'pass' : 'fail',
          details: diskSpace
        },
        {
          name: 'logs_writable',
          status: logsWritable ? 'pass' : 'fail'
        },
        {
          name: 'memory_usage',
          status: (memoryUsage.heapUsed / memoryUsage.heapTotal) < 0.9 ? 'pass' : 'warn',
          usage: `${Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)}%`
        }
      ]
    };

    res.status(200).json(detailedHealth);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Readiness probe (for Kubernetes/Docker)
router.get('/ready', (req, res) => {
  try {
    // Check if all critical services are ready
    const checks = [];

    // Check data directory
    try {
      fs.accessSync(path.join(__dirname, '../..', 'data'), fs.constants.R_OK | fs.constants.W_OK);
      checks.push({ name: 'data_directory', status: 'ready' });
    } catch (error) {
      checks.push({ name: 'data_directory', status: 'not_ready', error: error.message });
    }

    // Check logs directory
    try {
      fs.accessSync(path.join(__dirname, '../..', 'logs'), fs.constants.W_OK);
      checks.push({ name: 'logs_directory', status: 'ready' });
    } catch (error) {
      checks.push({ name: 'logs_directory', status: 'not_ready', error: error.message });
    }

    const allReady = checks.every(check => check.status === 'ready');

    if (allReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        checks
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Liveness probe (for Kubernetes/Docker)
router.get('/live', (req, res) => {
  // Simple check to see if the process is alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Helper functions
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==========================================
// HEALTH CHECKS AVANÇADOS (AUTENTICADOS)
// ==========================================

/**
 * @route GET /api/health/full
 * @desc Verificação completa de saúde do sistema
 * @access Private (Admin/Manager)
 */
router.get('/full',
  authenticateToken,
  requirePermission('health.read'),
  healthController.fullHealthCheck
);

/**
 * @route GET /api/health/database
 * @desc Verificação específica de saúde do banco de dados
 * @access Private (Admin/Manager)
 */
router.get('/database',
  authenticateToken,
  requirePermission('health.read'),
  healthController.checkDatabaseHealth
);

/**
 * @route GET /api/health/system
 * @desc Verificação de recursos do sistema
 * @access Private (Admin/Manager)
 */
router.get('/system',
  authenticateToken,
  requirePermission('health.read'),
  healthController.checkSystemResources
);

// ==========================================
// HISTÓRICO E MÉTRICAS
// ==========================================

/**
 * @route GET /api/health/history
 * @desc Obtém histórico de saúde
 * @query period, limit
 * @access Private (Admin/Manager)
 */
router.get('/history',
  authenticateToken,
  requirePermission('health.read'),
  inputValidation({
    query: {
      period: { pattern: /^(hour|day|week|month|quarter|year)$/ },
      limit: { type: 'int', min: 1, max: 1000 }
    }
  }),
  healthController.getHealthHistory
);

/**
 * @route GET /api/health/metrics
 * @desc Obtém métricas de saúde
 * @query period
 * @access Private (Admin/Manager)
 */
router.get('/metrics',
  authenticateToken,
  requirePermission('health.read'),
  inputValidation({
    query: {
      period: { pattern: /^(hour|day|week|month|quarter|year)$/ }
    }
  }),
  healthController.getHealthMetrics
);

/**
 * @route GET /api/health/dashboard
 * @desc Dashboard de saúde (resumo executivo)
 * @query period
 * @access Private (Admin/Manager)
 */
router.get('/dashboard',
  authenticateToken,
  requirePermission('health.read'),
  inputValidation({
    query: {
      period: { pattern: /^(hour|day|week|month|quarter|year)$/ }
    }
  }),
  healthController.getHealthDashboard
);

// ==========================================
// GERENCIAMENTO DE SERVIÇOS
// ==========================================

/**
 * @route POST /api/health/services
 * @desc Registra um serviço para monitoramento
 * @body name, url, method, timeout, expectedStatus
 * @access Private (Admin only)
 */
router.post('/services',
  authenticateToken,
  requireRole('Admin'),
  inputValidation({
    body: {
      name: { required: true, minLength: 1, maxLength: 100, sanitize: true },
      url: { required: true, type: 'url' },
      method: { pattern: /^(GET|POST|PUT|DELETE|HEAD|OPTIONS)$/ },
      timeout: { type: 'int', min: 100, max: 30000 },
      expectedStatus: { type: 'int', min: 100, max: 599 }
    }
  }),
  healthController.registerService
);

/**
 * @route DELETE /api/health/services/:serviceName
 * @desc Remove um serviço do monitoramento
 * @access Private (Admin only)
 */
router.delete('/services/:serviceName',
  authenticateToken,
  requireRole('Admin'),
  inputValidation({
    params: {
      serviceName: { required: true, minLength: 1, maxLength: 100, sanitize: true }
    }
  }),
  healthController.unregisterService
);

// ==========================================
// ALIASES PARA COMPATIBILIDADE
// ==========================================

// Mapear rotas básicas para o controller avançado também
router.get('/readiness', healthController.readinessCheck);
router.get('/liveness', healthController.livenessCheck);

module.exports = router;