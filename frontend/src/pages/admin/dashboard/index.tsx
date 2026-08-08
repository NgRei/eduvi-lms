import {
  BookOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Spin, Statistic, Table, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  type AdminDashboardData,
  getAdminDashboard,
} from '@/services/ant-design-pro/admin';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminDashboardData | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAdminDashboard();
        if (res.success) setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <PageContainer title="Báo cáo hệ thống">
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  const stats = [
    {
      title: 'Tổng học viên',
      value: data?.totalStudents || 0,
      icon: <TeamOutlined style={{ color: '#4F46E5', fontSize: 24 }} />,
    },
    {
      title: 'Tổng giảng viên',
      value: data?.totalInstructors || 0,
      icon: <UserOutlined style={{ color: '#10B981', fontSize: 24 }} />,
    },
    {
      title: 'Khóa học hoạt động',
      value: data?.activeCourses || 0,
      icon: <BookOutlined style={{ color: '#F59E0B', fontSize: 24 }} />,
    },
    {
      title: 'Tổng đăng ký',
      value: data?.totalEnrollments || 0,
      icon: <TrophyOutlined style={{ color: '#EF4444', fontSize: 24 }} />,
    },
  ];

  const userColumns = [
    {
      title: 'Họ tên',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (t: string) => <strong>{t}</strong>,
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Vai trò',
      dataIndex: 'user_type',
      key: 'user_type',
      render: (t: string) => {
        const colors: Record<string, string> = {
          student: 'blue',
          instructor: 'purple',
          admin: 'red',
        };
        return <Tag color={colors[t] || 'default'}>{t}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (t: string) => new Date(t).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <PageContainer title="Báo cáo hệ thống">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <Card hoverable>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  valueStyle={{ fontSize: 24, fontWeight: 'bold' }}
                />
                {stat.icon}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="Người dùng đăng ký gần đây">
        <Table
          dataSource={data?.recentUsers || []}
          columns={userColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </PageContainer>
  );
};

export default AdminDashboard;
