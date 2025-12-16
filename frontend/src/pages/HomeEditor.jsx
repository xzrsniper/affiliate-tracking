import { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../config/api.js';
import {
  Save,
  Upload,
  Image as ImageIcon,
  X,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';

export default function HomeEditor() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('hero');
  const [uploadingImage, setUploadingImage] = useState(false);

  const sections = [
    { id: 'hero', name: 'Hero секція (головний заголовок)' },
    { id: 'stats', name: 'Статистика' },
    { id: 'features', name: 'Можливості' },
    { id: 'benefits', name: 'Переваги' },
    { id: 'cta', name: 'Призив до дії' }
  ];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/page-content/home/all');
      if (response.data.success) {
        // Перетворюємо масив в об'єкт для зручності
        const contentObj = {};
        response.data.contents.forEach(item => {
          if (!contentObj[item.section]) {
            contentObj[item.section] = {};
          }
          contentObj[item.section][item.key] = {
            id: item.id,
            content: item.content,
            content_type: item.content_type,
            order: item.order,
            is_active: item.is_active
          };
        });
        setContent(contentObj);
      }
    } catch (err) {
      console.error('Failed to load content:', err);
      setError('Не вдалося завантажити контент');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section, key) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const item = content[section]?.[key];
      const value = item?.content || '';

      if (item?.id) {
        // Оновлюємо існуючий
        await api.patch(`/api/page-content/${item.id}`, {
          content: value
        });
      } else {
        // Створюємо новий
        await api.post('/api/page-content', {
          page: 'home',
          section,
          key,
          content: value,
          content_type: item?.content_type || 'text'
        });
      }

      setSuccess('Контент збережено!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchContent();
    } catch (err) {
      console.error('Failed to save:', err);
      setError(err.response?.data?.error || 'Не вдалося зберегти');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (section, key, file) => {
    try {
      setUploadingImage(true);
      setError('');

      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await api.post('/api/page-content/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (uploadResponse.data.success) {
        const imageUrl = uploadResponse.data.url;
        
        // Зберігаємо URL зображення
        const item = content[section]?.[key];
        if (item?.id) {
          await api.patch(`/api/page-content/${item.id}`, {
            content: imageUrl,
            content_type: 'image'
          });
        } else {
          await api.post('/api/page-content', {
            page: 'home',
            section,
            key,
            content: imageUrl,
            content_type: 'image'
          });
        }

        setSuccess('Зображення завантажено!');
        setTimeout(() => setSuccess(''), 3000);
        await fetchContent();
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError(err.response?.data?.error || 'Не вдалося завантажити зображення');
    } finally {
      setUploadingImage(false);
    }
  };

  const updateContent = (section, key, value) => {
    setContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: {
          ...(prev[section]?.[key] || {}),
          content: value
        }
      }
    }));
  };

  const addNewField = (section, key) => {
    setContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: {
          content: '',
          content_type: 'text'
        }
      }
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Завантаження...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Редагування головної сторінки
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Редагуйте тексти та зображення головної сторінки
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Section Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {section.name}
            </button>
          ))}
        </div>

        {/* Content Editor */}
        <div className="space-y-6">
          {activeSection === 'hero' && (
            <HeroEditor
              content={content.hero || {}}
              onUpdate={(key, value) => updateContent('hero', key, value)}
              onSave={(key) => handleSave('hero', key)}
              onImageUpload={(key, file) => handleImageUpload('hero', key, file)}
              saving={saving}
              uploadingImage={uploadingImage}
            />
          )}

          {activeSection === 'stats' && (
            <StatsEditor
              content={content.stats || {}}
              onUpdate={(key, value) => updateContent('stats', key, value)}
              onSave={(key) => handleSave('stats', key)}
              saving={saving}
            />
          )}

          {activeSection === 'features' && (
            <FeaturesEditor
              content={content.features || {}}
              onUpdate={(key, value) => updateContent('features', key, value)}
              onSave={(key) => handleSave('features', key)}
              saving={saving}
            />
          )}

          {activeSection === 'benefits' && (
            <BenefitsEditor
              content={content.benefits || {}}
              onUpdate={(key, value) => updateContent('benefits', key, value)}
              onSave={(key) => handleSave('benefits', key)}
              saving={saving}
            />
          )}

          {activeSection === 'cta' && (
            <CTAEditor
              content={content.cta || {}}
              onUpdate={(key, value) => updateContent('cta', key, value)}
              onSave={(key) => handleSave('cta', key)}
              saving={saving}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}

// Hero Section Editor
function HeroEditor({ content, onUpdate, onSave, onImageUpload, saving, uploadingImage }) {
  return (
    <div className="space-y-6">
      <FieldEditor
        label="Заголовок (основний текст)"
        value={content.title?.content || ''}
        onChange={(value) => onUpdate('title', value)}
        onSave={() => onSave('title')}
        saving={saving}
        multiline={false}
      />
      <FieldEditor
        label="Заголовок (виділений текст)"
        value={content.title_highlight?.content || ''}
        onChange={(value) => onUpdate('title_highlight', value)}
        onSave={() => onSave('title_highlight')}
        saving={saving}
        multiline={false}
      />
      <FieldEditor
        label="Опис"
        value={content.description?.content || ''}
        onChange={(value) => onUpdate('description', value)}
        onSave={() => onSave('description')}
        saving={saving}
        multiline={true}
      />
      <FieldEditor
        label="Текст кнопки"
        value={content.cta_text?.content || ''}
        onChange={(value) => onUpdate('cta_text', value)}
        onSave={() => onSave('cta_text')}
        saving={saving}
        multiline={false}
      />
      <ImageFieldEditor
        label="Зображення Hero"
        value={content.hero_image?.content || ''}
        onUpload={(file) => onImageUpload('hero_image', file)}
        uploading={uploadingImage}
      />
    </div>
  );
}

// Stats Section Editor
function StatsEditor({ content, onUpdate, onSave, saving }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <FieldEditor
            label="Статистика 1 - Значення"
            value={content.stat1_value?.content || ''}
            onChange={(value) => onUpdate('stat1_value', value)}
            onSave={() => onSave('stat1_value')}
            saving={saving}
          />
          <FieldEditor
            label="Статистика 1 - Підпис"
            value={content.stat1_label?.content || ''}
            onChange={(value) => onUpdate('stat1_label', value)}
            onSave={() => onSave('stat1_label')}
            saving={saving}
          />
        </div>
        <div>
          <FieldEditor
            label="Статистика 2 - Значення"
            value={content.stat2_value?.content || ''}
            onChange={(value) => onUpdate('stat2_value', value)}
            onSave={() => onSave('stat2_value')}
            saving={saving}
          />
          <FieldEditor
            label="Статистика 2 - Підпис"
            value={content.stat2_label?.content || ''}
            onChange={(value) => onUpdate('stat2_label', value)}
            onSave={() => onSave('stat2_label')}
            saving={saving}
          />
        </div>
        <div>
          <FieldEditor
            label="Статистика 3 - Значення"
            value={content.stat3_value?.content || ''}
            onChange={(value) => onUpdate('stat3_value', value)}
            onSave={() => onSave('stat3_value')}
            saving={saving}
          />
          <FieldEditor
            label="Статистика 3 - Підпис"
            value={content.stat3_label?.content || ''}
            onChange={(value) => onUpdate('stat3_label', value)}
            onSave={() => onSave('stat3_label')}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
}

// Features Section Editor
function FeaturesEditor({ content, onUpdate, onSave, saving }) {
  return (
    <div className="space-y-6">
      <FieldEditor
        label="Заголовок секції"
        value={content.title?.content || ''}
        onChange={(value) => onUpdate('title', value)}
        onSave={() => onSave('title')}
        saving={saving}
      />
      <FieldEditor
        label="Підзаголовок"
        value={content.subtitle?.content || ''}
        onChange={(value) => onUpdate('subtitle', value)}
        onSave={() => onSave('subtitle')}
        saving={saving}
        multiline={true}
      />
    </div>
  );
}

// Benefits Section Editor
function BenefitsEditor({ content, onUpdate, onSave, saving }) {
  return (
    <div className="space-y-6">
      <FieldEditor
        label="Заголовок"
        value={content.title?.content || ''}
        onChange={(value) => onUpdate('title', value)}
        onSave={() => onSave('title')}
        saving={saving}
      />
      <FieldEditor
        label="Опис"
        value={content.description?.content || ''}
        onChange={(value) => onUpdate('description', value)}
        onSave={() => onSave('description')}
        saving={saving}
        multiline={true}
      />
    </div>
  );
}

// CTA Section Editor
function CTAEditor({ content, onUpdate, onSave, saving }) {
  return (
    <div className="space-y-6">
      <FieldEditor
        label="Заголовок"
        value={content.title?.content || ''}
        onChange={(value) => onUpdate('title', value)}
        onSave={() => onSave('title')}
        saving={saving}
      />
      <FieldEditor
        label="Опис"
        value={content.description?.content || ''}
        onChange={(value) => onUpdate('description', value)}
        onSave={() => onSave('description')}
        saving={saving}
        multiline={true}
      />
      <FieldEditor
        label="Текст кнопки"
        value={content.button_text?.content || ''}
        onChange={(value) => onUpdate('button_text', value)}
        onSave={() => onSave('button_text')}
        saving={saving}
      />
    </div>
  );
}

// Reusable Field Editor Component
function FieldEditor({ label, value, onChange, onSave, saving, multiline = false }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          rows={4}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      )}
      <button
        onClick={onSave}
        disabled={saving}
        className="mt-3 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center space-x-2"
      >
        <Save className="w-4 h-4" />
        <span>{saving ? 'Збереження...' : 'Зберегти'}</span>
      </button>
    </div>
  );
}

// Image Field Editor Component
function ImageFieldEditor({ label, value, onUpload, uploading }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
      </label>
      {value && (
        <div className="mb-4">
          <img
            src={value}
            alt="Preview"
            className="max-w-full h-48 object-contain rounded-lg border border-slate-200 dark:border-slate-700"
          />
        </div>
      )}
      <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
        <Upload className="w-4 h-4" />
        <span>{uploading ? 'Завантаження...' : 'Завантажити зображення'}</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  );
}

