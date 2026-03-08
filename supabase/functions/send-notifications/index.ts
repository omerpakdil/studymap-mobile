import { createClient } from 'npm:@supabase/supabase-js@2.84.0';

type RemoteType = 'weekly_plan_ready' | 'referral_reward' | 'trial_ending' | 'streak_risk';
const REMOTE_TYPES: RemoteType[] = ['weekly_plan_ready', 'referral_reward', 'trial_ending', 'streak_risk'];

type Candidate = {
  user_id: string;
  expo_push_token: string;
  locale?: string | null;
  title: string;
  body: string;
  type: RemoteType;
  payload: Record<string, unknown>;
};

type FunctionRequestBody = {
  types?: RemoteType[];
};

type PushTokenRow = {
  user_id: string;
  expo_push_token: string;
  locale?: string | null;
  timezone?: string | null;
  is_active: boolean;
};

type PreferenceRow = {
  user_id: string;
  study_reminders: boolean;
  plan_summaries: boolean;
  progress_nudges: boolean;
  premium_updates: boolean;
  referral_updates: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  weekly_plan_day?: number | null;
  weekly_plan_time?: string | null;
  timezone?: string | null;
};

type StateRow = {
  user_id: string;
  locale?: string | null;
  study_streak: number;
  plan_updated_at?: string | null;
  last_opened_at?: string | null;
  last_study_session_at?: string | null;
};

type UserRow = {
  user_id: string;
  referral_extension_end_date?: string | null;
};

type ReferralRow = {
  referrer_user_id: string;
  subscribed_at?: string | null;
  status: string;
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const COPY: Record<string, Record<RemoteType, { title: string; body: (ctx: Record<string, unknown>) => string }>> = {
  en: {
    weekly_plan_ready: {
      title: 'This week is ready',
      body: () => 'Your refreshed schedule for this week is ready. Open StudyMap and lock in your first block.',
    },
    referral_reward: {
      title: 'Referral reward unlocked',
      body: ctx => `A friend subscribed. You earned ${ctx.days_earned ?? 7} extra premium days.`,
    },
    trial_ending: {
      title: 'Your premium trial is ending',
      body: ctx => `Your trial ends in about ${ctx.days_left ?? 1} day. Keep your plan adaptive without interruption.`,
    },
    streak_risk: {
      title: 'Protect your streak',
      body: ctx => `You are on a ${ctx.study_streak ?? 0}-day streak. One short session keeps it alive today.`,
    },
  },
  tr: {
    weekly_plan_ready: {
      title: 'Bu haftan hazir',
      body: () => 'Bu hafta icin yenilenen programin hazir. StudyMapi ac ve ilk blogu netlestir.',
    },
    referral_reward: {
      title: 'Davet ödülü geldi',
      body: ctx => `Bir arkadaşın abone oldu. ${ctx.days_earned ?? 7} gün ekstra premium kazandın.`,
    },
    trial_ending: {
      title: 'Premium denemen bitiyor',
      body: ctx => `Denemen yaklaşık ${ctx.days_left ?? 1} gün içinde bitiyor. Adaptif planını kesintisiz sürdür.`,
    },
    streak_risk: {
      title: 'Serini koru',
      body: ctx => `${ctx.study_streak ?? 0} günlük seridesin. Bugün kısa bir oturum seriyi korur.`,
    },
  },
  de: {
    weekly_plan_ready: {
      title: 'Diese Woche ist bereit',
      body: () => 'Dein aktualisierter Plan fuer diese Woche ist bereit. Oeffne StudyMap und starte mit dem ersten Block.',
    },
    referral_reward: {
      title: 'Empfehlungsbonus freigeschaltet',
      body: ctx => `Ein Freund hat abonniert. Du hast ${ctx.days_earned ?? 7} extra Premium-Tage erhalten.`,
    },
    trial_ending: {
      title: 'Deine Premium-Testphase endet',
      body: ctx => `Deine Testphase endet in etwa ${ctx.days_left ?? 1} Tag(en). Halte deinen adaptiven Plan ohne Unterbrechung aktiv.`,
    },
    streak_risk: {
      title: 'Schuetze deine Serie',
      body: ctx => `Du hast aktuell eine ${ctx.study_streak ?? 0}-Tage-Serie. Eine kurze Session heute haelt sie am Leben.`,
    },
  },
  fr: {
    weekly_plan_ready: {
      title: 'Cette semaine est prete',
      body: () => 'Ton planning mis a jour pour cette semaine est pret. Ouvre StudyMap et verrouille ton premier bloc.',
    },
    referral_reward: {
      title: 'Recompense de parrainage debloquee',
      body: ctx => `Un ami s est abonne. Tu as gagne ${ctx.days_earned ?? 7} jours Premium supplementaires.`,
    },
    trial_ending: {
      title: 'Ton essai Premium se termine',
      body: ctx => `Ton essai se termine dans environ ${ctx.days_left ?? 1} jour(s). Garde ton plan adaptatif sans interruption.`,
    },
    streak_risk: {
      title: 'Protege ta serie',
      body: ctx => `Tu es sur une serie de ${ctx.study_streak ?? 0} jours. Une courte session aujourd hui suffit pour la conserver.`,
    },
  },
  ja: {
    weekly_plan_ready: {
      title: '今週の学習が準備できました',
      body: () => '今週分として更新されたスケジュールが準備できました。StudyMap を開いて最初のブロックを確定しましょう。',
    },
    referral_reward: {
      title: '紹介特典を獲得しました',
      body: ctx => `友達が登録しました。Premium をあと ${ctx.days_earned ?? 7} 日分獲得しました。`,
    },
    trial_ending: {
      title: 'Premium トライアルが終了します',
      body: ctx => `トライアルはあと約 ${ctx.days_left ?? 1} 日で終了します。適応型プランを途切れさせずに続けましょう。`,
    },
    streak_risk: {
      title: '連続記録を守りましょう',
      body: ctx => `現在 ${ctx.study_streak ?? 0} 日連続です。今日は短いセッション1回で継続できます。`,
    },
  },
  ko: {
    weekly_plan_ready: {
      title: '이번 주 학습이 준비됐어요',
      body: () => '이번 주 기준으로 갱신된 일정이 준비됐습니다. StudyMap을 열고 첫 블록을 확정하세요.',
    },
    referral_reward: {
      title: '추천 보상이 지급됐어요',
      body: ctx => `친구가 구독했습니다. Premium ${ctx.days_earned ?? 7}일이 추가되었어요.`,
    },
    trial_ending: {
      title: 'Premium 체험이 곧 종료돼요',
      body: ctx => `체험은 약 ${ctx.days_left ?? 1}일 후 종료됩니다. 적응형 플랜을 끊기지 않게 유지하세요.`,
    },
    streak_risk: {
      title: '연속 기록을 지키세요',
      body: ctx => `현재 ${ctx.study_streak ?? 0}일 연속 학습 중입니다. 오늘 짧은 세션 하나면 이어갈 수 있어요.`,
    },
  },
  'zh-Hans': {
    weekly_plan_ready: {
      title: '你本周的学习已准备好',
      body: () => '本周更新后的学习安排已经生成。打开 StudyMap，先锁定你的第一个学习时段。',
    },
    referral_reward: {
      title: '邀请奖励已到账',
      body: ctx => `有朋友完成订阅。你获得了额外 ${ctx.days_earned ?? 7} 天 Premium。`,
    },
    trial_ending: {
      title: '你的 Premium 试用即将结束',
      body: ctx => `试用将在约 ${ctx.days_left ?? 1} 天后结束。保持你的自适应计划不中断。`,
    },
    streak_risk: {
      title: '保持你的连续学习',
      body: ctx => `你已经连续学习 ${ctx.study_streak ?? 0} 天。今天只要完成一个短时段就能继续保持。`,
    },
  },
  ar: {
    weekly_plan_ready: {
      title: 'هذا الأسبوع جاهز',
      body: () => 'تم تحديث جدولك لهذا الأسبوع. افتح StudyMap وثبت أول جلسة الآن.',
    },
    referral_reward: {
      title: 'تم فتح مكافأة الدعوة',
      body: ctx => `أحد أصدقائك اشترك. حصلت على ${ctx.days_earned ?? 7} أيام Premium إضافية.`,
    },
    trial_ending: {
      title: 'تجربتك Premium توشك على الانتهاء',
      body: ctx => `ستنتهي التجربة خلال حوالي ${ctx.days_left ?? 1} يوم. حافظ على خطتك التكيفية دون انقطاع.`,
    },
    streak_risk: {
      title: 'حافظ على سلسلتك',
      body: ctx => `لديك سلسلة دراسة لمدة ${ctx.study_streak ?? 0} يوم. جلسة قصيرة اليوم تكفي للحفاظ عليها.`,
    },
  },
  hi: {
    weekly_plan_ready: {
      title: 'इस सप्ताह की तैयारी पूरी है',
      body: () => 'इस सप्ताह के लिए अपडेट किया गया शेड्यूल तैयार है। StudyMap खोलो और पहला ब्लॉक तय करो।',
    },
    referral_reward: {
      title: 'रेफरल रिवॉर्ड अनलॉक हुआ',
      body: ctx => `तुम्हारे एक दोस्त ने सब्सक्राइब किया। तुम्हें ${ctx.days_earned ?? 7} अतिरिक्त Premium दिन मिले।`,
    },
    trial_ending: {
      title: 'तुम्हारा Premium ट्रायल समाप्त होने वाला है',
      body: ctx => `तुम्हारा ट्रायल लगभग ${ctx.days_left ?? 1} दिन में खत्म होगा। अपना adaptive plan बिना रुकावट जारी रखो।`,
    },
    streak_risk: {
      title: 'अपनी streak बचाओ',
      body: ctx => `तुम ${ctx.study_streak ?? 0} दिन की streak पर हो। आज एक छोटी session इसे जारी रखेगी।`,
    },
  },
  id: {
    weekly_plan_ready: {
      title: 'Minggu ini sudah siap',
      body: () => 'Jadwalmu yang diperbarui untuk minggu ini sudah siap. Buka StudyMap dan kunci blok pertamamu.',
    },
    referral_reward: {
      title: 'Reward referral terbuka',
      body: ctx => `Seorang teman berlangganan. Kamu mendapat tambahan ${ctx.days_earned ?? 7} hari Premium.`,
    },
    trial_ending: {
      title: 'Masa trial Premium-mu akan berakhir',
      body: ctx => `Trial akan berakhir dalam sekitar ${ctx.days_left ?? 1} hari. Jaga rencana adaptifmu tetap berjalan tanpa jeda.`,
    },
    streak_risk: {
      title: 'Jaga streak-mu',
      body: ctx => `Kamu sedang berada di streak ${ctx.study_streak ?? 0} hari. Satu sesi singkat hari ini akan menjaganya.`,
    },
  },
  'pt-BR': {
    weekly_plan_ready: {
      title: 'Sua semana esta pronta',
      body: () => 'Sua agenda atualizada para esta semana esta pronta. Abra o StudyMap e defina seu primeiro bloco.',
    },
    referral_reward: {
      title: 'Recompensa de indicacao liberada',
      body: ctx => `Um amigo assinou. Voce ganhou mais ${ctx.days_earned ?? 7} dias de Premium.`,
    },
    trial_ending: {
      title: 'Seu teste Premium esta terminando',
      body: ctx => `Seu teste termina em cerca de ${ctx.days_left ?? 1} dia(s). Mantenha seu plano adaptativo sem interrupcao.`,
    },
    streak_risk: {
      title: 'Proteja sua sequencia',
      body: ctx => `Voce esta em uma sequencia de ${ctx.study_streak ?? 0} dias. Uma sessao curta hoje mantem tudo vivo.`,
    },
  },
};

const resolveLocale = (raw?: string | null): string => {
  if (!raw) return 'en';
  const value = raw.toLowerCase();
  if (value.startsWith('tr')) return 'tr';
  if (value.startsWith('de')) return 'de';
  if (value.startsWith('fr')) return 'fr';
  if (value.startsWith('ja')) return 'ja';
  if (value.startsWith('ko')) return 'ko';
  if (value.startsWith('zh')) return 'zh-Hans';
  if (value.startsWith('ar')) return 'ar';
  if (value.startsWith('hi')) return 'hi';
  if (value.startsWith('id')) return 'id';
  if (value.startsWith('pt')) return 'pt-BR';
  return 'en';
};

const parseClockTime = (value?: string | null): { hour: number; minute: number } => {
  const [hour, minute] = String(value ?? '00:00').split(':').map(Number);
  return {
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
};

const getLocalMinutesForTimezone = (date: Date, timezone?: string | null): number | null => {
  if (!timezone) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const hour = Number(parts.find(part => part.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find(part => part.type === 'minute')?.value ?? '0');
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return hour * 60 + minute;
  } catch {
    return null;
  }
};

const getLocalWeekdayForTimezone = (date: Date, timezone?: string | null): number | null => {
  if (!timezone) return null;
  try {
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    }).format(date);
    const map: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return map[weekday] ?? null;
  } catch {
    return null;
  }
};

const isWithinMinuteWindow = (
  localMinutes: number | null,
  startClock: string,
  endClock: string
): boolean => {
  if (localMinutes === null) return true;
  const start = parseClockTime(startClock);
  const end = parseClockTime(endClock);
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;
  return localMinutes >= startMinutes && localMinutes <= endMinutes;
};

const isWithinQuietHours = (
  localMinutes: number,
  quietStart?: string | null,
  quietEnd?: string | null
): boolean => {
  const start = parseClockTime(quietStart ?? '22:00');
  const end = parseClockTime(quietEnd ?? '08:00');
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;

  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) {
    return localMinutes >= startMinutes && localMinutes < endMinutes;
  }
  return localMinutes >= startMinutes || localMinutes < endMinutes;
};

const canSendRemoteNow = (
  tokenRow: PushTokenRow,
  preferenceRow: PreferenceRow,
  now: Date
): boolean => {
  const timezone = preferenceRow.timezone ?? tokenRow.timezone;
  const localMinutes = getLocalMinutesForTimezone(now, timezone);
  if (localMinutes === null) return true;
  return !isWithinQuietHours(localMinutes, preferenceRow.quiet_hours_start, preferenceRow.quiet_hours_end);
};

const canSendInWindow = (
  tokenRow: PushTokenRow,
  preferenceRow: PreferenceRow,
  now: Date,
  startClock: string,
  endClock: string
): boolean => {
  const timezone = preferenceRow.timezone ?? tokenRow.timezone;
  const localMinutes = getLocalMinutesForTimezone(now, timezone);
  return isWithinMinuteWindow(localMinutes, startClock, endClock);
};

const isPreferredWeeklyMoment = (
  tokenRow: PushTokenRow,
  preferenceRow: PreferenceRow,
  now: Date
): boolean => {
  const timezone = preferenceRow.timezone ?? tokenRow.timezone;
  const localWeekday = getLocalWeekdayForTimezone(now, timezone);
  const preferredWeekday = typeof preferenceRow.weekly_plan_day === 'number' ? preferenceRow.weekly_plan_day : 1;
  if (localWeekday !== null && localWeekday !== preferredWeekday) return false;

  const targetClock = preferenceRow.weekly_plan_time ?? '18:30';
  const { hour, minute } = parseClockTime(targetClock);
  const startMinutes = Math.max(0, hour * 60 + minute - 90);
  const endMinutes = Math.min(23 * 60 + 59, hour * 60 + minute + 90);
  const startClock = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`;
  const endClock = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
  return canSendInWindow(tokenRow, preferenceRow, now, startClock, endClock);
};

const buildCopy = (type: RemoteType, locale?: string | null, ctx: Record<string, unknown> = {}) => {
  const key = resolveLocale(locale);
  const dict = COPY[key] ?? COPY.en;
  return {
    title: dict[type].title,
    body: dict[type].body(ctx),
  };
};

const hasRecentEvent = async (
  userId: string,
  type: RemoteType,
  sinceIso: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('notification_events')
    .select('id')
    .eq('user_id', userId)
    .eq('notification_type', type)
    .in('notification_status', ['sent', 'delivered', 'opened'])
    .gte('created_at', sinceIso)
    .limit(1);

  if (error) throw error;
  return (data?.length ?? 0) > 0;
};

const loadActiveTokens = async (): Promise<Map<string, PushTokenRow>> => {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('user_id, expo_push_token, locale, timezone, is_active')
    .eq('is_active', true);
  if (error) throw error;
  return new Map(((data ?? []) as PushTokenRow[]).map(row => [row.user_id, row]));
};

const loadPreferences = async (): Promise<Map<string, PreferenceRow>> => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('user_id, study_reminders, plan_summaries, progress_nudges, premium_updates, referral_updates, quiet_hours_start, quiet_hours_end, weekly_plan_day, weekly_plan_time, timezone');
  if (error) throw error;
  return new Map(((data ?? []) as PreferenceRow[]).map(row => [row.user_id, row]));
};

const loadNotificationState = async (): Promise<Map<string, StateRow>> => {
  const { data, error } = await supabase
    .from('notification_state')
    .select('user_id, locale, study_streak, plan_updated_at, last_opened_at, last_study_session_at');
  if (error) throw error;
  return new Map(((data ?? []) as StateRow[]).map(row => [row.user_id, row]));
};

const getTrialEndingCandidates = async (): Promise<Candidate[]> => {
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
  const sinceIso = new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString();

  const [tokens, preferences] = await Promise.all([loadActiveTokens(), loadPreferences()]);
  const { data, error } = await supabase
    .from('users')
    .select('user_id, referral_extension_end_date')
    .not('referral_extension_end_date', 'is', null)
    .lte('referral_extension_end_date', in48h)
    .gte('referral_extension_end_date', now.toISOString());

  if (error) throw error;

  const candidates: Candidate[] = [];
  for (const row of (data as UserRow[]) ?? []) {
    const tokenRow = tokens.get(row.user_id);
    const prefRow = preferences.get(row.user_id);
    if (!tokenRow?.is_active || !prefRow?.premium_updates) continue;
    if (!canSendRemoteNow(tokenRow, prefRow, now)) continue;
    if (!canSendInWindow(tokenRow, prefRow, now, '11:00', '19:30')) continue;
    if (await hasRecentEvent(row.user_id, 'trial_ending', sinceIso)) continue;
    const end = new Date(row.referral_extension_end_date as string);
    const daysLeft = Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 86400000));
    if (daysLeft > 2) continue;
    const copy = buildCopy('trial_ending', tokenRow?.locale, { days_left: daysLeft });
    candidates.push({
      user_id: row.user_id,
      expo_push_token: tokenRow.expo_push_token,
      locale: tokenRow?.locale,
      title: copy.title,
      body: copy.body,
      type: 'trial_ending',
      payload: { days_left: daysLeft },
    });
  }

  return candidates;
};

const getReferralRewardCandidates = async (): Promise<Candidate[]> => {
  const now = new Date();
  const sinceIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [tokens, preferences] = await Promise.all([loadActiveTokens(), loadPreferences()]);
  const { data, error } = await supabase
    .from('referrals')
    .select('referrer_user_id, subscribed_at, status')
    .eq('status', 'subscribed');

  if (error) throw error;

  const candidates: Candidate[] = [];
  for (const row of (data as ReferralRow[]) ?? []) {
    const userId = row.referrer_user_id as string;
    const tokenRow = tokens.get(userId);
    const prefRow = preferences.get(userId);
    if (!tokenRow?.is_active || !prefRow?.referral_updates) continue;
    if (!canSendRemoteNow(tokenRow, prefRow, now)) continue;
    if (!canSendInWindow(tokenRow, prefRow, now, '10:00', '20:00')) continue;
    if (await hasRecentEvent(userId, 'referral_reward', sinceIso)) continue;
    if (!row.subscribed_at) continue;
    const subscribedAt = new Date(row.subscribed_at);
    const ageMs = now.getTime() - subscribedAt.getTime();
    if (ageMs < 0 || ageMs > 7 * 24 * 60 * 60 * 1000) continue;
    const copy = buildCopy('referral_reward', tokenRow.locale, { days_earned: 7 });
    candidates.push({
      user_id: userId,
      expo_push_token: tokenRow.expo_push_token,
      locale: tokenRow.locale,
      title: copy.title,
      body: copy.body,
      type: 'referral_reward',
      payload: { days_earned: 7, subscribed_at: row.subscribed_at },
    });
  }

  return candidates;
};

const getWeeklyPlanReadyCandidates = async (): Promise<Candidate[]> => {
  const now = new Date();
  const sincePlanIso = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
  const inactiveSince = new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString();
  const recentEventSince = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();

  const [tokens, preferences, state] = await Promise.all([
    loadActiveTokens(),
    loadPreferences(),
    loadNotificationState(),
  ]);

  const candidates: Candidate[] = [];
  for (const row of state.values()) {
    if (!row.plan_updated_at || row.plan_updated_at < sincePlanIso) continue;
    if (!row.last_opened_at || row.last_opened_at >= inactiveSince) continue;
    const tokenRow = tokens.get(row.user_id);
    const prefRow = preferences.get(row.user_id);
    if (!tokenRow?.is_active || !prefRow?.plan_summaries) continue;
    if (!canSendRemoteNow(tokenRow, prefRow, now)) continue;
    if (!isPreferredWeeklyMoment(tokenRow, prefRow, now)) continue;
    if (await hasRecentEvent(row.user_id, 'weekly_plan_ready', recentEventSince)) continue;
    const copy = buildCopy('weekly_plan_ready', tokenRow?.locale ?? row.locale);
    candidates.push({
      user_id: row.user_id,
      expo_push_token: tokenRow.expo_push_token,
      locale: tokenRow?.locale ?? row.locale,
      title: copy.title,
      body: copy.body,
      type: 'weekly_plan_ready',
      payload: { plan_updated_at: row.plan_updated_at },
    });
  }

  return candidates;
};

const getStreakRiskCandidates = async (): Promise<Candidate[]> => {
  const now = new Date();
  const inactiveSessionSince = new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString();
  const staleSessionCutoff = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const inactiveOpenSince = new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString();
  const recentEventSince = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();

  const [tokens, preferences, state] = await Promise.all([
    loadActiveTokens(),
    loadPreferences(),
    loadNotificationState(),
  ]);

  const candidates: Candidate[] = [];
  for (const row of state.values()) {
    if (row.study_streak < 2) continue;
    if (!row.last_study_session_at || row.last_study_session_at >= inactiveSessionSince) continue;
    if (row.last_study_session_at < staleSessionCutoff) continue;
    if (!row.last_opened_at || row.last_opened_at >= inactiveOpenSince) continue;
    const tokenRow = tokens.get(row.user_id);
    const prefRow = preferences.get(row.user_id);
    if (!tokenRow?.is_active || !prefRow?.progress_nudges) continue;
    if (!canSendRemoteNow(tokenRow, prefRow, now)) continue;
    if (!canSendInWindow(tokenRow, prefRow, now, '16:00', '20:30')) continue;
    if (await hasRecentEvent(row.user_id, 'streak_risk', recentEventSince)) continue;
    const copy = buildCopy('streak_risk', tokenRow?.locale ?? row.locale, { study_streak: row.study_streak });
    candidates.push({
      user_id: row.user_id,
      expo_push_token: tokenRow.expo_push_token,
      locale: tokenRow?.locale ?? row.locale,
      title: copy.title,
      body: copy.body,
      type: 'streak_risk',
      payload: { study_streak: row.study_streak },
    });
  }

  return candidates;
};

const logEvent = async (
  candidate: Candidate,
  status: 'sent' | 'failed',
  extra: Record<string, unknown> = {}
) => {
  await supabase.from('notification_events').insert({
    user_id: candidate.user_id,
    notification_type: candidate.type,
    notification_channel: 'remote',
    notification_status: status,
    title: candidate.title,
    body: candidate.body,
    payload: { ...candidate.payload, ...extra },
  });
};

const sendExpoPush = async (candidate: Candidate) => {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      to: candidate.expo_push_token,
      title: candidate.title,
      body: candidate.body,
      sound: 'default',
      data: {
        notificationType: candidate.type,
        notificationChannel: 'remote',
        ...candidate.payload,
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(payload));
  }

  return payload;
};

const getCandidatesForType = async (type: RemoteType): Promise<Candidate[]> => {
  switch (type) {
    case 'trial_ending':
      return getTrialEndingCandidates();
    case 'referral_reward':
      return getReferralRewardCandidates();
    case 'weekly_plan_ready':
      return getWeeklyPlanReadyCandidates();
    case 'streak_risk':
      return getStreakRiskCandidates();
  }

  const exhaustiveCheck: never = type;
  throw new Error(`Unsupported remote notification type: ${exhaustiveCheck}`);
};

Deno.serve(async (req: Request) => {
  try {
    const body: FunctionRequestBody = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const requestedTypes = Array.isArray(body?.types)
      ? body.types.filter((value): value is RemoteType => REMOTE_TYPES.includes(value))
      : REMOTE_TYPES;

    const results: Record<string, { candidates: number; sent: number; failed: number }> = {};

    for (const type of requestedTypes) {
      const candidates = await getCandidatesForType(type);
      let sent = 0;
      let failed = 0;

      for (const candidate of candidates) {
        try {
          const expoResult = await sendExpoPush(candidate);
          await logEvent(candidate, 'sent', { expo_result: expoResult });
          sent += 1;
        } catch (error) {
          await logEvent(candidate, 'failed', { error: String(error) });
          failed += 1;
        }
      }

      results[type] = {
        candidates: candidates.length,
        sent,
        failed,
      };
    }

    return new Response(JSON.stringify({ ok: true, results }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: String(error) }, null, 2),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
