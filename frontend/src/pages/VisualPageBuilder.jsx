import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../config/api.js';
import {
  Save,
  Upload,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  X,
  GripVertical,
  Image as ImageIcon,
  Type,
  Layout as LayoutIcon,
  Palette,
  Move,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SketchPicker } from 'react-color';
import HomeNew from './HomeNew.jsx';

const SECTION_TYPES = [
  { id: 'hero', name: 'Hero', icon: LayoutIcon, defaultData: {
    title: 'Заголовок', titleHighlight: 'виділений', subtitle: 'Підзаголовок',
    description: 'Опис', ctaText: 'Кнопка', ctaLink: '/login', image: null,
    bgColor: '#ffffff', textColor: '#1e293b', titleColor: '#7c3aed'
  }},
  { id: 'text', name: 'Текст', icon: Type, defaultData: {
    title: 'Заголовок', content: 'Текст', align: 'center',
    bgColor: '#f8fafc', textColor: '#1e293b'
  }},
  { id: 'stats', name: 'Статистика', icon: LayoutIcon, defaultData: {
    items: [
      { value: '100%', label: 'Статистика 1', color: '#7c3aed' },
      { value: '200+', label: 'Статистика 2', color: '#7c3aed' },
      { value: '24/7', label: 'Статистика 3', color: '#7c3aed' }
    ],
    bgColor: '#ffffff'
  }},
  { id: 'cta', name: 'CTA', icon: LayoutIcon, defaultData: {
    title: 'Готові?', description: 'Опис', buttonText: 'Діяти', buttonLink: '/login',
    bgColor: '#7c3aed', textColor: '#ffffff', buttonColor: '#ffffff', buttonTextColor: '#7c3aed'
  }},
  { id: 'image', name: 'Зображення', icon: ImageIcon, defaultData: {
    image: null, alt: 'Image', caption: '', bgColor: '#ffffff'
  }}
];

export default function VisualPageBuilder() {
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [splitView, setSplitView] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        setSuccess('Збережено!');
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
    const sectionType = SECTION_TYPES.find(t => t.id === type);
    const newSection = {
      id: `section-${Date.now()}`,
      type,
      order: structure.sections.length + 1,
      visible: true,
      data: { ...sectionType.defaultData },
      styles: {
        padding: { top: 40, bottom: 40, left: 0, right: 0 },
        margin: { top: 0, bottom: 0, left: 0, right: 0 }
      }
    };

    setStructure(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setSelectedSection(newSection.id);
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

  const updateSectionStyles = (sectionId, styleUpdates) => {
    setStructure(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? { ...section, styles: { ...section.styles, ...styleUpdates } }
          : section
      )
    }));
  };

  const deleteSection = (sectionId) => {
    setStructure(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setStructure(prev => {
        const oldIndex = prev.sections.findIndex(s => s.id === active.id);
        const newIndex = prev.sections.findIndex(s => s.id === over.id);
        const newSections = arrayMove(prev.sections, oldIndex, newIndex);
        return {
          ...prev,
          sections: newSections.map((s, i) => ({ ...s, order: i + 1 }))
        };
      });
    }
  };

  const handleImageUpload = async (sectionId, field, file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/api/page-structure/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setPreviewMode(false)}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
          >
            Закрити перегляд
          </button>
        </div>
        <HomeNew structure={structure} />
      </div>
    );
  }

  const selectedSectionData = structure?.sections?.find(s => s.id === selectedSection);

  return (
    <Layout>
      <div className="h-screen flex flex-col">
        {/* Toolbar */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Візуальний конструктор
            </h1>
            <button
              onClick={() => setSplitView(!splitView)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              title={splitView ? 'Повний редактор' : 'Розділений вигляд'}
            >
              {splitView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center space-x-3">
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
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-3 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 p-3 text-green-700 dark:text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Sections List & Properties */}
          <div className={`${splitView ? 'w-80' : 'w-0'} bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-auto transition-all duration-300`}>
            {splitView && (
              <>
                {/* Add Sections */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Додати секцію:
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTION_TYPES.map(type => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => addSection(type.id)}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors flex flex-col items-center space-y-1"
                        >
                          <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          <span className="text-xs text-slate-600 dark:text-slate-400">{type.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sections List */}
                <div className="p-4">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Секції:
                  </h3>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={structure?.sections?.map(s => s.id) || []}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {structure?.sections?.map((section) => (
                          <SortableSectionItem
                            key={section.id}
                            section={section}
                            isSelected={selectedSection === section.id}
                            onSelect={() => setSelectedSection(section.id === selectedSection ? null : section.id)}
                            onDelete={() => deleteSection(section.id)}
                            onToggleVisibility={() => toggleSectionVisibility(section.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>

                {/* Properties Panel */}
                {selectedSectionData && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Властивості:
                    </h3>
                    <SectionPropertiesEditor
                      section={selectedSectionData}
                      onUpdate={(updates) => updateSection(selectedSectionData.id, updates)}
                      onStylesUpdate={(styles) => updateSectionStyles(selectedSectionData.id, styles)}
                      onImageUpload={(field, file) => handleImageUpload(selectedSectionData.id, field, file)}
                      showColorPicker={showColorPicker}
                      onColorPickerChange={(field) => setShowColorPicker(showColorPicker === field ? null : field)}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Center/Right - Canvas with Live Preview */}
          <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950">
            <div className="min-h-full p-8">
              <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 shadow-xl">
                <LivePreview
                  structure={structure}
                  selectedSection={selectedSection}
                  onSectionClick={(sectionId) => setSelectedSection(sectionId)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Sortable Section Item
function SortableSectionItem({ section, isSelected, onSelect, onDelete, onToggleVisibility }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sectionType = SECTION_TYPES.find(t => t.id === section.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 bg-white dark:bg-slate-800 border-2 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>
          {sectionType && <sectionType.icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {sectionType?.name || section.type}
          </span>
          {!section.visible && (
            <EyeOff className="w-3 h-3 text-yellow-500" />
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
          >
            {section.visible ? (
              <Eye className="w-3 h-3 text-slate-400" />
            ) : (
              <EyeOff className="w-3 h-3 text-yellow-500" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Live Preview Component
function LivePreview({ structure, selectedSection, onSectionClick }) {
  if (!structure || !structure.sections) {
    return (
      <div className="p-12 text-center text-slate-400">
        Додайте першу секцію зліва
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {structure.sections
        .filter(s => s.visible)
        .map((section) => (
          <div
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={`relative ${
              selectedSection === section.id
                ? 'ring-4 ring-violet-500 ring-offset-2'
                : 'hover:ring-2 hover:ring-violet-300'
            } transition-all`}
            style={{
              backgroundColor: section.data?.bgColor || '#ffffff',
              color: section.data?.textColor || '#1e293b',
              paddingTop: `${section.styles?.padding?.top || 40}px`,
              paddingBottom: `${section.styles?.padding?.bottom || 40}px`,
              paddingLeft: `${section.styles?.padding?.left || 0}px`,
              paddingRight: `${section.styles?.padding?.right || 0}px`,
            }}
          >
            {selectedSection === section.id && (
              <div className="absolute top-2 right-2 bg-violet-500 text-white text-xs px-2 py-1 rounded">
                Редагується
              </div>
            )}
            <SectionPreview section={section} />
          </div>
        ))}
    </div>
  );
}

// Section Preview
function SectionPreview({ section }) {
  switch (section.type) {
    case 'hero':
      return (
        <div className="text-center py-12">
          {section.data.image && (
            <img src={section.data.image} alt="Hero" className="max-w-2xl mx-auto mb-8 rounded-lg" />
          )}
          <h1 className="text-5xl font-bold mb-4" style={{ color: section.data.titleColor || section.data.textColor }}>
            {section.data.title}{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {section.data.titleHighlight}
            </span>
          </h1>
          {section.data.subtitle && (
            <p className="text-2xl mb-4">{section.data.subtitle}</p>
          )}
          {section.data.description && (
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-80">{section.data.description}</p>
          )}
          {section.data.ctaText && (
            <button
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold"
            >
              {section.data.ctaText}
            </button>
          )}
        </div>
      );
    case 'text':
      return (
        <div className={`py-8 text-${section.data.align || 'center'}`}>
          {section.data.title && (
            <h2 className="text-3xl font-bold mb-4">{section.data.title}</h2>
          )}
          {section.data.content && (
            <p className="text-lg">{section.data.content}</p>
          )}
        </div>
      );
    case 'stats':
      return (
        <div className="py-12">
          <div className="grid grid-cols-3 gap-8 text-center">
            {section.data.items?.map((item, i) => (
              <div key={i}>
                <div className="text-4xl font-bold mb-2" style={{ color: item.color }}>
                  {item.value}
                </div>
                <div className="opacity-70">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'cta':
      return (
        <div className="py-12 text-center">
          {section.data.title && (
            <h2 className="text-4xl font-bold mb-4">{section.data.title}</h2>
          )}
          {section.data.description && (
            <p className="text-xl mb-8">{section.data.description}</p>
          )}
          {section.data.buttonText && (
            <button
              className="px-8 py-4 rounded-xl font-semibold"
              style={{
                backgroundColor: section.data.buttonColor,
                color: section.data.buttonTextColor
              }}
            >
              {section.data.buttonText}
            </button>
          )}
        </div>
      );
    case 'image':
      return (
        <div className="py-8 text-center">
          {section.data.image ? (
            <img src={section.data.image} alt={section.data.alt} className="max-w-full mx-auto rounded-lg" />
          ) : (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-slate-400">
              Завантажте зображення
            </div>
          )}
          {section.data.caption && (
            <p className="mt-4 opacity-70">{section.data.caption}</p>
          )}
        </div>
      );
    default:
      return null;
  }
}

// Properties Editor
function SectionPropertiesEditor({ section, onUpdate, onStylesUpdate, onImageUpload, showColorPicker, onColorPickerChange }) {
  const sectionType = SECTION_TYPES.find(t => t.id === section.type);

  return (
    <div className="space-y-4">
      {section.type === 'hero' && (
        <>
          <ColorField label="Колір фону" value={section.data.bgColor} onChange={(v) => onUpdate({ bgColor: v })} onColorPickerChange={() => onColorPickerChange('bgColor')} showPicker={showColorPicker === 'bgColor'} />
          <ColorField label="Колір тексту" value={section.data.textColor} onChange={(v) => onUpdate({ textColor: v })} onColorPickerChange={() => onColorPickerChange('textColor')} showPicker={showColorPicker === 'textColor'} />
          <ColorField label="Колір заголовка" value={section.data.titleColor} onChange={(v) => onUpdate({ titleColor: v })} onColorPickerChange={() => onColorPickerChange('titleColor')} showPicker={showColorPicker === 'titleColor'} />
          <Field label="Заголовок" value={section.data.title || ''} onChange={(v) => onUpdate({ title: v })} />
          <Field label="Виділений текст" value={section.data.titleHighlight || ''} onChange={(v) => onUpdate({ titleHighlight: v })} />
          <Field label="Підзаголовок" value={section.data.subtitle || ''} onChange={(v) => onUpdate({ subtitle: v })} />
          <TextArea label="Опис" value={section.data.description || ''} onChange={(v) => onUpdate({ description: v })} />
          <Field label="Текст кнопки" value={section.data.ctaText || ''} onChange={(v) => onUpdate({ ctaText: v })} />
          <Field label="Посилання" value={section.data.ctaLink || ''} onChange={(v) => onUpdate({ ctaLink: v })} />
          <ImageField label="Зображення" value={section.data.image} onUpload={(file) => onImageUpload('image', file)} />
        </>
      )}
      {section.type === 'text' && (
        <>
          <ColorField label="Колір фону" value={section.data.bgColor} onChange={(v) => onUpdate({ bgColor: v })} onColorPickerChange={() => onColorPickerChange('bgColor')} showPicker={showColorPicker === 'bgColor'} />
          <ColorField label="Колір тексту" value={section.data.textColor} onChange={(v) => onUpdate({ textColor: v })} onColorPickerChange={() => onColorPickerChange('textColor')} showPicker={showColorPicker === 'textColor'} />
          <Field label="Заголовок" value={section.data.title || ''} onChange={(v) => onUpdate({ title: v })} />
          <TextArea label="Контент" value={section.data.content || ''} onChange={(v) => onUpdate({ content: v })} />
        </>
      )}
      {section.type === 'stats' && (
        <>
          <ColorField label="Колір фону" value={section.data.bgColor} onChange={(v) => onUpdate({ bgColor: v })} onColorPickerChange={() => onColorPickerChange('bgColor')} showPicker={showColorPicker === 'bgColor'} />
          <div className="space-y-2">
            {section.data.items?.map((item, i) => (
              <div key={i} className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                <Field label="Значення" value={item.value || ''} onChange={(v) => {
                  const items = [...section.data.items];
                  items[i] = { ...items[i], value: v };
                  onUpdate({ items });
                }} />
                <Field label="Підпис" value={item.label || ''} onChange={(v) => {
                  const items = [...section.data.items];
                  items[i] = { ...items[i], label: v };
                  onUpdate({ items });
                }} />
                <ColorField label="Колір" value={item.color} onChange={(v) => {
                  const items = [...section.data.items];
                  items[i] = { ...items[i], color: v };
                  onUpdate({ items });
                }} onColorPickerChange={() => onColorPickerChange(`item-${i}-color`)} showPicker={showColorPicker === `item-${i}-color`} />
              </div>
            ))}
          </div>
        </>
      )}
      {section.type === 'cta' && (
        <>
          <ColorField label="Колір фону" value={section.data.bgColor} onChange={(v) => onUpdate({ bgColor: v })} onColorPickerChange={() => onColorPickerChange('bgColor')} showPicker={showColorPicker === 'bgColor'} />
          <ColorField label="Колір тексту" value={section.data.textColor} onChange={(v) => onUpdate({ textColor: v })} onColorPickerChange={() => onColorPickerChange('textColor')} showPicker={showColorPicker === 'textColor'} />
          <ColorField label="Колір кнопки" value={section.data.buttonColor} onChange={(v) => onUpdate({ buttonColor: v })} onColorPickerChange={() => onColorPickerChange('buttonColor')} showPicker={showColorPicker === 'buttonColor'} />
          <ColorField label="Колір тексту кнопки" value={section.data.buttonTextColor} onChange={(v) => onUpdate({ buttonTextColor: v })} onColorPickerChange={() => onColorPickerChange('buttonTextColor')} showPicker={showColorPicker === 'buttonTextColor'} />
          <Field label="Заголовок" value={section.data.title || ''} onChange={(v) => onUpdate({ title: v })} />
          <TextArea label="Опис" value={section.data.description || ''} onChange={(v) => onUpdate({ description: v })} />
          <Field label="Текст кнопки" value={section.data.buttonText || ''} onChange={(v) => onUpdate({ buttonText: v })} />
          <Field label="Посилання" value={section.data.buttonLink || ''} onChange={(v) => onUpdate({ buttonLink: v })} />
        </>
      )}
      {section.type === 'image' && (
        <>
          <ColorField label="Колір фону" value={section.data.bgColor} onChange={(v) => onUpdate({ bgColor: v })} onColorPickerChange={() => onColorPickerChange('bgColor')} showPicker={showColorPicker === 'bgColor'} />
          <ImageField label="Зображення" value={section.data.image} onUpload={(file) => onImageUpload('image', file)} />
          <Field label="Alt текст" value={section.data.alt || ''} onChange={(v) => onUpdate({ alt: v })} />
          <Field label="Підпис" value={section.data.caption || ''} onChange={(v) => onUpdate({ caption: v })} />
        </>
      )}

      {/* Style Controls */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Відступи:</h4>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Верх" value={section.styles?.padding?.top || 40} onChange={(v) => onStylesUpdate({ padding: { ...section.styles?.padding, top: v } })} />
          <NumberField label="Низ" value={section.styles?.padding?.bottom || 40} onChange={(v) => onStylesUpdate({ padding: { ...section.styles?.padding, bottom: v } })} />
        </div>
      </div>
    </div>
  );
}

// Field Components
function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
      />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
      />
    </div>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
      />
    </div>
  );
}

function ColorField({ label, value, onChange, onColorPickerChange, showPicker }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <div
          className="w-8 h-8 border border-slate-300 dark:border-slate-600 rounded cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={onColorPickerChange}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        />
      </div>
      {showPicker && (
        <div className="absolute z-50 mt-2">
          <div className="fixed inset-0" onClick={onColorPickerChange} />
          <div className="relative">
            <SketchPicker
              color={value}
              onChange={(color) => onChange(color.hex)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ImageField({ label, value, onUpload }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
        {label}
      </label>
      {value && (
        <img src={value} alt="Preview" className="mb-2 max-w-full h-24 object-cover rounded border" />
      )}
      <label className="cursor-pointer inline-flex items-center space-x-2 px-3 py-1.5 bg-violet-600 text-white text-sm rounded hover:bg-violet-700">
        <Upload className="w-3 h-3" />
        <span>Завантажити</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])}
          className="hidden"
        />
      </label>
    </div>
  );
}

