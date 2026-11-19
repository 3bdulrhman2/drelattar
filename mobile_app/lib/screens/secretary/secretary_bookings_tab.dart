import 'package:flutter/material.dart';
import '../../models/appointment.dart';
import '../../services/supabase_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/booking_card.dart';

class SecretaryBookingsTab extends StatefulWidget {
  const SecretaryBookingsTab({super.key});

  @override
  State<SecretaryBookingsTab> createState() => _SecretaryBookingsTabState();
}

class _SecretaryBookingsTabState extends State<SecretaryBookingsTab> {
  List<Appointment> _allBookings = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _selectedDateFilter = 'today'; // Defaults to 'today' for secretary ease of use
  String _selectedStatusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() => _isLoading = true);
    final bookings = await SupabaseService.getAppointments();
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
      final query = _searchQuery.toLowerCase();
      final matchSearch = _searchQuery.isEmpty ||
          b.patientName.toLowerCase().contains(query) ||
          b.patientPhone.contains(query) ||
          b.id.toLowerCase().contains(query);

      final matchStatus = _selectedStatusFilter == 'all' || b.status == _selectedStatusFilter;

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
    final bookings = _filteredBookings;

    return RefreshIndicator(
      onRefresh: _loadBookings,
      color: AppColors.royal,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              children: [
                TextField(
                  onChanged: (val) => setState(() => _searchQuery = val),
                  decoration: InputDecoration(
                    hintText: 'بحث باسم المريض أو الهاتف أو كود الحجز...',
                    prefixIcon: const Icon(Icons.search, size: 20, color: AppColors.muted),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () => setState(() => _searchQuery = ''),
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  ),
                ),
                const SizedBox(height: 10),

                // Date Filters
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildChip('اليوم', 'today', _selectedDateFilter, (val) => setState(() => _selectedDateFilter = val)),
                      _buildChip('غداً', 'tomorrow', _selectedDateFilter, (val) => setState(() => _selectedDateFilter = val)),
                      _buildChip('القادمة', 'upcoming', _selectedDateFilter, (val) => setState(() => _selectedDateFilter = val)),
                      _buildChip('السابقة', 'past', _selectedDateFilter, (val) => setState(() => _selectedDateFilter = val)),
                      _buildChip('الكل', 'all', _selectedDateFilter, (val) => setState(() => _selectedDateFilter = val)),
                    ],
                  ),
                ),
                const SizedBox(height: 8),

                // Status Filters
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildChip('جميع الحالات', 'all', _selectedStatusFilter, (val) => setState(() => _selectedStatusFilter = val)),
                      _buildChip('بانتظار التأكيد', 'pending', _selectedStatusFilter, (val) => setState(() => _selectedStatusFilter = val)),
                      _buildChip('مؤكدة', 'confirmed', _selectedStatusFilter, (val) => setState(() => _selectedStatusFilter = val)),
                      _buildChip('تم الكشف', 'completed', _selectedStatusFilter, (val) => setState(() => _selectedStatusFilter = val)),
                      _buildChip('ملغية', 'cancelled', _selectedStatusFilter, (val) => setState(() => _selectedStatusFilter = val)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.border),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'عدد الحجوزات: ${bookings.length}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.muted),
                ),
                if (_isLoading)
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.royal),
                  ),
              ],
            ),
          ),

          Expanded(
            child: _isLoading && _allBookings.isEmpty
                ? const Center(child: CircularProgressIndicator(color: AppColors.royal))
                : bookings.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.inbox_outlined, size: 48, color: AppColors.muted),
                            SizedBox(height: 12),
                            Text('لا توجد حجوزات مطابقة للفلتر', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.muted)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        itemCount: bookings.length,
                        itemBuilder: (context, index) {
                          final appt = bookings[index];
                          return BookingCard(
                            appointment: appt,
                            onStatusChange: (status) async {
                              await SupabaseService.updateAppointmentStatus(appt.id, status);
                              _loadBookings();
                            },
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildChip(String label, String value, String selectedValue, Function(String) onSelect) {
    final isSelected = selectedValue == value;
    return Padding(
      padding: const EdgeInsets.only(left: 6),
      child: ChoiceChip(
        label: Text(label, style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
        selected: isSelected,
        onSelected: (selected) {
          if (selected) onSelect(value);
        },
        selectedColor: AppColors.royal,
        labelStyle: TextStyle(color: isSelected ? Colors.white : AppColors.dark),
        backgroundColor: AppColors.background,
        side: BorderSide(color: isSelected ? AppColors.royal : AppColors.border),
      ),
    );
  }
}
