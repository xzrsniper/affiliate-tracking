import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, DollarSign } from 'lucide-react';

export default function Success() {
  const [searchParams] = useSearchParams();
  const [orderValue, setOrderValue] = useState(0);
  const [orderId, setOrderId] = useState('');
  const [refCode, setRefCode] = useState('');

  useEffect(() => {
    // Отримуємо параметри з URL
    const value = searchParams.get('value') || searchParams.get('total') || '0';
    const id = searchParams.get('orderId') || searchParams.get('order_id') || `ORDER-${Date.now()}`;
    
    setOrderValue(parseFloat(value) || 0);
    setOrderId(id);

    // Отримуємо ref код з localStorage (встановлений tracker.js)
    const storedRefCode = localStorage.getItem('aff_ref_code') || 
                         document.cookie.split('; ').find(row => row.startsWith('aff_ref_code='))?.split('=')[1] ||
                         searchParams.get('ref') ||
                         '';
    
    setRefCode(storedRefCode);

    // Встановлюємо ORDER_VALUE для tracker.js
    if (window.TRACKER_CONFIG) {
      window.TRACKER_CONFIG.ORDER_VALUE = parseFloat(value) || 0;
    }

    // Встановлюємо data-атрибут для витягування суми
    document.body.setAttribute('data-order-value', value);

    // Якщо tracker.js вже завантажений, викликаємо конверсію вручну
    if (window.AffiliateTracker && storedRefCode) {
      setTimeout(() => {
        window.AffiliateTracker.trackConversionManually(parseFloat(value) || 0, id);
      }, 500);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 md:p-12">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-center text-slate-800 dark:text-white mb-4">
            Дякуємо за замовлення!
          </h1>

          {/* Message */}
          <p className="text-center text-slate-600 dark:text-slate-400 text-lg mb-8">
            Ваше замовлення успішно оформлено. Ми надішлемо вам підтвердження на email.
          </p>

          {/* Order Details */}
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-8 border-2 border-violet-200 dark:border-violet-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-violet-600 dark:text-violet-400" />
              Деталі замовлення
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Номер замовлення:</span>
                <code className="px-3 py-1 bg-white dark:bg-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono font-semibold">
                  {orderId}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Сума замовлення:</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${orderValue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Дата:</span>
                <span className="text-slate-800 dark:text-white font-semibold">
                  {new Date().toLocaleString('uk-UA')}
                </span>
              </div>
            </div>
          </div>

          {/* Tracking Status */}
          {refCode ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-800 dark:text-green-300">
                <strong>✅ Tracking активний!</strong> Referral код: <code className="bg-white dark:bg-slate-700 px-2 py-1 rounded">{refCode}</code>
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                Конверсія буде автоматично відслідкована, якщо ви перейшли через tracking посилання.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>ℹ️ Для тестування:</strong> Додайте <code className="bg-white dark:bg-slate-700 px-2 py-1 rounded">?ref=ВАШ_КОД</code> до URL цієї сторінки.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                Наприклад: <code className="bg-white dark:bg-slate-700 px-2 py-1 rounded">/success?ref=ABC123&value=99.99</code>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Повернутися до Dashboard</span>
            </Link>
          </div>

          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <details className="text-sm text-slate-500 dark:text-slate-400">
                <summary className="cursor-pointer font-medium mb-2">Debug інформація</summary>
                <div className="mt-2 space-y-1 font-mono text-xs bg-slate-50 dark:bg-slate-700 p-3 rounded text-slate-800 dark:text-slate-200">
                  <div>Order ID: {orderId}</div>
                  <div>Order Value: ${orderValue.toFixed(2)}</div>
                  <div>Ref Code: {refCode || 'Не знайдено'}</div>
                  <div>URL: {window.location.href}</div>
                  <div>Tracker Available: {window.AffiliateTracker ? 'Так' : 'Ні'}</div>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

