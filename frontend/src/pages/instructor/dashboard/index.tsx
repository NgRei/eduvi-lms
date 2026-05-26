import { BookOutlined, StarOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic, Table, Tag } from 'antd';
import React from 'react';

const InstructorDashboard: React.FC = () => {
  const stats = [
    { title: 'Học viên đăng ký học', value: 1850, icon: <TeamOutlined style={{ color: '#4F46E5', fontSize: 24 }} />, prefix: '+' },
    { title: 'Khóa học của tôi', value: 6, icon: <BookOutlined style={{ color: '#10B981', fontSize: 24 }} /> },
    { title: 'Đánh giá trung bình', value: 4.8, icon: <StarOutlined style={{ color: '#F59E0B', fontSize: 24 }} />, suffix: '/5' },
    { title: 'Tỷ lệ hoàn thành bài', value: 85, icon: <TrophyOutlined style={{ color: '#EF4444', fontSize: 24 }} />, suffix: '%' },
  ];

  const studentProgress = [
    { key: '1', name: 'Nguyễn Văn An', course: 'Lập trình Node.js thực chiến', progress: '92%', status: 'Hoàn thành tốt' },
    { key: '2', name: 'Lê Hoàng Cường', course: 'Xây dựng RESTful API với Express', progress: '75%', status: 'Đang tiến hành' },
    { key: '3', name: 'Phạm Minh Đức', course: 'Lập trình Node.js thực chiến', progress: '40%', status: 'Đang tiến hành' },
    { key: '4', name: 'Đặng Thị Lan', course: 'Cơ sở dữ liệu MySQL nâng cao', progress: '100%', status: 'Đã nhận chứng chỉ' },
  ];

  const columns = [
    { title: 'Học viên', dataIndex: 'name', key: 'name', render: (text: string) => <strong>{text}</strong> },
    { title: 'Khóa học tham gia', dataIndex: 'course', key: 'course' },
    { title: 'Tiến độ học tập', dataIndex: 'progress', key: 'progress', render: (text: string) => <Tag color="blue">{text}</Tag> },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status.includes('Chứng chỉ') || status.includes('tốt') ? 'green' : 'gold'}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <PageContainer title="Trang tổng quan Giảng viên">
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
          <Card title="Theo dõi tiến độ học tập gần đây" hoverable>
            <Table dataSource={studentProgress} columns={columns} pagination={false} />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default InstructorDashboard;
