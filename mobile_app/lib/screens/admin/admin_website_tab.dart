import 'package:flutter/material.dart';
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

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final results = await Future.wait([
      SupabaseService.getSocialReviews(),
      SupabaseService.getClinicSettings(),
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

  void _showAddReviewDialog() {
    final titleController = TextEditingController();
    final nameController = TextEditingController();
    final captionController = TextEditingController();
    final imageController = TextEditingController();
    String platform = 'whatsapp';

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
                  decoration: const InputDecoration(hintText: 'الحمد لله الحالة استقرت تماماً...'),
                ),
                const SizedBox(height: 10),
                const Text('رابط الصورة (اختياري):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: imageController,
                  decoration: const InputDecoration(hintText: 'https://... أو يمكنك رفعها من المتصفح'),
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
                final review = SocialReview(
                  id: 'rev-img-${DateTime.now().millisecondsSinceEpoch}',
                  imageUrl: imageController.text.trim().isEmpty
                      ? '/reviews/review-wa-1.svg'
                      : imageController.text.trim(),
                  title: titleController.text.trim().isEmpty ? null : titleController.text.trim(),
                  patientName: nameController.text.trim().isEmpty ? null : nameController.text.trim(),
                  platform: platform,
                  caption: captionController.text.trim().isEmpty ? null : captionController.text.trim(),
                  date: 'حديثاً',
                );
                await SupabaseService.addSocialReview(review);
                if (ctx.mounted) Navigator.pop(ctx);
                _loadData();
              },
              child: const Text('إضافة للموقع'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.royal));
    }

    final clinic = Map<String, dynamic>.from(_settings?['clinic'] ?? {});

    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppColors.royal,
      child: SingleChildScrollView(
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

            // Social Reviews Manager
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
                      IconButton(
                        onPressed: _showAddReviewDialog,
                        icon: const Icon(Icons.add_circle, color: AppColors.royal),
                        tooltip: 'إضافة رأي جديد',
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text('تظهر هذه الآراء للزوار في شريط التقييمات بالموقع الرئيسي.', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                  const SizedBox(height: 10),

                  if (_reviews.isEmpty)
                    const Text('لا توجد تقييمات مضافة حالياً', style: TextStyle(fontSize: 11, color: AppColors.muted))
                  else
                    ..._reviews.map((rev) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: AppColors.royal.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.rate_review, color: AppColors.royal, size: 22),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      rev.patientName ?? rev.title ?? 'رأي مريض موثق',
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.dark),
                                    ),
                                    if (rev.caption != null)
                                      Text(
                                        rev.caption!,
                                        style: const TextStyle(fontSize: 10, color: AppColors.muted),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    Text(
                                      'المنصة: ${rev.platform ?? 'واتساب'}',
                                      style: const TextStyle(fontSize: 9, color: AppColors.cyan, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                                onPressed: () async {
                                  await SupabaseService.deleteSocialReview(rev.id);
                                  _loadData();
                                },
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
