import { request } from '@umijs/max';

export interface StateType {
  status?: 'ok' | 'error';
  currentAuthority?: 'user' | 'guest' | 'admin';
}

export interface UserRegisterParams {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface RegisterResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    id: string;
    email: string;
    username: string;
    full_name: string;
    user_type: string;
  };
}

export async function fakeRegister(
  params: UserRegisterParams,
): Promise<RegisterResult> {
  return request('/api/auth/register', {
    method: 'POST',
    data: params,
  });
}
