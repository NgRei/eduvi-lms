import { Link } from '@umijs/max';
import { Button, Card, Result } from 'antd';

export default () => (
  <Card variant="borderless">
    <Result
      status="500"
      title="500"
      subTitle="Xin lỗi, máy chủ đang gặp lỗi. Vui lòng thử lại sau."
      extra={
        <Link to="/" prefetch>
          <Button type="primary">Về trang chủ</Button>
        </Link>
      }
    />
  </Card>
);
