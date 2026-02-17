/**
 * Layout width constants for consistent unauthenticated post view and sidebar.
 * Used so we don't repeat magic numbers (quality_code: DRY).
 */

/** Fixed width of the main content rail (post column). */
export const MIDRAIL_WIDTH_PX = 600;

/** Unauthenticated sidebar width at md breakpoint (tablet). */
export const UNAUTH_SIDEBAR_WIDTH_MD_PX = 200;

/** Unauthenticated sidebar width at lg breakpoint (desktop). */
export const UNAUTH_SIDEBAR_WIDTH_LG_PX = 275;

/** Max width of sidebar + midrail group at md (200 + 600). */
export const UNAUTH_GROUP_MAX_WIDTH_MD_PX = UNAUTH_SIDEBAR_WIDTH_MD_PX + MIDRAIL_WIDTH_PX;

/** Max width of sidebar + midrail group at lg (275 + 600). */
export const UNAUTH_GROUP_MAX_WIDTH_LG_PX = UNAUTH_SIDEBAR_WIDTH_LG_PX + MIDRAIL_WIDTH_PX;

/** Logo display size for desktop/tablet sidebar. */
export const UNAUTH_LOGO_SIZE_DESKTOP = 48;

/** Logo display size for mobile top bar. */
export const UNAUTH_LOGO_SIZE_MOBILE = 40;
