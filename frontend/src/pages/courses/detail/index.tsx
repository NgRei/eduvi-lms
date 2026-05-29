import { PageContainer } from '@ant-design/pro-components';
import {
  Avatar, Button, Card, Col, Divider, Empty, List, message,
  Row, Spin, Statistic, Tag, Typography
} from 'antd';
import { history, useParams, useModel } from '@umijs/max';
import {
  BookOutlined, CheckCircleOutlined, ClockCircleOutlined,
  PlayCircleOutlined, StarOutlined, TeamOutlined, UserOutlined
} from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { getCourseById, type CourseDetail } from '@/services/ant-design-pro/courses';
import { enrollCourse } from '@/services/ant-design-pro/enrollments';

const { Title, Text, Paragraph } = Typography;

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [course, setCourse] = useState<CourseDetail | null>(null);

  useEffect(() => {
    if (id) fetchCourse(id);
  }, [id]);

  const fetchCourse = async (courseId: string) => {
    try {
      setLoading(true);
      const res = await getCourseById(courseId);
      if (res.success) setCourse(res.data);
    } catch (err) {
      console.error('Failed to fetch course:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!currentUser) {
      history.push('/user/login');
      return;
    }
    if (!id) return;
    try {
      setEnrolling(true);
      const res = await enrollCourse(id);
      if (res.success) {
        message.success('Đăng ký khóa học thành công!');
        fetchCourse(id);
      }
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể đăng ký khóa học');
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartLearning = () => {
    if (!course) return;
    const firstLesson = course.lessons?.find((l) => l.is_preview || true);
    if (firstLesson) {
      history.push(`/student/courses/${course.id}/lessons/${firstLesson.id}`);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!course) {
    return (
      <PageContainer>
        <Empty description="Không tìm thấy khóa học." />
      </PageContainer>
    );
  }

  const isEnrolled = course.is_enrolled === true;
  const isCompleted = course.enrollment?.status === 'completed';

  return (
    <PageContainer title={course.title}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card>
            <div style={{ marginBottom: 16 }}>
              {course.category && <Tag color="purple">{course.category.name}</Tag>}
              <Tag color="blue">{course.target_level}</Tag>
            </div>
            <Title level={3}>{course.title}</Title>
            {course.short_description && (
              <Paragraph type="secondary">{course.short_description}</Paragraph>
            )}

            <Row gutter={16} style={{ margin: '16px 0' }}>
              <Col><Statistic title="Bài giảng" value={course.total_lessons} prefix={<BookOutlined />} /></Col>
              <Col><Statistic title="Học viên" value={course.total_students} prefix={<TeamOutlined />} /></Col>
              {course.rating_avg > 0 && (
                <Col><Statistic title="Đánh giá" value={course.rating_avg} prefix={<StarOutlined />} precision={1} /></Col>
              )}
              {course.duration_weeks && (
                <Col><Statistic title="Thời lượng" value={course.duration_weeks} suffix="tuần" prefix={<ClockCircleOutlined />} /></Col>
              )}
            </Row>

            {course.description && (
              <>
                <Divider />
                <Title level={5}>Mô tả khóa học</Title>
                <div dangerouslySetInnerHTML={{ __html: course.description }} />
              </>
            )}

            {course.lessons && course.lessons.length > 0 && (
              <>
                <Divider />
                <Title level={5}>Nội dung bài giảng</Title>
                <List
                  dataSource={course.lessons}
                  renderItem={(lesson) => (
                    <List.Item
                      style={{ cursor: isEnrolled ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (isEnrolled) {
                          history.push(`/student/courses/${course.id}/lessons/${lesson.id}`);
                        }
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          lesson.lesson_type === 'video' ? (
                            <PlayCircleOutlined style={{ fontSize: 20, color: '#4F46E5' }} />
                          ) : (
                            <BookOutlined style={{ fontSize: 20, color: '#10B981' }} />
                          )
                        }
                        title={
                          <span>
                            {lesson.title}
                            {lesson.is_preview && <Tag color="green" style={{ marginLeft: 8 }}>Xem trước</Tag>}
                          </span>
                        }
                        description={
                          lesson.duration_minutes ? `${lesson.duration_minutes} phút` : lesson.lesson_type
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img
                src={course.thumbnail || 'https://via.placeholder.com/300x200?text=Course'}
                alt={course.title}
                style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }}
              />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Title level={3} style={{ color: '#EF4444', margin: 0 }}>
                {course.price === 0 ? 'Miễn phí' : `${course.price.toLocaleString()} đ`}
              </Title>
              {course.sale_price && course.sale_price < course.price && (
                <Text delete type="secondary">{course.price.toLocaleString()} đ</Text>
              )}
            </div>

            {isEnrolled ? (
              <Button type="primary" block size="large" icon={<PlayCircleOutlined />} onClick={handleStartLearning}>
                Tiếp tục học
              </Button>
            ) : isCompleted ? (
              <Button block size="large" icon={<CheckCircleOutlined />} onClick={handleStartLearning}>
                Xem lại bài học
              </Button>
            ) : (
              <Button
                type="primary"
                block
                size="large"
                loading={enrolling}
                onClick={handleEnroll}
              >
                Đăng ký học
              </Button>
            )}

            <Divider />

            {course.instructors && course.instructors.length > 0 && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Giảng viên</Text>
                </div>
                {course.instructors.map((inst) => (
                  <div key={inst.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                    <Text>{inst.full_name}</Text>
                  </div>
                ))}
              </>
            )}

            {course.materials && course.materials.length > 0 && (
              <>
                <Divider />
                <Text strong>Tài liệu đính kèm</Text>
                <List
                  size="small"
                  dataSource={course.materials}
                  renderItem={(mat) => (
                    <List.Item>
                      <a href={mat.file_url} target="_blank" rel="noopener noreferrer">
                        {mat.title} ({mat.material_type.toUpperCase()})
                      </a>
                    </List.Item>
                  )}
                />
              </>
            )}
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default CourseDetailPage;
