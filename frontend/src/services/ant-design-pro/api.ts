// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取当前的用户 GET /api/auth/me */
export async function currentUser(options?: { [key: string]: any }) {
  const response = await request<{
    success: boolean;
    data?: {
      id: string;
      email: string;
      username: string;
      full_name: string;
      user_type: string;
      is_active: boolean;
      created_at: string;
      profile?: {
        date_of_birth?: string;
        phone?: string;
        address?: string;
        school_name?: string;
        grade_level?: string;
        expertise?: string;
        experience_years?: number;
        degree?: string;
        linkedin_url?: string;
        total_students?: number;
        rating_avg?: number;
      } | null;
    };
  }>('/api/auth/me', {
    method: 'GET',
    ...(options || {}),
  });

  if (response && response.success && response.data) {
    const user = response.data;
    return {
      data: {
        userid: user.id,
        name: user.full_name || user.username,
        email: user.email,
        username: user.username,
        access: user.user_type,
        user_type: user.user_type,
        created_at: user.created_at,
        profile: user.profile,
        avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
      } as API.CurrentUser
    };
  }

  return { data: undefined };
}

/** 退出登录接口 POST /api/login/outLogin */
export async function outLogin(options?: { [key: string]: any }) {
  const refreshToken = localStorage.getItem('refresh_token');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  // Best-effort: thu hồi refresh token phía server, bỏ qua nếu lỗi
  if (refreshToken) {
    try {
      await request('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { refreshToken },
        skipErrorHandler: true,
        ...(options || {}),
      });
    } catch {
      // ignore
    }
  }
  return { success: true };
}

/** 登录接口 POST /api/auth/login */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
  try {
    const response = await request<{
      success: boolean;
      token?: string;
      accessToken?: string;
      refreshToken?: string;
      user?: {
        id: number | string;
        email: string;
        username: string;
        full_name: string;
        user_type: string;
      };
    }>('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        usernameOrEmail: body.username,
        password: body.password,
      },
      skipErrorHandler: true,
      ...(options || {}),
    });

    if (response && response.success && (response.accessToken || response.token)) {
      localStorage.setItem('auth_token', response.accessToken || response.token || '');
      if ((response as any).refreshToken) {
        localStorage.setItem('refresh_token', (response as any).refreshToken);
      }
      return {
        status: 'ok',
        type: 'account',
        currentAuthority: response.user?.user_type,
      };
    }

    return {
      status: 'error',
      type: 'account',
    };
  } catch (error) {
    return {
      status: 'error',
      type: 'account',
    };
  }
}

/** 此处后端没有提供注释 GET /api/notices */
export async function getNotices(options?: { [key: string]: any }) {
  return request<API.NoticeIconList>('/api/notices', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取规则列表 GET /api/rule */
export async function rule(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.RuleList>('/api/rule', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 更新规则 PUT /api/rule */
export async function updateRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'update',
      ...(options || {}),
    },
  });
}

/** 新建规则 POST /api/rule */
export async function addRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'post',
      ...(options || {}),
    },
  });
}

/** 删除规则 DELETE /api/rule */
export async function removeRule(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/rule', {
    method: 'POST',
    data: {
      method: 'delete',
      ...(options || {}),
    },
  });
}
