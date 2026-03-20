import LegalPageShell from '../components/LegalPageShell.jsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../config/api.js';

export default function Privacy() {
  const { i18n } = useTranslation();
  const isUk = i18n.language === 'uk';
  const [pageContent, setPageContent] = useState({});
  const lang = isUk ? 'uk' : 'en';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/page-content/privacy');
        if (!cancelled && res.data?.content) setPageContent(res.data.content);
      } catch {
        if (!cancelled) setPageContent({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const contentText = (section, key, fallback) => pageContent?.[section]?.[key]?.content || fallback;

  useEffect(() => {
    const seoTitle = contentText('seo', 'title', isUk ? 'Політика конфіденційності (Privacy Policy)' : 'Privacy Policy');
    const seoDescription = contentText('seo', 'description', isUk ? 'Політика конфіденційності сервісу LehkoTrack.' : 'LehkoTrack privacy policy.');
    document.title = seoTitle;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', seoDescription);
  }, [pageContent, isUk]);

  return (
    <LegalPageShell
      title={contentText('header', `title_${lang}`, isUk ? 'Політика конфіденційності (Privacy Policy)' : 'Privacy Policy')}
      updatedAt={contentText('header', `updated_${lang}`, isUk ? 'Остання редакція: 12 березня 2026 року' : 'Last updated: March 12, 2026')}
    >
      {isUk ? (
        <>
          <p>{contentText('intro', 'text_uk', 'Ця Політика конфіденційності пояснює, як LehkoTrack (далі — «Сервіс», «Ми») збирає, обробляє та захищає дані користувачів Сервісу та відвідувачів, чий трафік аналізується через наші інструменти.')}</p>
          <h2 className="text-xl font-semibold">1. Ролі та відповідальність</h2>
          <p>1.1. LehkoTrack як Обробник (Data Processor): Ми обробляємо дані про рекламний трафік від імені наших Користувачів.</p>
          <p>1.2. Користувач як Контролер (Data Controller): Користувач несе відповідальність за законність збору даних на своїх ресурсах.</p>
          <h2 className="text-xl font-semibold">2. Які дані ми збираємо</h2>
          <p className="font-medium">2.1. Дані Користувача:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Email-адреса для авторизації та зв'язку.</li>
            <li>IP-адреса та технічні логи (для безпеки акаунту).</li>
            <li>Платіжна інформація обробляється сертифікованими платіжними шлюзами.</li>
          </ul>
          <p className="font-medium mt-3">2.2. Дані відвідувачів (трафік Користувача):</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Параметри пристрою та браузера (Fingerprint).</li>
            <li>Джерело переходу (Referrer), UTM-мітки.</li>
            <li>Геопозиція на рівні країни/міста.</li>
            <li>Дії на сайті (кліки, конверсії, сума покупки).</li>
          </ul>
          <h2 className="text-xl font-semibold">3. Технології відстеження: Cookies vs Fingerprinting</h2>
          <p>3.1. Cookies використовуються лише для підтримки сесії Користувача в панелі керування.</p>
          <p>3.2. Для трекінгу рекламного трафіку використовуємо visitor fingerprinting без збереження PII.</p>
          <p>3.3. No PII Policy: Сервіс LehkoTrack не збирає імена, адреси, номери телефонів або соціальні профілі відвідувачів.</p>
          <h2 className="text-xl font-semibold">4. Як ми використовуємо інформацію</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Для забезпечення роботи трекінгу та розрахунку ROMI.</li>
            <li>Для технічної підтримки та запобігання шахрайству.</li>
            <li>Для покращення алгоритмів ідентифікації трафіку.</li>
          </ul>
          <h2 className="text-xl font-semibold">5. Передача даних третім особам</h2>
          <p>5.1. Ми ніколи не продаємо дані рекламних кампаній або базу клієнтів.</p>
          <p>5.2. Дані можуть передаватися інфраструктурним сервісам виключно для забезпечення роботи Сервісу.</p>
          <h2 className="text-xl font-semibold">6. Термін зберігання та видалення</h2>
          <p>6.1. Дані аналітики зберігаються протягом терміну, визначеного Тарифним планом.</p>
          <p>6.2. Користувач може видалити акаунт у будь-який момент, після чого дані видаляються протягом 30 календарних днів.</p>
          <h2 className="text-xl font-semibold">7. Безпека</h2>
          <p>7.1. Всі дані передаються через HTTPS з використанням SSL-шифрування.</p>
          <p>7.2. Паролі користувачів зберігаються у хешованому вигляді.</p>
          <h2 className="text-xl font-semibold">8. Права користувачів</h2>
          <p>Ви маєте право на доступ до своїх даних, їх виправлення або видалення. Для реалізації цих прав пишіть на support@lehko.space.</p>
          <h2 className="text-xl font-semibold">9. Контакти</h2>
          <p>LehkoTrack</p>
          <p>Львів, Україна</p>
          <p>Email: support@lehko.space</p>
        </>
      ) : (
        <>
          <p>{contentText('intro', 'text_en', 'This Privacy Policy explains how LehkoTrack (the "Service", "we") collects, processes, and protects data of our users and visitors whose traffic is analyzed through our tools.')}</p>
          <h2 className="text-xl font-semibold">1. Roles and Responsibilities</h2>
          <p>1.1. LehkoTrack as a Data Processor: We process advertising traffic data on behalf of our Users.</p>
          <p>1.2. User as a Data Controller: The User is responsible for the legality of data collection on their resources.</p>
          <h2 className="text-xl font-semibold">2. What data we collect</h2>
          <p className="font-medium">2.1. User Data:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Email address for authorization and communication.</li>
            <li>IP address and technical logs (for account security).</li>
            <li>Payment information is processed by certified payment gateways.</li>
          </ul>
          <p className="font-medium mt-3">2.2. Visitor Data (User traffic):</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Device and browser parameters (Fingerprint).</li>
            <li>Referrer source, UTM tags.</li>
            <li>Geolocation at country/city level.</li>
            <li>Actions on the website (clicks, conversions, purchase amount).</li>
          </ul>
          <h2 className="text-xl font-semibold">3. Tracking Technologies: Cookies vs. Fingerprinting</h2>
          <p>3.1. Cookies are used only to maintain the User session in the control panel.</p>
          <p>3.2. For advertising traffic tracking we use visitor fingerprinting without storing PII.</p>
          <p>3.3. No PII Policy: LehkoTrack does not collect visitors&apos; names, addresses, phone numbers, or social profiles.</p>
          <h2 className="text-xl font-semibold">4. How we use information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To ensure tracking works and to calculate ROMI.</li>
            <li>For technical support and fraud prevention.</li>
            <li>To improve traffic identification algorithms.</li>
          </ul>
          <h2 className="text-xl font-semibold">5. Disclosure to Third Parties</h2>
          <p>5.1. We never sell advertising campaign data or customer databases.</p>
          <p>5.2. Data may be shared with infrastructure services only to provide the Service.</p>
          <h2 className="text-xl font-semibold">6. Retention and Deletion</h2>
          <p>6.1. Analytics data is stored for the period defined by the selected plan.</p>
          <p>6.2. The User can delete an account at any time; data will be deleted within 30 calendar days.</p>
          <h2 className="text-xl font-semibold">7. Security</h2>
          <p>7.1. All data is transmitted over HTTPS using SSL encryption.</p>
          <p>7.2. User passwords are stored in hashed form.</p>
          <h2 className="text-xl font-semibold">8. User Rights</h2>
          <p>
            You have the right to access your data, correct it, or request deletion. To exercise these rights,
            contact us at support@lehko.space.
          </p>
          <h2 className="text-xl font-semibold">9. Contact</h2>
          <p>LehkoTrack</p>
          <p>Lviv, Ukraine</p>
          <p>Email: support@lehko.space</p>
        </>
      )}
    </LegalPageShell>
  );
}
