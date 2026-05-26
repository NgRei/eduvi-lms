import { BookOutlined, ClockCircleOutlined, StarOutlined, TrophyOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Progress, Row, Statistic, Table, Tag } from 'antd';
import React from 'react';

const StudentDashboard: React.FC = () => {
  const stats: { title: string; value: number; icon: React.ReactNode; prefix?: string; suffix?: string }[] = [
    { title: 'Khóa học đang học', value: 3, icon: <BookOutlined style={{ color: '#4F46E5', fontSize: 24 }} /> },
    { title: 'Giờ học tích lũy', value: 45, icon: <ClockCircleOutlined style={{ color: '#10B981', fontSize: 24 }} />, suffix: 'h' },
    { title: 'Bài học đã hoàn thành', value: 24, icon: <TrophyOutlined style={{ color: '#F59E0B', fontSize: 24 }} /> },
    { title: 'Chứng chỉ đã nhận', value: 1, icon: <StarOutlined style={{ color: '#EF4444', fontSize: 24 }} /> },
  ];

  const currentCourses = [
    { key: '1', title: 'Lập trình Node.js thực chiến từ Zero đến Hero', progress: 75, nextLesson: 'Bài 32: Tìm hiểu kiến trúc MVC' },
    { key: '2', title: 'Xây dựng RESTful API với Express và TypeScript', progress: 40, nextLesson: 'Bài 8: Validation request DTO với Joi' },
    { key: '3', title: 'Cơ sở dữ liệu MySQL nâng cao cho Lập trình viên', progress: 10, nextLesson: 'Bài 3: Tối ưu Index và ExPlain Query' },
  ];

  const columns = [
    { title: 'Tên khóa học', dataIndex: 'title', key: 'title', render: (text: string) => <strong>{text}</strong> },
    {
      title: 'Tiến độ học tập',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <div style={{ width: 150 }}>
          <Progress percent={progress} size="small" status={progress === 100 ? 'success' : 'active'} />
        </div>
      ),
    },
    { title: 'Bài học tiếp theo', dataIndex: 'nextLesson', key: 'nextLesson', render: (text: string) => <Tag color="geekblue">{text}</Tag> },
  ];

  return (
    <PageContainer title="Trang học tập của tôi">
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
          <Card title="Khóa học đang diễn ra" hoverable>
            <Table dataSource={currentCourses} columns={columns} pagination={false} />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default StudentDashboard;
