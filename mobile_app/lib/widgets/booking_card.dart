import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/appointment.dart';
import '../theme/app_theme.dart';
import '../utils/clinic_time.dart';
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
      'السلام عليكم أ / ${appointment.patientName}، بخصوص حجز سيادتكم في عيادة د. محمد السيد العطار ليوم ${appointment.appointmentDate} الساعة ${clinicTime(appointment.appointmentTime)}.',
    );
    await launchUrl(
      Uri.parse('https://wa.me/$phone?text=$message'),
      mode: LaunchMode.externalApplication,
    );
  }

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 12),
    padding: const EdgeInsets.all(10),
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
          '${appointment.appointmentDate}  |  ${clinicTime(appointment.appointmentTime)}',
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
                      horizontal: 4,
                      vertical: 12,
                    ),
                    minimumSize: const Size(0, 44),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      'تأكيد الحجز',
                      maxLines: 1,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
            if (appointment.status == 'confirmed') const Spacer(),
            const SizedBox(width: 4),
            if (onStatusChange != null && appointment.status != 'cancelled')
              TextButton(
                onPressed: () => onStatusChange!('cancelled'),
                style: TextButton.styleFrom(
                  backgroundColor: const Color(0xFFC83F43),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(38, 36),
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                child: const Text('رفض', style: TextStyle(fontSize: 11)),
              ),
            const SizedBox(width: 3),
            IconButton(
              onPressed: _whatsapp,
              tooltip: 'واتساب',
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints.tightFor(width: 32, height: 44),
              icon: const FaIcon(
                FontAwesomeIcons.whatsapp,
                size: 23,
                color: Color(0xFF25A667),
              ),
            ),
            SizedBox(
              width: 28,
              child: PopupMenuButton<String>(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 28),
                style: IconButton.styleFrom(
                  minimumSize: const Size(28, 44),
                  padding: EdgeInsets.zero,
                ),
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
                  const PopupMenuItem(
                    value: 'call',
                    child: Text('اتصال هاتفي'),
                  ),
                  if (onStatusChange != null &&
                      appointment.status != 'completed')
                    const PopupMenuItem(
                      value: 'completed',
                      child: Text('تم الكشف'),
                    ),
                  if (onStatusChange != null && appointment.status != 'pending')
                    const PopupMenuItem(
                      value: 'pending',
                      child: Text('إعادة للانتظار'),
                    ),
                  if (onStatusChange != null &&
                      appointment.status == 'confirmed')
                    const PopupMenuItem(
                      value: 'confirmed',
                      child: Text('مؤكد'),
                    ),
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
            ),
          ],
        ),
      ],
    ),
  );
}
