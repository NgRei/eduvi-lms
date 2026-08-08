import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
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
  Switch,
} from 'antd';
import React, { useState } from 'react';
import {
  addQuestion,
  createAssignment,
} from '@/services/ant-design-pro/assignments';

const { TextArea } = Input;

const CreateAssignmentPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [assignmentType, setAssignmentType] = useState<string>('quiz');
  const [questions, setQuestions] = useState<any[]>([]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await createAssignment({
        ...values,
        due_date: values.due_date?.toISOString(),
      });

      // Add questions if quiz type
      if (assignmentType === 'quiz' && questions.length > 0) {
        for (const q of questions) {
          await addQuestion(res.data.id, q);
        }
      }

      message.success('Tạo bài tập thành công!');
      history.push('/instructor/assignments');
    } catch (err: any) {
      message.error(err?.data?.error || 'Không thể tạo bài tập');
    } finally {
      setLoading(false);
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

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    const optId = String.fromCharCode(97 + updated[qIndex].options.length); // a, b, c, d...
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

  return (
    <PageContainer title="Tạo bài tập mới">
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            assignment_type: 'quiz',
            total_points: 100,
            passing_score: 50,
            attempts_allowed: 1,
          }}
        >
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
                  key={qIndex}
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
                        updateQuestion(qIndex, 'question_text', e.target.value)
                      }
                      rows={2}
                      placeholder="Nhập nội dung câu hỏi"
                    />
                  </Form.Item>

                  <Space>
                    <Form.Item label="Loại">
                      <Select
                        value={q.question_type}
                        onChange={(val) => {
                          updateQuestion(qIndex, 'question_type', val);
                          if (val === 'true_false') {
                            updateQuestion(qIndex, 'options', [
                              { id: 'true', text: 'Đúng', is_correct: false },
                              { id: 'false', text: 'Sai', is_correct: false },
                            ]);
                          }
                        }}
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
                          updateQuestion(qIndex, 'points', val)
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
                        updateQuestion(qIndex, 'explanation', e.target.value)
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
              <Button type="primary" htmlType="submit" loading={loading}>
                Tạo bài tập
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

export default CreateAssignmentPage;
