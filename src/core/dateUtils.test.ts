import { DateTime, Settings } from 'luxon';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  formatDate,
  formatDateTime,
  formatISOWithoutZone,
  formatISODate,
  formatMediumDateTime,
  formatMonth,
  formatRelative,
  formatShortDateTime,
  formatTime,
} from './dateUtils';

describe('formatRelative', () => {
  afterEach(() => {
    Settings.now = () => Date.now();
  });

  it('rounds to the nearest month instead of truncating', () => {
    // Regression test: a date ~58 days out (1.88 months) previously showed
    // "in 1 month" because Luxon's toRelative() truncates by default.
    const fixedNow = DateTime.fromISO('2026-08-04').toMillis();
    Settings.now = () => fixedNow;

    expect(formatRelative('2026-10-01')).toBe('in 2 months');
  });

  it('still rounds down correctly when close to the lower unit', () => {
    // ~32 days out (1.07 months) should round down to "in 1 month".
    const fixedNow = DateTime.fromISO('2026-08-04').toMillis();
    Settings.now = () => fixedNow;

    expect(formatRelative('2026-09-05')).toBe('in 1 month');
  });

  it('crosses into the next unit when rounding reaches its threshold', () => {
    // ~11.8 months out previously showed "in 12 months" because Luxon
    // picks the display unit from the un-rounded diff (years diff here is
    // 0.98, below 1) before rounding the number within that unit.
    const fixedNow = DateTime.fromISO('2026-08-04').toMillis();
    Settings.now = () => fixedNow;

    expect(formatRelative('2027-07-28')).toBe('in 1 year');
  });

  it('does not cross into the next unit when rounding stays below threshold', () => {
    // ~11.3 months out should still round to "in 11 months".
    const fixedNow = DateTime.fromISO('2026-08-04').toMillis();
    Settings.now = () => fixedNow;

    expect(formatRelative('2027-07-13')).toBe('in 11 months');
  });

  it('does not cross into years for a mid-range month count', () => {
    // ~8 months out has a raw years diff of 0.67, which rounds to 1 if
    // naively rounded at the years level — but 8 months should stay
    // "in 8 months", not jump to "in 1 year".
    const fixedNow = DateTime.fromISO('2026-08-04').toMillis();
    Settings.now = () => fixedNow;

    expect(formatRelative('2027-04-04')).toBe('in 8 months');
  });
  it('counts whole days for a calendar date, not from the current instant', () => {
    // A date carries no time, so it is that whole day. Measured from the
    // current instant it lost most of today and read one day short — and now
    // that these dates come from an authoritative server field (`eta_days` in
    // waldur/waldur-mastermind#332), an API saying 9 beside a UI saying 8 is a
    // discrepancy someone has to chase down.
    const fixedNow = DateTime.fromISO('2026-09-01T14:00:00').toMillis();
    Settings.now = () => fixedNow;

    expect(formatRelative('2026-09-10')).toBe('in 9 days');
    expect(formatRelative('2026-09-02')).toBe('in 1 day');
    expect(formatRelative('2026-08-31')).toBe('1 day ago');
  });

  it('calls a calendar date of today "today", not "in 0 days"', () => {
    const fixedNow = DateTime.fromISO('2026-09-01T14:00:00').toMillis();
    Settings.now = () => fixedNow;

    expect(formatRelative('2026-09-01')).toBe('today');
    // Only the zero case takes the worded form; turning it on generally would
    // render every "in 1 day" as "tomorrow" across the app.
    expect(formatRelative('2026-09-02')).toBe('in 1 day');
  });

  it('holds at every hour of the day, not just at midnight', () => {
    for (const hour of ['00:01', '09:30', '14:00', '23:59']) {
      const fixedNow = DateTime.fromISO(`2026-09-01T${hour}:00`).toMillis();
      Settings.now = () => fixedNow;
      expect(formatRelative('2026-09-10')).toBe('in 9 days');
    }
  });

  it('keeps instant precision for a timestamp', () => {
    // Only dates are whole days; a timestamp still reports hours.
    const fixedNow = DateTime.fromISO('2026-09-01T14:00:00').toMillis();
    Settings.now = () => fixedNow;

    expect(formatRelative('2026-09-01T09:00:00')).toBe('5 hours ago');
  });
});

// Each of these formatters has ~10+ product call sites (admin list columns
// especially), and its output shape is user-visible at every one of them.
// Until now the only assertion anywhere of what they actually render was one
// test in getProtectedFieldProps.test.tsx spelling out a full tooltip string —
// and that one had to be de-hardcoded, because Luxon's meridiem token follows
// the host locale (`en-US` -> "12:00 AM", `en-AU` -> "12:00 am", `en-GB` and
// `de-DE` -> "12:00" with no meridiem at all). Composing an expectation out of
// the formatter cannot catch a change to the formatter, so the shape is pinned
// here instead.
//
// Two rules this block follows, both learned the hard way:
//
// 1. Pin the locale explicitly (`Settings.defaultLocale`) instead of inheriting
//    whatever the host resolves to, then assert the literals that hold *under
//    that locale* and use a shape for the parts that legitimately vary. Writing
//    `expect(formatDate(...)).toBe('26 Feb 2027')` without pinning the locale
//    is the same bug one layer down from PR #29.
//
// 2. Pick input values that *discriminate* between the tokens the source uses.
//    A test that only ever sees February at 14:21 cannot tell `LLL` from `MMM`
//    (identical in en, different in fi/cs), `yyyy` from `y` (identical until
//    year 1000), or `t` from `T` (identical for 12:00-11:59 under any 24-hour
//    locale). Every mutation-proven discriminator below exists for that reason,
//    and the mutation table in the PR body is the evidence they earn their
//    keep.
//
// TZ-independence is the third axis: inputs are zone-local
// (`2027-02-26T14:21:00`, no offset) so the rendered clock is identical in
// Sydney and Berlin. Only the one deliberately zone-explicit case shifts with
// the host, and it recomputes its expectation from Luxon so it cannot drift.
describe('date formatter output contract', () => {
  const originalLocale = Settings.defaultLocale;
  const originalZone = Settings.defaultZone;

  beforeEach(() => {
    Settings.defaultLocale = 'en-GB';
    // Pin the zone too, not just the locale. A zone-local input
    // (`2027-02-26T14:21:00`, no offset) resolves through `Settings.defaultZone`,
    // so leaving it to the host makes the rendered clock and — for the
    // `ZZZZ` formatters — the rendered zone name depend on the machine the suite
    // runs on. Verified: under TZ=UTC the medium formatter renders "UTC" where
    // every other host renders "GMT+1"/"GMT+11"/"PST". Pinning to a named zone
    // that is never UTC and has a DST-free-ish fixed offset makes the whole
    // block host-independent by construction rather than by luck.
    Settings.defaultZone = 'Australia/Sydney';
  });

  afterEach(() => {
    Settings.defaultLocale = originalLocale;
    Settings.defaultZone = originalZone;
    Settings.now = () => Date.now();
  });

  it('pins formatISODate to a bare calendar date, dropping the clock', () => {
    expect(formatISODate('2027-02-26')).toBe('2027-02-26');
    // A timestamp collapses to its date. This is the assertion that fails if
    // the implementation keeps the time (verified by mutation).
    expect(formatISODate('2027-02-26T14:21:00')).toBe('2027-02-26');
  });

  it('pins formatDate to day, abbreviated standalone month, padded year', () => {
    expect(formatDate('2027-02-26')).toBe('26 Feb 2027');
    expect(formatDate('2027-02-26T14:21:00')).toBe('26 Feb 2027');
    // `yyyy`, not `y`: a pre-1000 year is zero-padded to four digits. `y`
    // renders "750" here and this assertion is what catches it.
    expect(formatDate('0750-02-26T14:21:00')).toBe('26 Feb 0750');
  });

  it('keeps formatDate a word rather than a bare month number in fi and cs', () => {
    // `LLL` (standalone abbreviated) vs `MMM` (format abbreviated): identical
    // in en-US, but MMM degrades to a plain digit in Finnish and Czech, which
    // is the degradation the source file's own header says it exists to
    // avoid. This is the assertion that fails if someone swaps LLL -> MMM.
    for (const locale of ['fi-FI', 'cs-CZ']) {
      Settings.defaultLocale = locale;
      expect(formatDate('2027-02-26T14:21:00')).not.toMatch(/\d+ \d+ \d{4}$/);
    }
  });

  it('pins formatTime to a 24-hour clock, not a meridiem one', () => {
    expect(formatTime('2027-02-26T14:21:00')).toBe('14:21');
    expect(formatTime('2027-02-26T00:00:00')).toBe('00:00');
    expect(formatTime('2027-02-26T23:59:00')).toBe('23:59');
    // Under en-US the meridiem token renders "2:21 PM"; the 24-hour token is
    // locale-independent, so pinning en-US proves which token is in the source
    // (a shape-only assertion under en-GB could not: t and T agree there).
    Settings.defaultLocale = 'en-US';
    expect(formatTime('2027-02-26T14:21:00')).toBe('14:21');
  });

  it('pins formatDateTime to formatDate plus a meridiem clock', () => {
    // The date half is stable across the locales this app ships, so it is
    // asserted literally. The clock half is the locale-variable one, so it is
    // matched by shape — pinning the meridiem literal here is exactly the
    // failure PR #29 had to undo one layer up.
    expect(formatDateTime('2027-02-26T14:21:00')).toMatch(
      /^26 Feb 2027, \d{1,2}:\d{2}(\s?[APap][Mm])?$/,
    );
    // Separator and day-first order are part of the contract too, so the halves
    // are checked structurally rather than only as one opaque blob.
    const rendered = formatDateTime('2027-02-26T14:21:00');
    const halves = rendered.split(', ');
    expect(halves).toHaveLength(2);
    expect(halves[0]).toBe(formatDate('2027-02-26T14:21:00'));
    expect(halves[1]).not.toBe('');
  });

  it('uses the meridiem token for formatDateTime, not the 24-hour one', () => {
    // The discriminator the shape-only assertion above cannot provide: under
    // en-US, `t` renders "2:21 PM" and `T` renders "14:21". Both satisfy the
    // regex above, so the meridiem-ness has to be asserted in a locale that
    // separates them.
    Settings.defaultLocale = 'en-US';
    expect(formatDateTime('2027-02-26T14:21:00')).toBe('26 Feb 2027, 2:21 PM');
    // And midnight shows the AM half, in the casing that locale uses.
    expect(formatDateTime('2027-02-26T00:00:00')).toBe('26 Feb 2027, 12:00 AM');
  });

  it('keeps the formatDateTime shape under every locale it ships to', () => {
    // The date half is asserted literally under each locale that renders a
    // Latin month name, and by shape for the rest — but the *shape* (day
    // first, ", " separator, clock after it) must hold everywhere, including
    // fi-FI where the clock uses "." and the month is inflected.
    for (const locale of ['en-US', 'en-AU', 'de-DE', 'fi-FI']) {
      Settings.defaultLocale = locale;
      expect(formatDateTime('2027-02-26T14:21:00')).toMatch(
        /^\d{1,2} \S+ \d{4}, \d{1,2}[:.]\d{2}(\s?[APap][Mm])?$/,
      );
    }
    // en-AU lowercases the meridiem; en-US uppercases it. Neither may drift.
    Settings.defaultLocale = 'en-AU';
    expect(formatDateTime('2027-02-26T00:00:00')).toBe('26 Feb 2027, 12:00 am');
  });

  it('renders a zone-explicit input in the host zone, not in UTC', () => {
    // parseDate keeps whatever zone the input carries, and a `Z` input renders
    // in the host zone — so the rendered day genuinely depends on the zone.
    // The expectation is recomputed from Luxon rather than hardcoded, and
    // because `Settings.defaultZone` is pinned in beforeEach the host cannot
    // drift it. This still has teeth: it fails if the formatter switches to UTC,
    // which is proven by the divergence assertion below.
    const input = '2027-02-26T23:30:00Z';
    const local = DateTime.fromISO(input);
    const inUtc = local.setZone('utc');
    expect(formatDateTime(input)).toBe(
      local.setLocale(Settings.defaultLocale).toFormat('d LLL yyyy, t'),
    );
    // Proof that the two are genuinely different rather than conflated: this
    // instant is 23:30 UTC on the 26th, which is already 10:30 on the 27th in
    // the pinned zone. So a formatter that rendered in UTC would print a
    // different calendar day here and the assertion above would catch it.
    // (The old version of this check compared the host rendering against UTC,
    // which is vacuously false when the host *is* UTC — it could not detect the
    // very thing it was written to prove.)
    expect(inUtc.toFormat('d LLL yyyy')).toBe('26 Feb 2027');
    expect(local.toFormat('d LLL yyyy')).toBe('27 Feb 2027');
    expect(inUtc.toFormat('d LLL yyyy, t')).not.toBe(
      local.toFormat('d LLL yyyy, t'),
    );
  });

  it('pins formatShortDateTime to the same shape as formatDateTime', () => {
    expect(formatShortDateTime('2027-02-26T14:21:00')).toBe(
      formatDateTime('2027-02-26T14:21:00'),
    );
    // Equality alone would tolerate both drifting together; a literal on the
    // abbreviated month keeps them from swapping LLL -> MMM in unison. The
    // clock literal is safe here because the pinned zone has a 24-hour locale
    // pinned (en-GB), where `t` and `T` agree — the meridiem token is pinned
    // separately, under en-US, where they differ.
    expect(formatShortDateTime('2027-02-26T14:21:00')).toBe(
      '26 Feb 2027, 14:21',
    );
  });

  it('pins formatMediumDateTime to day, full month, clock and zone name', () => {
    // `d MMMM yyyy, t ZZZZ`. The zone half is what makes this one distinct:
    // ZZZZ renders the localized long form ("GMT+11" in Sydney, "PST" in Los
    // Angeles), ZZZ renders a bare numeric offset ("+1100"). Asserting the long
    // form under the pinned zone is what discriminates the two — and it must be
    // a *localized* long form rather than anything containing a literal
    // "[+-]NNNN", because the offset-free zone name is the whole difference.
    //
    // Under a host TZ of UTC this token renders "UTC" (no offset digits at all),
    // which is why the zone is pinned rather than inherited.
    expect(formatMediumDateTime('2027-02-26T14:21:00')).toBe(
      '26 February 2027, 14:21 GMT+11',
    );
    // The meridiem token is pinned separately for this formatter, under en-US
    // where `t` actually differs from `T` — under the en-GB pinned here the two
    // agree and a "2:21 pm" literal would be wrong, not stricter.
    Settings.defaultLocale = 'en-US';
    expect(formatMediumDateTime('2027-02-26T14:21:00')).toBe(
      '26 February 2027, 2:21 PM GMT+11',
    );
    Settings.defaultLocale = 'en-GB';
    // ZZZ (numeric offset) instead of ZZZZ (long form) would render "+1100".
    expect(formatMediumDateTime('2027-02-26T14:21:00')).not.toMatch(
      /[+-]\d{2}:?\d{2}$/,
    );
    // A trailing four-digit token would mean the zone name had been dropped.
    expect(formatMediumDateTime('2027-02-26T14:21:00')).not.toMatch(
      / \S* \d{4}$/,
    );
  });

  it('pins formatISOWithoutZone to a local ISO timestamp with no offset', () => {
    // The `T` token inside the literal is a clock separator, not Luxon's
    // meridiem token: no "pm", and no trailing offset or zone name.
    expect(formatISOWithoutZone('2027-02-26T14:21:00')).toBe(
      '2027-02-26T14:21',
    );
    expect(formatISOWithoutZone('2027-02-26T14:21:00')).not.toMatch(
      /[APap][Mm]|[+-]\d{2}:\d{2}$|\s/,
    );
    // 24-hour and zero-padded, in a locale whose meridiem token would be "pm".
    Settings.defaultLocale = 'en-US';
    expect(formatISOWithoutZone('2027-02-26T14:21:00')).toBe(
      '2027-02-26T14:21',
    );
  });

  it('pins formatMonth to a full, inflected month name and year', () => {
    expect(formatMonth('2027-02-26')).toBe('February 2027');
    expect(formatMonth('2027-02-26T14:21:00')).toBe('February 2027');
    // `MMMM` (format) not `LLLL` (standalone): identical in English, different
    // in the languages the source comment cites — Finnish "helmikuuta"
    // (partitive) vs "helmikuu" (nominative), Russian "февраля" vs "февраль".
    Settings.defaultLocale = 'fi-FI';
    expect(formatMonth('2027-02-26T14:21:00')).toBe('helmikuuta 2027');
    Settings.defaultLocale = 'ru-RU';
    expect(formatMonth('2027-02-26T14:21:00')).toBe('февраля 2027');
  });
});
