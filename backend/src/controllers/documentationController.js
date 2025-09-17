const documentationService = require('../services/documentationService');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Documentation Controller
 * Controlador para geração e gerenciamento de documentação da API
 */
class DocumentationController {
  /**
   * Gera documentação completa da API
   */
  async generateCompleteDocumentation(req, res) {
    try {
      const result = await documentationService.generateCompleteDocumentation();

      logger.info('Complete API documentation generated', {
        requestedBy: req.user.id,
        endpoints: result.data.endpoints,
        schemas: result.data.schemas
      });

      res.status(200).json({
        success: true,
        message: 'Documentação completa gerada com sucesso',
        data: {
          endpoints: result.data.endpoints,
          schemas: result.data.schemas,
          files: result.data.files.map(file => path.basename(file))
        }
      });

    } catch (error) {
      logger.error('Error generating complete documentation:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao gerar documentação completa',
        error: error.message
      });
    }
  }

  /**
   * Gera documentação de um módulo específico
   */
  async generateModuleDocumentation(req, res) {
    try {
      const { moduleName } = req.params;

      const result = await documentationService.generateModuleDocumentation(moduleName);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.error,
          error: result.code
        });
      }

      logger.info('Module documentation generated', {
        requestedBy: req.user.id,
        module: moduleName,
        pathsCount: result.data.paths.length
      });

      res.status(200).json({
        success: true,
        message: `Documentação do módulo ${moduleName} gerada com sucesso`,
        data: result.data
      });

    } catch (error) {
      logger.error('Error generating module documentation:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao gerar documentação do módulo',
        error: error.message
      });
    }
  }

  /**
   * Exporta documentação em formato específico
   */
  async exportDocumentation(req, res) {
    try {
      const { format = 'json' } = req.query;

      const supportedFormats = ['json', 'yaml', 'html', 'markdown', 'all'];

      if (!supportedFormats.includes(format.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Formato não suportado',
          error: 'UNSUPPORTED_FORMAT',
          supportedFormats
        });
      }

      const result = await documentationService.exportDocumentation(format);

      logger.info('Documentation exported', {
        requestedBy: req.user.id,
        format,
        filesCount: result.data.files.length
      });

      res.status(200).json({
        success: true,
        message: `Documentação exportada em formato ${format} com sucesso`,
        data: {
          format: result.data.format,
          files: result.data.files.map(file => path.basename(file)),
          exportDir: result.data.exportDir
        }
      });

    } catch (error) {
      logger.error('Error exporting documentation:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao exportar documentação',
        error: error.message
      });
    }
  }

  /**
   * Serve documentação JSON (OpenAPI spec)
   */
  async serveApiSpec(req, res) {
    try {
      // Gerar documentação atualizada
      const result = await documentationService.generateCompleteDocumentation();

      res.status(200).json(result.data.documentation);

    } catch (error) {
      logger.error('Error serving API spec:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao servir especificação da API',
        error: error.message
      });
    }
  }

  /**
   * Serve página HTML da documentação
   */
  async serveDocumentationPage(req, res) {
    try {
      const docsPath = path.join(__dirname, '../../docs/api/api-docs.html');

      try {
        await fs.access(docsPath);
        res.sendFile(docsPath);
      } catch {
        // Se não existe, gerar documentação primeiro
        await documentationService.exportDocumentation('html');
        res.sendFile(docsPath);
      }

    } catch (error) {
      logger.error('Error serving documentation page:', error);

      res.status(500).send(`
        <html>
          <head><title>Erro na Documentação</title></head>
          <body>
            <h1>Erro ao carregar documentação</h1>
            <p>Por favor, tente novamente ou entre em contato com o suporte.</p>
            <p>Erro: ${error.message}</p>
          </body>
        </html>
      `);
    }
  }

  /**
   * Obtém estatísticas da documentação
   */
  async getDocumentationStats(req, res) {
    try {
      // Gerar documentação para obter estatísticas atualizadas
      const result = await documentationService.generateCompleteDocumentation();

      const stats = {
        endpoints: result.data.endpoints,
        schemas: result.data.schemas,
        modules: result.data.documentation.tags.length,
        lastGenerated: new Date().toISOString(),
        version: result.data.documentation.info.version,
        servers: result.data.documentation.servers.length
      };

      // Calcular estatísticas adicionais
      const paths = result.data.documentation.paths;
      const methodStats = {};
      let totalMethods = 0;

      Object.values(paths).forEach(pathMethods => {
        Object.keys(pathMethods).forEach(method => {
          methodStats[method.toUpperCase()] = (methodStats[method.toUpperCase()] || 0) + 1;
          totalMethods++;
        });
      });

      stats.methodStats = methodStats;
      stats.totalMethods = totalMethods;

      // Estatísticas por tag
      const tagStats = {};
      Object.values(paths).forEach(pathMethods => {
        Object.values(pathMethods).forEach(methodSpec => {
          if (methodSpec.tags) {
            methodSpec.tags.forEach(tag => {
              tagStats[tag] = (tagStats[tag] || 0) + 1;
            });
          }
        });
      });

      stats.tagStats = tagStats;

      logger.info('Documentation stats retrieved', {
        requestedBy: req.user?.id,
        endpoints: stats.endpoints,
        schemas: stats.schemas
      });

      res.status(200).json({
        success: true,
        message: 'Estatísticas da documentação recuperadas com sucesso',
        data: stats
      });

    } catch (error) {
      logger.error('Error getting documentation stats:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar estatísticas da documentação',
        error: error.message
      });
    }
  }

  /**
   * Lista arquivos de documentação disponíveis
   */
  async listDocumentationFiles(req, res) {
    try {
      const docsDir = path.join(__dirname, '../../docs');
      const apiDocsDir = path.join(docsDir, 'api');

      const files = [];

      // Verificar diretório principal
      try {
        const mainFiles = await fs.readdir(docsDir);
        for (const file of mainFiles) {
          const filePath = path.join(docsDir, file);
          const stats = await fs.stat(filePath);

          if (stats.isFile()) {
            files.push({
              name: file,
              path: `/docs/${file}`,
              size: stats.size,
              modified: stats.mtime,
              type: 'main'
            });
          }
        }
      } catch {
        // Diretório não existe
      }

      // Verificar diretório de API
      try {
        const apiFiles = await fs.readdir(apiDocsDir);
        for (const file of apiFiles) {
          const filePath = path.join(apiDocsDir, file);
          const stats = await fs.stat(filePath);

          if (stats.isFile()) {
            files.push({
              name: file,
              path: `/docs/api/${file}`,
              size: stats.size,
              modified: stats.mtime,
              type: 'api'
            });
          }
        }
      } catch {
        // Diretório não existe
      }

      logger.info('Documentation files listed', {
        requestedBy: req.user?.id,
        filesCount: files.length
      });

      res.status(200).json({
        success: true,
        message: 'Arquivos de documentação listados com sucesso',
        data: {
          files,
          total: files.length,
          directories: {
            main: docsDir,
            api: apiDocsDir
          }
        }
      });

    } catch (error) {
      logger.error('Error listing documentation files:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao listar arquivos de documentação',
        error: error.message
      });
    }
  }

  /**
   * Dashboard de documentação (resumo executivo)
   */
  async getDocumentationDashboard(req, res) {
    try {
      // Obter dados do dashboard em paralelo
      const [statsResult, filesResult] = await Promise.all([
        this._getStatsData(),
        this._getFilesData()
      ]);

      const dashboard = {
        overview: statsResult,
        files: filesResult,
        quickActions: [
          {
            name: 'Gerar Documentação Completa',
            endpoint: 'POST /api/docs/generate',
            description: 'Regenera toda a documentação da API'
          },
          {
            name: 'Exportar JSON',
            endpoint: 'GET /api/docs/export?format=json',
            description: 'Exporta especificação OpenAPI em JSON'
          },
          {
            name: 'Exportar HTML',
            endpoint: 'GET /api/docs/export?format=html',
            description: 'Gera documentação interativa em HTML'
          },
          {
            name: 'Ver Documentação',
            endpoint: 'GET /api-docs',
            description: 'Acessa documentação interativa'
          }
        ],
        recommendations: this._generateDocumentationRecommendations(statsResult, filesResult),
        lastUpdated: new Date().toISOString()
      };

      logger.info('Documentation dashboard retrieved', {
        requestedBy: req.user.id,
        endpoints: dashboard.overview.endpoints,
        filesCount: dashboard.files.total
      });

      res.status(200).json({
        success: true,
        message: 'Dashboard de documentação recuperado com sucesso',
        data: dashboard
      });

    } catch (error) {
      logger.error('Error getting documentation dashboard:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar dashboard de documentação',
        error: error.message
      });
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Obtém dados estatísticos
   */
  async _getStatsData() {
    try {
      const result = await documentationService.generateCompleteDocumentation();
      return {
        endpoints: result.data.endpoints,
        schemas: result.data.schemas,
        modules: result.data.documentation.tags.length,
        version: result.data.documentation.info.version
      };
    } catch {
      return {
        endpoints: 0,
        schemas: 0,
        modules: 0,
        version: '1.0.0'
      };
    }
  }

  /**
   * Obtém dados de arquivos
   */
  async _getFilesData() {
    try {
      const docsDir = path.join(__dirname, '../../docs');
      const files = await fs.readdir(docsDir).catch(() => []);

      return {
        total: files.length,
        lastGenerated: files.length > 0 ? new Date().toISOString() : null
      };
    } catch {
      return {
        total: 0,
        lastGenerated: null
      };
    }
  }

  /**
   * Gera recomendações baseadas nos dados
   */
  _generateDocumentationRecommendations(stats, files) {
    const recommendations = [];

    // Recomendação sobre documentação desatualizada
    if (!files.lastGenerated) {
      recommendations.push({
        type: 'generation',
        priority: 'high',
        message: 'Documentação não foi gerada ainda. Execute a geração completa.'
      });
    }

    // Recomendação sobre número de endpoints
    if (stats.endpoints < 10) {
      recommendations.push({
        type: 'coverage',
        priority: 'medium',
        message: 'Poucos endpoints documentados. Verifique se toda a API está coberta.'
      });
    }

    // Recomendação sobre schemas
    if (stats.schemas < 5) {
      recommendations.push({
        type: 'schemas',
        priority: 'medium',
        message: 'Poucos schemas definidos. Considere adicionar mais modelos de dados.'
      });
    }

    // Recomendação sobre arquivos
    if (files.total === 0) {
      recommendations.push({
        type: 'export',
        priority: 'medium',
        message: 'Nenhum arquivo de documentação exportado. Considere exportar em diferentes formatos.'
      });
    }

    return recommendations;
  }
}

module.exports = new DocumentationController();