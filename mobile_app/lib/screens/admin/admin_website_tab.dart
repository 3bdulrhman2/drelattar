import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/social_review.dart';
import '../../services/supabase_service.dart';
import '../../theme/app_theme.dart';

class AdminWebsiteTab extends StatefulWidget {
  AdminWebsiteTab({super.key});

  @override
  State<AdminWebsiteTab> createState() => _AdminWebsiteTabState();
}

class _AdminWebsiteTabState extends State<AdminWebsiteTab> {
  List<SocialReview> _reviews = [];
  Map<String, dynamic>? _settings;
  bool _isLoading = true;
  final ImagePicker _picker = ImagePicker();

  // Controllers for working hours
  late TextEditingController _regularHoursController;
  late TextEditingController _fridayHoursController;
  String _startTimeRegular = '13:00';
  String _endTimeRegular = '21:00';
  String _startTimeFriday = '16:00';
  String _endTimeFriday = '22:00';

  // Booking rules state
  int _slotDuration = 60;
  int _minAdvanceHours = 3;
  int _maxAdvanceDays = 14;
  List<String> _allowedDays = [
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];
  bool _enableFutureBooking = true;

  @override
  void initState() {
    super.initState();
    _regularHoursController = TextEditingController();
    _fridayHoursController = TextEditingController();

    _reviews = SupabaseService.cachedReviews;
    _settings = SupabaseService.cachedSettings;
    _isLoading = _reviews.isEmpty && _settings == null;

    if (_settings != null) {
      _extractFormValues(_settings!);
    }

    _loadData();
  }

  @override
  void dispose() {
    _regularHoursController.dispose();
    _fridayHoursController.dispose();
    super.dispose();
  }

  void _extractFormValues(Map<String, dynamic> settings) {
    final clinic = Map<String, dynamic>.from(settings['clinic'] ?? {});
    final bookingSettings = Map<String, dynamic>.from(
      settings['bookingSettings'] ?? {},
    );

    _regularHoursController.text =
        clinic['hoursRegular']?.toString() ??
        'السبت إلى الخميس: من 1:00 ظهراً حتى 9:00 مساءً';
    _fridayHoursController.text =
        clinic['hoursFriday']?.toString() ??
        'يوم الجمعة: من 4:00 عصراً حتى 10:00 مساءً';

    _startTimeRegular = bookingSettings['startTime']?.toString() ?? '13:00';
    _endTimeRegular = bookingSettings['endTime']?.toString() ?? '21:00';
    _startTimeFriday =
        bookingSettings['startTimeFriday']?.toString() ?? '16:00';
    _endTimeFriday = bookingSettings['endTimeFriday']?.toString() ?? '22:00';

    _slotDuration =
        int.tryParse(
          bookingSettings['slotDurationMinutes']?.toString() ?? '60',
        ) ??
        60;
    _minAdvanceHours =
        int.tryParse(bookingSettings['minAdvanceHours']?.toString() ?? '3') ??
        3;
    _maxAdvanceDays =
        int.tryParse(bookingSettings['maxAdvanceDays']?.toString() ?? '14') ??
        14;

    if (bookingSettings['allowedDays'] is List) {
      _allowedDays = List<String>.from(bookingSettings['allowedDays']);
    }

    _enableFutureBooking = bookingSettings['enableFutureBooking'] != false;
  }

  Future<void> _loadData({bool forceRefresh = false}) async {
    if (_reviews.isEmpty && _settings == null) {
      setState(() => _isLoading = true);
    }
    final results = await Future.wait([
      SupabaseService.getSocialReviews(forceRefresh: forceRefresh),
      SupabaseService.getClinicSettings(forceRefresh: forceRefresh),
    ]);

    if (!mounted) return;

    setState(() {
      _reviews = results[0] as List<SocialReview>;
      _settings = results[1] as Map<String, dynamic>?;
      if (_settings != null) {
        _extractFormValues(_settings!);
      }
      _isLoading = false;
    });
  }

  Future<void> _openWebAdmin() async {
    final uri = Uri.parse('https://elattar.site/admin');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  // Pick image from Gallery or Camera and convert to Base64 Data URL
  Future<String?> _pickImageAsBase64(ImageSource source) async {
    try {
      final XFile? file = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 82,
      );
      if (file == null) return null;

      final Uint8List bytes = await file.readAsBytes();
      final String base64String = base64Encode(bytes);
      return 'data:image/jpeg;base64,$base64String';
    } catch (e) {
      debugPrint('Error picking image: $e');
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('تعذر اختيار الصورة: $e')));
      }
      return null;
    }
  }

  // Quick slot change handler
  Future<void> _handleSlotDurationSelect(int minutes) async {
    setState(() => _slotDuration = minutes);

    if (_settings != null) {
      final bSettings = Map<String, dynamic>.from(
        _settings?['bookingSettings'] ?? {},
      );
      bSettings['slotDurationMinutes'] = minutes;
      _settings?['bookingSettings'] = bSettings;
    }

    final success = await SupabaseService.updateSlotDuration(minutes);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success
                ? 'تم تغيير مدة الموعد إلى ($minutes دقيقة) وتحديث الموقع فوراً! ⏱️'
                : 'حدث خطأ أثناء حفظ مدة الموعد',
          ),
          backgroundColor: success ? Color(0xFF059669) : Colors.red,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  // Save working hours
  Future<void> _saveWorkingHours() async {
    final success = await SupabaseService.updateClinicWorkingHours(
      hoursRegular: _regularHoursController.text.trim(),
      hoursFriday: _fridayHoursController.text.trim(),
      startTime: _startTimeRegular,
      endTime: _endTimeRegular,
      startTimeFriday: _startTimeFriday,
      endTimeFriday: _endTimeFriday,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success
                ? 'تم حفظ وتحديث مواعيد العمل بالموقع الإلكتروني بنجاح! 🕒'
                : 'تعذر حفظ مواعيد العمل',
          ),
          backgroundColor: success ? Color(0xFF059669) : Colors.red,
        ),
      );
    }
  }

  // Save advance booking rules
  Future<void> _saveBookingRules() async {
    final success = await SupabaseService.updateBookingRules(
      minAdvanceHours: _minAdvanceHours,
      maxAdvanceDays: _maxAdvanceDays,
      allowedDays: _allowedDays,
      enableFutureBooking: _enableFutureBooking,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success
                ? 'تم حفظ إعدادات وقواعد الحجز بالموقع بنجاح! 📅'
                : 'تعذر حفظ إعدادات الحجز',
          ),
          backgroundColor: success ? Color(0xFF059669) : Colors.red,
        ),
      );
    }
  }

  // Helper widget to render review image
  Widget _buildReviewImage(
    String? imageUrl, {
    double width = 54,
    double height = 54,
    double radius = 10,
  }) {
    if (imageUrl == null || imageUrl.trim().isEmpty) {
      return Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.royal.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(radius),
        ),
        child: Icon(Icons.rate_review, color: AppColors.royal, size: 24),
      );
    }

    final trimmed = imageUrl.trim();

    // 1. Base64 Data URL
    if (trimmed.startsWith('data:image')) {
      try {
        final commaIdx = trimmed.indexOf(',');
        if (commaIdx != -1) {
          final rawBase64 = trimmed.substring(commaIdx + 1);
          final bytes = base64Decode(rawBase64);
          return ClipRRect(
            borderRadius: BorderRadius.circular(radius),
            child: Image.memory(
              bytes,
              width: width,
              height: height,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) =>
                  _buildFallbackThumbnail(width, height, radius),
            ),
          );
        }
      } catch (_) {}
    }

    // 2. Full HTTP/HTTPS or Relative URL
    String targetUrl = trimmed;
    if (trimmed.startsWith('/')) {
      targetUrl = 'https://elattar.site$trimmed';
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: Image.network(
        targetUrl,
        width: width,
        height: height,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) =>
            _buildFallbackThumbnail(width, height, radius),
        loadingBuilder: (context, child, progress) {
          if (progress == null) return child;
          return Container(
            width: width,
            height: height,
            color: Colors.grey.shade100,
            child: Center(
              child: SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.royal,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFallbackThumbnail(double width, double height, double radius) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.royal.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(radius),
      ),
      child: Icon(Icons.rate_review, color: AppColors.royal, size: 24),
    );
  }

  // Full-screen image preview dialog
  void _showImagePreviewDialog(SocialReview rev) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      rev.patientName ?? rev.title ?? 'تقييم المريض',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: context.ink,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              SizedBox(height: 10),
              Container(
                constraints: BoxConstraints(maxHeight: 380),
                child: _buildReviewImage(
                  rev.imageUrl,
                  width: double.infinity,
                  height: 350,
                  radius: 12,
                ),
              ),
              if (rev.caption != null && rev.caption!.isNotEmpty) ...[
                SizedBox(height: 12),
                Container(
                  padding: EdgeInsets.all(10),
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: context.canvas,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    rev.caption!,
                    style: TextStyle(fontSize: 12, color: context.ink),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // Dialog to Add a new Review
  void _showAddReviewDialog() {
    final titleController = TextEditingController();
    final nameController = TextEditingController();
    final captionController = TextEditingController();
    final imageController = TextEditingController();
    String platform = 'whatsapp';
    String? selectedBase64Image;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Text(
            'إضافة رأي أو تقييم جديد للموقع',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'اسم المريض أو المرافق:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 6),
                TextField(
                  controller: nameController,
                  decoration: InputDecoration(hintText: 'مثال: أ / أحمد محمود'),
                ),
                SizedBox(height: 10),
                Text(
                  'المنصة:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                DropdownButton<String>(
                  value: platform,
                  isExpanded: true,
                  items: [
                    DropdownMenuItem(
                      value: 'whatsapp',
                      child: Text('واتساب (WhatsApp)'),
                    ),
                    DropdownMenuItem(
                      value: 'facebook',
                      child: Text('فيسبوك (Facebook)'),
                    ),
                    DropdownMenuItem(
                      value: 'instagram',
                      child: Text('إنستغرام (Instagram)'),
                    ),
                    DropdownMenuItem(
                      value: 'google',
                      child: Text('خرائط Google'),
                    ),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => platform = val);
                  },
                ),
                SizedBox(height: 10),
                Text(
                  'عنوان أو وصف التقييم:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 6),
                TextField(
                  controller: titleController,
                  decoration: InputDecoration(
                    hintText: 'محادثة واتساب - شكر وتقدير',
                  ),
                ),
                SizedBox(height: 10),
                Text(
                  'مقتطف أو نص الرسالة:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 6),
                TextField(
                  controller: captionController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    hintText:
                        'الحمد لله الحالة استقرت تماماً بفضل الله والدكتور...',
                  ),
                ),
                SizedBox(height: 12),
                Text(
                  'صورة التقييم / المحادثة:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),

                if (selectedBase64Image != null ||
                    imageController.text.trim().isNotEmpty) ...[
                  Center(
                    child: Stack(
                      children: [
                        _buildReviewImage(
                          selectedBase64Image ?? imageController.text.trim(),
                          width: 140,
                          height: 140,
                          radius: 14,
                        ),
                        Positioned(
                          top: 4,
                          right: 4,
                          child: GestureDetector(
                            onTap: () {
                              setDialogState(() {
                                selectedBase64Image = null;
                                imageController.clear();
                              });
                            },
                            child: Container(
                              padding: EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.close,
                                color: context.panel,
                                size: 14,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 10),
                ],

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final b64 = await _pickImageAsBase64(
                            ImageSource.gallery,
                          );
                          if (b64 != null) {
                            setDialogState(() {
                              selectedBase64Image = b64;
                              imageController.clear();
                            });
                          }
                        },
                        icon: Icon(Icons.photo_library, size: 16),
                        label: Text('المعرض', style: TextStyle(fontSize: 11)),
                      ),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final b64 = await _pickImageAsBase64(
                            ImageSource.camera,
                          );
                          if (b64 != null) {
                            setDialogState(() {
                              selectedBase64Image = b64;
                              imageController.clear();
                            });
                          }
                        },
                        icon: Icon(Icons.camera_alt, size: 16),
                        label: Text('الكاميرا', style: TextStyle(fontSize: 11)),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 8),
                TextField(
                  controller: imageController,
                  onChanged: (val) {
                    if (val.isNotEmpty)
                      setDialogState(() => selectedBase64Image = null);
                  },
                  decoration: InputDecoration(
                    hintText: 'أو أدخل رابط صورة خارجي https://...',
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                  ),
                  style: TextStyle(fontSize: 11),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () async {
                final effectiveImageUrl =
                    selectedBase64Image ??
                    (imageController.text.trim().isEmpty
                        ? '/reviews/review-wa-1.svg'
                        : imageController.text.trim());

                final review = SocialReview(
                  id: 'rev-img-${DateTime.now().millisecondsSinceEpoch}',
                  imageUrl: effectiveImageUrl,
                  title: titleController.text.trim().isEmpty
                      ? null
                      : titleController.text.trim(),
                  patientName: nameController.text.trim().isEmpty
                      ? null
                      : nameController.text.trim(),
                  platform: platform,
                  caption: captionController.text.trim().isEmpty
                      ? null
                      : captionController.text.trim(),
                  date: 'حديثاً',
                );

                if (ctx.mounted) Navigator.pop(ctx);

                setState(() {
                  _reviews.insert(0, review);
                });

                await SupabaseService.addSocialReview(review);
                _loadData();
              },
              child: Text('إضافة للموقع'),
            ),
          ],
        ),
      ),
    );
  }

  // Dialog to Edit existing Review
  void _showEditReviewDialog(SocialReview rev) {
    final titleController = TextEditingController(text: rev.title ?? '');
    final nameController = TextEditingController(text: rev.patientName ?? '');
    final captionController = TextEditingController(text: rev.caption ?? '');
    final imageController = TextEditingController();
    String platform = rev.platform ?? 'whatsapp';
    if (!['whatsapp', 'facebook', 'instagram', 'google'].contains(platform)) {
      platform = 'whatsapp';
    }
    String? currentImage = rev.imageUrl;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Text(
            'تعديل رأي أو تقييم المريض',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'اسم المريض أو المرافق:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 6),
                TextField(
                  controller: nameController,
                  decoration: InputDecoration(hintText: 'اسم المريض'),
                ),
                SizedBox(height: 10),
                Text(
                  'المنصة:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                DropdownButton<String>(
                  value: platform,
                  isExpanded: true,
                  items: [
                    DropdownMenuItem(
                      value: 'whatsapp',
                      child: Text('واتساب (WhatsApp)'),
                    ),
                    DropdownMenuItem(
                      value: 'facebook',
                      child: Text('فيسبوك (Facebook)'),
                    ),
                    DropdownMenuItem(
                      value: 'instagram',
                      child: Text('إنستغرام (Instagram)'),
                    ),
                    DropdownMenuItem(
                      value: 'google',
                      child: Text('خرائط Google'),
                    ),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => platform = val);
                  },
                ),
                SizedBox(height: 10),
                Text(
                  'عنوان أو وصف التقييم:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 6),
                TextField(
                  controller: titleController,
                  decoration: InputDecoration(hintText: 'عنوان التقييم'),
                ),
                SizedBox(height: 10),
                Text(
                  'مقتطف أو نص الرسالة:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 6),
                TextField(
                  controller: captionController,
                  maxLines: 2,
                  decoration: InputDecoration(hintText: 'نص التقييم...'),
                ),
                SizedBox(height: 12),
                Text(
                  'صورة التقييم الحالية:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),

                if (currentImage != null && currentImage!.isNotEmpty) ...[
                  Center(
                    child: _buildReviewImage(
                      currentImage,
                      width: 130,
                      height: 130,
                      radius: 14,
                    ),
                  ),
                  SizedBox(height: 10),
                ],

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final b64 = await _pickImageAsBase64(
                            ImageSource.gallery,
                          );
                          if (b64 != null) {
                            setDialogState(() => currentImage = b64);
                          }
                        },
                        icon: Icon(Icons.photo_library, size: 16),
                        label: Text(
                          'تغيير من المعرض',
                          style: TextStyle(fontSize: 10),
                        ),
                      ),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final b64 = await _pickImageAsBase64(
                            ImageSource.camera,
                          );
                          if (b64 != null) {
                            setDialogState(() => currentImage = b64);
                          }
                        },
                        icon: Icon(Icons.camera_alt, size: 16),
                        label: Text(
                          'التقاط بالكاميرا',
                          style: TextStyle(fontSize: 10),
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 8),
                TextField(
                  controller: imageController,
                  onChanged: (val) {
                    if (val.trim().isNotEmpty) {
                      setDialogState(() => currentImage = val.trim());
                    }
                  },
                  decoration: InputDecoration(
                    hintText: 'أو أدخل رابط صورة جديد https://...',
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                  ),
                  style: TextStyle(fontSize: 11),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () async {
                final updated = rev.copyWith(
                  title: titleController.text.trim().isEmpty
                      ? null
                      : titleController.text.trim(),
                  patientName: nameController.text.trim().isEmpty
                      ? null
                      : nameController.text.trim(),
                  platform: platform,
                  caption: captionController.text.trim().isEmpty
                      ? null
                      : captionController.text.trim(),
                  imageUrl: currentImage ?? rev.imageUrl,
                );

                if (ctx.mounted) Navigator.pop(ctx);

                setState(() {
                  final idx = _reviews.indexWhere((r) => r.id == rev.id);
                  if (idx != -1) {
                    _reviews[idx] = updated;
                  }
                });

                await SupabaseService.updateSocialReview(updated);
                _loadData();
              },
              child: Text('حفظ التعديلات'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _reviews.isEmpty && _settings == null) {
      return Center(child: CircularProgressIndicator(color: AppColors.royal));
    }

    final dayLabels = [
      {'id': 'Saturday', 'label': 'السبت'},
      {'id': 'Sunday', 'label': 'الأحد'},
      {'id': 'Monday', 'label': 'الاثنين'},
      {'id': 'Tuesday', 'label': 'الثلاثاء'},
      {'id': 'Wednesday', 'label': 'الأربعاء'},
      {'id': 'Thursday', 'label': 'الخميس'},
      {'id': 'Friday', 'label': 'الجمعة'},
    ];

    return RefreshIndicator(
      onRefresh: () => _loadData(forceRefresh: true),
      color: AppColors.royal,
      child: SingleChildScrollView(
        physics: AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ================= CARD 1: SLOT DURATION INTERVAL SELECTOR =================
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.panel,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.purple.shade200, width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: Colors.purple.withValues(alpha: 0.05),
                    blurRadius: 12,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.purple.shade50,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              Icons.timer_outlined,
                              color: Colors.purple,
                              size: 20,
                            ),
                          ),
                          SizedBox(width: 8),
                          Text(
                            'الفاصل الزمني بين المواعيد',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: context.ink,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.purple.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.purple.shade200),
                        ),
                        child: Text(
                          _slotDuration == 15
                              ? 'كل ربع ساعة'
                              : _slotDuration == 30
                              ? 'كل نصف ساعة'
                              : _slotDuration == 45
                              ? 'ساعة إلا ربع'
                              : 'كل ساعة كاملة',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Colors.purple.shade800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 6),
                  Text(
                    'اختر مدة كل كشف لتقسيم ساعات العمل بالموقع الإلكتروني تلقائياً فورياً:',
                    style: TextStyle(fontSize: 11, color: context.secondaryInk),
                  ),
                  SizedBox(height: 12),

                  // 4 Dynamic Duration Cards
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 1.8,
                    children: [
                      _buildSlotOptionCard(
                        minutes: 15,
                        label: 'كل ربع ساعة',
                        sub: '4 مواعيد / ساعة',
                        badge: '15 دقيقة',
                      ),
                      _buildSlotOptionCard(
                        minutes: 30,
                        label: 'كل نصف ساعة',
                        sub: 'موعدان / ساعة',
                        badge: '30 دقيقة',
                      ),
                      _buildSlotOptionCard(
                        minutes: 45,
                        label: 'ساعة إلا ربع',
                        sub: 'فحص واستشارة',
                        badge: '45 دقيقة',
                      ),
                      _buildSlotOptionCard(
                        minutes: 60,
                        label: 'كل ساعة',
                        sub: 'موعد واحد / ساعة',
                        badge: '60 دقيقة',
                      ),
                    ],
                  ),
                ],
              ),
            ),
            SizedBox(height: 16),

            // ================= CARD 2: WORKING HOURS MANAGEMENT =================
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.panel,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.rule),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.royal.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.royal.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          Icons.access_time_filled,
                          color: AppColors.royal,
                          size: 20,
                        ),
                      ),
                      SizedBox(width: 8),
                      Text(
                        'مواعيد وساعات العمل بالعيادة',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: context.ink,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 6),
                  Text(
                    'تعديل نصوص وساعات العمل التي تظهر في ترويسة الموقع ونظام الحجز:',
                    style: TextStyle(fontSize: 11, color: context.secondaryInk),
                  ),
                  SizedBox(height: 14),

                  // Regular days (Saturday to Thursday)
                  Text(
                    'السبت إلى الخميس:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: context.ink,
                    ),
                  ),
                  SizedBox(height: 6),
                  TextField(
                    controller: _regularHoursController,
                    decoration: InputDecoration(
                      hintText:
                          'السبت إلى الخميس: من 1:00 ظهراً حتى 9:00 مساءً',
                      prefixIcon: Icon(Icons.calendar_month, size: 18),
                    ),
                  ),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _buildTimeDropdown(
                          label: 'ساعة البدء:',
                          value: _startTimeRegular,
                          onChanged: (val) =>
                              setState(() => _startTimeRegular = val!),
                        ),
                      ),
                      SizedBox(width: 10),
                      Expanded(
                        child: _buildTimeDropdown(
                          label: 'ساعة الانتهاء:',
                          value: _endTimeRegular,
                          onChanged: (val) =>
                              setState(() => _endTimeRegular = val!),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 16),

                  // Friday
                  Text(
                    'يوم الجمعة:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: context.ink,
                    ),
                  ),
                  SizedBox(height: 6),
                  TextField(
                    controller: _fridayHoursController,
                    decoration: InputDecoration(
                      hintText: 'يوم الجمعة: من 4:00 عصراً حتى 10:00 مساءً',
                      prefixIcon: Icon(Icons.wb_sunny_outlined, size: 18),
                    ),
                  ),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _buildTimeDropdown(
                          label: 'ساعة البدء (الجمعة):',
                          value: _startTimeFriday,
                          onChanged: (val) =>
                              setState(() => _startTimeFriday = val!),
                        ),
                      ),
                      SizedBox(width: 10),
                      Expanded(
                        child: _buildTimeDropdown(
                          label: 'ساعة الانتهاء (الجمعة):',
                          value: _endTimeFriday,
                          onChanged: (val) =>
                              setState(() => _endTimeFriday = val!),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 14),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _saveWorkingHours,
                      icon: Icon(Icons.save, size: 18),
                      label: Text('حفظ وتحديث مواعيد العمل بالموقع'),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 16),

            // ================= CARD 3: ADVANCE BOOKING RULES =================
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.panel,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.rule),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.royal.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          Icons.settings_suggest,
                          color: Color(0xFF047857),
                          size: 20,
                        ),
                      ),
                      SizedBox(width: 8),
                      Text(
                        'قواعد وشروط الحجز المسبق بالموقع',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: context.ink,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 6),
                  Text(
                    'التحكم في فترات الحجز المسبق وإتاحة أيام الأسبوع للزوار:',
                    style: TextStyle(fontSize: 11, color: context.secondaryInk),
                  ),
                  SizedBox(height: 14),

                  // Rule A: Minimum Advance Notice Hours
                  Text(
                    'شرط الحجز قبل الموعد بـ:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: context.ink,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'الحد الأدنى لمهلة الحجز قبل موعد الكشف:',
                    style: TextStyle(fontSize: 10, color: context.secondaryInk),
                  ),
                  SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [1, 2, 3, 4, 6].map((hours) {
                      final isSelected = _minAdvanceHours == hours;
                      return ChoiceChip(
                        label: Text(
                          hours == 1
                              ? 'ساعة واحدة'
                              : hours == 2
                              ? 'ساعتان'
                              : '$hours ساعات',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                        ),
                        selected: isSelected,
                        onSelected: (sel) {
                          if (sel) setState(() => _minAdvanceHours = hours);
                        },
                        selectedColor: AppColors.royal,
                        labelStyle: TextStyle(
                          color: isSelected ? context.panel : context.ink,
                        ),
                      );
                    }).toList(),
                  ),
                  SizedBox(height: 14),

                  // Rule B: Maximum Advance Days
                  Text(
                    'فترة فتح جدول المواعيد مقدماً:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: context.ink,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'أقصى مدة مستقبلية يسمح للمريض بالحجز خلالها:',
                    style: TextStyle(fontSize: 10, color: context.secondaryInk),
                  ),
                  SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [7, 14, 30, 60].map((days) {
                      final isSelected = _maxAdvanceDays == days;
                      return ChoiceChip(
                        label: Text(
                          '$days يوماً',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                        ),
                        selected: isSelected,
                        onSelected: (sel) {
                          if (sel) setState(() => _maxAdvanceDays = days);
                        },
                        selectedColor: AppColors.royal,
                        labelStyle: TextStyle(
                          color: isSelected ? context.panel : context.ink,
                        ),
                      );
                    }).toList(),
                  ),
                  SizedBox(height: 14),

                  // Rule C: Allowed Days
                  Text(
                    'أيام استقبال الحجوزات المتاحة بالأسبوع:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: context.ink,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'اضغط على أي يوم لتفعيله أو إيقافه من جدول الحجز:',
                    style: TextStyle(fontSize: 10, color: context.secondaryInk),
                  ),
                  SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: dayLabels.map((d) {
                      final id = d['id']!;
                      final isAllowed = _allowedDays.contains(id);
                      return FilterChip(
                        label: Text(
                          d['label']!,
                          style: TextStyle(fontSize: 11),
                        ),
                        selected: isAllowed,
                        onSelected: (selected) {
                          setState(() {
                            if (selected) {
                              if (!_allowedDays.contains(id))
                                _allowedDays.add(id);
                            } else {
                              _allowedDays.remove(id);
                            }
                          });
                        },
                        selectedColor: Color(0xFFDCFCE7),
                        checkmarkColor: Color(0xFF047857),
                        labelStyle: TextStyle(
                          color: isAllowed
                              ? Color(0xFF047857)
                              : context.secondaryInk,
                          fontWeight: isAllowed
                              ? FontWeight.bold
                              : FontWeight.normal,
                        ),
                      );
                    }).toList(),
                  ),
                  SizedBox(height: 14),

                  // Rule D: Enable / Disable Booking System
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      'تفعيل نظام الحجز الإلكتروني بالموقع',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    subtitle: Text(
                      'عند الإيقاف، يتم إخفاء مواعيد الحجز من الموقع مؤقتاً',
                      style: TextStyle(
                        fontSize: 10,
                        color: context.secondaryInk,
                      ),
                    ),
                    value: _enableFutureBooking,
                    activeThumbColor: AppColors.royal,
                    activeTrackColor: AppColors.royal.withValues(alpha: 0.3),
                    onChanged: (val) =>
                        setState(() => _enableFutureBooking = val),
                  ),
                  SizedBox(height: 10),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _saveBookingRules,
                      icon: Icon(Icons.check_circle_outline, size: 18),
                      label: Text('حفظ وتطبيق قواعد الحجز بالموقع'),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 16),

            // ================= CARD 4: WEB ADMIN CMS SHORTCUT =================
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.panel,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.rule),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.royal.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'لوحة تحكم الموقع الكاملة (CMS)',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: context.ink,
                        ),
                      ),
                      Container(
                        padding: EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.royal.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          Icons.language,
                          size: 18,
                          color: AppColors.royal,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 6),
                  Text(
                    'يمكنك فتح لوحة تحكم الموقع بجميع التبويبات المتقدمة لتعديل صور العيادة والأجهزة والخدمات الـ 13 بدقة.',
                    style: TextStyle(fontSize: 11, color: context.secondaryInk),
                  ),
                  SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _openWebAdmin,
                      icon: Icon(Icons.open_in_browser, size: 18),
                      label: Text('فتح لوحة الموقع elattar.site/admin'),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 16),

            // ================= CARD 5: SOCIAL REVIEWS MANAGER =================
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.panel,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.rule),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'آراء وتقييمات المرضى (${_reviews.length})',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: context.ink,
                        ),
                      ),
                      ElevatedButton.icon(
                        onPressed: _showAddReviewDialog,
                        icon: Icon(Icons.add, size: 16),
                        label: Text(
                          'إضافة رأي',
                          style: TextStyle(fontSize: 11),
                        ),
                        style: ElevatedButton.styleFrom(
                          padding: EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Text(
                    'الصور تظهر في شريط آراء المرضى بالموقع. يمكنك تعديل أي رأي أو رفع صورة من الهاتف مباشرة:',
                    style: TextStyle(fontSize: 11, color: context.secondaryInk),
                  ),
                  SizedBox(height: 12),

                  if (_reviews.isEmpty)
                    Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Center(
                        child: Text(
                          'لا توجد تقييمات مضافة حالياً',
                          style: TextStyle(
                            fontSize: 12,
                            color: context.secondaryInk,
                          ),
                        ),
                      ),
                    )
                  else
                    ..._reviews.map(
                      (rev) => Container(
                        margin: EdgeInsets.only(bottom: 10),
                        padding: EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: context.canvas,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: context.rule),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            GestureDetector(
                              onTap: () => _showImagePreviewDialog(rev),
                              child: Stack(
                                children: [
                                  _buildReviewImage(
                                    rev.imageUrl,
                                    width: 56,
                                    height: 56,
                                    radius: 10,
                                  ),
                                  Positioned(
                                    bottom: 2,
                                    left: 2,
                                    child: Container(
                                      padding: EdgeInsets.all(2),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withValues(
                                          alpha: 0.6,
                                        ),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Icon(
                                        Icons.zoom_in,
                                        color: context.panel,
                                        size: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    rev.patientName ??
                                        rev.title ??
                                        'رأي مريض موثق',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: context.ink,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  if (rev.caption != null &&
                                      rev.caption!.isNotEmpty) ...[
                                    SizedBox(height: 2),
                                    Text(
                                      rev.caption!,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: context.secondaryInk,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                  SizedBox(height: 4),
                                  Container(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.royal.withValues(
                                        alpha: 0.08,
                                      ),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      'المنصة: ${rev.platform ?? 'واتساب'}',
                                      style: TextStyle(
                                        fontSize: 9,
                                        color: AppColors.royal,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: Icon(
                                    Icons.edit_outlined,
                                    size: 20,
                                    color: AppColors.royal,
                                  ),
                                  tooltip: 'تعديل التقييم والصورة',
                                  onPressed: () => _showEditReviewDialog(rev),
                                ),
                                IconButton(
                                  icon: Icon(
                                    Icons.delete_outline,
                                    size: 20,
                                    color: Colors.red,
                                  ),
                                  tooltip: 'حذف التقييم',
                                  onPressed: () async {
                                    final confirm = await showDialog<bool>(
                                      context: context,
                                      builder: (ctx) => AlertDialog(
                                        title: Text('تأكيد الحذف'),
                                        content: Text(
                                          'هل أنت متأكد من حذف هذا التقييم نهائياً من الموقع؟',
                                        ),
                                        actions: [
                                          TextButton(
                                            onPressed: () =>
                                                Navigator.pop(ctx, false),
                                            child: Text('إلغاء'),
                                          ),
                                          ElevatedButton(
                                            onPressed: () =>
                                                Navigator.pop(ctx, true),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Colors.red,
                                            ),
                                            child: Text('حذف'),
                                          ),
                                        ],
                                      ),
                                    );

                                    if (confirm == true) {
                                      setState(() {
                                        _reviews.removeWhere(
                                          (r) => r.id == rev.id,
                                        );
                                      });
                                      await SupabaseService.deleteSocialReview(
                                        rev.id,
                                      );
                                      _loadData();
                                    }
                                  },
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSlotOptionCard({
    required int minutes,
    required String label,
    required String sub,
    required String badge,
  }) {
    final isSelected = _slotDuration == minutes;
    return GestureDetector(
      onTap: () => _handleSlotDurationSelect(minutes),
      child: AnimatedContainer(
        duration: Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.purple.shade50 : context.canvas,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? Colors.purple : context.rule,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.purple.withValues(alpha: 0.15),
                    blurRadius: 8,
                    offset: Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isSelected ? Colors.purple.shade900 : context.ink,
                  ),
                ),
                if (isSelected)
                  Icon(Icons.check_circle, size: 16, color: Colors.purple),
              ],
            ),
            SizedBox(height: 2),
            Text(
              sub,
              style: TextStyle(
                fontSize: 10,
                color: isSelected
                    ? Colors.purple.shade700
                    : context.secondaryInk,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeDropdown({
    required String label,
    required String value,
    required ValueChanged<String?> onChanged,
  }) {
    final times = [
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
      '20:00',
      '21:00',
      '22:00',
      '23:00',
    ];
    if (!times.contains(value)) times.add(value);
    times.sort();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 11, color: context.secondaryInk),
        ),
        SizedBox(height: 4),
        DropdownButtonFormField<String>(
          initialValue: value,
          isDense: true,
          decoration: InputDecoration(
            contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          ),
          items: times.map((t) {
            final hour = int.parse(t.split(':')[0]);
            final display = hour > 12
                ? '${hour - 12}:00 م'
                : hour == 12
                ? '12:00 م'
                : '$hour:00 ص';
            return DropdownMenuItem(
              value: t,
              child: Text('$t ($display)', style: TextStyle(fontSize: 11)),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }
}
