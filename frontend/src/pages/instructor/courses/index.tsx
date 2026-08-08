import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, message, Popconfirm, Space, Tag } from 'antd';
import React, { useRef } from 'react';
import {
  type CourseItem,
  deleteCourse,
  getInstructorCourses,
  updateCourse,
} from '@/services/ant-design-pro/courses';

const CourseManagement: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteCourse(id);
      message.success('Đã xóa khóa học thành công!');
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể xóa khóa học');
    }
  };

  const togglePublish = async (record: CourseItem) => {
    try {
      await updateCourse(record.id, { is_published: !record.is_published });
      message.success(
        !record.is_published
          ? 'Đã xuất bản khóa học công khai!'
          : 'Đã chuyển khóa học về dạng bản nháp!',
      );
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể cập nhật trạng thái');
    }
  };

  const columns: ProColumns<CourseItem>[] = [
    {
      title: 'Tên khóa học',
      dataIndex: 'title',
      copyable: true,
      ellipsis: true,
      render: (_, record) => <strong>{record.title}</strong>,
    },
    {
      title: 'Danh mục',
      dataIndex: ['category', 'name'],
      valueType: 'select',
      hideInTable: true,
      fieldProps: { showSearch: true },
    },
    {
      title: 'Danh mục',
      dataIndex: ['category', 'name'],
      search: false,
      render: (_, record) => record.category?.name || '-',
    },
    {
      title: 'Số bài học',
      dataIndex: 'total_lessons',
      search: false,
      render: (_, record) => `${record.total_lessons} bài giảng`,
    },
    {
      title: 'Số học viên',
      dataIndex: 'total_students',
      search: false,
      sorter: true,
      render: (_, record) => (
        <Tag color="blue">{record.total_students} học viên</Tag>
      ),
    },
    {
      title: 'Học phí',
      dataIndex: 'price',
      search: false,
      render: (_, record) => (
        <strong>
          {record.price === 0
            ? 'Miễn phí'
            : `${record.price.toLocaleString()} đ`}
        </strong>
      ),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating_avg',
      search: false,
      render: (_, record) =>
        record.rating_avg === 0 ? (
          <span style={{ color: '#9CA3AF' }}>Chưa có</span>
        ) : (
          `⭐ ${record.rating_avg}`
        ),
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
              history.push(`/instructor/courses/${record.id}/edit`)
            }
          >
            Chỉnh sửa
          </a>
          <a onClick={() => togglePublish(record)}>
            {record.is_published ? 'Gỡ xuất bản' : 'Xuất bản'}
          </a>
          <Popconfirm
            title="Bạn có chắc muốn xóa khóa học này?"
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
    <PageContainer title="Quản lý khóa học">
      <ProTable<CourseItem>
        headerTitle="Danh sách khóa học"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 120 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push('/instructor/courses/create')}
          >
            Tạo khóa học mới
          </Button>,
        ]}
        request={async (params, sort) => {
          try {
            const sortField = sort && Object.keys(sort)[0];
            const sortOrder = sortField
              ? sort[sortField] === 'ascend'
                ? 'asc'
                : 'desc'
              : undefined;
            const res = await getInstructorCourses({
              page: params.current || 1,
              limit: params.pageSize || 10,
              status:
                params.is_published === 'true'
                  ? 'published'
                  : params.is_published === 'false'
                    ? 'draft'
                    : undefined,
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

export default CourseManagement;
