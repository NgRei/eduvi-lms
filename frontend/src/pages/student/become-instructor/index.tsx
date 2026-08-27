import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  EditOutlined,
  FileDoneOutlined,
  GlobalOutlined,
  HomeOutlined,
  IdcardOutlined,
  LinkOutlined,
  LogoutOutlined,
  ReadOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import {
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  StepsForm,
} from '@ant-design/pro-components';
import { history, Link, useModel } from '@umijs/max';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Dropdown,
  message,
  Result,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getMyInstructorApplication,
  type InstructorApplication,
  registerAndApplyInstructor,
  submitInstructorApplication,
  updateMyInstructorApplication,
} from '@/services/ant-design-pro/instructorApplication';

const { Title, Paragraph, Text } = Typography;

const formatAppDate = (dateVal?: string) => {
  if (!dateVal) return 'Vừa xong';
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? 'Vừa xong' : d.toLocaleString('vi-VN');
};

const BecomeInstructor: React.FC = () => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  const [loading, setLoading] = useState<boolean>(true);
  const [application, setApplication] = useState<InstructorApplication | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchApplication = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getMyInstructorApplication();
      if (res.success && res.data) {
        setApplication(res.data);
      } else {
        setApplication(null);
      }
    } catch (err: any) {
      console.warn('Could not load instructor application:', err);
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setInitialState((s) => ({ ...s, currentUser: undefined }));
    setApplication(null);
    message.success('Đã đăng xuất!');
  };

  const handleFinish = async (values: any) => {
    try {
      setSubmitting(true);
      if (!currentUser) {
        // Guest: Register account + submit application in one seamless flow!
        const res = await registerAndApplyInstructor({
          email: values.email,
          password: values.password,
          full_name: values.full_name,
          phone_number: values.phone_number,
          headline: values.headline,
          bio: values.bio,
          expertise: values.expertise,
          experience_years: values.experience_years ? parseInt(values.experience_years, 10) : 0,
          education_degree: values.education_degree,
          linkedin_url: values.linkedin_url,
          portfolio_url: values.portfolio_url,
          cv_url: values.cv_url,
          intro_video_url: values.intro_video_url,
          teaching_reason: values.teaching_reason,
          course_proposal: values.course_proposal,
        });

        if (res.success && (res.accessToken || res.token)) {
          localStorage.setItem('auth_token', res.accessToken || res.token || '');
          if (res.refreshToken) {
            localStorage.setItem('refresh_token', res.refreshToken);
          }
          message.success('Đăng ký tài khoản và nộp hồ sơ giảng viên thành công!');

          if (res.user) {
            setInitialState((s) => ({
              ...s,
              currentUser: {
                name: res.user?.full_name,
                email: res.user?.email,
                username: res.user?.username,
                access: res.user?.user_type,
                user_type: res.user?.user_type,
              } as any,
            }));
          }

          if (res.data) {
            setApplication(res.data);
          } else {
            await fetchApplication();
          }
          return true;
        } else {
          message.error(res.error || 'Đăng ký và nộp hồ sơ thất bại, vui lòng thử lại!');
          return false;
        }
      } else if (application && (application.status === 'rejected' || application.status === 'need_info' || isEditing)) {
        const res = await updateMyInstructorApplication(values);
        if (res.success) {
          message.success('Đã cập nhật và nộp lại hồ sơ thành công!');
          setIsEditing(false);
          await fetchApplication();
          return true;
        } else {
          message.error(res.error || 'Không thể cập nhật hồ sơ');
          return false;
        }
      } else {
        const res = await submitInstructorApplication(values);
        if (res.success) {
          message.success('Hồ sơ ứng tuyển giảng viên đã gửi thành công!');
          await fetchApplication();
          return true;
        } else {
          message.error(res.error || 'Không thể gửi hồ sơ');
          return false;
        }
      }
    } catch (err: any) {
      message.error(err?.data?.error || err?.message || 'Có lỗi xảy ra!');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Dedicated Header for Candidate Portal
  const renderNavbar = () => (
    <header
      style={{
        height: 64,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            E
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>Eduvi LMS</span>
        </Link>

        <Divider type="vertical" style={{ height: 24 }} />

        <Tag color="purple" style={{ margin: 0, fontWeight: 600, borderRadius: 6, fontSize: 12, padding: '2px 8px' }}>
          Cổng Ứng tuyển Giảng viên
        </Tag>

        <div style={{ display: 'flex', gap: 20, marginLeft: 20 }}>
          <Link to="/" style={{ color: '#475569', fontSize: 14, fontWeight: 500 }}>
            Trang chủ
          </Link>
          <Link to="/courses" style={{ color: '#475569', fontSize: 14, fontWeight: 500 }}>
            Khám phá Khóa học
          </Link>
        </div>
      </div>

      <div>
        {currentUser ? (
          <Space align="center" size={16}>
            <Tag color="gold" icon={<ClockCircleOutlined />} style={{ borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>
              Ứng viên Giảng viên
            </Tag>

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'dashboard',
                    icon: <HomeOutlined />,
                    label: <Link to="/student/dashboard">Góc học tập</Link>,
                  },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    danger: true,
                    label: 'Đăng xuất',
                    onClick: handleLogout,
                  },
                ],
              }}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#4F46E5' }}>
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <UserOutlined />}
                </Avatar>
                <Text strong style={{ color: '#1E293B' }}>
                  {currentUser.name || currentUser.username}
                </Text>
              </Space>
            </Dropdown>
          </Space>
        ) : (
          <Space size={12}>
            <Button type="text" onClick={() => history.push('/user/login?redirect=/teach')}>
              Đăng nhập
            </Button>
            <Button
              type="primary"
              style={{ background: '#4F46E5', borderColor: '#4F46E5', borderRadius: 8 }}
              onClick={() => history.push('/user/register')}
            >
              Đăng ký học viên
            </Button>
          </Space>
        )}
      </div>
    </header>
  );

  const renderFooter = () => (
    <footer
      style={{
        marginTop: 60,
        padding: '32px 24px',
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        textAlign: 'center',
        color: '#64748B',
        fontSize: 13,
      }}
    >
      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          © {new Date().getFullYear()} <strong>Eduvi LMS</strong> — Nền tảng Giáo dục Trực tuyến Hàng đầu.
        </div>
        <Space split={<Divider type="vertical" />}>
          <Link to="/" style={{ color: '#64748B' }}>Trang chủ</Link>
          <Link to="/courses" style={{ color: '#64748B' }}>Danh sách khóa học</Link>
          <Link to="/teach" style={{ color: '#64748B' }}>Quy trình giảng dạy</Link>
        </Space>
      </div>
    </footer>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        {renderNavbar()}
        <div style={{ textAlign: 'center', padding: '120px 0' }}>
          <Spin size="large" tip="Đang tải dữ liệu hồ sơ ứng tuyển..." />
        </div>
        {renderFooter()}
      </div>
    );
  }

  // If user is already an approved instructor
  if (currentUser?.user_type === 'instructor' || currentUser?.access === 'instructor') {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        {renderNavbar()}
        <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 16px' }}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              textAlign: 'center',
              padding: '40px 20px',
            }}
          >
            <Result
              status="success"
              icon={<TrophyOutlined style={{ color: '#10B981', fontSize: 64 }} />}
              title="Bạn đã là Giảng viên chính thức tại Eduvi LMS!"
              subTitle="Tài khoản của bạn đã được kích hoạt đầy đủ đặc quyền giảng dạy, tạo khóa học và quản trị doanh thu."
              extra={[
                <Button
                  type="primary"
                  key="dashboard"
                  size="large"
                  style={{ background: '#4F46E5', borderColor: '#4F46E5', borderRadius: 8 }}
                  onClick={() => history.push('/instructor/dashboard')}
                >
                  Vào Bảng điều khiển Giảng viên
                </Button>,
                <Button
                  key="courses"
                  size="large"
                  style={{ borderRadius: 8 }}
                  onClick={() => history.push('/instructor/courses/create')}
                >
                  Tạo khóa học mới
                </Button>,
              ]}
            />
          </Card>
        </div>
        {renderFooter()}
      </div>
    );
  }

  // If application exists and is not in editing mode
  if (application && !isEditing) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        {renderNavbar()}
        <div style={{ maxWidth: 1100, margin: '32px auto', padding: '0 16px' }}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              marginBottom: 24,
            }}
          >
            {application.status === 'pending' && (
              <Result
                icon={<ClockCircleOutlined style={{ color: '#F59E0B', fontSize: 60 }} />}
                title="Hồ sơ của bạn đang được Ban Quản trị xét duyệt"
                subTitle="Chúng tôi đã tiếp nhận hồ sơ ứng tuyển của bạn. Đội ngũ kiểm duyệt chất lượng Eduvi LMS sẽ liên hệ và phản hồi kết quả trong vòng 24 - 48 giờ làm việc."
                extra={[
                  <Button key="refresh" onClick={fetchApplication} loading={loading}>
                    Kiểm tra lại trạng thái
                  </Button>,
                ]}
              />
            )}

            {application.status === 'approved' && (
              <Result
                status="success"
                title="Hồ sơ ứng tuyển đã được Phê duyệt!"
                subTitle="Chúc mừng bạn! Vui lòng tải lại trang hoặc đăng nhập lại để truy cập phân hệ Giảng viên."
                extra={[
                  <Button
                    type="primary"
                    key="reload"
                    style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
                    onClick={() => {
                      window.location.href = '/instructor/dashboard';
                    }}
                  >
                    Truy cập Không gian Giảng viên
                  </Button>,
                ]}
              />
            )}

            {application.status === 'rejected' && (
              <div>
                <Result
                  status="error"
                  title="Hồ sơ ứng tuyển chưa được phê duyệt"
                  subTitle="Ban Quản trị đã xem xét hồ sơ và gửi thông tin phản hồi bên dưới. Bạn có thể chỉnh sửa và nộp lại hồ sơ bất cứ lúc nào."
                  extra={[
                    <Button
                      type="primary"
                      key="edit"
                      icon={<EditOutlined />}
                      style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
                      onClick={() => setIsEditing(true)}
                    >
                      Chỉnh sửa & Nộp lại hồ sơ
                    </Button>,
                  ]}
                />

                {application.rejection_reason && (
                  <Alert
                    message="Lý do phản hồi từ Ban Quản trị Eduvi"
                    description={application.rejection_reason}
                    type="warning"
                    showIcon
                    style={{
                      borderRadius: 12,
                      margin: '0 auto 24px auto',
                      maxWidth: 750,
                    }}
                  />
                )}
              </div>
            )}

            <Divider />

            <Title level={4} style={{ marginBottom: 16 }}>
              <FileDoneOutlined style={{ color: '#4F46E5', marginRight: 8 }} />
              Thông tin hồ sơ đã nộp
            </Title>

            <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="middle">
              <Descriptions.Item label="Chức danh / Tiêu đề" span={2}>
                <Text strong>{application.headline}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {application.status === 'pending' && <Tag color="warning">Đang chờ duyệt</Tag>}
                {application.status === 'approved' && <Tag color="success">Đã phê duyệt</Tag>}
                {application.status === 'rejected' && <Tag color="error">Cần cập nhật lại</Tag>}
              </Descriptions.Item>

              <Descriptions.Item label="Lĩnh vực chuyên môn">
                <Tag color="blue">{application.expertise}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Kinh nghiệm">
                <Text strong>{application.experience_years} năm</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Bằng cấp / Trường đào tạo">
                {application.education_degree || 'Chưa cung cấp'}
              </Descriptions.Item>

              <Descriptions.Item label="Số điện thoại">
                {application.phone_number || 'Chưa cung cấp'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày nộp hồ sơ" span={2}>
                {formatAppDate(application.created_at || (application as any).createdAt)}
              </Descriptions.Item>

              <Descriptions.Item label="Giới thiệu bản thân" span={3}>
                <Paragraph style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>
                  {application.bio}
                </Paragraph>
              </Descriptions.Item>

              {application.teaching_reason && (
                <Descriptions.Item label="Mục tiêu giảng dạy" span={3}>
                  <Paragraph style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>
                    {application.teaching_reason}
                  </Paragraph>
                </Descriptions.Item>
              )}

              {application.course_proposal && (
                <Descriptions.Item label="Khóa học dự kiến mở" span={3}>
                  <Paragraph style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>
                    {application.course_proposal}
                  </Paragraph>
                </Descriptions.Item>
              )}

              {application.cv_url && (
                <Descriptions.Item label="CV Đính kèm" span={3}>
                  <a href={application.cv_url} target="_blank" rel="noreferrer">
                    <LinkOutlined style={{ marginRight: 4 }} /> Xem tài liệu CV
                  </a>
                </Descriptions.Item>
              )}

              {application.intro_video_url && (
                <Descriptions.Item label="Video demo / Giới thiệu" span={3}>
                  <a href={application.intro_video_url} target="_blank" rel="noreferrer">
                    <VideoCameraOutlined style={{ marginRight: 4 }} /> Xem Video bài giảng mẫu
                  </a>
                </Descriptions.Item>
              )}

              {application.linkedin_url && (
                <Descriptions.Item label="LinkedIn" span={1}>
                  <a href={application.linkedin_url} target="_blank" rel="noreferrer">
                    <GlobalOutlined style={{ marginRight: 4 }} /> {application.linkedin_url}
                  </a>
                </Descriptions.Item>
              )}

              {application.portfolio_url && (
                <Descriptions.Item label="Portfolio / Website" span={2}>
                  <a href={application.portfolio_url} target="_blank" rel="noreferrer">
                    <GlobalOutlined style={{ marginRight: 4 }} /> {application.portfolio_url}
                  </a>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </div>
        {renderFooter()}
      </div>
    );
  }

  // Application Step Form (for Guest or new Candidate)
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {renderNavbar()}

      <div style={{ maxWidth: 1100, margin: '32px auto', padding: '0 16px' }}>
        {/* Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)',
            borderRadius: 16,
            padding: '36px 32px',
            color: '#fff',
            marginBottom: 24,
            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.3)',
          }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={16}>
              <Badge
                count="Chương trình Tuyển chọn Giảng viên"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: 20,
                  marginBottom: 12,
                }}
              />
              <Title level={2} style={{ color: '#fff', marginTop: 8, marginBottom: 12, fontWeight: 800 }}>
                Đồng hành Giảng dạy & Lan tỏa Tri thức cùng Eduvi
              </Title>
              <Paragraph style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 15, lineHeight: 1.6, marginBottom: 0 }}>
                Hợp tác cùng nền tảng giáo dục Eduvi LMS để tiếp cận hàng nghìn học viên trên khắp cả nước, sử dụng công nghệ giảng dạy hiện đại và hưởng chính sách phân chia doanh thu hấp dẫn.
              </Paragraph>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: 'center' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 12,
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                <CrownOutlined style={{ fontSize: 40, color: '#FCD34D', marginBottom: 8 }} />
                <div style={{ fontSize: 18, fontWeight: 700 }}>Quy trình 3 bước</div>
                <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', marginTop: 4 }}>
                  Điền hồ sơ &rarr; Ban Quản trị Thẩm định &rarr; Kích hoạt Giảng dạy
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Feature Highlights */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                height: '100%',
              }}
            >
              <Space align="start">
                <RocketOutlined style={{ fontSize: 24, color: '#4F46E5', marginTop: 4 }} />
                <div>
                  <Text strong style={{ fontSize: 15 }}>Thu nhập bền vững</Text>
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                    Nhận doanh thu từ mỗi lượt đăng ký khóa học và hỗ trợ thanh toán minh bạch.
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                height: '100%',
              }}
            >
              <Space align="start">
                <SafetyCertificateOutlined style={{ fontSize: 24, color: '#10B981', marginTop: 4 }} />
                <div>
                  <Text strong style={{ fontSize: 15 }}>Bảo vệ bản quyền</Text>
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                    Nội dung bài giảng và tài liệu được mã hóa và bảo vệ bản quyền tối đa.
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                height: '100%',
              }}
            >
              <Space align="start">
                <GlobalOutlined style={{ fontSize: 24, color: '#EC4899', marginTop: 4 }} />
                <div>
                  <Text strong style={{ fontSize: 15 }}>Công cụ chuyên nghiệp</Text>
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                    Hệ thống quản lý bài giảng, bài tập trắc nghiệm, chấm điểm và cấp chứng chỉ tự động.
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Application Form */}
        <Card
          style={{
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Title level={4} style={{ margin: 0 }}>
              {application ? 'Cập nhật hồ sơ ứng tuyển' : 'Mẫu đơn đăng ký Giảng viên'}
            </Title>
            {isEditing && (
              <Button onClick={() => setIsEditing(false)}>Hủy chỉnh sửa</Button>
            )}
          </div>

          <StepsForm
            onFinish={handleFinish}
            formProps={{
              validateMessages: {
                required: 'Vui lòng điền ${label}!',
              },
            }}
            submitter={{
              render: (props, dom) => (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                  {dom}
                </div>
              ),
            }}
          >
            {/* Step 1 for Guests: Account Credentials */}
            {!currentUser && (
              <StepsForm.StepForm
                name="account"
                title="Tài khoản & Liên hệ"
                initialValues={{
                  full_name: '',
                  email: '',
                  password: '',
                  confirm_password: '',
                  phone_number: '',
                }}
              >
                <ProFormText
                  name="full_name"
                  label="Họ và tên của bạn"
                  placeholder="VD: Nguyễn Văn An"
                  rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                />

                <ProFormText
                  name="email"
                  label="Địa chỉ Email"
                  placeholder="VD: giangvien@example.com"
                  tooltip="Dùng để đăng nhập vào hệ thống và nhận kết quả phê duyệt hồ sơ."
                  rules={[
                    { required: true, message: 'Vui lòng nhập địa chỉ email!' },
                    { type: 'email', message: 'Email không đúng định dạng!' },
                  ]}
                />

                <ProFormText.Password
                  name="password"
                  label="Mật khẩu đăng nhập"
                  placeholder="Tối thiểu 6 ký tự"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu!' },
                    { min: 6, message: 'Mật khẩu phải có tối thiểu 6 ký tự!' },
                  ]}
                />

                <ProFormText.Password
                  name="confirm_password"
                  label="Xác nhận mật khẩu"
                  placeholder="Nhập lại mật khẩu đăng nhập"
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                      },
                    }),
                  ]}
                />

                <ProFormText
                  name="phone_number"
                  label="Số điện thoại liên hệ xác minh"
                  placeholder="VD: 0987654321"
                  rules={[
                    {
                      pattern: /^[0-9+() -]{9,15}$/,
                      message: 'Số điện thoại không đúng định dạng!',
                    },
                  ]}
                />
              </StepsForm.StepForm>
            )}

            {/* Step: Professional Info */}
            <StepsForm.StepForm
              name="basic"
              title="Thông tin nghề nghiệp"
              initialValues={{
                headline: application?.headline || '',
                expertise: application?.expertise || 'Lập trình Web & Software Engineering',
                experience_years: application?.experience_years ?? 3,
                bio: application?.bio || '',
              }}
            >
              <ProFormText
                name="headline"
                label="Chức danh / Tiêu đề chuyên môn"
                placeholder="VD: Senior Fullstack Engineer & Tech Lead tại VNG"
                rules={[{ required: true, max: 200 }]}
                tooltip="Tiêu đề này sẽ xuất hiện trên trang cá nhân giảng viên và các khóa học của bạn."
              />

              <ProFormSelect
                name="expertise"
                label="Lĩnh vực chuyên môn chính"
                options={[
                  { label: 'Lập trình Web & Frontend / Backend', value: 'Lập trình Web & Software Engineering' },
                  { label: 'Khoa học Dữ liệu & AI / Machine Learning', value: 'Khoa học Dữ liệu & Trí tuệ Nhân tạo' },
                  { label: 'Thiết kế Giao diện UI/UX & Product Design', value: 'Thiết kế UI/UX & Product Design' },
                  { label: 'Cloud Computing, DevOps & An toàn thông tin', value: 'Cloud Computing & DevOps' },
                  { label: 'Kinh doanh, Tiếp thị & Quản trị Dự án', value: 'Kinh doanh & Quản trị Dự án' },
                  { label: 'Ngoại ngữ & Kỹ năng mềm', value: 'Ngoại ngữ & Kỹ năng mềm' },
                ]}
                rules={[{ required: true }]}
              />

              <ProFormDigit
                name="experience_years"
                label="Số năm kinh nghiệm làm việc / giảng dạy"
                min={0}
                max={50}
                rules={[{ required: true }]}
              />

              <ProFormTextArea
                name="bio"
                label="Giới thiệu bản thân (Bio)"
                placeholder="Tóm tắt kinh nghiệm, các dự án tiêu biểu, thành tích hoặc các tổ chức bạn từng làm việc..."
                rules={[{ required: true, min: 30 }]}
                fieldProps={{
                  rows: 4,
                  showCount: true,
                  maxLength: 1000,
                }}
              />
            </StepsForm.StepForm>

            {/* Step: Qualifications */}
            <StepsForm.StepForm
              name="qualifications"
              title="Bằng cấp & Hồ sơ năng lực"
              initialValues={{
                education_degree: application?.education_degree || '',
                phone_number: application?.phone_number || '',
                linkedin_url: application?.linkedin_url || '',
                portfolio_url: application?.portfolio_url || '',
                cv_url: application?.cv_url || '',
              }}
            >
              <ProFormText
                name="education_degree"
                label="Học vị / Bằng cấp cao nhất & Đơn vị đào tạo"
                placeholder="VD: Thạc sĩ Khoa học Máy tính - Đại học Bách Khoa TP.HCM"
              />

              {currentUser && (
                <ProFormText
                  name="phone_number"
                  label="Số điện thoại liên hệ xác minh"
                  placeholder="VD: 0987654321"
                  rules={[
                    {
                      pattern: /^[0-9+() -]{9,15}$/,
                      message: 'Số điện thoại không đúng định dạng!',
                    },
                  ]}
                />
              )}

              <ProFormText
                name="linkedin_url"
                label="Đường dẫn trang cá nhân LinkedIn"
                placeholder="https://www.linkedin.com/in/username"
                rules={[{ type: 'url', message: 'Vui lòng nhập đúng định dạng link URL!' }]}
              />

              <ProFormText
                name="portfolio_url"
                label="Đường dẫn Portfolio / GitHub / Website cá nhân"
                placeholder="https://github.com/username hoặc https://myportfolio.com"
                rules={[{ type: 'url', message: 'Vui lòng nhập đúng định dạng link URL!' }]}
              />

              <ProFormText
                name="cv_url"
                label="Đường dẫn file CV / Resume đính kèm"
                placeholder="Link Google Drive / Dropbox / Cloud chứa file CV (Hãy mở quyền xem)"
                tooltip="Đính kèm link file CV (PDF) giúp Ban Quản trị xét duyệt hồ sơ nhanh chóng hơn."
                rules={[{ type: 'url', message: 'Vui lòng nhập đúng định dạng link URL!' }]}
              />
            </StepsForm.StepForm>

            {/* Step: Teaching Plan */}
            <StepsForm.StepForm
              name="teaching_plan"
              title="Kế hoạch giảng dạy"
              initialValues={{
                teaching_reason: application?.teaching_reason || '',
                course_proposal: application?.course_proposal || '',
                intro_video_url: application?.intro_video_url || '',
              }}
            >
              <ProFormTextArea
                name="teaching_reason"
                label="Mục tiêu & Động lực bạn muốn giảng dạy tại Eduvi LMS"
                placeholder="Chia sẻ lý do bạn muốn đồng hành cùng cộng đồng học viên Eduvi..."
                fieldProps={{ rows: 3 }}
              />

              <ProFormTextArea
                name="course_proposal"
                label="Đề cương / Ý tưởng khóa học dự kiến bạn muốn phát hành"
                placeholder="VD: Khóa học Master Next.js 14 & Fullstack Architecture - Gồm 8 module từ cơ bản đến nâng cao..."
                fieldProps={{ rows: 4 }}
              />

              <ProFormText
                name="intro_video_url"
                label="Đường dẫn Video bài giảng mẫu / Giới thiệu (YouTube / Google Drive / Loom / Vimeo)"
                placeholder="https://www.youtube.com/watch?v=... hoặc link video demo 3-5 phút"
                tooltip="Video ngắn giới thiệu phương pháp giảng dạy và chất lượng âm thanh/hình ảnh của bạn."
                rules={[{ type: 'url', message: 'Vui lòng nhập đúng định dạng link URL!' }]}
              />
            </StepsForm.StepForm>
          </StepsForm>
        </Card>
      </div>

      {renderFooter()}
    </div>
  );
};

export default BecomeInstructor;
