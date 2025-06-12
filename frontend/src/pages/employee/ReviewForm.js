// 获取被评人信息
const fetchRevieweeInfo = async () => {
  try {
    setLoading(true);
    const response = await axios.get(`/api/users/${revieweeId}`);
    if (response.data.success) {
      setReviewee(response.data.data);
    }
  } catch (error) {
    console.error('获取被评人信息失败:', error);
    message.error('获取被评人信息失败');
    navigate('/');
  }
};

// 获取已保存的评分
const fetchReviewData = async () => {
  if (!reviewId) return;
  try {
    setLoading(true);
    const response = await axios.get(`/api/reviews/${reviewId}`);
    if (response.data.success) {
      const review = response.data.data;
      form.setFieldsValue({
        jobPerformance: review.scores.jobPerformance,
        additionalAchievements: review.scores.additionalAchievements,
        compliance: review.scores.compliance,
        teamwork: review.scores.teamwork,
        diligence: review.scores.diligence,
      });
    }
  } catch (error) {
    console.error('获取评分数据失败:', error);
    message.error('获取评分数据失败');
  }
};

// 保存草稿
const handleSaveDraft = async () => {
  try {
    const values = await form.validateFields();
    setLoading(true);

    const response = await axios.post('/api/reviews', {
      reviewee: revieweeId,
      quarter: period.quarter,
      year: period.year,
      scores: values,
      status: 'draft'
    });

    if (response.data.success) {
      message.success('草稿保存成功');
    }
  } catch (error) {
    console.error('保存草稿失败:', error);
    message.error(error.message || '保存草稿失败，请重试');
  } finally {
    setLoading(false);
  }
};

// 提交评分
const handleSubmit = async () => {
  if (!isSubmissionPeriod) {
    message.warning('不在提交时间段内，只能在每季度最后一周至下季度第二周之间提交');
    return;
  }

  try {
    const values = await form.validateFields();
    setLoading(true);

    const response = await axios.post('/api/reviews', {
      reviewee: revieweeId,
      quarter: period.quarter,
      year: period.year,
      scores: values,
      status: 'submitted'
    });

    if (response.data.success) {
      message.success('评分提交成功');
      navigate('/');
    }
  } catch (error) {
    console.error('提交评分失败:', error);
    message.error(error.message || '提交评分失败，请重试');
  } finally {
    setLoading(false);
  }
};
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Form, InputNumber, Button, Card, Typography, message, Spin, Divider, Space, Alert } from 'antd';
import { SaveOutlined, CheckOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from '../../utils/axios';


const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// 评分维度配置
const scoreDimensions = [
  {
    key: 'jobPerformance',
    name: '本职工作',
    description: '岗位职责内的工作完成质量和效率',
    weight: 50,
  },
  {
    key: 'additionalAchievements',
    name: '附加业绩',
    description: '专项工作、额外工作或创新工作等',
    weight: 20,
  },
  {
    key: 'compliance',
    name: '合规守纪',
    description: '遵守公司规章制度和工作流程',
    weight: 15,
  },
  {
    key: 'teamwork',
    name: '互助',
    description: '团队协作和知识共享',
    weight: 10,
  },
  {
    key: 'diligence',
    name: '勤勉',
    description: '工作态度和投入程度',
    weight: 5,
  },
];

const ReviewForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [reviewee, setReviewee] = useState(null);
  const [period, setPeriod] = useState({ quarter: 0, year: 0 });
  const [isSubmissionPeriod, setIsSubmissionPeriod] = useState(true);
  const [searchParams] = useSearchParams();
  const { revieweeId } = useParams();
  const navigate = useNavigate();
  const reviewId = searchParams.get('reviewId');

  // 获取当前评分周期
  const getCurrentPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    let quarter = Math.floor(now.getMonth() / 3) + 1;
    const month = now.getMonth() + 1;
    // 如果当前时间在下季度的前两周，仍属于上一季度的提交期
    if (month % 3 === 1 && now.getDate() <= 14) {
      quarter = quarter === 1 ? 4 : quarter - 1;
    }
    return { quarter, year };
  };

  // 检查是否在提交时间段内
  const checkSubmissionPeriod = (quarter, year) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year !== currentYear) return false;

    let submissionStart, submissionEnd;
    switch(quarter) {
      case 1:
        submissionStart = new Date(year, 2, 25);
        submissionEnd = new Date(year, 3, 14);
        break;
      case 2:
        submissionStart = new Date(year, 5, 25);
        submissionEnd = new Date(year, 6, 14);
        break;
      case 3:
        submissionStart = new Date(year, 8, 25);
        submissionEnd = new Date(year, 9, 14);
        break;
      case 4:
        submissionStart = new Date(year, 11, 25);
        submissionEnd = new Date(year + 1, 0, 14);
        break;
      default:
        return false;
    }
    return now >= submissionStart && now <= submissionEnd;
  };

  // 获取被评人信息
  const fetchRevieweeInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/users/${revieweeId}`);
      if (response.data.success) {
        setReviewee(response.data.data);
      }
    } catch (error) {
      console.error('获取被评人信息失败:', error);
      message.error('获取被评人信息失败');
      navigate('/');
    }
  };

  // 获取已保存的评分
  const fetchReviewData = async () => {
    if (!reviewId) return;
    try {
      setLoading(true);
      const response = await axios.get(`/api/reviews/${reviewId}`);
      if (response.data.success) {
        const review = response.data.data;
        form.setFieldsValue({
          jobPerformance: review.scores.jobPerformance,
          additionalAchievements: review.scores.additionalAchievements,
          compliance: review.scores.compliance,
          teamwork: review.scores.teamwork,
          diligence: review.scores.diligence,
        });
      }
    } catch (error) {
      console.error('获取评分数据失败:', error);
      message.error('获取评分数据失败');
    }
  };

  useEffect(() => {
    if (!revieweeId) {
      navigate('/');
      return;
    }

    const currentPeriod = getCurrentPeriod();
    setPeriod(currentPeriod);
    setIsSubmissionPeriod(checkSubmissionPeriod(currentPeriod.quarter, currentPeriod.year));
    fetchRevieweeInfo();
    fetchReviewData();
  }, [revieweeId, reviewId, navigate]);

  // 保存草稿
  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await axios.post('/api/reviews', {
        reviewee: revieweeId,
        quarter: period.quarter,
        year: period.year,
        scores: values,
        status: 'draft'
      });

      if (response.data.success) {
        message.success('草稿保存成功');
      }
    } catch (error) {
      console.error('保存草稿失败:', error);
      message.error(error.message || '保存草稿失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 提交评分
  const handleSubmit = async () => {
    if (!isSubmissionPeriod) {
      message.warning('不在提交时间段内，只能在每季度最后一周至下季度第二周之间提交');
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await axios.post('/api/reviews', {
        reviewee: revieweeId,
        quarter: period.quarter,
        year: period.year,
        scores: values,
        status: 'submitted'
      });

      if (response.data.success) {
        message.success('评分提交成功');
        navigate('/');
      }
    } catch (error) {
      console.error('提交评分失败:', error);
      message.error(error.message || '提交评分失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !reviewee) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/')}
        style={{ marginBottom: 16 }}
      >
        返回仪表盘
      </Button>

      <Title level={2}>绩效互评表单</Title>
      <Paragraph>评分周期: {period.year}年 Q{period.quarter}</Paragraph>

      {!isSubmissionPeriod && (
        <Alert
          message="提示"
          description="当前不在提交时间段内，您可以保存草稿，但无法提交。提交时间段为每季度最后一周至下季度第二周。"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {reviewee && (
        <Card title="被评人信息" style={{ marginBottom: 24 }}>
          <p><strong>姓名:</strong> {reviewee.name}</p>
          <p><strong>工号:</strong> {reviewee.employeeId}</p>
          <p><strong>部门:</strong> {reviewee.department}</p>
        </Card>
      )}

      <Card title="评分项">
        <Form
          form={form}
          layout="vertical"
          initialValues={{}
          }
        >
          {scoreDimensions.map(dimension => (
            <Form.Item
              key={dimension.key}
              name={dimension.key}
              label={`${dimension.name} (权重${dimension.weight}%)`}
              rules={[
                { required: true, message: `请为${dimension.name}评分` },
                { type: 'number', min: 1, max: 5, message: '评分必须在1-5之间' }
              ]}
              help={dimension.description}
            >
              <InputNumber
                min={1}
                max={5}
                step={0.5}
                formatter={value => `${value} 分`}
                parser={value => value.replace(' 分', '')}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <div>
                  <Text type="secondary">1分: 不满意</Text>
                </div>
                <div>
                  <Text type="secondary">5分: 非常满意</Text>
                </div>
              </div>
            </Form.Item>
          ))}

          <Divider />

          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              icon={<SaveOutlined />}
              onClick={handleSaveDraft}
              loading={loading}
            >
              保存草稿
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSubmit}
              loading={loading}
              disabled={!isSubmissionPeriod}
            >
              提交评分
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default ReviewForm;