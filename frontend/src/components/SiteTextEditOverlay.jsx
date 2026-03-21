import { useTranslation } from 'react-i18next';
import { useSiteTextEdit } from '../context/SiteTextEditContext.jsx';
import { Check, X } from 'lucide-react';

export default function SiteTextEditOverlay() {
  const { t } = useTranslation();
  const { isEditingThisPage, finishEdit, cancelEdit } = useSiteTextEdit();

  if (!isEditingThisPage) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[9998] flex justify-center p-4">
      <div className="pointer-events-auto flex max-w-lg flex-wrap items-center justify-center gap-3 rounded-2xl border border-amber-400/80 bg-amber-50 px-5 py-4 text-amber-950 shadow-2xl dark:border-amber-500/60 dark:bg-amber-950/95 dark:text-amber-50">
        <p className="text-center text-sm font-semibold">{t('admin.siteTextEditBanner')}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => finishEdit()}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-violet-700"
          >
            <Check className="h-4 w-4" />
            {t('admin.siteTextEditDone')}
          </button>
          <button
            type="button"
            onClick={() => cancelEdit()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
            {t('admin.siteTextEditCancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
