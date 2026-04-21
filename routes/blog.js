import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import sequelize from '../config/database.js';
import { BlogPost, BlogPostUniqueView } from '../models/index.js';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

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
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `blog-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowed.test(ext.replace('.', '')) && (mime.startsWith('image/'))) {
      return cb(null, true);
    }
    cb(new Error('Тільки зображення дозволені'));
  }
});

/** Унікальний ключ відвідувача (той самий браузер + мережа → той самий ключ; F5 не додає перегляд). */
function blogVisitorKey(req) {
  const salt = process.env.BLOG_VIEW_SALT || process.env.JWT_SECRET || 'lehko-blog-views';
  const raw = req.headers['x-forwarded-for'];
  const fromXff = typeof raw === 'string' ? raw.split(',')[0].trim() : '';
  const ip = fromXff || req.ip || req.socket?.remoteAddress || 'unknown';
  const ua = String(req.headers['user-agent'] || '').slice(0, 512);
  return crypto.createHash('sha256').update(`${salt}|${ip}|${ua}`).digest('hex').slice(0, 64);
}

function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0400-\u04FF\-]/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-|-$/g, '') || 'post';
}

// ——— Admin (must be before /:slug) ———

/** GET /api/blog/admin/posts — all posts (including drafts) */
router.get('/admin/posts', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const posts = await BlogPost.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
});

/** POST /api/blog/admin/posts — create post (publish = set published_at) */
router.post('/admin/posts', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const { title, slug: rawSlug, excerpt, body, featured_image, author_name, publish } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Заголовок обов\'язковий' });
    }
    const slug = (rawSlug && String(rawSlug).trim()) ? slugify(rawSlug) : slugify(title);
    const existing = await BlogPost.findOne({ where: { slug } });
    if (existing) {
      return res.status(400).json({ error: 'Такий slug вже існує', code: 'SLUG_EXISTS' });
    }

    const post = await BlogPost.create({
      title: String(title).trim(),
      slug,
      excerpt: excerpt != null ? String(excerpt).trim() : null,
      body: body != null ? String(body) : null,
      featured_image: featured_image || null,
      author_name: author_name ? String(author_name).trim() : null,
      published_at: publish ? new Date() : null
    });

    res.status(201).json({ success: true, post });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/blog/admin/posts/:id — update post */
router.put('/admin/posts/:id', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Статтю не знайдено' });

    const { title, slug: rawSlug, excerpt, body, featured_image, author_name, publish } = req.body;

    if (title != null && String(title).trim()) post.title = String(title).trim();
    if (rawSlug != null && String(rawSlug).trim()) {
      const slug = slugify(rawSlug);
      if (slug !== post.slug) {
        const existing = await BlogPost.findOne({ where: { slug } });
        if (existing) return res.status(400).json({ error: 'Такий slug вже існує', code: 'SLUG_EXISTS' });
        post.slug = slug;
      }
    }
    if (excerpt !== undefined) post.excerpt = excerpt ? String(excerpt).trim() : null;
    if (body !== undefined) post.body = body;
    if (featured_image !== undefined) post.featured_image = featured_image || null;
    if (author_name !== undefined) post.author_name = author_name ? String(author_name).trim() : null;
    if (publish !== undefined) {
      post.published_at = publish ? (post.published_at || new Date()) : null;
    }

    await post.save();
    res.json({ success: true, post });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/blog/admin/posts/:id */
router.delete('/admin/posts/:id', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Статтю не знайдено' });
    await post.destroy();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/** POST /api/blog/admin/upload-image — upload image for blog */
router.post('/admin/upload-image', authenticate, requireSuperAdmin, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не завантажено' });
    const url = `/uploads/images/${req.file.filename}`;
    res.json({ success: true, url, filename: req.file.filename });
  } catch (err) {
    next(err);
  }
});

// ——— Public ———

/** GET /api/blog — list published posts (sort=latest | popular) */
router.get('/', async (req, res, next) => {
  try {
    const sort = (req.query.sort || 'latest') === 'popular' ? 'popular' : 'latest';
    const where = { published_at: { [Op.ne]: null } };

    const order = sort === 'popular'
      ? [['view_count', 'DESC'], ['published_at', 'DESC']]
      : [['published_at', 'DESC']];

    const posts = await BlogPost.findAll({
      where,
      order,
      attributes: ['id', 'title', 'slug', 'excerpt', 'featured_image', 'author_name', 'published_at', 'view_count', 'created_at']
    });

    res.json({ success: true, posts, sort });
  } catch (err) {
    next(err);
  }
});

/** GET /api/blog/:slug — single post (лічильник view_count лише для нових унікальних відвідувачів) */
router.get('/:slug', async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({
      where: {
        slug: req.params.slug,
        published_at: { [Op.ne]: null }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Статтю не знайдено', code: 'NOT_FOUND' });
    }

    const visitorKey = blogVisitorKey(req);

    await sequelize.transaction(async (t) => {
      try {
        await BlogPostUniqueView.create(
          { blog_post_id: post.id, visitor_key: visitorKey },
          { transaction: t }
        );
      } catch (e) {
        const duplicate =
          e.name === 'SequelizeUniqueConstraintError' ||
          e.parent?.code === 'ER_DUP_ENTRY';
        if (!duplicate) throw e;
        return;
      }
      await post.increment('view_count', { transaction: t });
    });

    await post.reload();

    res.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        body: post.body,
        featured_image: post.featured_image,
        author_name: post.author_name,
        published_at: post.published_at,
        view_count: post.view_count,
        created_at: post.created_at,
        updated_at: post.updated_at
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
