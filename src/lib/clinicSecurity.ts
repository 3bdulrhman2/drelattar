import type { AppContentState, BookingAppointment } from '../types';

// This is a public document. Never add credentials, staff records or bookings here.
export const PUBLIC_CONTENT_KEYS = [
  'doctor', 'clinic', 'services', 'equipment', 'faq', 'social', 'bookingSettings',
  'visibility', 'googlePlacesApiKey', 'googlePlaceId', 'socialReviewImages',
] as const;
export function publicContent(value: Partial<AppContentState>): Partial<AppContentState> {
  return Object.fromEntries(PUBLIC_CONTENT_KEYS.filter(k => value[k] !== undefined)
    .map(k => [k, structuredClone(value[k])])) as Partial<AppContentState>;
}
export function assertBackendTarget(mode: string, url: string): void {
  if (mode !== 'isolated' || !url) return;
  const parsed = new URL(url);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)) {
    throw new Error('ISOLATION_GUARD: isolated builds refuse non-loopback backends');
  }
}
export interface BookingReceipt { id: string; createdAt: string; status: 'pending' }
export type BookingInput = Omit<BookingAppointment, 'id' | 'createdAt' | 'status'>;
export interface RpcClient { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{data: any; error: any}> }
const UNCERTAIN_BOOKING_MESSAGE = 'لم نتأكد من حفظ الطلب. أعد المحاولة بنفس البيانات باستخدام هذه الصفحة.';
const VALIDATION_MESSAGES: Record<string, string> = {
  'Booking closed': 'الحجز الإلكتروني مغلق حالياً. لم يتم حفظ الطلب.',
  'Clinic closed on this date': 'هذا اليوم غير متاح للحجز حسب إعدادات العيادة. لم يتم حفظ الطلب.',
  'Outside booking window': 'الموعد خارج فترة الحجز المتاحة أو أقرب من 3 ساعات. لم يتم حفظ الطلب.',
  'Invalid appointment time': 'هذا التوقيت غير متاح حسب مواعيد العيادة وفاصل الحجز. لم يتم حفظ الطلب.',
  'Invalid interval': 'تعذر الحجز بسبب إعداد فاصل المواعيد. يرجى التواصل مع العيادة.',
  'Invalid booking input': 'راجع الاسم ورقم الموبايل والموعد. لم يتم حفظ الطلب.',
  'Request ID reused with different details': 'هذا الطلب مرتبط ببيانات سابقة. راجع العيادة للتحقق قبل إنشاء طلب مختلف.',
};
export async function persistBooking(client: RpcClient | null, input: BookingInput, requestId: string): Promise<BookingReceipt> {
  if (!client) throw new Error('الحجز الإلكتروني غير متصل حالياً. لم يتم حفظ الطلب.');
  let result: {data: any; error: any};
  try { result = await client.rpc('book_appointment', {
    p_request_id: requestId, p_patient_name: input.patientName.trim(),
    p_patient_phone: input.patientPhone.trim(), p_date: input.appointmentDate,
    p_time: input.appointmentTime,
  }); } catch { throw new Error(UNCERTAIN_BOOKING_MESSAGE); }
  const {data, error} = result;
  if (error) {
    if (error.code === '22023') {
      throw new Error(VALIDATION_MESSAGES[error.message] || 'رفض الخادم بيانات هذه المحاولة. راجع البيانات وإعدادات الحجز.');
    }
    if (error.code === '23505' && error.message === 'Daily capacity reached') {
      throw new Error('اكتمل عدد الحجوزات المتاح لهذا اليوم. لم يتم حفظ الطلب.');
    }
    if (error.code === '23505' && error.message === 'Appointment slot already occupied') {
      throw new Error('هذا الموعد حُجز للتو. اختر موعداً آخر.');
    }
    throw new Error(UNCERTAIN_BOOKING_MESSAGE);
  }
  const receipt = Array.isArray(data) ? data[0] : data;
  if (!receipt?.booking_id || !receipt?.created_at) throw new Error('لم يصل تأكيد حفظ الطلب. أعد المحاولة بنفس البيانات.');
  return { id: receipt.booking_id, createdAt: receipt.created_at, status: 'pending' };
}
