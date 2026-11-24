import 'package:flutter/material.dart';
import '../../models/appointment.dart';
import '../../services/supabase_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/booking_card.dart';

class AdminBookingsTab extends StatefulWidget {
  const AdminBookingsTab({super.key});

  @override
  State<AdminBookingsTab> createState() => _AdminBookingsTabState();
}

class _AdminBookingsTabState extends State<AdminBookingsTab> {
  List<Appointment> _allBookings = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _selectedDateFilter = 'all'; // 'all', 'today', 'tomorrow', 'upcoming', 'past'
  String _selectedStatusFilter = 'all'; // 'all', 'pending', 'confirmed', 'completed', 'cancelled'

  @override
  void initState() {
    super.initState();
    _allBookings = SupabaseService.cachedAppointments;
    _isLoading = _allBookings.isEmpty;
    _loadBookings();
  }

  Future<void> _loadBookings({bool forceRefresh = false}) async {
    if (_allBookings.isEmpty) {
      setState(() => _isLoading = true);
    }
    final bookings = await SupabaseService.getAppointments(forceRefresh: forceRefresh);
    if (!mounted) return;
    setState(() {
      _allBookings = bookings;
      _isLoading = false;
    });
  }

  String _getTodayString() {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  String _getTomorrowString() {
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    return '${tomorrow.year}-${tomorrow.month.toString().padLeft(2, '0')}-${tomorrow.day.toString().padLeft(2, '0')}';
  }

  List<Appointment> get _filteredBookings {
    final todayStr = _getTodayString();
    final tomorrowStr = _getTomorrowString();

    return _allBookings.where((b) {
      // Search filter
      final query = _searchQuery.toLowerCase();
      final matchSearch = _searchQuery.isEmpty ||
          b.patientName.toLowerCase().contains(query) ||
          b.patientPhone.contains(query) ||
          b.id.toLowerCase().contains(query);

      // Status filter
      final matchStatus = _selectedStatusFilter == 'all' || b.status == _selectedStatusFilter;

      // Date filter
      bool matchDate = true;
      if (_selectedDateFilter == 'today') {
        matchDate = b.appointmentDate == todayStr;
      } else if (_selectedDateFilter == 'tomorrow') {
        matchDate = b.appointmentDate == tomorrowStr;
      } else if (_selectedDateFilter == 'upcoming') {
        matchDate = b.appointmentDate.compareTo(todayStr) >= 0;
      } else if (_selectedDateFilter == 'past') {
        matchDate = b.appointmentDate.compareTo(todayStr) < 0;
      }

      return matchSearch && matchStatus && matchDate;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // Filter & Search Header Card
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: AppColors.border)),
            ),
            child: Column(
              children: [
                // Search Bar
                TextField(
                  onChanged: (val) => setState(() => _searchQuery = val),
                  decoration: InputDecoration(
                    hintText: 'ابحث بالاسم، الهاتف، أو رقم الحجز...',
                    prefixIcon: const Icon(Icons.search, size: 20, color: AppColors.muted),
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () => setState(() => _searchQuery = ''),
                          )
                        : null,
                  ),
                ),
                const SizedBox(height: 10),

                // Date Filters
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildDateFilterChip('جميع التواريخ', 'all'),
                      _buildDateFilterChip('اليوم', 'today'),
                      _buildDateFilterChip('غداً', 'tomorrow'),
                      _buildDateFilterChip('القادمة', 'upcoming'),
                      _buildDateFilterChip('السابقة', 'past'),
                    ],
                  ),
                ),
                const SizedBox(height: 6),

                // Status Filters
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildStatusFilterChip('الكل (${_allBookings.length})', 'all'),
                      _buildStatusFilterChip(
                        'انتظار (${_allBookings.where((b) => b.status == 'pending').length})',
                        'pending',
                      ),
                      _buildStatusFilterChip(
                        'مؤكد (${_allBookings.where((b) => b.status == 'confirmed').length})',
                        'confirmed',
                      ),
                      _buildStatusFilterChip(
                        'تم الكشف (${_allBookings.where((b) => b.status == 'completed').length})',
                        'completed',
                      ),
                      _buildStatusFilterChip(
                        'ملغي (${_allBookings.where((b) => b.status == 'cancelled').length})',
                        'cancelled',
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Bookings List View
          Expanded(
            child: _isLoading && _allBookings.isEmpty
                ? const Center(child: CircularProgressIndicator(color: AppColors.royal))
                : _filteredBookings.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.calendar_today_outlined, size: 48, color: AppColors.muted),
                            SizedBox(height: 12),
                            Text(
                              'لا توجد حجوزات مطابقة لمعايير البحث',
                              style: TextStyle(fontSize: 13, color: AppColors.muted, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () => _loadBookings(forceRefresh: true),
                        color: AppColors.royal,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredBookings.length,
                          itemBuilder: (context, index) {
                            final appt = _filteredBookings[index];
                            return BookingCard(
                              appointment: appt,
                              onStatusChange: (newStatus) async {
                                // Optimistic instant status change
                                setState(() {
                                  final idx = _allBookings.indexWhere((a) => a.id == appt.id);
                                  if (idx != -1) {
                                    _allBookings[idx] = _allBookings[idx].copyWith(status: newStatus);
                                  }
                                });
                                await SupabaseService.updateAppointmentStatus(appt.id, newStatus);
                                _loadBookings();
                              },
                              onDelete: () async {
                                final confirmed = await showDialog<bool>(
                                  context: context,
                                  builder: (ctx) => AlertDialog(
                                    title: const Text('حذف الحجز', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                                    content: Text('هل أنت متأكد من حذف حجز ${appt.patientName}؟ لا يمكن التراجع.', style: const TextStyle(fontSize: 13)),
                                    actions: [
                                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('تراجع')),
                                      TextButton(
                                        onPressed: () => Navigator.pop(ctx, true),
                                        child: Text('حذف', style: TextStyle(color: Colors.red.shade600, fontWeight: FontWeight.bold)),
                                      ),
                                    ],
                                  ),
                                );
                                if (confirmed == true) {
                                  setState(() => _allBookings.removeWhere((x) => x.id == appt.id));
                                  await SupabaseService.deleteAppointment(appt.id);
                                  _loadBookings();
                                }
                              },
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateFilterChip(String label, String value) {
    final isSelected = _selectedDateFilter == value;
    return Padding(
      padding: const EdgeInsets.only(left: 6),
      child: ChoiceChip(
        label: Text(label, style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
        selected: isSelected,
        onSelected: (selected) {
          if (selected) setState(() => _selectedDateFilter = value);
        },
        selectedColor: AppColors.royal,
        labelStyle: TextStyle(color: isSelected ? Colors.white : AppColors.dark),
        backgroundColor: AppColors.background,
        side: BorderSide(color: isSelected ? AppColors.royal : AppColors.border),
      ),
    );
  }

  Widget _buildStatusFilterChip(String label, String value) {
    final isSelected = _selectedStatusFilter == value;
    return Padding(
      padding: const EdgeInsets.only(left: 6),
      child: ChoiceChip(
        label: Text(label, style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
        selected: isSelected,
        onSelected: (selected) {
          if (selected) setState(() => _selectedStatusFilter = value);
        },
        selectedColor: AppColors.cyan,
        labelStyle: TextStyle(color: isSelected ? Colors.white : AppColors.dark),
        backgroundColor: AppColors.background,
        side: BorderSide(color: isSelected ? AppColors.cyan : AppColors.border),
      ),
    );
  }
}
