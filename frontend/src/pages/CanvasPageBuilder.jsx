import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../config/api.js';
import {
  Save,
  Upload,
  Plus,
  Trash2,
  Eye,
  X,
  Type,
  MousePointer2,
  Square,
  Image as ImageIcon,
  Move,
  Maximize2,
  Minimize2,
  Copy,
  Layers,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  LogIn,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SketchPicker } from 'react-color';

const ELEMENT_TYPES = [
  { id: 'text', name: 'Текст', icon: Type, defaultData: { content: 'Текст', fontSize: 24, color: '#000000', x: 100, y: 100, width: 300, height: 50 } },
  { id: 'heading', name: 'Заголовок', icon: Type, defaultData: { content: 'Заголовок', fontSize: 48, color: '#000000', fontWeight: 'bold', x: 100, y: 50, width: 400, height: 60 } },
  { id: 'button', name: 'Кнопка', icon: Square, defaultData: { text: 'Кнопка', fontSize: 16, color: '#ffffff', bgColor: '#7c3aed', x: 100, y: 200, width: 150, height: 50, borderRadius: 8 } },
  { id: 'login_button', name: 'Кнопка входу', icon: LogIn, defaultData: { text: 'Увійти', fontSize: 16, color: '#ffffff', bgColor: '#7c3aed', x: 100, y: 200, width: 150, height: 50, borderRadius: 8, link: '/login', isActionButton: true } },
  { id: 'register_button', name: 'Кнопка реєстрації', icon: UserPlus, defaultData: { text: 'Реєстрація', fontSize: 16, color: '#ffffff', bgColor: '#7c3aed', x: 100, y: 260, width: 150, height: 50, borderRadius: 8, link: '/login?register=true', isActionButton: true } },
  { id: 'try_free_button', name: 'Спробувати безкоштовно', icon: Sparkles, defaultData: { text: 'Спробувати безкоштовно', fontSize: 16, color: '#ffffff', bgColor: '#7c3aed', x: 100, y: 320, width: 220, height: 50, borderRadius: 8, link: '/login', isActionButton: true } },
  { id: 'image', name: 'Зображення', icon: ImageIcon, defaultData: { src: null, x: 100, y: 300, width: 300, height: 200, alt: 'Image' } },
  { id: 'box', name: 'Блок', icon: Square, defaultData: { bgColor: '#f0f0f0', x: 100, y: 400, width: 400, height: 200, borderRadius: 0 } }
];

export default function CanvasPageBuilder() {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState('select'); // select, move
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 2000 });
  const [editingText, setEditingText] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    fetchStructure();
  }, []);

  const fetchStructure = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/page-structure/home');
      if (response.data.success && response.data.structure) {
        // Якщо є canvas структура, завантажуємо її
        if (response.data.structure.canvas && response.data.structure.canvas.elements) {
          setElements(response.data.structure.canvas.elements);
        }
      }
    } catch (err) {
      console.error('Failed to load structure:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveStructure = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Зберігаємо canvas структуру
      const canvasStructure = {
        canvas: {
          elements: elements,
          width: canvasSize.width,
          height: canvasSize.height
        }
      };

      const response = await api.post('/api/page-structure/home', {
        structure: canvasStructure
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

  const addElement = (type) => {
    const elementType = ELEMENT_TYPES.find(t => t.id === type);
    const newElement = {
      id: `element-${Date.now()}`,
      type,
      ...elementType.defaultData,
      zIndex: elements.length
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id, updates) => {
    setElements(prev =>
      prev.map(el =>
        el.id === id ? { ...el, ...updates } : el
      )
    );
  };

  const deleteElement = (id) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const duplicateElement = (id) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: `element-${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20,
        zIndex: elements.length
      };
      setElements(prev => [...prev, newElement]);
      setSelectedElement(newElement.id);
    }
  };

  const bringToFront = (id) => {
    setElements(prev => {
      const maxZIndex = Math.max(...prev.map(el => el.zIndex || 0), -1);
      return prev.map(el => 
        el.id === id ? { ...el, zIndex: maxZIndex + 1 } : el
      );
    });
  };

  const sendToBack = (id) => {
    setElements(prev => {
      const minZIndex = Math.min(...prev.map(el => el.zIndex || 0), 0);
      return prev.map(el => 
        el.id === id ? { ...el, zIndex: minZIndex - 1 } : el
      );
    });
  };

  const bringForward = (id) => {
    setElements(prev => {
      const element = prev.find(el => el.id === id);
      if (!element) return prev;
      
      const currentZIndex = element.zIndex || 0;
      const nextZIndex = currentZIndex + 1;
      
      return prev.map(el => 
        el.id === id ? { ...el, zIndex: nextZIndex } : el
      );
    });
  };

  const sendBackward = (id) => {
    setElements(prev => {
      const element = prev.find(el => el.id === id);
      if (!element) return prev;
      
      const currentZIndex = element.zIndex || 0;
      const prevZIndex = Math.max(-1, currentZIndex - 1);
      
      return prev.map(el => 
        el.id === id ? { ...el, zIndex: prevZIndex } : el
      );
    });
  };

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      setSelectedElement(null);
    }
  };

  const handleElementMouseDown = (e, element) => {
    if (tool === 'select') {
      e.stopPropagation();
      setSelectedElement(element.id);
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - element.x,
        y: e.clientY - rect.top - element.y
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging && selectedElement && tool === 'select') {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;
      updateElement(selectedElement, {
        x: Math.max(0, Math.min(newX, canvasSize.width - 100)),
        y: Math.max(0, Math.min(newY, canvasSize.height - 100))
      });
    }
  }, [isDragging, selectedElement, dragOffset, tool, canvasSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleImageUpload = async (elementId, file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/api/page-structure/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        updateElement(elementId, { src: response.data.url });
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
        <CanvasPreview elements={elements} canvasSize={canvasSize} />
      </div>
    );
  }

  const selectedElementData = elements.find(el => el.id === selectedElement);

  return (
    <Layout>
      <div className="h-screen flex flex-col">
        {/* Toolbar */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Canvas Editor
            </h1>
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-700 rounded p-1">
              <button
                onClick={() => setTool('select')}
                className={`p-2 rounded ${tool === 'select' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}
                title="Вибрати"
              >
                <MousePointer2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTool('move')}
                className={`p-2 rounded ${tool === 'move' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}
                title="Перемістити"
              >
                <Move className="w-4 h-4" />
              </button>
            </div>
            {selectedElement && (
              <div className="flex items-center space-x-1 border-l border-slate-300 dark:border-slate-600 pl-3 ml-3">
                <button
                  onClick={() => sendToBack(selectedElement)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  title="На задній план"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => sendBackward(selectedElement)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  title="На один рівень нижче"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => bringForward(selectedElement)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  title="На один рівень вище"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => bringToFront(selectedElement)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  title="На передній план"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            )}
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
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-2 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 p-2 text-green-700 dark:text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Tools & Properties */}
          <div className="w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
            {/* Add Elements */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Додати елемент:
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {ELEMENT_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => addElement(type.id)}
                      className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors flex flex-col items-center space-y-1"
                    >
                      <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">{type.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Elements List */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                Елементи ({elements.length})
              </h3>
              <div className="space-y-1">
                {elements.map((element) => {
                  const elementType = ELEMENT_TYPES.find(t => t.id === element.type);
                  const Icon = elementType?.icon || Square;
                  return (
                    <div
                      key={element.id}
                      onClick={() => setSelectedElement(element.id)}
                      className={`p-2 bg-white dark:bg-slate-800 border rounded cursor-pointer flex items-center justify-between ${
                        selectedElement === element.id
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {elementType?.name || element.type}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            bringToFront(element.id);
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                          title="На передній план"
                        >
                          <ArrowUp className="w-3 h-3 text-slate-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sendToBack(element.id);
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                          title="На задній план"
                        >
                          <ArrowDown className="w-3 h-3 text-slate-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateElement(element.id);
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                          title="Дублювати"
                        >
                          <Copy className="w-3 h-3 text-slate-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteElement(element.id);
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                          title="Видалити"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Properties Panel */}
            {selectedElementData && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Властивості:
                </h3>
                <ElementPropertiesEditor
                  element={selectedElementData}
                  onUpdate={(updates) => updateElement(selectedElementData.id, updates)}
                  onImageUpload={(file) => handleImageUpload(selectedElementData.id, file)}
                  showColorPicker={showColorPicker}
                  onColorPickerChange={(field) => setShowColorPicker(showColorPicker === field ? null : field)}
                  onBringToFront={() => bringToFront(selectedElementData.id)}
                  onSendToBack={() => sendToBack(selectedElementData.id)}
                  onBringForward={() => bringForward(selectedElementData.id)}
                  onSendBackward={() => sendBackward(selectedElementData.id)}
                />
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-950 p-8">
            <div className="bg-white shadow-2xl mx-auto" style={{ width: canvasSize.width, height: canvasSize.height, position: 'relative' }} ref={canvasRef} onClick={handleCanvasClick}>
              {elements.map((element) => (
                <div key={element.id} style={{ position: 'absolute', left: `${element.x}px`, top: `${element.y}px`, width: `${element.width}px`, height: `${element.height}px`, zIndex: element.zIndex || 0 }}>
                  <CanvasElement
                    element={element}
                    isSelected={selectedElement === element.id}
                    onMouseDown={(e) => handleElementMouseDown(e, element)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElement(element.id);
                    }}
                    onUpdate={(updates) => updateElement(element.id, updates)}
                  />
                  {selectedElement === element.id && (
                    <ResizeHandles
                      element={element}
                      onResize={(width, height) => updateElement(element.id, { width, height })}
                    />
                  )}
                </div>
              ))}
              {elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <p className="text-lg mb-2">Біле полотно</p>
                    <p className="text-sm">Додайте елементи зліва</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Canvas Element Component
export function CanvasElement({ element, isSelected, onMouseDown, onClick, onUpdate }) {
  const style = {
    width: '100%',
    height: '100%',
    cursor: 'move',
    outline: isSelected ? '2px solid #7c3aed' : 'none',
    outlineOffset: '2px'
  };

  switch (element.type) {
    case 'text':
      return (
        <div
          style={{
            ...style,
            fontSize: `${element.fontSize || 24}px`,
            color: element.color || '#000000',
            fontWeight: element.fontWeight || 'normal',
            fontFamily: element.fontFamily || 'inherit',
            minHeight: '20px',
            wordWrap: 'break-word'
          }}
          onMouseDown={onMouseDown}
          onClick={onClick}
          contentEditable={isSelected}
          suppressContentEditableWarning
          onBlur={(e) => {
            if (onUpdate) {
              onUpdate({ content: e.target.textContent });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
            }
          }}
        >
          {element.content || 'Текст'}
        </div>
      );
    case 'heading':
      return (
        <h1
          style={{
            ...style,
            fontSize: `${element.fontSize || 48}px`,
            color: element.color || '#000000',
            fontWeight: element.fontWeight || 'bold',
            fontFamily: element.fontFamily || 'inherit',
            margin: 0,
            minHeight: '30px',
            wordWrap: 'break-word'
          }}
          onMouseDown={onMouseDown}
          onClick={onClick}
          contentEditable={isSelected}
          suppressContentEditableWarning
          onBlur={(e) => {
            if (onUpdate) {
              onUpdate({ content: e.target.textContent });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
            }
          }}
        >
          {element.content || 'Заголовок'}
        </h1>
      );
    case 'button':
      return (
        <button
          style={{
            ...style,
            backgroundColor: element.bgColor || '#7c3aed',
            color: element.color || '#ffffff',
            fontSize: `${element.fontSize || 16}px`,
            borderRadius: `${element.borderRadius || 8}px`,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseDown={onMouseDown}
          onClick={onClick}
        >
          {element.text || 'Кнопка'}
        </button>
      );
    case 'login_button':
      return (
        <Link
          to={element.link || '/login'}
          style={{
            ...style,
            backgroundColor: element.bgColor || '#7c3aed',
            color: element.color || '#ffffff',
            fontSize: `${element.fontSize || 16}px`,
            borderRadius: `${element.borderRadius || 8}px`,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            fontWeight: 'semibold'
          }}
          onMouseDown={onMouseDown}
          onClick={(e) => {
            if (isSelected) {
              e.preventDefault();
              onClick(e);
            }
          }}
        >
          {element.text || 'Увійти'}
        </Link>
      );
    case 'register_button':
      return (
        <Link
          to={element.link || '/login?register=true'}
          style={{
            ...style,
            backgroundColor: element.bgColor || '#7c3aed',
            color: element.color || '#ffffff',
            fontSize: `${element.fontSize || 16}px`,
            borderRadius: `${element.borderRadius || 8}px`,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            fontWeight: 'semibold'
          }}
          onMouseDown={onMouseDown}
          onClick={(e) => {
            if (isSelected) {
              e.preventDefault();
              onClick(e);
            }
          }}
        >
          {element.text || 'Реєстрація'}
        </Link>
      );
    case 'try_free_button':
      return (
        <Link
          to={element.link || '/login'}
          style={{
            ...style,
            background: element.bgColor || 'linear-gradient(to right, #7c3aed, #4f46e5)',
            backgroundColor: element.bgColor || '#7c3aed',
            color: element.color || '#ffffff',
            fontSize: `${element.fontSize || 16}px`,
            borderRadius: `${element.borderRadius || 8}px`,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            fontWeight: 'semibold',
            boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.25)'
          }}
          onMouseDown={onMouseDown}
          onClick={(e) => {
            if (isSelected) {
              e.preventDefault();
              onClick(e);
            }
          }}
        >
          {element.text || 'Спробувати безкоштовно'}
        </Link>
      );
    case 'image':
      return (
        <div
          style={style}
          onMouseDown={onMouseDown}
          onClick={onClick}
        >
          {element.src ? (
            <img
              src={element.src}
              alt={element.alt || 'Image'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              border: '2px dashed #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999'
            }}>
              Зображення
            </div>
          )}
        </div>
      );
    case 'box':
      return (
        <div
          style={{
            ...style,
            backgroundColor: element.bgColor || '#f0f0f0',
            borderRadius: `${element.borderRadius || 0}px`
          }}
          onMouseDown={onMouseDown}
          onClick={onClick}
        />
      );
    default:
      return null;
  }
}

// Element Properties Editor
function ElementPropertiesEditor({ element, onUpdate, onImageUpload, showColorPicker, onColorPickerChange, onBringToFront, onSendToBack, onBringForward, onSendBackward }) {
  return (
    <div className="space-y-4">
      {/* Layer Order Controls */}
      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Порядок шарів:</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSendToBack}
            className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center space-x-1"
            title="На задній план"
          >
            <ArrowDown className="w-3 h-3" />
            <span>Назад</span>
          </button>
          <button
            onClick={onBringToFront}
            className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center space-x-1"
            title="На передній план"
          >
            <ArrowUp className="w-3 h-3" />
            <span>Вперед</span>
          </button>
          <button
            onClick={onSendBackward}
            className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center space-x-1"
            title="На один рівень нижче"
          >
            <ChevronDown className="w-3 h-3" />
            <span>Нижче</span>
          </button>
          <button
            onClick={onBringForward}
            className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center space-x-1"
            title="На один рівень вище"
          >
            <ChevronUp className="w-3 h-3" />
            <span>Вище</span>
          </button>
        </div>
      </div>

      {/* Position & Size */}
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="X" value={element.x || 0} onChange={(v) => onUpdate({ x: v })} />
        <NumberField label="Y" value={element.y || 0} onChange={(v) => onUpdate({ y: v })} />
        <NumberField label="Ширина" value={element.width || 100} onChange={(v) => onUpdate({ width: v })} />
        <NumberField label="Висота" value={element.height || 50} onChange={(v) => onUpdate({ height: v })} />
      </div>

      {/* Type-specific properties */}
      {(element.type === 'text' || element.type === 'heading') && (
        <>
          <Field label="Текст" value={element.content || ''} onChange={(v) => onUpdate({ content: v })} />
          <NumberField label="Розмір шрифту" value={element.fontSize || 24} onChange={(v) => onUpdate({ fontSize: v })} />
          <ColorField label="Колір тексту" value={element.color || '#000000'} onChange={(v) => onUpdate({ color: v })} onColorPickerChange={() => onColorPickerChange('color')} showPicker={showColorPicker === 'color'} />
          <select
            value={element.fontWeight || 'normal'}
            onChange={(e) => onUpdate({ fontWeight: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="lighter">Light</option>
          </select>
        </>
      )}

      {element.type === 'button' && (
        <>
          <Field label="Текст кнопки" value={element.text || ''} onChange={(v) => onUpdate({ text: v })} />
          <NumberField label="Розмір шрифту" value={element.fontSize || 16} onChange={(v) => onUpdate({ fontSize: v })} />
          <ColorField label="Колір фону" value={element.bgColor || '#7c3aed'} onChange={(v) => onUpdate({ bgColor: v })} onColorPickerChange={() => onColorPickerChange('bgColor')} showPicker={showColorPicker === 'bgColor'} />
          <ColorField label="Колір тексту" value={element.color || '#ffffff'} onChange={(v) => onUpdate({ color: v })} onColorPickerChange={() => onColorPickerChange('color')} showPicker={showColorPicker === 'color'} />
          <NumberField label="Радіус" value={element.borderRadius || 8} onChange={(v) => onUpdate({ borderRadius: v })} />
        </>
      )}

      {(element.type === 'login_button' || element.type === 'register_button' || element.type === 'try_free_button') && (
        <>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300 mb-2">
            {element.type === 'login_button' && '✅ Кнопка веде на сторінку входу'}
            {element.type === 'register_button' && '✅ Кнопка веде на сторінку реєстрації'}
            {element.type === 'try_free_button' && '✅ Кнопка веде на сторінку входу/реєстрації'}
          </div>
          <Field label="Текст кнопки" value={element.text || ''} onChange={(v) => onUpdate({ text: v })} />
          <NumberField label="Розмір шрифту" value={element.fontSize || 16} onChange={(v) => onUpdate({ fontSize: v })} />
          <ColorField label="Колір фону" value={element.bgColor || '#7c3aed'} onChange={(v) => onUpdate({ bgColor: v })} onColorPickerChange={() => onColorPickerChange('bgColor')} showPicker={showColorPicker === 'bgColor'} />
          <ColorField label="Колір тексту" value={element.color || '#ffffff'} onChange={(v) => onUpdate({ color: v })} onColorPickerChange={() => onColorPickerChange('color')} showPicker={showColorPicker === 'color'} />
          <NumberField label="Радіус" value={element.borderRadius || 8} onChange={(v) => onUpdate({ borderRadius: v })} />
        </>
      )}

      {element.type === 'image' && (
        <>
          <ImageField label="Зображення" value={element.src} onUpload={onImageUpload} />
          <Field label="Alt текст" value={element.alt || ''} onChange={(v) => onUpdate({ alt: v })} />
        </>
      )}

      {element.type === 'box' && (
        <>
          <ColorField label="Колір фону" value={element.bgColor || '#f0f0f0'} onChange={(v) => onUpdate({ bgColor: v })} onColorPickerChange={() => onColorPickerChange('bgColor')} showPicker={showColorPicker === 'bgColor'} />
          <NumberField label="Радіус" value={element.borderRadius || 0} onChange={(v) => onUpdate({ borderRadius: v })} />
        </>
      )}
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

// Resize Handles
function ResizeHandles({ element, onResize }) {
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });

  const handleMouseDown = (e, corner) => {
    e.stopPropagation();
    setIsResizing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ width: element.width, height: element.height });
  };

  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e) => {
        const deltaX = e.clientX - startPos.x;
        const deltaY = e.clientY - startPos.y;
        onResize(
          Math.max(50, startSize.width + deltaX),
          Math.max(50, startSize.height + deltaY)
        );
      };
      const handleMouseUp = () => setIsResizing(false);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, startPos, startSize, onResize]);

  return (
    <>
      {/* Corner handles */}
      <div
        style={{
          position: 'absolute',
          right: -4,
          bottom: -4,
          width: 8,
          height: 8,
          backgroundColor: '#7c3aed',
          border: '2px solid white',
          borderRadius: '50%',
          cursor: 'nwse-resize'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'se')}
      />
    </>
  );
}

// Canvas Preview
function CanvasPreview({ elements, canvasSize }) {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="bg-white shadow-2xl mx-auto" style={{ width: canvasSize.width, height: canvasSize.height, position: 'relative' }}>
        {elements.map((element) => (
          <div key={element.id} style={{ position: 'absolute', left: `${element.x}px`, top: `${element.y}px`, width: `${element.width}px`, height: `${element.height}px`, zIndex: element.zIndex || 0 }}>
            <CanvasElement element={element} isSelected={false} onMouseDown={() => {}} onClick={() => {}} />
          </div>
        ))}
      </div>
    </div>
  );
}

