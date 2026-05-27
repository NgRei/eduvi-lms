import { List, Tag } from 'antd';
import React from 'react';
import { useModel } from '@umijs/max';

type Unpacked<T> = T extends (infer U)[] ? U : T;

const SecurityView: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  const passwordStrength = {
    strong: <Tag color="success">Mạnh</Tag>,
    medium: <Tag color="warning">Trung bình</Tag>,
    weak: <Tag color="error">Yếu</Tag>,
  };

  const getData = () => [
    {
      title: 'Mật khẩu tài khoản',
      description: (
        <>
          Độ mạnh hiện tại: {passwordStrength.strong}
        </>
      ),
      actions: [
        <a key="Modify" href="/account/settings" onClick={(e) => { e.preventDefault(); }}>
          Đổi mật khẩu
        </a>,
      ],
    },
    {
      title: 'Địa chỉ Email',
      description: `Email đã xác thực: ${currentUser?.email || 'Chưa cập nhật'}`,
      actions: [
        <span key="verified" style={{ color: '#52c41a' }}>Đã xác thực</span>,
      ],
    },
    {
      title: 'Tên đăng nhập',
      description: `Username: ${currentUser?.username || 'Chưa cập nhật'}`,
      actions: [],
    },
    {
      title: 'Xác thực hai yếu tố',
      description: 'Chưa bật xác thực hai yếu tố (2FA). Bật để tăng cường bảo mật.',
      actions: [
        <a key="bind" href="#">
          Bật
        </a>,
      ],
    },
  ];

  const data = getData();
  return (
    <List<Unpacked<typeof data>>
      itemLayout="horizontal"
      dataSource={data}
      renderItem={(item) => (
        <List.Item actions={item.actions}>
          <List.Item.Meta title={item.title} description={item.description} />
        </List.Item>
      )}
    />
  );
};

export default SecurityView;
