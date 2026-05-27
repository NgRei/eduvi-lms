import { UploadOutlined } from '@ant-design/icons';
import {
  ProForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Avatar, Button, message, Upload } from 'antd';
import React from 'react';
import useStyles from './index.style';

const BaseView: React.FC = () => {
  const { styles } = useStyles();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  const getAvatarURL = () => {
    return currentUser?.avatar || 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png';
  };

  const handleFinish = async () => {
    message.success('Cập nhật thông tin thành công!');
  };

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
            email: currentUser?.email,
            name: currentUser?.name,
            user_type: currentUser?.user_type,
          }}
          requiredMark={false}
        >
          <ProFormText
            width="md"
            name="name"
            label="Họ và tên"
            rules={[
              {
                required: true,
                message: 'Vui lòng nhập họ và tên!',
              },
            ]}
          />
          <ProFormText
            width="md"
            name="email"
            label="Địa chỉ Email"
            disabled
          />
          <ProFormSelect
            width="sm"
            name="user_type"
            label="Vai trò"
            disabled
            options={[
              { label: 'Học viên', value: 'student' },
              { label: 'Giảng viên', value: 'instructor' },
              { label: 'Quản trị viên', value: 'admin' },
            ]}
          />
          <ProFormTextArea
            name="profile"
            label="Giới thiệu bản thân"
            placeholder="Mô tả ngắn về bạn..."
          />
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
