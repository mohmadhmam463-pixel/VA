// Service Worker لتشغيل التطبيق بدون إنترنت (Offline)
// v4: على كل تحديث للعبة، غيّر رقم الإصدار هنا (مثلاً v5, v6 ...) — هذا وحده
// كافٍ لإجبار كل الأجهزة على تحميل النسخة الجديدة فوراً من أول فتحة، بدل
// الحاجة لفتح التطبيق مرتين. لا تحتاج لتغيير أي شيء آخر في هذا الملف.
const CACHE_NAME = 'parrot-world-cache-v9';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './huns-pack.html',
  './attila-horn-audio.wav',
  './attila-victory-music.mp3',
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

// عند كل طلب (بما فيها فتح الصفحة نفسها): استخدم النسخة المخزّنة فوراً
// لسرعة إقلاع مطابقة لفتح index.html مباشرة بدون أي انتظار على الشبكة،
// مع تحديثها بصمت في الخلفية لتكون جاهزة في المرة القادمة. هذا يستبدل
// الأسلوب القديم (شبكة أولاً للصفحة الرئيسية) الذي كان يجبر كل فتح/تنقل
// على انتظار رحلة شبكة كاملة قبل ظهور أي شيء، فيبدو التطبيق أبطأ من نفس
// الملف مفتوحاً مباشرة بدون Service Worker.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

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
