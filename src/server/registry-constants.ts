/**
 * Registry partition selected at deployment time. The default deliberately
 * preserves the original pilot partition so existing records remain visible
 * until an operator explicitly configures another state.
 */
export function resolveStateId(value = process.env.REGISTRY_STATE_ID) {
  const stateId = value?.trim() || "maharashtra-pilot";
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(stateId)) {
    throw new Error("REGISTRY_STATE_ID must be 1-64 letters, numbers, underscores or hyphens");
  }
  return stateId;
}
export const STATE_ID = resolveStateId();
