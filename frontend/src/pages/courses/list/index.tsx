import { PageContainer } from '@ant-design/pro-components';
import { BookOutlined, StarOutlined, TeamOutlined } from '@ant-design/icons';
import { Card, Col, Empty, Input, Pagination, Row, Select, Spin, Tag, Typography } from 'antd';
import { history } from '@umijs/max';
import React, { useCallback, useEffect, useState } from 'react';
import { getCourses, getCategories, type CourseItem, type CourseCategory } from '@/services/ant-design-pro/courses';

const { Search } = Input;
const { Text } = Typography;

const CoursesList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [targetLevel, setTargetLevel] = useState<string | undefined>();
  const [sort, setSort] = useState('newest');

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      if (res.success) setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCourses({
        page,
        limit: 12,
        search: search || undefined,
        category_id: categoryId,
        target_level: targetLevel,
        sort,
      });
      if (res.success) {
        setCourses(res.data);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, targetLevel, sort]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <PageContainer title="Danh sách khóa học">
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="Tìm kiếm khóa học..."
              allowClear
              onSearch={handleSearch}
              enterButton
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              placeholder="Danh mục"
              allowClear
              style={{ width: '100%' }}
              value={categoryId}
              onChange={(v) => { setCategoryId(v); setPage(1); }}
              options={[
                { label: 'Tất cả danh mục', value: undefined },
                ...categories.map((c) => ({ label: c.name, value: c.id })),
              ]}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              placeholder="Cấp độ"
              allowClear
              style={{ width: '100%' }}
              value={targetLevel}
              onChange={(v) => { setTargetLevel(v); setPage(1); }}
              options={[
                { label: 'Tất cả', value: undefined },
                { label: 'Cơ bản', value: 'beginner' },
                { label: 'Trung bình', value: 'intermediate' },
                { label: 'Nâng cao', value: 'advanced' },
              ]}
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              style={{ width: '100%' }}
              value={sort}
              onChange={(v) => { setSort(v); setPage(1); }}
              options={[
                { label: 'Mới nhất', value: 'newest' },
                { label: 'Giá tăng dần', value: 'price_asc' },
                { label: 'Giá giảm dần', value: 'price_desc' },
                { label: 'Phổ biến nhất', value: 'popular' },
                { label: 'Đánh giá cao', value: 'rating' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <Empty description="Không tìm thấy khóa học nào." />
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {courses.map((course) => (
              <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                <Card
                  hoverable
                  cover={
                    <img
                      alt={course.title}
                      src={course.thumbnail || 'https://via.placeholder.com/300x160?text=Course'}
                      style={{ height: 160, objectFit: 'cover' }}
                    />
                  }
                  onClick={() => history.push(`/courses/${course.id}`)}
                >
                  <Card.Meta
                    title={
                      <div style={{ whiteSpace: 'normal', height: 44, overflow: 'hidden', fontSize: 14 }}>
                        {course.title}
                      </div>
                    }
                    description={
                      <div>
                        {course.category && (
                          <Tag color="purple" style={{ marginBottom: 8 }}>
                            {course.category.name}
                          </Tag>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <TeamOutlined /> {course.total_students}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <BookOutlined /> {course.total_lessons} bài
                          </Text>
                          {course.rating_avg > 0 && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <StarOutlined /> {course.rating_avg}
                            </Text>
                          )}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Text strong style={{ color: '#EF4444', fontSize: 16 }}>
                            {course.price === 0 ? 'Miễn phí' : `${course.price.toLocaleString()} đ`}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={page}
              total={total}
              pageSize={12}
              onChange={(p) => setPage(p)}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </PageContainer>
  );
};

export default CoursesList;
