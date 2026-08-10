import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  Button,
} from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  getInstructorTransactions,
  type InstructorTransactionsResponse,
} from '@/services/ant-design-pro/payments';

const { Text } = Typography;

const InstructorPaymentsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<InstructorTransactionsResponse['data']>([]);
  const [stats, setStats] = useState<InstructorTransactionsResponse['stats']>({
    instructor_revenue: 0,
    total_sales: 0,
  });
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const fetchTransactions = async (p = page) => {
    try {
      setLoading(true);
      const res = await getInstructorTransactions({ page: p, limit: 10 });
      if (res.success) {
        setData(res.data);
        setTotal(res.pagination.total);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch instructor transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
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
          {course?.title || 'N/A'}
        </Text>
      ),
    },
    {
      title: 'Học viên thanh toán',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => (
        <div>
          <Text strong style={{ display: 'block' }}>{user?.full_name || 'N/A'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{user?.email}</Text>
        </div>
      ),
    },
    {
      title: 'Số tiền thu về',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#059669', fontSize: 15 }}>
          +{amount?.toLocaleString('vi-VN')} đ
        </Text>
      ),
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
        return <Tag color="error" icon={<CloseCircleOutlined />}>Hết hạn</Tag>;
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(date).toLocaleString('vi-VN')}
        </Text>
      ),
    },
  ];

  return (
    <PageContainer title="Doanh thu & Giao dịch Khóa học của tôi">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng thu nhập nhận được"
              value={stats.instructor_revenue}
              suffix="đ"
              prefix={<DollarOutlined style={{ color: '#10B981' }} />}
              styles={{ content: { color: '#059669', fontWeight: 'bold', fontSize: 28 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng lượt học viên đã thanh toán mua khóa học"
              value={stats.total_sales}
              suffix="lượt"
              prefix={<ShoppingOutlined style={{ color: '#3B82F6' }} />}
              styles={{ content: { color: '#2563EB', fontWeight: 'bold', fontSize: 28 } }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ borderRadius: 8 }}
        title="Danh sách Giao dịch Mua Khóa học"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => fetchTransactions(page)}>
            Làm mới
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            onChange: (p) => {
              setPage(p);
              fetchTransactions(p);
            },
          }}
        />
      </Card>
    </PageContainer>
  );
};

export default InstructorPaymentsPage;
