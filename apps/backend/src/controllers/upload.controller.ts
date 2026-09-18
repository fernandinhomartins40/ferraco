/**
 * Upload Controller - Gerencia upload de arquivos (imagens)
 */

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';

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
    // T-06 (F-57): era `Date.now() + Math.round(Math.random() * 1e9)`.
    // Math.random() não é criptográfico e o timestamp é adivinhável, então
    // nomes de arquivos de outros usuários podiam ser derivados por força
    // bruta — e /uploads é servido sem autenticação.
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${crypto.randomUUID()}${ext}`);
  },
});

// T-06 (F-59): SVG removido da allowlist. Um SVG pode conter <script>, e com
// CSP desabilitada (app.ts) o arquivo executaria JavaScript no domínio da
// aplicação — XSS armazenado. Formatos raster não têm esse problema.
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG ou WebP.'));
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
          // T-06 (F-59): '.svg' removido — alinhado com ALLOWED_IMAGE_TYPES.
          // SVGs residuais de uploads anteriores deixam de ser oferecidos
          // como imagem selecionável.
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
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

  /**
   * Upload com crop e compressão
   * Espera receber no body: { image: base64, width: number, height: number, quality: number }
   */
  async uploadWithCrop(req: Request, res: Response) {
    try {
      const { image, width, height, quality = 85 } = req.body;

      console.log('📤 Upload com crop recebido:', {
        hasImage: !!image,
        width,
        height,
        quality,
        uploadsDir,
        NODE_ENV: process.env.NODE_ENV,
      });

      if (!image) {
        return res.status(400).json({
          success: false,
          message: 'Imagem não fornecida',
        });
      }

      // Extrair base64 data
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // T-06 (F-57): nome criptográfico, pelo mesmo motivo do upload direto —
      // `Date.now() + Math.random()` era derivável por força bruta.
      const filename = `cropped-${crypto.randomUUID()}.jpg`;
      const filePath = path.join(uploadsDir, filename);

      console.log('🔧 Processando imagem com Sharp:', {
        filename,
        filePath,
        bufferSize: buffer.length,
      });

      // Processar imagem com Sharp
      await sharp(buffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality })
        .toFile(filePath);

      const stats = fs.statSync(filePath);

      console.log('✅ Imagem cropada salva:', {
        filename,
        filePath,
        size: stats.size,
        exists: fs.existsSync(filePath),
      });

      res.json({
        success: true,
        data: {
          url: `/uploads/${filename}`,
          filename,
          size: stats.size,
          width,
          height,
          quality,
        },
      });
    } catch (error: any) {
      console.error('❌ Erro no upload com crop:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao processar imagem',
      });
    }
  }
}
