import { SupportedLanguage } from '@/app/i18n';
import { getLocalizedTaskTitle } from '@/app/i18n/taskContent';
import { PlannedNotification } from '@/app/types/notifications';
import { StudyTask } from '@/app/utils/studyTypes';

type LocalizableCopy = {
  upcomingTitle: string;
  startTitle: string;
  recoveryTitle: string;
  wrapTitle: string;
  weeklyTitle: string;
  upcomingBody: (taskTitle: string, minutesUntil: number, duration: number) => string;
  startBody: (taskTitle: string, duration: number) => string;
  recoveryBody: (subjectLabel: string) => string;
  wrapBody: (remainingTasksCount: number, totalMinutesLeft: number) => string;
  weeklyBody: (sessionCount: number, examType?: string) => string;
};

const COPY: Record<SupportedLanguage, LocalizableCopy> = {
  en: {
    upcomingTitle: 'Upcoming session',
    startTitle: 'Start now',
    recoveryTitle: 'Catch-up option',
    wrapTitle: 'Today is not done yet',
    weeklyTitle: 'This week is ready',
    upcomingBody: (taskTitle, minutesUntil, duration) => `${taskTitle} starts in ${minutesUntil} min. ${duration} min is reserved for this block.`,
    startBody: (taskTitle, duration) => `${taskTitle} is ready now. ${duration} min is set aside for it.`,
    recoveryBody: (subjectLabel) => `${subjectLabel} slipped today. A shorter recovery block can still keep the day on track.`,
    wrapBody: (remainingTasksCount, totalMinutesLeft) => `${remainingTasksCount} task${remainingTasksCount === 1 ? '' : 's'} left. ${totalMinutesLeft} min can still close the day well.`,
    weeklyBody: (sessionCount, examType) => `${sessionCount} sessions are lined up${examType ? ` for ${examType}` : ''}. Review this week and lock in your first block.`,
  },
  tr: {
    upcomingTitle: 'Yaklaşan oturum',
    startTitle: 'Şimdi başla',
    recoveryTitle: 'Telafi fırsatı',
    wrapTitle: 'Bugün henüz bitmedi',
    weeklyTitle: 'Bu haftan hazır',
    upcomingBody: (taskTitle, minutesUntil, duration) => `${taskTitle} ${minutesUntil} dk sonra başlıyor. Bu blok için ${duration} dk ayrıldı.`,
    startBody: (taskTitle, duration) => `${taskTitle} şimdi hazır. Bunun için ${duration} dk ayrıldı.`,
    recoveryBody: (subjectLabel) => `${subjectLabel} bugün geride kaldı. Kısa bir telafi bloğu günü toparlayabilir.`,
    wrapBody: (remainingTasksCount, totalMinutesLeft) => `${remainingTasksCount} görev kaldı. ${totalMinutesLeft} dk ile günü güçlü kapatabilirsin.`,
    weeklyBody: (sessionCount, examType) => `${sessionCount} oturum${examType ? ` ${examType} için` : ''} hazır. Haftayı gözden geçir ve ilk bloğunu sabitle.`,
  },
  de: {
    upcomingTitle: 'Bevorstehende Session',
    startTitle: 'Jetzt starten',
    recoveryTitle: 'Aufholen möglich',
    wrapTitle: 'Der Tag ist noch nicht vorbei',
    weeklyTitle: 'Diese Woche ist bereit',
    upcomingBody: (taskTitle, minutesUntil, duration) => `${taskTitle} startet in ${minutesUntil} Min. ${duration} Min sind dafür reserviert.`,
    startBody: (taskTitle, duration) => `${taskTitle} ist jetzt dran. ${duration} Min sind dafür eingeplant.`,
    recoveryBody: (subjectLabel) => `${subjectLabel} ist heute zurückgefallen. Ein kürzerer Aufholblock kann den Tag noch retten.`,
    wrapBody: (remainingTasksCount, totalMinutesLeft) => `${remainingTasksCount} Aufgaben offen. ${totalMinutesLeft} Min können den Tag noch gut abschließen.`,
    weeklyBody: (sessionCount, examType) => `${sessionCount} Sessions stehen${examType ? ` für ${examType}` : ''} bereit. Geh diese Woche kurz durch und sichere dir den ersten Block.`,
  },
  fr: {
    upcomingTitle: 'Session à venir',
    startTitle: 'Commencer maintenant',
    recoveryTitle: 'Option de rattrapage',
    wrapTitle: 'La journée n est pas finie',
    weeklyTitle: 'Ta semaine est prête',
    upcomingBody: (taskTitle, minutesUntil, duration) => `${taskTitle} commence dans ${minutesUntil} min. ${duration} min sont prévues pour ce bloc.`,
    startBody: (taskTitle, duration) => `${taskTitle} est prêt maintenant. ${duration} min sont prévues pour ce bloc.`,
    recoveryBody: (subjectLabel) => `${subjectLabel} a pris du retard aujourd hui. Un bloc plus court peut encore rattraper la journée.`,
    wrapBody: (remainingTasksCount, totalMinutesLeft) => `Il reste ${remainingTasksCount} tâche${remainingTasksCount === 1 ? '' : 's'}. ${totalMinutesLeft} min peuvent encore bien terminer la journée.`,
    weeklyBody: (sessionCount, examType) => `${sessionCount} sessions sont prêtes${examType ? ` pour ${examType}` : ''}. Passe la semaine en revue et verrouille ton premier bloc.`,
  },
  ja: {
    upcomingTitle: 'まもなく開始',
    startTitle: '今すぐ開始',
    recoveryTitle: 'リカバリー候補',
    wrapTitle: '今日はまだ終わっていません',
    weeklyTitle: '今週の学習が準備できました',
    upcomingBody: (taskTitle, minutesUntil, duration) => `${taskTitle}は${minutesUntil}分後に始まります。このブロックには${duration}分を確保しています。`,
    startBody: (taskTitle, duration) => `${taskTitle}を今始められます。このブロックには${duration}分を確保しています。`,
    recoveryBody: (subjectLabel) => `${subjectLabel}が今日遅れています。短いリカバリーブロックでも立て直せます。`,
    wrapBody: (remainingTasksCount, totalMinutesLeft) => `残り${remainingTasksCount}件です。あと${totalMinutesLeft}分で今日をしっかり締められます。`,
    weeklyBody: (sessionCount, examType) => `${sessionCount}件のセッション${examType ? `（${examType}）` : ''}を用意しました。今週を確認して最初のブロックを確定しましょう。`,
  },
  ko: {
    upcomingTitle: '곧 시작',
    startTitle: '지금 시작',
    recoveryTitle: '보충 기회',
    wrapTitle: '오늘은 아직 끝나지 않았어요',
    weeklyTitle: '이번 주 학습이 준비됐어요',
    upcomingBody: (taskTitle, minutesUntil, duration) => `${taskTitle}이(가) ${minutesUntil}분 후 시작돼요. 이 블록에는 ${duration}분이 잡혀 있어요.`,
    startBody: (taskTitle, duration) => `${taskTitle}을(를) 지금 시작할 수 있어요. 이 블록에는 ${duration}분이 배정돼 있어요.`,
    recoveryBody: (subjectLabel) => `${subjectLabel}이(가) 오늘 밀렸어요. 짧은 보충 블록으로도 흐름을 되찾을 수 있어요.`,
    wrapBody: (remainingTasksCount, totalMinutesLeft) => `${remainingTasksCount}개 과제가 남았어요. ${totalMinutesLeft}분이면 오늘을 잘 마무리할 수 있어요.`,
    weeklyBody: (sessionCount, examType) => `${sessionCount}개 세션${examType ? `(${examType})` : ''}이 준비됐어요. 이번 주를 확인하고 첫 블록을 고정하세요.`,
  },
  'zh-Hans': {
    upcomingTitle: '即将开始',
    startTitle: '现在开始',
    recoveryTitle: '补救方案',
    wrapTitle: '今天还没结束',
    weeklyTitle: '你本周的学习已准备好',
    upcomingBody: (taskTitle, minutesUntil, duration) => `${taskTitle}将在 ${minutesUntil} 分钟后开始。本次学习块已预留 ${duration} 分钟。`,
    startBody: (taskTitle, duration) => `${taskTitle}现在可以开始。本次学习块已预留 ${duration} 分钟。`,
    recoveryBody: (subjectLabel) => `${subjectLabel}今天落后了。一个更短的补救学习块仍然可以把今天拉回来。`,
    wrapBody: (remainingTasksCount, totalMinutesLeft) => `还有 ${remainingTasksCount} 个任务未完成。再投入 ${totalMinutesLeft} 分钟，今天仍然可以收得很好。`,
    weeklyBody: (sessionCount, examType) => `已安排 ${sessionCount} 个学习块${examType ? `，对应 ${examType}` : ''}。先看一下本周安排，再锁定第一个学习块。`,
  },
  ar: {
    upcomingTitle: 'جلسة قادمة',
    startTitle: 'ابدأ الآن',
    recoveryTitle: 'فرصة تعويض',
    wrapTitle: 'اليوم لم ينته بعد',
    weeklyTitle: 'أسبوعك جاهز',
    upcomingBody: (taskTitle, minutesUntil, duration) => `${taskTitle} سيبدأ بعد ${minutesUntil} دقيقة. تم تخصيص ${duration} دقيقة لهذه الجلسة.`,
    startBody: (taskTitle, duration) => `${taskTitle} جاهز الآن. تم تخصيص ${duration} دقيقة لهذه الجلسة.`,
    recoveryBody: (subjectLabel) => `تراجع ${subjectLabel} اليوم. ما زال بإمكان جلسة تعويض قصيرة أن تنقذ اليوم.`,
    wrapBody: (remainingTasksCount, totalMinutesLeft) => `تبقى ${remainingTasksCount} مهمة. ما زال ${totalMinutesLeft} دقيقة كافياً لإنهاء اليوم بشكل جيد.`,
    weeklyBody: (sessionCount, examType) => `تم ترتيب ${sessionCount} جلسة${examType ? ` لـ ${examType}` : ''}. راجع هذا الأسبوع وثبّت أول جلسة لك.`,
  },
  hi: {
    upcomingTitle: 'आगामी सत्र',
    startTitle: 'अभी शुरू करें',
    recoveryTitle: 'कैच-अप विकल्प',
    wrapTitle: 'आज अभी खत्म नहीं हुआ',
    weeklyTitle: 'इस सप्ताह की तैयारी पूरी है',
    upcomingBody: (taskTitle, minutesUntil, duration) => `${taskTitle} ${minutesUntil} मिनट में शुरू होगा। इस ब्लॉक के लिए ${duration} मिनट रखे गए हैं।`,
    startBody: (taskTitle, duration) => `${taskTitle} अभी शुरू किया जा सकता है। इस ब्लॉक के लिए ${duration} मिनट रखे गए हैं।`,
    recoveryBody: (subjectLabel) => `${subjectLabel} आज पीछे रह गया। एक छोटा कैच-अप ब्लॉक दिन को फिर भी संभाल सकता है।`,
    wrapBody: (remainingTasksCount, totalMinutesLeft) => `${remainingTasksCount} कार्य बाकी हैं। ${totalMinutesLeft} मिनट अभी भी दिन को अच्छी तरह पूरा कर सकते हैं।`,
    weeklyBody: (sessionCount, examType) => `${sessionCount} सत्र${examType ? ` ${examType} के लिए` : ''} तैयार हैं। इस सप्ताह को देखो और अपना पहला ब्लॉक तय करो।`,
  },
  id: {
    upcomingTitle: 'Sesi akan datang',
    startTitle: 'Mulai sekarang',
    recoveryTitle: 'Opsi mengejar',
    wrapTitle: 'Hari ini belum selesai',
    weeklyTitle: 'Minggu ini sudah siap',
    upcomingBody: (taskTitle, minutesUntil, duration) => `${taskTitle} dimulai dalam ${minutesUntil} menit. ${duration} menit sudah disiapkan untuk blok ini.`,
    startBody: (taskTitle, duration) => `${taskTitle} siap dimulai sekarang. ${duration} menit sudah dialokasikan untuk blok ini.`,
    recoveryBody: (subjectLabel) => `${subjectLabel} tertinggal hari ini. Blok pemulihan yang lebih singkat masih bisa menjaga hari ini tetap rapi.`,
    wrapBody: (remainingTasksCount, totalMinutesLeft) => `${remainingTasksCount} tugas masih tersisa. ${totalMinutesLeft} menit masih bisa menutup hari ini dengan baik.`,
    weeklyBody: (sessionCount, examType) => `${sessionCount} sesi sudah disusun${examType ? ` untuk ${examType}` : ''}. Tinjau minggu ini dan kunci blok pertamamu.`,
  },
  'pt-BR': {
    upcomingTitle: 'Sessão chegando',
    startTitle: 'Comece agora',
    recoveryTitle: 'Opção de recuperação',
    wrapTitle: 'Seu dia ainda não terminou',
    weeklyTitle: 'Sua semana está pronta',
    upcomingBody: (taskTitle, minutesUntil, duration) => `${taskTitle} começa em ${minutesUntil} min. ${duration} min foram reservados para este bloco.`,
    startBody: (taskTitle, duration) => `${taskTitle} está pronto para começar agora. ${duration} min foram reservados para este bloco.`,
    recoveryBody: (subjectLabel) => `${subjectLabel} ficou para trás hoje. Um bloco curto de recuperação ainda pode salvar o dia.`,
    wrapBody: (remainingTasksCount, totalMinutesLeft) => `${remainingTasksCount} tarefa${remainingTasksCount === 1 ? '' : 's'} restante${remainingTasksCount === 1 ? '' : 's'}. ${totalMinutesLeft} min ainda podem fechar bem o dia.`,
    weeklyBody: (sessionCount, examType) => `${sessionCount} sessões foram alinhadas${examType ? ` para ${examType}` : ''}. Revise a semana e fixe seu primeiro bloco.`,
  },
};

const getCopy = (lang: SupportedLanguage): LocalizableCopy => COPY[lang] ?? COPY.en;

export const buildSessionUpcomingContent = (
  task: StudyTask,
  minutesUntil: number,
  lang: SupportedLanguage,
  examCode?: string | null
): Pick<PlannedNotification, 'title' | 'body'> => {
  const copy = getCopy(lang);
  const taskTitle = getLocalizedTaskTitle(task, lang, examCode);
  return {
    title: copy.upcomingTitle,
    body: copy.upcomingBody(taskTitle, minutesUntil, task.duration),
  };
};

export const buildSessionStartContent = (
  task: StudyTask,
  lang: SupportedLanguage,
  examCode?: string | null
): Pick<PlannedNotification, 'title' | 'body'> => {
  const copy = getCopy(lang);
  const taskTitle = getLocalizedTaskTitle(task, lang, examCode);
  return {
    title: copy.startTitle,
    body: copy.startBody(taskTitle, task.duration),
  };
};

export const buildSessionRecoveryContent = (
  task: StudyTask,
  lang: SupportedLanguage,
  examCode?: string | null
): Pick<PlannedNotification, 'title' | 'body'> => {
  const copy = getCopy(lang);
  const subjectLabel = getLocalizedTaskTitle({ subject: task.subject, type: 'study' }, lang, examCode).split(' · ')[0].split('・')[0];
  return {
    title: copy.recoveryTitle,
    body: copy.recoveryBody(subjectLabel),
  };
};

export const buildDailyWrapContent = (
  remainingTasksCount: number,
  totalMinutesLeft: number,
  lang: SupportedLanguage
): Pick<PlannedNotification, 'title' | 'body'> => {
  const copy = getCopy(lang);
  return {
    title: copy.wrapTitle,
    body: copy.wrapBody(remainingTasksCount, totalMinutesLeft),
  };
};

export const buildWeeklyPlanReadyContent = (
  examType: string | undefined,
  sessionCount: number,
  lang: SupportedLanguage
): Pick<PlannedNotification, 'title' | 'body'> => {
  const copy = getCopy(lang);
  return {
    title: copy.weeklyTitle,
    body: copy.weeklyBody(sessionCount, examType),
  };
};
