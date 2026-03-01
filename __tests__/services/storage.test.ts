import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { storage, secureStorage } from "@/services/storage";

jest.mock("@/constants/config", () => ({
  LOGGER: { ENABLED: false, MIN_LEVEL: "warn", MAX_BREADCRUMBS: 100 },
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("storage (AsyncStorage wrapper)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("get", () => {
    it("returns parsed JSON value", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ name: "test" })
      );

      const result = await storage.get("key");
      expect(result).toEqual({ name: "test" });
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith("key");
    });

    it("returns null when key does not exist", async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await storage.get("missing");
      expect(result).toBeNull();
    });

    it("returns null on error", async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error("read error"));

      const result = await storage.get("bad-key");
      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    it("stores JSON-serialized value", async () => {
      await storage.set("key", { count: 42 });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        "key",
        JSON.stringify({ count: 42 })
      );
    });

    it("handles errors silently", async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error("write error"));

      // Should not throw
      await expect(storage.set("key", "value")).resolves.toBeUndefined();
    });
  });

  describe("remove", () => {
    it("removes the key", async () => {
      await storage.remove("key");
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("key");
    });

    it("handles errors silently", async () => {
      mockAsyncStorage.removeItem.mockRejectedValue(new Error("remove error"));

      await expect(storage.remove("key")).resolves.toBeUndefined();
    });
  });

  describe("clear", () => {
    it("clears all storage", async () => {
      await storage.clear();
      expect(mockAsyncStorage.clear).toHaveBeenCalled();
    });
  });

  describe("getAllKeys", () => {
    it("returns all stored keys", async () => {
      mockAsyncStorage.getAllKeys.mockResolvedValue(["a", "b", "c"]);

      const keys = await storage.getAllKeys();
      expect(keys).toEqual(["a", "b", "c"]);
    });

    it("returns empty array on error", async () => {
      mockAsyncStorage.getAllKeys.mockRejectedValue(new Error("keys error"));

      const keys = await storage.getAllKeys();
      expect(keys).toEqual([]);
    });
  });
});

describe("secureStorage (expo-secure-store wrapper)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("get", () => {
    it("returns stored string value", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue("secret-value");

      const result = await secureStorage.get("token");
      expect(result).toBe("secret-value");
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith("token");
    });

    it("returns null when key does not exist", async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const result = await secureStorage.get("missing");
      expect(result).toBeNull();
    });

    it("returns null on error", async () => {
      mockSecureStore.getItemAsync.mockRejectedValue(new Error("secure error"));

      const result = await secureStorage.get("bad-key");
      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    it("stores string value securely", async () => {
      await secureStorage.set("token", "my-secret");

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        "token",
        "my-secret"
      );
    });

    it("handles errors silently", async () => {
      mockSecureStore.setItemAsync.mockRejectedValue(
        new Error("secure write error")
      );

      await expect(
        secureStorage.set("token", "value")
      ).resolves.toBeUndefined();
    });
  });

  describe("remove", () => {
    it("deletes key from secure storage", async () => {
      await secureStorage.remove("token");

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith("token");
    });

    it("handles errors silently", async () => {
      mockSecureStore.deleteItemAsync.mockRejectedValue(
        new Error("delete error")
      );

      await expect(secureStorage.remove("token")).resolves.toBeUndefined();
    });
  });
});
