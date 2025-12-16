import { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../config/api.js';
import {
  Save,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  X,
  GripVertical,
  Image as ImageIcon,
  Type,
  Layout as LayoutIcon
} from 'lucide-react';

const SECTION_TYPES = [
  { id: 'hero', name: 'Hero секція', icon: LayoutIcon },
  { id: 'text', name: 'Текстовий блок', icon: Type },
  { id: 'stats', name: 'Статистика', icon: LayoutIcon },
  { id: 'features', name: 'Можливості', icon: LayoutIcon },
  { id: 'benefits', name: 'Переваги', icon: LayoutIcon },
  { id: 'cta', name: 'Призив до дії', icon: LayoutIcon },
  { id: 'image', name: 'Зображення', icon: ImageIcon }
];

export default function PageBuilder() {
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  useEffect(() => {
    fetchStructure();
  }, []);

  const fetchStructure = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/page-structure/home');
      if (response.data.success) {
        setStructure(response.data.structure || { sections: [] });
      }
    } catch (err) {
      console.error('Failed to load structure:', err);
      setError('Не вдалося завантажити структуру');
    } finally {
      setLoading(false);
    }
  };

  const saveStructure = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await api.post('/api/page-structure/home', {
        structure
      });

      if (response.data.success) {
        setSuccess('Структура збережена!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to save:', err);
      setError(err.response?.data?.error || 'Не вдалося зберегти');
    } finally {
      setSaving(false);
    }
  };

  const addSection = (type) => {
    const newSection = {
      id: `section-${Date.now()}`,
      type,
      order: structure.sections.length + 1,
      visible: true,
      data: getDefaultSectionData(type)
    };

    setStructure(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const getDefaultSectionData = (type) => {
    switch (type) {
      case 'hero':
        return {
          title: 'Заголовок',
          titleHighlight: 'виділений текст',
          subtitle: 'Підзаголовок',
          description: 'Опис секції',
          ctaText: 'Кнопка',
          ctaLink: '/login',
          image: null
        };
      case 'text':
        return {
          title: 'Заголовок',
          content: 'Текстовий контент',
          align: 'center'
        };
      case 'stats':
        return {
          items: [
            { value: '100%', label: 'Статистика 1' },
            { value: '200+', label: 'Статистика 2' },
            { value: '24/7', label: 'Статистика 3' }
          ]
        };
      case 'features':
        return {
          title: 'Заголовок секції',
          subtitle: 'Підзаголовок',
          items: [
            {
              icon: 'MousePointerClick',
              title: 'Можливість 1',
              description: 'Опис можливості'
            }
          ]
        };
      case 'benefits':
        return {
          title: 'Чому обирають нас?',
          description: 'Опис переваг',
          items: ['Перевага 1', 'Перевага 2', 'Перевага 3'],
          stats: [
            { value: '1000+', label: 'Користувачів' },
            { value: '1M+', label: 'Кліків' }
          ]
        };
      case 'cta':
        return {
          title: 'Готові почати?',
          description: 'Опис призиву',
          buttonText: 'Діяти',
          buttonLink: '/login'
        };
      case 'image':
        return {
          image: null,
          alt: 'Зображення',
          caption: ''
        };
      default:
        return {};
    }
  };

  const updateSection = (sectionId, updates) => {
    setStructure(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, data: { ...section.data, ...updates } }
          : section
      )
    }));
  };

  const deleteSection = (sectionId) => {
    setStructure(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const toggleSectionVisibility = (sectionId) => {
    setStructure(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, visible: !section.visible }
          : section
      )
    }));
  };

  const moveSection = (sectionId, direction) => {
    setStructure(prev => {
      const sections = [...prev.sections];
      const index = sections.findIndex(s => s.id === sectionId);
      
      if (direction === 'up' && index > 0) {
        [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
      } else if (direction === 'down' && index < sections.length - 1) {
        [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
      }

      return {
        ...prev,
        sections: sections.map((s, i) => ({ ...s, order: i + 1 }))
      };
    });
  };

  const handleImageUpload = async (sectionId, field, file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/api/page-structure/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        updateSection(sectionId, { [field]: response.data.url });
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError('Не вдалося завантажити зображення');
    }
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

  if (previewMode) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Попередній перегляд
            </h1>
            <button
              onClick={() => setPreviewMode(false)}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
            >
              Закрити перегляд
            </button>
          </div>
          <PagePreview structure={structure} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Конструктор головної сторінки
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Додавайте, редагуйте та переставляйте секції сторінки
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setPreviewMode(true)}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Перегляд</span>
            </button>
            <button
              onClick={saveStructure}
              disabled={saving}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Збереження...' : 'Зберегти'}</span>
            </button>
          </div>
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

        {/* Add Section Buttons */}
        <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Додати секцію:
          </h3>
          <div className="flex flex-wrap gap-2">
            {SECTION_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => addSection(type.id)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{type.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sections List */}
        <div className="space-y-4">
          {structure?.sections?.map((section, index) => (
            <SectionEditor
              key={section.id}
              section={section}
              index={index}
              onUpdate={(updates) => updateSection(section.id, updates)}
              onDelete={() => deleteSection(section.id)}
              onToggleVisibility={() => toggleSectionVisibility(section.id)}
              onMove={(direction) => moveSection(section.id, direction)}
              onImageUpload={(field, file) => handleImageUpload(section.id, field, file)}
              isEditing={editingSection === section.id}
              onEdit={() => setEditingSection(editingSection === section.id ? null : section.id)}
            />
          ))}
        </div>

        {(!structure?.sections || structure.sections.length === 0) && (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">
              Немає секцій. Додайте першу секцію вище.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Section Editor Component
function SectionEditor({ section, index, onUpdate, onDelete, onToggleVisibility, onMove, onImageUpload, isEditing, onEdit }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border-2 ${isEditing ? 'border-violet-500' : 'border-slate-200 dark:border-slate-700'}`}>
      {/* Section Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GripVertical className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {SECTION_TYPES.find(t => t.id === section.type)?.name || section.type}
          </span>
          {!section.visible && (
            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded">
              Приховано
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
            title="Перемістити вгору"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMove('down')}
            className="p-1 text-slate-400 hover:text-slate-600"
            title="Перемістити вниз"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleVisibility}
            className="p-1 text-slate-400 hover:text-slate-600"
            title={section.visible ? 'Приховати' : 'Показати'}
          >
            {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={onEdit}
            className="p-1 text-slate-400 hover:text-violet-600"
            title="Редагувати"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-red-600"
            title="Видалити"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section Content Editor */}
      {isEditing && (
        <div className="p-6">
          <SectionContentEditor
            section={section}
            onUpdate={onUpdate}
            onImageUpload={onImageUpload}
          />
        </div>
      )}
    </div>
  );
}

// Section Content Editor based on type
function SectionContentEditor({ section, onUpdate, onImageUpload }) {
  switch (section.type) {
    case 'hero':
      return <HeroEditor data={section.data} onUpdate={onUpdate} onImageUpload={onImageUpload} />;
    case 'text':
      return <TextEditor data={section.data} onUpdate={onUpdate} />;
    case 'stats':
      return <StatsEditor data={section.data} onUpdate={onUpdate} />;
    case 'features':
      return <FeaturesEditor data={section.data} onUpdate={onUpdate} />;
    case 'benefits':
      return <BenefitsEditor data={section.data} onUpdate={onUpdate} onImageUpload={onImageUpload} />;
    case 'cta':
      return <CTAEditor data={section.data} onUpdate={onUpdate} />;
    case 'image':
      return <ImageEditor data={section.data} onUpdate={onUpdate} onImageUpload={onImageUpload} />;
    default:
      return <div>Невідомий тип секції</div>;
  }
}

// Individual Section Editors
function HeroEditor({ data, onUpdate, onImageUpload }) {
  return (
    <div className="space-y-4">
      <Field label="Заголовок" value={data.title || ''} onChange={(v) => onUpdate({ title: v })} />
      <Field label="Виділений текст" value={data.titleHighlight || ''} onChange={(v) => onUpdate({ titleHighlight: v })} />
      <Field label="Підзаголовок" value={data.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} />
      <TextArea label="Опис" value={data.description || ''} onChange={(v) => onUpdate({ description: v })} />
      <Field label="Текст кнопки" value={data.ctaText || ''} onChange={(v) => onUpdate({ ctaText: v })} />
      <Field label="Посилання кнопки" value={data.ctaLink || ''} onChange={(v) => onUpdate({ ctaLink: v })} />
      <ImageField label="Зображення" value={data.image} onUpload={(file) => onImageUpload('image', file)} />
    </div>
  );
}

function TextEditor({ data, onUpdate }) {
  return (
    <div className="space-y-4">
      <Field label="Заголовок" value={data.title || ''} onChange={(v) => onUpdate({ title: v })} />
      <TextArea label="Контент" value={data.content || ''} onChange={(v) => onUpdate({ content: v })} />
    </div>
  );
}

function StatsEditor({ data, onUpdate }) {
  const updateItem = (index, field, value) => {
    const items = [...(data.items || [])];
    items[index] = { ...items[index], [field]: value };
    onUpdate({ items });
  };

  const addItem = () => {
    const items = [...(data.items || []), { value: '', label: '' }];
    onUpdate({ items });
  };

  const removeItem = (index) => {
    const items = data.items.filter((_, i) => i !== index);
    onUpdate({ items });
  };

  return (
    <div className="space-y-4">
      {(data.items || []).map((item, index) => (
        <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg flex gap-3">
          <Field label="Значення" value={item.value || ''} onChange={(v) => updateItem(index, 'value', v)} />
          <Field label="Підпис" value={item.label || ''} onChange={(v) => updateItem(index, 'label', v)} />
          <button onClick={() => removeItem(index)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button onClick={addItem} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
        <Plus className="w-4 h-4 inline mr-2" />
        Додати статистику
      </button>
    </div>
  );
}

function FeaturesEditor({ data, onUpdate }) {
  return (
    <div className="space-y-4">
      <Field label="Заголовок" value={data.title || ''} onChange={(v) => onUpdate({ title: v })} />
      <Field label="Підзаголовок" value={data.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} />
      <p className="text-sm text-slate-500">Редагування можливостей доступне в повній версії</p>
    </div>
  );
}

function BenefitsEditor({ data, onUpdate, onImageUpload }) {
  return (
    <div className="space-y-4">
      <Field label="Заголовок" value={data.title || ''} onChange={(v) => onUpdate({ title: v })} />
      <TextArea label="Опис" value={data.description || ''} onChange={(v) => onUpdate({ description: v })} />
      <p className="text-sm text-slate-500">Редагування переваг доступне в повній версії</p>
    </div>
  );
}

function CTAEditor({ data, onUpdate }) {
  return (
    <div className="space-y-4">
      <Field label="Заголовок" value={data.title || ''} onChange={(v) => onUpdate({ title: v })} />
      <TextArea label="Опис" value={data.description || ''} onChange={(v) => onUpdate({ description: v })} />
      <Field label="Текст кнопки" value={data.buttonText || ''} onChange={(v) => onUpdate({ buttonText: v })} />
      <Field label="Посилання кнопки" value={data.buttonLink || ''} onChange={(v) => onUpdate({ buttonLink: v })} />
    </div>
  );
}

function ImageEditor({ data, onUpdate, onImageUpload }) {
  return (
    <div className="space-y-4">
      <ImageField label="Зображення" value={data.image} onUpload={(file) => onImageUpload('image', file)} />
      <Field label="Alt текст" value={data.alt || ''} onChange={(v) => onUpdate({ alt: v })} />
      <Field label="Підпис" value={data.caption || ''} onChange={(v) => onUpdate({ caption: v })} />
    </div>
  );
}

// Reusable Field Components
function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
      />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
      />
    </div>
  );
}

function ImageField({ label, value, onUpload }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      {value && (
        <img src={value} alt="Preview" className="mb-2 max-w-xs h-32 object-cover rounded-lg" />
      )}
      <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
        <Upload className="w-4 h-4" />
        <span>Завантажити</span>
        <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} className="hidden" />
      </label>
    </div>
  );
}

// Preview Component
function PagePreview({ structure }) {
  // Простий preview - можна розширити
  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {structure?.sections?.filter(s => s.visible).map((section) => (
        <div key={section.id} className="p-8 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold mb-4">{SECTION_TYPES.find(t => t.id === section.type)?.name}</h3>
          <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-4 rounded overflow-auto">
            {JSON.stringify(section.data, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}

