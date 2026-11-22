import React from 'react';
export const SecretaryAccountsTab: React.FC = () => (
  <section dir="rtl" className="rounded-2xl border border-amber-600 bg-slate-900 p-6 text-slate-100 space-y-3">
    <h2 className="font-bold text-lg">حسابات الموظفين المحمية</h2>
    <p>أُلغيت كلمات المرور المشتركة والحسابات المحفوظة داخل محتوى الموقع.</p>
    <p>يحتاج كل موظف إلى حساب Supabase Auth وعضوية فعالة في clinic_staff. لا يمكن للمتصفح إنشاء العضوية أو منح نفسه صلاحيات.</p>
    <p>تجهيز دعوات الموظفين وترحيل التطبيق المحمول يحتاج مراجعة منفصلة قبل النشر. لم تتغير حسابات حقيقية في هذه النسخة.</p>
  </section>
);
