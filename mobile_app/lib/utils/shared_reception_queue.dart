/// Shared queue calculation preparation. Only waiting walk-ins move.
/// Server must supply Cairo wall-clock date/time and clinic bounds.
class ReceptionPolicy {
  final DateTime opensAt, closesAt, now;
  const ReceptionPolicy({
    required this.opensAt,
    required this.closesAt,
    required this.now,
  });
}

class ReceptionItem {
  final String id, name, source, status;
  final DateTime time;
  const ReceptionItem({
    required this.id,
    required this.name,
    required this.source,
    required this.status,
    required this.time,
  });
  ReceptionItem at(DateTime value) => ReceptionItem(
    id: id,
    name: name,
    source: source,
    status: status,
    time: value,
  );
}

class ReceptionSchedule {
  final List<ReceptionItem> items, unplaced;
  const ReceptionSchedule(this.items, this.unplaced);
}

DateTime quarterCeiling(DateTime d) {
  final midnight = DateTime(d.year, d.month, d.day);
  final minutes = d.difference(midnight).inMicroseconds;
  const unit = 15 * 60 * 1000000;
  return midnight.add(
    Duration(microseconds: ((minutes + unit - 1) ~/ unit) * unit),
  );
}

ReceptionSchedule calculateReception({
  required ReceptionPolicy policy,
  required List<ReceptionItem> website,
  required List<ReceptionItem> walkIns,
}) {
  if (policy.closesAt.isBefore(policy.opensAt))
    throw ArgumentError('Invalid clinic hours');
  bool sameDay(DateTime d) =>
      d.year == policy.opensAt.year &&
      d.month == policy.opensAt.month &&
      d.day == policy.opensAt.day;
  final bookings = website
      .where((b) => sameDay(b.time) && b.status != 'cancelled')
      .toList();
  final fixed = walkIns
      .where(
        (w) =>
            sameDay(w.time) && w.status != 'waiting' && w.status != 'cancelled',
      )
      .toList();
  final waiting =
      walkIns.where((w) => sameDay(w.time) && w.status == 'waiting').toList()
        ..sort((a, b) {
          final t = a.time.compareTo(b.time);
          return t != 0 ? t : a.id.compareTo(b.id);
        });
  final placed = <ReceptionItem>[...bookings, ...fixed],
      unplaced = <ReceptionItem>[];
  var earliest = policy.now.isAfter(policy.opensAt)
      ? policy.now
      : policy.opensAt;
  var next = quarterCeiling(earliest);
  for (final w in waiting) {
    // Walk-in arrival cannot be scheduled before itself; FIFO otherwise persists.
    if (w.time.isAfter(next)) next = quarterCeiling(w.time);
    bool blocked(DateTime t) => placed.any((p) {
      if (p.source == 'website' &&
          ![
            'pending',
            'confirmed',
            'arrived',
            'in_consultation',
          ].contains(p.status))
        return false;
      if (p.source != 'website' &&
          !['waiting', 'in_consultation'].contains(p.status))
        return false;
      return t.difference(p.time).inMicroseconds.abs() < 15 * 60 * 1000000;
    });
    while (blocked(next)) next = next.add(const Duration(minutes: 15));
    // Reception may add patients after closing time: only the website stops at
    // closing time, the walk-in queue keeps going.
    placed.add(w.at(next));
    next = next.add(const Duration(minutes: 15));
  }
  placed.sort((a, b) {
    final t = a.time.compareTo(b.time);
    return t != 0 ? t : a.id.compareTo(b.id);
  });
  return ReceptionSchedule(
    List.unmodifiable(placed),
    List.unmodifiable(unplaced),
  );
}
