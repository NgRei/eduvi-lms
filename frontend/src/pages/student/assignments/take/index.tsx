import { ClockCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  Button,
  Card,
  Checkbox,
  Input,
  message,
  Radio,
  Result,
  Space,
  Spin,
  Typography,
  Upload,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import {
  type Assignment,
  getAssignment,
  getMySubmissions,
  submitAssignment,
} from '@/services/ant-design-pro/assignments';
import { uploadImage } from '@/services/ant-design-pro/uploads';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const TakeAssignmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({});
  const [essayText, setEssayText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [gradingResult, setGradingResult] = useState<any>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const fetchAssignment = useCallback(async () => {
    try {
      const res = await getAssignment(id!);
      setAssignment(res.data);

      // Check attempts
      const submissionsRes = await getMySubmissions(id!);
      const attempts = submissionsRes.data?.length || 0;
      setAttemptsLeft(res.data.attempts_allowed - attempts);

      if (attempts >= res.data.attempts_allowed) {
        message.warning('Bạn đã hết lượt nộp bài!');
      }
    } catch (err: any) {
      message.error('Không thể tải bài tập');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const handleQuizAnswer = (
    questionId: string,
    optionId: string,
    type: string,
  ) => {
    setQuizAnswers((prev) => {
      const current = prev[questionId] || [];
      if (type === 'single' || type === 'true_false') {
        return { ...prev, [questionId]: [optionId] };
      } else {
        // multiple
        if (current.includes(optionId)) {
          return {
            ...prev,
            [questionId]: current.filter((id) => id !== optionId),
          };
        } else {
          return { ...prev, [questionId]: [...current, optionId] };
        }
      }
    });
  };

  const handleUpload = async (file: any) => {
    try {
      const res = await uploadImage(file, 'assignments');
      if (res.data?.url) {
        setUploadedFile({ url: res.data.url, name: file.name });
        message.success('Upload thành công!');
      }
    } catch (err) {
      message.error('Upload thất bại!');
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!assignment) return;

    // Validate
    if (assignment.assignment_type === 'quiz') {
      const answeredCount = Object.keys(quizAnswers).length;
      if (answeredCount === 0) {
        message.error('Vui lòng trả lời ít nhất một câu hỏi!');
        return;
      }
    } else if (assignment.assignment_type === 'essay') {
      if (!essayText.trim()) {
        message.error('Vui lòng nhập nội dung bài viết!');
        return;
      }
    } else if (assignment.assignment_type === 'upload') {
      if (!uploadedFile) {
        message.error('Vui lòng upload file!');
        return;
      }
    }

    setSubmitting(true);
    try {
      let answers: any;
      if (assignment.assignment_type === 'quiz') {
        answers = Object.entries(quizAnswers).map(
          ([question_id, selected_options]) => ({
            question_id,
            selected_options,
          }),
        );
      } else if (assignment.assignment_type === 'essay') {
        answers = { text: essayText };
      } else {
        answers = {
          file_url: uploadedFile!.url,
          file_name: uploadedFile!.name,
        };
      }

      const res = await submitAssignment(id!, answers);
      setSubmitted(true);
      if (res.data.grading) {
        setGradingResult(res.data.grading);
      }
      message.success(res.message);
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể nộp bài');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Làm bài tập">
        <Card>
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        </Card>
      </PageContainer>
    );
  }

  if (!assignment) {
    return (
      <PageContainer title="Làm bài tập">
        <Result status="404" title="Không tìm thấy bài tập" />
      </PageContainer>
    );
  }

  if (submitted) {
    return (
      <PageContainer title="Kết quả bài tập">
        <Card>
          {gradingResult ? (
            <Result
              status={gradingResult.passed ? 'success' : 'warning'}
              title={`${gradingResult.score}/${gradingResult.total} điểm`}
              subTitle={
                gradingResult.passed
                  ? 'Bạn đã đạt!'
                  : 'Bạn chưa đạt điểm tối thiểu'
              }
              extra={[
                <Button
                  key="back"
                  onClick={() =>
                    history.push(
                      `/student/courses/${assignment.course_id}/lessons/${assignment.lesson_id}`,
                    )
                  }
                >
                  Quay lại bài học
                </Button>,
              ]}
            />
          ) : (
            <Result
              status="info"
              title="Nộp bài thành công!"
              subTitle="Bài tập của bạn đang chờ giảng viên chấm điểm."
              extra={[
                <Button
                  key="back"
                  onClick={() =>
                    history.push(
                      `/student/courses/${assignment.course_id}/lessons/${assignment.lesson_id}`,
                    )
                  }
                >
                  Quay lại bài học
                </Button>,
              ]}
            />
          )}
        </Card>
      </PageContainer>
    );
  }

  if (attemptsLeft !== null && attemptsLeft <= 0) {
    return (
      <PageContainer title="Làm bài tập">
        <Result
          status="warning"
          title="Hết lượt nộp bài"
          subTitle={`Bạn đã sử dụng hết ${assignment.attempts_allowed} lượt nộp cho bài tập này.`}
          extra={[
            <Button
              key="back"
              onClick={() =>
                history.push(
                  `/student/courses/${assignment.course_id}/lessons/${assignment.lesson_id}`,
                )
              }
            >
              Quay lại bài học
            </Button>,
          ]}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer title={assignment.title}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>{assignment.title}</Title>
          {assignment.description && (
            <Paragraph>{assignment.description}</Paragraph>
          )}
          <Space>
            <Text type="secondary">
              Loại:{' '}
              {assignment.assignment_type === 'quiz'
                ? 'Trắc nghiệm'
                : assignment.assignment_type === 'essay'
                  ? 'Tự luận'
                  : 'Nộp file'}
            </Text>
            <Text type="secondary">|</Text>
            <Text type="secondary">Tổng điểm: {assignment.total_points}</Text>
            <Text type="secondary">|</Text>
            <Text type="secondary">Điểm đạt: {assignment.passing_score}</Text>
            {attemptsLeft !== null && (
              <>
                <Text type="secondary">|</Text>
                <Text type="secondary">Còn lại: {attemptsLeft} lượt</Text>
              </>
            )}
            {assignment.time_limit_minutes && (
              <>
                <Text type="secondary">|</Text>
                <Text type="secondary">
                  <ClockCircleOutlined /> {assignment.time_limit_minutes} phút
                </Text>
              </>
            )}
          </Space>
        </div>

        {/* Quiz */}
        {assignment.assignment_type === 'quiz' && assignment.questions && (
          <>
            {assignment.questions.map((q, index) => (
              <Card
                key={q.id}
                size="small"
                style={{ marginBottom: 16 }}
                title={`Câu ${index + 1}: ${q.question_text}`}
              >
                {q.question_type === 'single' ||
                q.question_type === 'true_false' ? (
                  <Radio.Group
                    onChange={(e) =>
                      handleQuizAnswer(q.id, e.target.value, q.question_type)
                    }
                    value={quizAnswers[q.id]?.[0]}
                  >
                    <Space direction="vertical">
                      {q.options.map((opt) => (
                        <Radio key={opt.id} value={opt.id}>
                          {opt.text}
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                ) : (
                  <Checkbox.Group
                    onChange={(values) =>
                      setQuizAnswers((prev) => ({
                        ...prev,
                        [q.id]: values as string[],
                      }))
                    }
                    value={quizAnswers[q.id]}
                  >
                    <Space direction="vertical">
                      {q.options.map((opt) => (
                        <Checkbox key={opt.id} value={opt.id}>
                          {opt.text}
                        </Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                )}
              </Card>
            ))}
          </>
        )}

        {/* Essay */}
        {assignment.assignment_type === 'essay' && (
          <Card title="Bài viết" style={{ marginBottom: 16 }}>
            <TextArea
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              rows={10}
              placeholder="Nhập nội dung bài viết của bạn..."
            />
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              {essayText.length} ký tự
            </Text>
          </Card>
        )}

        {/* Upload */}
        {assignment.assignment_type === 'upload' && (
          <Card title="Nộp file" style={{ marginBottom: 16 }}>
            <Upload beforeUpload={handleUpload} maxCount={1}>
              <Button icon={<UploadOutlined />}>Chọn file</Button>
            </Upload>
            {uploadedFile && (
              <Text type="success" style={{ marginTop: 8, display: 'block' }}>
                Đã chọn: {uploadedFile.name}
              </Text>
            )}
          </Card>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={submitting}
            >
              Nộp bài
            </Button>
            <Button
              size="large"
              onClick={() =>
                history.push(
                  `/student/courses/${assignment.course_id}/lessons/${assignment.lesson_id}`,
                )
              }
            >
              Hủy
            </Button>
          </Space>
        </div>
      </Card>
    </PageContainer>
  );
};

export default TakeAssignmentPage;
