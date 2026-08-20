import React, { useState } from 'react';
import { Form, Input, Select, Button, Upload, Table, Space, Popconfirm, message, Card } from 'antd';
import { UploadOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { addLessonMaterial, deleteLessonMaterial, type LessonMaterial } from '@/services/ant-design-pro/lessons';
import { uploadRawFile } from '@/services/ant-design-pro/uploads';

interface MaterialUploadProps {
  lessonId: string;
  materials: LessonMaterial[];
  onRefresh: () => void;
}

export const MaterialUpload: React.FC<MaterialUploadProps> = ({ lessonId, materials, onRefresh }) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  const handleUploadAndSave = async (values: any) => {
    if (fileList.length === 0) {
      message.error('Vui lòng chọn file tài liệu!');
      return;
    }

    try {
      setUploading(true);
      const file = fileList[0].originFileObj || fileList[0];
      const fileSizeKb = Math.round(file.size / 1024);

      // 1. Upload file to Cloudinary
      const uploadRes = await uploadRawFile(file, 'eduvi/materials');
      if (!uploadRes.success || !uploadRes.data?.url) {
        throw new Error('Upload file lên Cloudinary thất bại!');
      }

      // 2. Save material metadata to DB
      const saveRes = await addLessonMaterial(lessonId, {
        title: values.title,
        material_type: values.material_type,
        file_url: uploadRes.data.url,
        file_size_kb: fileSizeKb,
        is_downloadable: values.is_downloadable !== undefined ? values.is_downloadable : true,
      });

      if (saveRes.success) {
        message.success('Thêm tài liệu thành công!');
        form.resetFields();
        setFileList([]);
        onRefresh();
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.message || 'Không thể upload tài liệu!');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    try {
      const res = await deleteLessonMaterial(lessonId, materialId);
      if (res.success) {
        message.success('Đã xóa tài liệu!');
        onRefresh();
      }
    } catch (err) {
      message.error('Không thể xóa tài liệu!');
    }
  };

  const columns = [
    { title: 'Tên tài liệu', dataIndex: 'title', key: 'title' },
    {
      title: 'Định dạng',
      dataIndex: 'material_type',
      key: 'material_type',
      render: (t: string) => t.toUpperCase(),
    },
    {
      title: 'Kích thước',
      dataIndex: 'file_size_kb',
      key: 'file_size_kb',
      render: (v: number | null) => (v ? `${(v / 1024).toFixed(2)} MB` : '-'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: LessonMaterial) => (
        <Space>
          <a href={record.file_url} target="_blank" rel="noopener noreferrer">
            <DownloadOutlined /> Tải về
          </a>
          <Popconfirm title="Xóa tài liệu này?" onConfirm={() => handleDelete(record.id)}>
            <a style={{ color: '#EF4444' }}>
              <DeleteOutlined /> Xóa
            </a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Tài liệu đính kèm bài giảng" size="small" style={{ marginTop: 16 }}>
      <Table
        dataSource={materials}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical" onFinish={handleUploadAndSave}>
        <Space align="baseline" style={{ display: 'flex', width: '100%', flexWrap: 'wrap', gap: 16 }}>
          <Form.Item
            name="title"
            label="Tên hiển thị"
            rules={[{ required: true, message: 'Nhập tên tài liệu' }]}
            style={{ width: 250, marginBottom: 0 }}
          >
            <Input placeholder="Ví dụ: Slide bài giảng 1" />
          </Form.Item>

          <Form.Item
            name="material_type"
            label="Loại file"
            initialValue="pdf"
            style={{ width: 120, marginBottom: 0 }}
          >
            <Select
              options={[
                { label: 'PDF', value: 'pdf' },
                { label: 'Slide', value: 'slide' },
                { label: 'Link', value: 'link' },
                { label: 'ZIP', value: 'zip' },
                { label: 'Khác', value: 'other' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Chọn file"
            required
            style={{ marginBottom: 0 }}
          >
            <Upload
              beforeUpload={(file) => {
                setFileList([file]);
                return false; // prevent auto upload
              }}
              fileList={fileList}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Browser</Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={uploading}>
              Thêm tài liệu
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </Card>
  );
};
