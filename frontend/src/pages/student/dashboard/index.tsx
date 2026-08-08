import {
  BookOutlined,
  ClockCircleOutlined,
  StarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  message,
  Progress,
  Row,
  Spin,
  Statistic,
  Table,
  Tag,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getStudentDashboard,
  type StudentDashboardData,
} from '@/services/ant-design-pro/dashboard';

const StudentDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] =
    useState<StudentDashboardData | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await getStudentDashboard();
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
      <PageContainer title="Trang học tập của tôi">
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
      title: 'Khóa học đang học',
      value: dashboardData?.stats.active_courses || 0,
      icon: <BookOutlined style={{ color: '#4F46E5', fontSize: 24 }} />,
    },
    {
      title: 'Phút học tích lũy',
      value: dashboardData?.stats.watch_minutes || 0,
      icon: <ClockCircleOutlined style={{ color: '#10B981', fontSize: 24 }} />,
      suffix: 'phút',
    },
    {
      title: 'Bài học đã hoàn thành',
      value: dashboardData?.stats.lessons_completed || 0,
      icon: <TrophyOutlined style={{ color: '#F59E0B', fontSize: 24 }} />,
    },
    {
      title: 'Khóa học đã hoàn thành',
      value: dashboardData?.stats.completed_courses || 0,
      icon: <StarOutlined style={{ color: '#EF4444', fontSize: 24 }} />,
    },
  ];

  const currentCourses =
    dashboardData?.recent_courses.map((course) => ({
      key: course.course_id,
      title: course.title,
      progress: course.progress_percentage,
      instructors: course.instructors.join(', '),
    })) || [];

  const columns = [
    {
      title: 'Tên khóa học',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <strong>{text}</strong>,
    },
    { title: 'Giảng viên', dataIndex: 'instructors', key: 'instructors' },
    {
      title: 'Tiến độ học tập',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <div style={{ width: 150 }}>
          <Progress
            percent={progress}
            size="small"
            status={progress === 100 ? 'success' : 'active'}
          />
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Trang học tập của tôi">
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
                    valueStyle={{
                      fontSize: 24,
                      fontWeight: 'bold',
                      color: '#111827',
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
          <Card
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 12,
            }}
            styles={{ body: { padding: '24px 32px' } }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3
                  style={{
                    color: '#fff',
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  Khám phá khóa học mới
                </h3>
                <p
                  style={{
                    color: 'rgba(255,255,255,0.85)',
                    margin: '8px 0 0',
                    fontSize: 14,
                  }}
                >
                  Hàng trăm khóa học đang chờ bạn khám phá
                </p>
              </div>
              <Button
                type="primary"
                ghost
                size="large"
                style={{ borderColor: '#fff', color: '#fff', fontWeight: 500 }}
                onClick={() => history.push('/courses')}
              >
                Tìm khóa học
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Khóa học đang diễn ra" hoverable>
            <Table
              dataSource={currentCourses}
              columns={columns}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {dashboardData?.recent_activity &&
        dashboardData.recent_activity.length > 0 && (
          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col span={24}>
              <Card title="Hoạt động gần đây" hoverable>
                <Table
                  dataSource={dashboardData.recent_activity.map(
                    (activity, index) => ({
                      key: index,
                      lesson: activity.lesson_title,
                      type: activity.lesson_type,
                      status: activity.is_completed ? 'Hoàn thành' : 'Đang học',
                      updated_at: new Date(
                        activity.updated_at,
                      ).toLocaleDateString('vi-VN'),
                    }),
                  )}
                  columns={[
                    { title: 'Bài học', dataIndex: 'lesson', key: 'lesson' },
                    {
                      title: 'Loại',
                      dataIndex: 'type',
                      key: 'type',
                      render: (type: string) => <Tag>{type}</Tag>,
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status: string) => (
                        <Tag
                          color={
                            status === 'Hoàn thành' ? 'success' : 'processing'
                          }
                        >
                          {status}
                        </Tag>
                      ),
                    },
                    {
                      title: 'Ngày',
                      dataIndex: 'updated_at',
                      key: 'updated_at',
                    },
                  ]}
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
        )}
    </PageContainer>
  );
};

export default StudentDashboard;
