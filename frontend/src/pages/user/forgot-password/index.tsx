import { MailOutlined } from '@ant-design/icons';
import { Helmet, history, Link, request } from '@umijs/max';
import { App, Button, Form, Input, Result } from 'antd';
import { useState } from 'react';
import { Footer } from '@/components';
import Settings from '../../../../config/defaultSettings';

const ForgotPassword: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { message } = App.useApp();

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      const res = await request('/api/auth/forgot-password', {
        method: 'POST',
        data: { email: values.email },
      });
      if (res.success) {
        setSubmittedEmail(values.email);
        setSubmitted(true);
      } else {
        message.error(res.error || 'Có lỗi xảy ra, vui lòng thử lại!');
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại!',
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
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
          <title>Kiểm tra email - {Settings.title}</title>
        </Helmet>
        <Result
          status="success"
          title="Yêu cầu đã được gửi!"
          subTitle={
            <div style={{ maxWidth: 420 }}>
              <p style={{ color: '#4B5563', marginBottom: 8 }}>
                Nếu tài khoản{' '}
                <strong style={{ color: '#4F46E5' }}>{submittedEmail}</strong>{' '}
                tồn tại trong hệ thống, chúng tôi đã gửi email hướng dẫn đặt lại
                mật khẩu.
              </p>
              <p style={{ color: '#6B7280', fontSize: 13 }}>
                Vui lòng kiểm tra hộp thư (và thư mục spam). Liên kết sẽ hết hạn
                sau 15 phút.
              </p>
            </div>
          }
          extra={[
            <Button
              key="login"
              type="primary"
              style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
            >
              <Link to="/user/login">Quay lại đăng nhập</Link>
            </Button>,
            <Button
              key="resend"
              onClick={() => {
                setSubmitted(false);
                form.resetFields();
              }}
            >
              Gửi lại
            </Button>,
          ]}
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
        <title>Quên mật khẩu - {Settings.title}</title>
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
              Quên mật khẩu?
            </h2>
            <p style={{ color: '#6B7280', marginTop: 8, fontSize: 14 }}>
              Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu
              cho bạn.
            </p>
          </div>

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập địa chỉ email!' },
                { type: 'email', message: 'Email không đúng định dạng!' },
              ]}
            >
              <Input
                size="large"
                prefix={<MailOutlined />}
                placeholder="Địa chỉ email đã đăng ký"
                autoFocus
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
                Gửi liên kết đặt lại
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

export default ForgotPassword;
