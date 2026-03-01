import { isVersionLessThan, checkForUpdate } from "@/services/force-update";

describe("Force Update Service", () => {
  describe("isVersionLessThan", () => {
    it("returns true when current is older (major)", () => {
      expect(isVersionLessThan("1.0.0", "2.0.0")).toBe(true);
    });

    it("returns true when current is older (minor)", () => {
      expect(isVersionLessThan("1.2.0", "1.3.0")).toBe(true);
    });

    it("returns true when current is older (patch)", () => {
      expect(isVersionLessThan("1.2.3", "1.2.4")).toBe(true);
    });

    it("returns false when versions are equal", () => {
      expect(isVersionLessThan("1.2.3", "1.2.3")).toBe(false);
    });

    it("returns false when current is newer", () => {
      expect(isVersionLessThan("2.0.0", "1.9.9")).toBe(false);
    });

    it("handles versions with different segment counts", () => {
      expect(isVersionLessThan("1.2", "1.2.1")).toBe(true);
      expect(isVersionLessThan("1.2.1", "1.2")).toBe(false);
    });
  });

  describe("checkForUpdate", () => {
    let fetchMock: jest.SpyInstance;

    beforeEach(() => {
      fetchMock = jest.spyOn(globalThis, "fetch");
    });

    afterEach(() => {
      fetchMock.mockRestore();
    });

    it("returns no update when checkUrl is empty", async () => {
      const result = await checkForUpdate({
        checkUrl: "",
        currentVersion: "1.0.0",
      });

      expect(result.isUpdateRequired).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns update required when current < minimum", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            minimumVersion: "2.0.0",
            storeUrl: "https://store.example.com/app",
          }),
      });

      const result = await checkForUpdate({
        checkUrl: "https://api.example.com/version",
        currentVersion: "1.5.0",
      });

      expect(result.isUpdateRequired).toBe(true);
      expect(result.minimumVersion).toBe("2.0.0");
      expect(result.storeUrl).toBe("https://store.example.com/app");
    });

    it("returns no update when current >= minimum", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            minimumVersion: "1.0.0",
            storeUrl: "https://store.example.com/app",
          }),
      });

      const result = await checkForUpdate({
        checkUrl: "https://api.example.com/version",
        currentVersion: "2.0.0",
      });

      expect(result.isUpdateRequired).toBe(false);
    });

    it("returns no update on HTTP error", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await checkForUpdate({
        checkUrl: "https://api.example.com/version",
        currentVersion: "1.0.0",
      });

      expect(result.isUpdateRequired).toBe(false);
    });

    it("returns no update on network error", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));

      const result = await checkForUpdate({
        checkUrl: "https://api.example.com/version",
        currentVersion: "1.0.0",
      });

      expect(result.isUpdateRequired).toBe(false);
    });

    it("returns no update when response is missing required fields", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ minimumVersion: "2.0.0" }), // missing storeUrl
      });

      const result = await checkForUpdate({
        checkUrl: "https://api.example.com/version",
        currentVersion: "1.0.0",
      });

      expect(result.isUpdateRequired).toBe(false);
    });
  });
});
