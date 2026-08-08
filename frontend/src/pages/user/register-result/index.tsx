import { Link, useSearchParams } from '@umijs/max';
import { Button, Card, Result } from 'antd';
import React from 'react';
import useStyles from './style.style';

const RegisterResult: React.FC<Record<string, unknown>> = () => {
  const { styles } = useStyles();
  const [params] = useSearchParams();

  const email = params?.get('account') || 'student@gmail.com';
  const username = params?.get('username') || 'annv@123';

  const actions = (
    <div className={styles.actions}>
      <Link to="/user/login" prefetch>
        <Button
          size="large"
          type="primary"
          style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
        >
          Đăng nhập ngay
        </Button>
      </Link>
      <Link to="/user/login" prefetch>
        <Button size="large" style={{ marginLeft: 8 }}>
          Quay lại
        </Button>
      </Link>
    </div>
  );

  return (
    <Result
      className={styles.registerResult}
      status="success"
      title={
        <div
          className={styles.title}
          style={{ fontSize: 22, fontWeight: 'bold' }}
        >
          Đăng ký tài khoản thành công!
        </div>
      }
      subTitle={
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#4B5563', marginBottom: 20 }}>
            Chúc mừng bạn đã trở thành thành viên của đại gia đình **Eduvi
            LMS**. Dưới đây là thông tin tài khoản của bạn:
          </p>
          <Card
            style={{
              background: '#F9FAFB',
              border: '1px dashed #D1D5DB',
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <div style={{ margin: '8px 0', fontSize: 14 }}>
              <strong>Địa chỉ Email:</strong>{' '}
              <span style={{ color: '#4F46E5' }}>{email}</span>
            </div>
            <div style={{ margin: '8px 0', fontSize: 14 }}>
              <strong>Tên tài khoản (Username):</strong>{' '}
              <span
                style={{ color: '#10B981', fontWeight: 'bold', fontSize: 16 }}
              >
                {username}
              </span>
            </div>
          </Card>
          <p style={{ fontSize: 13, color: '#6B7280' }}>
            Hệ thống đã kích hoạt tài khoản của bạn ngay lập tức. Bạn có thể sử
            dụng Email hoặc Username phía trên cùng mật khẩu đã đăng ký để đăng
            nhập hệ thống.
          </p>
        </div>
      }
      extra={actions}
    />
  );
};

export default RegisterResult;
