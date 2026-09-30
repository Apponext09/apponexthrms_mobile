import dayjs from 'dayjs';
import { pick } from './normalize';

// Working-day rules shared by Leave and Attendance, ported from the portal's
// leave form (isWeekendOrHoliday):
// 1. A holiday on that date is a day off. Optional holidays only count once
//    the employee has selected them (the portal treats every optional holiday
//    as off, even when not selected).
// 2. Weekly-off rules from the holiday calendar: a matching weekday is off,
//    or only its alternate weeks (default 2nd and 4th), and "half" rules make
//    it a half working day.
// 3. With no rules configured, Sunday is off.

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const parseWeeks = raw => {
  if (Array.isArray(raw)) return raw.map(Number).filter(n => !isNaN(n));
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return parsed.map(Number).filter(n => !isNaN(n));
    } catch {
      // comma separated
    }
    return raw
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => !isNaN(n));
  }
  return [];
};

export const normalizeWeeklyOffRule = r => ({
  weekDay: String(
    pick(r, 'weekDay', 'week_day', 'dayOfWeek', 'day_of_week', 'day') || '',
  )
    .trim()
    .toLowerCase(),
  isHalf: String(pick(r, 'offType', 'off_type') || 'Full Day')
    .toLowerCase()
    .includes('half'),
  isAlternate: Boolean(pick(r, 'isAlternate', 'is_alternate')),
  weeks: parseWeeks(pick(r, 'alternateWeeks', 'alternate_weeks')),
});

// holidays: normalized holidays ({ date, name, type, isOptional, selected })
// rules: normalized weekly-off rules
// Returns { isWorking, isHalfDay, reason }
export const checkDay = (date, holidays = [], rules = []) => {
  const d = dayjs(date);
  const key = d.format('YYYY-MM-DD');

  const holiday = holidays.find(
    h =>
      h.date &&
      dayjs(h.date).format('YYYY-MM-DD') === key &&
      (!h.isOptional || h.selected),
  );
  if (holiday) {
    return {
      isWorking: false,
      isHalfDay: false,
      reason: `${holiday.name} (holiday)`,
      holiday,
    };
  }

  const name = DAY_NAMES[d.day()];
  if (rules.length) {
    const rule = rules.find(
      r =>
        r.weekDay &&
        (r.weekDay === name ||
          (r.weekDay.length >= 3 && name.startsWith(r.weekDay))),
    );
    if (rule) {
      const label = name.charAt(0).toUpperCase() + name.slice(1);
      if (rule.isAlternate) {
        const weeks = rule.weeks.length ? rule.weeks : [2, 4];
        const weekNo = Math.ceil(d.date() / 7);
        if (!weeks.includes(weekNo))
          return { isWorking: true, isHalfDay: false, reason: '' };
      }
      return rule.isHalf
        ? {
            isWorking: true,
            isHalfDay: true,
            reason: `${label} (half-day weekend)`,
          }
        : { isWorking: false, isHalfDay: false, reason: `${label} (weekend)` };
    }
    return { isWorking: true, isHalfDay: false, reason: '' };
  }

  if (d.day() === 0)
    return { isWorking: false, isHalfDay: false, reason: 'Sunday (weekend)' };
  return { isWorking: true, isHalfDay: false, reason: '' };
};
