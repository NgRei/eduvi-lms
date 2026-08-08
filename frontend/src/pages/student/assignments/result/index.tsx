import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  Button,
  Card,
  List,
  message,
  Result,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import {
  getSubmission,
  type Submission,
} from '@/services/ant-design-pro/assignments';

const { Title, Text, Paragraph } = Typography;

const AssignmentResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<Submission | null>(null);

  const fetchSubmission = useCallback(async () => {
    try {
      const res = await getSubmission(id!);
      setSubmission(res.data);
    } catch (err: any) {
      message.error('Không thể tải kết quả bài tập');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  if (loading) {
    return (
      <PageContainer title="Kết quả bài tập">
        <Card>
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        </Card>
      </PageContainer>
    );
  }

  if (!submission) {
    return (
      <PageContainer title="Kết quả bài tập">
        <Result status="404" title="Không tìm thấy bài nộp" />
      </PageContainer>
    );
  }

  const assignment = submission.assignment;
  const isGraded = submission.status === 'graded';
  const passed =
    isGraded &&
    submission.score !== null &&
    assignment &&
    submission.score >= assignment.passing_score;

  return (
    <PageContainer title="Kết quả bài tập">
      <Card>
        {/* Score summary */}
        {isGraded && (
          <Result
            status={passed ? 'success' : 'warning'}
            title={`${submission.score}/${assignment?.total_points || 0} điểm`}
            subTitle={
              passed ? 'Chúc mừng! Bạn đã đạt!' : 'Bạn chưa đạt điểm tối thiểu.'
            }
          />
        )}

        {!isGraded && (
          <Result
            status="info"
            title="Chờ chấm điểm"
            subTitle="Bài tập của bạn đang chờ giảng viên chấm điểm."
          />
        )}

        {/* Feedback */}
        {submission.feedback && (
          <Card
            size="small"
            title="Nhận xét của giảng viên"
            style={{ marginBottom: 16 }}
          >
            <Paragraph>{submission.feedback}</Paragraph>
          </Card>
        )}

        {/* Quiz question results */}
        {assignment?.assignment_type === 'quiz' &&
          submission.question_results &&
          submission.question_results.length > 0 && (
            <Card title="Chi tiết câu hỏi">
              <List
                dataSource={submission.question_results}
                renderItem={(item: any, index: number) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <div style={{ marginBottom: 8 }}>
                        <Space>
                          {item.is_correct ? (
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          ) : (
                            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                          )}
                          <Text strong>Câu {index + 1}:</Text>
                          <Text>{item.question_text}</Text>
                          <Tag color={item.is_correct ? 'green' : 'red'}>
                            {item.is_correct ? `+${item.points}` : '0'} điểm
                          </Tag>
                        </Space>
                      </div>
                      <div style={{ marginLeft: 24 }}>
                        {item.options?.map((opt: any) => {
                          const isSelected = item.selected_options?.includes(
                            opt.id,
                          );
                          const isCorrect = opt.is_correct;
                          let bgColor = 'transparent';
                          if (isCorrect) bgColor = '#f6ffed';
                          if (isSelected && !isCorrect) bgColor = '#fff2f0';

                          return (
                            <div
                              key={opt.id}
                              style={{
                                padding: '4px 8px',
                                marginBottom: 4,
                                backgroundColor: bgColor,
                                borderRadius: 4,
                              }}
                            >
                              <Space>
                                {isSelected && <Tag color="blue">Đã chọn</Tag>}
                                {isCorrect && (
                                  <Tag color="green">Đáp án đúng</Tag>
                                )}
                                <Text>{opt.text}</Text>
                              </Space>
                            </div>
                          );
                        })}
                        {item.explanation && (
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary">
                              Giải thích: {item.explanation}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          )}

        {/* Essay content */}
        {assignment?.assignment_type === 'essay' &&
          submission.answers?.text && (
            <Card
              size="small"
              title="Bài viết của bạn"
              style={{ marginTop: 16 }}
            >
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {submission.answers.text}
              </div>
            </Card>
          )}

        {/* Upload file */}
        {assignment?.assignment_type === 'upload' &&
          submission.answers?.file_url && (
            <Card size="small" title="File đã nộp" style={{ marginTop: 16 }}>
              <a
                href={submission.answers.file_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {submission.answers.file_name || 'Xem file'}
              </a>
            </Card>
          )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space>
            <Button
              type="primary"
              onClick={() =>
                history.push(
                  `/student/courses/${assignment?.course_id}/lessons/${assignment?.lesson_id}`,
                )
              }
            >
              Quay lại bài học
            </Button>
            <Button onClick={() => history.push('/student/my-courses')}>
              Khóa học của tôi
            </Button>
          </Space>
        </div>
      </Card>
    </PageContainer>
  );
};

export default AssignmentResultPage;
