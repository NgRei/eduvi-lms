import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Drawer,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import {
  type CourseCategory,
  type CourseDetail,
  getCategories,
  getCourseById,
  updateCourse,
} from '@/services/ant-design-pro/courses';
import {
  createLesson,
  deleteLesson,
  getLessonsByCourse,
  type Lesson,
  updateLesson,
} from '@/services/ant-design-pro/lessons';
import { LessonContentForm } from '@/components/lesson/LessonContentForm';
import { MaterialUpload } from '@/components/lesson/MaterialUpload';

const { TextArea } = Input;

const EditCourse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [courseForm] = Form.useForm();
  const [lessonForm] = Form.useForm();
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const fetchCourse = useCallback(
    async (courseId: string) => {
      try {
        const [courseRes, lessonsRes, catRes] = await Promise.all([
          getCourseById(courseId),
          getLessonsByCourse(courseId),
          getCategories(),
        ]);
        if (courseRes.success) {
          setCourse(courseRes.data);
          courseForm.setFieldsValue({
            title: courseRes.data.title,
            short_description: courseRes.data.short_description,
            description: courseRes.data.description,
            price: courseRes.data.price,
            target_level: courseRes.data.target_level,
            category_id: courseRes.data.category?.id,
            is_published: courseRes.data.is_published,
          });
        }
        if (lessonsRes.success) setLessons(lessonsRes.data);
        if (catRes.success) setCategories(catRes.data);
      } catch (err) {
        console.error(err);
        message.error('Không thể tải dữ liệu khóa học');
      } finally {
        setLoading(false);
      }
    },
    [courseForm],
  );

  useEffect(() => {
    if (id) fetchCourse(id);
  }, [id, fetchCourse]);

  const handleSaveCourse = async (values: any) => {
    if (!id) return;
    try {
      setSaving(true);
      await updateCourse(id, values);
      message.success('Cập nhật khóa học thành công!');
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLesson = async (values: any) => {
    if (!id) return;
    try {
      if (editingLesson) {
        await updateLesson(editingLesson.id, values);
        message.success('Cập nhật bài giảng thành công!');
      } else {
        await createLesson(id, values);
        message.success('Thêm bài giảng thành công!');
      }
      setShowLessonForm(false);
      setEditingLesson(null);
      lessonForm.resetFields();
      fetchCourse(id);
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể lưu bài giảng');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!id) return;
    try {
      await deleteLesson(lessonId);
      message.success('Đã xóa bài giảng!');
      fetchCourse(id);
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể xóa bài giảng');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!course) {
    return <PageContainer>Không tìm thấy khóa học.</PageContainer>;
  }

  const lessonColumns = [
    { title: 'STT', dataIndex: 'sort_order', key: 'sort_order', width: 60 },
    { title: 'Tên bài giảng', dataIndex: 'title', key: 'title' },
    {
      title: 'Loại',
      dataIndex: 'lesson_type',
      key: 'lesson_type',
      render: (t: string) => {
        let color = 'default';
        if (t === 'video') color = 'blue';
        if (t === 'text') color = 'cyan';
        if (t === 'pdf') color = 'red';
        if (t === 'slide') color = 'orange';
        if (t === 'quiz') color = 'purple';
        return <Tag color={color}>{t ? t.toUpperCase() : '-'}</Tag>;
      },
    },
    {
      title: 'Thời lượng',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (v: number | null) => (v ? `${v} phút` : '-'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_published',
      key: 'is_published',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'}>{v ? 'Đã xuất bản' : 'Nháp'}</Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: Lesson) => (
        <Space>
          <a
            onClick={() => {
              setEditingLesson(record);
              lessonForm.setFieldsValue({
                title: record.title,
                lesson_type: record.lesson_type,
                duration_minutes: record.duration_minutes,
                is_preview: record.is_preview !== undefined ? record.is_preview : false,
                is_published: record.is_published,
                content_url: record.content_url || undefined,
                content_text: record.content_text || undefined,
              });
              setShowLessonForm(true);
            }}
          >
            <EditOutlined /> Sửa
          </a>
          <Popconfirm
            title="Xóa bài giảng này?"
            onConfirm={() => handleDeleteLesson(record.id)}
          >
            <a style={{ color: '#EF4444' }}>
              <DeleteOutlined /> Xóa
            </a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={`Chỉnh sửa: ${course.title}`}>
      <Tabs
        items={[
          {
            key: 'info',
            label: 'Thông tin khóa học',
            children: (
              <Card>
                <Form
                  form={courseForm}
                  layout="vertical"
                  onFinish={handleSaveCourse}
                >
                  <Form.Item
                    name="title"
                    label="Tên khóa học"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item name="category_id" label="Danh mục">
                    <Select
                      allowClear
                      options={categories.map((c) => ({
                        label: c.name,
                        value: c.id,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item name="short_description" label="Mô tả ngắn">
                    <TextArea rows={2} />
                  </Form.Item>
                  <Form.Item name="description" label="Mô tả chi tiết">
                    <TextArea rows={6} />
                  </Form.Item>
                  <Space>
                    <Form.Item name="price" label="Giá (VNĐ)">
                      <InputNumber min={0} />
                    </Form.Item>
                    <Form.Item name="target_level" label="Cấp độ">
                      <Select
                        options={[
                          { label: 'Tất cả', value: 'all' },
                          { label: 'Cơ bản', value: 'beginner' },
                          { label: 'Trung bình', value: 'intermediate' },
                          { label: 'Nâng cao', value: 'advanced' },
                        ]}
                      />
                    </Form.Item>
                  </Space>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={saving}>
                      Lưu thay đổi
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'lessons',
            label: `Bài giảng (${lessons.length})`,
            children: (
              <Card>
                <div style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingLesson(null);
                      lessonForm.resetFields();
                      setShowLessonForm(true);
                    }}
                  >
                    Thêm bài giảng
                  </Button>
                </div>

                <Drawer
                  title={editingLesson ? 'Chỉnh sửa bài giảng' : 'Tạo bài giảng mới'}
                  width={720}
                  onClose={() => {
                    setShowLessonForm(false);
                    setEditingLesson(null);
                  }}
                  open={showLessonForm}
                  destroyOnClose
                  extra={
                    <Space>
                      <Button onClick={() => {
                        setShowLessonForm(false);
                        setEditingLesson(null);
                      }}>
                        Hủy
                      </Button>
                      <Button type="primary" onClick={() => lessonForm.submit()}>
                        Lưu bài học
                      </Button>
                    </Space>
                  }
                >
                  <Form
                    form={lessonForm}
                    layout="vertical"
                    onFinish={handleSaveLesson}
                  >
                    <Form.Item
                      name="title"
                      label="Tên bài giảng"
                      rules={[{ required: true, message: 'Nhập tên bài giảng!' }]}
                    >
                      <Input placeholder="Tên bài giảng" />
                    </Form.Item>

                    <Space size="large" style={{ display: 'flex', width: '100%', flexWrap: 'wrap' }}>
                      <Form.Item
                        name="lesson_type"
                        label="Loại bài giảng"
                        initialValue="video"
                        style={{ width: 180 }}
                      >
                        <Select
                          options={[
                            { label: 'Video', value: 'video' },
                            { label: 'Text (Văn bản)', value: 'text' },
                            { label: 'PDF', value: 'pdf' },
                            { label: 'Slide (PDF/PPT)', value: 'slide' },
                            { label: 'Quiz (Bài tập)', value: 'quiz' },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item name="duration_minutes" label="Thời lượng (phút)" style={{ width: 140 }}>
                        <InputNumber placeholder="Phút" min={1} style={{ width: '100%' }} />
                      </Form.Item>

                      <Form.Item name="is_preview" label="Xem trước miễn phí" valuePropName="checked" initialValue={false} style={{ width: 150 }}>
                        <Select
                          options={[
                            { label: 'Không cho phép', value: false },
                            { label: 'Cho phép xem trước', value: true },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item name="is_published" label="Trạng thái" initialValue={true} style={{ width: 140 }}>
                        <Select
                          options={[
                            { label: 'Nháp', value: false },
                            { label: 'Xuất bản', value: true },
                          ]}
                        />
                      </Form.Item>
                    </Space>

                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.lesson_type !== curr.lesson_type}>
                      {({ getFieldValue }) => {
                        const type = getFieldValue('lesson_type') || 'video';
                        return (
                          <LessonContentForm
                            courseId={id!}
                            lessonType={type}
                            form={lessonForm}
                          />
                        );
                      }}
                    </Form.Item>
                  </Form>

                  {editingLesson && (
                    <MaterialUpload
                      lessonId={editingLesson.id}
                      materials={editingLesson.materials || []}
                      onRefresh={() => fetchCourse(id!)}
                    />
                  )}
                </Drawer>

                <Table
                  dataSource={lessons}
                  columns={lessonColumns}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            ),
          },
        ]}
      />
    </PageContainer>
  );
};

export default EditCourse;
