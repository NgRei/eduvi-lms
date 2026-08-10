import {
  BankOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  CreditCardOutlined,
  PlayCircleOutlined,
  QrcodeOutlined,
  ReloadOutlined,
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
  Modal,
  Pagination,
  Progress,
  Rate,
  Row,
  Spin,
  Statistic,
  Tag,
  Tooltip,
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
  confirmPayment,
  createPayment,
  getPaymentStatus,
  type CreatePaymentResponse,
} from '@/services/ant-design-pro/payments';
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<CreatePaymentResponse['data'] | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchCourse(id);
      fetchReviews(id, 1);
    }
  }, [id]);

  // Đếm ngược thời gian hết hạn mã VietQR
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (paymentModalOpen && paymentData) {
      const expiresAtStr = paymentData.expires_at || paymentData.payment?.expires_at;
      if (expiresAtStr) {
        const targetTime = new Date(expiresAtStr).getTime();

        const updateTimer = () => {
          const diff = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
          setTimeLeft(diff);
        };

        updateTimer();
        timer = setInterval(updateTimer, 1000);
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [paymentModalOpen, paymentData]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Tự động kiểm tra (polling) trạng thái thanh toán VietQR mỗi 3s khi Modal đang mở
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (paymentModalOpen && paymentData?.txn_ref && id) {
      timer = setInterval(async () => {
        try {
          const res = await getPaymentStatus(paymentData.txn_ref!);
          if (res.success && res.data?.payment?.status === 'SUCCESS') {
            message.success('Hệ thống đã nhận diện thanh toán thành công!');
            setPaymentModalOpen(false);
            setPaymentData(null);
            fetchCourse(id);
          }
        } catch (err) {
          // Bỏ qua lỗi kết nối trong quá trình polling
        }
      }, 3000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [paymentModalOpen, paymentData?.txn_ref, id]);

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

  const handleEnroll = async (forceNew?: boolean) => {
    if (!currentUser) {
      history.push('/user/login');
      return;
    }
    if (!id || !course) return;

    try {
      setEnrolling(true);
      const effectivePrice = course.sale_price !== null && course.sale_price !== undefined ? course.sale_price : (course.price || 0);

      // Nếu khóa học miễn phí
      if (effectivePrice <= 0) {
        const res = await enrollCourse(id);
        if (res.success) {
          message.success('Đăng ký khóa học miễn phí thành công!');
          fetchCourse(id);
        }
        return;
      }

      // Khóa học có phí -> Lấy hoặc tạo mã thanh toán VietQR
      const res = await createPayment(id, forceNew);
      if (res.success && res.data) {
        if (res.is_free) {
          message.success('Đăng ký khóa học thành công!');
          fetchCourse(id);
        } else {
          setPaymentData(res.data);

          // Tính toán chính xác số giây còn lại từ expires_at
          const expiresAtStr = res.data.expires_at || res.data.payment?.expires_at;
          if (expiresAtStr) {
            const targetMs = new Date(expiresAtStr).getTime();
            const diffSec = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
            setTimeLeft(diffSec);
          } else {
            setTimeLeft(res.data.expires_in_seconds || 90);
          }

          setPaymentModalOpen(true);

          if (res.is_reused) {
            message.info('Đang hiển thị mã VietQR còn hiệu lực của bạn.');
          }
        }
      } else {
        message.error(res.error || 'Không thể tạo mã thanh toán VietQR');
      }
    } catch (err: any) {
      message.error(err?.data?.error || err?.message || 'Không thể khởi tạo thanh toán');
    } finally {
      setEnrolling(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentData?.payment?.id || !id) return;
    try {
      setConfirmingPayment(true);
      const res = await confirmPayment(paymentData.payment.id);
      if (res.success) {
        message.success('Thanh toán thành công! Khóa học của bạn đã được kích hoạt.');
        setPaymentModalOpen(false);
        setPaymentData(null);
        fetchCourse(id);
      } else {
        message.error(res.error || 'Không thể xác nhận thanh toán');
      }
    } catch (err: any) {
      message.error(err?.data?.error || err?.message || 'Có lỗi xảy ra khi xác nhận thanh toán');
    } finally {
      setConfirmingPayment(false);
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
                icon={course.price > 0 ? <QrcodeOutlined /> : undefined}
                loading={enrolling}
                onClick={() => handleEnroll()}
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  backgroundColor: course.price > 0 ? '#059669' : undefined,
                  borderColor: course.price > 0 ? '#059669' : undefined,
                }}
              >
                {course.price > 0 ? 'Thanh toán & Đăng ký (VietQR)' : 'Đăng ký học ngay'}
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

      {/* VietQR Payment Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <QrcodeOutlined style={{ color: '#059669', fontSize: 22 }} />
              <span style={{ fontSize: 18, fontWeight: 600 }}>Thanh toán Khóa học qua VietQR</span>
            </div>
          </div>
        }
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        footer={[
          <Button key="cancel" size="large" onClick={() => setPaymentModalOpen(false)}>
            Hủy bỏ
          </Button>,
          timeLeft > 0 ? (
            <Button
              key="confirm"
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              loading={confirmingPayment}
              onClick={handleConfirmPayment}
              style={{ backgroundColor: '#059669', borderColor: '#059669' }}
            >
              Xác nhận đã chuyển khoản
            </Button>
          ) : (
            <Button
              key="refresh"
              type="primary"
              size="large"
              icon={<ReloadOutlined />}
              loading={enrolling}
              onClick={() => handleEnroll(true)}
              style={{ backgroundColor: '#2563EB', borderColor: '#2563EB' }}
            >
              Tạo mã QR mới
            </Button>
          ),
        ]}
        width={620}
        centered
      >
        {paymentData && (
          <div style={{ padding: '12px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              {timeLeft > 0 ? (
                <Tag color="processing" icon={<ClockCircleOutlined />} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 6 }}>
                  Thời hạn thanh toán còn lại: <strong style={{ fontSize: 15, color: '#059669', marginLeft: 4 }}>{formatTimer(timeLeft)}</strong>
                </Tag>
              ) : (
                <Tag color="error" icon={<ClockCircleOutlined />} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 6 }}>
                  Mã thanh toán VietQR này đã hết hạn!
                </Tag>
              )}
            </div>

            <Row gutter={[20, 20]} align="middle">
              <Col xs={24} sm={11} style={{ textAlign: 'center' }}>
                {paymentData.qr_code_url && (
                  <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: 240 }}>
                    <img
                      src={paymentData.qr_code_url}
                      alt="Mã VietQR Thanh toán"
                      style={{
                        width: '100%',
                        borderRadius: 12,
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        filter: timeLeft === 0 ? 'blur(4px) opacity(0.35)' : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    />
                    {timeLeft === 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: '#EF4444',
                          color: '#FFFFFF',
                          padding: '6px 14px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Mã QR đã hết hạn
                      </div>
                    )}
                  </div>
                )}
              </Col>
              <Col xs={24} sm={13}>
                <Card size="small" style={{ background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Ngân hàng thụ hưởng</Text>
                    <Text strong style={{ color: '#1E3A8A', fontSize: 14 }}>
                      {paymentData.bank_info?.bankName || 'Ngân hàng Á Châu (ACB)'}
                    </Text>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Số tài khoản</Text>
                    <Text copyable={{ text: paymentData.bank_info?.accountNo }} strong style={{ fontSize: 16, color: '#111827' }}>
                      {paymentData.bank_info?.accountNo}
                    </Text>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Chủ tài khoản</Text>
                    <Text strong style={{ fontSize: 14 }}>{paymentData.bank_info?.accountName}</Text>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Số tiền thanh toán</Text>
                    <Title level={4} style={{ color: '#EF4444', margin: 0, fontWeight: 700 }}>
                      {paymentData.amount?.toLocaleString('vi-VN')} đ
                    </Title>
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Nội dung chuyển khoản (Mã GD)</Text>
                    <div style={{ marginTop: 4 }}>
                      <Tag color="volcano" style={{ fontSize: 13, padding: '4px 8px', fontWeight: 600 }}>
                        <Text copyable={{ text: paymentData.txn_ref }} style={{ color: 'inherit' }}>
                          {paymentData.txn_ref}
                        </Text>
                      </Tag>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default CourseDetailPage;
