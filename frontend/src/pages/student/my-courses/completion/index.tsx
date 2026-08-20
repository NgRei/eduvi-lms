import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Card, Steps, Button, Result, Spin, message, Typography, Space, Descriptions, Divider, Row, Col, Tag } from 'antd';
import { BookOutlined, FileTextOutlined, TrophyOutlined, DownloadOutlined, ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { getCourseCompletionStatus, issueCertificate, type CourseCompletionStatus } from '@/services/ant-design-pro/certificates';

const { Title, Text, Paragraph } = Typography;

const CourseCompletionPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [status, setStatus] = useState<CourseCompletionStatus | null>(null);

  const fetchStatus = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await getCourseCompletionStatus(courseId);
      if (res.success) {
        setStatus(res.data);
      }
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể tải trạng thái hoàn thành khóa học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [courseId]);

  const handleIssueCert = async () => {
    if (!courseId) return;
    try {
      setIssuing(true);
      const res = await issueCertificate(courseId);
      if (res.success) {
        message.success('Cấp chứng chỉ thành công!');
        fetchStatus();
      }
    } catch (err: any) {
      message.error(err?.data?.error || 'Có lỗi xảy ra khi cấp chứng chỉ!');
    } finally {
      setIssuing(false);
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

  if (!status) {
    return (
      <PageContainer>
        <Result
          status="404"
          title="Không tìm thấy thông tin"
          subTitle="Không thể tải trạng thái hoàn thành cho khóa học này."
          extra={<Button type="primary" onClick={() => history.push('/student/my-courses')}>Về danh sách khóa học</Button>}
        />
      </PageContainer>
    );
  }

  const { progress_percentage, lessons_completed, lessons_total, final_exam, certificate } = status;

  // Determine steps and current active step
  const steps: { title: string; status: 'wait' | 'process' | 'finish' | 'error'; description: string; icon: React.ReactNode }[] = [];

  // Step 1: Lessons Progress
  const isLessonsDone = progress_percentage === 100;
  steps.push({
    title: 'Hoàn thành bài giảng',
    status: isLessonsDone ? 'finish' : 'process',
    description: `Đã học ${lessons_completed}/${lessons_total} bài (${progress_percentage}%)`,
    icon: <BookOutlined />,
  });

  // Step 2: Final Exam (if exists)
  let isExamPassed = true;
  if (final_exam.exists) {
    isExamPassed = final_exam.passed || false;
    let stepStatus: 'wait' | 'process' | 'finish' | 'error' = 'wait';

    if (isLessonsDone) {
      if (!final_exam.submitted) {
        stepStatus = 'process';
      } else if (final_exam.passed) {
        stepStatus = 'finish';
      } else {
        stepStatus = 'error';
      }
    }

    steps.push({
      title: 'Bài kiểm tra cuối khóa',
      status: stepStatus,
      description: final_exam.submitted
        ? `Điểm số: ${final_exam.score}/${final_exam.total_points} (Yêu cầu: ${final_exam.passing_score}đ)`
        : `Yêu cầu đạt tối thiểu ${final_exam.passing_score}/${final_exam.total_points} điểm`,
      icon: <FileTextOutlined />,
    });
  }

  // Step 3: Certificate
  let certStatus: 'wait' | 'process' | 'finish' = 'wait';
  if (isLessonsDone && isExamPassed) {
    certStatus = certificate.issued ? 'finish' : 'process';
  }
  steps.push({
    title: 'Nhận chứng chỉ tốt nghiệp',
    status: certStatus,
    description: certificate.issued ? 'Đã cấp chứng chỉ' : 'Đủ điều kiện nhận chứng chỉ',
    icon: <TrophyOutlined />,
  });

  // Calculate current active step index for Ant Steps display
  let currentStepIdx = 0;
  if (isLessonsDone) {
    currentStepIdx = 1;
    if (isExamPassed) {
      currentStepIdx = 2;
      if (certificate.issued) {
        currentStepIdx = 3;
      }
    }
  }

  return (
    <PageContainer
      title="Tiến độ hoàn thành khóa học"
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => history.push(`/student/my-courses`)}>
          Quay lại khóa học của tôi
        </Button>
      }
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card title="Các bước hoàn thành khóa học và nhận chứng chỉ" style={{ borderRadius: 8 }}>
            <Steps
              current={currentStepIdx}
              direction="vertical"
              items={steps}
              style={{ padding: '16px 0' }}
            />

            <Divider />

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              {/* Actions based on step status */}
              {!isLessonsDone && (
                <div style={{ padding: '20px 0' }}>
                  <Paragraph>Bạn cần hoàn thành toàn bộ các bài học trong khóa học trước khi tiến hành bước tiếp theo.</Paragraph>
                  <Button type="primary" size="large" onClick={() => history.push(`/student/my-courses`)}>
                    Tiếp tục học bài giảng
                  </Button>
                </div>
              )}

              {isLessonsDone && final_exam.exists && !final_exam.passed && (
                <div style={{ padding: '20px 0' }}>
                  <Paragraph>
                    {final_exam.submitted
                      ? `Bài kiểm tra cuối khóa của bạn đạt ${final_exam.score} điểm, chưa đủ điểm đỗ (${final_exam.passing_score} điểm).`
                      : 'Hãy bắt đầu thực hiện bài kiểm tra cuối khóa để kiểm tra kiến thức và đủ điều kiện nhận chứng chỉ.'}
                  </Paragraph>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => history.push(`/student/assignments/${final_exam.assignment_id}`)}
                  >
                    {final_exam.submitted ? 'Làm lại bài thi cuối khóa (Không giới hạn)' : 'Bắt đầu làm bài thi cuối khóa'}
                  </Button>
                </div>
              )}

              {isLessonsDone && isExamPassed && !certificate.issued && (
                <div style={{ padding: '20px 0' }}>
                  <TrophyOutlined style={{ fontSize: 64, color: '#F59E0B', marginBottom: 16 }} />
                  <Title level={3}>Chúc mừng bạn đã hoàn thành xuất sắc khóa học!</Title>
                  <Paragraph>Bạn đã đạt đủ mọi điều kiện. Hãy bấm nút dưới đây để hệ thống cấp chứng chỉ chính thức cho bạn.</Paragraph>
                  <Button type="primary" size="large" loading={issuing} onClick={handleIssueCert}>
                    Nhận chứng chỉ ngay
                  </Button>
                </div>
              )}

              {certificate.issued && (
                <div style={{ padding: '20px 0' }}>
                  <TrophyOutlined style={{ fontSize: 64, color: '#F59E0B', marginBottom: 16 }} />
                  <Title level={3}>Chứng chỉ của bạn đã được cấp!</Title>
                  <Paragraph>Chúc mừng bạn đã sở hữu chứng chỉ hoàn thành khóa học chính thức từ Eduvi LMS.</Paragraph>
                  <Space size="middle">
                    <Button
                      type="primary"
                      size="large"
                      icon={<EyeOutlined />}
                      onClick={() => history.push('/student/certificates')}
                    >
                      Xem chứng chỉ của tôi
                    </Button>
                  </Space>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="Thông tin tổng quan" style={{ borderRadius: 8 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Tiến độ bài học">
                <Text strong>{progress_percentage}%</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Bài học đã học">
                {lessons_completed}/{lessons_total} bài
              </Descriptions.Item>
              <Descriptions.Item label="Thi cuối khóa">
                {final_exam.exists ? (
                  <Tag color={final_exam.passed ? 'green' : 'red'}>
                    {final_exam.passed ? 'Đã đạt' : final_exam.submitted ? 'Không đạt' : 'Chưa làm'}
                  </Tag>
                ) : (
                  <Tag color="blue">Không yêu cầu</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái chứng chỉ">
                <Tag color={certificate.issued ? 'gold' : certificate.eligible ? 'green' : 'default'}>
                  {certificate.issued ? 'Đã cấp' : certificate.eligible ? 'Đủ điều kiện' : 'Chưa đủ điều kiện'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default CourseCompletionPage;
