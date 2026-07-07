import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as LinkIcon, Copy, Check } from 'lucide-react';
import Layout from '../components/Layout.jsx';

function clean(v) {
  return String(v || '').trim();
}

export default function UtmBuilder() {
  const { t } = useTranslation();
  const [baseUrl, setBaseUrl] = useState('');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);

  const resultUrl = useMemo(() => {
    const rawBase = clean(baseUrl);
    if (!rawBase) return '';

    let url;
    try {
      url = new URL(rawBase.match(/^https?:\/\//i) ? rawBase : `https://${rawBase}`);
    } catch {
      return '';
    }

    const params = [
      ['utm_source', clean(source)],
      ['utm_medium', clean(medium)],
      ['utm_campaign', clean(campaign)],
      ['utm_term', clean(term)],
      ['utm_content', clean(content)]
    ];
    params.forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
    return url.toString();
  }, [baseUrl, source, medium, campaign, term, content]);

  const copyResult = async () => {
    if (!resultUrl) return;
    await navigator.clipboard.writeText(resultUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-900">{t('utmBuilder.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('utmBuilder.subtitle')}</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('utmBuilder.baseUrl')}</label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://example.com/product"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">utm_source</label>
              <input value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">utm_medium</label>
              <input value={medium} onChange={(e) => setMedium(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">utm_campaign</label>
              <input value={campaign} onChange={(e) => setCampaign(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">utm_term</label>
              <input value={term} onChange={(e) => setTerm(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">utm_content</label>
            <input value={content} onChange={(e) => setContent(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200" />
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-700 mb-2">{t('utmBuilder.result')}</p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 break-all min-h-12">
            {resultUrl || t('utmBuilder.emptyResult')}
          </div>
          <button
            onClick={copyResult}
            disabled={!resultUrl}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t('utmBuilder.copied') : t('utmBuilder.copy')}</span>
          </button>
          <p className="mt-3 text-xs text-slate-500 flex items-center gap-1">
            <LinkIcon className="w-3 h-3" />
            {t('utmBuilder.tip')}
          </p>
        </div>
      </div>
    </Layout>
  );
}
