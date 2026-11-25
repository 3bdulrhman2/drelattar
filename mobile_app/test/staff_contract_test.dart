import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
void main(){
 test('secretary metadata and settings never serialize passwords',(){
 final model=File('lib/models/secretary_account.dart').readAsStringSync();
 expect(model.contains('passwordHash'),false);expect(model.contains('password_hash'),false);
 final service=File('lib/services/supabase_service.dart').readAsStringSync();
 expect(service.contains("list.insert(0, account.toJson())"),false);
 expect(service.contains('/functions/v1/clinic-staff'),true);
 });
 test('login route comes from server role not role toggle',(){
 final screen=File('lib/screens/login_screen.dart').readAsStringSync();
 expect(screen.contains('if (AuthService.currentUser?.role == UserRole.admin)'),true);
 final auth=File('lib/services/auth_service.dart').readAsStringSync();expect(auth.contains('password: password.trim()'),false);
 });
}
