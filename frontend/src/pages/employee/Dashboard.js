import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Typography, Spin, message, Empty } from 'antd';
import { EditOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';

const { Title, Text } = Typography;

const EmployeeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState([]);
  const [period, setPeriod] = useState({ quarter: 0, year: 0 });
  const navigate = useNavigate();

  // 获取待评人员列表
  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/reviews/pending');
      if (response.data.success) {
        setReviewData(response.data.data);
        setPeriod(response.data.period);
      }
    } catch (error) {
      console.error('获取待评人员失败:', error);
      message.error('获取待评人员失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  // 开始/继续评分
  const handleReview = (revieweeId, reviewId) => {
    navigate(`/review/${revieweeId}${reviewId ? `?reviewId=${reviewId}` : ''}`);
  };

  // 表格列定义
  const columns = [
    {
      title: '员工姓名',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '工号',
      dataIndex: 'employeeId',
      key: 'employeeId',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      filters: Array.from(new Set(reviewData.map(item => item.department))).map(dept => ({
        text: dept,
        value: dept,
      })),
      onFilter: (value, record) => record.department === value,
    },
    {
      title: '状态',
      dataIndex: 'reviewStatus',
      key: 'status',
      render: status => {
        if (!status) {
          return <Tag color="default">未开始</Tag>;
        } else if (status === 'draft') {
          return <Tag color="orange"><ClockCircleOutlined /> 草稿</Tag>;
        } else if (status === 'submitted') {
          return <Tag color="green"><CheckCircleOutlined /> 已提交</Tag>;
        }
        return <Tag color="default">未知</Tag>;
      },
      filters: [
        { text: '未开始', value: null },
        { text: '草稿', value: 'draft' },
        { text: '已提交', value: 'submitted' },
      ],
      onFilter: (value, record) => record.reviewStatus === value,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type={record.reviewStatus === 'submitted' ? 'default' : 'primary'}
          icon={<EditOutlined />}
          onClick={() => handleReview(record._id, record.reviewId)}
          disabled={record.reviewStatus === 'submitted'}
        >
          {record.reviewStatus === 'submitted' ? '已提交' : record.reviewStatus === 'draft' ? '继续填写' : '开始评分'}
        </Button>
      ),
    },
  ];

  // 计算统计数据
  const stats = {
    total: reviewData.length,
    completed: reviewData.filter(item => item.reviewStatus === 'submitted').length,
    draft: reviewData.filter(item => item.reviewStatus === 'draft').length,
    pending: reviewData.filter(item => !item.reviewStatus).length,
  };

  return (
    <div>
      <Title level={2}>绩效互评仪表盘</Title>
      <Text type="secondary">当前评分周期: {period.year}年 Q{period.quarter}</Text>

      <div style={{ display: 'flex', gap: 16, margin: '24px 0' }}>
        <Card title="待评人数" valueStyle={{ fontSize: 24 }}>
          <Text strong style={{ fontSize: 24 }}>{stats.total}</Text>
        </Card>
        <Card title="已完成" valueStyle={{ fontSize: 24 }}>
          <Text strong style={{ fontSize: 24, color: 'green' }}>{stats.completed}</Text>
        </Card>
        <Card title="草稿" valueStyle={{ fontSize: 24 }}>
          <Text strong style={{ fontSize: 24, color: 'orange' }}>{stats.draft}</Text>
        </Card>
        <Card title="未开始" valueStyle={{ fontSize: 24 }}>
          <Text strong style={{ fontSize: 24, color: 'red' }}>{stats.pending}</Text>
        </Card>
      </div>

      <Card title="待评人员列表">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
          </div>
        ) : reviewData.length === 0 ? (
          <Empty description="暂无待评人员" />
        ) : (
          <Table
            columns={columns}
            dataSource={reviewData.map(item => ({ ...item, key: item._id }))}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
    </div>
  );
};

export default EmployeeDashboard;