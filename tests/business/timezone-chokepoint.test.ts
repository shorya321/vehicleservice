/**
 * Guards the business module's timezone boundary.
 *
 * The business module keeps its own copies rather than sharing with the
 * customer flow, but a timezone offset is not the kind of thing that may
 * diverge: two copies of "+04:00" that drift would mean the two halves of the
 * product disagreeing about what day it is. So `lib/business/utils/timezone.ts`
 * re-exports the shared primitives and is the only business file allowed to
 * reach for them.
 *
 * A source-level test, like `tests/email/platform-only.test.ts`, and for the
 * same reason: the failure it catches is someone adding an import that looks
 * harmless and is invisible at runtime until a date is four hours out.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOTS = [
  'app/business',
  'app/api/business',
  'lib/business',
  'components/business',
];

/**
 * The files permitted to cross. Two, split the same way
 * `lib/business/email/brand.ts` and `platform.ts` are: the isomorphic helpers
 * are safe for client components, the loader is `server-only` and would break
 * the browser bundle if it reached them.
 */
const CHOKEPOINTS = [
  'lib/business/utils/timezone.ts',
  'lib/business/utils/timezone-server.ts',
];

function walk(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }

  return entries.flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function businessFiles(): string[] {
  return ROOTS.flatMap((root) => walk(join(process.cwd(), root))).filter((file) =>
    /\.(ts|tsx)$/.test(file)
  );
}

describe('the business timezone boundary', () => {
  it('finds the business module, so this guard cannot silently assert nothing', () => {
    expect(businessFiles().length).toBeGreaterThan(50);
  });

  it('is crossed by exactly the chokepoints', () => {
    const offenders = businessFiles()
      .filter((file) => !CHOKEPOINTS.some((allowed) => file.endsWith(allowed)))
      .filter((file) =>
        /from '[^']*(lib\/utils\/timezone|lib\/site-settings\/timezone)'/.test(
          readFileSync(file, 'utf8')
        )
      )
      .map((file) => file.replace(`${process.cwd()}/`, ''));

    expect(offenders).toEqual([]);
  });

  it('keeps the server-only loader away from the isomorphic half', () => {
    // Importing it into ./timezone would drag `server-only` into every client
    // component that formats a date.
    const isomorphic = readFileSync(join(process.cwd(), CHOKEPOINTS[0]), 'utf8');

    expect(isomorphic).not.toContain('server-only');
    expect(isomorphic).not.toContain('site-settings');
  });

  it('keeps the chokepoint a re-export, never a second implementation', () => {
    const source = readFileSync(join(process.cwd(), CHOKEPOINTS[0]), 'utf8');

    // A copy would have to define the offset itself. Re-exporting cannot.
    expect(source).not.toMatch(/const\s+BOOKING_UTC_OFFSET\s*=/);
    expect(source).not.toMatch(/function\s+booking/);
    expect(source).toMatch(/export\s*\{[\s\S]*\}\s*from '@\/lib\/utils\/timezone'/);
  });

  it('re-exports everything the shared module offers, so nobody needs to bypass it', () => {
    const shared = readFileSync(join(process.cwd(), 'lib/utils/timezone.ts'), 'utf8');
    const chokepoint = readFileSync(join(process.cwd(), CHOKEPOINTS[0]), 'utf8');

    const exported = Array.from(
      shared.matchAll(/export (?:async )?(?:function|const|type) (\w+)/g)
    ).map((match) => match[1]);

    expect(exported.length).toBeGreaterThan(8);

    const missing = exported.filter((name) => !new RegExp(`\\b${name}\\b`).test(chokepoint));
    expect(missing).toEqual([]);
  });
});
