import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  List,
  message,
  Row,
  Spin,
  Tag,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  type Assignment,
  getAssignments,
} from '@/services/ant-design-pro/assignments';
import { checkEnrollment } from '@/services/ant-design-pro/enrollments';
import {
  getLessonProgress,
  type LessonProgressItem,
  markLessonComplete,
  unmarkLessonComplete,
  updateWatchPosition,
} from '@/services/ant-design-pro/lessonProgress';
import {
  getLessonById,
  getLessonsByCourse,
  type Lesson,
} from '@/services/ant-design-pro/lessons';
import { getSignedVideoUrl } from '@/services/ant-design-pro/uploads';

const { Title, Text } = Typography;

const LessonViewPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progressMap, setProgressMap] = useState<
    Record<string, LessonProgressItem>
  >({});
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLesson = useCallback(
    async (lid: string) => {
      try {
        const res = await getLessonById(lid);
        if (res.success) {
          setLesson(res.data);
          if (
            res.data.lesson_type === 'video' &&
            res.data.video_id &&
            courseId
          ) {
            const urlRes = await getSignedVideoUrl(res.data.video_id, courseId);
            if (urlRes.success && urlRes.data) setSignedUrl(urlRes.data.url);
          }
        }
      } catch (err) {
        console.error('Failed to fetch lesson:', err);
        message.error('Không thể tải bài giảng');
      }
    },
    [courseId],
  );

  const fetchProgress = useCallback(async (cid: string) => {
    try {
      const res = await getLessonProgress(cid);
      if (res.success) setProgressMap(res.data);
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    }
  }, []);

  const fetchLessons = useCallback(async (cid: string) => {
    try {
      const res = await getLessonsByCourse(cid);
      if (res.success) setLessons(res.data);
    } catch (err) {
      console.error('Failed to fetch lessons:', err);
    }
  }, []);

  const fetchAssignment = useCallback(async (lid: string) => {
    try {
      const res = await getAssignments({
        lesson_id: lid,
        is_published: 'true',
      });
      if (res.data && res.data.length > 0) {
        setAssignment(res.data[0]);
      } else {
        setAssignment(null);
      }
    } catch (err) {
      setAssignment(null);
    }
  }, []);

  useEffect(() => {
    if (!courseId || !lessonId) return;

    const init = async () => {
      setLoading(true);
      try {
        const enrollCheck = await checkEnrollment(courseId);
        const isEnrolled = enrollCheck.success && enrollCheck.data?.enrolled;
        if (!isEnrolled) {
          message.warning('Bạn chưa đăng ký khóa học này');
          history.push(`/courses/${courseId}`);
          return;
        }
        await Promise.all([
          fetchLesson(lessonId),
          fetchLessons(courseId),
          fetchProgress(courseId),
          fetchAssignment(lessonId),
        ]);
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [courseId, lessonId, fetchLesson, fetchLessons, fetchProgress]);

  useEffect(() => {
    if (lessonId && progressMap[lessonId]) {
      setIsCompleted(progressMap[lessonId].is_completed);
    } else {
      setIsCompleted(false);
    }
    setSignedUrl(null);
  }, [lessonId, progressMap]);

  const debouncedSavePosition = useCallback(
    (position: number, duration: number) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (lessonId && courseId) {
          updateWatchPosition({
            lesson_id: lessonId,
            course_id: courseId,
            last_position: Math.floor(position),
            watch_duration: Math.floor(duration),
          }).catch((err) => console.error('Failed to save position:', err));
        }
      }, 5000);
    },
    [lessonId, courseId],
  );

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      debouncedSavePosition(video.currentTime, video.currentTime);
    }
  };

  const handleToggleComplete = async () => {
    if (!lessonId || !courseId) return;
    try {
      if (isCompleted) {
        await unmarkLessonComplete(lessonId, courseId);
        setIsCompleted(false);
        message.success('Đã bỏ đánh dấu hoàn thành');
      } else {
        await markLessonComplete(lessonId, courseId);
        setIsCompleted(true);
        message.success('Đã đánh dấu hoàn thành bài giảng');
      }
      fetchProgress(courseId);
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể cập nhật tiến độ');
    }
  };

  const handleLessonClick = (lid: string) => {
    history.push(`/student/courses/${courseId}/lessons/${lid}`);
  };

  const completedCount = Object.values(progressMap).filter(
    (p) => p.is_completed,
  ).length;

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!lesson) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Text>Không tìm thấy bài giảng.</Text>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={lesson.title}
      breadcrumb={{
        routes: [
          { path: '/student/my-courses', breadcrumbName: 'Khóa học của tôi' },
          { path: '', breadcrumbName: lesson.title },
        ],
        itemRender: (route) => {
          if (route.path) {
            return (
              <a onClick={() => history.push(route.path!)}>
                {route.breadcrumbName}
              </a>
            );
          }
          return <span>{route.breadcrumbName}</span>;
        },
      }}
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card>
            {lesson.lesson_type === 'video' && signedUrl && (
              <video
                ref={videoRef}
                src={signedUrl}
                controls
                style={{
                  width: '100%',
                  borderRadius: 8,
                  backgroundColor: '#000',
                }}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleToggleComplete}
              />
            )}

            {lesson.lesson_type === 'text' && lesson.content_text && (
              <div
                style={{ padding: '16px 0', lineHeight: 1.8 }}
                dangerouslySetInnerHTML={{ __html: lesson.content_text }}
              />
            )}

            <div
              style={{
                marginTop: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Title level={5} style={{ margin: 0 }}>
                {lesson.title}
              </Title>
              <Button
                type={isCompleted ? 'default' : 'primary'}
                icon={isCompleted ? <CheckCircleOutlined /> : undefined}
                onClick={handleToggleComplete}
              >
                {isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
              </Button>
            </div>

            {lesson.materials && lesson.materials.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Tài liệu bài giảng:</Text>
                <List
                  size="small"
                  dataSource={lesson.materials}
                  renderItem={(mat) => (
                    <List.Item>
                      <a
                        href={mat.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {mat.title} ({mat.material_type.toUpperCase()})
                      </a>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Card>

          {assignment && (
            <Card
              size="small"
              style={{ marginTop: 16, borderColor: '#4F46E5' }}
              title={
                <>
                  <FileTextOutlined /> Bài tập: {assignment.title}
                </>
              }
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <Tag color="blue">
                    {assignment.assignment_type === 'quiz'
                      ? 'Trắc nghiệm'
                      : assignment.assignment_type === 'essay'
                        ? 'Tự luận'
                        : 'Nộp file'}
                  </Tag>
                  <Text type="secondary">
                    Điểm đạt: {assignment.passing_score}/
                    {assignment.total_points}
                  </Text>
                  {assignment.time_limit_minutes && (
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      <ClockCircleOutlined /> {assignment.time_limit_minutes}{' '}
                      phút
                    </Text>
                  )}
                </div>
                <Button
                  type="primary"
                  onClick={() =>
                    history.push(`/student/assignments/${assignment.id}`)
                  }
                >
                  Làm bài tập
                </Button>
              </div>
            </Card>
          )}
        </Col>

        <Col xs={24} md={8}>
          <Card
            title={`Danh sách bài giảng (${completedCount}/${lessons.length})`}
            size="small"
          >
            <List
              dataSource={lessons}
              renderItem={(item) => {
                const itemProgress = progressMap[item.id];
                const itemCompleted = itemProgress?.is_completed || false;
                const isCurrent = item.id === lessonId;
                return (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isCurrent ? '#EEF2FF' : undefined,
                      padding: '8px 12px',
                      borderRadius: 6,
                    }}
                    onClick={() => handleLessonClick(item.id)}
                  >
                    <List.Item.Meta
                      avatar={
                        itemCompleted ? (
                          <CheckCircleOutlined
                            style={{ color: '#10B981', fontSize: 18 }}
                          />
                        ) : item.lesson_type === 'video' ? (
                          <PlayCircleOutlined
                            style={{ color: '#6B7280', fontSize: 18 }}
                          />
                        ) : (
                          <BookOutlined
                            style={{ color: '#6B7280', fontSize: 18 }}
                          />
                        )
                      }
                      title={
                        <Text
                          style={{ fontWeight: isCurrent ? 'bold' : 'normal' }}
                        >
                          {item.title}
                        </Text>
                      }
                      description={
                        item.duration_minutes
                          ? `${item.duration_minutes} phút`
                          : item.lesson_type
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default LessonViewPage;
