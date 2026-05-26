import { BookOutlined, DollarOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic, Table, Tag } from 'antd';
import React from 'react';

const AdminDashboard: React.FC = () => {
  const stats = [
    { title: 'Tổng số học viên', value: 12450, icon: <TeamOutlined style={{ color: '#4F46E5', fontSize: 24 }} />, prefix: '+' },
    { title: 'Tổng số giảng viên', value: 380, icon: <UserOutlined style={{ color: '#10B981', fontSize: 24 }} /> },
    { title: 'Khóa học đang hoạt động', value: 120, icon: <BookOutlined style={{ color: '#F59E0B', fontSize: 24 }} /> },
    { title: 'Doanh thu tháng này', value: 85200000, icon: <DollarOutlined style={{ color: '#EF4444', fontSize: 24 }} />, suffix: 'đ' },
  ];

  const recentUsers = [
    { key: '1', name: 'Nguyễn Văn An', email: 'annv@gmail.com', role: 'student', username: 'annv@102', date: '2026-05-25' },
    { key: '2', name: 'Trần Thị Bình', email: 'binhtt@gmail.com', role: 'instructor', username: 'binhtt@394', date: '2026-05-24' },
    { key: '3', name: 'Lê Hoàng Cường', email: 'cuonglh@gmail.com', role: 'student', username: 'cuonglh@441', date: '2026-05-24' },
    { key: '4', name: 'Phạm Minh Đức', email: 'ducpm@gmail.com', role: 'student', username: 'ducpm@782', date: '2026-05-23' },
  ];

  const columns = [
    { title: 'Họ và tên', dataIndex: 'name', key: 'name', render: (text: string) => <strong>{text}</strong> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Tên tài khoản (Username)', dataIndex: 'username', key: 'username', render: (text: string) => <Tag color="blue">{text}</Tag> },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : role === 'instructor' ? 'green' : 'orange'}>
          {role === 'admin' ? 'Quản trị' : role === 'instructor' ? 'Giảng viên' : 'Học viên'}
        </Tag>
      ),
    },
    { title: 'Ngày tham gia', dataIndex: 'date', key: 'date' },
  ];

  return (
    <PageContainer title="Tổng quan hệ thống">
      <Row gutter={[16, 16]}>
        {stats.map((stat, i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <Card hoverable styles={{ body: { padding: 20 } }}>
              <div className="flex items-center justify-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}>{stat.title}</div>
                  <Statistic 
                    value={stat.value} 
                    prefix={stat.prefix} 
                    suffix={stat.suffix} 
                    valueStyle={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }} 
                  />
                </div>
                <div style={{ background: '#F3F4F6', borderRadius: 8, padding: 12 }}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Thành viên đăng ký mới gần đây" hoverable>
            <Table dataSource={recentUsers} columns={columns} pagination={false} />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default AdminDashboard;
