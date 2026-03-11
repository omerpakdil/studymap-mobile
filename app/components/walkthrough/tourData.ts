import type { SupportedLanguage } from '@/app/i18n';

export interface StepData {
  icon: string;
  titles: Record<SupportedLanguage, string>;
  descs: Record<SupportedLanguage, string>;
}

export const TOUR_STEPS: StepData[] = [
  {
    icon: 'grid-outline',
    titles: {
      en: "Today's Plan",
      tr: 'Günlük Planın',
      de: 'Tagesplan',
      fr: "Plan du jour",
      ar: 'خطة اليوم',
      ja: '今日のプラン',
      ko: '오늘의 플랜',
      'pt-BR': 'Plano de hoje',
      'zh-Hans': '今日计划',
      id: 'Rencana Hari Ini',
      hi: 'आज का प्लान',
    },
    descs: {
      en: "Your daily study tasks are here. Tap any task to open the focus timer — choose a session length and start studying. Your adaptive plan updates as you progress.",
      tr: "Bugünkü çalışma görevlerin burada listelenir. Bir göreve dokununca odak zamanlayıcısı açılır, süreyi seç ve başla. Plan, öğrenim durumuna göre sürekli güncellenir.",
      de: "Deine täglichen Lernaufgaben sind hier. Tippe auf eine Aufgabe, um den Fokus-Timer zu öffnen, wähle eine Sitzungsdauer und lerne. Der Plan passt sich deinem Fortschritt an.",
      fr: "Tes tâches du jour sont ici. Appuie sur une tâche pour ouvrir le minuteur de focus, choisis une durée et commence. Le plan s'adapte à ta progression.",
      ar: "مهام دراستك اليومية هنا. اضغط على مهمة لفتح مؤقت التركيز، اختر مدة الجلسة وابدأ. تتكيف الخطة مع تقدمك.",
      ja: "今日の学習タスクはここにあります。タスクをタップして集中タイマーを開き、時間を選んで学習を開始しましょう。プランは進捗に合わせて自動更新されます。",
      ko: "오늘의 학습 과제가 여기 있습니다. 과제를 탭해 집중 타이머를 열고 시간을 선택하세요. 플랜은 진도에 맞게 자동으로 업데이트됩니다.",
      'pt-BR': "Suas tarefas de estudo do dia estão aqui. Toque em uma tarefa para abrir o temporizador, escolha uma duração e comece a estudar. O plano se adapta ao seu progresso.",
      'zh-Hans': "今日学习任务在这里。点击任意任务打开专注计时器，选择学习时长开始学习。计划会随着你的进度自动更新。",
      id: "Tugas belajar harianmu ada di sini. Ketuk tugas untuk membuka timer fokus, pilih durasi sesi dan mulai belajar. Rencana diperbarui sesuai kemajuanmu.",
      hi: "आज की पढ़ाई की टास्क यहाँ हैं। किसी टास्क को टैप करके फोकस टाइमर खोलें, सेशन की अवधि चुनें और शुरू करें। प्लान आपकी प्रगति के अनुसार अपडेट होता रहता है।",
    },
  },
  {
    icon: 'calendar-clear-outline',
    titles: {
      en: 'Weekly Calendar',
      tr: 'Haftalık Takvim',
      de: 'Wochenkalender',
      fr: 'Calendrier hebdo',
      ar: 'التقويم الأسبوعي',
      ja: '週間カレンダー',
      ko: '주간 캘린더',
      'pt-BR': 'Calendário semanal',
      'zh-Hans': '每周日历',
      id: 'Kalender Mingguan',
      hi: 'साप्ताहिक कैलेंडर',
    },
    descs: {
      en: "Your full study schedule is here. Completed sessions are marked; upcoming ones are color-coded by subject. Tap any day to see the details.",
      tr: "Tüm çalışma programın burada. Tamamlanan oturumlar işaretlenir, yaklaşan dersler konuya göre renklendirilir. Detay için istediğin güne dokun.",
      de: "Dein vollständiger Lernplan ist hier. Abgeschlossene Sitzungen sind markiert, bevorstehende nach Fach farbig. Tippe auf einen Tag für Details.",
      fr: "Ton programme complet est ici. Les sessions terminées sont marquées, les prochaines colorées par matière. Appuie sur un jour pour voir les détails.",
      ar: "جدولك الدراسي الكامل هنا. الجلسات المنجزة مُعلَّمة، والقادمة مُلوَّنة حسب المادة. اضغط على أي يوم لعرض التفاصيل.",
      ja: "学習スケジュール全体はここにあります。完了した授業はマークされ、今後の授業は科目別に色分けされています。詳細はその日をタップしてください。",
      ko: "전체 학습 일정이 여기 있습니다. 완료된 세션은 표시되고 다가오는 세션은 과목별로 색상이 구분됩니다. 날짜를 탭해 세부 정보를 확인하세요.",
      'pt-BR': "Seu cronograma completo está aqui. Sessões concluídas são marcadas; as próximas são coloridas por matéria. Toque em um dia para ver os detalhes.",
      'zh-Hans': "完整的学习计划在这里。已完成的课程被标记，即将到来的课程按科目颜色区分。点击任意一天查看详情。",
      id: "Jadwal belajar lengkapmu ada di sini. Sesi selesai ditandai; yang akan datang diberi warna per mata pelajaran. Ketuk hari mana saja untuk melihat detailnya.",
      hi: "आपका पूरा स्टडी शेड्यूल यहाँ है। पूरे सेशन मार्क हो जाते हैं; आने वाले सेशन विषय के अनुसार रंगीन होते हैं। किसी भी दिन को टैप करके विवरण देखें।",
    },
  },
  {
    icon: 'stats-chart-outline',
    titles: {
      en: 'Your Progress',
      tr: 'İlerlemen',
      de: 'Dein Fortschritt',
      fr: 'Ta progression',
      ar: 'تقدمك',
      ja: '進捗状況',
      ko: '나의 진행',
      'pt-BR': 'Seu progresso',
      'zh-Hans': '你的进度',
      id: 'Kemajuanmu',
      hi: 'तुम्हारी प्रगति',
    },
    descs: {
      en: "Track weekly study hours and completed sessions. Keep a daily streak to earn badges — they appear here as you hit milestones.",
      tr: "Haftalık çalışma saatlerini ve tamamlanan oturumları takip et. Günlük serileri koru ve kilometre taşlarını geçtikçe rozetler kazan.",
      de: "Verfolge wöchentliche Lernstunden und abgeschlossene Sitzungen. Halte die tägliche Serie aufrecht und verdiene Abzeichen an Meilensteinen.",
      fr: "Suis tes heures d'étude hebdomadaires et tes sessions. Maintiens une série quotidienne et gagne des badges à chaque étape franchie.",
      ar: "تتبع ساعات الدراسة الأسبوعية والجلسات المنجزة. حافظ على السلسلة اليومية واكسب شارات عند الوصول إلى المعالم.",
      ja: "週間学習時間と完了した授業を追跡しましょう。毎日の学習を続けてマイルストーンでバッジを集めましょう。",
      ko: "주간 학습 시간과 완료된 세션을 추적하세요. 매일 꾸준히 학습하여 마일스톤에서 배지를 획득하세요.",
      'pt-BR': "Acompanhe horas semanais de estudo e sessões concluídas. Mantenha uma série diária e ganhe distintivos ao atingir marcos.",
      'zh-Hans': "追踪每周学习时间和完成的课程。保持每日连续学习，在里程碑处获得徽章。",
      id: "Lacak jam belajar mingguan dan sesi yang diselesaikan. Jaga streak harian dan dapatkan lencana saat mencapai tonggak pencapaian.",
      hi: "साप्ताहिक पढ़ाई के घंटे और पूरे सेशन ट्रैक करें। रोज पढ़ाई की स्ट्रीक बनाए रखें और माइलस्टोन पर बैज कमाएं।",
    },
  },
  {
    icon: 'person-outline',
    titles: {
      en: 'Your Profile',
      tr: 'Profilin',
      de: 'Dein Profil',
      fr: 'Ton profil',
      ar: 'ملفك الشخصي',
      ja: 'プロフィール',
      ko: '내 프로필',
      'pt-BR': 'Seu perfil',
      'zh-Hans': '我的资料',
      id: 'Profilmu',
      hi: 'तुम्हारी प्रोफाइल',
    },
    descs: {
      en: "Your exam countdown and weekly hours are here. You can also update your study program settings — change your goal, exam date, or daily intensity anytime.",
      tr: "Sınava kalan gün sayısı ve haftalık saatlerin burada. Hedefini, sınav tarihini veya günlük yoğunluğunu istediğin zaman değiştirmek için program ayarlarını güncelleyebilirsin.",
      de: "Dein Prüfungs-Countdown und wöchentliche Stunden sind hier. Ändere jederzeit dein Ziel, Prüfungsdatum oder tägliche Intensität.",
      fr: "Ton compte à rebours et tes heures hebdomadaires sont ici. Modifie ton objectif, ta date d'examen ou ton intensité quotidienne à tout moment.",
      ar: "العد التنازلي للامتحان وساعاتك الأسبوعية هنا. يمكنك تحديث إعدادات برنامجك في أي وقت.",
      ja: "試験のカウントダウンと週間時間はここにあります。目標、試験日、または日々の強度はいつでも変更できます。",
      ko: "시험 카운트다운과 주간 시간이 여기 있습니다. 목표, 시험 날짜 또는 일일 강도를 언제든지 변경할 수 있습니다.",
      'pt-BR': "Sua contagem regressiva do exame e horas semanais estão aqui. Atualize as configurações do programa a qualquer momento.",
      'zh-Hans': "考试倒计时和每周学习时间在这里。随时可以更新你的目标、考试日期或每日学习强度。",
      id: "Hitung mundur ujian dan jam mingguan ada di sini. Perbarui pengaturan program belajarmu kapan saja.",
      hi: "परीक्षा काउंटडाउन और साप्ताहिक घंटे यहाँ हैं। आप कभी भी अपना लक्ष्य, परीक्षा की तारीख या दैनिक तीव्रता बदल सकते हैं।",
    },
  },
];

export const SKIP_LABELS: Record<SupportedLanguage, string> = {
  en: 'Skip', tr: 'Geç', de: 'Überspringen', fr: 'Passer', ar: 'تخطي',
  ja: 'スキップ', ko: '건너뛰기', 'pt-BR': 'Pular', 'zh-Hans': '跳过', id: 'Lewati', hi: 'छोड़ें',
};
export const NEXT_LABELS: Record<SupportedLanguage, string> = {
  en: 'Next', tr: 'İleri', de: 'Weiter', fr: 'Suivant', ar: 'التالي',
  ja: '次へ', ko: '다음', 'pt-BR': 'Próximo', 'zh-Hans': '下一步', id: 'Lanjut', hi: 'अगला',
};
export const DONE_LABELS: Record<SupportedLanguage, string> = {
  en: "Let's go!", tr: 'Hadi başla!', de: 'Los geht\'s!', fr: "C'est parti!", ar: 'هيا نبدأ!',
  ja: 'さあ始めよう!', ko: '시작하자!', 'pt-BR': 'Vamos lá!', 'zh-Hans': '开始吧!', id: 'Ayo mulai!', hi: 'चलो शुरू करें!',
};
