import { UploadOutlined } from '@ant-design/icons';
import {
  ProForm,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Avatar, Button, Col, message, Row, Upload } from 'antd';
import React from 'react';
import useStyles from './index.style';

const BaseView: React.FC = () => {
  const { styles } = useStyles();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const profile = currentUser?.profile;

  const getAvatarURL = () => {
    return currentUser?.avatar || 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png';
  };

  const handleFinish = async () => {
    message.success('Cập nhật thông tin thành công!');
  };

  const isStudent = currentUser?.user_type === 'student';
  const isInstructor = currentUser?.user_type === 'instructor';

  return (
    <div className={styles.baseView}>
      <div className={styles.left}>
        <ProForm
          layout="vertical"
          onFinish={handleFinish}
          submitter={{
            searchConfig: {
              submitText: 'Cập nhật thông tin',
            },
            render: (_, dom) => dom[1],
          }}
          initialValues={{
            full_name: currentUser?.name,
            email: currentUser?.email,
            username: currentUser?.username,
            user_type: currentUser?.user_type,
            date_of_birth: profile?.date_of_birth,
            phone: profile?.phone,
            address: profile?.address,
            school_name: profile?.school_name,
            grade_level: profile?.grade_level,
            expertise: profile?.expertise,
            experience_years: profile?.experience_years,
            degree: profile?.degree,
            linkedin_url: profile?.linkedin_url,
          }}
          requiredMark={false}
        >
          <Row gutter={24}>
            <Col span={12}>
              <ProFormText
                name="full_name"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                placeholder="Nhập họ và tên"
              />
            </Col>
            <Col span={12}>
              <ProFormText
                name="email"
                label="Địa chỉ Email"
                disabled
              />
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <ProFormText
                name="username"
                label="Tên đăng nhập (Username)"
                disabled
              />
            </Col>
            <Col span={12}>
              <ProFormSelect
                name="user_type"
                label="Vai trò"
                disabled
                options={[
                  { label: 'Học viên', value: 'student' },
                  { label: 'Giảng viên', value: 'instructor' },
                  { label: 'Quản trị viên', value: 'admin' },
                ]}
              />
            </Col>
          </Row>

          {isStudent && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#4F46E5', margin: '16px 0 12px', borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
                Thông tin học viên
              </div>
              <Row gutter={24}>
                <Col span={12}>
                  <ProFormDatePicker
                    name="date_of_birth"
                    label="Ngày sinh"
                    placeholder="Chọn ngày sinh"
                    fieldProps={{ style: { width: '100%' } }}
                  />
                </Col>
                <Col span={12}>
                  <ProFormText
                    name="phone"
                    label="Số điện thoại"
                    placeholder="Nhập số điện thoại"
                  />
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={12}>
                  <ProFormText
                    name="school_name"
                    label="Trường học"
                    placeholder="Nhập tên trường"
                  />
                </Col>
                <Col span={12}>
                  <ProFormSelect
                    name="grade_level"
                    label="Lớp / Khối"
                    placeholder="Chọn lớp/khối"
                    options={[
                      { label: 'Lớp 10', value: '10' },
                      { label: 'Lớp 11', value: '11' },
                      { label: 'Lớp 12', value: '12' },
                      { label: 'Đại học năm 1', value: 'university-1' },
                      { label: 'Đại học năm 2', value: 'university-2' },
                      { label: 'Đại học năm 3', value: 'university-3' },
                      { label: 'Đại học năm 4', value: 'university-4' },
                      { label: 'Khác', value: 'other' },
                    ]}
                  />
                </Col>
              </Row>
              <ProFormTextArea
                name="address"
                label="Địa chỉ"
                placeholder="Nhập địa chỉ"
              />
            </>
          )}

          {isInstructor && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#4F46E5', margin: '16px 0 12px', borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
                Thông tin giảng viên
              </div>
              <Row gutter={24}>
                <Col span={12}>
                  <ProFormText
                    name="expertise"
                    label="Lĩnh vực chuyên môn"
                    placeholder="VD: Lập trình Web, Khoa học dữ liệu"
                  />
                </Col>
                <Col span={12}>
                  <ProFormText
                    name="degree"
                    label="Bằng cấp"
                    placeholder="VD: Thạc sĩ CNTT"
                  />
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={12}>
                  <ProFormText
                    name="experience_years"
                    label="Số năm kinh nghiệm"
                    placeholder="VD: 5"
                  />
                </Col>
                <Col span={12}>
                  <ProFormText
                    name="linkedin_url"
                    label="LinkedIn URL"
                    placeholder="https://linkedin.com/in/..."
                  />
                </Col>
              </Row>
            </>
          )}
        </ProForm>
      </div>
      <div className={styles.right}>
        <div className={styles.avatar_title}>Ảnh đại diện</div>
        <div className={styles.avatar}>
          <Avatar src={getAvatarURL()} size={120} />
        </div>
        <Upload showUploadList={false}>
          <div className={styles.button_view}>
            <Button>
              <UploadOutlined />
              Thay đổi ảnh
            </Button>
          </div>
        </Upload>
      </div>
    </div>
  );
};

export default BaseView;
