/**
 * @fileoverview Semantic version comparison utilities
 * @module utils/versionGate
 */

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Parse a semver string into components.
 */
export function parseVersion(version: string): ParsedVersion {
  const parts = version.split(".").map(Number);
  return {
    major: parts[0] ?? 0,
    minor: parts[1] ?? 0,
    patch: parts[2] ?? 0,
  };
}

/**
 * Compare two version strings.
 * Returns -1 if a < b, 0 if equal, 1 if a > b.
 */
export function compareVersions(
  a: string,
  b: string,
): -1 | 0 | 1 {
  const va = parseVersion(a);
  const vb = parseVersion(b);

  if (va.major !== vb.major)
    return va.major < vb.major ? -1 : 1;
  if (va.minor !== vb.minor)
    return va.minor < vb.minor ? -1 : 1;
  if (va.patch !== vb.patch)
    return va.patch < vb.patch ? -1 : 1;
  return 0;
}

/**
 * Check if current version meets the minimum requirement.
 */
export function isVersionAtLeast(
  current: string,
  minimum: string,
): boolean {
  return compareVersions(current, minimum) >= 0;
}
