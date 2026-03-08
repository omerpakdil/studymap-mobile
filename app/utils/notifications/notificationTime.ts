import { StudyTask } from '@/app/utils/studyTypes';

const SLOT_START_TIMES: Record<string, string> = {
  early_morning: '06:30',
  morning: '09:30',
  afternoon: '14:00',
  evening: '18:30',
  night: '21:00',
};

const SLOT_END_TIMES: Record<string, string> = {
  early_morning: '09:00',
  morning: '12:00',
  afternoon: '17:00',
  evening: '21:00',
  night: '23:30',
};

const pad = (value: number): string => String(value).padStart(2, '0');

export const getTimeBucketForClock = (clock: string): string => {
  const { hour } = parseClockTime(clock);
  if (hour < 9) return 'early_morning';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
};

export const parseClockTime = (value: string): { hour: number; minute: number } => {
  const [hour, minute] = value.split(':').map(Number);
  return {
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
};

export const applyClockTime = (base: Date, clock: string): Date => {
  const next = new Date(base);
  const { hour, minute } = parseClockTime(clock);
  next.setHours(hour, minute, 0, 0);
  return next;
};

export const getTaskSlotStartTime = (task: Pick<StudyTask, 'timeSlot'>): string => {
  const normalized = task.timeSlot?.toLowerCase?.() ?? '';
  if (SLOT_START_TIMES[normalized]) return SLOT_START_TIMES[normalized];

  const explicit = normalized.match(/^(\d{1,2}):(\d{2})/);
  if (explicit) return `${pad(Number(explicit[1]))}:${explicit[2]}`;

  return SLOT_START_TIMES.morning;
};

export const getTaskSlotEndTime = (task: Pick<StudyTask, 'timeSlot'>): string => {
  const normalized = task.timeSlot?.toLowerCase?.() ?? '';
  if (SLOT_END_TIMES[normalized]) return SLOT_END_TIMES[normalized];
  return SLOT_END_TIMES.morning;
};

export const getTaskStartDate = (task: Pick<StudyTask, 'date' | 'timeSlot'>): Date => {
  const base = new Date(`${task.date}T00:00:00`);
  return applyClockTime(base, getTaskSlotStartTime(task));
};

export const getTaskStartDateForNotifications = (
  task: Pick<StudyTask, 'date' | 'timeSlot'>,
  preferredStudyTime?: string
): Date => {
  const base = new Date(`${task.date}T00:00:00`);
  const normalized = task.timeSlot?.toLowerCase?.() ?? '';

  if (preferredStudyTime && normalized && SLOT_START_TIMES[normalized]) {
    if (getTimeBucketForClock(preferredStudyTime) === normalized) {
      return applyClockTime(base, preferredStudyTime);
    }
  }

  return applyClockTime(base, getTaskSlotStartTime(task));
};

export const minutesBetween = (a: Date, b: Date): number =>
  Math.round((b.getTime() - a.getTime()) / 60000);

export const addMinutes = (base: Date, minutes: number): Date =>
  new Date(base.getTime() + minutes * 60000);

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const isWithinQuietHours = (
  candidate: Date,
  quietStart: string,
  quietEnd: string
): boolean => {
  const start = parseClockTime(quietStart);
  const end = parseClockTime(quietEnd);
  const minutes = candidate.getHours() * 60 + candidate.getMinutes();
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;

  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) {
    return minutes >= startMinutes && minutes < endMinutes;
  }
  return minutes >= startMinutes || minutes < endMinutes;
};

export const nextAllowedDate = (
  candidate: Date,
  quietStart: string,
  quietEnd: string
): Date => {
  if (!isWithinQuietHours(candidate, quietStart, quietEnd)) return candidate;

  const next = new Date(candidate);
  const { hour, minute } = parseClockTime(quietEnd);
  const candidateMinutes = candidate.getHours() * 60 + candidate.getMinutes();
  const endMinutes = hour * 60 + minute;

  if (candidateMinutes >= endMinutes) {
    next.setDate(next.getDate() + 1);
  }

  next.setHours(hour, minute, 0, 0);
  return next;
};
