import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { useSiteTextEdit } from '../context/SiteTextEditContext.jsx';
import api from '../config/api.js';
import { CONTENT_FIELDS_BY_PAGE, getFieldOrderIndex } from '../config/siteContentFields.js';
import { X } from 'lucide-react';

/**
 * In "site text edit" mode (super_admin), wraps text in a clickable region that opens a modal.
 * Saves to the same page-content API as the admin form.
 */
export default function SiteEditableText({
  page,
  section,
  fieldKey,
  value,
  className = '',
  multiline = false,
  as: Tag = 'span',
  children
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isEditingThisPage, pageBeingEdited } = useSiteTextEdit();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const displayText =
    value !== undefined && value !== null ? String(value) : typeof children === 'string' ? children : '';

  const meta = useMemo(
    () => (CONTENT_FIELDS_BY_PAGE[page] || []).find((f) => f.section === section && f.key === fieldKey),
    [page, section, fieldKey]
  );

  const isMultiline = multiline || meta?.type === 'textarea';

  const canEdit =
    user?.role === 'super_admin' && isEditingThisPage && pageBeingEdited === page && page === pageBeingEdited;

  if (!canEdit) {
    return <Tag className={className}>{children !== undefined ? children : displayText}</Tag>;
  }

  const handleOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraft(displayText);
    setErr('');
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setErr('');
    try {
      const order = getFieldOrderIndex(page, section, fieldKey);
      await api.post('/api/page-content', {
        page,
        section,
        key: fieldKey,
        content: draft,
        content_type: 'text',
        order,
        is_active: true
      });
      window.dispatchEvent(new CustomEvent('lehko-page-content-refresh', { detail: { page } }));
      setOpen(false);
    } catch (e) {
      setErr(e.response?.data?.error || t('admin.siteTextEditSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const label = meta?.label || `${section}.${fieldKey}`;

  return (
    <>
      <Tag
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleOpen(e);
        }}
        className={`${className} cursor-pointer rounded-sm outline outline-2 outline-offset-2 outline-amber-400/70 hover:bg-amber-200/25 dark:outline-amber-400/50 dark:hover:bg-amber-500/15`}
      >
        {children !== undefined ? children : displayText}
      </Tag>

      {open && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="site-text-edit-title"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-600 dark:bg-slate-900">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setOpen(false)}
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 id="site-text-edit-title" className="mb-1 pr-8 text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('admin.siteTextEditModalTitle')}
            </h2>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              {label} · {section}.{fieldKey}
            </p>
            {isMultiline ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={6}
                className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            ) : (
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            )}
            {err && <p className="mb-2 text-sm text-red-600">{err}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? t('admin.siteContentSaving') : t('admin.siteTextEditModalSave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
