import dayjs from 'dayjs';
import { checkDay } from './workingDays';

// Day status rules, matching the web portal's attendance calendar:
// - a record uses the server status (on_leave / absent / holiday), then late,
//   early check-out, half day, otherwise present
// - no record: holiday -> holiday, day off under the holiday calendar's
//   weekly-off rules -> weekly_off (the portal's attendance page assumes
//   Saturday and Sunday), past working day -> absent, today/future -> none
// Days before the joining date have no status (the portal counts them as absent).
// Extra on mobile: a past day with a check-in but no check-out is flagged
// 'missed_punch_out' (only when the organisation requires check-out) so the
// employee can raise a work hour request for it.

export const DAY_STATUS = {
  present: { label: 'Present', tone: 'success' },
  late: { label: 'Late', tone: 'warning' },
  early_checkout: { label: 'Early out', tone: 'warning' },
  half_day: { label: 'Half day', tone: 'info' },
  on_leave: { label: 'On leave', tone: 'info' },
  holiday: { label: 'Holiday', tone: 'info' },
  weekly_off: { label: 'Weekend', tone: 'neutral' },
  absent: { label: 'Absent', tone: 'danger' },
  missed_punch_out: { label: 'Missed punch-out', tone: 'danger' },
};

export const dateKey = d => dayjs(d).format('YYYY-MM-DD');

export const getDayStatus = ({
  date,
  record,
  holidays = [],
  weeklyOffRules = [],
  requireCheckout = true,
  joinedOn,
}) => {
  const d = dayjs(date);
  const today = dayjs();
  // Days before the employee joined are not attendance days
  if (!record && joinedOn && d.isBefore(dayjs(joinedOn), 'day')) return null;
  if (record) {
    const st = record.status;
    if (st === 'on_leave' || st === 'absent' || st === 'holiday') return st;
    if (
      requireCheckout &&
      record.checkInTime &&
      !record.checkOutTime &&
      d.isBefore(today, 'day')
    )
      return 'missed_punch_out';
    if (record.isLate) return 'late';
    if (record.isEarlyDeparture) return 'early_checkout';
    if (st === 'half_day') return 'half_day';
    return 'present';
  }
  const off = checkDay(d, holidays, weeklyOffRules);
  if (off.holiday) return 'holiday';
  if (!off.isWorking) return 'weekly_off';
  if (!d.isBefore(today, 'day')) return null;
  return 'absent';
};
