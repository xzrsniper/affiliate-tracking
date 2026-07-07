import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as LinkIcon, Copy, Check } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import api from '../config/api.js';

export default function LinkShortener() {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const createShort = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShortUrl('');
    try {
      const payload = {
        original_url: url,
        name: name || null,
        link_format: 'lehko'
      };
      const res = await api.post('/api/links/create', payload);
      setShortUrl(res.data?.link?.tracking_url || '');
    } catch (err) {
      setError(err.response?.data?.error || t('shortener.error'));
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-900">{t('shortener.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('shortener.subtitle')}</p>
        </div>

        <form onSubmit={createShort} className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('shortener.targetUrl')}</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('shortener.linkName')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('shortener.linkNamePlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
            />
          </div>
          <button disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white disabled:opacity-50">
            <LinkIcon className="w-4 h-4" />
            <span>{loading ? t('shortener.generating') : t('shortener.generate')}</span>
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-700 mb-2">{t('shortener.result')}</p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 break-all min-h-12">
            {shortUrl || t('shortener.emptyResult')}
          </div>
          <button
            onClick={copy}
            disabled={!shortUrl}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t('shortener.copied') : t('shortener.copy')}</span>
          </button>
        </div>
      </div>
    </Layout>
  );
}
