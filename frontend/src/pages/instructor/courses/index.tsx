import { PlusOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Popconfirm, Space, Tag, message } from 'antd';
import React, { useState } from 'react';

interface CourseItem {
  id: string;
  title: string;
  category: string;
  studentsCount: number;
  lessonsCount: number;
  price: number;
  status: 'draft' | 'published';
  rating: number;
}

const initialCourses: CourseItem[] = [
  { id: '1', title: 'Lập trình Node.js thực chiến từ Zero đến Hero', category: 'Lập trình Backend', studentsCount: 450, lessonsCount: 42, price: 599000, status: 'published', rating: 4.8 },
  { id: '2', title: 'Xây dựng RESTful API với Express và TypeScript', category: 'Lập trình Backend', studentsCount: 280, lessonsCount: 15, price: 350000, status: 'published', rating: 4.7 },
  { id: '3', title: 'Cơ sở dữ liệu MySQL nâng cao cho Lập trình viên', category: 'Cơ sở dữ liệu', studentsCount: 180, lessonsCount: 25, price: 290000, status: 'published', rating: 4.9 },
  { id: '4', title: 'Lập trình Fullstack Web với Next.js và TailwindCSS', category: 'Lập trình Web', studentsCount: 0, lessonsCount: 50, price: 799000, status: 'draft', rating: 0 },
];

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);

  const handleDelete = (id: string) => {
    setCourses(courses.filter(course => course.id !== id));
    message.success('Đã xóa khóa học thành công!');
  };

  const togglePublish = (id: string) => {
    setCourses(
      courses.map(course => {
        if (course.id === id) {
          const newStatus = course.status === 'published' ? 'draft' : 'published';
          message.success(
            newStatus === 'published'
              ? 'Đã xuất bản khóa học công khai!'
              : 'Đã chuyển khóa học về dạng bản nháp!'
          );
          return { ...course, status: newStatus };
        }
        return course;
      })
    );
  };

  const columns = [
    {
      title: 'Tên khóa học',
      dataIndex: 'title',
      copyable: true,
      ellipsis: true,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      valueType: 'select',
      valueEnum: {
        all: { text: 'Tất cả' },
        'Lập trình Backend': { text: 'Lập trình Backend' },
        'Lập trình Web': { text: 'Lập trình Web' },
        'Cơ sở dữ liệu': { text: 'Cơ sở dữ liệu' },
      },
    },
    {
      title: 'Số bài học',
      dataIndex: 'lessonsCount',
      search: false,
      render: (val: number) => `${val} bài giảng`,
    },
    {
      title: 'Số học viên',
      dataIndex: 'studentsCount',
      search: false,
      sorter: (a: CourseItem, b: CourseItem) => a.studentsCount - b.studentsCount,
      render: (val: number) => <Tag color="blue">{val} học viên</Tag>,
    },
    {
      title: 'Học phí',
      dataIndex: 'price',
      search: false,
      render: (val: number) => <strong>{val === 0 ? 'Miễn phí' : `${val.toLocaleString()} đ`}</strong>,
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      search: false,
      render: (val: number) => (val === 0 ? <span style={{ color: '#9CA3AF' }}>Chưa có</span> : `⭐ ${val}`),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        published: { text: 'Đã xuất bản', status: 'Success' },
        draft: { text: 'Bản nháp', status: 'Default' },
      },
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      key: 'option',
      render: (_text: any, record: CourseItem) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => togglePublish(record.id)}
          >
            {record.status === 'published' ? 'Hạ xuống nháp' : 'Xuất bản'}
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa khóa học này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Quản lý Khóa học">
      <ProTable<CourseItem>
        headerTitle="Các khóa học bạn đang giảng dạy"
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        toolBarRender={() => [
          <Button
            key="button"
            icon={<PlusOutlined />}
            onClick={() => history.push('/instructor/courses/create')}
            type="primary"
          >
            Tạo khóa học mới
          </Button>,
        ]}
        dataSource={courses}
        columns={columns as any}
        pagination={{
          pageSize: 5,
        }}
      />
    </PageContainer>
  );
};

export default CourseManagement;
