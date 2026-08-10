import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Space,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { getMyPayments, type PaymentData } from '@/services/ant-design-pro/payments';

const { Text } = Typography;

const StudentPaymentsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<(PaymentData & { course?: { id: string; title: string; thumbnail: string | null } })[]>([]);

  const fetchMyPayments = async () => {
    try {
      setLoading(true);
      const res = await getMyPayments();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch my payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPayments();
  }, []);

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'txn_ref',
      key: 'txn_ref',
      render: (text: string) => <Tag color="volcano">{text}</Tag>,
    },
    {
      title: 'Khóa học',
      dataIndex: 'course',
      key: 'course',
      render: (course: any) => (
        <Text strong style={{ color: '#1E3A8A' }}>
          {course?.title || 'Khóa học đã đăng ký'}
        </Text>
      ),
    },
    {
      title: 'Số tiền thanh toán',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#EF4444' }}>
          {amount?.toLocaleString('vi-VN')} đ
        </Text>
      ),
    },
    {
      title: 'Phương thức',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method: string) => <Tag color="blue">{method}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (st: string) => {
        if (st === 'SUCCESS') {
          return <Tag color="success" icon={<CheckCircleOutlined />}>Thành công</Tag>;
        }
        if (st === 'PENDING') {
          return <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ thanh toán</Tag>;
        }
        return <Tag color="error" icon={<CloseCircleOutlined />}>Đã hết hạn</Tag>;
      },
    },
    {
      title: 'Ngày thanh toán',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(date).toLocaleString('vi-VN')}
        </Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => {
        if (record.status === 'SUCCESS' && record.course_id) {
          return (
            <Button
              type="primary"
              size="small"
              icon={<BookOutlined />}
              onClick={() => history.push(`/courses/${record.course_id}`)}
              style={{ backgroundColor: '#059669', borderColor: '#059669' }}
            >
              Vào học ngay
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <PageContainer title="Lịch sử Thanh toán & Hóa đơn cá nhân">
      <Card
        style={{ borderRadius: 8 }}
        title="Danh sách Đơn hàng & Hóa đơn Khóa học"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchMyPayments}>
            Làm mới
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </PageContainer>
  );
};

export default StudentPaymentsPage;
