import { useMutation } from '@tanstack/react-query';
import { history, Link } from '@umijs/max';
import {
  Button,
  Col,
  Form,
  Input,
  Popover,
  Progress,
  Row,
  Select,
  Space,
  message,
} from 'antd';
import type { Store } from 'antd/es/form/interface';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { fakeRegister, type RegisterResult } from './service';
import useStyles from './styles';

const FormItem = Form.Item;
const { Option } = Select;

const passwordProgressMap: {
  ok: 'success';
  pass: 'normal';
  poor: 'exception';
} = {
  ok: 'success',
  pass: 'normal',
  poor: 'exception',
};

const Register: FC = () => {
  const { styles } = useStyles();
  const [count, setCount] = useState(0);
  const [open, setVisible] = useState(false);
  const [prefix, setPrefix] = useState('84');
  const [popover, setPopover] = useState(false);
  let interval: number | undefined;

  const passwordStatusMap = {
    ok: (
      <div className={styles.success}>
        <span>Độ bảo mật: Mạnh</span>
      </div>
    ),
    pass: (
      <div className={styles.warning}>
        <span>Độ bảo mật: Trung bình</span>
      </div>
    ),
    poor: (
      <div className={styles.error}>
        <span>Độ bảo mật: Quá ngắn</span>
      </div>
    ),
  };

  const [form] = Form.useForm();
  
  useEffect(() => {
    return () => {
      clearInterval(interval);
    };
  }, [interval]);

  const onGetCaptcha = () => {
    let counts = 59;
    setCount(counts);
    interval = window.setInterval(() => {
      counts -= 1;
      setCount(counts);
      if (counts === 0) {
        clearInterval(interval);
      }
    }, 1000);
    message.success('Mã OTP xác thực giả định là: 1234');
  };

  const getPasswordStatus = () => {
    const value = form.getFieldValue('password');
    if (value && value.length > 9) {
      return 'ok';
    }
    if (value && value.length > 5) {
      return 'pass';
    }
    return 'poor';
  };

  const { isPending: submitting, mutate: register } = useMutation({
    mutationFn: (formValues: Store) => {
      const payload = {
        email: formValues.email,
        password: formValues.password,
        full_name: formValues.name,
        user_type: formValues.role as 'student' | 'instructor',
      };
      return fakeRegister(payload);
    },
    onSuccess: (data: RegisterResult, params) => {
      if (data.success && data.data) {
        message.success('Đăng ký tài khoản thành công!');
        history.push({
          pathname: `/user/register-result?account=${params.email}&username=${data.data.username}`,
        });
      } else {
        message.error(data.error || 'Đăng ký thất bại, vui lòng thử lại!');
      }
    },
    onError: (error: any) => {
      const errMsg = error?.response?.data?.error || error?.message || 'Đăng ký thất bại!';
      message.error(errMsg);
    },
  });

  const onFinish = (values: Store) => {
    register(values);
  };

  const checkConfirm = (_: any, value: string) => {
    const promise = Promise;
    if (value && value !== form.getFieldValue('password')) {
      return promise.reject('Mật khẩu xác nhận không khớp!');
    }
    return promise.resolve();
  };

  const checkPassword = (_: any, value: string) => {
    const promise = Promise;
    if (!value) {
      setVisible(!!value);
      return promise.reject('Vui lòng nhập mật khẩu!');
    }
    if (!open) {
      setVisible(!!value);
    }
    setPopover(!popover);
    if (value.length < 6) {
      return promise.reject('');
    }
    if (value) {
      form.validateFields(['confirm']);
    }
    return promise.resolve();
  };

  const changePrefix = (value: string) => {
    setPrefix(value);
  };

  const renderPasswordProgress = () => {
    const value = form.getFieldValue('password');
    const passwordStatus = getPasswordStatus();
    return value?.length ? (
      <div className={styles[`progress-${passwordStatus}` as keyof typeof styles]}>
        <Progress
          status={passwordProgressMap[passwordStatus]}
          size={6}
          percent={value.length * 10 > 100 ? 100 : value.length * 10}
          showInfo={false}
        />
      </div>
    ) : null;
  };

  return (
    <div className={styles.main}>
      <h3 style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 24 }}>
        Đăng ký tài khoản Eduvi LMS
      </h3>
      <Form form={form} name="UserRegister" onFinish={onFinish}>
        <FormItem
          name="name"
          rules={[
            {
              required: true,
              message: 'Vui lòng nhập họ và tên!',
            },
          ]}
        >
          <Input size="large" placeholder="Họ và tên học viên" />
        </FormItem>

        <FormItem
          name="role"
          initialValue="student"
          rules={[{ required: true }]}
        >
          <Select size="large" placeholder="Bạn đăng ký với vai trò">
            <Option value="student">Học viên (Student)</Option>
            <Option value="instructor">Giảng viên (Instructor)</Option>
          </Select>
        </FormItem>

        <FormItem
          name="email"
          rules={[
            {
              required: true,
              message: 'Vui lòng nhập địa chỉ email!',
            },
            {
              type: 'email',
              message: 'Email không đúng định dạng!',
            },
          ]}
        >
          <Input size="large" placeholder="Địa chỉ Email" />
        </FormItem>

        <Popover
          getPopupContainer={(node) => {
            if (node?.parentNode) {
              return node.parentNode as HTMLElement;
            }
            return node;
          }}
          content={
            open && (
              <div style={{ padding: '4px 0' }}>
                {passwordStatusMap[getPasswordStatus()]}
                {renderPasswordProgress()}
                <div style={{ marginTop: 10 }}>
                  <span>Vui lòng nhập tối thiểu 6 ký tự. Hãy sử dụng mật khẩu khó đoán.</span>
                </div>
              </div>
            )
          }
          overlayStyle={{
            width: 240,
          }}
          placement="right"
          open={open}
        >
          <FormItem
            name="password"
            className={
              form.getFieldValue('password') &&
              form.getFieldValue('password').length > 0 &&
              styles.password
            }
            rules={[
              {
                validator: checkPassword,
              },
            ]}
          >
            <Input
              size="large"
              type="password"
              placeholder="Mật khẩu đăng nhập (tối thiểu 6 ký tự)"
            />
          </FormItem>
        </Popover>

        <FormItem
          name="confirm"
          rules={[
            {
              required: true,
              message: 'Vui lòng xác nhận mật khẩu!',
            },
            {
              validator: checkConfirm,
            },
          ]}
        >
          <Input size="large" type="password" placeholder="Xác nhận mật khẩu" />
        </FormItem>

        <FormItem
          name="mobile"
          rules={[
            {
              required: true,
              message: 'Vui lòng nhập số điện thoại!',
            },
            {
              pattern: /^\d{10,11}$/,
              message: 'Số điện thoại không đúng định dạng!',
            },
          ]}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Select
              size="large"
              value={prefix}
              onChange={changePrefix}
              style={{
                width: '30%',
              }}
            >
              <Option value="84">+84 (VN)</Option>
              <Option value="1">+1 (US)</Option>
            </Select>

            <Input size="large" placeholder="Số điện thoại di động" />
          </Space.Compact>
        </FormItem>

        <Row gutter={8}>
          <Col span={16}>
            <FormItem
              name="captcha"
              rules={[
                {
                  required: true,
                  message: 'Vui lòng nhập mã xác thực OTP!',
                },
              ]}
            >
              <Input size="large" placeholder="Mã xác thực OTP" />
            </FormItem>
          </Col>
          <Col span={8}>
            <Button
              size="large"
              disabled={!!count}
              className={styles.getCaptcha}
              onClick={onGetCaptcha}
              style={{ width: '100%', fontSize: 13, padding: 0 }}
            >
              {count ? `${count} giây` : 'Nhận mã OTP'}
            </Button>
          </Col>
        </Row>
        <FormItem>
          <div className={styles.footer}>
            <Button
              size="large"
              loading={submitting}
              className={styles.submit}
              type="primary"
              htmlType="submit"
              block
              style={{ background: '#4F46E5', borderColor: '#4F46E5', height: 40 }}
            >
              <span>Đăng ký thành viên</span>
            </Button>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Link to="/user/login" prefetch>
                <span style={{ color: '#4F46E5' }}>Đăng nhập với tài khoản có sẵn</span>
              </Link>
            </div>
          </div>
        </FormItem>
      </Form>
    </div>
  );
};

export default Register;
