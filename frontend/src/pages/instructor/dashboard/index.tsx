import {
  BookOutlined,
  StarOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Spin, Statistic, Table, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getInstructorDashboard,
  type InstructorDashboardData,
} from '@/services/ant-design-pro/dashboard';

const InstructorDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] =
    useState<InstructorDashboardData | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await getInstructorDashboard();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Trang tổng quan Giảng viên">
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  const stats: Array<{
    title: string;
    value: number;
    icon: React.ReactNode;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
  }> = [
    {
      title: 'Tổng học viên',
      value: dashboardData?.stats.total_students || 0,
      icon: <TeamOutlined style={{ color: '#4F46E5', fontSize: 24 }} />,
    },
    {
      title: 'Khóa học của tôi',
      value: dashboardData?.stats.total_courses || 0,
      icon: <BookOutlined style={{ color: '#10B981', fontSize: 24 }} />,
    },
    {
      title: 'Đánh giá trung bình',
      value: dashboardData?.stats.average_rating || 0,
      icon: <StarOutlined style={{ color: '#F59E0B', fontSize: 24 }} />,
      suffix: '/5',
    },
    {
      title: 'Khóa học đã xuất bản',
      value: dashboardData?.stats.published_courses || 0,
      icon: <TrophyOutlined style={{ color: '#EF4444', fontSize: 24 }} />,
    },
  ];

  const recentEnrollments =
    dashboardData?.recent_enrollments.map((enrollment, index) => ({
      key: index,
      name: enrollment.student_name,
      email: enrollment.student_email,
      course: enrollment.course_title,
      progress: `${enrollment.progress_percentage}%`,
      status:
        enrollment.status === 'completed'
          ? 'Đã hoàn thành'
          : enrollment.status === 'active'
            ? 'Đang học'
            : 'Đã hủy',
      enrolled_at: new Date(enrollment.enrolled_at).toLocaleDateString('vi-VN'),
    })) || [];

  const columns = [
    {
      title: 'Học viên',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Khóa học', dataIndex: 'course', key: 'course' },
    {
      title: 'Tiến độ',
      dataIndex: 'progress',
      key: 'progress',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={
            status === 'Đã hoàn thành'
              ? 'green'
              : status === 'Đang học'
                ? 'processing'
                : 'default'
          }
        >
          {status}
        </Tag>
      ),
    },
    { title: 'Ngày đăng ký', dataIndex: 'enrolled_at', key: 'enrolled_at' },
  ];

  return (
    <PageContainer title="Trang tổng quan Giảng viên">
      <Row gutter={[16, 16]}>
        {stats.map((stat, i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <Card hoverable styles={{ body: { padding: 20 } }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}
                  >
                    {stat.title}
                  </div>
                  <Statistic
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    styles={{
                      content: {
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: '#111827',
                      },
                    }}
                  />
                </div>
                <div
                  style={{
                    background: '#F3F4F6',
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Khóa học của tôi" hoverable>
            <Table
              dataSource={
                dashboardData?.courses.map((course, index) => ({
                  key: index,
                  title: course.title,
                  students: course.total_students,
                  rating: course.rating_avg,
                  status: course.is_published ? 'Đã xuất bản' : 'Bản nháp',
                })) || []
              }
              columns={[
                {
                  title: 'Tên khóa học',
                  dataIndex: 'title',
                  key: 'title',
                  render: (text: string) => <strong>{text}</strong>,
                },
                { title: 'Học viên', dataIndex: 'students', key: 'students' },
                {
                  title: 'Đánh giá',
                  dataIndex: 'rating',
                  key: 'rating',
                  render: (rating: number) => (
                    <Tag color="gold">{rating}/5</Tag>
                  ),
                },
                {
                  title: 'Trạng thái',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => (
                    <Tag color={status === 'Đã xuất bản' ? 'green' : 'default'}>
                      {status}
                    </Tag>
                  ),
                },
              ]}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {recentEnrollments.length > 0 && (
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card title="Đăng ký gần đây" hoverable>
              <Table
                dataSource={recentEnrollments}
                columns={columns}
                pagination={false}
              />
            </Card>
          </Col>
        </Row>
      )}
    </PageContainer>
  );
};

export default InstructorDashboard;
