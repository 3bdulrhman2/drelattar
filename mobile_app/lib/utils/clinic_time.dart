String clinicTime(String value) {
  final match = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(value);
  if (match == null) return value;
  final hour = int.parse(match.group(1)!);
  final minute = match.group(2)!;
  final twelve = hour % 12 == 0 ? 12 : hour % 12;
  return '$twelve:$minute ${hour < 12 ? 'صباحًا' : 'مساءً'}';
}
