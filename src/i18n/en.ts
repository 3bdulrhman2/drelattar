import type {
  AppContentState,
  ClinicInfo,
  DoctorInfo,
  FAQItem,
  MedicalEquipment,
  MedicalService,
  SocialReviewImage,
} from '../types';

/**
 * English copy for the public clinic website.
 *
 * `EN_TEXT` is keyed by the exact Arabic string used in the interface, so a
 * component asks for its translation with t('…'). Anything missing falls back to
 * the Arabic text rather than showing an empty label.
 */
export const EN_TEXT: Record<string, string> = {
  // Navigation
  الرئيسية: 'Home',
  'عن الدكتور': 'About the Doctor',
  'الخدمات الطبية': 'Medical Services',
  'التجهيزات الطبية': 'Medical Equipment',
  'آراء المرضى': 'Patient Reviews',
  'الأسئلة الشائعة': 'FAQ',
  'موقع العيادة': 'Clinic Location',
  'اتصل بنا': 'Contact Us',
  'أقسام الموقع': 'Site sections',
  'بيانات التواصل والمواعيد': 'Contact details and hours',
  'تغيير اللغة': 'Change language',
  'القائمة الرئيسية': 'Main menu',
  'مواعيد العمل:': 'Working hours:',
  'الجمعة: 4:00 م - 10:00 م': 'Friday: 4:00 PM – 10:00 PM',
  'فرع واحد مجهز لاستقبالكم': 'One fully equipped branch',
  'اتصال بالعيادة': 'Call the clinic',
  'هاتف الدكتور': "Doctor's phone",
  'الموقع على الخريطة': 'Location on the map',
  واتساب: 'WhatsApp',
  'للأعلى': 'Back to top',
  'جميع الحقوق محفوظة ©': 'All rights reserved ©',
  'تصميم وتطوير هندسي فائق للمواقع الطبية المتخصصة.':
    'Designed and developed for specialised medical websites.',
  '(العيادة)': '(Clinic)',
  '(الطبيب)': '(Doctor)',
  'عيادة متخصصة في أمراض الباطنة العامة والعناية المركزة والحالات الحرجة. نقدم رعاية طبية شاملة ومتابعة دقيقة لمرضى السكري، ضغط الدم، القلب، الصدر، وجلسات التنفس والأكسجين.':
    'A clinic specialising in general internal medicine, intensive care and critical cases. We provide thorough medical care and close follow-up for diabetes, blood pressure, heart and chest conditions, plus nebuliser and oxygen therapy sessions.',
  'السبت – الخميس: 1:00 م حتى 9:00 م': 'Saturday – Thursday: 1:00 PM to 9:00 PM',  'الجمعة: 4:00 م حتى 10:00 م': 'Friday: 4:00 PM to 10:00 PM',
  'السبت – الخميس: 1:00 م حتى 9:00 م | الجمعة: 4:00 م حتى 10:00 م':
    'Saturday – Thursday: 1:00 PM to 9:00 PM | Friday: 4:00 PM to 10:00 PM',
  'السبت إلى الخميس: 1:00 م - 9:00 م | الجمعة: 4:00 م - 10:00 م':
    'Saturday to Thursday: 1:00 PM – 9:00 PM | Friday: 4:00 PM – 10:00 PM',
  'السبت إلى الخميس:': 'Saturday to Thursday:',
  'يوم الجمعة:': 'Friday:',
  '1:00 م – 9:00 م': '1:00 PM – 9:00 PM',
  '4:00 م – 10:00 م': '4:00 PM – 10:00 PM',

  // Social platforms
  فيسبوك: 'Facebook',
  إنستغرام: 'Instagram',
  'تيك توك': 'TikTok',
  'خرائط Google': 'Google Maps',

  // Hero
  'عيادة معتمدة – فرع كوبري واحد الصالحية، الحسينية':
    'Accredited clinic – Kobri Wahid El-Salhia branch, Al-Husseiniya',
  'رعايتك الصحية': 'Your health care',
  'تبدأ من هنا': 'starts here',
  'رعاية طبية متخصصة في أمراض الباطنة العامة والعناية المركزة والحالات الحرجة، بخبرة واهتمام بصحتك.':
    'Specialist medical care in general internal medicine, intensive care and critical cases, delivered with experience and real attention to your health.',
  'اتصل الآن': 'Call now',
  'اتصال الآن': 'Call now',
  'احجز موعدك': 'Book your appointment',
  'تعرف على الخدمات': 'Explore our services',
  'الكشف والمتابعة:': 'Consultations and follow-up:',
  'الحضور المباشر بالعيادة أو الترتيب المسبق هاتفياً دون انتظار.':
    'Walk in during clinic hours or arrange a time by phone and skip the wait.',
  'المسيرة المهنية': 'Career',
  'خبرة 8 سنوات': '8 years of experience',
  'التخصص الدقيق': 'Specialty',
  'باطنة & عناية مركزة': 'Internal medicine & intensive care',

  // Trust indicators
  '8 سنوات من الخبرة': '8 years of experience',
  'ممارسة إكلينيكية وعناية مركزة': 'Clinical practice and intensive care',
  'خريج كلية الطب': 'Faculty of Medicine graduate',
  'جامعة الأزهر بالقاهرة': 'Al-Azhar University, Cairo',
  'متخصص في الباطنة والعناية المركزة': 'Specialist in internal medicine and intensive care',
  'زمالة الباطنة والحالات الحرجة': 'Fellowship in internal medicine and critical care',
  'متابعة الحالات المزمنة والحرجة': 'Chronic and critical case follow-up',
  'بروتوكولات علاجية شاملة ودقيقة': 'Thorough, precise treatment protocols',

  // About the doctor
  'السيرة المهنية والخبرات الأكاديمية': 'Career and academic background',
  'عن الدكتور محمد السيد العطار': 'About Dr. Mohamed El Sayed El Attar',
  'التزام راسخ بالمعايير الطبية المعتمدة وخبرة إكلينيكية متخصصة في الحالات الحرجة وأمراض الباطنة':
    'A firm commitment to recognised medical standards, with specialised clinical experience in critical cases and internal medicine.',
  'المؤهل الأكاديمي': 'Academic qualification',
  'طب الأزهر بالقاهرة': 'Al-Azhar Medicine, Cairo',
  'المؤهلات والمناصب الطبية الرسمية:': 'Qualifications and official medical posts:',
  'مجالات الاختصاص والاهتمام الإكلينيكي:': 'Clinical specialties and areas of interest:',

  // Services
  'جميع الخدمات (13)': 'All services (13)',
  'العناية المركزة والحرجة': 'Intensive and critical care',
  'الأمراض المزمنة': 'Chronic conditions',
  'جلسات التنفس والأكسجين': 'Breathing and oxygen sessions',
  'الباطنة العامة': 'General internal medicine',
  'الخدمات الطبية المتكاملة': 'Complete medical services',
  'الخدمات الطبية بعيادة الدكتور محمد السيد العطار':
    'Medical services at Dr. Mohamed El Sayed El Attar Clinic',
  'رعاية تشخيصية وعلاجية مبنية على أحدث البروتوكولات الإكلينيكية لمختلف أمراض الباطنة والحالات الحرجة':
    'Diagnostic and treatment care built on current clinical protocols for internal medicine conditions and critical cases.',
  'متابعة إكلينيكية دقيقة': 'Careful clinical follow-up',
  استفسار: 'Ask about it',
  'هل تحتاج إلى استشارة عاجلة أو متابعة خاصة لحالة حرجة؟':
    'Need an urgent consultation or close follow-up for a critical case?',
  'يمكنك التنسيق المباشر مع طاقم العيادة لترتيب حضور المريض أو تقييم الفحوصات والتحاليل الطبية.':
    'You can arrange it directly with the clinic team: a visit for the patient, or a review of tests and lab results.',
  'اتصل للاستفسار': 'Call to ask',

  // Equipment
  'التجهيزات والتقنيات الطبية': 'Medical equipment and technology',
  'أجهزة تشخيصية متطورة لرعاية دقيقة': 'Advanced diagnostic equipment for precise care',
  'حرصاً على سلامة المرضى، تم تجهيز عيادة الدكتور محمد السيد العطار بأحدث الأجهزة التشخيصية المعتمدة':
    'For patient safety, Dr. Mohamed El Sayed El Attar Clinic is equipped with approved diagnostic devices.',
  'أعلى معايير التعقيم ومكافحة العدوى': 'The highest sterilisation and infection-control standards',
  'تخضع جميع الأجهزة والأدوات لبروتوكولات تعقيم وتطهير دورية وصارمة لضمان بيئة علاجية آمنة.':
    'All devices and instruments go through strict, regular sterilisation and disinfection protocols to keep the treatment environment safe.',
  'سلامتكم أولويتنا': 'Your safety comes first',

  // Reviews
  'آراء وتجارب المرضى الحقيقية 100%': '100% real patient experiences',
  'آراء حقيقية 100% عبر وسائل التواصل الاجتماعي': 'Real reviews shared on social media',
  'محادثات ورسائل شكر حقيقية يشاركها معنا مرضانا الكرام عبر صفحاتنا على منصات التواصل ومحادثات الواتساب تقديراً لدقة التشخيص والرعاية الطبية بأعلى درجات الأمانة.':
    'Real messages and thank-you notes our patients share with us on social media and WhatsApp, in appreciation of precise diagnosis and honest care.',
  'محادثات واتساب': 'WhatsApp chats',
  'توصيات فيسبوك': 'Facebook recommendations',
  'واتساب موثق': 'Verified WhatsApp',
  'توصية فيسبوك': 'Facebook recommendation',
  'تقييم موثق': 'Verified review',
  'الصورة التالية': 'Next image',
  التالي: 'Next',
  'الصورة السابقة': 'Previous image',
  السابق: 'Previous',
  'رأي مريض موثق': 'Verified patient review',
  'انقر لتكبير وقراءة الصورة بوضوح': 'Click to enlarge and read the image clearly',
  من: 'of',
  'انتقال للصورة': 'Go to image',
  'جاري إضافة محادثات وآراء المرضى': 'Patient messages and reviews are being added',
  'يمكن لإدارة العيادة إضافة صور سكرين شوت المحادثات بسهولة من لوحة التحكم.':
    'The clinic can add screenshots of these conversations from the dashboard.',
  'رأيك محل اهتمامنا وتجربتك تهمنا دائماً': 'Your opinion and experience always matter to us',
  'يسعدنا دائماً تلقي تقييماتكم واستفساراتكم، ومشاركة تجاربكم في العيادة عبر الواتساب أو صفحة العيادة على خرائط Google.':
    'We are always glad to receive your reviews and questions, and to hear about your visit on WhatsApp or our Google Maps page.',
  'شاركنا تجربتك على واتساب': 'Share your experience on WhatsApp',
  'تقييمات خرائط Google': 'Google Maps reviews',
  إغلاق: 'Close',
  'رأي مريض': 'Patient review',

  // FAQ
  'إجابات واضحة ودقيقة': 'Clear, precise answers',
  'الأسئلة الشائعة والمعلومات الهامة': 'Frequently asked questions',
  'إجابات شاملة عن كل ما يخص مواعيد العيادة، الخدمات المتوفرة، وكيفية الوصول والتواصل':
    'Answers about clinic hours, the services we offer, and how to get here or reach us.',
  'هل لديك استفسار طبي أو تنظيمي آخر؟': 'Do you have another medical or admin question?',
  'يسعدنا استقبال اتصالاتكم والإجابة على كافة الأسئلة مباشرة.':
    'We are happy to take your call and answer any question directly.',

  // Location
  'المقر والموقع الجغرافي': 'Address and location',
  'موقع عيادة الدكتور محمد السيد العطار': 'Dr. Mohamed El Sayed El Attar Clinic location',
  'سهولة الوصول وموقع متميز أمام موقف السيارات عند كوبري واحد الصالحية، بحر البقر، مركز الحسينية':
    'Easy to reach, right in front of the car park at Kobri Wahid El-Salhia, Bahr El-Baqar, Al-Husseiniya Center.',
  'العنوان التفصيلي:': 'Full address:',
  'علامة مميزة:': 'Landmark:',
  '(فرع واحد مجهز).': '(one fully equipped branch).',
  'مواعيد العمل الرسمية:': 'Official working hours:',
  'أرقام التواصل المباشرة:': 'Direct contact numbers:',
  'هاتف العيادة والحجز': 'Clinic and booking line',
  'هاتف الدكتور المباشر': "Doctor's direct line",
  'فتح في خرائط Google': 'Open in Google Maps',
  'الاتجاهات إلى العيادة': 'Directions to the clinic',

  // Contact
  'قنوات الاتصال المباشرة': 'Direct contact channels',
  'تواصل مع عيادة الدكتور محمد السيد العطار': 'Contact Dr. Mohamed El Sayed El Attar Clinic',
  'فريق العيادة جاهز للرد على استفساراتكم وترتيب حضوركم ومتابعة حالاتكم الصحية':
    'The clinic team is ready to answer your questions, arrange your visit and follow up on your health.',
  'الصفحة الرسمية': 'Official page',
  'محتوى توعوي': 'Health content',
  'فيديوهات طبية': 'Medical videos',
  'متاح خلال مواعيد العمل الرسمية': 'Available during official clinic hours',
  'الاتصال الهاتفي المباشر بالعيادة': 'Call the clinic directly',
  'يمكنكم الاتصال مباشرة لترتيب موعد الكشف، الاستفسار عن التحاليل، أو متابعة الحالات الحرجة.':
    'Call us to arrange a consultation, ask about lab tests, or follow up a critical case.',
  'رقم العيادة الأساسي': 'Main clinic number',
  'مراسلة عبر واتساب': 'Message on WhatsApp',
  'هاتف الدكتور محمد السيد العطار': "Dr. Mohamed El Sayed El Attar's phone",
  'اتصال بالطبيب': 'Call the doctor',
  'مراسلة الطبيب عبر واتساب': "Message the doctor on WhatsApp",
  'تواصل تفاعلي': 'Social',
  'الصفحات الطبية الرسمية': 'Official medical pages',
  'تابع الدكتور محمد السيد العطار للاطلاع على النصائح الطبية والتوعية الصحية بأمراض الباطنة والوقاية:':
    'Follow Dr. Mohamed El Sayed El Attar for medical advice and health awareness on internal medicine and prevention:',
  'الزيارة المباشرة للعيادة:': 'Walk-in visits:',
  'لا يتطلب الكشف حجزا مسبقا إلزامياً؛ نرحب بزيارتكم مباشرة في كوبري واحد الصالحية، أمام موقف السيارات، بحر البقر، مركز الحسينية.':
    'A consultation does not require a prior booking; you are welcome to visit us at Kobri Wahid El-Salhia, in front of the car park, Bahr El-Baqar, Al-Husseiniya Center.',

  // Booking module
  'نظام الحجز المسبق الإلكتروني': 'Online booking',
  'احجز موعد كشفك مسبقاً بكل سهولة': 'Book your consultation in a few steps',
  'اختر الموعد الأنسب لك من المواعيد المتاحة؛ المواعيد بتوقيت القاهرة الرسمي، وبمعدل حجز واحد كل ساعة لضمان راحتكم وعدم التكدس (يلزم الحجز قبل الموعد بـ 3 ساعات على الأقل).':
    'Pick the slot that suits you. Times are Cairo time, one booking per slot, and bookings must be made at least 3 hours ahead.',
  'التوقيت الحالي:': 'Current time:',
  'بتوقيت القاهرة (Africa/Cairo)': 'Cairo time (Africa/Cairo)',
  'تم استلام طلب الحجز بنجاح': 'Your booking request was received',
  'أهلاً بك يا': 'Welcome,',
  '، طلبك مسجل لدينا!': '. Your request is recorded.',
  'تم حفظ طلبك بحالة انتظار المراجعة. الموعد غير مؤكد نهائياً حتى تؤكده العيادة.':
    'Your request is saved as pending review. The appointment is not confirmed until the clinic confirms it.',
  'رقم الحجز:': 'Booking number:',
  'اسم المريض:': 'Patient name:',
  'رقم التواصل:': 'Contact number:',
  'الطبيب:': 'Doctor:',
  'تاريخ الحجز:': 'Booking date:',
  'موعد الزيارة (توقيت القاهرة):': 'Visit time (Cairo time):',
  'نوع الخدمة:': 'Service:',
  'مقر العيادة:': 'Clinic address:',
  'زيارة العيادة': 'Clinic visit',
  'التواصل الخارجي معطل في النسخة التجريبية': 'External contact is disabled in this preview build',
  'مراجعة طلب الموعد مع العيادة عبر الواتساب': 'Review the request with the clinic on WhatsApp',
  'حجز موعد آخر': 'Book another appointment',
  'جار التحقق من المواعيد...': 'Checking availability…',
  'اختر يوم الكشف:': 'Choose the day:',
  'متاح لـ': 'Available for the next',
  'يوماً قادمة': 'days',
  'إجازة / مغلق': 'Closed',
  'اختر التوقيت المتاح': 'Choose an available time',
  'مغلق': 'Closed',
  'جاري تحميل المواعيد...': 'Loading times…',
  'مواعيد شاغرة متاحة': 'free slots available',
  'فاصل المواعيد:': 'Slot interval:',
  'لمنع التكدس • يشترط الحجز قبل الموعد بـ 3 ساعات على الأقل • الإتاحة النهائية تُراجع عند حفظ الطلب':
    'to avoid crowding • bookings must be made at least 3 hours ahead • availability is checked again when you submit',
  'نعتذر، العيادة مغلقة في هذا اليوم ولا يتم استقبال حجوزات جديدة.':
    'Sorry, the clinic is closed on this day and is not taking new bookings.',
  'يرجى اختيار يوم آخر متاح من الأيام الموضحة بالأعلى.':
    'Please choose another available day above.',
  'تعذر تحميل مواعيد هذا اليوم حالياً': 'Could not load the times for this day',
  'يرجى إعادة اختيار اليوم مرة أخرى، أو الاتصال بالعيادة مباشرة إذا استمرت المشكلة.':
    'Please pick the day again, or call the clinic directly if the problem continues.',
  'جاري تحميل المواعيد المتاحة لهذا اليوم...': 'Loading the available times for this day…',
  'عذراً، اكتملت جميع المواعيد المتاحة لهذا اليوم':
    'Sorry, all the available times for this day are taken',
  'يرجى اختيار يوم آخر من الأيام بالأعلى، أو الاتصال بالعيادة مباشرة للحالات الطارئة.':
    'Please choose another day above, or call the clinic directly for emergencies.',
  'الموعد المختار:': 'Selected time:',
  'بتوقيت القاهرة': 'Cairo time',
  'بيانات المريض للتأكيد:': 'Patient details for confirmation:',
  'اسم المريض ثلاثي / رباعي *': 'Full patient name (three or four parts) *',
  'مثال: أحمد محمد علي': 'e.g. Ahmed Mohamed Ali',
  'رقم هاتف المريض أو المرافق (للتأكيد) *': "Patient's or companion's phone number (for confirmation) *",
  '* تُراجع إتاحة الموعد عند الحفظ. الطلب ينتظر تأكيد العيادة.':
    '* Availability is checked again when you submit. The request waits for clinic confirmation.',
  'جار حفظ الطلب...': 'Saving the request…',
  'إرسال طلب الحجز': 'Send booking request',
  'اختر التوقيت أولاً لتأكيد الحجز': 'Choose a time first to confirm the booking',
  'تعذر تحديث المواعيد. راجع العيادة قبل إرسال طلب مختلف.':
    'Could not refresh availability. Check with the clinic before sending a different request.',
  'تعذر التحقق من المواعيد. لم يُرسل أي طلب.': 'Could not verify availability. Nothing was sent.',
  'عذراً، هذا اليوم غير متاح للحجز': 'Sorry, this day is not available for booking',
  'العيادة مغلقة': 'the clinic is closed',
  'يرجى اختيار يوم آخر.': 'Please choose another day.',
  'يرجى ملء جميع البيانات الأساسية واختيار موعد الكشف':
    'Please fill in the basic details and choose a consultation time',
  'لم يتم حفظ الطلب.': 'The request was not saved.',
  'كل ربع ساعة': 'every 15 minutes',
  'كل نصف ساعة': 'every 30 minutes',
  'كل ساعة إلا ربع': 'every 45 minutes',
  'كل ساعة': 'every hour',
  'كشف باطنة عامة ورعاية حرجة': 'General internal medicine consultation and critical care',
  'فحص الموجات فوق الصوتية (السونار)': 'Ultrasound scan',
  'تخطيط ورسم كهربية القلب (ECG)': 'ECG',
  'متابعة وتشخيص السكري ومقاومة الإنسولين': 'Diabetes and insulin resistance follow-up',
  'ضبط ضغط الدم والدهون والوقاية الوعائية': 'Blood pressure, lipids and vascular prevention',
  'تشخيص أمراض الجهاز الهضمي والكبد والقولون': 'Digestive, liver and colon conditions',
  'جلسات أكسجين وتنفس بالبخار (Nebulizer)': 'Oxygen and nebuliser sessions',
  'استشارة طبية وفحص شامل': 'Medical consultation and full check-up',

  // Booking page
  'حجز موعد': 'Book an appointment',
  'الرجوع للرئيسية': 'Back to home',
  'صفحة حجز المواعيد الرسمية المعتمدة': 'Official appointment booking page',
  'حجز موعد كشف': 'Book a consultation',
  'طلب حجز يخضع لتأكيد العيادة': 'Request subject to clinic confirmation',
  'الحجز الإلكتروني غير مفعل حالياً': 'Online booking is currently off',
  'الكشف والمتابعة بالحضور المباشر أو التنسيق الهاتفي':
    'Consultations and follow-up by walk-in visit or by phone',
  'تستقبل عيادة الدكتور محمد السيد العطار المرضى الكرام يومياً خلال مواعيد العمل الرسمية، ويمكنكم التنسيق الهاتفي المسبق لضمان راحتكم.':
    'Dr. Mohamed El Sayed El Attar Clinic welcomes patients every day during official clinic hours. You can also arrange a time by phone to avoid waiting.',
  'اتصل بالعيادة:': 'Call the clinic:',
  'تواصل عبر الواتساب': 'Message us on WhatsApp',
  'العودة لصفحة العيادة الرئيسية': 'Back to the clinic home page',
  'التخصص الطبي': 'Specialty',
  'مقر العيادة': 'Clinic address',
  'مواعيد العمل': 'Working hours',

  // Notices
  'تنويه: الحجز بالعيادة متوقف مؤقتاً اليوم. نستقبلكم مجدداً في مواعيد العمل القادمة.':
    'Notice: online booking is paused today. We welcome you again at the next working hours.',
  'تنويه: العيادة في عطلة': 'Notice: the clinic is on holiday',
  'مرحباً بك! تم تفعيل الإشعارات بنجاح 🔔': 'Welcome! Notifications are now on 🔔',
  'ستصلك تنبيهات فورية بمواعيد وتأكيدات الحجوزات وأحدث التنويهات من عيادة د. محمد السيد العطار.':
    'You will get instant alerts for appointment confirmations and the latest notices from Dr. Mohamed El Sayed El Attar Clinic.',
  'تم تفعيل التنبيهات بنجاح!': 'Notifications are now on!',
  'شكراً لك، ستصلك التنبيهات والتحديثات الطبية فوراً.':
    'Thank you. You will receive alerts and medical updates right away.',
  'تفعيل إشعارات وتنبيهات العيادة': 'Turn on clinic notifications',
  فوري: 'Instant',
  'احصل على تنبيهات فورية ومباشرة بمواعيد حجزك، وإعلانات العيادة والعروض الطبية المعتمدة من د. محمد السيد العطار.':
    'Get instant alerts about your appointments, clinic announcements and medical offers from Dr. Mohamed El Sayed El Attar.',
  'جاري التفعيل...': 'Turning on…',
  'تفعيل الإشعارات الآن 🔔': 'Turn on notifications 🔔',
  لاحقاً: 'Later',
};

const EN_DOCTOR: Pick<DoctorInfo, 'title' | 'specialties' | 'education' | 'credentials' | 'bio'> = {
  title: 'Specialist in General Internal Medicine, Intensive Care and Critical Cases',
  specialties: [
    'General internal medicine',
    'Infectious diseases (fevers)',
    'Cardiology',
    'Chest diseases',
    'Intensive care',
    'Critical care',
  ],
  education: 'Faculty of Medicine – Al-Azhar University, Cairo',
  credentials: [
    'Fellowship in general internal medicine, intensive care and critical cases',
    'Deputy Head of the Internal Medicine Department, Ismailia Medical Complex – Egyptian Health Care Authority',
    'Deputy Director of the Intensive Care Unit, Ismailia Fever Hospital',
  ],
  bio: 'A physician with 8 years of experience diagnosing and treating general internal medicine conditions, managing critical cases, and following up patients after they leave intensive care. He brings his clinical and academic experience to careful, thorough care that pays attention to the smallest health details of every patient.',
};

const EN_CLINIC: Pick<
  ClinicInfo,
  'name' | 'address' | 'landmark' | 'city' | 'governorate' | 'country' | 'hoursRegular' | 'hoursFriday'
> = {
  name: 'Dr. Mohamed El Sayed El Attar Clinic',
  address:
    'Kobri Wahid El-Salhia – in front of the car park – Bahr El-Baqar – Al-Husseiniya Center – Al-Sharqia Governorate – Egypt',
  landmark: 'In front of the car park, Kobri Wahid El-Salhia',
  city: 'Bahr El-Baqar – Al-Husseiniya Center',
  governorate: 'Al-Sharqia Governorate',
  country: 'Egypt',
  hoursRegular: 'Saturday to Thursday: 1:00 PM – 9:00 PM',
  hoursFriday: 'Friday: 4:00 PM – 10:00 PM',
};

const EN_SERVICES: Record<string, { title: string; description: string }> = {
  'srv-1': {
    title: 'Blood pressure, heart and chest follow-up',
    description:
      'Accurate assessment of blood pressure with adjusted treatment protocols, plus follow-up of heart muscle and artery conditions and respiratory problems.',
  },
  'srv-2': {
    title: 'Diabetes and endocrine disorder follow-up',
    description:
      'A tailored treatment plan to control blood sugar and prevent long-term complications, with an endocrine assessment.',
  },
  'srv-3': {
    title: 'Diabetic peripheral neuropathy follow-up',
    description:
      'Careful clinical examination of the peripheral nerves and medication protocols to relieve numbness and pain and prevent loss of sensation.',
  },
  'srv-4': {
    title: 'Intensive care and critical case follow-up',
    description:
      'Close medical supervision built on advanced intensive care experience, for complex and medically unstable cases.',
  },
  'srv-5': {
    title: 'Follow-up after hospital discharge',
    description:
      'Re-assessment of the patient, completion of the treatment plan and adjustment of medication for a safe recovery after a hospital stay.',
  },
  'srv-6': {
    title: 'Stroke, hepatic coma and diabetic coma follow-up',
    description:
      'Specialist care for patients after cerebrovascular events, metabolic disturbances of consciousness, and comas caused by diabetes or liver disease.',
  },
  'srv-7': {
    title: 'Kidney failure follow-up',
    description:
      'Monitoring kidney function and balancing fluids, salts and blood pressure, with full coordination with dialysis centres when needed.',
  },
  'srv-8': {
    title: 'Liver and kidney function disorders',
    description:
      'Monitoring enzyme levels and liver and kidney function, and catching any decline early so the right intervention can be made.',
  },
  'srv-9': {
    title: 'Anaemia follow-up',
    description:
      'Identifying the causes of anaemia through lab tests, with iron and vitamin treatment programmes and regular follow-up.',
  },
  'srv-10': {
    title: 'Gastroenteritis and digestive disorders',
    description:
      'Diagnosis and treatment of dehydration, stomach and colon inflammation, gastrointestinal bleeding, and acute and chronic digestive problems.',
  },
  'srv-11': {
    title: 'Care for older adults and age-related conditions',
    description:
      'Thorough care for older patients, with careful balancing of multiple medications to avoid drug interactions.',
  },
  'srv-12': {
    title: 'Nebuliser (steam inhalation) sessions',
    description:
      'Inhalation sessions with bronchodilators for chest allergy, asthma and acute lung infections.',
  },
  'srv-13': {
    title: 'Therapeutic oxygen sessions',
    description:
      'Medical oxygen support for patients with low oxygen saturation and sudden breathing difficulty.',
  },
};

const EN_EQUIPMENT: Record<string, { name: string; description: string; importance: string }> = {
  'eq-1': {
    name: 'Blood pressure measurement devices',
    description:
      'Electronic and manual medically approved devices for accurate blood pressure measurement and spotting small changes.',
    importance: 'Essential for diagnosis and regular follow-up of heart and artery conditions',
  },
  'eq-2': {
    name: 'Pulse oximeter',
    description:
      'Devices that track blood oxygen levels and heart rate instantly during examinations and breathing sessions.',
    importance: 'Needed to assess breathing efficiency and critical chest cases',
  },
  'eq-3': {
    name: 'Diagnostic ultrasound (abdomen and pelvis)',
    description:
      'Ultrasound examination of the abdomen and pelvis to assess the liver, kidneys, gallbladder, spleen and bladder.',
    importance: 'Gives a clear internal view of complex internal medicine cases',
  },
  'eq-4': {
    name: 'ECG (electrocardiogram)',
    description:
      'Accurate recording of the heart’s electrical signals to detect rhythm disorders, coronary artery disease and clots.',
    importance: 'Decisive for immediate diagnosis of heart conditions and emergencies',
  },
};

const EN_FAQ: Record<string, { question: string; answer: string }> = {
  'faq-1': {
    question: 'What are Dr. Mohamed El Sayed El Attar’s specialties?',
    answer:
      'Dr. Mohamed El Sayed El Attar is a specialist in general internal medicine, intensive care and critical cases. His specialties include general internal medicine, infectious diseases, cardiology, chest diseases, intensive care, and the follow-up of critical and complex cases.',
  },
  'faq-2': {
    question: 'Where is Dr. Mohamed El Sayed El Attar’s clinic?',
    answer:
      'The clinic is at Kobri Wahid El-Salhia – in front of the car park – Bahr El-Baqar – Al-Husseiniya Center – Al-Sharqia Governorate – Egypt. It is one fully equipped branch.',
  },
  'faq-3': {
    question: 'What are the clinic’s working hours?',
    answer:
      'The clinic receives patients Saturday to Thursday from 1:00 PM to 9:00 PM, and on Friday from 4:00 PM to 10:00 PM.',
  },
  'faq-4': {
    question: 'Can I come to the clinic without booking first?',
    answer:
      'Yes. You can walk in during official working hours, or arrange a time in advance by calling the clinic numbers.',
  },
  'faq-5': {
    question: 'What medical equipment is available at the clinic?',
    answer:
      'The clinic has blood pressure devices (electronic and manual), a pulse oximeter, diagnostic ultrasound for the abdomen and pelvis, and an ECG machine.',
  },
  'faq-6': {
    question: 'Are nebuliser sessions available at the clinic?',
    answer:
      'Yes. Nebuliser sessions with bronchodilator medication are available for asthma attacks and acute breathing difficulty.',
  },
  'faq-7': {
    question: 'Are oxygen sessions available at the clinic?',
    answer:
      'Yes. Medical oxygen sessions are available for patients with low oxygen saturation or sudden breathing difficulty, under direct medical supervision.',
  },
  'faq-8': {
    question: 'How can I contact Dr. Mohamed El Sayed El Attar’s clinic?',
    answer:
      'Call the clinic on 01060918977 or the doctor on 01007347945, or message either number on WhatsApp. You can also follow the official Facebook, Instagram and TikTok pages.',
  },
};

const EN_REVIEW_IMAGES: Record<string, { title: string; caption: string; date: string; patientName: string }> = {
  'rev-img-1': {
    title: 'WhatsApp conversation – acute shortness of breath, with diabetes and blood pressure medication adjusted',
    caption: 'Quick response, accurate ultrasound and ECG diagnosis that saved the case',
    date: '2 days ago',
    patientName: 'Mr. Mahmoud Abdel Rahman',
  },
  'rev-img-2': {
    title: 'Facebook recommendation – careful examination and medical honesty',
    caption: 'A genuine thank-you for the clinic and its diagnostic equipment',
    date: '2 weeks ago',
    patientName: 'Eng. Ibrahim El-Sayed El-Shafei',
  },
  'rev-img-3': {
    title: 'WhatsApp conversation – a fellow doctor on the accuracy of the internal medicine diagnosis',
    caption: 'Pride in Al-Azhar-trained internal medicine and intensive care doctors',
    date: 'Yesterday',
    patientName: 'Dr. Tarek Abdel Moneim',
  },
  'rev-img-4': {
    title: 'Instagram messages – treating chronic digestive and colon problems',
    caption: 'Treatment organised, unnecessary medication stopped, clear improvement',
    date: 'This week',
    patientName: 'Umm Habiba (clinic patient)',
  },
};

const translate = (value: string): string => EN_TEXT[value] ?? value;

export const localizeContent = (data: AppContentState, lang: 'ar' | 'en'): AppContentState => {
  if (lang === 'ar') return data;

  const doctor: DoctorInfo = {
    ...data.doctor,
    // nameAr drives every visible doctor name on the site, so it carries the
    // English name here; nameEn keeps the Arabic name as the secondary line.
    nameAr: 'Dr. Mohamed El Sayed El Attar',
    nameEn: data.doctor.nameAr,
    ...EN_DOCTOR,
  };

  const clinic: ClinicInfo = {
    ...data.clinic,
    ...EN_CLINIC,
    googleMapsEmbedUrl: data.clinic.googleMapsEmbedUrl?.replace('hl=ar', 'hl=en'),
  };

  const services: MedicalService[] = data.services.map((service) => {
    const en = EN_SERVICES[service.id];
    return en
      ? { ...service, title: en.title, description: en.description }
      : { ...service, title: translate(service.title), description: translate(service.description) };
  });

  const equipment: MedicalEquipment[] = data.equipment.map((item) => {
    const en = EN_EQUIPMENT[item.id];
    return en
      ? { ...item, name: en.name, description: en.description, importance: en.importance }
      : {
          ...item,
          name: translate(item.name),
          description: translate(item.description),
          importance: translate(item.importance),
        };
  });

  const faq: FAQItem[] = data.faq.map((item) => {
    const en = EN_FAQ[item.id];
    return en
      ? { ...item, question: en.question, answer: en.answer }
      : { ...item, question: translate(item.question), answer: translate(item.answer) };
  });

  const socialReviewImages: SocialReviewImage[] = data.socialReviewImages.map((image) => {
    const en = EN_REVIEW_IMAGES[image.id];
    return en
      ? { ...image, title: en.title, caption: en.caption, date: en.date, patientName: en.patientName }
      : {
          ...image,
          title: image.title ? translate(image.title) : image.title,
          caption: image.caption ? translate(image.caption) : image.caption,
        };
  });

  return {
    ...data,
    doctor,
    clinic,
    services,
    equipment,
    faq,
    socialReviewImages,
    bookingSettings: {
      ...data.bookingSettings,
      instructionText: translate(data.bookingSettings.instructionText),
    },
    visibility: {
      ...data.visibility,
      emergencyNoticeText: data.visibility.emergencyNoticeText
        ? translate(data.visibility.emergencyNoticeText)
        : data.visibility.emergencyNoticeText,
    },
  };
};
