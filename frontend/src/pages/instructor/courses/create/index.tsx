import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  StepsForm,
} from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  Input,
  InputNumber,
  List,
  message,
  Row,
  Select,
  Space,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  type CourseCategory,
  createCourse,
  getCategories,
} from '@/services/ant-design-pro/courses';
import { createLesson } from '@/services/ant-design-pro/lessons';

const CreateCourse: React.FC = () => {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [syllabus, setSyllabus] = useState<string[]>([]);
  const [newLesson, setNewLesson] = useState('');

  useEffect(() => {
    getCategories()
      .then((res) => {
        if (res.success) setCategories(res.data);
      })
      .catch(console.error);
  }, []);

  const addLesson = () => {
    if (!newLesson.trim()) return;
    setSyllabus([...syllabus, newLesson.trim()]);
    setNewLesson('');
  };

  const removeLesson = (index: number) => {
    setSyllabus(syllabus.filter((_, i) => i !== index));
  };

  const handleStep1 = async (values: any) => {
    try {
      const res = await createCourse({
        title: values.title,
        category_id: values.category_id,
        short_description: values.description,
        description: values.description,
        price: values.price || 0,
        target_level: values.target_level || 'all',
      });
      if (res.success && res.data) {
        setCreatedCourseId(res.data.id);
        message.success('Tạo khóa học thành công!');
        return true;
      }
      return false;
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể tạo khóa học');
      return false;
    }
  };

  const handleStep2 = async () => {
    if (!createdCourseId) {
      message.error('Không tìm thấy khóa học');
      return false;
    }
    if (syllabus.length === 0) {
      message.warning('Vui lòng tạo ít nhất 1 bài giảng!');
      return false;
    }
    try {
      for (let i = 0; i < syllabus.length; i++) {
        await createLesson(createdCourseId, {
          title: syllabus[i],
          lesson_type: 'video',
        });
      }
      message.success(`Đã thêm ${syllabus.length} bài giảng!`);
      return true;
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể thêm bài giảng');
      return false;
    }
  };

  return (
    <PageContainer title="Tạo khóa học mới">
      <Card>
        <StepsForm
          onFinish={async () => {
            message.success('Tạo khóa học thành công!');
            history.push('/instructor/courses');
            return true;
          }}
          formProps={{
            validateMessages: {
              required: 'Trường này là bắt buộc!',
            },
          }}
        >
          <StepsForm.StepForm
            name="basic"
            title="Thông tin cơ bản"
            onFinish={handleStep1}
          >
            <ProFormText
              name="title"
              label="Tên khóa học"
              placeholder="Nhập tên khóa học"
              rules={[{ required: true }]}
            />
            <ProFormSelect
              name="category_id"
              label="Danh mục"
              placeholder="Chọn danh mục"
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
            <ProFormTextArea
              name="description"
              label="Mô tả khóa học"
              placeholder="Mô tả ngắn về khóa học"
            />
            <Row gutter={16}>
              <Col span={8}>
                <ProFormDigit
                  name="price"
                  label="Giá (VNĐ)"
                  min={0}
                  initialValue={0}
                />
              </Col>
              <Col span={8}>
                <ProFormSelect
                  name="target_level"
                  label="Cấp độ"
                  initialValue="all"
                  options={[
                    { label: 'Tất cả', value: 'all' },
                    { label: 'Cơ bản', value: 'beginner' },
                    { label: 'Trung bình', value: 'intermediate' },
                    { label: 'Nâng cao', value: 'advanced' },
                  ]}
                />
              </Col>
            </Row>
          </StepsForm.StepForm>

          <StepsForm.StepForm
            name="syllabus"
            title="Giáo trình bài giảng"
            onFinish={handleStep2}
          >
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 'bold',
                }}
              >
                Danh sách bài giảng:
              </label>
              <List
                bordered
                dataSource={syllabus}
                locale={{ emptyText: 'Chưa có bài giảng nào' }}
                renderItem={(item, index) => (
                  <List.Item
                    actions={[
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeLesson(index)}
                      />,
                    ]}
                  >
                    {index + 1}. {item}
                  </List.Item>
                )}
              />
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={newLesson}
                onChange={(e) => setNewLesson(e.target.value)}
                placeholder="Nhập tên bài giảng"
                onPressEnter={addLesson}
              />
              <Button
                type="primary"
                onClick={addLesson}
                icon={<PlusOutlined />}
              >
                Thêm
              </Button>
            </Space.Compact>
          </StepsForm.StepForm>

          <StepsForm.StepForm name="publish" title="Hoàn tất">
            <div style={{ textAlign: 'center', padding: 40 }}>
              <h3>Khóa học đã sẵn sàng!</h3>
              <p>Nhấn "Hoàn tất" để lưu và chuyển về trang quản lý.</p>
            </div>
          </StepsForm.StepForm>
        </StepsForm>
      </Card>
    </PageContainer>
  );
};

export default CreateCourse;
