import { LockOutlined } from '@ant-design/icons';
import { Helmet, Link, request, useSearchParams } from '@umijs/max';
import { App, Button, Form, Input, Progress, Result } from 'antd';
import { useState } from 'react';
import { Footer } from '@/components';
import Settings from '../../../../config/defaultSettings';

const passwordStrengthMap: Record<
  string,
  { status: 'success' | 'normal' | 'exception'; text: string; color: string }
> = {
  ok: { status: 'success', text: 'Mạnh', color: '#52c41a' },
  pass: { status: 'normal', text: 'Trung bình', color: '#faad14' },
  poor: { status: 'exception', text: 'Yếu', color: '#ff4d4f' },
};

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { message } = App.useApp();

  const getPasswordStrength = (): string => {
    const value = form.getFieldValue('new_password');
    if (!value) return '';
    if (value.length > 9) return 'ok';
    if (value.length > 5) return 'pass';
    return 'poor';
  };

  const handleSubmit = async (values: {
    new_password: string;
    confirm_password: string;
  }) => {
    setLoading(true);
    try {
      const res = await request('/api/auth/reset-password', {
        method: 'POST',
        data: {
          token,
          new_password: values.new_password,
          confirm_password: values.confirm_password,
        },
      });
      if (res.success) {
        setSuccess(true);
      } else {
        message.error(res.error || 'Có lỗi xảy ra!');
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại!',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#F3F4F6',
        }}
      >
        <Helmet>
          <title>Liên kết không hợp lệ - {Settings.title}</title>
        </Helmet>
        <Result
          status="error"
          title="Liên kết không hợp lệ"
          subTitle="Liên kết đặt lại mật khẩu không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới."
          extra={
            <Button
              type="primary"
              style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
            >
              <Link to="/user/forgot-password">Yêu cầu liên kết mới</Link>
            </Button>
          }
          style={{
            background: '#fff',
            padding: 40,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        />
      </div>
    );
  }

  if (success) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#F3F4F6',
        }}
      >
        <Helmet>
          <title>Đặt lại mật khẩu thành công - {Settings.title}</title>
        </Helmet>
        <Result
          status="success"
          title="Đặt lại mật khẩu thành công!"
          subTitle="Mật khẩu của bạn đã được cập nhật. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới."
          extra={
            <Button
              type="primary"
              size="large"
              style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
            >
              <Link to="/user/login">Đăng nhập ngay</Link>
            </Button>
          }
          style={{
            background: '#fff',
            padding: 40,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        />
      </div>
    );
  }

  const strength = getPasswordStrength();
  const strengthInfo = strength ? passwordStrengthMap[strength] : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundImage:
          "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
        backgroundSize: '100% 100%',
      }}
    >
      <Helmet>
        <title>Đặt lại mật khẩu - {Settings.title}</title>
      </Helmet>
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '32px 0',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '40px 36px',
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img
              alt="logo"
              src="/logo.svg"
              style={{ width: 44, height: 44, marginBottom: 12 }}
            />
            <h2
              style={{
                fontSize: 22,
                fontWeight: 'bold',
                color: '#111827',
                margin: 0,
              }}
            >
              Đặt lại mật khẩu
            </h2>
            <p style={{ color: '#6B7280', marginTop: 8, fontSize: 14 }}>
              Nhập mật khẩu mới cho tài khoản của bạn.
            </p>
          </div>

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="new_password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                { min: 6, message: 'Mật khẩu phải có tối thiểu 6 ký tự!' },
              ]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
              />
            </Form.Item>

            {strengthInfo && (
              <div style={{ marginTop: -16, marginBottom: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 12, color: '#6B7280' }}>
                    Độ mạnh:
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: strengthInfo.color,
                    }}
                  >
                    {strengthInfo.text}
                  </span>
                </div>
                <Progress
                  percent={
                    strength === 'ok' ? 100 : strength === 'pass' ? 60 : 30
                  }
                  status={strengthInfo.status}
                  size="small"
                  showInfo={false}
                />
              </div>
            )}

            <Form.Item
              name="confirm_password"
              dependencies={['new_password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value)
                      return Promise.resolve();
                    return Promise.reject(
                      new Error('Mật khẩu xác nhận không khớp!'),
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="Xác nhận mật khẩu mới"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={{
                  background: '#4F46E5',
                  borderColor: '#4F46E5',
                  height: 44,
                  fontWeight: 500,
                }}
              >
                Đặt lại mật khẩu
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Link
              to="/user/login"
              style={{ color: '#4F46E5', fontWeight: 500 }}
            >
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
