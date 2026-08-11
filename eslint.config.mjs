import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * The two spellings that produced most of the timezone bugs.
 *
 * Both look local and correct and are neither: they resolve in whatever zone
 * the process or browser happens to be in, which is UTC on Vercel. See the
 * Timezone Policy in CLAUDE.md.
 */
const timezoneBans = [
  {
    selector:
      "CallExpression[callee.property.name='setHours'][arguments.length=4][arguments.0.value=0][arguments.1.value=0][arguments.2.value=0][arguments.3.value=0]",
    message:
      "setHours(0,0,0,0) is midnight in the running process's timezone, not the operating one. Use startOfBookingDayUtc() for a query window, or bookingTodayAsCalendarDate() for a date-picker guard.",
  },
  {
    selector:
      "CallExpression[callee.object.callee.property.name='toISOString'][callee.property.name='split']",
    message:
      "toISOString().split('T')[0] is today in UTC, so it returns yesterday during the first hours of the operating day. Use bookingToday(). Export filenames are the one fair exception: disable this rule on that line.",
  },
];

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    // The timezone module itself and its business-side door are where the
    // correct conversions live, so they are allowed to do the raw arithmetic.
    ignores: [
      "lib/utils/timezone.ts",
      "lib/business/utils/timezone.ts",
      "lib/dashboard/revenue-range.ts",
      "lib/availability/display-tz.ts",
    ],
    rules: {
      "no-restricted-syntax": ["error", ...timezoneBans],
    },
  },
];
export default config;
