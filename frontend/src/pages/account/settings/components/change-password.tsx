import { LockOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';
import { App, Button, Form, Input, Progress } from 'antd';
import React, { useState } from 'react';

const passwordStrengthMap: Record<
  string,
  { status: 'success' | 'normal' | 'exception'; text: string; color: string }
> = {
  ok: { status: 'success', text: 'Mạnh', color: '#52c41a' },
  pass: { status: 'normal', text: 'Trung bình', color: '#faad14' },
  poor: { status: 'exception', text: 'Yếu', color: '#ff4d4f' },
};

const ChangePasswordView: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const getPasswordStrength = (): string => {
    const value = form.getFieldValue('new_password');
    if (!value) return '';
    if (value.length > 9) return 'ok';
    if (value.length > 5) return 'pass';
    return 'poor';
  };

  const handleSubmit = async (values: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }) => {
    setLoading(true);
    try {
      const res = await request('/api/auth/change-password', {
        method: 'PUT',
        data: values,
      });
      if (res.success) {
        message.success('Đổi mật khẩu thành công!');
        form.resetFields();
      } else {
        message.error(res.error || 'Đổi mật khẩu thất bại!');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.error || 'Đổi mật khẩu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();
  const strengthInfo = strength ? passwordStrengthMap[strength] : null;

  return (
    <div style={{ maxWidth: 480 }}>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 24,
          color: '#111827',
        }}
      >
        Đổi mật khẩu
      </h3>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="old_password"
          label="Mật khẩu hiện tại"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' },
          ]}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined />}
            placeholder="Nhập mật khẩu hiện tại"
          />
        </Form.Item>

        <Form.Item
          name="new_password"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
            { min: 6, message: 'Mật khẩu phải có tối thiểu 6 ký tự!' },
          ]}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined />}
            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
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
              <span style={{ fontSize: 12, color: '#6B7280' }}>Độ mạnh:</span>
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
              percent={strength === 'ok' ? 100 : strength === 'pass' ? 60 : 30}
              status={strengthInfo.status}
              size="small"
              showInfo={false}
            />
          </div>
        )}

        <Form.Item
          name="confirm_password"
          label="Xác nhận mật khẩu mới"
          dependencies={['new_password']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
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
            placeholder="Nhập lại mật khẩu mới"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              background: '#4F46E5',
              borderColor: '#4F46E5',
              height: 40,
              fontWeight: 500,
              minWidth: 160,
            }}
          >
            Cập nhật mật khẩu
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ChangePasswordView;
