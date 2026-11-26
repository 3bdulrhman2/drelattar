import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../services/auth_service.dart';
import '../services/notification_service.dart';
import '../services/reception_service.dart';

/// Notification settings (المزيد): the doctor chooses who gets a notification
/// (clinic team, website visitors who allowed notifications, or both), writes
/// the title and text, and can attach an image and a tap link.
class StaffPushScreen extends StatefulWidget {
  const StaffPushScreen({super.key});
  @override
  State<StaffPushScreen> createState() => _StaffPushScreenState();
}

class _StaffPushScreenState extends State<StaffPushScreen> {
  final _title = TextEditingController(),
      _body = TextEditingController(),
      _link = TextEditingController();
  bool _busy = false;
  String? _result;
  String? _request;
  String? _attemptKey;
  bool _senderReady = false, _visitorLive = false;
  int _staffDevices = 0, _visitorDevices = 0;
  String _audience = 'staff'; // staff | visitors | all
  Uint8List? _image;
  String? _imageNote;

  @override
  void initState() {
    super.initState();
    _loadReadiness();
  }

  Future<void> _loadReadiness() async {
    try {
      final r = await Supabase.instance.client.functions.invoke(
        'clinic-broadcast',
        body: {'action': 'status'},
      );
      final d = r.data is Map ? Map<String, dynamic>.from(r.data) : {};
      if (mounted) {
        setState(() {
          _senderReady = r.status == 200 && d['sendingReady'] == true;
          _visitorLive = d['visitorLive'] == true;
          _staffDevices = (d['staffDevices'] as num?)?.toInt() ?? 0;
          _visitorDevices = (d['visitorDevices'] as num?)?.toInt() ?? 0;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _senderReady = false);
    }
  }

  @override
  void dispose() {
    _title.dispose();
    _body.dispose();
    _link.dispose();
    super.dispose();
  }

  Future<void> _enable() async {
    setState(() => _busy = true);
    final ok = await NotificationService.requestPermission();
    if (mounted) {
      setState(() {
        _busy = false;
        _result = ok
            ? 'تم تسجيل هذا الجهاز لاستقبال إشعارات الفريق'
            : 'لم يتم تسجيل الجهاز. راجع إذن الإشعارات واتصال الإنترنت';
      });
    }
  }

  Future<void> _pickImage() async {
    try {
      final x = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        maxWidth: 1280,
        imageQuality: 80,
      );
      if (x == null) return;
      final bytes = await x.readAsBytes();
      final jpeg = bytes.length > 3 && bytes[0] == 0xff && bytes[1] == 0xd8;
      final png = bytes.length > 4 && bytes[0] == 0x89 && bytes[1] == 0x50;
      if (!jpeg && !png) {
        setState(() => _imageNote = 'الصورة لازم تكون JPG أو PNG');
        return;
      }
      if (bytes.length > 900000) {
        setState(() => _imageNote = 'الصورة كبيرة. اختر صورة أصغر (أقل من 900 كيلو)');
        return;
      }
      setState(() {
        _image = bytes;
        _imageNote = null;
      });
    } catch (_) {
      if (mounted) setState(() => _imageNote = 'تعذر فتح الصورة');
    }
  }

  String get _audienceLabel => switch (_audience) {
        'staff' => 'الدكتور والسكرتارية',
        'visitors' => 'زوار الموقع الذين فعّلوا الإشعارات',
        _ => 'الفريق + زوار الموقع',
      };

  bool get _needsVisitors => _audience != 'staff';

  Future<void> _send({required bool dry}) async {
    if (_busy || !_senderReady) return;
    final title = _title.text.trim(), body = _body.text.trim();
    if (title.isEmpty || body.isEmpty) return;
    if (!dry && _needsVisitors && !_visitorLive) return;
    final link = _link.text.trim();
    final key =
        '$title\n$body\n$_audience\n$link\n${_image?.length}\n$dry';
    if (key != _attemptKey) {
      _request = ReceptionService.requestId();
      _attemptKey = key;
    }
    if (!dry) {
      final yes = await showDialog<bool>(
        context: context,
        builder: (c) => AlertDialog(
          title: const Text('مراجعة قبل الإرسال'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('إلى: $_audienceLabel'),
                if (_needsVisitors)
                  Text('عدد أجهزة الزوار المسجلة: $_visitorDevices'),
                const SizedBox(height: 12),
                if (_image != null)
                  Image.memory(_image!, height: 120, fit: BoxFit.cover),
                const SizedBox(height: 8),
                Text(title,
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(body),
                if (link.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text('الرابط: $link'),
                ],
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
              child: const Text('إرسال'),
            ),
          ],
        ),
      );
      if (yes != true || !mounted) return;
    }
    setState(() => _busy = true);
    try {
      final r = await Supabase.instance.client.functions.invoke(
        'clinic-broadcast',
        body: {
          'request_id': _request,
          'action': 'send',
          'audience': _audience,
          'title': title,
          'body': body,
          'dry_run': dry,
          if (link.isNotEmpty) 'link': link,
          if (_image != null) 'image_base64': base64Encode(_image!),
        },
      );
      if (r.status != 200) throw StateError('Not accepted');
      final d = Map<String, dynamic>.from(r.data);
      if (mounted) {
        setState(() {
          _result = dry
              ? 'فحص بدون إرسال: ${d['accepted'] ?? 0} جهاز صالح، ${d['failed'] ?? 0} غير صالح. لم يُرسل شيء.'
              : 'قبلت خدمة الإشعارات ${d['accepted'] ?? 0} جهاز. تعذر ${d['failed'] ?? 0}. القبول ليس تأكيد وصول.';
        });
      }
      _loadReadiness();
    } catch (e) {
      var msg = 'تعذر تأكيد الإرسال. لا تعاود الإرسال قبل المراجعة لتجنب التكرار.';
      if (e is FunctionException && e.status == 403 &&
          '${e.details}'.contains('visitor_broadcast_not_enabled')) {
        msg = 'الإرسال لزوار الموقع غير مفعّل بعد.';
      } else if (e is FunctionException && e.status == 400) {
        msg = 'البيانات غير صحيحة: ${e.details is Map ? (e.details as Map)['error'] : ''}';
      }
      if (mounted) setState(() => _result = msg);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final doctor = AuthService.currentUser?.role == UserRole.admin;
    final canLive = _senderReady && !(_needsVisitors && !_visitorLive);
    return Scaffold(
      appBar: AppBar(title: const Text('الإشعارات')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('استقبال إشعارات الفريق على هذا الجهاز'),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: _busy ? null : _enable,
            icon: const Icon(Icons.notifications_outlined),
            label: const Text('تفعيل الاستقبال على هذا الجهاز'),
          ),
          if (!_senderReady)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text(
                'الإرسال غير مفعّل حاليًا. يمكنك تفعيل استقبال الإشعارات على هذا الجهاز.',
              ),
            ),
          if (doctor) ...[
            const Divider(height: 32),
            const Text('إرسال إشعار',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            RadioGroup<String>(
              groupValue: _audience,
              onChanged: (v) => setState(() => _audience = v ?? 'staff'),
              child: Column(
                children: [
                  const RadioListTile<String>(
                    value: 'staff',
                    title: Text('الدكتور والسكرتارية'),
                  ),
                  RadioListTile<String>(
                    value: 'visitors',
                    title: const Text('كل زوار الموقع الذين فعّلوا الإشعارات'),
                    subtitle: Text('المسجلون الآن: $_visitorDevices'),
                  ),
                  const RadioListTile<String>(
                    value: 'all',
                    title: Text('الجميع (الفريق + الزوار)'),
                  ),
                ],
              ),
            ),
            if (_needsVisitors && !_visitorLive)
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text(
                  'الإرسال لزوار الموقع غير مفعّل بعد. متاح الآن فحص بدون إرسال فقط.',
                ),
              ),
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
            TextField(
              controller: _link,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(
                labelText: 'رابط عند الضغط (اختياري، الافتراضي الموقع)',
              ),
            ),
            const SizedBox(height: 12),
            if (_image != null)
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.memory(_image!,
                        height: 160, width: double.infinity, fit: BoxFit.cover),
                  ),
                  PositionedDirectional(
                    top: 4,
                    end: 4,
                    child: IconButton.filled(
                      onPressed: () => setState(() => _image = null),
                      icon: const Icon(Icons.close),
                    ),
                  ),
                ],
              ),
            OutlinedButton.icon(
              onPressed: _busy ? null : _pickImage,
              icon: const Icon(Icons.image_outlined),
              label: Text(_image == null ? 'إضافة صورة' : 'تغيير الصورة'),
            ),
            if (_imageNote != null) Text(_imageNote!),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _busy || !canLive ? null : () => _send(dry: false),
              child: const Text('مراجعة وإرسال'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: _busy || !_senderReady ? null : () => _send(dry: true),
              child: const Text('فحص بدون إرسال'),
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
