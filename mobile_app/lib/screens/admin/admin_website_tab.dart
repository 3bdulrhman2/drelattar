import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/social_review.dart';
import '../../services/supabase_service.dart';
import '../../theme/app_theme.dart';

class AdminWebsiteTab extends StatefulWidget {
  const AdminWebsiteTab({super.key});

  @override
  State<AdminWebsiteTab> createState() => _AdminWebsiteTabState();
}

class _AdminWebsiteTabState extends State<AdminWebsiteTab> {
  List<SocialReview> _reviews = [];
  Map<String, dynamic>? _settings;
  bool _isLoading = true;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _reviews = SupabaseService.cachedReviews;
    _settings = SupabaseService.cachedSettings;
    _isLoading = _reviews.isEmpty && _settings == null;
    _loadData();
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('تعذر اختيار الصورة: $e')),
        );
      }
      return null;
    }
  }

  // Helper widget to render review image regardless of format (base64, relative URL, full URL)
  Widget _buildReviewImage(String? imageUrl, {double width = 54, double height = 54, double radius = 10}) {
    if (imageUrl == null || imageUrl.trim().isEmpty) {
      return Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.royal.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(radius),
        ),
        child: const Icon(Icons.rate_review, color: AppColors.royal, size: 24),
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
              errorBuilder: (context, error, stackTrace) => _buildFallbackThumbnail(width, height, radius),
            ),
          );
        }
      } catch (_) {}
    }

    // 2. Full HTTP/HTTPS URL
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
        errorBuilder: (context, error, stackTrace) => _buildFallbackThumbnail(width, height, radius),
        loadingBuilder: (_, child, progress) {
          if (progress == null) return child;
          return Container(
            width: width,
            height: height,
            color: Colors.grey.shade100,
            child: const Center(
              child: SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.royal),
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
      child: const Icon(Icons.rate_review, color: AppColors.royal, size: 24),
    );
  }

  // Full-screen image preview dialog
  void _showImagePreviewDialog(SocialReview rev) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      rev.patientName ?? rev.title ?? 'تقييم المريض',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.dark),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Container(
                constraints: const BoxConstraints(maxHeight: 380),
                child: _buildReviewImage(rev.imageUrl, width: double.infinity, height: 350, radius: 12),
              ),
              if (rev.caption != null && rev.caption!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(10),
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    rev.caption!,
                    style: const TextStyle(fontSize: 12, color: AppColors.dark),
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

  // Dialog to Add a new Review (with mobile gallery/camera picker)
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
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('إضافة رأي أو تقييم جديد للموقع', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('اسم المريض أو المرافق:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(hintText: 'مثال: أ / أحمد محمود'),
                ),
                const SizedBox(height: 10),
                const Text('المنصة:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                DropdownButton<String>(
                  value: platform,
                  isExpanded: true,
                  items: const [
                    DropdownMenuItem(value: 'whatsapp', child: Text('واتساب (WhatsApp)')),
                    DropdownMenuItem(value: 'facebook', child: Text('فيسبوك (Facebook)')),
                    DropdownMenuItem(value: 'instagram', child: Text('إنستغرام (Instagram)')),
                    DropdownMenuItem(value: 'google', child: Text('خرائط Google')),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => platform = val);
                  },
                ),
                const SizedBox(height: 10),
                const Text('عنوان أو وصف التقييم:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(hintText: 'محادثة واتساب - شكر وتقدير'),
                ),
                const SizedBox(height: 10),
                const Text('مقتطف أو نص الرسالة:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: captionController,
                  maxLines: 2,
                  decoration: const InputDecoration(hintText: 'الحمد لله الحالة استقرت تماماً بفضل الله والدكتور...'),
                ),
                const SizedBox(height: 12),

                // Image Selection Section
                const Text('صورة التقييم / المحادثة:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),

                // Instant preview of chosen image
                if (selectedBase64Image != null || imageController.text.trim().isNotEmpty) ...[
                  Center(
                    child: Stack(
                      children: [
                        _buildReviewImage(selectedBase64Image ?? imageController.text.trim(), width: 140, height: 140, radius: 14),
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
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                              child: const Icon(Icons.close, color: Colors.white, size: 14),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                ],

                // Mobile Picker Buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final b64 = await _pickImageAsBase64(ImageSource.gallery);
                          if (b64 != null) {
                            setDialogState(() {
                              selectedBase64Image = b64;
                              imageController.clear();
                            });
                          }
                        },
                        icon: const Icon(Icons.photo_library, size: 16),
                        label: const Text('المعرض', style: TextStyle(fontSize: 11)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final b64 = await _pickImageAsBase64(ImageSource.camera);
                          if (b64 != null) {
                            setDialogState(() {
                              selectedBase64Image = b64;
                              imageController.clear();
                            });
                          }
                        },
                        icon: const Icon(Icons.camera_alt, size: 16),
                        label: const Text('الكاميرا', style: TextStyle(fontSize: 11)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: imageController,
                  onChanged: (val) {
                    if (val.isNotEmpty) setDialogState(() => selectedBase64Image = null);
                  },
                  decoration: const InputDecoration(
                    hintText: 'أو الصق رابط صورة خارجي https://...',
                    contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  ),
                  style: const TextStyle(fontSize: 11),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () async {
                final effectiveImageUrl = selectedBase64Image ??
                    (imageController.text.trim().isEmpty
                        ? '/reviews/review-wa-1.svg'
                        : imageController.text.trim());

                final review = SocialReview(
                  id: 'rev-img-${DateTime.now().millisecondsSinceEpoch}',
                  imageUrl: effectiveImageUrl,
                  title: titleController.text.trim().isEmpty ? null : titleController.text.trim(),
                  patientName: nameController.text.trim().isEmpty ? null : nameController.text.trim(),
                  platform: platform,
                  caption: captionController.text.trim().isEmpty ? null : captionController.text.trim(),
                  date: 'حديثاً',
                );

                if (ctx.mounted) Navigator.pop(ctx);

                // Optimistic UI update
                setState(() {
                  _reviews.insert(0, review);
                });

                await SupabaseService.addSocialReview(review);
                _loadData();
              },
              child: const Text('إضافة للموقع'),
            ),
          ],
        ),
      ),
    );
  }

  // Dialog to Edit existing Review (with mobile gallery/camera picker & pencil trigger)
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
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('تعديل رأي أو تقييم المريض', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('اسم المريض أو المرافق:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(hintText: 'اسم المريض'),
                ),
                const SizedBox(height: 10),
                const Text('المنصة:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                DropdownButton<String>(
                  value: platform,
                  isExpanded: true,
                  items: const [
                    DropdownMenuItem(value: 'whatsapp', child: Text('واتساب (WhatsApp)')),
                    DropdownMenuItem(value: 'facebook', child: Text('فيسبوك (Facebook)')),
                    DropdownMenuItem(value: 'instagram', child: Text('إنستغرام (Instagram)')),
                    DropdownMenuItem(value: 'google', child: Text('خرائط Google')),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => platform = val);
                  },
                ),
                const SizedBox(height: 10),
                const Text('عنوان أو وصف التقييم:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(hintText: 'عنوان التقييم'),
                ),
                const SizedBox(height: 10),
                const Text('مقتطف أو نص الرسالة:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: captionController,
                  maxLines: 2,
                  decoration: const InputDecoration(hintText: 'نص التقييم...'),
                ),
                const SizedBox(height: 12),

                // Image Section
                const Text('صورة التقييم الحالية:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),

                if (currentImage != null && currentImage!.isNotEmpty) ...[
                  Center(
                    child: _buildReviewImage(currentImage, width: 130, height: 130, radius: 14),
                  ),
                  const SizedBox(height: 10),
                ],

                // Pick from phone
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final b64 = await _pickImageAsBase64(ImageSource.gallery);
                          if (b64 != null) {
                            setDialogState(() => currentImage = b64);
                          }
                        },
                        icon: const Icon(Icons.photo_library, size: 16),
                        label: const Text('تغيير من المعرض', style: TextStyle(fontSize: 10)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final b64 = await _pickImageAsBase64(ImageSource.camera);
                          if (b64 != null) {
                            setDialogState(() => currentImage = b64);
                          }
                        },
                        icon: const Icon(Icons.camera_alt, size: 16),
                        label: const Text('التقاط بالكاميرا', style: TextStyle(fontSize: 10)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: imageController,
                  onChanged: (val) {
                    if (val.trim().isNotEmpty) {
                      setDialogState(() => currentImage = val.trim());
                    }
                  },
                  decoration: const InputDecoration(
                    hintText: 'أو أدخل رابط صورة جديد https://...',
                    contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  ),
                  style: const TextStyle(fontSize: 11),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () async {
                final updated = rev.copyWith(
                  title: titleController.text.trim().isEmpty ? null : titleController.text.trim(),
                  patientName: nameController.text.trim().isEmpty ? null : nameController.text.trim(),
                  platform: platform,
                  caption: captionController.text.trim().isEmpty ? null : captionController.text.trim(),
                  imageUrl: currentImage ?? rev.imageUrl,
                );

                if (ctx.mounted) Navigator.pop(ctx);

                // Optimistic UI update
                setState(() {
                  final idx = _reviews.indexWhere((r) => r.id == rev.id);
                  if (idx != -1) {
                    _reviews[idx] = updated;
                  }
                });

                await SupabaseService.updateSocialReview(updated);
                _loadData();
              },
              child: const Text('حفظ التعديلات'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _reviews.isEmpty && _settings == null) {
      return const Center(child: CircularProgressIndicator(color: AppColors.royal));
    }

    final clinic = Map<String, dynamic>.from(_settings?['clinic'] ?? {});

    return RefreshIndicator(
      onRefresh: () => _loadData(forceRefresh: true),
      color: AppColors.royal,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Web Admin Banner Shortcut
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.royal.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('لوحة تحكم الموقع الكاملة (CMS)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.dark)),
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.royal.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.language, size: 18, color: AppColors.royal),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'يمكنك فتح لوحة تحكم الموقع بجميع التبويبات المتقدمة لتعديل صور العيادة والأجهزة والخدمات الـ 13 بدقة.',
                    style: TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _openWebAdmin,
                      icon: const Icon(Icons.open_in_browser, size: 18),
                      label: const Text('فتح لوحة الموقع elattar.site/admin'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Clinic Working Hours Summary
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('مواعيد العمل الحالية بالعيادة', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.dark)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 16, color: AppColors.medical),
                      const SizedBox(width: 8),
                      Text(
                        'السبت إلى الخميس: ${clinic['hoursRegular'] ?? 'من 1:00 ظهراً حتى 9:00 مساءً'}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.dark),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.access_time_filled, size: 16, color: Colors.purple),
                      const SizedBox(width: 8),
                      Text(
                        'يوم الجمعة: ${clinic['hoursFriday'] ?? 'من 4:00 عصراً حتى 10:00 مساءً'}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.dark),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Social Reviews Manager Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('آراء وتقييمات المرضى (${_reviews.length})', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.dark)),
                      ElevatedButton.icon(
                        onPressed: _showAddReviewDialog,
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text('إضافة رأي', style: TextStyle(fontSize: 11)),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text('الصور تظهر في شريط آراء المرضى بالموقع. يمكنك تعديل أي رأي أو رفع صورة من الهاتف مباشرة:', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                  const SizedBox(height: 12),

                  if (_reviews.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Center(
                        child: Text('لا توجد تقييمات مضافة حالياً', style: TextStyle(fontSize: 12, color: AppColors.muted)),
                      ),
                    )
                  else
                    ..._reviews.map((rev) => Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              // Clickable thumbnail with preview modal
                              GestureDetector(
                                onTap: () => _showImagePreviewDialog(rev),
                                child: Stack(
                                  children: [
                                    _buildReviewImage(rev.imageUrl, width: 56, height: 56, radius: 10),
                                    Positioned(
                                      bottom: 2,
                                      left: 2,
                                      child: Container(
                                        padding: const EdgeInsets.all(2),
                                        decoration: BoxDecoration(
                                          color: Colors.black.withValues(alpha: 0.6),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Icon(Icons.zoom_in, color: Colors.white, size: 12),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),

                              // Review Details
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      rev.patientName ?? rev.title ?? 'رأي مريض موثق',
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.dark),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    if (rev.caption != null && rev.caption!.isNotEmpty) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        rev.caption!,
                                        style: const TextStyle(fontSize: 11, color: AppColors.muted),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppColors.royal.withValues(alpha: 0.08),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        'المنصة: ${rev.platform ?? 'واتساب'}',
                                        style: const TextStyle(fontSize: 9, color: AppColors.royal, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // Action Buttons: Edit Pencil & Delete Trash
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  // Edit Pencil Icon
                                  IconButton(
                                    icon: const Icon(Icons.edit_outlined, size: 20, color: AppColors.royal),
                                    tooltip: 'تعديل التقييم والصورة',
                                    onPressed: () => _showEditReviewDialog(rev),
                                  ),

                                  // Delete Icon
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red),
                                    tooltip: 'حذف التقييم',
                                    onPressed: () async {
                                      final confirm = await showDialog<bool>(
                                        context: context,
                                        builder: (ctx) => AlertDialog(
                                          title: const Text('تأكيد الحذف'),
                                          content: const Text('هل أنت متأكد من حذف هذا التقييم نهائياً من الموقع؟'),
                                          actions: [
                                            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
                                            ElevatedButton(
                                              onPressed: () => Navigator.pop(ctx, true),
                                              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                                              child: const Text('حذف'),
                                            ),
                                          ],
                                        ),
                                      );

                                      if (confirm == true) {
                                        setState(() {
                                          _reviews.removeWhere((r) => r.id == rev.id);
                                        });
                                        await SupabaseService.deleteSocialReview(rev.id);
                                        _loadData();
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                        )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
