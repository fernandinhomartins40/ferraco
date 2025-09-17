const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Documentation Service
 * Serviço para geração automática de documentação da API
 */
class DocumentationService {
  constructor() {
    this.apiSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Ferraco CRM API',
        version: '1.0.0',
        description: 'API completa para sistema CRM Ferraco com funcionalidades avançadas de segurança, auditoria e backup',
        contact: {
          name: 'Equipe Ferraco',
          email: 'dev@ferraco.com'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Servidor de desenvolvimento'
        },
        {
          url: 'https://api.ferraco.com',
          description: 'Servidor de produção'
        }
      ],
      paths: {},
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: {},
        responses: {},
        parameters: {}
      },
      security: [
        {
          bearerAuth: []
        }
      ],
      tags: []
    };

    this.initializeDocumentation();
  }

  /**
   * Gera documentação completa da API
   */
  async generateCompleteDocumentation() {
    try {
      // Gerar documentação para cada módulo
      await this._generateAuthDocumentation();
      await this._generateUsersDocumentation();
      await this._generateLeadsDocumentation();
      await this._generateAuditDocumentation();
      await this._generateBackupDocumentation();
      await this._generateHealthDocumentation();
      await this._generatePermissionsDocumentation();

      // Adicionar schemas comuns
      this._addCommonSchemas();

      // Adicionar respostas padrão
      this._addCommonResponses();

      // Salvar documentação
      const documentation = await this._saveDocumentation();

      logger.info('Complete API documentation generated');

      return {
        success: true,
        data: {
          documentation: this.apiSpec,
          files: documentation.files,
          endpoints: Object.keys(this.apiSpec.paths).length,
          schemas: Object.keys(this.apiSpec.components.schemas).length
        }
      };

    } catch (error) {
      logger.error('Error generating documentation:', error);
      throw error;
    }
  }

  /**
   * Gera documentação específica de um módulo
   */
  async generateModuleDocumentation(moduleName) {
    try {
      const methodName = `_generate${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Documentation`;

      if (typeof this[methodName] === 'function') {
        await this[methodName]();

        return {
          success: true,
          data: {
            module: moduleName,
            paths: this._getModulePaths(moduleName)
          }
        };
      } else {
        return {
          success: false,
          error: 'Módulo não encontrado',
          code: 'MODULE_NOT_FOUND'
        };
      }

    } catch (error) {
      logger.error(`Error generating ${moduleName} documentation:`, error);
      throw error;
    }
  }

  /**
   * Exporta documentação em diferentes formatos
   */
  async exportDocumentation(format = 'json') {
    try {
      const exportDir = path.join(__dirname, '../../docs/api');
      await fs.mkdir(exportDir, { recursive: true });

      let exportedFiles = [];

      switch (format.toLowerCase()) {
        case 'json':
          const jsonFile = path.join(exportDir, 'api-spec.json');
          await fs.writeFile(jsonFile, JSON.stringify(this.apiSpec, null, 2), 'utf8');
          exportedFiles.push(jsonFile);
          break;

        case 'yaml':
          const yaml = this._convertToYaml(this.apiSpec);
          const yamlFile = path.join(exportDir, 'api-spec.yaml');
          await fs.writeFile(yamlFile, yaml, 'utf8');
          exportedFiles.push(yamlFile);
          break;

        case 'html':
          const html = await this._generateHtmlDocumentation();
          const htmlFile = path.join(exportDir, 'api-docs.html');
          await fs.writeFile(htmlFile, html, 'utf8');
          exportedFiles.push(htmlFile);
          break;

        case 'markdown':
          const markdown = await this._generateMarkdownDocumentation();
          const mdFile = path.join(exportDir, 'API.md');
          await fs.writeFile(mdFile, markdown, 'utf8');
          exportedFiles.push(mdFile);
          break;

        case 'all':
          // Exportar todos os formatos
          const allFormats = await Promise.all([
            this.exportDocumentation('json'),
            this.exportDocumentation('yaml'),
            this.exportDocumentation('html'),
            this.exportDocumentation('markdown')
          ]);
          exportedFiles = allFormats.reduce((acc, result) => [...acc, ...result.data.files], []);
          break;

        default:
          throw new Error(`Formato não suportado: ${format}`);
      }

      logger.info('Documentation exported', { format, files: exportedFiles });

      return {
        success: true,
        data: {
          format,
          files: exportedFiles,
          exportDir
        }
      };

    } catch (error) {
      logger.error('Error exporting documentation:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS - INICIALIZAÇÃO
  // ==========================================

  /**
   * Inicializa estrutura básica da documentação
   */
  initializeDocumentation() {
    this.apiSpec.tags = [
      { name: 'Authentication', description: 'Endpoints de autenticação e autorização' },
      { name: 'Users', description: 'Gerenciamento de usuários' },
      { name: 'Leads', description: 'Gerenciamento de leads' },
      { name: 'Audit', description: 'Logs e auditoria do sistema' },
      { name: 'Backup', description: 'Sistema de backup automático' },
      { name: 'Health', description: 'Monitoramento de saúde do sistema' },
      { name: 'Permissions', description: 'Sistema de permissões granulares' }
    ];
  }

  // ==========================================
  // MÉTODOS PRIVADOS - GERAÇÃO POR MÓDULO
  // ==========================================

  /**
   * Gera documentação de autenticação
   */
  async _generateAuthDocumentation() {
    this.apiSpec.paths['/api/auth/login'] = {
      post: {
        tags: ['Authentication'],
        summary: 'Fazer login no sistema',
        description: 'Autentica usuário e retorna token JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@ferraco.com' },
                  password: { type: 'string', minLength: 6, example: 'senha123' },
                  rememberMe: { type: 'boolean', default: false }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login realizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginResponse'
                }
              }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          400: { $ref: '#/components/responses/BadRequest' }
        },
        security: []
      }
    };

    this.apiSpec.paths['/api/auth/register'] = {
      post: {
        tags: ['Authentication'],
        summary: 'Registrar novo usuário',
        description: 'Cria nova conta de usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserRegistration'
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Usuário registrado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UserResponse'
                }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          409: { $ref: '#/components/responses/Conflict' }
        },
        security: []
      }
    };

    this.apiSpec.paths['/api/auth/logout'] = {
      post: {
        tags: ['Authentication'],
        summary: 'Fazer logout',
        description: 'Invalida sessão atual',
        responses: {
          200: { $ref: '#/components/responses/Success' },
          401: { $ref: '#/components/responses/Unauthorized' }
        }
      }
    };
  }

  /**
   * Gera documentação de usuários
   */
  async _generateUsersDocumentation() {
    this.apiSpec.paths['/api/users'] = {
      get: {
        tags: ['Users'],
        summary: 'Listar usuários',
        description: 'Obtém lista paginada de usuários',
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          {
            name: 'search',
            in: 'query',
            description: 'Termo de busca',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Lista de usuários',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UsersListResponse'
                }
              }
            }
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        tags: ['Users'],
        summary: 'Criar usuário',
        description: 'Cria novo usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserCreation'
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Usuário criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UserResponse'
                }
              }
            }
          },
          400: { $ref: '#/components/responses/BadRequest' },
          409: { $ref: '#/components/responses/Conflict' }
        }
      }
    };
  }

  /**
   * Gera documentação de leads
   */
  async _generateLeadsDocumentation() {
    this.apiSpec.paths['/api/leads'] = {
      get: {
        tags: ['Leads'],
        summary: 'Listar leads',
        description: 'Obtém lista paginada de leads com filtros',
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          {
            name: 'status',
            in: 'query',
            description: 'Status do lead',
            schema: {
              type: 'string',
              enum: ['novo', 'contatado', 'qualificado', 'proposta', 'fechado', 'perdido']
            }
          },
          {
            name: 'fonte',
            in: 'query',
            description: 'Fonte do lead',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Lista de leads',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LeadsListResponse'
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Leads'],
        summary: 'Criar lead',
        description: 'Cria novo lead',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LeadCreation'
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Lead criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LeadResponse'
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Gera documentação de auditoria
   */
  async _generateAuditDocumentation() {
    this.apiSpec.paths['/api/audit/logs'] = {
      get: {
        tags: ['Audit'],
        summary: 'Listar logs de auditoria',
        description: 'Obtém logs de auditoria com filtros avançados',
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          {
            name: 'action',
            in: 'query',
            description: 'Ação executada',
            schema: { type: 'string' }
          },
          {
            name: 'userId',
            in: 'query',
            description: 'ID do usuário',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          200: {
            description: 'Lista de logs de auditoria',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuditLogsResponse'
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Gera documentação de backup
   */
  async _generateBackupDocumentation() {
    this.apiSpec.paths['/api/backup/full'] = {
      post: {
        tags: ['Backup'],
        summary: 'Criar backup completo',
        description: 'Inicia processo de backup completo do sistema',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  includeFiles: { type: 'boolean', default: true },
                  compression: { type: 'boolean', default: true }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Backup iniciado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/BackupResponse'
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Gera documentação de health checks
   */
  async _generateHealthDocumentation() {
    this.apiSpec.paths['/api/health'] = {
      get: {
        tags: ['Health'],
        summary: 'Health check básico',
        description: 'Verifica se o sistema está funcionando',
        responses: {
          200: {
            description: 'Sistema operacional',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse'
                }
              }
            }
          },
          503: {
            description: 'Sistema com problemas'
          }
        },
        security: []
      }
    };

    this.apiSpec.paths['/api/health/full'] = {
      get: {
        tags: ['Health'],
        summary: 'Health check completo',
        description: 'Verifica saúde completa do sistema',
        responses: {
          200: {
            description: 'Relatório completo de saúde',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/FullHealthResponse'
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Gera documentação de permissões
   */
  async _generatePermissionsDocumentation() {
    this.apiSpec.paths['/api/permissions'] = {
      get: {
        tags: ['Permissions'],
        summary: 'Listar permissões',
        description: 'Obtém lista de todas as permissões disponíveis',
        parameters: [
          {
            name: 'category',
            in: 'query',
            description: 'Categoria da permissão',
            schema: { type: 'string' }
          },
          {
            name: 'level',
            in: 'query',
            description: 'Nível da permissão',
            schema: {
              type: 'string',
              enum: ['read', 'write', 'delete', 'admin', 'super']
            }
          }
        ],
        responses: {
          200: {
            description: 'Lista de permissões',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PermissionsResponse'
                }
              }
            }
          }
        }
      }
    };
  }

  // ==========================================
  // MÉTODOS PRIVADOS - SCHEMAS E RESPOSTAS
  // ==========================================

  /**
   * Adiciona schemas comuns
   */
  _addCommonSchemas() {
    this.apiSpec.components.schemas = {
      ...this.apiSpec.components.schemas,
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: { $ref: '#/components/schemas/User' },
              expiresIn: { type: 'number' }
            }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              level: { type: 'number' }
            }
          },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          lastLogin: { type: 'string', format: 'date-time' }
        }
      },
      Lead: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nome: { type: 'string' },
          email: { type: 'string', format: 'email' },
          telefone: { type: 'string' },
          empresa: { type: 'string' },
          status: {
            type: 'string',
            enum: ['novo', 'contatado', 'qualificado', 'proposta', 'fechado', 'perdido']
          },
          fonte: { type: 'string' },
          valor: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      PaginationInfo: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          page: { type: 'number' },
          limit: { type: 'number' },
          pages: { type: 'number' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          error: { type: 'string' },
          details: { type: 'array', items: { type: 'string' } }
        }
      }
    };
  }

  /**
   * Adiciona respostas padrão
   */
  _addCommonResponses() {
    this.apiSpec.components.responses = {
      Success: {
        description: 'Operação realizada com sucesso',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string' }
              }
            }
          }
        }
      },
      BadRequest: {
        description: 'Dados inválidos',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Unauthorized: {
        description: 'Não autenticado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Forbidden: {
        description: 'Sem permissão',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      NotFound: {
        description: 'Recurso não encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Conflict: {
        description: 'Conflito de dados',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    };

    this.apiSpec.components.parameters = {
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Número da página',
        schema: { type: 'integer', minimum: 1, default: 1 }
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Itens por página',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
      }
    };
  }

  // ==========================================
  // MÉTODOS PRIVADOS - EXPORTAÇÃO
  // ==========================================

  /**
   * Salva documentação em arquivos
   */
  async _saveDocumentation() {
    const docsDir = path.join(__dirname, '../../docs');
    await fs.mkdir(docsDir, { recursive: true });

    const files = [];

    // Salvar JSON
    const jsonFile = path.join(docsDir, 'api-spec.json');
    await fs.writeFile(jsonFile, JSON.stringify(this.apiSpec, null, 2), 'utf8');
    files.push(jsonFile);

    // Salvar README com informações básicas
    const readmeContent = await this._generateReadmeContent();
    const readmeFile = path.join(docsDir, 'README.md');
    await fs.writeFile(readmeFile, readmeContent, 'utf8');
    files.push(readmeFile);

    return { files };
  }

  /**
   * Gera conteúdo do README
   */
  async _generateReadmeContent() {
    return `# Ferraco CRM API Documentation

## Visão Geral

A API do Ferraco CRM oferece funcionalidades completas para gerenciamento de leads, usuários, auditoria e segurança.

## Versão

**Versão**: ${this.apiSpec.info.version}

## Autenticação

A API utiliza autenticação via JWT Bearer Token. Inclua o token no header:

\`\`\`
Authorization: Bearer <seu-token>
\`\`\`

## Endpoints Principais

### Autenticação
- \`POST /api/auth/login\` - Login no sistema
- \`POST /api/auth/register\` - Registro de usuário
- \`POST /api/auth/logout\` - Logout

### Usuários
- \`GET /api/users\` - Listar usuários
- \`POST /api/users\` - Criar usuário
- \`GET /api/users/:id\` - Obter usuário
- \`PUT /api/users/:id\` - Atualizar usuário

### Leads
- \`GET /api/leads\` - Listar leads
- \`POST /api/leads\` - Criar lead
- \`GET /api/leads/:id\` - Obter lead
- \`PUT /api/leads/:id\` - Atualizar lead

### Auditoria
- \`GET /api/audit/logs\` - Logs de auditoria
- \`GET /api/audit/stats\` - Estatísticas

### Backup
- \`POST /api/backup/full\` - Backup completo
- \`GET /api/backup/list\` - Listar backups

### Health Check
- \`GET /api/health\` - Status básico
- \`GET /api/health/full\` - Status completo

### Permissões
- \`GET /api/permissions\` - Listar permissões
- \`POST /api/permissions/users/:userId/assign\` - Atribuir permissões

## Códigos de Status

- \`200\` - Sucesso
- \`201\` - Criado
- \`400\` - Dados inválidos
- \`401\` - Não autenticado
- \`403\` - Sem permissão
- \`404\` - Não encontrado
- \`409\` - Conflito
- \`500\` - Erro interno

## Documentação Interativa

A documentação completa em formato OpenAPI/Swagger está disponível em:
- JSON: \`docs/api-spec.json\`
- Swagger UI: \`http://localhost:3000/api-docs\`

## Segurança

A API implementa:
- Rate limiting
- Validação de entrada
- Detecção de ameaças
- Auditoria completa
- Criptografia de dados

## Suporte

Para suporte técnico, entre em contato:
- Email: dev@ferraco.com
- Documentação: /docs/
`;
  }

  /**
   * Converte especificação para YAML
   */
  _convertToYaml(obj, indent = 0) {
    let yaml = '';
    const spaces = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (value === null) {
        yaml += `${spaces}${key}: null\n`;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += this._convertToYaml(value, indent + 1);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n`;
            yaml += this._convertToYaml(item, indent + 2);
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else {
        const valueStr = typeof value === 'string' ? `"${value}"` : value;
        yaml += `${spaces}${key}: ${valueStr}\n`;
      }
    }

    return yaml;
  }

  /**
   * Gera documentação HTML
   */
  async _generateHtmlDocumentation() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Ferraco CRM API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js"></script>
    <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: './api-spec.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.presets.standalone
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
    </script>
</body>
</html>`;
  }

  /**
   * Gera documentação em Markdown
   */
  async _generateMarkdownDocumentation() {
    let markdown = `# Ferraco CRM API\n\n`;
    markdown += `${this.apiSpec.info.description}\n\n`;
    markdown += `**Versão**: ${this.apiSpec.info.version}\n\n`;

    // Adicionar tags
    markdown += `## Módulos\n\n`;
    this.apiSpec.tags.forEach(tag => {
      markdown += `### ${tag.name}\n${tag.description}\n\n`;
    });

    // Adicionar endpoints
    markdown += `## Endpoints\n\n`;
    for (const [path, methods] of Object.entries(this.apiSpec.paths)) {
      markdown += `### ${path}\n\n`;

      for (const [method, spec] of Object.entries(methods)) {
        markdown += `#### ${method.toUpperCase()}\n`;
        markdown += `${spec.summary}\n\n`;
        if (spec.description) {
          markdown += `${spec.description}\n\n`;
        }
      }
    }

    return markdown;
  }

  /**
   * Obtém paths de um módulo específico
   */
  _getModulePaths(moduleName) {
    const modulePrefix = `/api/${moduleName.toLowerCase()}`;
    return Object.keys(this.apiSpec.paths).filter(path => path.startsWith(modulePrefix));
  }
}

module.exports = new DocumentationService();