import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { PageStructure } from '../models/index.js';
import { authenticate, requireSuperAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Налаштування multer для завантаження зображень
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'images');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `page-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Тільки зображення дозволені!'));
    }
  }
});

/**
 * GET /api/page-structure/:page
 * Отримати структуру сторінки (публічний доступ)
 */
router.get('/:page', optionalAuth, async (req, res, next) => {
  try {
    const { page } = req.params;

    const pageStructure = await PageStructure.findOne({
      where: { page }
    });

    if (!pageStructure) {
      return res.json({
        success: true,
        page,
        structure: null
      });
    }

    res.json({
      success: true,
      page,
      structure: pageStructure.structure
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/page-structure/:page
 * Зберегти структуру сторінки (тільки для адмінів)
 */
router.post('/:page', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const { page } = req.params;
    const { structure } = req.body;

    if (!structure || typeof structure !== 'object') {
      return res.status(400).json({ error: 'structure обов\'язковий і має бути об\'єктом' });
    }

    const [pageStructure, created] = await PageStructure.upsert({
      page,
      structure
    }, {
      returning: true
    });

    res.json({
      success: true,
      message: created ? 'Структура створена' : 'Структура оновлена',
      structure: pageStructure.structure
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/page-structure/upload-image
 * Завантажити зображення
 */
router.post('/upload-image', authenticate, requireSuperAdmin, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не завантажено' });
    }

    const imageUrl = `/uploads/images/${req.file.filename}`;

    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    next(error);
  }
});

export default router;

