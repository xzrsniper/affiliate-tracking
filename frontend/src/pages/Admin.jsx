import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout.jsx';
import api from '../config/api.js';
import {
  Search,
  Ban,
  Eye,
  X,
  Check,
  AlertCircle,
  FileText,
  Users,
  Plus,
  Trash2,
  Upload
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';
const CONTENT_FIELDS_BY_PAGE = {
  home: [
  { section: 'seo', key: 'title', label: 'SEO Title', type: 'text' },
  { section: 'seo', key: 'description', label: 'SEO Description', type: 'textarea' },
  { section: 'nav', key: 'features', label: 'Nav: Features', type: 'text' },
  { section: 'nav', key: 'pricing', label: 'Nav: Pricing', type: 'text' },
  { section: 'nav', key: 'guide', label: 'Nav: Guide', type: 'text' },
  { section: 'nav', key: 'support', label: 'Nav: Support', type: 'text' },
  { section: 'nav', key: 'sign_in', label: 'Nav: Sign in button', type: 'text' },
  { section: 'nav', key: 'start_free', label: 'Nav: Start free button', type: 'text' },
  { section: 'hero', key: 'badge', label: 'Hero badge', type: 'text' },
  { section: 'hero', key: 'headline_before', label: 'Hero headline before', type: 'text' },
  { section: 'hero', key: 'headline_highlight_1', label: 'Hero highlight 1', type: 'text' },
  { section: 'hero', key: 'headline_mid', label: 'Hero headline mid', type: 'text' },
  { section: 'hero', key: 'headline_highlight_2', label: 'Hero highlight 2', type: 'text' },
  { section: 'hero', key: 'headline_end', label: 'Hero headline end', type: 'text' },
  { section: 'hero', key: 'subline', label: 'Hero subline', type: 'textarea' },
  { section: 'hero', key: 'subline2', label: 'Hero subline 2', type: 'textarea' },
  { section: 'hero', key: 'cta_text', label: 'Hero CTA button', type: 'text' },
  { section: 'hero', key: 'watch_demo', label: 'Hero demo button', type: 'text' },
  { section: 'hero', key: 'note', label: 'Hero note', type: 'text' },
  { section: 'budget', key: 'item1', label: 'Budget bullet 1', type: 'text' },
  { section: 'budget', key: 'item2', label: 'Budget bullet 2', type: 'text' },
  { section: 'budget', key: 'item3', label: 'Budget bullet 3', type: 'text' },
  { section: 'budget', key: 'item4', label: 'Budget bullet 4', type: 'text' },
  { section: 'budget', key: 'item5', label: 'Budget bullet 5', type: 'text' },
  { section: 'features', key: 'title', label: 'Features title', type: 'text' },
  { section: 'features', key: 'subtitle', label: 'Features subtitle', type: 'textarea' },
  { section: 'money', key: 'title', label: 'Revenue block title', type: 'text' },
  { section: 'money', key: 'description', label: 'Revenue block description', type: 'textarea' },
  { section: 'money', key: 'bullet1', label: 'Revenue bullet 1', type: 'text' },
  { section: 'money', key: 'bullet2', label: 'Revenue bullet 2', type: 'text' },
  { section: 'money', key: 'bullet3', label: 'Revenue bullet 3', type: 'text' },
  { section: 'integration', key: 'title', label: 'Integration title', type: 'text' },
  { section: 'integration', key: 'description', label: 'Integration description', type: 'textarea' },
  { section: 'integration', key: 'bullet1', label: 'Integration bullet 1', type: 'text' },
  { section: 'integration', key: 'bullet2', label: 'Integration bullet 2', type: 'text' },
  { section: 'integration', key: 'bullet3', label: 'Integration bullet 3', type: 'text' },
  { section: 'why', key: 'title', label: 'Why us title', type: 'text' },
  { section: 'why', key: 'subtitle', label: 'Why us subtitle', type: 'textarea' },
  { section: 'why', key: 'item1', label: 'Why bullet 1', type: 'text' },
  { section: 'why', key: 'item2', label: 'Why bullet 2', type: 'text' },
  { section: 'why', key: 'item3', label: 'Why bullet 3', type: 'text' },
  { section: 'why', key: 'item4', label: 'Why bullet 4', type: 'text' },
  { section: 'why', key: 'item5', label: 'Why bullet 5', type: 'text' },
  { section: 'why', key: 'item6', label: 'Why bullet 6', type: 'text' },
  { section: 'pricing', key: 'title', label: 'Pricing title', type: 'text' },
  { section: 'faq', key: 'title', label: 'FAQ title', type: 'text' },
  { section: 'faq', key: 'help_title', label: 'FAQ help title', type: 'text' },
  { section: 'faq', key: 'help_description', label: 'FAQ help description', type: 'textarea' },
  { section: 'faq', key: 'help_button', label: 'FAQ help button', type: 'text' },
  { section: 'bottom_cta', key: 'start_free', label: 'Bottom CTA: start free', type: 'text' },
  { section: 'bottom_cta', key: 'talk_to_us', label: 'Bottom CTA: talk to us', type: 'text' },
  { section: 'footer', key: 'features', label: 'Footer: Features', type: 'text' },
  { section: 'footer', key: 'pricing', label: 'Footer: Pricing', type: 'text' },
  { section: 'footer', key: 'support', label: 'Footer: Support', type: 'text' },
  { section: 'cta', key: 'title', label: 'Bottom CTA title', type: 'text' },
  { section: 'cta', key: 'description', label: 'Bottom CTA description', type: 'textarea' }
  ],
  guide: [
    { section: 'seo', key: 'title', label: 'SEO Title', type: 'text' },
    { section: 'seo', key: 'description', label: 'SEO Description', type: 'textarea' },
    { section: 'hero', key: 'badge', label: 'Hero badge', type: 'text' },
    { section: 'hero', key: 'title', label: 'Hero title', type: 'text' },
    { section: 'hero', key: 'description', label: 'Hero description', type: 'textarea' },
    { section: 'hero', key: 'primary_cta', label: 'Primary CTA', type: 'text' },
    { section: 'hero', key: 'secondary_cta', label: 'Secondary CTA', type: 'text' },
    { section: 'faq', key: 'title', label: 'FAQ title', type: 'text' }
  ],
  blog: [
    { section: 'seo', key: 'title', label: 'SEO Title', type: 'text' },
    { section: 'seo', key: 'description', label: 'SEO Description', type: 'textarea' },
    { section: 'hero', key: 'title', label: 'Page title', type: 'text' },
    { section: 'sidebar', key: 'cta_text', label: 'Sidebar CTA text', type: 'textarea' },
    { section: 'sidebar', key: 'cta_button', label: 'Sidebar CTA button', type: 'text' }
  ],
  terms: [
    { section: 'seo', key: 'title', label: 'SEO Title', type: 'text' },
    { section: 'seo', key: 'description', label: 'SEO Description', type: 'textarea' },
    { section: 'header', key: 'title_uk', label: 'Title (UK)', type: 'text' },
    { section: 'header', key: 'title_en', label: 'Title (EN)', type: 'text' },
    { section: 'header', key: 'updated_uk', label: 'Updated text (UK)', type: 'text' },
    { section: 'header', key: 'updated_en', label: 'Updated text (EN)', type: 'text' },
    { section: 'intro', key: 'text_uk', label: 'Intro (UK)', type: 'textarea' },
    { section: 'intro', key: 'text_en', label: 'Intro (EN)', type: 'textarea' }
  ],
  privacy: [
    { section: 'seo', key: 'title', label: 'SEO Title', type: 'text' },
    { section: 'seo', key: 'description', label: 'SEO Description', type: 'textarea' },
    { section: 'header', key: 'title_uk', label: 'Title (UK)', type: 'text' },
    { section: 'header', key: 'title_en', label: 'Title (EN)', type: 'text' },
    { section: 'header', key: 'updated_uk', label: 'Updated text (UK)', type: 'text' },
    { section: 'header', key: 'updated_en', label: 'Updated text (EN)', type: 'text' },
    { section: 'intro', key: 'text_uk', label: 'Intro (UK)', type: 'textarea' },
    { section: 'intro', key: 'text_en', label: 'Intro (EN)', type: 'textarea' }
  ],
  refund: [
    { section: 'seo', key: 'title', label: 'SEO Title', type: 'text' },
    { section: 'seo', key: 'description', label: 'SEO Description', type: 'textarea' },
    { section: 'header', key: 'title_uk', label: 'Title (UK)', type: 'text' },
    { section: 'header', key: 'title_en', label: 'Title (EN)', type: 'text' },
    { section: 'header', key: 'updated_uk', label: 'Updated text (UK)', type: 'text' },
    { section: 'header', key: 'updated_en', label: 'Updated text (EN)', type: 'text' },
    { section: 'intro', key: 'text_uk', label: 'Intro (UK)', type: 'textarea' },
    { section: 'intro', key: 'text_en', label: 'Intro (EN)', type: 'textarea' }
  ]
};

const contentFieldId = (section, key) => `${section}.${key}`;

export default function Admin() {
  const { t, i18n } = useTranslation();
  const [contentPage, setContentPage] = useState('home');
  const currentContentFields = CONTENT_FIELDS_BY_PAGE[contentPage] || [];
  const getDefaultContentValue = (section, key) => {
    const map = {
      'seo.title': 'LehkoTrack - Affiliate Tracking Platform',
      'seo.description': t('home.heroSubline2'),
      'nav.features': t('home.navFeatures'),
      'nav.pricing': t('home.navPricing'),
      'nav.guide': t('home.navGuide'),
      'nav.support': t('home.navSupport'),
      'nav.sign_in': t('home.signIn'),
      'nav.start_free': t('home.startFree'),
      'hero.badge': t('home.newVersionLive'),
      'hero.headline_before': t('home.heroHeadlineBefore1'),
      'hero.headline_highlight_1': t('home.heroHeadlineHighlight1'),
      'hero.headline_mid': t('home.heroHeadlineMid'),
      'hero.headline_highlight_2': t('home.heroHeadlineHighlight2'),
      'hero.headline_end': t('home.heroHeadlineEnd'),
      'hero.subline': t('home.heroSubline'),
      'hero.subline2': t('home.heroSubline2'),
      'hero.cta_text': t('home.heroCta'),
      'hero.watch_demo': t('home.watchDemo'),
      'hero.note': t('home.heroNote'),
      'budget.item1': t('home.budget1'),
      'budget.item2': t('home.budget2'),
      'budget.item3': t('home.budget3'),
      'budget.item4': t('home.budget4'),
      'budget.item5': t('home.budget5'),
      'features.title': t('home.featuresSectionTitle'),
      'features.subtitle': t('home.featuresSectionSubtitle'),
      'money.title': t('home.moneyFromTitle'),
      'money.description': t('home.moneyFromDesc'),
      'money.bullet1': t('home.moneyFromBullet1'),
      'money.bullet2': t('home.moneyFromBullet2'),
      'money.bullet3': t('home.moneyFromBullet3'),
      'integration.title': t('home.integration5minTitle'),
      'integration.description': t('home.integration5minDesc'),
      'integration.bullet1': t('home.integrationBullet1'),
      'integration.bullet2': t('home.integrationBullet2'),
      'integration.bullet3': t('home.integrationBullet3'),
      'why.title': t('home.whyTitle'),
      'why.subtitle': t('home.whySubtitle'),
      'why.item1': t('home.benefit1'),
      'why.item2': t('home.benefit2'),
      'why.item3': t('home.benefit3'),
      'why.item4': t('home.benefit4'),
      'why.item5': t('home.benefit5'),
      'why.item6': t('home.benefit6'),
      'pricing.title': t('home.pricingTitle'),
      'faq.title': t('common.faq'),
      'faq.help_title': t('home.faqHelpTitle'),
      'faq.help_description': t('home.faqHelpDesc'),
      'faq.help_button': t('home.faqHelpBtn'),
      'bottom_cta.start_free': t('home.startFree'),
      'bottom_cta.talk_to_us': t('home.talkToUs'),
      'footer.features': t('home.navFeatures'),
      'footer.pricing': t('home.navPricing'),
      'footer.support': t('home.navSupport'),
      'cta.title': t('home.readyScale'),
      'cta.description': t('home.register30secCardless')
    };
    if (contentPage === 'guide') {
      const guideMap = {
        'seo.title': t('guide.guideTitle'),
        'seo.description': t('guide.heroDesc'),
        'hero.badge': t('guide.trackerBadge'),
        'hero.title': `${t('guide.heroLine1Before')} ${t('guide.heroLine1Highlight')} ${t('guide.heroLine2')}`,
        'hero.description': t('guide.heroDesc'),
        'hero.primary_cta': t('guide.watchVideoTutorial'),
        'hero.secondary_cta': t('guide.readFullDocs'),
        'faq.title': t('guide.faqTitle')
      };
      return guideMap[contentFieldId(section, key)] || '';
    }
    if (contentPage === 'blog') {
      const blogMap = {
        'seo.title': t('blog.title'),
        'seo.description': t('blog.ctaText'),
        'hero.title': t('blog.title'),
        'sidebar.cta_text': t('blog.ctaText'),
        'sidebar.cta_button': t('blog.ctaButton')
      };
      return blogMap[contentFieldId(section, key)] || '';
    }
    if (contentPage === 'terms' || contentPage === 'privacy' || contentPage === 'refund') {
      return '';
    }
    return map[contentFieldId(section, key)] || '';
  };
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [limitEdits, setLimitEdits] = useState({});
  const [updating, setUpdating] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);

  // Blog state
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [blogForm, setBlogForm] = useState({ title: '', slug: '', excerpt: '', body: '', featured_image: '', author_name: '', publish: true });
  const [blogSaving, setBlogSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentSuccess, setContentSuccess] = useState('');
  const [contentForm, setContentForm] = useState(
    Object.fromEntries(
      currentContentFields.map((field) => [
        contentFieldId(field.section, field.key),
        getDefaultContentValue(field.section, field.key)
      ])
    )
  );

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  useEffect(() => {
    if (activeTab === 'blog') fetchBlogPosts();
    if (activeTab === 'content') fetchPageContent();
  }, [activeTab, contentPage]);

  const fetchPageContent = async () => {
    setContentLoading(true);
    setContentSuccess('');
    try {
      // Use public active content to mirror exactly what users see on site now.
      const res = await api.get(`/api/page-content/${contentPage}`);
      const groupedContent = res.data?.content || {};
      const nextForm = Object.fromEntries(
        currentContentFields.map((field) => [
          contentFieldId(field.section, field.key),
          getDefaultContentValue(field.section, field.key)
        ])
      );
      Object.entries(groupedContent).forEach(([section, sectionValues]) => {
        Object.entries(sectionValues || {}).forEach(([key, entry]) => {
          const id = contentFieldId(section, key);
          if (Object.prototype.hasOwnProperty.call(nextForm, id)) {
            nextForm[id] = entry?.content || '';
          }
        });
      });
      setContentForm(nextForm);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load content');
    } finally {
      setContentLoading(false);
    }
  };

  const handleSaveContent = async () => {
    setContentSaving(true);
    setContentSuccess('');
    setError('');
    try {
      await Promise.all(
        currentContentFields.map((field, index) =>
          api.post('/api/page-content', {
            page: contentPage,
            section: field.section,
            key: field.key,
            content: contentForm[contentFieldId(field.section, field.key)] || '',
            content_type: 'text',
            order: index + 1,
            is_active: true
          })
        )
      );
      setContentSuccess('Saved. Changes are live now.');
      setTimeout(() => setContentSuccess(''), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save content');
    } finally {
      setContentSaving(false);
    }
  };

  const fetchBlogPosts = async () => {
    setBlogLoading(true);
    try {
      const res = await api.get('/api/blog/admin/posts');
      if (res.data?.success) setBlogPosts(res.data.posts || []);
    } catch (e) {
      setError(e.response?.data?.error || t('adminBlog.listTitle'));
    } finally {
      setBlogLoading(false);
    }
  };

  const openNewPost = () => {
    setEditingPost(null);
    setShowBlogForm(true);
    setBlogForm({ title: '', slug: '', excerpt: '', body: '', featured_image: '', author_name: '', publish: true });
  };

  const openEditPost = (post) => {
    setEditingPost(post);
    setShowBlogForm(true);
    setBlogForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      body: post.body || '',
      featured_image: post.featured_image || '',
      author_name: post.author_name || '',
      publish: !!post.published_at
    });
  };

  const handleBlogImageUpload = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await api.post('/api/blog/admin/upload-image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.url) setBlogForm((f) => ({ ...f, featured_image: res.data.url }));
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBlogSave = async () => {
    if (!blogForm.title.trim()) {
      setError(t('adminBlog.title') + ' required');
      return;
    }
    setBlogSaving(true);
    setError('');
    try {
      if (editingPost) {
        await api.put(`/api/blog/admin/posts/${editingPost.id}`, {
          ...blogForm,
          publish: blogForm.publish
        });
      } else {
        await api.post('/api/blog/admin/posts', {
          ...blogForm,
          publish: blogForm.publish
        });
      }
      setEditingPost(null);
      setShowBlogForm(false);
      setBlogForm({ title: '', slug: '', excerpt: '', body: '', featured_image: '', author_name: '', publish: true });
      fetchBlogPosts();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setBlogSaving(false);
    }
  };

  const handleBlogDelete = async (id) => {
    if (!window.confirm(t('adminBlog.deleteConfirm'))) return;
    try {
      await api.delete(`/api/blog/admin/posts/${id}`);
      fetchBlogPosts();
      if (editingPost?.id === id) {
        setEditingPost(null);
        setShowBlogForm(false);
        setBlogForm({ title: '', slug: '', excerpt: '', body: '', featured_image: '', author_name: '', publish: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  const blogImageSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE.replace(/\/$/, '')}${url.startsWith('/') ? url : '/' + url}`;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/admin/users', {
        params: { search: searchTerm }
      });
      console.log('Users response:', response.data);
      if (response.data.success && response.data.users) {
        setUsers(response.data.users);
        setLimitEdits(
          Object.fromEntries((response.data.users || []).map((u) => [u.id, String(u.link_limit ?? 0)]))
        );
      } else if (Array.isArray(response.data)) {
        setUsers(response.data);
        setLimitEdits(
          Object.fromEntries((response.data || []).map((u) => [u.id, String(u.link_limit ?? 0)]))
        );
      } else {
        setUsers([]);
        setLimitEdits({});
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      console.error('Error response:', err.response);
      console.error('Error request:', err.request);
      console.error('Error message:', err.message);
      
      let errorMessage = t('admin.errorLoadUsers');
      
      if (err.response) {
        // Server responded with error
        errorMessage = err.response?.data?.error || `Server error: ${err.response.status}`;
        // If 401 or 403, redirect to login
        if (err.response.status === 401 || err.response.status === 403) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = t('admin.networkError');
      } else {
        // Something else happened
        errorMessage = err.message || t('admin.errorLoadUsers');
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, isBanned) => {
    try {
      await api.post(`/api/admin/users/${userId}/ban`, {
        ban: !isBanned
      });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || t('admin.errorUpdateUser'));
    }
  };

  const handleUpdateLinkLimit = async (userId) => {
    const nextLimit = limitEdits[userId];
    if (nextLimit === '' || Number(nextLimit) < 0 || Number.isNaN(Number(nextLimit))) {
      setError(t('admin.validLinkLimit'));
      return;
    }

    setUpdating(true);
    try {
      await api.patch(`/api/admin/users/${userId}/limit`, {
        link_limit: parseInt(nextLimit, 10)
      });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || t('admin.errorUpdateLimit'));
    } finally {
      setUpdating(false);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await api.get(`/api/admin/users/${userId}/impersonate`);
      setViewingUser(response.data);
    } catch (err) {
      setError(err.response?.data?.error || t('admin.errorLoadUserData'));
    }
  };

  const getDisplayName = (user) => {
    if (user.name && String(user.name).trim()) return user.name;
    const emailPrefix = String(user.email || '').split('@')[0] || t('admin.userFallback');
    return emailPrefix
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const getInitials = (user) => {
    const name = getDisplayName(user);
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getUserStatus = (user) => {
    if (user.is_banned) return 'banned';
    if (user.email_verified === false || user.is_verified === false) return 'unverified';
    return 'active';
  };

  const filteredUsers = users.filter((user) => {
    const roleOk = roleFilter === 'all' || user.role === roleFilter;
    const status = getUserStatus(user);
    const statusOk = statusFilter === 'all' || status === statusFilter;
    const q = searchTerm.trim().toLowerCase();
    const name = getDisplayName(user).toLowerCase();
    const searchOk = !q || name.includes(q) || String(user.email || '').toLowerCase().includes(q);
    return roleOk && statusOk && searchOk;
  });

  return (
    <Layout>
      <div className="max-w-none">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 dark:bg-slate-900/70 px-5 py-4 backdrop-blur">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{t('admin.title')}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('admin.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors">{t('admin.exportCsv')}</button>
            <button className="px-3 py-2 text-sm font-semibold rounded-lg bg-violet-700 text-white hover:bg-violet-800 transition-colors">{t('admin.inviteUser')}</button>
          </div>
        </div>

        <div className="flex gap-2 mb-5 border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'users' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-b-0 border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Users className="w-4 h-4 inline mr-1.5" /> {t('admin.users')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blog')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'blog' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-b-0 border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <FileText className="w-4 h-4 inline mr-1.5" /> {t('adminBlog.tab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'content' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-b-0 border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <FileText className="w-4 h-4 inline mr-1.5" /> {t('admin.siteContentTab')}
          </button>
        </div>

        {activeTab === 'blog' && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('adminBlog.listTitle')}</h2>
              <button type="button" onClick={openNewPost} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-700 text-white text-sm font-semibold hover:bg-violet-800">
                <Plus className="w-4 h-4" /> {t('adminBlog.newPost')}
              </button>
            </div>
            {(showBlogForm || editingPost) && (
              <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{editingPost ? t('adminBlog.editPost') : t('adminBlog.newPost')}</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('adminBlog.title')}</label>
                  <input type="text" value={blogForm.title} onChange={(e) => setBlogForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" placeholder={t('adminBlog.title')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('adminBlog.slug')}</label>
                  <input type="text" value={blogForm.slug} onChange={(e) => setBlogForm((f) => ({ ...f, slug: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" placeholder="url-slug" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('adminBlog.excerpt')}</label>
                  <textarea value={blogForm.excerpt} onChange={(e) => setBlogForm((f) => ({ ...f, excerpt: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" placeholder={t('adminBlog.excerpt')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('adminBlog.body')}</label>
                  <textarea value={blogForm.body} onChange={(e) => setBlogForm((f) => ({ ...f, body: e.target.value }))} rows={10} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm" placeholder="<p>HTML content</p>" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('adminBlog.featuredImage')}</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <Upload className="w-4 h-4" /> {uploadingImage ? t('common.loading') : t('adminBlog.uploadImage')}
                      <input type="file" accept="image/*" className="hidden" onChange={handleBlogImageUpload} disabled={uploadingImage} />
                    </label>
                    {blogForm.featured_image && (
                      <div className="flex items-center gap-2">
                        <img src={blogImageSrc(blogForm.featured_image)} alt="" className="h-12 w-20 object-cover rounded-lg" />
                        <button type="button" onClick={() => setBlogForm((f) => ({ ...f, featured_image: '' }))} className="text-red-600 text-sm">{t('common.delete')}</button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('adminBlog.authorName')}</label>
                  <input type="text" value={blogForm.author_name} onChange={(e) => setBlogForm((f) => ({ ...f, author_name: e.target.value }))} className="w-full max-w-xs px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="blog-publish" checked={blogForm.publish} onChange={(e) => setBlogForm((f) => ({ ...f, publish: e.target.checked }))} className="rounded border-slate-300 text-violet-600" />
                  <label htmlFor="blog-publish" className="text-sm text-slate-700 dark:text-slate-300">{t('adminBlog.publish')}</label>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleBlogSave} disabled={blogSaving} className="px-4 py-2 rounded-lg bg-violet-700 text-white font-semibold hover:bg-violet-800 disabled:opacity-50">{blogSaving ? t('common.loading') : t('adminBlog.save')}</button>
                  <button type="button" onClick={() => { setEditingPost(null); setShowBlogForm(false); setBlogForm({ title: '', slug: '', excerpt: '', body: '', featured_image: '', author_name: '', publish: true }); }} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">{t('adminBlog.cancel')}</button>
                </div>
              </div>
            )}
            {blogLoading ? (
              <p className="text-slate-500 py-4">{t('common.loading')}</p>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      <th className="text-left px-4 py-3 font-semibold">{t('adminBlog.title')}</th>
                      <th className="text-left px-4 py-3 font-semibold">{t('adminBlog.created')}</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                      <th className="text-left px-4 py-3 font-semibold">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogPosts.map((p) => (
                      <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{p.title}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(p.created_at).toLocaleDateString(i18n.language === 'uk' ? 'uk-UA' : 'en-US')}</td>
                        <td className="px-4 py-3">{p.published_at ? <span className="text-green-600">{t('adminBlog.published')}</span> : <span className="text-amber-600">{t('adminBlog.draft')}</span>}</td>
                        <td className="px-4 py-3">
                          <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 mr-2 hover:underline">View</a>
                          <button type="button" onClick={() => openEditPost(p)} className="text-slate-600 dark:text-slate-400 hover:underline mr-2">{t('common.edit')}</button>
                          <button type="button" onClick={() => handleBlogDelete(p.id)} className="text-red-600 dark:text-red-400 hover:underline">{t('adminBlog.delete')}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {blogPosts.length === 0 && <p className="p-6 text-slate-500 text-center">{t('blog.noPosts')}</p>}
              </div>
            )}
          </>
        )}

        {activeTab === 'content' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('admin.siteContentTitle')}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('admin.siteContentHint')}</p>
              </div>
              <button
                type="button"
                onClick={handleSaveContent}
                disabled={contentSaving || contentLoading}
                className="shrink-0 px-4 py-2 rounded-lg bg-violet-700 text-white text-sm font-semibold hover:bg-violet-800 disabled:opacity-50"
              >
                {contentSaving ? t('admin.siteContentSaving') : t('admin.siteContentSave')}
              </button>
            </div>

            <div className="mb-6 rounded-xl border-2 border-violet-400/60 bg-violet-50/80 p-4 dark:border-violet-500/50 dark:bg-violet-950/40">
              <label className="mb-2 block text-sm font-bold text-violet-900 dark:text-violet-200" htmlFor="admin-site-content-page">
                {t('admin.siteContentPageLabel')}
              </label>
              <select
                id="admin-site-content-page"
                value={contentPage}
                onChange={(e) => setContentPage(e.target.value)}
                className="w-full max-w-xl rounded-lg border-2 border-violet-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 shadow-sm dark:border-violet-600 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="home">{t('admin.pageHome')}</option>
                <option value="guide">{t('admin.pageGuide')}</option>
                <option value="blog">{t('admin.pageBlog')}</option>
                <option value="terms">{t('admin.pageTerms')}</option>
                <option value="privacy">{t('admin.pagePrivacy')}</option>
                <option value="refund">{t('admin.pageRefund')}</option>
              </select>
              {typeof __BUILD_ID__ !== 'undefined' && (
                <p className="mt-3 font-mono text-xs text-violet-800/90 dark:text-violet-300/90">
                  {t('admin.siteContentBuildLabel')} <span className="font-bold">{String(__BUILD_ID__)}</span>
                </p>
              )}
              <p className="mt-2 text-xs leading-relaxed text-violet-900/80 dark:text-violet-200/80 whitespace-pre-wrap">
                {t('admin.siteContentDeployReminder')}
              </p>
            </div>

            {contentSuccess && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {contentSuccess}
              </div>
            )}

            {contentLoading ? (
              <p className="text-sm text-slate-500">{t('common.loading')}</p>
            ) : (
              <div className="space-y-4">
                {currentContentFields.map((field) => {
                  const id = contentFieldId(field.section, field.key);
                  return (
                    <div key={id}>
                      <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {field.label}
                        <span className="ml-2 text-xs font-normal text-slate-400">{field.section}.{field.key}</span>
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={contentForm[id] || ''}
                          onChange={(e) => setContentForm((prev) => ({ ...prev, [id]: e.target.value }))}
                          rows={3}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                        />
                      ) : (
                        <input
                          type="text"
                          value={contentForm[id] || ''}
                          onChange={(e) => setContentForm((prev) => ({ ...prev, [id]: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center text-lg">👥</div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{users.length}</p>
              <p className="text-xs text-slate-500 mt-1">{t('admin.totalUsers')}</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-lg">✅</div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{users.filter(u => !u.is_banned).length}</p>
              <p className="text-xs text-slate-500 mt-1">{t('admin.active')}</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-lg">🔗</div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{users.reduce((sum, u) => sum + (u.link_count || 0), 0)}</p>
              <p className="text-xs text-slate-500 mt-1">{t('admin.totalLinks')}</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center text-lg">🚫</div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{users.filter(u => u.is_banned).length}</p>
              <p className="text-xs text-slate-500 mt-1">{t('admin.banned')}</p>
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('admin.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 text-sm text-slate-900 placeholder-slate-400"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700"
          >
            <option value="all">{t('admin.allRoles')}</option>
            <option value="super_admin">{t('layout.superAdmin')}</option>
            <option value="user">{t('admin.affiliate')}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700"
          >
            <option value="all">{t('admin.allStatuses')}</option>
            <option value="active">{t('admin.active')}</option>
            <option value="unverified">{t('admin.unverified')}</option>
            <option value="banned">{t('admin.banned')}</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white/90 backdrop-blur rounded-2xl border border-violet-100 p-10 text-center text-slate-500 text-sm">
            {t('admin.loadingUsers')}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <p className="text-2xl font-bold text-slate-900">{t('admin.users')}</p>
              <p className="text-sm text-slate-500">{t('admin.showingUsers', { shown: filteredUsers.length, total: users.length })}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600">
                    <th className="text-left px-5 py-3 font-semibold uppercase text-xs tracking-wider">{t('admin.user')}</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider">{t('admin.role')}</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider">{t('admin.status')}</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider">{t('admin.links')}</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider">{t('admin.limit')}</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider">{t('admin.joined')}</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/70 align-top">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center">
                            {getInitials(user)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-none">{getDisplayName(user)}</p>
                            <p className="text-sm text-slate-500 mt-1">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {user.role === 'super_admin' ? (
                          <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-violet-100 text-violet-700 border border-violet-200">{t('layout.superAdmin')}</span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">{t('admin.affiliate')}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {getUserStatus(user) === 'banned' && <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">{t('admin.banned')}</span>}
                        {getUserStatus(user) === 'unverified' && <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">{t('admin.unverified')}</span>}
                        {getUserStatus(user) === 'active' && <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">{t('admin.active')}</span>}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">{user.link_count || 0}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={limitEdits[user.id] ?? user.link_limit ?? 0}
                            onChange={(e) => setLimitEdits((prev) => ({ ...prev, [user.id]: e.target.value }))}
                            className="w-16 px-2 py-1.5 bg-white rounded-lg border border-slate-200 text-slate-800 text-sm"
                          />
                          <button
                            onClick={() => handleUpdateLinkLimit(user.id)}
                            disabled={updating}
                            className="px-3 py-1.5 bg-violet-700 text-white rounded-lg text-sm font-semibold hover:bg-violet-800 disabled:opacity-50"
                          >
                            {t('common.save')}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{new Date(user.created_at).toLocaleDateString(i18n.language === 'uk' ? 'uk-UA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewUser(user.id)}
                            className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                            title={t('admin.viewStats')}
                          >
                            {t('admin.view')}
                          </button>
                          <button
                            onClick={() => {
                              setLimitEdits((prev) => ({ ...prev, [user.id]: String(user.link_limit ?? 0) }));
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleBanUser(user.id, user.is_banned)}
                            disabled={user.role === 'super_admin'}
                            className={`px-3 py-1.5 rounded-lg transition-colors text-sm border ${
                              user.is_banned
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={user.is_banned ? t('admin.unban') : t('admin.ban')}
                          >
                            {user.is_banned ? t('admin.unban') : t('admin.ban')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 border-t border-slate-200 text-sm text-slate-500">
              {t('admin.showingUsers', { shown: filteredUsers.length, total: users.length })}
            </div>
          </div>
        )}
          </>
        )}

        {viewingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-violet-100">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {t('admin.linksFor', { email: viewingUser.user.email })}
                  </h2>
                  <p className="text-slate-500 mt-1">
                    {t('admin.totalLinksCount', { count: viewingUser.links?.length || 0 })}
                  </p>
                </div>
                <button
                  onClick={() => setViewingUser(null)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                {viewingUser.links.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">{t('admin.noLinksYet')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {viewingUser.links.map((link) => (
                      <div
                        key={link.id}
                        className="bg-slate-50 rounded-xl p-4 border border-slate-200"
                      >
                        <p className="font-semibold text-slate-900 mb-3 break-all">{link.original_url}</p>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">{t('dashboard.uniqueClicks')}</p>
                            <p className="font-bold text-slate-900">{link.stats.unique_clicks}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">{t('dashboard.totalClicks')}</p>
                            <p className="font-bold text-slate-900">{link.stats.total_clicks}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">{t('admin.conversions')}</p>
                            <p className="font-bold text-green-600">{link.stats.conversions}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">{t('dashboard.revenue')}</p>
                            <p className="font-bold text-emerald-600">
                              ${link.stats.total_revenue}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
