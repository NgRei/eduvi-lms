import { Link } from '@umijs/max';
import { Button, Card, Result } from 'antd';
import React from 'react';

const Exception404: React.FC = () => {
  return (
    <Card variant="borderless">
      <Result
        status="404"
        title="404"
        subTitle="Xin lỗi, trang bạn tìm kiếm không tồn tại."
        extra={
          <Link to="/" prefetch>
            <Button type="primary">Về trang chủ</Button>
          </Link>
        }
      />
    </Card>
  );
};

export default Exception404;
