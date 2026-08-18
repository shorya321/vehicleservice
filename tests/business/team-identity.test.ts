/**
 * The Team roster rendered its owner as "-" in both the Name and Email columns
 * while the header directly above showed that person's real name, because
 * business_users.full_name/email are nullable and the page read them raw.
 *
 * These tests pin the fallback chain, and in particular pin the one rule that
 * must never regress: the business-account fallbacks describe the business, so
 * they are owner-only. Applying them to staff would show every staff member the
 * owner's identity as their own.
 */

import {
  resolveMemberIdentity,
  type MemberIdentitySources,
} from '@/lib/business/team-identity';

const sources = (overrides: Partial<MemberIdentitySources> = {}): MemberIdentitySources => ({
  email: null,
  full_name: null,
  role: 'staff',
  profileEmail: null,
  profileFullName: null,
  accountEmail: null,
  accountContactName: null,
  ...overrides,
});

describe('resolveMemberIdentity', () => {
  it('returns a fully populated row untouched', () => {
    expect(
      resolveMemberIdentity(
        sources({
          email: 'atul@fanaticcoders.com',
          full_name: 'Atul Sharma',
          profileEmail: 'stale@example.com',
          profileFullName: 'Stale Name',
          accountEmail: 'owner@example.com',
          accountContactName: 'Owner',
        })
      )
    ).toEqual({ email: 'atul@fanaticcoders.com', full_name: 'Atul Sharma' });
  });

  it('falls back to profiles for a member with NULL columns', () => {
    expect(
      resolveMemberIdentity(
        sources({ profileEmail: 'atul@fanaticcoders.com', profileFullName: 'Atul Sharma' })
      )
    ).toEqual({ email: 'atul@fanaticcoders.com', full_name: 'Atul Sharma' });
  });

  it('falls back to the business account for an owner with NULL columns', () => {
    expect(
      resolveMemberIdentity(
        sources({
          role: 'owner',
          accountEmail: 'vikaskaundal21@gmail.com',
          accountContactName: 'Vikas',
        })
      )
    ).toEqual({ email: 'vikaskaundal21@gmail.com', full_name: 'Vikas' });
  });

  it('never gives staff the business account identity', () => {
    expect(
      resolveMemberIdentity(
        sources({
          role: 'staff',
          accountEmail: 'vikaskaundal21@gmail.com',
          accountContactName: 'Vikas',
        })
      )
    ).toEqual({ email: null, full_name: null });
  });

  it('treats an unrecognised role as staff, so it gets no account fallback', () => {
    expect(
      resolveMemberIdentity(
        sources({
          role: 'OWNER',
          accountEmail: 'vikaskaundal21@gmail.com',
          accountContactName: 'Vikas',
        })
      )
    ).toEqual({ email: null, full_name: null });
  });

  it('falls through an empty-string profile name rather than showing a blank', () => {
    expect(
      resolveMemberIdentity(
        sources({
          role: 'owner',
          profileEmail: 'shammy@fanaticcoders.com',
          profileFullName: '',
          accountContactName: 'shammy',
        })
      )
    ).toEqual({ email: 'shammy@fanaticcoders.com', full_name: 'shammy' });
  });

  it('derives a name from the email local part when nothing else names the member', () => {
    expect(resolveMemberIdentity(sources({ profileEmail: 'atul@fanaticcoders.com' }))).toEqual({
      email: 'atul@fanaticcoders.com',
      full_name: 'atul',
    });
  });

  it('resolves nothing when every source is empty', () => {
    expect(resolveMemberIdentity(sources())).toEqual({ email: null, full_name: null });
  });
});
