import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  message,
  Row,
  Spin,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  type CertificateVerifyResult,
  getMyCertificates,
  type UserCertificate,
  verifyCertificate,
} from '@/services/ant-design-pro/certificates';

const { Text } = Typography;

const CertificatesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] =
    useState<CertificateVerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await getMyCertificates();
      if (res.success) setCertificates(res.data);
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
      message.error('Không thể tải danh sách chứng chỉ');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode.trim()) {
      message.warning('Vui lòng nhập mã chứng chỉ');
      return;
    }
    try {
      setVerifying(true);
      const res = await verifyCertificate(verifyCode.trim());
      if (res.success) setVerifyResult(res.data);
    } catch (err: any) {
      setVerifyResult(null);
      message.error(err?.data?.error || 'Mã chứng chỉ không hợp lệ');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyManual = async (code: string) => {
    try {
      setVerifying(true);
      const res = await verifyCertificate(code);
      if (res.success) setVerifyResult(res.data);
    } catch (err: any) {
      setVerifyResult(null);
      message.error(err?.data?.error || 'Mã chứng chỉ không hợp lệ');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Chứng chỉ của tôi">
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Chứng chỉ của tôi"
      extra={
        <Button
          icon={<SearchOutlined />}
          onClick={() => setVerifyModalOpen(true)}
        >
          Xác thực chứng chỉ
        </Button>
      }
    >
      {certificates.length === 0 ? (
        <Empty description="Bạn chưa có chứng chỉ nào.">
          <Button
            type="primary"
            onClick={() => history.push('/student/my-courses')}
          >
            Khóa học của tôi
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {certificates.map((cert) => (
            <Col xs={24} sm={12} md={8} key={cert.id}>
              <Card
                hoverable
                style={{ borderTop: '3px solid #4F46E5' }}
                cover={
                  <div
                    style={{
                      padding: 24,
                      textAlign: 'center',
                      background:
                        'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                    }}
                  >
                    <SafetyCertificateOutlined
                      style={{ fontSize: 48, color: '#4F46E5' }}
                    />
                  </div>
                }
                actions={[
                  cert.file_url ? (
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      href={cert.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      key="download"
                      size="small"
                    >
                      Tải PDF
                    </Button>
                  ) : (
                    <Text type="secondary" key="processing" style={{ fontSize: 12 }}>
                      Đang tạo PDF...
                    </Text>
                  ),
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setVerifyCode(cert.cert_code);
                      setVerifyModalOpen(true);
                      setTimeout(() => handleVerifyManual(cert.cert_code), 100);
                    }}
                    key="verify"
                    size="small"
                  >
                    Xem Mã QR
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={cert.certificate?.title || 'Chứng chỉ'}
                  description={
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Khóa học: </Text>
                        <Text>{cert.course?.title}</Text>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Mã chứng chỉ: </Text>
                        <Tag color="blue">{cert.cert_code}</Tag>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>Ngày cấp: </Text>
                        <Text>
                          {new Date(cert.issued_at).toLocaleDateString('vi-VN')}
                        </Text>
                      </div>
                      {cert.expires_at && (
                        <div>
                          <Text strong>Hạn: </Text>
                          <Text>
                            {new Date(cert.expires_at).toLocaleDateString(
                              'vi-VN',
                            )}
                          </Text>
                        </div>
                      )}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Verify Modal */}
      <Modal
        title="Xác thực chứng chỉ"
        open={verifyModalOpen}
        onCancel={() => {
          setVerifyModalOpen(false);
          setVerifyResult(null);
          setVerifyCode('');
        }}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Nhập mã chứng chỉ (VD: CERT-XXXXXX)"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            onSearch={handleVerify}
            enterButton="Xác thực"
            loading={verifying}
            size="large"
          />
        </div>

        {verifyResult && (
          <Card size="small">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              {verifyResult.is_valid ? (
                <CheckCircleOutlined
                  style={{ fontSize: 48, color: '#10B981' }}
                />
              ) : (
                <CloseCircleOutlined
                  style={{ fontSize: 48, color: '#EF4444' }}
                />
              )}
              <div style={{ marginTop: 8 }}>
                <Tag
                  color={verifyResult.is_valid ? 'success' : 'error'}
                  style={{ fontSize: 14 }}
                >
                  {verifyResult.is_valid ? 'HỢP LỆ' : 'KHÔNG HỢP LỆ'}
                </Tag>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  `${window.location.origin}/verify-certificate?code=${verifyResult.cert_code}`,
                )}`}
                alt="QR Code Verification"
                style={{
                  border: '1px solid #e2e8f0',
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: '#fff',
                }}
              />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Quét mã QR để xác thực công khai
                </Text>
              </div>
            </div>

            <div>
              <Text strong>Người nhận: </Text>
              <Text>{verifyResult.holder_name}</Text>
            </div>
            <div>
              <Text strong>Khóa học: </Text>
              <Text>{verifyResult.course_title}</Text>
            </div>
            <div>
              <Text strong>Chứng chỉ: </Text>
              <Text>{verifyResult.certificate_title}</Text>
            </div>
            <div>
              <Text strong>Ngày cấp: </Text>
              <Text>
                {new Date(verifyResult.issued_at).toLocaleDateString('vi-VN')}
              </Text>
            </div>
            {verifyResult.expires_at && (
              <div>
                <Text strong>Hạn: </Text>
                <Text>
                  {new Date(verifyResult.expires_at).toLocaleDateString(
                    'vi-VN',
                  )}
                </Text>
              </div>
            )}
          </Card>
        )}
      </Modal>
    </PageContainer>
  );
};

export default CertificatesPage;
