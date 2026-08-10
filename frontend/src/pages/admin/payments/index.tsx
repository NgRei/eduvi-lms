import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Input,
  Select,
  Space,
  Typography,
  Spin,
  Button,
} from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  getAllPaymentsAdmin,
  type AdminPaymentsResponse,
} from '@/services/ant-design-pro/payments';

const { Text } = Typography;

const AdminPaymentsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<AdminPaymentsResponse['data']>([]);
  const [stats, setStats] = useState<AdminPaymentsResponse['stats']>({
    total_revenue: 0,
    total_transactions: 0,
    success_count: 0,
    pending_count: 0,
    expired_count: 0,
  });
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const fetchPayments = async (p = page, s = search, st = status) => {
    try {
      setLoading(true);
      const res = await getAllPaymentsAdmin({
        page: p,
        limit: 10,
        search: s,
        status: st,
      });

      if (res.success) {
        setData(res.data);
        setTotal(res.pagination.total);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1, search, status);
  }, [status]);

  const handleSearch = () => {
    setPage(1);
    fetchPayments(1, search, status);
  };

  const columns = [
    {
      title: 'Mã giao dịch',
      dataIndex: 'txn_ref',
      key: 'txn_ref',
      render: (text: string) => <Tag color="volcano">{text}</Tag>,
    },
    {
      title: 'Học viên',
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
      title: 'Số tiền',
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
    <PageContainer title="Quản lý Giao dịch & Doanh thu Toàn sàn">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng doanh thu sàn"
              value={stats.total_revenue}
              suffix="đ"
              prefix={<DollarOutlined style={{ color: '#10B981' }} />}
              styles={{ content: { color: '#059669', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="Giao dịch thành công"
              value={stats.success_count}
              prefix={<CheckCircleOutlined style={{ color: '#10B981' }} />}
              styles={{ content: { color: '#059669', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="Giao dịch chờ thanh toán"
              value={stats.pending_count}
              prefix={<ClockCircleOutlined style={{ color: '#F59E0B' }} />}
              styles={{ content: { color: '#D97706', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="Giao dịch đã hết hạn"
              value={stats.expired_count}
              prefix={<CloseCircleOutlined style={{ color: '#EF4444' }} />}
              styles={{ content: { color: '#DC2626', fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 8 }}>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
          <Space wrap>
            <Input
              placeholder="Tìm theo Mã GD, tên học viên, khóa học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 280 }}
              prefix={<SearchOutlined />}
            />
            <Select
              value={status}
              onChange={(val) => setStatus(val)}
              style={{ width: 180 }}
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'SUCCESS', label: 'Thành công' },
                { value: 'PENDING', label: 'Chờ thanh toán' },
                { value: 'EXPIRED', label: 'Đã hết hạn' },
              ]}
            />
            <Button type="primary" onClick={handleSearch}>
              Lọc dữ liệu
            </Button>
          </Space>

          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchPayments(1, search, status)}
          >
            Làm mới
          </Button>
        </Space>

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
              fetchPayments(p, search, status);
            },
          }}
        />
      </Card>
    </PageContainer>
  );
};

export default AdminPaymentsPage;
