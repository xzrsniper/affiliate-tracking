import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * When the host serves the SPA for /r/CODE or /track/CODE (e.g. Nginx try_files → index.html),
 * this triggers a full navigation to the API redirect so the user reaches the target URL.
 */
export default function TrackingOutboundRedirect() {
  const { code } = useParams();
  const { t } = useTranslation();

  useEffect(() => {
    if (!code) return;
    const safe = encodeURIComponent(code);
    window.location.replace(`/api/links/go/${safe}`);
  }, [code]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-4">
      <p className="text-sm">{t('trackingRedirect.redirecting', 'Перенаправлення на сайт…')}</p>
    </div>
  );
}
