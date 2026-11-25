/// Pure preparation, no production data writes. All policy inputs are explicit.
class QueuePolicy {
  final DateTime startsAt;
  final DateTime closesAt;
  final Set<String> websiteStatuses;
  const QueuePolicy({
    required this.startsAt,
    required this.closesAt,
    required this.websiteStatuses,
  });
}

class WebsiteSlot {
  final String id, status;
  final DateTime time;
  const WebsiteSlot(this.id, this.status, this.time);
}

class QueuePlacement {
  final String id;
  final DateTime time;
  final bool fromWebsite;
  const QueuePlacement(this.id, this.time, {this.fromWebsite = false});
}

List<QueuePlacement> previewTimeline({
  required QueuePolicy policy,
  required List<WebsiteSlot> bookings,
  required List<String> walkInIds,
}) {
  if (policy.closesAt.isBefore(policy.startsAt))
    throw ArgumentError('Closing precedes opening');
  final online = bookings
      .where((b) => policy.websiteStatuses.contains(b.status))
      .toList();
  final result = online
      .map((b) => QueuePlacement(b.id, b.time, fromWebsite: true))
      .toList();
  var candidate = policy.startsAt;
  for (final id in walkInIds) {
    while (true) {
      if (candidate.add(const Duration(minutes: 15)).isAfter(policy.closesAt))
        throw StateError('No remaining clinic slot');
      final blocked = online.any((b) {
        final seconds = candidate.difference(b.time).inSeconds.abs();
        return seconds < 900;
      });
      if (!blocked && !result.any((r) => r.time == candidate)) break;
      candidate = candidate.add(const Duration(minutes: 15));
    }
    result.add(QueuePlacement(id, candidate));
    candidate = candidate.add(const Duration(minutes: 15));
  }
  result.sort((a, b) => a.time.compareTo(b.time));
  return result;
}
