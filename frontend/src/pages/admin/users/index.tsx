import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  Button,
  Form,
  Input,
  Modal,
  message,
  Popconfirm,
  Select,
  Space,
  Tag,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  type AdminUser,
  createUser,
  deleteUser,
  getUsers,
  updateUserStatus,
} from '@/services/ant-design-pro/admin';

const UserManagement: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm] = Form.useForm();

  const handleToggleStatus = async (record: AdminUser) => {
    try {
      await updateUserStatus(record.id, !record.is_active);
      message.success(
        record.is_active ? 'Đã khóa tài khoản!' : 'Đã kích hoạt tài khoản!',
      );
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      message.success('Đã xóa người dùng!');
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể xóa người dùng');
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await createUser(values);
      message.success('Tạo người dùng thành công!');
      setShowCreateModal(false);
      createForm.resetFields();
      actionRef.current?.reload();
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể tạo người dùng');
    }
  };

  const columns: ProColumns<AdminUser>[] = [
    {
      title: 'Họ tên',
      dataIndex: 'full_name',
      render: (_, record) => <strong>{record.full_name}</strong>,
    },
    { title: 'Email', dataIndex: 'email', copyable: true },
    { title: 'Tên đăng nhập', dataIndex: 'username', copyable: true },
    {
      title: 'Vai trò',
      dataIndex: 'user_type',
      valueType: 'select',
      valueEnum: {
        student: { text: 'Học viên', status: 'Processing' },
        instructor: { text: 'Giảng viên', status: 'Warning' },
        admin: { text: 'Quản trị', status: 'Error' },
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      valueType: 'select',
      valueEnum: {
        true: { text: 'Hoạt động', status: 'Success' },
        false: { text: 'Đã khóa', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.is_active ? 'green' : 'default'}>
          {record.is_active ? 'Hoạt động' : 'Đã khóa'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      search: false,
      render: (_, record) =>
        new Date(record.created_at).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <a onClick={() => handleToggleStatus(record)}>
            {record.is_active ? 'Khóa' : 'Kích hoạt'}
          </a>
          <Popconfirm
            title="Xóa người dùng này?"
            onConfirm={() => handleDelete(record.id)}
          >
            <a style={{ color: '#EF4444' }}>Xóa</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Quản lý người dùng">
      <ProTable<AdminUser>
        headerTitle="Danh sách người dùng"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 120 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowCreateModal(true)}
          >
            Tạo người dùng
          </Button>,
        ]}
        request={async (params) => {
          try {
            const res = await getUsers({
              page: params.current || 1,
              limit: params.pageSize || 20,
              user_type: params.user_type || undefined,
              is_active: params.is_active || undefined,
              search: params.full_name || params.email || undefined,
            });
            return {
              data: res.data || [],
              total: res.pagination?.total || 0,
              success: true,
            };
          } catch {
            return { data: [], total: 0, success: false };
          }
        }}
        columns={columns}
      />

      <Modal
        title="Tạo người dùng mới"
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          createForm.resetFields();
        }}
        footer={null}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="full_name"
            label="Họ tên"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, min: 6 }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="user_type"
            label="Vai trò"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: 'Học viên', value: 'student' },
                { label: 'Giảng viên', value: 'instructor' },
                { label: 'Quản trị viên', value: 'admin' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Tạo người dùng
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserManagement;
