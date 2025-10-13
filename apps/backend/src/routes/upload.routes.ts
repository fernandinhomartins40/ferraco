/**
 * Upload Routes - Rotas para upload de arquivos
 */

import { Router } from 'express';
import { UploadController, upload } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const uploadController = new UploadController();

// Aplicar autenticação em todas as rotas de upload
router.use(authenticate);

// POST /api/upload/image - Upload de imagem
router.post('/image', upload.single('image'), uploadController.uploadImage.bind(uploadController));

// GET /api/upload/images - Listar todas as imagens
router.get('/images', uploadController.listImages.bind(uploadController));

// DELETE /api/upload/image/:filename - Deletar imagem
router.delete('/image/:filename', uploadController.deleteImage.bind(uploadController));

export default router;
