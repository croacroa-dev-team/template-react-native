/**
 * @fileoverview Request/response interceptor pipeline
 * @module services/api/interceptors
 */

import { Logger } from "@/services/logger/logger-adapter";
import { generateRequestSignature } from "@/services/security";
import { SECURITY, APP_VERSION } from "@/constants/config";

export interface RequestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
}

export type RequestInterceptor = (
  config: RequestConfig
) => RequestConfig | Promise<RequestConfig>;
export type ResponseInterceptor = (
  response: Response,
  config: RequestConfig
) => Response | Promise<Response>;

const requestInterceptors: {
  id: number;
  fn: RequestInterceptor;
}[] = [];
const responseInterceptors: {
  id: number;
  fn: ResponseInterceptor;
}[] = [];
let nextId = 0;

export const InterceptorManager = {
  addRequest(interceptor: RequestInterceptor): () => void {
    const id = nextId++;
    requestInterceptors.push({ id, fn: interceptor });
    return () => {
      const idx = requestInterceptors.findIndex((i) => i.id === id);
      if (idx !== -1) requestInterceptors.splice(idx, 1);
    };
  },

  addResponse(interceptor: ResponseInterceptor): () => void {
    const id = nextId++;
    responseInterceptors.push({ id, fn: interceptor });
    return () => {
      const idx = responseInterceptors.findIndex((i) => i.id === id);
      if (idx !== -1) responseInterceptors.splice(idx, 1);
    };
  },

  async runRequest(config: RequestConfig): Promise<RequestConfig> {
    let current = config;
    for (const { fn } of requestInterceptors) {
      current = await fn(current);
    }
    return current;
  },

  async runResponse(
    response: Response,
    config: RequestConfig
  ): Promise<Response> {
    let current = response;
    for (const { fn } of responseInterceptors) {
      current = await fn(current, config);
    }
    return current;
  },
};

// ============================================================================
// Built-in interceptors
// ============================================================================

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Adds X-Correlation-ID header to every request */
export const correlationIdInterceptor: RequestInterceptor = (config) => ({
  ...config,
  headers: {
    ...config.headers,
    "X-Correlation-ID": generateUUID(),
  },
});

/** Adds standardized User-Agent header */
export const userAgentInterceptor: RequestInterceptor = (config) => ({
  ...config,
  headers: {
    ...config.headers,
    "X-Client": `react-native-template/${APP_VERSION}`,
  },
});

/** Logs request details as a breadcrumb */
export const requestLoggingInterceptor: ResponseInterceptor = (
  response,
  config
) => {
  Logger.addBreadcrumb("http", `${config.method} ${config.url}`, {
    status: response.status,
  });
  return response;
};

/** HMAC request signing (when enabled) */
export const requestSigningInterceptor: RequestInterceptor = async (config) => {
  if (!SECURITY.REQUEST_SIGNING.ENABLED) return config;

  const timestamp = Date.now();
  const signature = await generateRequestSignature(
    config.method,
    config.url,
    config.body,
    timestamp
  );

  if (!signature) return config;

  return {
    ...config,
    headers: {
      ...config.headers,
      [SECURITY.REQUEST_SIGNING.HEADER_NAME]: signature,
      "X-Request-Timestamp": timestamp.toString(),
    },
  };
};
