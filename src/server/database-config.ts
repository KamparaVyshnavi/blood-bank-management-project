/** Conservative MongoDB database-name validation shared by runtime and registry tooling. */
export function validDatabaseName(value: string): boolean {
  return value.length > 0
    && Buffer.byteLength(value, "utf8") <= 63
    && /^[a-zA-Z0-9_-]+$/.test(value)
    && !["admin", "local", "config"].includes(value.toLowerCase());
}
