/**
 * Role used to decide which navigation items appear.
 * FRONTEND-ONLY placeholder: when Clerk roles are wired in, derive this from the session.
 * Hiding navigation is not authorization — the API must enforce every permission.
 */
export type Role = "STATE_ADMIN" | "BLOOD_BANK" | "HOSPITAL";
export const currentRole: Role = "STATE_ADMIN";
