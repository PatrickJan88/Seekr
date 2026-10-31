/**
 * Account isolation and storage management for Seekr.
 * Strictly separates Personal Accounts (authenticated Google users)
 * from Guest Accounts (anonymous visitors / demo users).
 * Prevents any personal statement, thesis proposal, or private draft from leaking into Guest mode.
 */

import { auth } from './firebase';
import { User } from 'firebase/auth';

/**
 * Checks if the current session belongs to an authenticated personal account.
 */
export function isPersonalUser(user?: User | null, isDemo?: boolean): boolean {
  if (isDemo) return false;
  const targetUser = user !== undefined ? user : auth.currentUser;
  return Boolean(targetUser && !targetUser.isAnonymous && targetUser.uid && targetUser.email);
}

/**
 * Checks if the session is a guest session (anonymous or unauthenticated or demo).
 */
export function isGuestSession(user?: User | null, isDemo?: boolean): boolean {
  return !isPersonalUser(user, isDemo);
}

/**
 * Returns a strict partition ID for storage keys.
 * Personal account: 'usr_<uid>'
 * Demo account: 'demo'
 * Guest account: 'guest'
 */
export function getAccountScopeId(user?: User | null, isDemo?: boolean): string {
  if (isDemo) return 'demo';
  const targetUser = user !== undefined ? user : auth.currentUser;
  if (targetUser && !targetUser.isAnonymous && targetUser.uid && targetUser.email) {
    return `usr_${targetUser.uid}`;
  }
  return 'guest';
}

/**
 * Generates a strictly scoped storage key.
 */
export function getScopedKey(baseKey: string, user?: User | null, isDemo?: boolean): string {
  const scope = getAccountScopeId(user, isDemo);
  return `${baseKey}_${scope}`;
}

/**
 * Purges all historical Guest, Demo, and legacy un-scoped studio data from localStorage.
 * Personal account data (scoped with `usr_`) is preserved.
 * Any new or existing guest session will immediately be reset to clean default templates.
 */
export function purgeAllGuestAndLegacyData(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Explicitly remove all known legacy un-scoped studio and draft keys
    const specificKeysToRemove = [
      'studio_cover_letter_dashboard_draft',
      'studio_cover_letter_dashboard_draft_style',
      'studio_cover_letter_dashboard_draft_pages',
      'studio_interview_prep_dashboard_draft',
      'studio_interview_prep_dashboard_draft_pages',
      'studio_interview_prep_dashboard_draft_docs',
      'studio_resume_dashboard_draft',
      'studio_resume_dashboard_draft_template',
      // Guest-specific studio keys
      'studio_cover_letter_dashboard_guest',
      'studio_cover_letter_dashboard_guest_style',
      'studio_cover_letter_dashboard_guest_pages',
      'studio_interview_prep_dashboard_guest',
      'studio_interview_prep_dashboard_guest_pages',
      'studio_interview_prep_dashboard_guest_docs',
      'studio_resume_dashboard_guest',
      'studio_resume_dashboard_guest_template',
      // Demo-specific studio keys
      'studio_cover_letter_dashboard_demo',
      'studio_cover_letter_dashboard_demo_style',
      'studio_cover_letter_dashboard_demo_pages',
      'studio_interview_prep_dashboard_demo',
      'studio_interview_prep_dashboard_demo_pages',
      'studio_interview_prep_dashboard_demo_docs',
      'studio_resume_dashboard_demo',
      'studio_resume_dashboard_demo_template',
      // Guest workspace and evaluation storage
      'seekr_interview_prep_workspace_docs_guest',
      'seekr_interview_prep_workspace_docs_demo',
      'seekr_interview_prep_docs_guest',
      'seekr_interview_prep_docs_demo',
      'seekr_personal_stories_guest',
      'seekr_personal_stories_demo',
      'seekr_stored_resume_guest',
      'seekr_stored_resume_demo-user',
      'seekr_stored_resume_default',
      'seekr_stored_resume_undefined',
      'seekr_stored_resume_null',
      'demo_evaluations_cache',
      'seekr_evaluations_cache_guest',
      'seekr_evaluations_cache_default',
      'seekr_evaluations_cache_undefined',
      'seekr_teardowns_guest',
      'seekr_teardowns_demo',
      'seekr_evaluations_guest',
      'seekr_evaluations_demo',
      'seekr_demo_applications',
      'seekr_recent_searches',
      'seekr_selected_role_guest',
      'seekr_selected_role_industry_guest',
      'seekr_selected_role_academic_guest',
      'seekr_onboarded_guest'
    ];

    specificKeysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });

    // 2. Dynamic sweep of localStorage:
    // Any studio key (starts with studio_cover_letter_, studio_cl_, studio_interview_prep_, studio_resume_)
    // that does NOT contain `_usr_` is legacy un-scoped or guest data, so remove it!
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const isStudioKey =
        key.startsWith('studio_cover_letter_') ||
        key.startsWith('studio_cl_') ||
        key.startsWith('studio_interview_prep_') ||
        key.startsWith('studio_resume_');

      if (isStudioKey) {
        // If not scoped to an authenticated user (`usr_`), it's un-scoped/guest legacy
        if (!key.includes('_usr_')) {
          keysToRemove.push(key);
        }
      }

      // Remove any anonymous uid keys if anonymous auth left behind workspace docs
      if (
        (key.startsWith('seekr_interview_prep_workspace_docs_') ||
         key.startsWith('seekr_interview_prep_docs_') ||
         key.startsWith('seekr_personal_stories_')) &&
        !key.includes('_usr_')
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  } catch (e) {
    console.warn('accountStorage purgeAllGuestAndLegacyData failed:', e);
  }
}

// Automatically purge legacy un-scoped and guest data on module initialization
if (typeof window !== 'undefined') {
  purgeAllGuestAndLegacyData();
}
