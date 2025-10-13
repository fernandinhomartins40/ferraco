/**
 * Upload Controller - Gerencia upload de arquivos (imagens)
 */

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Criar diretório de uploads se não existir
const uploadsDir = process.env.NODE_ENV === 'production'
  ? '/app/uploads'
  : path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Aceitar apenas imagens
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG, WebP ou SVG.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (alinhado com Nginx)
  },
});

export class UploadController {
  /**
   * Upload de imagem única
   */
  async uploadImage(req: Request, res: Response) {
    try {
      console.log('📤 Upload request received:', {
        hasFile: !!req.file,
        uploadsDir,
        NODE_ENV: process.env.NODE_ENV,
      });

      if (!req.file) {
        console.log('❌ No file in request');
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo enviado',
        });
      }

      console.log('✅ File received:', {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      // Retornar URL da imagem
      const imageUrl = `/uploads/${req.file.filename}`;

      console.log('✅ Upload successful, returning URL:', imageUrl);

      res.json({
        success: true,
        data: {
          url: imageUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao fazer upload da imagem',
      });
    }
  }

  /**
   * Deletar imagem
   */
  async deleteImage(req: Request, res: Response) {
    try {
      const { filename } = req.params;

      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'Nome do arquivo não fornecido',
        });
      }

      const filePath = path.join(uploadsDir, filename);

      // Verificar se arquivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Arquivo não encontrado',
        });
      }

      // Deletar arquivo
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: 'Arquivo deletado com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao deletar imagem:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao deletar imagem',
      });
    }
  }

  /**
   * Listar todas as imagens
   */
  async listImages(req: Request, res: Response) {
    try {
      const files = fs.readdirSync(uploadsDir);

      const images = files
        .filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext);
        })
        .map((file) => {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);

          return {
            filename: file,
            url: `/uploads/${file}`,
            size: stats.size,
            createdAt: stats.birthtime,
          };
        });

      res.json({
        success: true,
        data: images,
      });
    } catch (error: any) {
      console.error('Erro ao listar imagens:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar imagens',
      });
    }
  }
}
