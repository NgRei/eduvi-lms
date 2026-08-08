import { PageContainer } from '@ant-design/pro-components';
import { Card, Select, Spin, Table, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  type AuditLogEntry,
  getAuditLogs,
} from '@/services/ant-design-pro/auditLogs';

const { Text } = Typography;

const actionColors: Record<string, string> = {
  login: 'blue',
  logout: 'default',
  enroll: 'green',
  cert_issued: 'purple',
  grade_update: 'orange',
  user_delete: 'red',
};

const AuditLogsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    fetchLogs(1, actionFilter);
  }, [actionFilter]);

  const fetchLogs = async (p: number, action?: string) => {
    try {
      setLoading(true);
      const res = await getAuditLogs({ page: p, limit: 20, action });
      if (res.success) {
        setLogs(res.data);
        setTotal(res.pagination.total);
        setPage(p);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val: string) => new Date(val).toLocaleString('vi-VN'),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: (val: string) => (
        <Tag color={actionColors[val] || 'default'}>{val.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Người dùng',
      key: 'user',
      width: 200,
      render: (_: any, record: AuditLogEntry) => (
        <div>
          <div>{record.user?.full_name || '—'}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.user?.email}
          </Text>
        </div>
      ),
    },
    {
      title: 'Đối tượng',
      key: 'entity',
      width: 160,
      render: (_: any, record: AuditLogEntry) => (
        <div>
          {record.entity_type && <Tag>{record.entity_type}</Tag>}
          {record.entity_id && (
            <Text
              type="secondary"
              style={{ fontSize: 11, fontFamily: 'monospace' }}
            >
              {record.entity_id.substring(0, 8)}...
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Chi tiết',
      dataIndex: 'detail',
      key: 'detail',
      render: (val: Record<string, any> | null) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {val ? JSON.stringify(val) : '—'}
        </Text>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 130,
      render: (val: string | null) => val || '—',
    },
  ];

  return (
    <PageContainer title="Nhật ký hệ thống">
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Select
            placeholder="Lọc theo hành động"
            allowClear
            style={{ width: 200 }}
            onChange={(val) => setActionFilter(val)}
            options={[
              { value: 'login', label: 'Đăng nhập' },
              { value: 'enroll', label: 'Đăng ký khóa học' },
              { value: 'cert_issued', label: 'Cấp chứng chỉ' },
              { value: 'grade_update', label: 'Cập nhật điểm' },
              { value: 'user_delete', label: 'Xóa người dùng' },
            ]}
          />
        </div>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: (p) => fetchLogs(p, actionFilter),
            showTotal: (t) => `Tổng ${t} bản ghi`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </PageContainer>
  );
};

export default AuditLogsPage;
