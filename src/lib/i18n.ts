export type UiLanguageCode =
  | 'en'
  | 'bn'
  | 'hi'
  | 'ur'
  | 'ar'
  | 'ms'
  | 'id'
  | 'zh'
  | 'ta';

export interface LanguageOption {
  code: UiLanguageCode;
  name: string;
  nativeName: string;
  rtl?: boolean;
}

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
] as const;

export interface UiStrings {
  pageTitle: string;
  pageSubtitle: string;
  testLiveModel: string;
  step1Title: string;
  step1Subtitle: string;
  countryLabel: string;
  phoneLabel: string;
  requestCodeBtn: string;
  requestingBtn: string;
  regenerateBtn: string;
  disconnectBtn: string;
  step2Title: string;
  step2Subtitle: string;
  howToConnectTitle: string;
  stepGuide1: string;
  stepGuide2: string;
  stepGuide3: string;
  stepGuide4: string;
  demoTitle: string;
  demoSubtitle: string;
  demoPlaceholder: string;
  demoConnectBtn: string;
  interfaceLanguageLabel: string;
}

export const UI_TRANSLATIONS: Record<UiLanguageCode, UiStrings> = {
  en: {
    pageTitle: 'Link WhatsApp Device',
    pageSubtitle:
      'Enter your country code and WhatsApp number to send a Link a Device request. You can also test the live NB Bot model before linking.',
    testLiveModel: 'Test Live Bot Model',
    step1Title: '1. Phone Verification',
    step1Subtitle: 'Choose from 10 supported regions · Instant pairing code',
    countryLabel: 'Country Code (10 Regions)',
    phoneLabel: 'WhatsApp Number',
    requestCodeBtn: 'Request Link Device Code',
    requestingBtn: 'Requesting Code...',
    regenerateBtn: 'Regenerate Pairing Code',
    disconnectBtn: 'Disconnect',
    step2Title: '2. WhatsApp Pairing Code',
    step2Subtitle: 'Device authorization code & live multi-device handshake',
    howToConnectTitle: 'How to Connect on WhatsApp',
    stepGuide1: 'Open WhatsApp on your phone and go to Settings / Menu → Linked Devices.',
    stepGuide2: 'Tap Link a Device, then tap Link with phone number instead.',
    stepGuide3: 'Enter the 8-character code displayed above (or tap the notification on your phone).',
    stepGuide4: 'Once confirmed, NB Bot activates automatically in any language you write.',
    demoTitle: 'NB Bot — Live Interactive Preview Model',
    demoSubtitle: 'Replies instantly in any language you type · Test before linking WhatsApp',
    demoPlaceholder: 'Write anything or any command — NB AI replies immediately...',
    demoConnectBtn: 'Connect to My WhatsApp',
    interfaceLanguageLabel: 'Language (10 Countries)',
  },
  bn: {
    pageTitle: 'হোয়াটসঅ্যাপ ডিভাইস লিংক করুন',
    pageSubtitle:
      'আপনার দেশের কোড ও হোয়াটসঅ্যাপ নম্বর দিয়ে লিংক ডিভাইস রিকোয়েস্ট পাঠান। কানেক্ট করার আগে লাইভ মডেল পরীক্ষা করতে পারেন।',
    testLiveModel: 'লাইভ বট মডেল টেস্ট করুন',
    step1Title: '১. ফোন নম্বর যাচাই',
    step1Subtitle: '১০টি দেশ সাপোর্ট · তাৎক্ষণিক পেয়ারিং কোড',
    countryLabel: 'দেশের কোড (১০টি দেশ)',
    phoneLabel: 'হোয়াটসঅ্যাপ নম্বর',
    requestCodeBtn: 'লিংক ডিভাইস কোড নিন',
    requestingBtn: 'কোড আনা হচ্ছে...',
    regenerateBtn: 'নতুন কোড নিন',
    disconnectBtn: 'ডিসকানেক্ট',
    step2Title: '২. হোয়াটসঅ্যাপ পেয়ারিং কোড',
    step2Subtitle: 'ডিভাইস অনুমোদন কোড ও লাইভ কানেকশন',
    howToConnectTitle: 'হোয়াটসঅ্যাপে কানেক্ট করার নিয়ম',
    stepGuide1: 'ফোনে WhatsApp খুলে Settings / Menu → Linked Devices-এ যান।',
    stepGuide2: 'Link a Device চাপুন, এরপর Link with phone number instead সিলেক্ট করুন।',
    stepGuide3: 'উপরে দেখানো ৮-অক্ষরের কোডটি ফোনে দিন (অথবা নোটিফিকেশন কনফার্ম করুন)।',
    stepGuide4: 'কানেক্ট হলেই NB Bot আপনার যেকোনো ভাষার মেসেজে দ্রুত AI উত্তর দেবে।',
    demoTitle: 'NB Bot — লাইভ ইন্টারেক্টিভ মডেল',
    demoSubtitle: 'যে ভাষায় লিখবেন সেই ভাষায় দ্রুত AI উত্তর দেবে',
    demoPlaceholder: 'যেকোনো কথা বা প্রশ্ন লিখুন — সাথে সাথে AI উত্তর দেবে...',
    demoConnectBtn: 'আমার হোয়াটসঅ্যাপে কানেক্ট করুন',
    interfaceLanguageLabel: 'ভাষা (১০টি দেশ)',
  },
  hi: {
    pageTitle: 'WhatsApp डिवाइस लिंक करें',
    pageSubtitle:
      'अपना देश कोड और WhatsApp नंबर दर्ज करें। जोड़ने से पहले लाइव बॉट मॉडल की जांच करें।',
    testLiveModel: 'लाइव बॉट मॉडल टेस्ट करें',
    step1Title: '1. फ़ोन सत्यापन',
    step1Subtitle: '10 समर्थित देश · तुरंत पेयरिंग कोड',
    countryLabel: 'देश कोड (10 देश)',
    phoneLabel: 'WhatsApp नंबर',
    requestCodeBtn: 'लिंक डिवाइस कोड प्राप्त करें',
    requestingBtn: 'कोड प्राप्त हो रहा है...',
    regenerateBtn: 'नया कोड बनाएं',
    disconnectBtn: 'डिस्कनेक्ट',
    step2Title: '2. WhatsApp पेयरिंग कोड',
    step2Subtitle: 'डिवाइस कोड और लाइव कनेक्शन स्थिति',
    howToConnectTitle: 'WhatsApp पर कनेक्ट कैसे करें',
    stepGuide1: 'फ़ोन पर WhatsApp खोलें और Settings → Linked Devices पर जाएं।',
    stepGuide2: 'Link a Device टैप करें, फिर Link with phone number instead चुनें।',
    stepGuide3: 'ऊपर दिखाया गया 8-अक्षरों का कोड दर्ज करें।',
    stepGuide4: 'पुष्टि होते ही NB Bot आपकी किसी भी भाषा में तुरंत उत्तर देगा।',
    demoTitle: 'NB Bot — लाइव प्रीव्यू मॉडल',
    demoSubtitle: 'आप जिस भाषा में लिखेंगे उसी में तुरंत उत्तर मिलेगा',
    demoPlaceholder: 'कुछ भी लिखें या प्रश्न पूछें — तुरंत AI उत्तर पाएं...',
    demoConnectBtn: 'मेरे WhatsApp से कनेक्ट करें',
    interfaceLanguageLabel: 'भाषा (10 देश)',
  },
  ur: {
    pageTitle: 'واٹس ایپ ڈیوائس لنک کریں',
    pageSubtitle:
      'اپنا ملک کا کوڈ اور واٹس ایپ نمبر درج کریں۔ لنک کرنے سے پہلے لائیو بوٹ ماڈل ٹیسٹ کریں۔',
    testLiveModel: 'لائیو بوٹ ماڈل ٹیسٹ کریں',
    step1Title: '1. فون کی تصدیق',
    step1Subtitle: '10 ممالک کی سپورٹ · فوری پیئرنگ کوڈ',
    countryLabel: 'ملک کا کوڈ (10 ممالک)',
    phoneLabel: 'واٹس ایپ نمبر',
    requestCodeBtn: 'لنک ڈیوائس کوڈ حاصل کریں',
    requestingBtn: 'کوڈ حاصل کیا جا رہا ہے...',
    regenerateBtn: 'نیا کوڈ حاصل کریں',
    disconnectBtn: 'منقطع کریں',
    step2Title: '2. واٹس ایپ پیئرنگ کوڈ',
    step2Subtitle: 'ڈیوائس کوڈ اور لائیو کنکشن',
    howToConnectTitle: 'واٹس ایپ سے کیسے جوڑیں',
    stepGuide1: 'اپنے فون پر WhatsApp کھولیں اور Settings → Linked Devices میں جائیں۔',
    stepGuide2: 'Link a Device پر ٹیپ کریں، پھر Link with phone number instead منتخب کریں۔',
    stepGuide3: 'اوپر دیا گیا 8 حروف کا کوڈ درج کریں۔',
    stepGuide4: 'تصدیق کے بعد NB Bot آپ کی زبان میں فوری AI جواب دے گا۔',
    demoTitle: 'NB Bot — لائیو انٹرایکٹو ماڈل',
    demoSubtitle: 'جس زبان میں لکھیں گے اسی زبان میں فوری جواب ملے گا',
    demoPlaceholder: 'کوئی بھی سوال لکھیں — فوری AI جواب حاصل کریں...',
    demoConnectBtn: 'میرے واٹس ایپ سے جوڑیں',
    interfaceLanguageLabel: 'زبان (10 ممالک)',
  },
  ar: {
    pageTitle: 'ربط جهاز واتساب',
    pageSubtitle:
      'أدخل رمز الدولة ورقم واتساب لإرسال طلب ربط جهاز. يمكنك تجربة النموذج المباشر قبل الربط.',
    testLiveModel: 'تجربة نموذج البوت المباشر',
    step1Title: '١. التحقق من الهاتف',
    step1Subtitle: 'يدعم ١٠ دول · رمز ربط فوري',
    countryLabel: 'رمز الدولة (١٠ دول)',
    phoneLabel: 'رقم واتساب',
    requestCodeBtn: 'طلب رمز ربط الجهاز',
    requestingBtn: 'جاري طلب الرمز...',
    regenerateBtn: 'إعادة إنشاء الرمز',
    disconnectBtn: 'قطع الاتصال',
    step2Title: '٢. رمز اقتران واتساب',
    step2Subtitle: 'رمز التفويض وحالة الاتصال المباشر',
    howToConnectTitle: 'كيفية الاتصال على واتساب',
    stepGuide1: 'افتح واتساب على هاتفك وانتقل إلى الإعدادات ← الأجهزة المرتبطة.',
    stepGuide2: 'اضغط على ربط جهاز، ثم اختر الربط برقم الهاتف بدلاً من ذلك.',
    stepGuide3: 'أدخل الرمز المكون من ٨ أحرف الظاهر أعلاه.',
    stepGuide4: 'بمجرد التأكيد، سيجيب NB Bot فوراً بأي لغة تكتب بها.',
    demoTitle: 'NB Bot — نموذج المعاينة المباشر',
    demoSubtitle: 'يرد فوراً بأي لغة تكتبها',
    demoPlaceholder: 'اكتب أي سؤال أو رسالة وسيجيب الذكاء الاصطناعي فوراً...',
    demoConnectBtn: 'الاتصال بواتساب الخاص بي',
    interfaceLanguageLabel: 'اللغة (١٠ دول)',
  },
  ms: {
    pageTitle: 'Pautkan Peranti WhatsApp',
    pageSubtitle:
      'Masukkan kod negara dan nombor WhatsApp anda untuk menghantar permintaan pautan peranti. Uji model langsung sebelum menyambung.',
    testLiveModel: 'Uji Model Bot Langsung',
    step1Title: '1. Pengesahan Telefon',
    step1Subtitle: '10 negara disokong · Kod gandingan segera',
    countryLabel: 'Kod Negara (10 Negara)',
    phoneLabel: 'Nombor WhatsApp',
    requestCodeBtn: 'Minta Kod Pautan Peranti',
    requestingBtn: 'Meminta Kod...',
    regenerateBtn: 'Jana Semula Kod',
    disconnectBtn: 'Putuskan Sambungan',
    step2Title: '2. Kod Gandingan WhatsApp',
    step2Subtitle: 'Kod pengesahan peranti & status sambungan',
    howToConnectTitle: 'Cara Menyambung di WhatsApp',
    stepGuide1: 'Buka WhatsApp di telefon anda dan pergi ke Tetapan → Peranti Terpaut.',
    stepGuide2: 'Ketik Pautkan Peranti, kemudian pilih Pautkan dengan nombor telefon.',
    stepGuide3: 'Masukkan kod 8 aksara yang dipaparkan di atas.',
    stepGuide4: 'Setelah disahkan, NB Bot akan membalas pantas dalam apa jua bahasa anda.',
    demoTitle: 'NB Bot — Model Pratonton Langsung',
    demoSubtitle: 'Membalas pantas dalam bahasa yang anda tulis',
    demoPlaceholder: 'Tulis apa-apa soalan — AI akan membalas serta-merta...',
    demoConnectBtn: 'Sambung ke WhatsApp Saya',
    interfaceLanguageLabel: 'Bahasa (10 Negara)',
  },
  id: {
    pageTitle: 'Tautkan Perangkat WhatsApp',
    pageSubtitle:
      'Masukkan kode negara dan nomor WhatsApp Anda untuk mengirim permintaan tautan perangkat. Uji model bot langsung sebelum menghubungkan.',
    testLiveModel: 'Uji Model Bot Langsung',
    step1Title: '1. Verifikasi Nomor',
    step1Subtitle: '10 negara didukung · Kode pairing instan',
    countryLabel: 'Kode Negara (10 Negara)',
    phoneLabel: 'Nomor WhatsApp',
    requestCodeBtn: 'Minta Kode Tautan Perangkat',
    requestingBtn: 'Meminta Kode...',
    regenerateBtn: 'Buat Ulang Kode',
    disconnectBtn: 'Putuskan',
    step2Title: '2. Kode Pairing WhatsApp',
    step2Subtitle: 'Kode otorisasi perangkat & status koneksi',
    howToConnectTitle: 'Cara Menghubungkan di WhatsApp',
    stepGuide1: 'Buka WhatsApp di ponsel Anda lalu masuk ke Setelan → Perangkat Tertaut.',
    stepGuide2: 'Ketuk Tautkan Perangkat, lalu ketuk Tautkan dengan nomor telepon.',
    stepGuide3: 'Masukkan kode 8 karakter yang tampil di atas.',
    stepGuide4: 'Setelah dikonfirmasi, NB Bot langsung aktif dan membalas dalam bahasa apa pun.',
    demoTitle: 'NB Bot — Model Pratinjau Langsung',
    demoSubtitle: 'Membalas cepat sesuai bahasa yang Anda tulis',
    demoPlaceholder: 'Tulis apa saja — AI akan langsung menjawab...',
    demoConnectBtn: 'Hubungkan ke WhatsApp Saya',
    interfaceLanguageLabel: 'Bahasa (10 Negara)',
  },
  zh: {
    pageTitle: '连接 WhatsApp 设备',
    pageSubtitle:
      '输入国家区号和 WhatsApp 号码发送设备配对请求。连接前可先测试实时机器人模型。',
    testLiveModel: '测试实时机器人模型',
    step1Title: '1. 手机号码验证',
    step1Subtitle: '支持 10 个国家 · 即时配对码',
    countryLabel: '国家区号（10 个国家）',
    phoneLabel: 'WhatsApp 号码',
    requestCodeBtn: '获取设备配对码',
    requestingBtn: '正在获取配对码...',
    regenerateBtn: '重新生成配对码',
    disconnectBtn: '断开连接',
    step2Title: '2. WhatsApp 配对码',
    step2Subtitle: '设备授权码与实时连接状态',
    howToConnectTitle: '如何在 WhatsApp 中连接',
    stepGuide1: '在手机上打开 WhatsApp，进入 设置 → 已关联的设备。',
    stepGuide2: '点击 关联设备，然后选择 改用电话号码关联。',
    stepGuide3: '输入上方显示的 8 位配对码。',
    stepGuide4: '确认后，NB Bot 将自动使用您输入的任何语言快速回复。',
    demoTitle: 'NB Bot — 实时交互预览模型',
    demoSubtitle: '使用您输入的任何语言快速回复',
    demoPlaceholder: '输入任何问题或内容 — AI 将立即回复...',
    demoConnectBtn: '连接到我的 WhatsApp',
    interfaceLanguageLabel: '语言（10 个国家）',
  },
  ta: {
    pageTitle: 'WhatsApp சாதனத்தை இணைக்கவும்',
    pageSubtitle:
      'உங்கள் நாட்டு குறியீடு மற்றும் WhatsApp எண்ணை உள்ளிடவும். இணைப்பதற்கு முன் நேரடி பாட் மாதிரியை சோதிக்கவும்.',
    testLiveModel: 'நேரடி பாட் மாதிரியை சோதிக்கவும்',
    step1Title: '1. தொலைபேசி சரிபார்ப்பு',
    step1Subtitle: '10 நாடுகள் ஆதரவு · உடனடி இணைப்பு குறியீடு',
    countryLabel: 'நாட்டு குறியீடு (10 நாடுகள்)',
    phoneLabel: 'WhatsApp எண்',
    requestCodeBtn: 'இணைப்பு குறியீட்டைப் பெறுக',
    requestingBtn: 'குறியீடு பெறப்படுகிறது...',
    regenerateBtn: 'புதிய குறியீடு பெறுக',
    disconnectBtn: 'துண்டி',
    step2Title: '2. WhatsApp இணைப்பு குறியீடு',
    step2Subtitle: 'சாதன அங்கீகார குறியீடு & நேரலை நிலை',
    howToConnectTitle: 'WhatsApp இல் இணைப்பது எப்படி',
    stepGuide1: 'உங்கள் தொலைபேசியில் WhatsApp திறந்து Settings → Linked Devices செல்லவும்.',
    stepGuide2: 'Link a Device தட்டி, பின் Link with phone number instead தேர்ந்தெடுக்கவும்.',
    stepGuide3: 'மேலே காட்டப்பட்டுள்ள 8-எழுத்து குறியீட்டை உள்ளிடவும்.',
    stepGuide4: 'உறுதிப்படுத்தியவுடன் NB Bot நீங்கள் எழுதும் எந்த மொழியிலும் உடனே பதிலளிக்கும்.',
    demoTitle: 'NB Bot — நேரடி முன்னோட்ட மாதிரி',
    demoSubtitle: 'நீங்கள் எழுதும் மொழியில் உடனடி AI பதில்',
    demoPlaceholder: 'எதை வேண்டுமானாலும் எழுதுங்கள் — AI உடனே பதிலளிக்கும்...',
    demoConnectBtn: 'என் WhatsApp உடன் இணைக்கவும்',
    interfaceLanguageLabel: 'மொழி (10 நாடுகள்)',
  },
};
