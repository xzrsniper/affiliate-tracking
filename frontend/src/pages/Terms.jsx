import LegalPageShell from '../components/LegalPageShell.jsx';
import { useTranslation } from 'react-i18next';

export default function Terms() {
  const { i18n } = useTranslation();
  const isUk = i18n.language === 'uk';

  return (
    <LegalPageShell
      title={isUk ? 'Угода користувача' : 'User Agreement'}
      updatedAt={isUk ? 'Остання редакція: 12 березня 2026 року' : 'Last updated: March 12, 2026'}
    >
      {isUk ? (
        <>
          <p>
            Перед використанням платформи LehkoTrack (далі — Сервіс), доступної за адресою https://lehko.space,
            будь ласка, уважно ознайомтесь з цією Угодою. Реєстрація або використання будь-яких функцій Сервісу
            означає вашу повну та беззастережну згоду з усіма умовами.
          </p>
          <h2 className="text-xl font-semibold">1. Терміни та визначення</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Адміністрація — власник та оператор платформи LehkoTrack.</li>
            <li>Користувач — фізична або юридична особа, яка зареєструвала обліковий запис.</li>
            <li>Fingerprint-ідентифікація — технологія збору технічних параметрів браузера/пристрою для анонімного відстеження сесій без використання персональних даних.</li>
            <li>PII (Personally Identifiable Information) — будь-які дані, що дозволяють ідентифікувати особу (ПІБ, телефон, адреса).</li>
          </ul>
          <h2 className="text-xl font-semibold">2. Загальні положення</h2>
          <p>2.1. LehkoTrack надає програмне забезпечення як послугу (SaaS) для аналізу маркетингової ефективності.</p>
          <p>2.2. Сервіс надається на умовах "як є" (as is). Адміністрація не гарантує 100% точність даних, оскільки вони залежать від сторонніх факторів.</p>
          <h2 className="text-xl font-semibold">3. Реєстрація та безпека</h2>
          <p>3.1. Для доступу до Сервісу Користувач створює обліковий запис, використовуючи актуальну email-адресу.</p>
          <p>3.2. Користувач несе повну відповідальність за збереження паролів та за будь-які дії, здійснені через його акаунт.</p>
          <p>3.3. Адміністрація рекомендує використовувати корпоративні пошти для реєстрації бізнес-акаунтів.</p>
          <h2 className="text-xl font-semibold">4. Оплата та умови підписки</h2>
          <p>4.1. Доступ до функцій Сервісу надається згідно з обраним Тарифним планом.</p>
          <p>4.2. Всі платні тарифи працюють за моделлю рекурентних платежів (підписка).</p>
          <p>4.3. Користувач може скасувати підписку в будь-який момент в особистому кабінеті не пізніше ніж за 24 години до наступного списання.</p>
          <p>4.4. Ціни можуть бути змінені Адміністрацією з попереднім повідомленням Користувача за 30 днів.</p>
          <h2 className="text-xl font-semibold">5. Політика повернення коштів (Refund Policy)</h2>
          <p>5.1. Повернення можливе протягом 7 календарних днів з моменту першої оплати за умови, що Сервіс не використовувався для збору реального трафіку.</p>
          <p>5.2. Повернення коштів за автоматичне продовження підписки не здійснюється.</p>
          <h2 className="text-xl font-semibold">6. Конфіденційність та обробка даних</h2>
          <p>6.1. LehkoTrack не збирає PII відвідувачів Користувача. Ми відстежуємо кліки та конверсії за допомогою анонімних ідентифікаторів (Fingerprint).</p>
          <p>6.2. Користувач самостійно несе відповідальність за повідомлення відвідувачів свого сайту про використання аналітичних інструментів.</p>
          <p>6.3. Адміністрація зобов'язується не передавати дані аналітики Користувача третім особам.</p>
          <h2 className="text-xl font-semibold">7. Обмеження відповідальності</h2>
          <p>7.1. LehkoTrack не несе відповідальності за збитки від рекламних кампаній або втрачений прибуток Користувача.</p>
          <p>7.2. Ми не несемо відповідальності за перерви в роботі Сервісу, викликані збоями на стороні хостинг-провайдерів або форс-мажорними обставинами.</p>
          <p>7.3. Максимальна фінансова відповідальність Адміністрації за будь-якою претензією не може перевищувати суму останнього платежу Користувача.</p>
          <h2 className="text-xl font-semibold">8. Заборонене використання</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Відстеження трафіку на незаконні товари/послуги.</li>
            <li>Створення обманних редиректів.</li>
            <li>Будь-яка діяльність, що порушує репутацію LehkoTrack.</li>
          </ul>
          <p>8.2. Адміністрація залишає за собою право заблокувати акаунт без повернення коштів у разі виявлення шахрайських дій.</p>
          <h2 className="text-xl font-semibold">9. Інтелектуальна власність</h2>
          <p>Усі елементи дизайну, програмний код та торгова марка LehkoTrack належать Адміністрації. Будь-яке копіювання інтерфейсу або функціоналу заборонено.</p>
          <h2 className="text-xl font-semibold">10. Контакти</h2>
          <p>Назва: LehkoTrack</p>
          <p>Локація: Львів, Україна</p>
          <p>Email для юридичних питань: support@lehko.space</p>
        </>
      ) : (
        <>
          <p>
            Before using the LehkoTrack platform (the &quot;Service&quot;), available at https://lehko.space, please
            read this Agreement carefully. Registration or using any Service features means your full and
            unconditional acceptance of all terms and conditions.
          </p>
          <h2 className="text-xl font-semibold">1. Terms and Definitions</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Administration means the owner and operator of the LehkoTrack platform.</li>
            <li>User means an individual or legal entity that has created an account.</li>
            <li>Fingerprint identification means collecting technical browser/device parameters to anonymously track sessions without collecting personal data.</li>
            <li>PII (Personally Identifiable Information) means any data that allows identifying a person (name, phone, address).</li>
          </ul>
          <h2 className="text-xl font-semibold">2. General Terms</h2>
          <p>2.1. LehkoTrack provides software as a service (SaaS) for analyzing marketing performance.</p>
          <p>2.2. The Service is provided on an &quot;as is&quot; basis. The Administration does not guarantee 100% accuracy of the data, since it depends on external factors.</p>
          <h2 className="text-xl font-semibold">3. Registration and Security</h2>
          <p>3.1. To access the Service, the User creates an account using a valid email address.</p>
          <p>3.2. The User is fully responsible for keeping passwords secure and for all actions performed through their account.</p>
          <p>3.3. The Administration recommends using business email accounts for registering business accounts.</p>
          <h2 className="text-xl font-semibold">4. Payments and Subscription Terms</h2>
          <p>4.1. Access to the Service features is provided according to the selected plan.</p>
          <p>4.2. All paid plans operate on a recurring payments model (subscription).</p>
          <p>4.3. The User can cancel the subscription at any time in their personal cabinet no later than 24 hours before the next charge.</p>
          <p>4.4. Prices may be changed by the Administration with prior notice to the User 30 days in advance.</p>
          <h2 className="text-xl font-semibold">5. Refund Policy</h2>
          <p>5.1. Refunds are available within 7 calendar days from the first payment, provided that the Service has not been used to collect real traffic.</p>
          <p>5.2. Refunds for automatic subscription renewal are not provided.</p>
          <h2 className="text-xl font-semibold">6. Confidentiality and Data Processing</h2>
          <p>6.1. LehkoTrack does not collect PII from Users&apos; visitors. We track clicks and conversions using anonymous identifiers (Fingerprint).</p>
          <p>6.2. The User is solely responsible for informing visitors of their website about the use of analytics tools.</p>
          <p>6.3. The Administration commits not to share Users&apos; analytics data with third parties.</p>
          <h2 className="text-xl font-semibold">7. Limitation of Liability</h2>
          <p>7.1. LehkoTrack is not responsible for losses arising from advertising campaigns or the User&apos;s lost profits.</p>
          <p>7.2. We are not liable for interruptions of the Service caused by hosting provider failures or force majeure events.</p>
          <p>7.3. The maximum financial liability of the Administration for any claim cannot exceed the amount of the User&apos;s last payment.</p>
          <h2 className="text-xl font-semibold">8. Prohibited Use</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Tracking traffic for illegal goods/services.</li>
            <li>Creating misleading redirects.</li>
            <li>Any activity that harms the reputation of LehkoTrack.</li>
          </ul>
          <p>8.2. The Administration reserves the right to block an account without refunds in case of detected fraudulent actions.</p>
          <h2 className="text-xl font-semibold">9. Intellectual Property</h2>
          <p>All design elements, software code, and the LehkoTrack trademark are owned by the Administration. Any copying of interface or functionality is prohibited.</p>
          <h2 className="text-xl font-semibold">10. Contact</h2>
          <p>Name: LehkoTrack</p>
          <p>Location: Lviv, Ukraine</p>
          <p>Email for legal questions: support@lehko.space</p>
        </>
      )}
    </LegalPageShell>
  );
}
