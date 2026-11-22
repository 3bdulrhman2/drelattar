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
export async function persistBooking(client: RpcClient | null, input: BookingInput, requestId: string): Promise<BookingReceipt> {
  if (!client) throw new Error('الحجز الإلكتروني غير متصل حالياً. لم يتم حفظ الطلب.');
  const { data, error } = await client.rpc('book_appointment', {
    p_request_id: requestId, p_patient_name: input.patientName.trim(),
    p_patient_phone: input.patientPhone.trim(), p_date: input.appointmentDate,
    p_time: input.appointmentTime,
  });
  if (error) {
    if (error.code === '23505') throw new Error('هذا الموعد حُجز للتو. اختر موعداً آخر.');
    throw new Error('لم نتأكد من حفظ الطلب. أعد المحاولة بنفس البيانات باستخدام هذه الصفحة.');
  }
  const receipt = Array.isArray(data) ? data[0] : data;
  if (!receipt?.booking_id || !receipt?.created_at) throw new Error('لم يصل تأكيد حفظ الطلب. أعد المحاولة بنفس البيانات.');
  return { id: receipt.booking_id, createdAt: receipt.created_at, status: 'pending' };
}
