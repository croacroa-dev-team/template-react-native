import {
  parseVersion,
  compareVersions,
  isVersionAtLeast,
} from "@/utils/versionGate";

describe("Version Gate Utilities", () => {
  describe("parseVersion", () => {
    it("parses a full semver string", () => {
      expect(parseVersion("1.2.3")).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
      });
    });

    it("handles two-segment versions", () => {
      expect(parseVersion("1.2")).toEqual({
        major: 1,
        minor: 2,
        patch: 0,
      });
    });

    it("handles single-segment version", () => {
      expect(parseVersion("5")).toEqual({
        major: 5,
        minor: 0,
        patch: 0,
      });
    });

    it("handles zero versions", () => {
      expect(parseVersion("0.0.0")).toEqual({
        major: 0,
        minor: 0,
        patch: 0,
      });
    });
  });

  describe("compareVersions", () => {
    it("returns -1 when a < b (major)", () => {
      expect(compareVersions("1.0.0", "2.0.0")).toBe(-1);
    });

    it("returns -1 when a < b (minor)", () => {
      expect(compareVersions("1.2.0", "1.3.0")).toBe(-1);
    });

    it("returns -1 when a < b (patch)", () => {
      expect(compareVersions("1.2.3", "1.2.4")).toBe(-1);
    });

    it("returns 0 when versions are equal", () => {
      expect(compareVersions("1.2.3", "1.2.3")).toBe(0);
    });

    it("returns 1 when a > b (major)", () => {
      expect(compareVersions("3.0.0", "2.0.0")).toBe(1);
    });

    it("returns 1 when a > b (minor)", () => {
      expect(compareVersions("1.5.0", "1.3.0")).toBe(1);
    });

    it("returns 1 when a > b (patch)", () => {
      expect(compareVersions("1.2.5", "1.2.3")).toBe(1);
    });
  });

  describe("isVersionAtLeast", () => {
    it("returns true when current equals minimum", () => {
      expect(isVersionAtLeast("1.0.0", "1.0.0")).toBe(true);
    });

    it("returns true when current is greater", () => {
      expect(isVersionAtLeast("2.0.0", "1.0.0")).toBe(true);
    });

    it("returns false when current is less", () => {
      expect(isVersionAtLeast("1.0.0", "2.0.0")).toBe(false);
    });

    it("handles different segment counts", () => {
      expect(isVersionAtLeast("1.2.1", "1.2")).toBe(true);
      expect(isVersionAtLeast("1.2", "1.2.1")).toBe(false);
    });
  });
});
