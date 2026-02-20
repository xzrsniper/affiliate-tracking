import { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../config/api.js';
import { Code } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export default function ConsoleCode() {
  const [sites, setSites] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [snippet, setSnippet] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', error: false });

  useEffect(() => {
    api.get('/api/websites')
      .then((res) => {
        const list = res.data?.websites || [];
        setSites(list);
        if (list.length && !selectedId) setSelectedId(String(list[0].id));
      })
      .catch(() => setMessage({ text: 'Увійдіть у LehkoTrack. Список сайтів не завантажився.', error: true }));
  }, []);

  const handleGetCode = () => {
    if (!selectedId) {
      setMessage({ text: 'Оберіть сайт', error: true });
      return;
    }
    setLoading(true);
    setMessage({ text: 'Завантаження…', error: false });
    api.post(`/api/websites/${selectedId}/configure-session`)
      .then((res) => {
        const configUrl = res.data?.configUrl || '';
        const codeMatch = configUrl.match(/lehko_cfg=([^&]+)/);
        const code = codeMatch ? codeMatch[1] : '';
        if (!code) {
          setMessage({ text: 'Помилка формату посилання', error: true });
          setLoading(false);
          return;
        }
        const mapperUrl = `${API_BASE.replace(/\/$/, '')}/api/track/mapper/${code}`;
        const s = `var s=document.createElement('script');s.src='${mapperUrl}';document.head.appendChild(s);`;
        setSnippet(s);
        setMessage({ text: 'Код готовий. Натисніть «Скопіювати в буфер».', error: false });
      })
      .catch((err) => setMessage({ text: err.response?.data?.error || 'Помилка', error: true }))
      .finally(() => setLoading(false));
  };

  const handleCopy = () => {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet)
      .then(() => setMessage({ text: 'Скопійовано!', error: false }))
      .catch(() => setMessage({ text: 'Не вдалося скопіювати', error: true }));
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <Code className="w-6 h-6 text-amber-500" />
          Код для консолі (Visual Mapper)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Оберіть сайт, натисніть «Отримати код». На сайті клієнта: F12 → Console → вставте код → Enter. Код дійсний 10 хв.
        </p>
        <div className="space-y-3">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
          >
            <option value="">— Оберіть сайт —</option>
            {sites.map((w) => (
              <option key={w.id} value={w.id}>{w.name || w.domain || w.id}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleGetCode}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium rounded-lg"
          >
            Отримати код
          </button>
          <textarea
            readOnly
            value={snippet}
            placeholder="Тут з'явиться код після натискання «Отримати код»"
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-mono text-sm"
          />
          <button
            type="button"
            onClick={handleCopy}
            disabled={!snippet}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white font-medium rounded-lg"
          >
            Скопіювати в буфер
          </button>
        </div>
        {message.text && (
          <p className={`mt-3 text-sm ${message.error ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {message.text}
          </p>
        )}
      </div>
    </Layout>
  );
}
