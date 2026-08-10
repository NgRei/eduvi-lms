import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';

// Initialize dayjs plugins globally
dayjs.extend(relativeTime);

import { App } from 'antd';
import {
  AvatarDropdown,
  ErrorBoundary,
  Footer,
  OfflineBanner,
} from '@/components';
import { currentUser as queryCurrentUser } from '@/services/ant-design-pro/api';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';

// Bắt lỗi F12 cho AI ở chế độ development
if (isDev && typeof window !== 'undefined') {
  (window as any).__aiErrorsList__ = [];

  const addError = (mdLog: string) => {
    if (!(window as any).__aiErrorsList__) {
      (window as any).__aiErrorsList__ = [];
    }
    const list = (window as any).__aiErrorsList__;
    if (!list.includes(mdLog)) {
      if (list.length >= 10) {
        list.shift();
      }
      list.push(mdLog);
    }
    const combinedLog = list.join('\n\n---\n\n');
    showAIButton(combinedLog);
  };

  // Xuất hàm addError ra global window để dùng ở các module khác (ví dụ: requestErrorConfig)
  (window as any).__addAiError__ = (mdLog: string) => {
    addError(mdLog);
  };

  // Bắt lỗi hệ thống (như undefined is not a function, syntax error...) và lỗi tải tài nguyên (ảnh, script, css)
  window.addEventListener(
    'error',
    (event) => {
      const target = event.target;
      // Kiểm tra nếu là lỗi tải tài nguyên (không nổi bọt - non-bubbling, target là một phần tử HTML)
      if (
        target &&
        (target instanceof HTMLImageElement ||
          target instanceof HTMLScriptElement ||
          target instanceof HTMLLinkElement)
      ) {
        const src = (target as any).src || (target as any).href;
        const tagName = target.tagName.toLowerCase();
        const mdLog = `### 🔴 Resource Load Error\n- **Element:** &lt;${tagName}&gt;\n- **URL:** ${src}\n- **Details:** Không thể tải tài nguyên (Ví dụ: lỗi kết nối hoặc ảnh placeholder bị hỏng)`;
        addError(mdLog);
        return;
      }

      // Các lỗi JS Runtime thông thường
      const mdLog = `### 🔴 Frontend Runtime Error\n- **Message:** ${event.message}\n- **File:** ${event.filename} (Line: ${event.lineno})\n- **Stack Trace:**\n\`\`\`javascript\n${event.error?.stack || 'N/A'}\n\`\`\``;
      addError(mdLog);
    },
    true,
  ); // Sử dụng capturing phase để bắt cả lỗi tải ảnh/script/css không nổi bọt

  // Bắt lỗi Unhandled Promise Rejection
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    let details = '';
    if (reason && typeof reason === 'object') {
      if (reason instanceof Error) {
        details = reason.stack || reason.message;
      } else {
        try {
          details = JSON.stringify(reason, null, 2);
        } catch {
          details = String(reason);
        }
      }
    } else {
      details = String(reason);
    }
    const mdLog = `### 🔴 Unhandled Promise Rejection\n**Details:**\n\`\`\`javascript\n${details || 'N/A'}\n\`\`\``;
    addError(mdLog);
  });

  // Bắt lỗi từ console.error() hoặc các API trả về lỗi
  const originalConsoleError = console.error;
  const customConsoleError = (...args: any[]) => {
    originalConsoleError.apply(console, args); // Vẫn in ra F12 như bình thường

    const errorDetails = args
      .map((arg) => {
        if (arg && typeof arg === 'object') {
          if (arg instanceof Error) {
            return arg.stack || arg.message;
          }
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg); // Đề phòng lỗi cấu trúc vòng (circular reference)
          }
        }
        return String(arg);
      })
      .join('\n');

    const mdLog = `### 🔴 Console Error\n**Details:**\n\`\`\`javascript\n${errorDetails}\n\`\`\``;
    addError(mdLog);
  };

  // Khóa cứng console.error bằng Object.defineProperty để ngăn UmiJS/React/Antd ghi đè
  try {
    Object.defineProperty(console, 'error', {
      get() {
        return customConsoleError;
      },
      set() {
        /* Không cho ghi đè */
      },
      configurable: true,
    });
  } catch (e) {
    console.error = customConsoleError;
  }

  // Khóa và bắt thêm console.warn để không bỏ sót các cảnh báo nghiêm trọng/lỗi API warn
  const originalConsoleWarn = console.warn;
  const customConsoleWarn = (...args: any[]) => {
    originalConsoleWarn.apply(console, args);
    const warnDetails = args
      .map((arg) => {
        if (arg && typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join('\n');
    const logStr = warnDetails.toLowerCase();
    if (
      logStr.includes('error') ||
      logStr.includes('failed') ||
      logStr.includes('exception') ||
      logStr.includes('invalid')
    ) {
      const mdLog = `### 🟡 Console Warning (Severe)\n**Details:**\n\`\`\`javascript\n${warnDetails}\n\`\`\``;
      addError(mdLog);
    }
  };

  try {
    Object.defineProperty(console, 'warn', {
      get() {
        return customConsoleWarn;
      },
      set() {
        /* Không cho ghi đè */
      },
      configurable: true,
    });
  } catch (e) {
    console.warn = customConsoleWarn;
  }

  // In thông tin kiểm tra hệ thống bắt lỗi
  originalConsoleError.apply(console, [
    '🤖 [Antigravity] F12 Error Monitor loaded and locked successfully!',
  ]);

  // Hàm hiển thị nút Copy với thiết kế premium/giao diện đẹp mắt
  function showAIButton(markdownText: string) {
    let container = document.getElementById('ai-error-container');
    if (!container) {
      if (!document.getElementById('ai-error-styles')) {
        const style = document.createElement('style');
        style.id = 'ai-error-styles';
        style.innerHTML = `
          #ai-error-container {
            position: fixed;
            bottom: 24px;
            left: 24px;
            z-index: 100000;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 16px;
            background: rgba(239, 68, 68, 0.95);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.4), 0 8px 10px -6px rgba(239, 68, 68, 0.4);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            font-weight: 600;
            animation: ai-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            transition: all 0.3s ease;
          }
          @keyframes ai-slide-in {
            from { transform: translateY(50px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          .ai-error-icon {
            font-size: 16px;
            animation: ai-pulse 2s infinite;
          }
          @keyframes ai-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
          .ai-error-copy-btn {
            background: white;
            color: #ef4444;
            border: none;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .ai-error-copy-btn:hover {
            background: #fecaca;
            transform: translateY(-1px);
          }
          .ai-error-copy-btn:active {
            transform: translateY(0);
          }
          .ai-error-close-btn {
            background: transparent;
            color: rgba(255, 255, 255, 0.8);
            border: none;
            font-size: 18px;
            cursor: pointer;
            padding: 0 4px;
            line-height: 1;
            transition: color 0.2s ease;
          }
          .ai-error-close-btn:hover {
            color: white;
          }
        `;
        document.head.appendChild(style);
      }

      container = document.createElement('div');
      container.id = 'ai-error-container';
      container.innerHTML = `
        <span class="ai-error-icon">🤖</span>
        <span>Phát hiện lỗi F12!</span>
        <button class="ai-error-copy-btn">Copy lỗi cho AI</button>
        <button class="ai-error-close-btn" title="Đóng">×</button>
      `;
      document.body.appendChild(container);

      const closeBtn = container.querySelector(
        '.ai-error-close-btn',
      ) as HTMLElement;
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        (window as any).__aiErrorsList__ = []; // Làm sạch danh sách lỗi khi chủ động tắt nút
        container?.remove();
      };
    }

    const copyBtn = container.querySelector(
      '.ai-error-copy-btn',
    ) as HTMLElement;
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(markdownText).then(() => {
        copyBtn.innerHTML = '✅ Đã Copy!';
        copyBtn.style.color = '#10B981';
        setTimeout(() => {
          copyBtn.innerHTML = 'Copy lỗi cho AI';
          copyBtn.style.color = '#ef4444';
        }, 2000);
      });
    };
  }
}

const checkIsPublic = (pathname: string): boolean => {
  if (!pathname) return false;
  const cleanPath = pathname.split('?')[0].split('#')[0];
  if (cleanPath === '/' || cleanPath === loginPath) return true;
  if (
    cleanPath.startsWith('/user/') ||
    cleanPath === '/courses' ||
    cleanPath.startsWith('/courses/')
  ) {
    return true;
  }
  return false;
};

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  settingDrawerOpen?: boolean;
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      return msg.data;
    } catch (_error) {
      const { pathname, search, hash } = history.location;
      if (!checkIsPublic(pathname)) {
        history.replace(
          `${loginPath}?redirect=${encodeURIComponent(pathname + search + hash)}`,
        );
      }
    }
    return undefined;
  };

  const currentUser = await fetchUserInfo();

  return {
    fetchUserInfo,
    currentUser,
    settings: defaultSettings as Partial<LayoutSettings>,
    settingDrawerOpen: false,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    menuItemRender: (item, dom) => {
      if (item.path) {
        return (
          <Link to={item.path} prefetch>
            {dom}
          </Link>
        );
      }
      return dom;
    },
    actionsRender: () => [],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: initialState?.currentUser?.name,
      render: (_, avatarChildren) => (
        <AvatarDropdown>{avatarChildren}</AvatarDropdown>
      ),
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      if (
        !initialState?.currentUser &&
        !checkIsPublic(location.pathname)
      ) {
        history.replace(
          `${loginPath}?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`,
        );
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    links: isDev
      ? [
          <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
            <LinkOutlined />
            <span>OpenAPI 文档</span>
          </Link>,
        ]
      : [],
    // Replace ProLayout's default ErrorBoundary with our offline-aware version,
    // so chunk load errors show friendly messages instead of "Something went wrong."
    ErrorBoundary,
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          <SettingDrawer
            disableUrlParams
            enableDarkTheme
            collapse={initialState?.settingDrawerOpen}
            onCollapseChange={(open) => {
              setInitialState((s) => ({
                ...s,
                settingDrawerOpen: open,
              }));
            }}
            settings={initialState?.settings}
            onSettingChange={(settings) => {
              setInitialState((s) => ({
                ...s,
                settings,
              }));
            }}
          />
        </>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  baseURL: isDev ? '' : 'https://pro-api.ant-design-demo.workers.dev',
  ...errorConfig,
};

export function rootContainer(container: React.ReactNode) {
  return (
    <App>
      <OfflineBanner />
      <ErrorBoundary>{container}</ErrorBoundary>
    </App>
  );
}
