import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  EyeOutlined,
  FileDoneOutlined,
  GlobalOutlined,
  IdcardOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  approveInstructorApplication,
  getAdminInstructorApplications,
  type InstructorApplication,
  rejectInstructorApplication,
} from '@/services/ant-design-pro/instructorApplication';

const { Text, Paragraph, Title } = Typography;
const { TextArea } = Input;

const AdminInstructorApplications: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const [selectedApplication, setSelectedApplication] = useState<InstructorApplication | null>(null);
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [rejectModalVisible, setRejectModalVisible] = useState<boolean>(false);
  const [currentRejectId, setCurrentRejectId] = useState<string | null>(null);

  const [rejectForm] = Form.useForm();
  const [statusTab, setStatusTab] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const handleApprove = async (record: InstructorApplication) => {
    try {
      setActionLoading(true);
      const res = await approveInstructorApplication(record.id);
      if (res.success) {
        message.success(`Đã phê duyệt thành công hồ sơ của ${record.candidate?.full_name || 'ứng viên'}!`);
        actionRef.current?.reload();
        if (drawerVisible && selectedApplication?.id === record.id) {
          setDrawerVisible(false);
        }
      } else {
        message.error(res.error || 'Không thể phê duyệt hồ sơ');
      }
    } catch (err: any) {
      message.error(err?.data?.error || err?.message || 'Có lỗi xảy ra khi phê duyệt!');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (id: string) => {
    setCurrentRejectId(id);
    rejectForm.resetFields();
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      if (!currentRejectId) return;

      setActionLoading(true);
      const res = await rejectInstructorApplication(currentRejectId, {
        rejection_reason: values.rejection_reason,
        admin_notes: values.admin_notes,
      });

      if (res.success) {
        message.success('Đã gửi phản hồi từ chối hồ sơ tới ứng viên!');
        setRejectModalVisible(false);
        actionRef.current?.reload();
        if (drawerVisible && selectedApplication?.id === currentRejectId) {
          setDrawerVisible(false);
        }
      } else {
        message.error(res.error || 'Không thể từ chối hồ sơ');
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.data?.error || err?.message || 'Có lỗi xảy ra khi từ chối!');
    } finally {
      setActionLoading(false);
    }
  };

  const openDrawer = (record: InstructorApplication) => {
    setSelectedApplication(record);
    setDrawerVisible(true);
  };

  const columns: ProColumns<InstructorApplication>[] = [
    {
      title: 'Ứng viên',
      dataIndex: 'candidate',
      render: (_, record) => (
        <Space orientation="horizontal" size={12}>
          <Avatar
            src={record.candidate?.avatar_url}
            icon={<UserOutlined />}
            size={42}
            style={{ backgroundColor: '#4F46E5' }}
          />
          <div>
            <div style={{ fontWeight: 600, color: '#111827' }}>
              {record.candidate?.full_name || 'N/A'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>
              {record.candidate?.email || 'N/A'}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Chức danh & Lĩnh vực',
      dataIndex: 'headline',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.headline}</div>
          <Tag color="blue" style={{ marginTop: 4 }}>
            {record.expertise}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Kinh nghiệm',
      dataIndex: 'experience_years',
      width: 110,
      render: (_, record) => <strong>{record.experience_years} năm</strong>,
    },
    {
      title: 'Hồ sơ năng lực',
      dataIndex: 'cv_url',
      width: 140,
      search: false,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          {record.cv_url ? (
            <a href={record.cv_url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
              <LinkOutlined /> Xem CV
            </a>
          ) : (
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>Không có CV</span>
          )}
          {record.intro_video_url && (
            <a href={record.intro_video_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#EC4899' }}>
              <VideoCameraOutlined /> Video demo
            </a>
          )}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      valueType: 'select',
      valueEnum: {
        all: { text: 'Tất cả' },
        pending: { text: 'Chờ duyệt', status: 'Warning' },
        approved: { text: 'Đã duyệt', status: 'Success' },
        rejected: { text: 'Đã từ chối', status: 'Error' },
      },
      render: (_, record) => {
        if (record.status === 'pending') {
          return <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ duyệt</Tag>;
        }
        if (record.status === 'approved') {
          return <Tag color="success" icon={<CheckCircleOutlined />}>Đã duyệt</Tag>;
        }
        return <Tag color="error" icon={<CloseCircleOutlined />}>Đã từ chối</Tag>;
      },
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'created_at',
      width: 130,
      search: false,
      render: (_, record) => new Date(record.created_at).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 190,
      render: (_, record) => (
        <Space size={8}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDrawer(record)}
          >
            Chi tiết
          </Button>

          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="Phê duyệt ứng viên này thành Giảng viên?"
                description="Tài khoản sẽ được nâng cấp quyền ngay lập tức."
                onConfirm={() => handleApprove(record)}
                okText="Duyệt"
                cancelText="Hủy"
                okButtonProps={{ loading: actionLoading, style: { background: '#10B981', borderColor: '#10B981' } }}
              >
                <Button size="small" type="primary" style={{ background: '#10B981', borderColor: '#10B981' }}>
                  Duyệt
                </Button>
              </Popconfirm>

              <Button
                size="small"
                danger
                onClick={() => openRejectModal(record.id)}
              >
                Từ chối
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Thẩm định Hồ sơ Giảng viên"
      subTitle="Quản lý và xét duyệt các hồ sơ đăng ký trở thành đối tác giảng dạy tại Eduvi LMS"
    >
      <ProTable<InstructorApplication>
        headerTitle="Danh sách Đơn Ứng tuyển"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 120 }}
        toolbar={{
          menu: {
            type: 'tab',
            activeKey: statusTab,
            items: [
              { key: 'all', label: 'Tất cả hồ sơ' },
              { key: 'pending', label: '⏳ Chờ duyệt' },
              { key: 'approved', label: '✅ Đã phê duyệt' },
              { key: 'rejected', label: '❌ Đã từ chối' },
            ],
            onChange: (key) => {
              setStatusTab(key as string);
              actionRef.current?.reload();
            },
          },
        }}
        request={async (params) => {
          try {
            const res = await getAdminInstructorApplications({
              page: params.current || 1,
              limit: params.pageSize || 20,
              status: statusTab !== 'all' ? statusTab : undefined,
              search: params.candidate || params.headline || undefined,
            });
            return {
              data: res.data || [],
              total: res.pagination?.total || 0,
              success: true,
            };
          } catch {
            return { data: [], total: 0, success: false };
          }
        }}
        columns={columns}
      />

      {/* Drawer Details */}
      <Drawer
        title={
          <Space>
            <CrownOutlined style={{ color: '#F59E0B' }} />
            <span>Hồ sơ chi tiết Ứng viên Giảng viên</span>
          </Space>
        }
        width={680}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          selectedApplication && selectedApplication.status === 'pending' && (
            <Space>
              <Button
                danger
                onClick={() => openRejectModal(selectedApplication.id)}
                loading={actionLoading}
              >
                Từ chối hồ sơ
              </Button>
              <Popconfirm
                title="Phê duyệt ứng viên này thành Giảng viên?"
                description="Tài khoản học viên sẽ ngay lập tức được nâng cấp thành Giảng viên."
                onConfirm={() => handleApprove(selectedApplication)}
                okText="Xác nhận Duyệt"
                cancelText="Hủy"
                okButtonProps={{ style: { background: '#10B981', borderColor: '#10B981' } }}
              >
                <Button
                  type="primary"
                  style={{ background: '#10B981', borderColor: '#10B981' }}
                  loading={actionLoading}
                >
                  Phê duyệt ngay
                </Button>
              </Popconfirm>
            </Space>
          )
        }
      >
        {selectedApplication && (
          <div>
            {/* Candidate Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px',
                background: '#F9FAFB',
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <Avatar
                size={64}
                src={selectedApplication.candidate?.avatar_url}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#4F46E5' }}
              />
              <div style={{ flex: 1 }}>
                <Title level={4} style={{ margin: 0 }}>
                  {selectedApplication.candidate?.full_name}
                </Title>
                <Text type="secondary">{selectedApplication.candidate?.email}</Text>
                <div style={{ marginTop: 6 }}>
                  {selectedApplication.status === 'pending' && <Tag color="warning">Đang chờ xét duyệt</Tag>}
                  {selectedApplication.status === 'approved' && <Tag color="success">Đã phê duyệt</Tag>}
                  {selectedApplication.status === 'rejected' && <Tag color="error">Đã từ chối</Tag>}
                  <Tag color="purple">{selectedApplication.experience_years} năm kinh nghiệm</Tag>
                </div>
              </div>
            </div>

            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Chức danh / Tiêu đề chuyên môn">
                <Text strong>{selectedApplication.headline}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Lĩnh vực giảng dạy">
                <Tag color="blue">{selectedApplication.expertise}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Bằng cấp / Học vị">
                {selectedApplication.education_degree || 'Chưa cung cấp'}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại liên hệ">
                {selectedApplication.phone_number ? (
                  <Text copyable>{selectedApplication.phone_number}</Text>
                ) : (
                  'Chưa cung cấp'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày nộp hồ sơ">
                {new Date(selectedApplication.created_at).toLocaleString('vi-VN')}
              </Descriptions.Item>
              {selectedApplication.reviewed_at && (
                <Descriptions.Item label="Thời điểm xét duyệt">
                  {new Date(selectedApplication.reviewed_at).toLocaleString('vi-VN')}
                  {selectedApplication.reviewer && ` (Bởi: ${selectedApplication.reviewer.full_name})`}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider style={{ fontSize: 14 }}>
              Hồ sơ năng lực & Liên kết
            </Divider>

            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
              {selectedApplication.cv_url ? (
                <Card size="small" style={{ borderRadius: 8 }}>
                  <Space>
                    <FileDoneOutlined style={{ color: '#4F46E5', fontSize: 18 }} />
                    <div>
                      <Text strong>File CV / Resume đính kèm:</Text>
                      <div>
                        <a href={selectedApplication.cv_url} target="_blank" rel="noreferrer">
                          {selectedApplication.cv_url}
                        </a>
                      </div>
                    </div>
                  </Space>
                </Card>
              ) : (
                <Text type="secondary">Ứng viên không đính kèm liên kết CV.</Text>
              )}

              {selectedApplication.intro_video_url && (
                <Card size="small" style={{ borderRadius: 8, borderColor: '#FBCFE8' }}>
                  <Space>
                    <VideoCameraOutlined style={{ color: '#EC4899', fontSize: 18 }} />
                    <div>
                      <Text strong>Video bài giảng mẫu / Giới thiệu:</Text>
                      <div>
                        <a href={selectedApplication.intro_video_url} target="_blank" rel="noreferrer">
                          {selectedApplication.intro_video_url}
                        </a>
                      </div>
                    </div>
                  </Space>
                </Card>
              )}

              <Row gutter={8}>
                {selectedApplication.linkedin_url && (
                  <Col span={12}>
                    <Button
                      block
                      icon={<GlobalOutlined />}
                      href={selectedApplication.linkedin_url}
                      target="_blank"
                    >
                      Trang LinkedIn
                    </Button>
                  </Col>
                )}
                {selectedApplication.portfolio_url && (
                  <Col span={12}>
                    <Button
                      block
                      icon={<LinkOutlined />}
                      href={selectedApplication.portfolio_url}
                      target="_blank"
                    >
                      Portfolio / GitHub
                    </Button>
                  </Col>
                )}
              </Row>
            </Space>

            <Divider style={{ fontSize: 14 }}>
              Giới thiệu bản thân (Bio)
            </Divider>
            <Paragraph style={{ whiteSpace: 'pre-line', background: '#F9FAFB', padding: 12, borderRadius: 8 }}>
              {selectedApplication.bio}
            </Paragraph>

            {selectedApplication.teaching_reason && (
              <>
                <Divider style={{ fontSize: 14 }}>
                  Mục tiêu & Động lực giảng dạy
                </Divider>
                <Paragraph style={{ whiteSpace: 'pre-line', background: '#F9FAFB', padding: 12, borderRadius: 8 }}>
                  {selectedApplication.teaching_reason}
                </Paragraph>
              </>
            )}

            {selectedApplication.course_proposal && (
              <>
                <Divider style={{ fontSize: 14 }}>
                  Đề cương / Ý tưởng khóa học dự kiến
                </Divider>
                <Paragraph style={{ whiteSpace: 'pre-line', background: '#F9FAFB', padding: 12, borderRadius: 8 }}>
                  {selectedApplication.course_proposal}
                </Paragraph>
              </>
            )}

            {selectedApplication.rejection_reason && (
              <>
                <Divider style={{ fontSize: 14, color: '#EF4444' }}>
                  Lý do từ chối đã phản hồi
                </Divider>
                <Paragraph style={{ whiteSpace: 'pre-line', background: '#FEF2F2', padding: 12, borderRadius: 8, color: '#991B1B' }}>
                  {selectedApplication.rejection_reason}
                </Paragraph>
              </>
            )}
          </div>
        )}
      </Drawer>

      {/* Reject Modal */}
      <Modal
        title="Từ chối hồ sơ ứng tuyển Giảng viên"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={handleConfirmReject}
        confirmLoading={actionLoading}
        okText="Xác nhận Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="rejection_reason"
            label="Lý do từ chối (Ứng viên sẽ nhìn thấy phản hồi này)"
            rules={[
              { required: true, message: 'Vui lòng cung cấp lý do từ chối để phản hồi cho ứng viên!' },
              { min: 10, message: 'Lý do từ chối tối thiểu 10 ký tự!' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="VD: Hồ sơ chưa đính kèm bằng cấp chuyên môn hoặc link video demo bài giảng bị lỗi không mở được. Vui lòng cập nhật lại..."
            />
          </Form.Item>

          <Form.Item
            name="admin_notes"
            label="Ghi chú nội bộ của Ban Quản trị (Chỉ Admin nhìn thấy)"
          >
            <TextArea rows={2} placeholder="Ghi chú riêng của admin thẩm định..." />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default AdminInstructorApplications;
