// Service Worker لتشغيل التطبيق بدون إنترنت (Offline)
// v2: على كل تحديث للعبة، غيّر رقم الإصدار هنا (مثلاً v3, v4 ...) — هذا وحده
// كافٍ لإجبار كل الأجهزة على تحميل النسخة الجديدة فوراً من أول فتحة، بدل
// الحاجة لفتح التطبيق مرتين. لا تحتاج لتغيير أي شيء آخر في هذا الملف.
const CACHE_NAME = 'parrot-world-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// عند التثبيت: خزّن كل ملفات التطبيق محلياً، وفعّل النسخة الجديدة فوراً
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// عند التفعيل: احذف كل النسخ القديمة من الكاش فوراً، وتولَّ التحكم بكل
// الصفحات المفتوحة حالياً بدون انتظار إعادة تحميلها يدوياً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// عند كل طلب لصفحة HTML (التنقل الرئيسي): جرّب الشبكة أولاً لضمان أحدث
// نسخة فوراً؛ إن فشل الاتصال (بدون إنترنت)، استخدم النسخة المخزّنة كخطة
// بديلة. لبقية الملفات (صور، إلخ): النسخة المخزّنة أولاً لسرعة التحميل،
// مع تحديثها بصمت في الخلفية لاستخدامها في المرة القادمة.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isNavigation = event.request.mode === 'navigate' ||
    (event.request.destination === 'document');

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => cachedResponse);
      return cachedResponse || networkFetch;
    })
  );
});
