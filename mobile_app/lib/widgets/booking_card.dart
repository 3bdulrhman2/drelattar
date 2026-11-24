import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/appointment.dart';
import '../theme/app_theme.dart';
import 'status_badge.dart';

class BookingCard extends StatelessWidget {
  final Appointment appointment;
  final Function(String newStatus)? onStatusChange;
  final VoidCallback? onDelete;
  const BookingCard({
    super.key,
    required this.appointment,
    this.onStatusChange,
    this.onDelete,
  });
  Future<void> _call() async {
    await launchUrl(Uri(scheme: 'tel', path: appointment.patientPhone));
  }

  Future<void> _whatsapp() async {
    final clean = appointment.patientPhone.replaceAll(RegExp(r'[^0-9]'), '');
    final phone = clean.startsWith('0') ? '2$clean' : clean;
    final message = Uri.encodeComponent(
      'السلام عليكم أ / ${appointment.patientName}، بخصوص حجز سيادتكم في عيادة د. محمد السيد العطار ليوم ${appointment.appointmentDate} الساعة ${appointment.appointmentTime}.',
    );
    await launchUrl(
      Uri.parse('https://wa.me/$phone?text=$message'),
      mode: LaunchMode.externalApplication,
    );
  }

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 12),
    padding: const EdgeInsets.all(15),
    decoration: BoxDecoration(
      color: context.panel,
      borderRadius: BorderRadius.circular(17),
      border: BorderDirectional(
        end: BorderSide(
          width: 3,
          color: appointment.status == 'pending'
              ? const Color(0xFFD3AB37)
              : appointment.status == 'confirmed'
              ? const Color(0xFF36A67C)
              : context.rule,
        ),
      ),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                appointment.patientName,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: context.ink,
                ),
              ),
            ),
            const SizedBox(width: 8),
            StatusBadge(status: appointment.status),
          ],
        ),
        const SizedBox(height: 7),
        Text(
          '${appointment.appointmentDate}  |  ${appointment.appointmentTime}',
          textDirection: TextDirection.ltr,
          style: TextStyle(fontSize: 11, color: context.secondaryInk),
        ),
        if (appointment.notes?.trim().isNotEmpty == true)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              appointment.notes!,
              style: TextStyle(fontSize: 11, color: context.secondaryInk),
            ),
          ),
        const SizedBox(height: 12),
        Row(
          children: [
            if (onStatusChange != null && appointment.status != 'confirmed')
              Expanded(
                child: FilledButton(
                  onPressed: () => onStatusChange!('confirmed'),
                  style: FilledButton.styleFrom(
                    backgroundColor: context.night
                        ? const Color(0xFF2A668A)
                        : AppColors.royal,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text(
                    'تأكيد الحجز',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            if (onStatusChange != null && appointment.status != 'confirmed')
              const SizedBox(width: 7),
            if (onStatusChange != null && appointment.status != 'cancelled')
              TextButton(
                onPressed: () => onStatusChange!('cancelled'),
                style: TextButton.styleFrom(
                  backgroundColor: context.night
                      ? const Color(0xFF3C2835)
                      : const Color(0xFFFCEDED),
                  foregroundColor: context.night
                      ? const Color(0xFFFFB2B2)
                      : const Color(0xFFAC3C3C),
                  minimumSize: const Size(48, 44),
                ),
                child: const Text('رفض', style: TextStyle(fontSize: 11)),
              ),
            const SizedBox(width: 7),
            TextButton(
              onPressed: _whatsapp,
              style: TextButton.styleFrom(
                backgroundColor: context.night
                    ? const Color(0xFF234638)
                    : const Color(0xFFE7F5EE),
                foregroundColor: context.night
                    ? const Color(0xFFA0E4BF)
                    : const Color(0xFF167448),
                minimumSize: const Size(64, 44),
              ),
              child: const Text('واتساب', style: TextStyle(fontSize: 11)),
            ),
            const SizedBox(width: 3),
            PopupMenuButton<String>(
              tooltip: 'تفاصيل وإجراءات الحجز',
              icon: Icon(Icons.more_vert, color: context.secondaryInk),
              onSelected: (v) {
                if (v == 'call') {
                  _call();
                } else if (v == 'delete') {
                  onDelete?.call();
                } else {
                  onStatusChange?.call(v);
                }
              },
              itemBuilder: (c) => [
                PopupMenuItem(
                  enabled: false,
                  child: Text(
                    'رقم الحجز: ${appointment.id}',
                    style: const TextStyle(fontSize: 10),
                  ),
                ),
                PopupMenuItem(
                  enabled: false,
                  child: Text(
                    appointment.patientPhone,
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
                const PopupMenuItem(value: 'call', child: Text('اتصال هاتفي')),
                if (onStatusChange != null && appointment.status != 'completed')
                  const PopupMenuItem(
                    value: 'completed',
                    child: Text('تم الكشف'),
                  ),
                if (onStatusChange != null && appointment.status != 'pending')
                  const PopupMenuItem(
                    value: 'pending',
                    child: Text('إعادة للانتظار'),
                  ),
                if (onStatusChange != null && appointment.status == 'confirmed')
                  const PopupMenuItem(value: 'confirmed', child: Text('مؤكد')),
                if (onDelete != null)
                  const PopupMenuItem(
                    value: 'delete',
                    child: Text(
                      'حذف الحجز',
                      style: TextStyle(color: Colors.red),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ],
    ),
  );
}
