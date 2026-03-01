import {
  InterceptorManager,
  correlationIdInterceptor,
  userAgentInterceptor,
  requestSigningInterceptor,
  RequestConfig,
} from "@/services/api/interceptors";

jest.mock("@/constants/config", () => ({
  APP_VERSION: "2.0.0",
  SECURITY: {
    REQUEST_SIGNING: {
      ENABLED: false,
      ALGORITHM: "sha256",
      HEADER_NAME: "X-Request-Signature",
    },
  },
  LOGGER: { ENABLED: false, MIN_LEVEL: "warn", MAX_BREADCRUMBS: 100 },
}));

jest.mock("@/services/security", () => ({
  generateRequestSignature: jest.fn().mockResolvedValue("mock-signature"),
}));

describe("InterceptorManager", () => {
  const baseConfig: RequestConfig = {
    url: "https://api.example.com/test",
    method: "GET",
    headers: { "Content-Type": "application/json" },
  };

  afterEach(() => {
    // Clean up any registered interceptors isn't possible without internal access,
    // but each test creates its own interceptors so we're fine
  });

  describe("addRequest / runRequest", () => {
    it("runs request interceptors in order", async () => {
      const order: number[] = [];
      const remove1 = InterceptorManager.addRequest((config) => {
        order.push(1);
        return { ...config, headers: { ...config.headers, "X-First": "1" } };
      });
      const remove2 = InterceptorManager.addRequest((config) => {
        order.push(2);
        return { ...config, headers: { ...config.headers, "X-Second": "2" } };
      });

      const result = await InterceptorManager.runRequest(baseConfig);

      expect(order).toEqual([1, 2]);
      expect(result.headers["X-First"]).toBe("1");
      expect(result.headers["X-Second"]).toBe("2");

      remove1();
      remove2();
    });

    it("supports removing interceptors", async () => {
      const remove = InterceptorManager.addRequest((config) => ({
        ...config,
        headers: { ...config.headers, "X-Removed": "yes" },
      }));

      remove();

      const result = await InterceptorManager.runRequest(baseConfig);
      expect(result.headers["X-Removed"]).toBeUndefined();
    });
  });

  describe("addResponse / runResponse", () => {
    it("runs response interceptors in order", async () => {
      const mockResponse = new Response("ok", { status: 200 });
      const order: number[] = [];

      const remove1 = InterceptorManager.addResponse((response) => {
        order.push(1);
        return response;
      });
      const remove2 = InterceptorManager.addResponse((response) => {
        order.push(2);
        return response;
      });

      await InterceptorManager.runResponse(mockResponse, baseConfig);
      expect(order).toEqual([1, 2]);

      remove1();
      remove2();
    });
  });
});

describe("Built-in interceptors", () => {
  const baseConfig: RequestConfig = {
    url: "https://api.example.com/test",
    method: "GET",
    headers: {},
  };

  describe("correlationIdInterceptor", () => {
    it("adds X-Correlation-ID header", () => {
      const result = correlationIdInterceptor(baseConfig) as RequestConfig;
      expect(result.headers["X-Correlation-ID"]).toBeDefined();
      expect(result.headers["X-Correlation-ID"]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });

    it("generates unique IDs per call", () => {
      const r1 = correlationIdInterceptor(baseConfig) as RequestConfig;
      const r2 = correlationIdInterceptor(baseConfig) as RequestConfig;
      expect(r1.headers["X-Correlation-ID"]).not.toBe(
        r2.headers["X-Correlation-ID"]
      );
    });
  });

  describe("userAgentInterceptor", () => {
    it("adds X-Client header with app version", () => {
      const result = userAgentInterceptor(baseConfig) as RequestConfig;
      expect(result.headers["X-Client"]).toBe("react-native-template/2.0.0");
    });
  });

  describe("requestSigningInterceptor", () => {
    it("returns config unchanged when signing is disabled", async () => {
      const result = await requestSigningInterceptor(baseConfig);
      expect(result).toEqual(baseConfig);
    });
  });
});
