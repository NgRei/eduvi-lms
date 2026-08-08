import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useModel, useParams } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  List,
  message,
  Pagination,
  Progress,
  Rate,
  Row,
  Spin,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { COURSE_PLACEHOLDER_IMG } from '@/constants/placeholder';
import { issueCertificate } from '@/services/ant-design-pro/certificates';
import {
  type CourseDetail,
  getCourseById,
} from '@/services/ant-design-pro/courses';
import { enrollCourse } from '@/services/ant-design-pro/enrollments';
import {
  createReview,
  getCourseReviews,
  type Review,
} from '@/services/ant-design-pro/reviews';

const { Title, Text, Paragraph } = Typography;

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [issuingCert, setIssuingCert] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchCourse(id);
      fetchReviews(id, 1);
    }
  }, [id]);

  const fetchReviews = async (courseId: string, page: number) => {
    try {
      const res = await getCourseReviews(courseId, { page, limit: 5 });
      if (res.success) {
        setReviews(res.data);
        setReviewTotal(res.pagination.total);
        setReviewPage(page);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const handleSubmitReview = async (values: {
    rating: number;
    comment: string;
  }) => {
    if (!id) return;
    try {
      setSubmittingReview(true);
      const res = await createReview(id, values);
      if (res.success) {
        message.success('Đánh giá thành công!');
        form.resetFields();
        fetchReviews(id, 1);
        fetchCourse(id);
      }
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleIssueCertificate = async () => {
    if (!id) return;
    try {
      setIssuingCert(true);
      const res = await issueCertificate(id);
      if (res.success) {
        message.success('Cấp chứng chỉ thành công!');
        history.push('/student/certificates');
      }
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể cấp chứng chỉ');
    } finally {
      setIssuingCert(false);
    }
  };

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
  const isCompleted = isEnrolled && course.enrollment?.status === 'completed';

  return (
    <PageContainer title={course.title}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card>
            <div style={{ marginBottom: 16 }}>
              {course.category && (
                <Tag color="purple">{course.category.name}</Tag>
              )}
              <Tag color="blue">{course.target_level}</Tag>
            </div>
            <Title level={3}>{course.title}</Title>
            {course.short_description && (
              <Paragraph type="secondary">{course.short_description}</Paragraph>
            )}

            <Row gutter={16} style={{ margin: '16px 0' }}>
              <Col>
                <Statistic
                  title="Bài giảng"
                  value={course.total_lessons}
                  prefix={<BookOutlined />}
                />
              </Col>
              <Col>
                <Statistic
                  title="Học viên"
                  value={course.total_students}
                  prefix={<TeamOutlined />}
                />
              </Col>
              {course.rating_avg > 0 && (
                <Col>
                  <Statistic
                    title="Đánh giá"
                    value={course.rating_avg}
                    prefix={<StarOutlined />}
                    precision={1}
                  />
                </Col>
              )}
              {course.duration_weeks && (
                <Col>
                  <Statistic
                    title="Thời lượng"
                    value={course.duration_weeks}
                    suffix="tuần"
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
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
                          history.push(
                            `/student/courses/${course.id}/lessons/${lesson.id}`,
                          );
                        }
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          lesson.lesson_type === 'video' ? (
                            <PlayCircleOutlined
                              style={{ fontSize: 20, color: '#4F46E5' }}
                            />
                          ) : (
                            <BookOutlined
                              style={{ fontSize: 20, color: '#10B981' }}
                            />
                          )
                        }
                        title={
                          <span>
                            {lesson.title}
                            {lesson.is_preview && (
                              <Tag color="green" style={{ marginLeft: 8 }}>
                                Xem trước
                              </Tag>
                            )}
                          </span>
                        }
                        description={
                          lesson.duration_minutes
                            ? `${lesson.duration_minutes} phút`
                            : lesson.lesson_type
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}

            {/* Reviews Section */}
            <Divider />
            <Title level={5}>Đánh giá từ học viên ({reviewTotal})</Title>

            {isEnrolled && (
              <Card
                size="small"
                style={{ marginBottom: 16, backgroundColor: '#FAFAFA' }}
              >
                <Form
                  form={form}
                  onFinish={handleSubmitReview}
                  layout="vertical"
                >
                  <Form.Item
                    name="rating"
                    label="Đánh giá sao"
                    rules={[
                      { required: true, message: 'Vui lòng chọn số sao' },
                    ]}
                  >
                    <Rate />
                  </Form.Item>
                  <Form.Item name="comment" label="Nhận xét">
                    <Input.TextArea
                      rows={3}
                      placeholder="Chia sẻ cảm nhận về khóa học..."
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submittingReview}
                    >
                      Gửi đánh giá
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            )}

            {reviews.length > 0 ? (
              <List
                dataSource={reviews}
                renderItem={(review) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <span>
                          {review.user?.full_name || 'Học viên'}
                          <Rate
                            disabled
                            value={review.rating}
                            style={{ marginLeft: 12, fontSize: 14 }}
                          />
                        </span>
                      }
                      description={
                        <div>
                          {review.comment && (
                            <div style={{ marginBottom: 4 }}>
                              {review.comment}
                            </div>
                          )}
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(review.created_at).toLocaleDateString(
                              'vi-VN',
                            )}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">Chưa có đánh giá nào.</Text>
            )}

            {reviewTotal > 5 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Pagination
                  current={reviewPage}
                  total={reviewTotal}
                  pageSize={5}
                  onChange={(page) => id && fetchReviews(id, page)}
                  size="small"
                />
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img
                src={course.thumbnail || COURSE_PLACEHOLDER_IMG}
                alt={course.title}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  maxHeight: 200,
                  objectFit: 'cover',
                }}
              />
            </div>

            {!isEnrolled && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ color: '#EF4444', margin: 0 }}>
                  {course.price === 0
                    ? 'Miễn phí'
                    : `${course.price.toLocaleString()} đ`}
                </Title>
                {course.sale_price && course.sale_price < course.price && (
                  <Text delete type="secondary">
                    {course.price.toLocaleString()} đ
                  </Text>
                )}
              </div>
            )}

            {isEnrolled && course.enrollment && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Tiến độ học tập</Text>
                </div>
                <Progress
                  percent={Math.round(course.enrollment.progress_percentage)}
                  status={isCompleted ? 'success' : 'active'}
                  style={{ maxWidth: 200, margin: '0 auto' }}
                />
              </div>
            )}

            {isCompleted ? (
              <>
                <Button
                  block
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={handleStartLearning}
                  style={{ marginBottom: 8 }}
                >
                  Xem lại bài học
                </Button>
                <Button
                  block
                  size="large"
                  icon={<SafetyCertificateOutlined />}
                  loading={issuingCert}
                  onClick={handleIssueCertificate}
                >
                  Nhận chứng chỉ
                </Button>
              </>
            ) : isEnrolled ? (
              <Button
                type="primary"
                block
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleStartLearning}
              >
                Tiếp tục học
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
                  <div
                    key={inst.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Avatar
                      icon={<UserOutlined />}
                      style={{ marginRight: 8 }}
                    />
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
                      <a
                        href={mat.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
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
