import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useParams } from '@umijs/max';
import { Button, Card, Form, Input, InputNumber, Modal, Space, Tag, Typography, message } from 'antd';
import React, { useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  getSubmissionsForGrading,
  getSubmission,
  gradeSubmission,
  type Submission,
} from '@/services/ant-design-pro/assignments';

const { Text } = Typography;
const { TextArea } = Input;

const SubmissionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const actionRef = useRef<ActionType>(null);
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
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
      render: (_, record) => record.user?.full_name || record.user?.username || '-',
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
          } catch (err) {
            return { data: [], total: 0, success: false };
          }
        }}
        columns={columns}
      />

      <Modal
        title={selectedSubmission?.status === 'graded' ? 'Chi tiết bài nộp' : 'Chấm bài'}
        open={gradingModalVisible}
        onCancel={() => {
          setGradingModalVisible(false);
          setSelectedSubmission(null);
          gradeForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        {selectedSubmission && (
          <>
            {selectedSubmission.assignment?.assignment_type === 'essay' && selectedSubmission.answers?.text && (
              <Card size="small" title="Bài viết" style={{ marginBottom: 16 }}>
                <div style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                  {selectedSubmission.answers.text}
                </div>
              </Card>
            )}

            {selectedSubmission.assignment?.assignment_type === 'upload' && selectedSubmission.answers?.file_url && (
              <Card size="small" title="File đã nộp" style={{ marginBottom: 16 }}>
                <a href={selectedSubmission.answers.file_url} target="_blank" rel="noopener noreferrer">
                  {selectedSubmission.answers.file_name || 'Xem file'}
                </a>
              </Card>
            )}

            <Form form={gradeForm} layout="vertical" onFinish={handleGrade}>
              <Form.Item
                name="score"
                label={`Điểm (tối đa: ${selectedSubmission.assignment?.total_points || 100})`}
                rules={[{ required: true, message: 'Vui lòng nhập điểm!' }]}
              >
                <InputNumber
                  min={0}
                  max={selectedSubmission.assignment?.total_points || 100}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item name="feedback" label="Nhận xét">
                <TextArea rows={4} placeholder="Nhận xét cho học viên (tùy chọn)" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={gradingLoading}>
                    Lưu điểm
                  </Button>
                  <Button onClick={() => {
                    setGradingModalVisible(false);
                    setSelectedSubmission(null);
                    gradeForm.resetFields();
                  }}>
                    Đóng
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </PageContainer>
  );
};

export default SubmissionsPage;
