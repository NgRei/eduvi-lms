import { 
  StepsForm,
  ProFormText,
  ProFormSelect,
  ProFormDigit,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Form, Input, Button, Space, List, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import React, { useState } from 'react';

const CreateCourse: React.FC = () => {
  const [syllabus, setSyllabus] = useState<string[]>([
    'Bài 1: Giới thiệu tổng quan môn học',
    'Bài 2: Hướng dẫn cài đặt môi trường phát triển',
    'Bài 3: Viết ứng dụng đầu tiên Hello World',
  ]);
  const [newLesson, setNewLesson] = useState('');

  const addLesson = () => {
    if (!newLesson.trim()) return;
    setSyllabus([...syllabus, newLesson.trim()]);
    setNewLesson('');
    message.success('Đã thêm bài giảng vào giáo trình nháp!');
  };

  const removeLesson = (index: number) => {
    setSyllabus(syllabus.filter((_, i) => i !== index));
    message.info('Đã xóa bài giảng khỏi giáo trình.');
  };

  const handleFinish = async (values: any) => {
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API Call
    console.log('Created Course Data:', { ...values, syllabus });
    message.success('Đăng ký tạo khóa học mới thành công!');
    history.push('/instructor/courses');
  };

  return (
    <PageContainer title="Tạo khóa học mới">
      <Card hoverable>
        <StepsForm
          onFinish={handleFinish}
          formProps={{
            validateMessages: {
              required: 'Trường này là bắt buộc!',
            },
          }}
        >
          <StepsForm.StepForm
            name="basic"
            title="Thông tin cơ bản"
            onFinish={async () => true}
          >
            <ProFormText
              name="title"
              label="Tên khóa học"
              placeholder="Nhập tên khóa học gợi cảm hứng (Ví dụ: Lập trình ReactJS nâng cao)"
              rules={[{ required: true }]}
            />
            
            <ProFormSelect
              name="category"
              label="Danh mục phân loại"
              valueEnum={{
                backend: 'Lập trình Backend',
                frontend: 'Lập trình Frontend / Di động',
                database: 'Cơ sở dữ liệu & DevOps',
              }}
              placeholder="Chọn danh mục phù hợp"
              rules={[{ required: true }]}
            />

            <ProFormTextArea
              name="description"
              label="Mô tả tóm tắt khóa học"
              placeholder="Viết mô tả ngắn để học viên dễ hiểu mục tiêu khóa học..."
              rules={[{ required: true }]}
            />

            <ProFormDigit
              name="price"
              label="Học phí (đơn vị: VNĐ)"
              placeholder="Nhập học phí mong muốn. Điền 0 nếu miễn phí."
              rules={[{ required: true }]}
              min={0}
            />
          </StepsForm.StepForm>

          <StepsForm.StepForm
            name="syllabus"
            title="Thiết lập giáo trình bài giảng"
            onFinish={async () => {
              if (syllabus.length === 0) {
                message.warning('Vui lòng tạo ít nhất 1 bài giảng trong giáo trình!');
                return false;
              }
              return true;
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Giáo trình nháp hiện tại:</label>
              <List
                bordered
                dataSource={syllabus}
                renderItem={(item, index) => (
                  <List.Item
                    actions={[
                      <Button 
                        key="delete"
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => removeLesson(index)}
                      />
                    ]}
                  >
                    {item}
                  </List.Item>
                )}
              />
            </div>

            <Space.Compact style={{ width: '100%', marginTop: 10 }}>
              <Input 
                value={newLesson}
                onChange={(e) => setNewLesson(e.target.value)}
                placeholder="Nhập tên bài giảng tiếp theo (Ví dụ: Bài 4: Tìm hiểu cấu trúc Route)" 
                onPressEnter={addLesson}
              />
              <Button type="primary" onClick={addLesson} icon={<PlusOutlined />}>
                Thêm bài giảng
              </Button>
            </Space.Compact>
          </StepsForm.StepForm>

          <StepsForm.StepForm
            name="publish"
            title="Đăng tải & Ảnh đại diện"
          >
            <ProFormText
              name="thumbnail"
              label="Đường dẫn ảnh đại diện (Thumbnail URL)"
              placeholder="Nhập URL ảnh đại diện khóa học (ví dụ: https://image.com/course.jpg)"
              rules={[{ required: true }]}
              initialValue="https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
            />
            <ProFormTextArea
              name="welcomeMessage"
              label="Lời chào mừng học viên"
              placeholder="Viết lời khích lệ học viên khi họ đăng ký thành công khóa học của bạn..."
            />
          </StepsForm.StepForm>
        </StepsForm>
      </Card>
    </PageContainer>
  );
};

export default CreateCourse;
