import { Link } from '@umijs/max';
import { Button, Card, Result } from 'antd';

export default () => (
  <Card variant="borderless">
    <Result
      status="403"
      title="403"
      subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
      extra={
        <Link to="/" prefetch>
          <Button type="primary">Về trang chủ</Button>
        </Link>
      }
    />
  </Card>
);
