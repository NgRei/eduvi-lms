import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { getIntl, request } from '@umijs/max';
import { message, notification } from 'antd';

// Dedupe: nhiều request 403 cùng lúc chỉ kích hoạt MỘT lần refresh.
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = (refreshToken: string): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = request<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
  }>('/api/auth/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { refreshToken },
    skipErrorHandler: true,
  })
    .then((res) => {
      if (!res?.success || !res.accessToken) {
        throw new Error('Refresh token failed');
      }
      localStorage.setItem('auth_token', res.accessToken);
      if (res.refreshToken) {
        localStorage.setItem('refresh_token', res.refreshToken);
      }
      return res.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  const { pathname } = window.location;
  if (pathname !== '/user/login') {
    window.location.href = `/user/login?redirect=${encodeURIComponent(pathname)}`;
  }
};

// 错误处理方案： 错误类型
enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}
// 与后端约定的响应数据格式
interface ResponseStructure {
  success: boolean;
  data: unknown;
  errorCode?: number;
  errorMessage?: string;
  showType?: ErrorShowType;
}

/**
 * @name 错误处理
 * pro 自带的错误处理， 可以在这里做自己的改动
 * @doc https://umijs.org/docs/max/request#配置
 */
export const errorConfig: RequestConfig = {
  // 错误处理： umi@3 的错误处理方案。
  errorConfig: {
    // 错误抛出
    errorThrower: (res) => {
      const { success, data, errorCode, errorMessage, showType } =
        res as unknown as ResponseStructure;
      if (!success) {
        const error: any = new Error(errorMessage);
        error.name = 'BizError';
        error.info = { errorCode, errorMessage, showType, data };
        throw error; // 抛出自制的错误
      }
    },
    // 错误接收及处理
    errorHandler: (error: any, opts: any) => {
      // Bắt lỗi API lỗi gửi lên nút F12 Copy cho AI
      if (typeof window !== 'undefined' && (window as any).__addAiError__) {
        const errorMsg =
          error.errorMessage || error.message || 'API Request Failed';
        const url = error.config?.url || error.request?.responseURL || 'N/A';
        const status = error.response?.status || error.info?.errorCode || 'N/A';
        let responseData = '';
        try {
          const data = error.response?.data || error.info?.data;
          responseData = data ? JSON.stringify(data, null, 2) : 'N/A';
        } catch {
          responseData = 'Non-serializable response';
        }

        const mdLog = `### 🔴 API Request Error\n- **URL:** ${url}\n- **Status/Code:** ${status}\n- **Message:** ${errorMsg}\n- **Response/Context:**\n\`\`\`json\n${responseData}\n\`\`\``;
        (window as any).__addAiError__(mdLog);
      }

      if (opts?.skipErrorHandler) throw error;
      // 我们的 errorThrower 抛出的错误。
      if (error.name === 'BizError') {
        const errorInfo: ResponseStructure | undefined = error.info;
        if (errorInfo) {
          const { errorMessage, errorCode } = errorInfo;
          switch (errorInfo.showType) {
            case ErrorShowType.SILENT:
              // do nothing
              break;
            case ErrorShowType.WARN_MESSAGE:
              message.warning(errorMessage);
              break;
            case ErrorShowType.ERROR_MESSAGE:
              message.error(errorMessage);
              break;
            case ErrorShowType.NOTIFICATION:
              notification.open({
                title: errorCode,
                description: errorMessage,
              });
              break;
            case ErrorShowType.REDIRECT:
              window.location.href = '/user/login';
              break;
            default:
              message.error(errorMessage);
          }
        }
      } else if (error.response) {
        // Axios 的错误
        // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
        message.error(`Response status:${error.response.status}`);
      } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
        message.error(
          getIntl().formatMessage({
            id: 'app.request.offline',
            defaultMessage:
              'Network unavailable. Please check your connection and try again.',
          }),
        );
      } else if (error.request) {
        message.error('None response! Please retry.');
      } else {
        message.error('Request error, please retry.');
      }
    },
  },

  // 请求拦截器
  requestInterceptors: [
    (config: RequestOptions) => {
      // 拦截请求配置，进行个性化处理。
      const token = localStorage.getItem('auth_token');
      const headers = { ...config.headers };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      return { ...config, headers };
    },
  ],

  // 响应拦截器
  responseInterceptors: [
    // Tự động làm mới access token khi hết hạn (403), rồi retry request gốc.
    [
      (response: any) => response,
      async (error: any): Promise<any> => {
        const { config, response } = error;
        const status = response?.status;
        const url: string = config?.url || '';

        // Chỉ xử lý 401/403 do token hết hạn. Không đụng tới chính các endpoint auth.
        const isAuthEndpoint =
          url.includes('/api/auth/login') ||
          url.includes('/api/auth/refresh-token') ||
          url.includes('/api/auth/register');

        if (
          (status === 403 || status === 401) &&
          config &&
          !config.__isRetryRequest &&
          !isAuthEndpoint
        ) {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            redirectToLogin();
            return Promise.reject(error);
          }

          try {
            const newToken = await refreshAccessToken(refreshToken);
            // Gắn token mới và retry request gốc một lần
            config.__isRetryRequest = true;
            config.headers = {
              ...(config.headers || {}),
              Authorization: `Bearer ${newToken}`,
            };
            return request(config.url, config);
          } catch (refreshErr) {
            // Refresh thất bại -> phiên đăng nhập đã hết, về trang login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            redirectToLogin();
            return Promise.reject(refreshErr);
          }
        }

        return Promise.reject(error);
      },
    ],
  ],
};
