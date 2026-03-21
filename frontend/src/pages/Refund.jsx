import LegalPageShell from '../components/LegalPageShell.jsx';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../config/api.js';
import SiteEditableText from '../components/SiteEditableText.jsx';

export default function Refund() {
  const { i18n } = useTranslation();
  const isUk = i18n.language === 'uk';
  const [pageContent, setPageContent] = useState({});
  const lang = isUk ? 'uk' : 'en';

  const loadPageContent = useCallback(async () => {
    try {
      const res = await api.get('/api/page-content/refund');
      if (res.data?.content) setPageContent(res.data.content);
    } catch {
      setPageContent({});
    }
  }, []);

  useEffect(() => {
    loadPageContent();
  }, [loadPageContent]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.page === 'refund') loadPageContent();
    };
    window.addEventListener('lehko-page-content-refresh', handler);
    return () => window.removeEventListener('lehko-page-content-refresh', handler);
  }, [loadPageContent]);

  const contentText = (section, key, fallback) => pageContent?.[section]?.[key]?.content || fallback;

  useEffect(() => {
    const seoTitle = contentText('seo', 'title', isUk ? 'Політика повернення коштів (Refund Policy)' : 'Refund Policy');
    const seoDescription = contentText('seo', 'description', isUk ? 'Умови повернення коштів для сервісу LehkoTrack.' : 'Refund terms for the LehkoTrack service.');
    document.title = seoTitle;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', seoDescription);
  }, [pageContent, isUk]);

  return (
    <LegalPageShell
      title={
        <SiteEditableText
          page="refund"
          section="header"
          fieldKey={`title_${lang}`}
          value={contentText('header', `title_${lang}`, isUk ? 'Політика повернення коштів (Refund Policy)' : 'Refund Policy')}
          as="span"
        />
      }
      updatedAt={
        <SiteEditableText
          page="refund"
          section="header"
          fieldKey={`updated_${lang}`}
          value={contentText('header', `updated_${lang}`, isUk ? 'Останнє оновлення: 12 березня 2026 року' : 'Last updated: March 12, 2026')}
          as="span"
        />
      }
    >
      {isUk ? (
        <>
          <p>
            <SiteEditableText
              page="refund"
              section="intro"
              fieldKey="text_uk"
              value={contentText('intro', 'text_uk', 'Ця Політика регулює умови повернення платежів за використання Сервісу LehkoTrack, доступного за адресою https://lehko.space. Здійснюючи оплату підписки, ви погоджуєтесь з цими умовами.')}
              multiline
              as="span"
            />
          </p>
          <h2 className="text-xl font-semibold">1. Характер послуги</h2>
          <p>
            LehkoTrack є програмним продуктом (SaaS). Оплата здійснюється за надання доступу до аналітичних потужностей Сервісу на визначений термін (місяць або рік).
          </p>
          <h2 className="text-xl font-semibold">2. Умови повернення (Refund)</h2>
          <p>2.1. Ви маєте право подати запит на повернення коштів протягом 7 календарних днів з моменту першої оплати.</p>
          <p>2.2. Повернення можливе лише якщо Сервіс не використовувався за призначенням.</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Створення трекінгових посилань.</li>
            <li>Запуск збору даних (кліки, події, конверсії у кабінеті).</li>
            <li>Налаштування інтеграцій через API або Webhooks.</li>
          </ul>
          <p>2.3. Повернення коштів за регулярні платежі (автоматичне продовження підписки) не здійснюється.</p>
          <h2 className="text-xl font-semibold">3. Процедура запиту</h2>
          <p>3.1. Для запиту надішліть лист на support@lehko.space з темою &quot;Refund Request&quot;.</p>
          <p>3.2. У листі вкажіть ID вашого акаунту та причину відмови від Сервісу.</p>
          <p>3.3. Адміністрація розглядає запит протягом 5 робочих днів.</p>
          <h2 className="text-xl font-semibold">4. Процес повернення грошей</h2>
          <p>4.1. Кошти повертаються виключно на той самий платіжний засіб, з якого був здійснений платіж.</p>
          <p>4.2. Термін зарахування коштів залежить від правил банку і зазвичай становить від 3 до 10 банківських днів.</p>
          <p>4.3. Комісії платіжних систем можуть бути вирахувані із суми повернення, якщо це передбачено правилами платіжного шлюзу.</p>
          <h2 className="text-xl font-semibold">5. Відмова у поверненні</h2>
          <p>
            5.1. Ми залишаємо за собою право відмовити у поверненні, якщо виявлено ознаки шахрайства або акаунт заблоковано через порушення Угоди користувача.
          </p>
          <h2 className="text-xl font-semibold">6. Контакти</h2>
          <p>Email: support@lehko.space</p>
          <p>Локація: Львів, Україна</p>
        </>
      ) : (
        <>
          <p>
            <SiteEditableText
              page="refund"
              section="intro"
              fieldKey="text_en"
              value={contentText('intro', 'text_en', 'This Refund Policy regulates the terms for refunding payments for using the LehkoTrack service available at https://lehko.space. By subscribing, you agree to these terms.')}
              multiline
              as="span"
            />
          </p>
          <h2 className="text-xl font-semibold">1. Nature of the Service</h2>
          <p>
            LehkoTrack is a software product (SaaS). Payments are made for access to the Service's analytics capabilities for a specified term (month or year).
          </p>
          <h2 className="text-xl font-semibold">2. Refund Conditions</h2>
          <p>2.1. You may submit a refund request within 7 calendar days from the date of the first payment.</p>
          <p>2.2. Refunds are available only if the Service has not been used for its intended purpose.</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Creating tracking links.</li>
            <li>Starting data collection (clicks, events, conversions in the dashboard).</li>
            <li>Configuring integrations via API or Webhooks.</li>
          </ul>
          <p>2.3. Refunds for recurring payments (automatic subscription renewal) are not provided.</p>
          <h2 className="text-xl font-semibold">3. How to Request a Refund</h2>
          <p>3.1. To request a refund, email support@lehko.space with the subject &quot;Refund Request&quot;.</p>
          <p>3.2. In your email, include your account ID and the reason for discontinuing the Service.</p>
          <p>3.3. The Administration reviews the request within 5 business days.</p>
          <h2 className="text-xl font-semibold">4. Refund Processing</h2>
          <p>4.1. Funds are refunded exclusively to the original payment method used for the purchase.</p>
          <p>4.2. Refund processing time depends on the bank and usually takes 3 to 10 business days.</p>
          <p>4.3. Payment processing fees may be deducted from the refund amount if provided by the payment gateway terms.</p>
          <h2 className="text-xl font-semibold">5. Refund Denial</h2>
          <p>
            5.1. We reserve the right to deny refunds if there are signs of fraud or if the account is blocked due to a breach of the User Agreement.
          </p>
          <h2 className="text-xl font-semibold">6. Contact</h2>
          <p>Email: support@lehko.space</p>
          <p>Location: Lviv, Ukraine</p>
        </>
      )}
    </LegalPageShell>
  );
}
