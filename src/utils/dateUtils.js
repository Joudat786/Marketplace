/**
 * ============================================================
 * 🚨 قاعدة إلزامية للمطورين / MANDATORY RULE FOR DEVELOPERS
 * ============================================================
 *
 * ❌ ممنوع تنسيق التاريخ داخل الصفحات أو المكونات مباشرة.
 *    لا تستخدم: new Date().toLocaleString(), .toLocaleDateString(),
 *    .getHours(), .getDate(), .getMonth(), .getFullYear() لأغراض العرض.
 *
 * ✅ جميع التواريخ المعروضة للمستخدم يجب أن تمر عبر هذا الملف فقط:
 *    import { formatDateRiyadh } from "@/utils/dateUtils";
 *    import { formatDateOnlyRiyadh } from "@/utils/dateUtils";
 *
 * 📌 السبب: قاعدة البيانات تخزن التواريخ بـ UTC بدون مؤشر Z أحياناً،
 *    هذه الدوال تضمن تحويلها بشكل صحيح لتوقيت الرياض Asia/Riyadh (UTC+3).
 *
 * ============================================================
 */

/**
 * أداة تنسيق التاريخ الموحدة للنظام
 * 
 * المبدأ:
 * - التخزين في قاعدة البيانات: UTC دائماً (مثل "2025-05-29T05:17:23.000Z")
 * - العرض للمستخدم: توقيت الرياض Asia/Riyadh (UTC+3)
 * 
 * الحل: نستخدم Intl.DateTimeFormat مع timeZone: 'Asia/Riyadh' مباشرة
 * دون إضافة ساعات يدوياً لأن:
 * 1. new Date("2025-05-29T05:17:23.000Z") يُنشئ كائن UTC صحيح
 * 2. Intl.DateTimeFormat يتولى التحويل لتوقيت الرياض تلقائياً
 * 3. إضافة +3 يدوياً تُسبب خطأ مزدوجاً إذا كان المتصفح أصلاً بتوقيت الرياض
 */

const RIYADH_TZ = "Asia/Riyadh";

/**
 * يحوّل أي تاريخ إلى نص بتوقيت الرياض بالتنسيق: 2025/05/29 - 08:17:23 ص
 * @param {string|Date|null} dateInput
 * @returns {string}
 */
/**
 * يُطبّع قيمة التاريخ: إذا كانت string بدون timezone indicator يُضاف Z لتعاملها كـ UTC
 */
export function normalizeToUTC(dateInput) {
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === "string") {
    // إذا لا يحتوي على Z أو +/- timezone offset → أضف Z لتعاملها كـ UTC
    if (!/Z|[+-]\d{2}:?\d{2}$/.test(dateInput.trim())) {
      return new Date(dateInput.trim() + "Z");
    }
  }
  return new Date(dateInput);
}

export function formatDateRiyadh(dateInput) {
  if (!dateInput) return "—";
  try {
    const d = normalizeToUTC(dateInput);
    if (isNaN(d.getTime())) return "—";

    // نستخدم Intl للحصول على أجزاء التاريخ بتوقيت الرياض
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: RIYADH_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const parts = fmt.formatToParts(d);
    const get = (type) => parts.find((p) => p.type === type)?.value ?? "00";

    const year   = get("year");
    const month  = get("month");
    const day    = get("day");
    const hour   = get("hour");
    const minute = get("minute");
    const second = get("second");
    // dayPeriod قد يكون "AM"/"PM" أو "am"/"pm" أو "ص"/"م" حسب المتصفح
    const rawPeriod = get("dayPeriod").toUpperCase().trim();
    const ampm = rawPeriod === "AM" ? "ص" : "م";

    return `${year}/${month}/${day} - ${hour}:${minute}:${second} ${ampm}`;
  } catch {
    return "—";
  }
}

/**
 * تنسيق تاريخ فقط بدون وقت: 2025/05/29
 */
export function formatDateOnlyRiyadh(dateInput) {
  if (!dateInput) return "—";
  try {
    const d = normalizeToUTC(dateInput);
    if (isNaN(d.getTime())) return "—";

    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: RIYADH_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = fmt.formatToParts(d);
    const get = (type) => parts.find((p) => p.type === type)?.value ?? "00";
    return `${get("year")}/${get("month")}/${get("day")}`;
  } catch {
    return "—";
  }
}