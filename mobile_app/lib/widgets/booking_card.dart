import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/appointment.dart';
import '../theme/app_theme.dart';
import 'status_badge.dart';

class BookingCard extends StatelessWidget {
  final Appointment appointment;
  final Function(String newStatus)? onStatusChange;

  const BookingCard({
    super.key,
    required this.appointment,
    this.onStatusChange,
  });

  Future<void> _makeCall(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _openWhatsApp(String phone, String name) async {
    final cleanPhone = phone.replaceAll(RegExp(r'[^0-9]'), '');
    final internationalPhone =
        cleanPhone.startsWith('0') ? '2$cleanPhone' : cleanPhone;
    final message = Uri.encodeComponent(
      'السلام عليكم أ / $name، بخصوص حجز سيادتكم في عيادة د. محمد السيد العطار ليوم ${appointment.appointmentDate} الساعة ${appointment.appointmentTime}.',
    );
    final uri = Uri.parse('https://wa.me/$internationalPhone?text=$message');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A123E91),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Name and Status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppColors.royal.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.person,
                        size: 20,
                        color: AppColors.royal,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            appointment.patientName,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppColors.dark,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            'كود الحجز: ${appointment.id.length > 8 ? appointment.id.substring(0, 8) : appointment.id}',
                            style: const TextStyle(
                              fontSize: 10,
                              fontFamily: 'monospace',
                              color: AppColors.muted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              StatusBadge(status: appointment.status),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 12),

          // Details row: Date, Time, Phone
          Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 14, color: AppColors.medical),
                    const SizedBox(width: 6),
                    Text(
                      appointment.appointmentDate,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.dark),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Row(
                  children: [
                    const Icon(Icons.access_time, size: 14, color: Color(0xFF10B981)),
                    const SizedBox(width: 6),
                    Text(
                      appointment.appointmentTime,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Notes if present
          if (appointment.notes != null && appointment.notes!.trim().isNotEmpty) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                appointment.notes!,
                style: const TextStyle(fontSize: 11, color: AppColors.muted),
              ),
            ),
            const SizedBox(height: 10),
          ],

          // Action buttons: Call, WhatsApp, Status buttons
          Row(
            children: [
              // Call
              InkWell(
                onTap: () => _makeCall(appointment.patientPhone),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Icon(Icons.phone, size: 18, color: AppColors.royal),
                ),
              ),
              const SizedBox(width: 8),

              // WhatsApp
              InkWell(
                onTap: () => _openWhatsApp(appointment.patientPhone, appointment.patientName),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF86EFAC)),
                  ),
                  child: const Icon(Icons.chat, size: 18, color: Color(0xFF16A34A)),
                ),
              ),
              const Spacer(),

              // Quick Status Actions
              if (onStatusChange != null) ...[
                if (appointment.status != 'confirmed')
                  ElevatedButton(
                    onPressed: () => onStatusChange!('confirmed'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue.shade600,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      minimumSize: const Size(0, 32),
                    ),
                    child: const Text('تأكيد', style: TextStyle(fontSize: 11)),
                  ),
                const SizedBox(width: 6),
                if (appointment.status != 'completed')
                  ElevatedButton(
                    onPressed: () => onStatusChange!('completed'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      minimumSize: const Size(0, 32),
                    ),
                    child: const Text('تم الكشف', style: TextStyle(fontSize: 11)),
                  ),
                const SizedBox(width: 6),
                if (appointment.status != 'cancelled')
                  OutlinedButton(
                    onPressed: () => onStatusChange!('cancelled'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red.shade600,
                      side: BorderSide(color: Colors.red.shade200),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                      minimumSize: const Size(0, 32),
                    ),
                    child: const Text('إلغاء', style: TextStyle(fontSize: 11)),
                  ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
