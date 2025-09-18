const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Middleware para validar requisições usando express-validator
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Log dos erros de validação
    logger.warn('Erro de validação na requisição', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      errors: errors.array(),
      body: req.body,
      params: req.params,
      query: req.query
    });

    // Formatar erros para resposta
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: formattedErrors,
      errorCount: formattedErrors.length
    });
  }

  next();
};

module.exports = validateRequest;