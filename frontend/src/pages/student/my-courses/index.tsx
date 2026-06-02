import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Col, Empty, Progress, Row, Spin, Tabs, message } from 'antd';
import { history } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import { getMyEnrollments, type Enrollment } from '@/services/ant-design-pro/enrollments';

const MyCourses: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeEnrollments, setActiveEnrollments] = useState<Enrollment[]>([]);
  const [completedEnrollments, setCompletedEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const [activeRes, completedRes] = await Promise.all([
        getMyEnrollments({ status: 'active', limit: 50 }),
        getMyEnrollments({ status: 'completed', limit: 50 }),
      ]);
      if (activeRes.success) setActiveEnrollments(activeRes.data);
      if (completedRes.success) setCompletedEnrollments(completedRes.data);
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
      message.error('Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  };

  const renderCourseGrid = (enrollments: Enrollment[], isCompleted: boolean) => {
    if (enrollments.length === 0) {
      return (
        <Empty description={isCompleted ? 'Bạn chưa hoàn thành khóa học nào.' : 'Bạn chưa đăng ký khóa học nào.'}>
          {!isCompleted && (
            <Button type="primary" onClick={() => history.push('/courses')}>
              Khám phá khóa học
            </Button>
          )}
        </Empty>
      );
    }

    return (
      <Row gutter={[16, 16]}>
        {enrollments.map((enrollment) => {
          const course = enrollment.course;
          if (!course) return null;
          const instructorName = course.instructors?.[0]?.full_name || 'Chưa rõ';
          return (
            <Col xs={24} sm={12} md={8} key={enrollment.id}>
              <Card
                hoverable
                cover={
                  <img
                    alt={course.title}
                    src={course.thumbnail || 'https://via.placeholder.com/300x160?text=Course'}
                    style={{ height: 160, objectFit: 'cover' }}
                  />
                }
                actions={[
                  <Button
                    key="study-btn"
                    type="primary"
                    style={{ width: '85%' }}
                    onClick={() => history.push(`/courses/${course.id}`)}
                  >
                    {isCompleted ? 'Xem lại bài học' : 'Tiếp tục học bài'}
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={<div style={{ whiteSpace: 'normal', height: 48, overflow: 'hidden' }}>{course.title}</div>}
                  description={
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: '#6B7280' }}>GV: {instructorName}</span>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <span style={{ fontSize: 13 }}>Tiến độ: </span>
                        <Progress
                          percent={Math.round(enrollment.progress_percentage)}
                          size="small"
                          status={isCompleted ? 'success' : 'active'}
                        />
                      </div>
                      {isCompleted && enrollment.completed_at && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#10B981', fontWeight: 'bold' }}>
                          Hoàn thành ngày: {new Date(enrollment.completed_at).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>
                  }
                />
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  if (loading) {
    return (
      <PageContainer title="Khóa học của tôi">
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Khóa học của tôi">
      <Card>
        <Tabs
          defaultActiveKey="active"
          items={[
            {
              key: 'active',
              label: `Đang học (${activeEnrollments.length})`,
              children: renderCourseGrid(activeEnrollments, false),
            },
            {
              key: 'completed',
              label: `Đã hoàn thành (${completedEnrollments.length})`,
              children: renderCourseGrid(completedEnrollments, true),
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default MyCourses;
