import { checkDay, normalizeWeeklyOffRule } from '@/utils/workingDays';
import { getDayStatus } from '@/utils/attendanceDay';

// Shapes as returned by GET /leaves/calendar
const sundayOff = [
  normalizeWeeklyOffRule({
    weekDay: 'Sun',
    offType: 'Full Day',
    isAlternate: 0,
  }),
];
const gandhiJayanti = {
  date: '2026-10-02',
  name: 'Mahatma Gandhi Jayanti',
  isOptional: false,
};

describe('checkDay', () => {
  test('holiday and weekly-off rules decide working days', () => {
    const days = [
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
    ];
    expect(
      days.map(d => checkDay(d, [gandhiJayanti], sundayOff).isWorking),
    ).toEqual([true, false, true, false, true]);
  });

  test('alternate and half-day weekly offs', () => {
    const rules = [
      normalizeWeeklyOffRule({
        weekDay: 'Sat',
        offType: 'Full Day',
        isAlternate: 1,
        alternateWeeks: '[2,4]',
      }),
      normalizeWeeklyOffRule({ weekDay: 'Sun', offType: 'Half Day' }),
    ];
    expect(checkDay('2026-10-03', [], rules).isWorking).toBe(true); // 1st Saturday
    expect(checkDay('2026-10-10', [], rules).isWorking).toBe(false); // 2nd Saturday
    expect(checkDay('2026-10-04', [], rules)).toMatchObject({
      isWorking: true,
      isHalfDay: true,
    });
  });

  test('without rules only Sunday is off', () => {
    expect(checkDay('2026-10-03', [], []).isWorking).toBe(true);
    expect(checkDay('2026-10-04', [], []).isWorking).toBe(false);
  });

  test('optional holidays count only once selected', () => {
    const h = { date: '2026-09-25', name: 'Ganesh Visarjan', isOptional: true };
    expect(
      checkDay('2026-09-25', [{ ...h, selected: false }], []).isWorking,
    ).toBe(true);
    expect(
      checkDay('2026-09-25', [{ ...h, selected: true }], []).isWorking,
    ).toBe(false);
  });
});

describe('getDayStatus', () => {
  const past = '2020-01-06'; // a Monday safely in the past

  test('check-in without check-out on a past day is a missed punch-out', () => {
    const record = {
      checkInTime: `${past} 09:00:00`,
      checkOutTime: null,
      status: 'present',
    };
    expect(getDayStatus({ date: past, record })).toBe('missed_punch_out');
    expect(getDayStatus({ date: past, record, requireCheckout: false })).toBe(
      'present',
    );
  });

  test('no record: weekend, absent, or nothing before joining', () => {
    expect(
      getDayStatus({ date: '2020-01-05', weeklyOffRules: sundayOff }),
    ).toBe('weekly_off');
    expect(getDayStatus({ date: past, weeklyOffRules: sundayOff })).toBe(
      'absent',
    );
    expect(getDayStatus({ date: past, joinedOn: '2020-02-01' })).toBe(null);
  });
});
