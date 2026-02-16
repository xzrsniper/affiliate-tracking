import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { PageContent } from '../models/index.js';
import { authenticate, requireSuperAdmin, optionalAuth } from '../middleware/auth.js';
import { Op } from 'sequelize';

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
    cb(null, `page-content-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
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
 * GET /api/page-content/:page
 * Отримати весь контент для сторінки (публічний доступ)
 */
router.get('/:page', optionalAuth, async (req, res, next) => {
  try {
    const { page } = req.params;
    const { section } = req.query;

    const where = {
      page,
      is_active: true
    };

    if (section) {
      where.section = section;
    }

    const contents = await PageContent.findAll({
      where,
      order: [['section', 'ASC'], ['order', 'ASC']]
    });

    // Групуємо контент по секціях
    const grouped = {};
    contents.forEach(item => {
      if (!grouped[item.section]) {
        grouped[item.section] = {};
      }
      grouped[item.section][item.key] = {
        content: item.content,
        content_type: item.content_type
      };
    });

    res.json({
      success: true,
      page,
      content: grouped
    });
  } catch (error) {
    // Якщо помилка пов'язана з базою даних, повертаємо успішну відповідь з порожнім контентом
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeDatabaseError' || error.message?.includes('database')) {
      console.warn('⚠️  Database not available, returning empty content:', error.message);
      return res.json({
        success: true,
        page: req.params.page,
        content: {}
      });
    }
    next(error);
  }
});

/**
 * GET /api/page-content/:page/all
 * Отримати весь контент (включно з неактивним) - тільки для адмінів
 */
router.get('/:page/all', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const { page } = req.params;

    const contents = await PageContent.findAll({
      where: { page },
      order: [['section', 'ASC'], ['order', 'ASC']]
    });

    res.json({
      success: true,
      page,
      contents
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/page-content
 * Створити або оновити контент
 */
router.post('/', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const { page, section, key, content, content_type, order, is_active } = req.body;

    if (!page || !section || !key) {
      return res.status(400).json({ error: 'page, section, та key обов\'язкові' });
    }

    const [pageContent, created] = await PageContent.upsert({
      page,
      section,
      key,
      content: content || '',
      content_type: content_type || 'text',
      order: order || 0,
      is_active: is_active !== undefined ? is_active : true
    }, {
      returning: true
    });

    res.json({
      success: true,
      message: created ? 'Контент створено' : 'Контент оновлено',
      content: pageContent
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/page-content/upload-image
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

/**
 * PATCH /api/page-content/:id
 * Оновити контент
 */
router.patch('/:id', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, content_type, order, is_active } = req.body;

    const pageContent = await PageContent.findByPk(id);
    if (!pageContent) {
      return res.status(404).json({ error: 'Контент не знайдено' });
    }

    if (content !== undefined) pageContent.content = content;
    if (content_type !== undefined) pageContent.content_type = content_type;
    if (order !== undefined) pageContent.order = order;
    if (is_active !== undefined) pageContent.is_active = is_active;

    await pageContent.save();

    res.json({
      success: true,
      message: 'Контент оновлено',
      content: pageContent
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/page-content/:id
 * Видалити контент
 */
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const pageContent = await PageContent.findByPk(id);
    if (!pageContent) {
      return res.status(404).json({ error: 'Контент не знайдено' });
    }

    // Якщо це зображення, видаляємо файл
    if (pageContent.content_type === 'image' && pageContent.content) {
      const imagePath = path.join(process.cwd(), 'public', pageContent.content);
      try {
        await fs.unlink(imagePath);
      } catch (error) {
        console.warn('Не вдалося видалити файл зображення:', error);
      }
    }

    await pageContent.destroy();

    res.json({
      success: true,
      message: 'Контент видалено'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

