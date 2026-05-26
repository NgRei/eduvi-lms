import { PlusOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, Modal, Select, Space, Tag, message } from 'antd';
import React, { useState } from 'react';

interface UserItem {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  status: 'active' | 'inactive';
  createdAt: string;
}

const initialUsers: UserItem[] = [
  { id: '1', name: 'Nguyễn Văn An', username: 'annv@102', email: 'annv@gmail.com', role: 'student', status: 'active', createdAt: '2026-05-25' },
  { id: '2', name: 'Trần Thị Bình', username: 'binhtt@394', email: 'binhtt@gmail.com', role: 'instructor', status: 'active', createdAt: '2026-05-24' },
  { id: '3', name: 'Lê Hoàng Cường', username: 'cuonglh@441', email: 'cuonglh@gmail.com', role: 'student', status: 'inactive', createdAt: '2026-05-24' },
  { id: '4', name: 'Phạm Minh Đức', username: 'ducpm@782', email: 'ducpm@gmail.com', role: 'student', status: 'active', createdAt: '2026-05-23' },
  { id: '5', name: 'Vũ Thị Hồng', username: 'hongvt@921', email: 'hongvt@gmail.com', role: 'instructor', status: 'active', createdAt: '2026-05-22' },
  { id: '6', name: 'Admin Toàn Quyền', username: 'admin', email: 'admin@eduvi.com', role: 'admin', status: 'active', createdAt: '2026-05-01' },
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Helper to remove accents from Vietnamese strings (for username generation)
  const removeAccents = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd');
  };

  // Logic to auto-generate username: name + initials of middle/last names + @ + random digits (e.g. annv@123)
  const generateUsername = (fullName: string): string => {
    if (!fullName) return '';
    const cleanName = removeAccents(fullName).trim().toLowerCase();
    const parts = cleanName.split(/\s+/);
    if (parts.length === 0) return '';
    
    // An Nguyen Van -> name is "an", middle/last initials are "nv" -> annv
    const firstName = parts[parts.length - 1]; // "an"
    const initials = parts
      .slice(0, parts.length - 1)
      .map(part => part.charAt(0))
      .join(''); // "nv"
      
    const randomDigits = Math.floor(100 + Math.random() * 900); // 3 random digits
    return `${firstName}${initials}@${randomDigits}`;
  };

  const handleCreateUser = (values: any) => {
    const username = values.username || generateUsername(values.name);
    const newUser: UserItem = {
      id: Date.now().toString(),
      name: values.name,
      username,
      email: values.email,
      role: values.role,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers([newUser, ...users]);
    message.success(`Tạo thành công tài khoản ${newUser.name} với username: ${newUser.username}`);
    setIsModalOpen(false);
    form.resetFields();
  };

  const toggleStatus = (id: string) => {
    setUsers(
      users.map(user => {
        if (user.id === id) {
          const newStatus = user.status === 'active' ? 'inactive' : 'active';
          message.info(`Đã chuyển trạng thái tài khoản ${user.name} sang ${newStatus === 'active' ? 'Hoạt động' : 'Bị khóa'}`);
          return { ...user, status: newStatus };
        }
        return user;
      })
    );
  };

  const columns = [
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      copyable: true,
      ellipsis: true,
      formItemProps: {
        rules: [{ required: true, message: 'Vui lòng nhập họ tên' }],
      },
    },
    {
      title: 'Tài khoản (Username)',
      dataIndex: 'username',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      copyable: true,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      valueType: 'select',
      valueEnum: {
        all: { text: 'Tất cả' },
        student: { text: 'Học viên' },
        instructor: { text: 'Giảng viên' },
        admin: { text: 'Quản trị' },
      },
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : role === 'instructor' ? 'green' : 'orange'}>
          {role === 'admin' ? 'Quản trị' : role === 'instructor' ? 'Giảng viên' : 'Học viên'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        active: { text: 'Hoạt động', status: 'Success' },
        inactive: { text: 'Đã khóa', status: 'Error' },
      },
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'createdAt',
      valueType: 'date',
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      key: 'option',
      render: (_text: any, record: UserItem) => (
        <Space size="middle">
          <Button 
            type="link" 
            danger={record.status === 'active'} 
            onClick={() => toggleStatus(record.id)}
          >
            {record.status === 'active' ? 'Khóa' : 'Kích hoạt'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Quản lý Người dùng">
      <ProTable<UserItem>
        headerTitle="Danh sách tài khoản hệ thống"
        actionRef={undefined}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        toolBarRender={() => [
          <Button
            key="button"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            type="primary"
          >
            Thêm tài khoản mới
          </Button>,
        ]}
        dataSource={users}
        columns={columns as any}
        pagination={{
          pageSize: 5,
        }}
      />

      <Modal
        title="Tạo tài khoản người dùng mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateUser}
          initialValues={{ role: 'student' }}
        >
          <Form.Item
            name="name"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
          >
            <Input 
              placeholder="Ví dụ: Nguyễn Văn An" 
              onChange={(e) => {
                const name = e.target.value;
                if (name) {
                  form.setFieldsValue({ username: generateUsername(name) });
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="username"
            label="Tài khoản (Tự động sinh hoặc tự điền)"
            help="Tên tài khoản tự động sinh theo cấu trúc: tên + họ đệm viết tắt + @ + số ngẫu nhiên (ví dụ: annv@123)"
          >
            <Input placeholder="Tự động sinh khi điền họ tên" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không đúng định dạng!' }
            ]}
          >
            <Input placeholder="Ví dụ: annv@gmail.com" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="student">Học viên (Student)</Select.Option>
              <Select.Option value="instructor">Giảng viên (Instructor)</Select.Option>
              <Select.Option value="admin">Quản trị viên (Admin)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Xác nhận tạo</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserManagement;
