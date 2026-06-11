"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, string>;

const en: Dict = {
  // nav
  "nav.dashboard": "Dashboard",
  "nav.overview": "Home Overview",
  "nav.twin": "Digital Twin",
  "nav.map": "Home Map",
  "nav.devices": "Devices",
  "nav.energy": "Energy Center",
  "nav.ai": "AI Center",
  "nav.automation": "Automations",
  "nav.security": "Security",
  "nav.notifications": "Notifications",
  "nav.analytics": "Analytics",
  "nav.profile": "Profile",
  "nav.settings": "Settings",
  "nav.sectionMain": "Control",
  "nav.sectionIntel": "Intelligence",
  "nav.sectionSystem": "System",
  // common
  "common.live": "Live",
  "common.offline": "Offline",
  "common.online": "Online",
  "common.connected": "Connected",
  "common.viewAll": "View all",
  "common.signIn": "Sign in",
  "common.getStarted": "Get started",
  "common.signOut": "Sign out",
  "common.welcomeBack": "Welcome back",
  "common.liveDemo": "Live demo",
  "common.startFree": "Start free",
  "common.brand": "Smart Home AI",
  // landing
  "landing.badge": "AI + IoT + SaaS, in one platform",
  "landing.heroTitle": "The intelligent control center for your",
  "landing.heroAccent": "smart home",
  "landing.heroDesc":
    "Monitor devices, predict energy consumption, detect anomalies and cut costs with a real machine-learning engine — all from one beautiful dashboard.",
  "landing.featuresTitle": "Everything you need to run a smart home",
  "landing.featuresDesc":
    "A production-grade architecture: Frontend → Backend API → AI Engine → Database → IoT.",
  "landing.ctaTitle": "Ready to make your home smarter?",
  "landing.ctaDesc": "Create an account and explore the full dashboard with realistic demo data.",
  "landing.ctaButton": "Get started for free",
  "landing.footer":
    "Smart Home AI Platform · Designed & built by Abdulaziz AlAmawi · Next.js · Express · Prisma · scikit-learn",
  "stat.aiModules": "AI Modules",
  "stat.apiModules": "API Modules",
  "stat.forecast": "Forecast R²",
  "stat.ready": "Production Ready",
  "feat.energy.t": "Energy Analytics",
  "feat.energy.d": "Real-time consumption tracking with daily and monthly cost breakdowns.",
  "feat.ai.t": "AI Recommendations",
  "feat.ai.d": "ML-driven insights for cost savings, efficiency and anomaly detection.",
  "feat.auto.t": "Automation Rules",
  "feat.auto.d": "Trigger device actions on schedules, sensors or AI recommendations.",
  "feat.forecast.t": "Predictive Forecasting",
  "feat.forecast.d": "Forecast upcoming energy use with a trained gradient-boosting model.",
  "feat.notif.t": "Smart Notifications",
  "feat.notif.d": "Get alerted on anomalies, high consumption and key events.",
  "feat.security.t": "Enterprise Security",
  "feat.security.d": "JWT auth, role-based access control and full audit logging.",
  // pages — shared
  "page.refresh": "Refresh",
  "page.search": "Search",
  "page.all": "All",
  "page.noData": "No data available",
  // overview
  "overview.title": "Home Overview",
  "overview.subtitle": "Live state of your smart home, in real time",
  "overview.devicesOnline": "Devices online",
  "overview.activeNow": "Active now",
  "overview.netPower": "Net power",
  "overview.health": "System health",
  "overview.rooms": "Rooms",
  "overview.liveFeed": "Live event feed",
  "overview.noEvents": "Waiting for live events…",
  // digital twin
  "twin.title": "Digital Twin",
  "twin.subtitle": "Interactive model of your home",
  "twin.temperature": "Temperature",
  "twin.humidity": "Humidity",
  "twin.occupancy": "Occupancy",
  "twin.devices": "Devices",
  "twin.energy": "Energy",
  "twin.health": "Health",
  "twin.roomDevices": "Room devices",
  "twin.roomAnalytics": "Room analytics",
  "twin.selectRoom": "Select a room to inspect",
  "twin.people": "people",
  // map
  "map.title": "Smart Home Map",
  "map.subtitle": "Floor-plan view of rooms, zones and alerts",
  "map.floor": "Floor",
  "map.zones": "Temperature zones",
  // devices
  "devices.title": "Device Control Center",
  "devices.subtitle": "Manage and monitor every connected device",
  "devices.bulkOn": "Turn on",
  "devices.bulkOff": "Turn off",
  "devices.selected": "selected",
  "devices.health": "Health",
  "devices.battery": "Battery",
  "devices.signal": "Signal",
  "devices.lastActivity": "Last activity",
  "devices.power": "Power",
  // ai center
  "ai.title": "AI Command Center",
  "ai.subtitle": "Explainable, ML-driven intelligence for your home",
  "ai.generate": "Generate insights",
  "ai.confidence": "Confidence",
  "ai.impact": "Impact",
  "ai.savings": "Est. savings",
  "ai.reason": "Why",
  "ai.forecast": "Energy forecast (24h)",
  "ai.maintenance": "Predictive maintenance",
  "ai.apply": "Apply",
  "ai.dismiss": "Dismiss",
  // energy
  "energy.title": "Energy Intelligence Center",
  "energy.subtitle": "Consumption, cost and efficiency analytics",
  "energy.monthlyKwh": "Monthly energy",
  "energy.monthlyCost": "Monthly cost",
  "energy.efficiency": "Efficiency score",
  "energy.peak": "Peak hour",
  "energy.heatmap": "Weekly usage heatmap",
  "energy.byDevice": "Top consumers",
  "energy.forecast": "AI forecast",
  // automation
  "automation.title": "Automation Engine",
  "automation.subtitle": "No-code IF / THEN rules for your home",
  "automation.newRule": "New rule",
  "automation.if": "IF",
  "automation.then": "THEN",
  "automation.when": "When",
  "automation.do": "Do",
  "automation.enabled": "Enabled",
  "automation.disabled": "Disabled",
  "automation.test": "Test",
  "automation.save": "Save rule",
  "automation.cancel": "Cancel",
  // security
  "security.title": "Security & Events Center",
  "security.subtitle": "Monitor alerts, anomalies and system events",
  "security.critical": "Critical",
  "security.warning": "Warning",
  "security.info": "Information",
  "security.allClear": "All clear — no active alerts",
  // analytics
  "analytics.title": "Analytics",
  "analytics.subtitle": "Historical reports and long-term trends",
  // nav additions
  "nav.executive": "Executive",
  "nav.maintenance": "Maintenance",
  "nav.soc": "Security Ops",
  // executive
  "exec.title": "Executive Command Center",
  "exec.subtitle": "Boardroom view of your smart home operations",
  "exec.overall": "Overall score",
  "exec.homeHealth": "Home Health",
  "exec.aiConfidence": "AI Confidence",
  "exec.deviceReliability": "Device Reliability",
  "exec.energyEfficiency": "Energy Efficiency",
  "exec.security": "Security",
  "exec.savings": "Savings",
  "exec.monthlySavings": "Monthly savings",
  "exec.summary": "Executive summary",
  // maintenance
  "maint.title": "Predictive Maintenance Center",
  "maint.subtitle": "ML-driven lifespan, failure risk and service scheduling",
  "maint.lifespan": "Lifespan",
  "maint.failureProb": "Failure probability",
  "maint.risk": "Risk",
  "maint.schedule": "Suggested service",
  "maint.recommendation": "Recommendation",
  "maint.healthy": "Healthy",
  "maint.atRisk": "At risk",
  "maint.critical": "Critical",
  "maint.remaining": "Est. remaining life",
  "maint.days": "days",
  "maint.months": "months",
  "maint.allHealthy": "All devices healthy — no service required",
  // SOC
  "soc.title": "Security Operations Center",
  "soc.subtitle": "Live monitoring of cameras, sensors and access points",
  "soc.cameras": "Active cameras",
  "soc.sensors": "Active sensors",
  "soc.doors": "Access points",
  "soc.intrusions": "Intrusion events",
  "soc.timeline": "Security timeline",
  "soc.doorActivity": "Door activity",
  "soc.armed": "Armed",
  "soc.status": "System status",
  "soc.secure": "Secure",
  "soc.alert": "Alert",
  // login
  "login.title": "Welcome back",
  "login.subtitle": "Sign in to your dashboard",
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "Sign in",
  "login.noAccount": "Don't have an account?",
  "login.signUp": "Sign up",
  "login.demo": "Demo: demo@smarthome.ai / Demo123!",
  "login.failed": "Login failed",
  // register
  "register.title": "Create your account",
  "register.subtitle": "Start managing your smart home with AI",
  "register.fullName": "Full name",
  "register.email": "Email",
  "register.password": "Password",
  "register.passwordHint": "At least 8 characters",
  "register.submit": "Create account",
  "register.haveAccount": "Already have an account?",
  "register.signIn": "Sign in",
  "register.pwError": "Password must be at least 8 characters",
  "register.failed": "Registration failed",
};

const ar: Dict = {
  // nav
  "nav.dashboard": "لوحة التحكم",
  "nav.overview": "نظرة عامة",
  "nav.twin": "التوأم الرقمي",
  "nav.map": "خريطة المنزل",
  "nav.devices": "الأجهزة",
  "nav.energy": "مركز الطاقة",
  "nav.ai": "مركز الذكاء الاصطناعي",
  "nav.automation": "الأتمتة",
  "nav.security": "الأمان",
  "nav.notifications": "الإشعارات",
  "nav.analytics": "التحليلات",
  "nav.profile": "الملف الشخصي",
  "nav.settings": "الإعدادات",
  "nav.sectionMain": "التحكّم",
  "nav.sectionIntel": "الذكاء",
  "nav.sectionSystem": "النظام",
  // common
  "common.live": "مباشر",
  "common.offline": "غير متصل",
  "common.online": "متصل",
  "common.connected": "متصل",
  "common.viewAll": "عرض الكل",
  "common.signIn": "تسجيل الدخول",
  "common.getStarted": "ابدأ الآن",
  "common.signOut": "تسجيل الخروج",
  "common.welcomeBack": "مرحبًا بعودتك",
  "common.liveDemo": "تجربة مباشرة",
  "common.startFree": "ابدأ مجانًا",
  "common.brand": "Smart Home AI",
  // landing
  "landing.badge": "ذكاء اصطناعي + إنترنت الأشياء + SaaS في منصة واحدة",
  "landing.heroTitle": "مركز التحكم الذكي",
  "landing.heroAccent": "لمنزلك الذكي",
  "landing.heroDesc":
    "راقب الأجهزة، وتنبّأ باستهلاك الطاقة، واكتشف الحالات الشاذة، وخفّض التكاليف عبر محرّك تعلّم آلي حقيقي — كل ذلك من لوحة تحكم واحدة أنيقة.",
  "landing.featuresTitle": "كل ما تحتاجه لإدارة منزل ذكي",
  "landing.featuresDesc":
    "بنية جاهزة للإنتاج: الواجهة → واجهة الـ API → محرّك الذكاء الاصطناعي → قاعدة البيانات → إنترنت الأشياء.",
  "landing.ctaTitle": "هل أنت مستعد لجعل منزلك أكثر ذكاءً؟",
  "landing.ctaDesc": "أنشئ حسابًا واستكشف لوحة التحكم الكاملة ببيانات تجريبية واقعية.",
  "landing.ctaButton": "ابدأ مجانًا الآن",
  "landing.footer":
    "منصة Smart Home AI · تصميم وتطوير عبدالعزيز العمَّاوي · Next.js · Express · Prisma · scikit-learn",
  "stat.aiModules": "وحدات ذكاء اصطناعي",
  "stat.apiModules": "وحدات API",
  "stat.forecast": "دقة التنبّؤ R²",
  "stat.ready": "جاهزية الإنتاج",
  "feat.energy.t": "تحليلات الطاقة",
  "feat.energy.d": "تتبّع الاستهلاك لحظيًا مع تفصيل للتكاليف اليومية والشهرية.",
  "feat.ai.t": "توصيات الذكاء الاصطناعي",
  "feat.ai.d": "رؤى مبنية على التعلّم الآلي لتوفير التكاليف والكفاءة وكشف الشذوذ.",
  "feat.auto.t": "قواعد الأتمتة",
  "feat.auto.d": "تشغيل الأجهزة تلقائيًا حسب الجداول أو المستشعرات أو توصيات الذكاء الاصطناعي.",
  "feat.forecast.t": "التنبّؤ المستقبلي",
  "feat.forecast.d": "توقّع استهلاك الطاقة القادم عبر نموذج Gradient Boosting مدرَّب.",
  "feat.notif.t": "إشعارات ذكية",
  "feat.notif.d": "تنبيهات فورية عند الشذوذ والاستهلاك المرتفع والأحداث المهمة.",
  "feat.security.t": "أمان للمؤسسات",
  "feat.security.d": "مصادقة JWT وتحكّم بالصلاحيات حسب الأدوار وسجل تدقيق كامل.",
  // pages — shared
  "page.refresh": "تحديث",
  "page.search": "بحث",
  "page.all": "الكل",
  "page.noData": "لا توجد بيانات",
  // overview
  "overview.title": "نظرة عامة على المنزل",
  "overview.subtitle": "الحالة اللحظية لمنزلك الذكي في الوقت الفعلي",
  "overview.devicesOnline": "أجهزة متصلة",
  "overview.activeNow": "نشطة الآن",
  "overview.netPower": "صافي الطاقة",
  "overview.health": "صحة النظام",
  "overview.rooms": "الغرف",
  "overview.liveFeed": "تدفّق الأحداث المباشر",
  "overview.noEvents": "بانتظار الأحداث المباشرة…",
  // digital twin
  "twin.title": "التوأم الرقمي",
  "twin.subtitle": "نموذج تفاعلي لمنزلك",
  "twin.temperature": "الحرارة",
  "twin.humidity": "الرطوبة",
  "twin.occupancy": "الإشغال",
  "twin.devices": "الأجهزة",
  "twin.energy": "الطاقة",
  "twin.health": "الصحة",
  "twin.roomDevices": "أجهزة الغرفة",
  "twin.roomAnalytics": "تحليلات الغرفة",
  "twin.selectRoom": "اختر غرفة لفحصها",
  "twin.people": "أشخاص",
  // map
  "map.title": "خريطة المنزل الذكي",
  "map.subtitle": "عرض مخطّط الطوابق للغرف والمناطق والتنبيهات",
  "map.floor": "الطابق",
  "map.zones": "مناطق الحرارة",
  // devices
  "devices.title": "مركز التحكّم بالأجهزة",
  "devices.subtitle": "إدارة ومراقبة كل جهاز متصل",
  "devices.bulkOn": "تشغيل",
  "devices.bulkOff": "إيقاف",
  "devices.selected": "محدّد",
  "devices.health": "الصحة",
  "devices.battery": "البطارية",
  "devices.signal": "الإشارة",
  "devices.lastActivity": "آخر نشاط",
  "devices.power": "الطاقة",
  // ai center
  "ai.title": "مركز قيادة الذكاء الاصطناعي",
  "ai.subtitle": "ذكاء قابل للتفسير مبني على التعلّم الآلي لمنزلك",
  "ai.generate": "توليد رؤى",
  "ai.confidence": "الثقة",
  "ai.impact": "الأثر",
  "ai.savings": "التوفير المقدَّر",
  "ai.reason": "السبب",
  "ai.forecast": "توقّع الطاقة (24 ساعة)",
  "ai.maintenance": "الصيانة التنبّؤية",
  "ai.apply": "تطبيق",
  "ai.dismiss": "تجاهل",
  // energy
  "energy.title": "مركز ذكاء الطاقة",
  "energy.subtitle": "تحليلات الاستهلاك والتكلفة والكفاءة",
  "energy.monthlyKwh": "طاقة الشهر",
  "energy.monthlyCost": "تكلفة الشهر",
  "energy.efficiency": "درجة الكفاءة",
  "energy.peak": "ساعة الذروة",
  "energy.heatmap": "خريطة حرارية للاستهلاك الأسبوعي",
  "energy.byDevice": "أعلى المستهلكين",
  "energy.forecast": "توقّع الذكاء الاصطناعي",
  // automation
  "automation.title": "محرّك الأتمتة",
  "automation.subtitle": "قواعد IF / THEN بدون برمجة لمنزلك",
  "automation.newRule": "قاعدة جديدة",
  "automation.if": "إذا",
  "automation.then": "إذن",
  "automation.when": "عندما",
  "automation.do": "نفّذ",
  "automation.enabled": "مُفعّلة",
  "automation.disabled": "متوقّفة",
  "automation.test": "اختبار",
  "automation.save": "حفظ القاعدة",
  "automation.cancel": "إلغاء",
  // security
  "security.title": "مركز الأمان والأحداث",
  "security.subtitle": "مراقبة التنبيهات والحالات الشاذة وأحداث النظام",
  "security.critical": "حرجة",
  "security.warning": "تحذير",
  "security.info": "معلومة",
  "security.allClear": "كل شيء على ما يُرام — لا تنبيهات نشطة",
  // analytics
  "analytics.title": "التحليلات",
  "analytics.subtitle": "تقارير تاريخية واتجاهات طويلة المدى",
  // nav additions
  "nav.executive": "التنفيذي",
  "nav.maintenance": "الصيانة",
  "nav.soc": "عمليات الأمان",
  // executive
  "exec.title": "مركز القيادة التنفيذي",
  "exec.subtitle": "نظرة تنفيذية شاملة على عمليات منزلك الذكي",
  "exec.overall": "الدرجة الإجمالية",
  "exec.homeHealth": "صحة المنزل",
  "exec.aiConfidence": "ثقة الذكاء الاصطناعي",
  "exec.deviceReliability": "موثوقية الأجهزة",
  "exec.energyEfficiency": "كفاءة الطاقة",
  "exec.security": "الأمان",
  "exec.savings": "التوفير",
  "exec.monthlySavings": "التوفير الشهري",
  "exec.summary": "الملخّص التنفيذي",
  // maintenance
  "maint.title": "مركز الصيانة التنبّؤية",
  "maint.subtitle": "تنبّؤ بالعمر واحتمال الفشل وجدولة الخدمة بالتعلّم الآلي",
  "maint.lifespan": "العمر الافتراضي",
  "maint.failureProb": "احتمال الفشل",
  "maint.risk": "الخطورة",
  "maint.schedule": "الخدمة المقترحة",
  "maint.recommendation": "التوصية",
  "maint.healthy": "سليم",
  "maint.atRisk": "معرّض للخطر",
  "maint.critical": "حرج",
  "maint.remaining": "العمر المتبقّي المقدَّر",
  "maint.days": "يوم",
  "maint.months": "شهر",
  "maint.allHealthy": "كل الأجهزة سليمة — لا حاجة للصيانة",
  // SOC
  "soc.title": "مركز عمليات الأمان",
  "soc.subtitle": "مراقبة حيّة للكاميرات والحسّاسات ونقاط الوصول",
  "soc.cameras": "كاميرات نشطة",
  "soc.sensors": "حسّاسات نشطة",
  "soc.doors": "نقاط الوصول",
  "soc.intrusions": "أحداث اقتحام",
  "soc.timeline": "الخط الزمني الأمني",
  "soc.doorActivity": "نشاط الأبواب",
  "soc.armed": "مُفعّل",
  "soc.status": "حالة النظام",
  "soc.secure": "آمن",
  "soc.alert": "إنذار",
  // login
  "login.title": "مرحبًا بعودتك",
  "login.subtitle": "سجّل الدخول إلى لوحة التحكم",
  "login.email": "البريد الإلكتروني",
  "login.password": "كلمة المرور",
  "login.submit": "تسجيل الدخول",
  "login.noAccount": "ليس لديك حساب؟",
  "login.signUp": "أنشئ حسابًا",
  "login.demo": "تجريبي: demo@smarthome.ai / Demo123!",
  "login.failed": "فشل تسجيل الدخول",
  // register
  "register.title": "أنشئ حسابك",
  "register.subtitle": "ابدأ بإدارة منزلك الذكي بالذكاء الاصطناعي",
  "register.fullName": "الاسم الكامل",
  "register.email": "البريد الإلكتروني",
  "register.password": "كلمة المرور",
  "register.passwordHint": "8 أحرف على الأقل",
  "register.submit": "إنشاء الحساب",
  "register.haveAccount": "لديك حساب بالفعل؟",
  "register.signIn": "تسجيل الدخول",
  "register.pwError": "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
  "register.failed": "فشل إنشاء الحساب",
};

const dicts: Record<Lang, Dict> = { ar, en };

interface I18nContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = "shai_lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Lang | null) ?? "ar";
    setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === "ar" ? "en" : "ar";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string) => dicts[lang][key] ?? dicts.en[key] ?? key,
    [lang]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ lang, dir: lang === "ar" ? "rtl" : "ltr", setLang, toggle, t }),
    [lang, setLang, toggle, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
