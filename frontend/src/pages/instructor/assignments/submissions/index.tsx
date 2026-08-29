import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useParams } from '@umijs/max';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Space,
  Tag,
  Typography,
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import React, { useRef, useState } from 'react';
import {
  getSubmission,
  getSubmissionsForGrading,
  gradeSubmission,
  type Submission,
} from '@/services/ant-design-pro/assignments';

const { Text } = Typography;
const { TextArea } = Input;

const SubmissionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const actionRef = useRef<ActionType>(null);
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradeForm] = Form.useForm();

  const handleViewSubmission = async (submissionId: string) => {
    try {
      const res = await getSubmission(submissionId);
      setSelectedSubmission(res.data);
      setGradingModalVisible(true);
      gradeForm.setFieldsValue({
        score: res.data.score,
        feedback: res.data.feedback,
      });
    } catch (err: any) {
      message.error('Không thể tải thông tin bài nộp');
    }
  };

  const handleGrade = async (values: any) => {
    if (!selectedSubmission) return;
    setGradingLoading(true);
    try {
      await gradeSubmission(selectedSubmission.id, {
        score: values.score,
        feedback: values.feedback,
      });
      message.success('Chấm bài thành công!');
      setGradingModalVisible(false);
      setSelectedSubmission(null);
      gradeForm.resetFields();
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể chấm bài');
    } finally {
      setGradingLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    submitted: 'orange',
    graded: 'green',
    in_progress: 'default',
  };

  const statusLabels: Record<string, string> = {
    submitted: 'Chờ chấm',
    graded: 'Đã chấm',
    in_progress: 'Đang làm',
  };

  const columns: ProColumns<Submission>[] = [
    {
      title: 'Học viên',
      dataIndex: ['user', 'full_name'],
      search: false,
      render: (_, record) =>
        record.user?.full_name || record.user?.username || '-',
    },
    {
      title: 'Lần nộp',
      dataIndex: 'attempt_number',
      search: false,
      render: (_, record) => `Lần ${record.attempt_number}`,
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      search: false,
      render: (_, record) =>
        record.score !== null ? (
          <strong>{record.score}</strong>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        submitted: { text: 'Chờ chấm' },
        graded: { text: 'Đã chấm' },
      },
      render: (_, record) => (
        <Tag color={statusColors[record.status]}>
          {statusLabels[record.status]}
        </Tag>
      ),
    },
    {
      title: 'Nộp lúc',
      dataIndex: 'submitted_at',
      search: false,
      render: (_, record) =>
        new Date(record.submitted_at).toLocaleString('vi-VN'),
    },
    {
      title: 'Hành động',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <a onClick={() => handleViewSubmission(record.id)}>
            {record.status === 'graded' ? 'Xem' : 'Chấm bài'}
          </a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Bài nộp">
      <ProTable<Submission>
        headerTitle="Danh sách bài nộp"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 120 }}
        locale={{
          emptyText: (
            <Empty description="Chưa có học sinh nào nộp bài tập này" />
          ),
        }}
        request={async (params, sort) => {
          try {
            const res = await getSubmissionsForGrading(id!, {
              page: params.current || 1,
              limit: params.pageSize || 10,
              status: params.status as string,
            });
            return {
              data: res.data || [],
              total: res.pagination?.total || 0,
              success: true,
            };
          } catch (err: any) {
            const statusCode = err?.response?.status || err?.status;
            if (statusCode === 403) {
              message.error('Bạn không có quyền xem bài nộp của khóa học này');
            } else if (statusCode === 404) {
              message.error('Không tìm thấy bài tập này');
            } else {
              message.error('Không thể tải danh sách bài nộp');
            }
            return { data: [], total: 0, success: false };
          }
        }}
        columns={columns}
      />

      <Modal
        title={
          selectedSubmission?.status === 'graded'
            ? `Chi tiết bài nộp - ${selectedSubmission?.user?.full_name || selectedSubmission?.user?.username || 'Học viên'}`
            : `Chấm bài - ${selectedSubmission?.user?.full_name || selectedSubmission?.user?.username || 'Học viên'}`
        }
        open={gradingModalVisible}
        onCancel={() => {
          setGradingModalVisible(false);
          setSelectedSubmission(null);
          gradeForm.resetFields();
        }}
        footer={null}
        width={780}
      >
        {selectedSubmission && (
          <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f9fafb' }}>
              <Space orientation="horizontal" size="large" wrap>
                <div><strong>Học viên:</strong> {selectedSubmission.user?.full_name || selectedSubmission.user?.username}</div>
                <div><strong>Lần nộp:</strong> Lần {selectedSubmission.attempt_number}</div>
                <div><strong>Thời gian:</strong> {new Date(selectedSubmission.submitted_at).toLocaleString('vi-VN')}</div>
                <div>
                  <strong>Trạng thái:</strong>{' '}
                  <Tag color={statusColors[selectedSubmission.status]}>
                    {statusLabels[selectedSubmission.status]}
                  </Tag>
                </div>
              </Space>
            </Card>

            {/* Render Quiz Question Results */}
            {selectedSubmission.question_results && selectedSubmission.question_results.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Typography.Title level={5} style={{ marginBottom: 12 }}>
                  Chi tiết câu trả lời trắc nghiệm:
                </Typography.Title>
                <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                  {selectedSubmission.question_results.map((q: any, idx: number) => (
                    <Card
                      key={q.question_id || idx}
                      size="small"
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Câu {idx + 1}: {q.question_text}</span>
                          <Tag color={q.is_correct ? 'success' : 'error'} icon={q.is_correct ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                            {q.is_correct ? `+${q.points || q.points_earned || 0} điểm` : '0 điểm'}
                          </Tag>
                        </div>
                      }
                      style={{
                        borderColor: q.is_correct ? '#b7eb8f' : '#ffa39e',
                        backgroundColor: q.is_correct ? '#f6ffed' : '#fff1f0',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {q.options?.map((opt: any) => {
                          const isSelected = (q.selected_options || []).includes(opt.id);
                          const isOptionCorrect = opt.is_correct;
                          let optBg = '#ffffff';
                          let optBorder = '#d9d9d9';

                          if (isSelected && isOptionCorrect) {
                            optBg = '#d9f7be';
                            optBorder = '#52c41a';
                          } else if (isSelected && !isOptionCorrect) {
                            optBg = '#ffccc7';
                            optBorder = '#ff4d4f';
                          } else if (isOptionCorrect) {
                            optBg = '#f6ffed';
                            optBorder = '#73d13d';
                          }

                          return (
                            <div
                              key={opt.id}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 4,
                                border: `1px solid ${optBorder}`,
                                backgroundColor: optBg,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <span>
                                <strong>{opt.id}.</strong> {opt.text}
                              </span>
                              <Space>
                                {isSelected && (
                                  <Tag color={isOptionCorrect ? 'green' : 'red'}>
                                    Học viên chọn
                                  </Tag>
                                )}
                                {isOptionCorrect && (
                                  <Tag color="green">Đáp án đúng</Tag>
                                )}
                              </Space>
                            </div>
                          );
                        })}
                        {q.explanation && (
                          <div style={{ marginTop: 8, fontSize: 13, color: '#595959', fontStyle: 'italic' }}>
                            <strong>Giải thích:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </Space>
              </div>
            )}

            {/* Render Essay */}
            {selectedSubmission.assignment?.assignment_type === 'essay' &&
              selectedSubmission.answers?.text && (
                <Card
                  size="small"
                  title="Bài viết của học viên"
                  style={{ marginBottom: 16 }}
                >
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      maxHeight: 300,
                      overflow: 'auto',
                      padding: 8,
                      backgroundColor: '#fafafa',
                      borderRadius: 4,
                    }}
                  >
                    {selectedSubmission.answers.text}
                  </div>
                </Card>
              )}

            {/* Render File Upload */}
            {selectedSubmission.assignment?.assignment_type === 'upload' &&
              selectedSubmission.answers?.file_url && (
                <Card
                  size="small"
                  title="File đã nộp"
                  style={{ marginBottom: 16 }}
                >
                  <Button
                    type="primary"
                    ghost
                    icon={<DownloadOutlined />}
                    href={selectedSubmission.answers.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {selectedSubmission.answers.file_name || 'Tải file bài nộp'}
                  </Button>
                </Card>
              )}

            <Card title="Chấm điểm & Đánh giá" size="small" style={{ marginTop: 16 }}>
              <Form form={gradeForm} layout="vertical" onFinish={handleGrade}>
                <Form.Item
                  name="score"
                  label={`Điểm số (Thang điểm tối đa: ${selectedSubmission.assignment?.total_points || 100})`}
                  rules={[{ required: true, message: 'Vui lòng nhập điểm!' }]}
                >
                  <InputNumber
                    min={0}
                    max={selectedSubmission.assignment?.total_points || 100}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item name="feedback" label="Nhận xét của giảng viên">
                  <TextArea
                    rows={3}
                    placeholder="Nhập nhận xét / góp ý cho học viên (tùy chọn)..."
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={gradingLoading}
                    >
                      Lưu điểm & Nhận xét
                    </Button>
                    <Button
                      onClick={() => {
                        setGradingModalVisible(false);
                        setSelectedSubmission(null);
                        gradeForm.resetFields();
                      }}
                    >
                      Đóng
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default SubmissionsPage;
