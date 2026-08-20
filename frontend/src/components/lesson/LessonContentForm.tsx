import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Upload, Space, Spin, message } from 'antd';
import { UploadOutlined, VideoCameraOutlined, FilePdfOutlined } from '@ant-design/icons';
import { uploadVideo, uploadRawFile } from '@/services/ant-design-pro/uploads';
import { getAssignments, type Assignment } from '@/services/ant-design-pro/assignments';

interface LessonContentFormProps {
  courseId: string;
  lessonType: 'video' | 'text' | 'pdf' | 'slide' | 'quiz';
  form: any;
}

export const LessonContentForm: React.FC<LessonContentFormProps> = ({ courseId, lessonType, form }) => {
  const [uploading, setUploading] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  useEffect(() => {
    if (lessonType === 'quiz') {
      const fetchAssignments = async () => {
        try {
          setLoadingAssignments(true);
          const res = await getAssignments({ course_id: courseId });
          if (res.success) {
            setAssignments(res.data || []);
          }
        } catch (err) {
          message.error('Không thể tải danh sách bài tập của khóa học');
        } finally {
          setLoadingAssignments(false);
        }
      };
      fetchAssignments();
    }
  }, [lessonType, courseId]);

  const handleVideoUpload = async (file: File) => {
    try {
      setUploading(true);
      const res = await uploadVideo(file, courseId);
      if (res.success && res.data) {
        form.setFieldsValue({ content_url: res.data.cloudinary_id });
        message.success('Upload video lên Cloudinary thành công!');
      } else {
        throw new Error();
      }
    } catch (err) {
      message.error('Upload video thất bại!');
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    try {
      setUploading(true);
      const res = await uploadRawFile(file, 'eduvi/documents');
      if (res.success && res.data?.url) {
        form.setFieldsValue({ content_url: res.data.url });
        message.success('Upload tài liệu lên Cloudinary thành công!');
      } else {
        throw new Error();
      }
    } catch (err) {
      message.error('Upload tài liệu thất bại!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '16px 0' }}>
      {lessonType === 'video' && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Form.Item
            name="content_url"
            label="Đường dẫn Video (YouTube URL hoặc Cloudinary ID)"
            rules={[{ required: true, message: 'Vui lòng nhập đường dẫn hoặc upload video!' }]}
          >
            <Input placeholder="Nhập link YouTube (ví dụ: https://www.youtube.com/watch?v=...) hoặc Cloudinary ID" />
          </Form.Item>
          <Form.Item label="Hoặc tải lên video mới (Cloudinary)">
            <Upload
              beforeUpload={(file) => {
                handleVideoUpload(file);
                return false;
              }}
              maxCount={1}
              showUploadList={false}
            >
              <Button icon={<VideoCameraOutlined />} loading={uploading}>
                Chọn file video (.mp4, .webm, ...)
              </Button>
            </Upload>
          </Form.Item>
        </Space>
      )}

      {lessonType === 'text' && (
        <Form.Item
          name="content_text"
          label="Nội dung bài học dạng văn bản (Hỗ trợ HTML/Markdown)"
          rules={[{ required: true, message: 'Vui lòng nhập nội dung bài học!' }]}
        >
          <Input.TextArea rows={12} placeholder="Nhập nội dung bài học bằng văn bản tại đây..." />
        </Form.Item>
      )}

      {lessonType === 'pdf' && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Form.Item
            name="content_url"
            label="Đường dẫn file PDF"
            rules={[{ required: true, message: 'Vui lòng nhập link PDF hoặc upload!' }]}
          >
            <Input placeholder="Đường dẫn PDF (https://.../document.pdf)" />
          </Form.Item>
          <Form.Item label="Hoặc tải lên file PDF mới (Cloudinary)">
            <Upload
              beforeUpload={(file) => {
                handleDocumentUpload(file);
                return false;
              }}
              accept=".pdf"
              maxCount={1}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                Chọn file PDF
              </Button>
            </Upload>
          </Form.Item>
        </Space>
      )}

      {lessonType === 'slide' && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Form.Item
            name="content_url"
            label="Đường dẫn file Slide (PDF/PPT)"
            rules={[{ required: true, message: 'Vui lòng nhập link slide hoặc upload!' }]}
          >
            <Input placeholder="Đường dẫn file slide (https://.../presentation.pdf)" />
          </Form.Item>
          <Form.Item label="Hoặc tải lên slide mới (Cloudinary)">
            <Upload
              beforeUpload={(file) => {
                handleDocumentUpload(file);
                return false;
              }}
              accept=".pdf,.ppt,.pptx"
              maxCount={1}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                Chọn file Slide (PDF/PPT)
              </Button>
            </Upload>
          </Form.Item>
        </Space>
      )}

      {lessonType === 'quiz' && (
        <Form.Item
          name="content_url"
          label="Chọn bài tập / bài kiểm tra liên kết"
          rules={[{ required: true, message: 'Vui lòng chọn bài tập liên kết!' }]}
        >
          {loadingAssignments ? (
            <Spin size="small" />
          ) : (
            <Select
              placeholder="Chọn một bài tập trong khóa học này"
              options={assignments.map((a) => ({
                label: `${a.title} (${a.assignment_type === 'quiz' ? 'Trắc nghiệm' : 'Tự luận'}, ${a.total_points}đ)`,
                value: a.id,
              }))}
            />
          )}
        </Form.Item>
      )}
    </div>
  );
};
