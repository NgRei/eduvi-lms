import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, message, Popconfirm, Space, Tag } from 'antd';
import React, { useRef } from 'react';
import {
  type Assignment,
  deleteAssignment,
  getAssignments,
  publishAssignment,
} from '@/services/ant-design-pro/assignments';

const AssignmentManagement: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteAssignment(id);
      message.success('Đã xóa bài tập thành công!');
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể xóa bài tập');
    }
  };

  const handleTogglePublish = async (record: Assignment) => {
    try {
      await publishAssignment(record.id);
      message.success(
        record.is_published ? 'Đã ẩn bài tập!' : 'Đã xuất bản bài tập!',
      );
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể thay đổi trạng thái');
    }
  };

  const typeColors: Record<string, string> = {
    quiz: 'blue',
    essay: 'purple',
    upload: 'orange',
  };

  const typeLabels: Record<string, string> = {
    quiz: 'Trắc nghiệm',
    essay: 'Tự luận',
    upload: 'Nộp file',
  };

  const columns: ProColumns<Assignment>[] = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      copyable: true,
      ellipsis: true,
      render: (_, record) => <strong>{record.title}</strong>,
    },
    {
      title: 'Loại',
      dataIndex: 'assignment_type',
      valueType: 'select',
      valueEnum: {
        quiz: { text: 'Trắc nghiệm' },
        essay: { text: 'Tự luận' },
        upload: { text: 'Nộp file' },
      },
      render: (_, record) => (
        <Tag color={typeColors[record.assignment_type]}>
          {typeLabels[record.assignment_type]}
        </Tag>
      ),
    },
    {
      title: 'Bài học',
      dataIndex: ['lesson', 'title'],
      search: false,
      render: (_, record) => record.lesson?.title || '-',
    },
    {
      title: 'Câu hỏi',
      dataIndex: 'questions',
      search: false,
      render: (_, record) =>
        record.assignment_type === 'quiz'
          ? `${record.questions?.length || 0} câu`
          : '-',
    },
    {
      title: 'Điểm đạt',
      dataIndex: 'passing_score',
      search: false,
      render: (_, record) => `${record.passing_score}/${record.total_points}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_published',
      valueType: 'select',
      valueEnum: {
        true: { text: 'Đã xuất bản', status: 'Success' },
        false: { text: 'Bản nháp', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.is_published ? 'green' : 'default'}>
          {record.is_published ? 'Đã xuất bản' : 'Bản nháp'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <a
            onClick={() =>
              history.push(`/instructor/assignments/${record.id}/edit`)
            }
          >
            Chỉnh sửa
          </a>
          <a
            onClick={() =>
              history.push(`/instructor/assignments/${record.id}/submissions`)
            }
          >
            Bài nộp
          </a>
          <a onClick={() => handleTogglePublish(record)}>
            {record.is_published ? 'Gỡ xuất bản' : 'Xuất bản'}
          </a>
          <Popconfirm
            title="Bạn có chắc muốn xóa bài tập này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <a style={{ color: '#EF4444' }}>Xóa</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Quản lý bài tập">
      <ProTable<Assignment>
        headerTitle="Danh sách bài tập"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 120 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push('/instructor/assignments/create')}
          >
            Tạo bài tập mới
          </Button>,
        ]}
        request={async (params, sort) => {
          try {
            const res = await getAssignments({
              page: params.current || 1,
              limit: params.pageSize || 10,
              type: params.assignment_type as string,
              is_published: params.is_published as string,
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
    </PageContainer>
  );
};

export default AssignmentManagement;
