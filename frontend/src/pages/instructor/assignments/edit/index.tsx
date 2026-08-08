import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
} from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import {
  type Assignment,
  addQuestion,
  deleteQuestion,
  getAssignment,
  type QuizQuestion,
  updateAssignment,
  updateQuestion,
} from '@/services/ant-design-pro/assignments';

const { TextArea } = Input;

const EditAssignmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignmentType, setAssignmentType] = useState<string>('quiz');
  const [questions, setQuestions] = useState<any[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<QuizQuestion[]>(
    [],
  );

  const fetchAssignment = useCallback(async () => {
    try {
      const res = await getAssignment(id!);
      const data = res.data;
      form.setFieldsValue({
        title: data.title,
        description: data.description,
        assignment_type: data.assignment_type,
        total_points: data.total_points,
        passing_score: data.passing_score,
        attempts_allowed: data.attempts_allowed,
        time_limit_minutes: data.time_limit_minutes,
        due_date: data.due_date ? dayjs(data.due_date) : undefined,
        show_answer_after: data.show_answer_after,
      });
      setAssignmentType(data.assignment_type);
      if (data.questions) {
        setQuestions(data.questions);
        setOriginalQuestions(data.questions);
      }
    } catch (err: any) {
      message.error('Không thể tải thông tin bài tập');
    } finally {
      setLoading(false);
    }
  }, [id, form]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const handleFinish = async (values: any) => {
    setSaving(true);
    try {
      await updateAssignment(id!, {
        ...values,
        due_date: values.due_date?.toISOString(),
      });

      // Handle questions for quiz type
      if (assignmentType === 'quiz') {
        // Delete removed questions
        const currentIds = questions.filter((q) => q.id).map((q) => q.id);
        for (const orig of originalQuestions) {
          if (!currentIds.includes(orig.id)) {
            await deleteQuestion(orig.id);
          }
        }

        // Add/update questions
        for (const q of questions) {
          if (q.id) {
            await updateQuestion(q.id, q);
          } else {
            await addQuestion(id!, q);
          }
        }
      }

      message.success('Cập nhật bài tập thành công!');
      history.push('/instructor/assignments');
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể cập nhật bài tập');
    } finally {
      setSaving(false);
    }
  };

  const addNewQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'single',
        options: [
          { id: 'a', text: '', is_correct: false },
          { id: 'b', text: '', is_correct: false },
        ],
        points: 1,
        explanation: '',
      },
    ]);
  };

  const updateQuestionField = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    const optId = String.fromCharCode(97 + updated[qIndex].options.length);
    updated[qIndex].options.push({ id: optId, text: '', is_correct: false });
    setQuestions(updated);
  };

  const updateOption = (
    qIndex: number,
    oIndex: number,
    field: string,
    value: any,
  ) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = {
      ...updated[qIndex].options[oIndex],
      [field]: value,
    };
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.filter(
      (_: any, i: number) => i !== oIndex,
    );
    setQuestions(updated);
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    if (
      updated[qIndex].question_type === 'single' ||
      updated[qIndex].question_type === 'true_false'
    ) {
      updated[qIndex].options = updated[qIndex].options.map(
        (opt: any, i: number) => ({
          ...opt,
          is_correct: i === oIndex,
        }),
      );
    } else {
      updated[qIndex].options[oIndex].is_correct =
        !updated[qIndex].options[oIndex].is_correct;
    }
    setQuestions(updated);
  };

  if (loading) {
    return (
      <PageContainer title="Chỉnh sửa bài tập">
        <Card>
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Chỉnh sửa bài tập">
      <Card>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Nhập tiêu đề bài tập" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả bài tập (tùy chọn)" />
          </Form.Item>

          <Form.Item
            name="assignment_type"
            label="Loại bài tập"
            rules={[{ required: true }]}
          >
            <Radio.Group onChange={(e) => setAssignmentType(e.target.value)}>
              <Radio.Button value="quiz">Trắc nghiệm</Radio.Button>
              <Radio.Button value="essay">Tự luận</Radio.Button>
              <Radio.Button value="upload">Nộp file</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Space size="large">
            <Form.Item name="total_points" label="Tổng điểm">
              <InputNumber min={1} max={1000} />
            </Form.Item>
            <Form.Item name="passing_score" label="Điểm đạt">
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="attempts_allowed" label="Số lần nộp">
              <InputNumber min={1} max={100} />
            </Form.Item>
            <Form.Item name="time_limit_minutes" label="Thời gian (phút)">
              <InputNumber min={1} placeholder="Không giới hạn" />
            </Form.Item>
          </Space>

          <Space size="large">
            <Form.Item name="due_date" label="Hạn nộp">
              <DatePicker showTime />
            </Form.Item>
            <Form.Item
              name="show_answer_after"
              label="Hiện đáp án sau khi nộp"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Space>

          {assignmentType === 'quiz' && (
            <>
              <Divider>Câu hỏi</Divider>
              {questions.map((q, qIndex) => (
                <Card
                  key={q.id || qIndex}
                  size="small"
                  style={{ marginBottom: 16 }}
                  title={`Câu ${qIndex + 1}`}
                  extra={
                    <Button
                      danger
                      size="small"
                      icon={<MinusCircleOutlined />}
                      onClick={() => removeQuestion(qIndex)}
                    >
                      Xóa
                    </Button>
                  }
                >
                  <Form.Item label="Câu hỏi" required>
                    <TextArea
                      value={q.question_text}
                      onChange={(e) =>
                        updateQuestionField(
                          qIndex,
                          'question_text',
                          e.target.value,
                        )
                      }
                      rows={2}
                      placeholder="Nhập nội dung câu hỏi"
                    />
                  </Form.Item>

                  <Space>
                    <Form.Item label="Loại">
                      <Select
                        value={q.question_type}
                        onChange={(val) =>
                          updateQuestionField(qIndex, 'question_type', val)
                        }
                        options={[
                          { label: 'Chọn 1', value: 'single' },
                          { label: 'Chọn nhiều', value: 'multiple' },
                          { label: 'Đúng/Sai', value: 'true_false' },
                        ]}
                        style={{ width: 120 }}
                      />
                    </Form.Item>
                    <Form.Item label="Điểm">
                      <InputNumber
                        value={q.points}
                        onChange={(val) =>
                          updateQuestionField(qIndex, 'points', val)
                        }
                        min={1}
                      />
                    </Form.Item>
                  </Space>

                  <div style={{ marginBottom: 8 }}>Đáp án:</div>
                  {q.options.map((opt: any, oIndex: number) => (
                    <Space
                      key={oIndex}
                      style={{ display: 'flex', marginBottom: 8 }}
                    >
                      <Button
                        size="small"
                        type={opt.is_correct ? 'primary' : 'default'}
                        onClick={() => setCorrectOption(qIndex, oIndex)}
                      >
                        {opt.id.toUpperCase()}
                      </Button>
                      <Input
                        value={opt.text}
                        onChange={(e) =>
                          updateOption(qIndex, oIndex, 'text', e.target.value)
                        }
                        placeholder="Nhập đáp án"
                        disabled={q.question_type === 'true_false'}
                        style={{ width: 300 }}
                      />
                      {q.question_type !== 'true_false' && (
                        <Button
                          danger
                          size="small"
                          icon={<MinusCircleOutlined />}
                          onClick={() => removeOption(qIndex, oIndex)}
                        />
                      )}
                    </Space>
                  ))}
                  {q.question_type !== 'true_false' && (
                    <Button
                      type="dashed"
                      size="small"
                      onClick={() => addOption(qIndex)}
                      icon={<PlusOutlined />}
                    >
                      Thêm đáp án
                    </Button>
                  )}

                  <Form.Item label="Giải thích" style={{ marginTop: 8 }}>
                    <Input
                      value={q.explanation}
                      onChange={(e) =>
                        updateQuestionField(
                          qIndex,
                          'explanation',
                          e.target.value,
                        )
                      }
                      placeholder="Giải thích đáp án (tùy chọn)"
                    />
                  </Form.Item>
                </Card>
              ))}
              <Button
                type="dashed"
                onClick={addNewQuestion}
                icon={<PlusOutlined />}
                style={{ width: '100%' }}
              >
                Thêm câu hỏi
              </Button>
            </>
          )}

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                Lưu thay đổi
              </Button>
              <Button onClick={() => history.push('/instructor/assignments')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default EditAssignmentPage;
