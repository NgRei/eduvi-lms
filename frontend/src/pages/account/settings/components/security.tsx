import { useModel } from '@umijs/max';
import { Card, Descriptions, List, Tag } from 'antd';
import React from 'react';

const SecurityView: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const profile = currentUser?.profile;
  const isStudent = currentUser?.user_type === 'student';
  const isInstructor = currentUser?.user_type === 'instructor';

  const roleLabel: Record<string, { label: string; color: string }> = {
    student: { label: 'Học viên', color: 'orange' },
    instructor: { label: 'Giảng viên', color: 'green' },
    admin: { label: 'Quản trị viên', color: 'red' },
  };

  const role = roleLabel[currentUser?.user_type || ''] || {
    label: 'Không xác định',
    color: 'default',
  };

  return (
    <div>
      <Card title="Thông tin tài khoản" style={{ marginBottom: 24 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Họ và tên">
            {currentUser?.name || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {currentUser?.email || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Username">
            <Tag color="blue">{currentUser?.username || '—'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <Tag color={role.color}>{role.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo tài khoản">
            {currentUser?.created_at
              ? new Date(currentUser.created_at).toLocaleDateString('vi-VN')
              : '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {isStudent && profile && (
        <Card title="Thông tin học viên" style={{ marginBottom: 24 }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Ngày sinh">
              {profile.date_of_birth
                ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN')
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {profile.phone || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Trường học">
              {profile.school_name || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Lớp / Khối">
              {profile.grade_level || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ" span={2}>
              {profile.address || '—'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {isInstructor && profile && (
        <Card title="Thông tin giảng viên" style={{ marginBottom: 24 }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Chuyên môn">
              {profile.expertise || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Bằng cấp">
              {profile.degree || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Kinh nghiệm">
              {profile.experience_years
                ? `${profile.experience_years} năm`
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng học viên">
              {profile.total_students || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Đánh giá trung bình">
              {profile.rating_avg ? `${profile.rating_avg}/5` : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="LinkedIn">
              {profile.linkedin_url || '—'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="Bảo mật">
        <List
          itemLayout="horizontal"
          dataSource={[
            {
              title: 'Mật khẩu',
              description: 'Đã thiết lập. Đổi mật khẩu tại tab "Đổi mật khẩu".',
              actions: [],
            },
            {
              title: 'Email xác thực',
              description: currentUser?.email
                ? `Đã liên kết: ${currentUser.email}`
                : 'Chưa liên kết',
              actions: [
                <Tag key="v" color="success">
                  Đã xác thực
                </Tag>,
              ],
            },
          ]}
          renderItem={(item) => (
            <List.Item actions={item.actions}>
              <List.Item.Meta
                title={item.title}
                description={item.description}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default SecurityView;
