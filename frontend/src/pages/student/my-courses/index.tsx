import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Col, Empty, Progress, Row, Tabs, Tag } from 'antd';
import React from 'react';

interface EnrolledCourse {
  id: string;
  title: string;
  category: string;
  instructor: string;
  progress: number;
  thumbnail: string;
  completedAt?: string;
}

const myCoursesData: EnrolledCourse[] = [
  {
    id: '1',
    title: 'Lập trình Node.js thực chiến từ Zero đến Hero',
    category: 'Lập trình Backend',
    instructor: 'TS. Trần Thị Bình',
    progress: 75,
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
  },
  {
    id: '2',
    title: 'Xây dựng RESTful API với Express và TypeScript',
    category: 'Lập trình Backend',
    instructor: 'ThS. Vũ Thị Hồng',
    progress: 40,
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
  },
  {
    id: '3',
    title: 'Cơ sở dữ liệu MySQL nâng cao cho Lập trình viên',
    category: 'Cơ sở dữ liệu',
    instructor: 'TS. Trần Thị Bình',
    progress: 10,
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d',
  },
];

const completedCoursesData: EnrolledCourse[] = [
  {
    id: '4',
    title: 'Nhập môn lập trình thuật toán C++ cơ bản',
    category: 'Nhập môn Lập trình',
    instructor: 'ThS. Nguyễn Hoàng Anh',
    progress: 100,
    thumbnail: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3',
    completedAt: '2026-04-15',
  },
];

const MyCourses: React.FC = () => {
  const renderCourseGrid = (courses: EnrolledCourse[]) => {
    if (courses.length === 0) {
      return <Empty description="Bạn chưa đăng ký khóa học nào trong danh sách này." />;
    }

    return (
      <Row gutter={[16, 16]}>
        {courses.map((course) => (
          <Col xs={24} sm={12} md={8} key={course.id}>
            <Card
              hoverable
              cover={
                <img
                  alt={course.title}
                  src={course.thumbnail}
                  style={{ height: 160, objectFit: 'cover' }}
                />
              }
              actions={[
                <Button key="study-btn" type="primary" style={{ width: '85%' }}>
                  {course.progress === 100 ? 'Xem lại bài học' : 'Tiếp tục học bài'}
                </Button>,
              ]}
            >
              <Card.Meta
                title={<div style={{ whiteSpace: 'normal', height: 48, overflow: 'hidden' }}>{course.title}</div>}
                description={
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <Tag color="purple">{course.category}</Tag>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>· GV: {course.instructor}</span>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <span style={{ fontSize: 13 }}>Tiến độ: </span>
                      <Progress percent={course.progress} size="small" status={course.progress === 100 ? 'success' : 'active'} />
                    </div>
                    {course.completedAt && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#10B981', fontWeight: 'bold' }}>
                        Hoàn thành ngày: {course.completedAt}
                      </div>
                    )}
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <PageContainer title="Khóa học của tôi">
      <Card hoverable>
        <Tabs
          defaultActiveKey="active"
          items={[
            {
              key: 'active',
              label: 'Khóa học đang diễn ra',
              children: renderCourseGrid(myCoursesData),
            },
            {
              key: 'completed',
              label: 'Khóa học đã hoàn thành',
              children: renderCourseGrid(completedCoursesData),
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default MyCourses;
