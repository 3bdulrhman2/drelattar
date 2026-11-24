import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../services/auth_service.dart';
import '../services/notification_service.dart';
import '../services/reception_service.dart';

/// Manual staff push only, separate from the public website announcement.
class StaffPushScreen extends StatefulWidget {
  const StaffPushScreen({super.key});
  @override
  State<StaffPushScreen> createState() => _StaffPushScreenState();
}

class _StaffPushScreenState extends State<StaffPushScreen> {
  final _title = TextEditingController(), _body = TextEditingController();
  bool _busy = false;
  String? _result;
  String? _request;
  String? _attemptText;
  static const _senderReady = bool.fromEnvironment(
    'CLINIC_MANUAL_PUSH_READY',
    defaultValue: false,
  );
  @override
  void dispose() {
    _title.dispose();
    _body.dispose();
    super.dispose();
  }

  Future<void> _enable() async {
    setState(() => _busy = true);
    final ok = await NotificationService.requestPermission();
    if (mounted)
      setState(() {
        _busy = false;
        _result = ok
            ? 'تم تسجيل هذا الجهاز لاستقبال إشعارات الفريق'
            : 'لم يتم تسجيل الجهاز. راجع إذن الإشعارات واتصال الإنترنت';
      });
  }

  Future<void> _send() async {
    if (_busy ||
        !_senderReady ||
        _title.text.trim().isEmpty ||
        _body.text.trim().isEmpty)
      return;
    final title = _title.text.trim(), body = _body.text.trim();
    final text = '$title\n$body';
    if (text != _attemptText) {
      _request = ReceptionService.requestId();
      _attemptText = text;
    }
    final yes = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('مراجعة قبل الإرسال'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('إلى أجهزة الدكتور والسكرتارية المسجلة فقط'),
              const SizedBox(height: 12),
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(body),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('رجوع'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            child: const Text('إرسال للفريق'),
          ),
        ],
      ),
    );
    if (yes != true || !mounted) return;
    setState(() => _busy = true);
    try {
      final r = await Supabase.instance.client.functions.invoke(
        'staff-manual-push',
        body: {
          'request_id': _request,
          'action': 'send',
          'title': title,
          'body': body,
        },
      );
      if (r.status != 200) throw StateError('Not accepted');
      final d = Map<String, dynamic>.from(r.data);
      if (mounted)
        setState(
          () => _result =
              'قبلت خدمة الإشعارات ${d['accepted'] ?? 0} جهاز. تعذر ${d['failed'] ?? 0}. القبول ليس تأكيد وصول.',
        );
    } catch (_) {
      if (mounted)
        setState(
          () => _result = 'تعذر تأكيد الإرسال. لا تعاود الإرسال قبل المراجعة لتجنب التكرار.',
        );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final doctor = AuthService.currentUser?.role == UserRole.admin;
    return Scaffold(
      appBar: AppBar(title: const Text('إشعارات فريق العيادة')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'إشعارات يدوية للدكتور والسكرتارية فقط. لا تُرسل للمرضى ولا تُنشر على الموقع.',
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _busy || !_senderReady ? null : _enable,
            icon: const Icon(Icons.notifications_outlined),
            label: const Text('تفعيل الاستقبال على هذا الجهاز'),
          ),
          if (!_senderReady)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text(
                'خدمة الإرسال لم تجهز بعد. لم يتم تسجيل هذا الجهاز أو إرسال إشعار.',
              ),
            ),
          if (doctor) ...[
            const Divider(height: 32),
            TextField(
              controller: _title,
              maxLength: 120,
              decoration: const InputDecoration(labelText: 'عنوان الإشعار'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _body,
              maxLength: 500,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'نص الإشعار'),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: _busy || !_senderReady ? null : _send,
              child: const Text('مراجعة وإرسال للفريق'),
            ),
          ],
          if (_result != null)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Text(_result!),
            ),
        ],
      ),
    );
  }
}
