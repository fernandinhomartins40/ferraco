const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ========================================
// ROTAS BÁSICAS DE USUÁRIOS
// ========================================

// GET /api/users/profile - Buscar perfil do usuário logado
router.get('/profile', authController.getProfile);

// PUT /api/users/profile - Atualizar perfil do usuário logado
router.put('/profile', authController.updateProfile);

// POST /api/users/change-password - Alterar senha
router.post('/change-password', authController.changePassword);

module.exports = router;