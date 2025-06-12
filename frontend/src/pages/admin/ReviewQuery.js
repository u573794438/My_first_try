import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, Form, Select, DatePicker, Space, Card, Spin, message, Tag, Divider, Collapse } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import axios from '../../utils/axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

// 评分维度配置
const scoreDimensions = [
  { key: 'jobPerformance', name: '本职工作', weight: 50 },
  { key: 'additionalAchievements', name: '附加业绩', weight: 20 },
  { key: 'compliance', name: '合规守纪', weight: 15 },
  { key: 'teamwork', name: '互助', weight: 10 },
  { key: 'diligence', name: '勤勉', weight: 5 },
];

const ReviewQuery = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  // 获取部门列表
  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/users');
      if (response.data.success) {
        const depts = Array.from(new Set(response.data.data.map(user => user.department)));
        setDepartments(depts);
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('获取部门列表失败:', error);
    }
  };

  useEffect(() => {
    fetchDepartments();
    // 默认查询当前季度
    const now = new Date();
    const year = now.getFullYear();
    let quarter = Math.floor(now.getMonth() / 3) + 1;
    form.setFieldsValue({ quarter, year, status: 'submitted' });
    // 自动查询当前季度数据
    handleSearch({ quarter, year, status: 'submitted' });
  }, []);

  // 查询互评表单
  const handleSearch = async (values) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (values.quarter) params.append('quarter', values.quarter);
      if (values.year) params.append('year', values.year);
      if (values.status) params.append('status', values.status);
      if (values.department) params.append('department', values.department);

      const response = await axios.get(`/api/admin/reviews?${params.toString()}`);
      if (response.data.success) {
        setReviews(response.data.data);
      }
    } catch (error) {
      console.error('查询互评表单失败:', error);
      message.error('查询互评表单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 重置查询条件
  const handleReset = () => {
    form.resetFields();
  };

  // 获取用户姓名
  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user.name : '未知用户';
  };

  // 表格列定义
  const columns = [
    {
      title: '评分周期',
      key: 'period',
      render: (_, record) => `${record.year}年 Q${record.quarter}`,
      filters: [
        { text: 'Q1', value: 1 },
        { text: 'Q2', value: 2 },
        { text: 'Q3', value: 3 },
        { text: 'Q4', value: 4 },
      ],
      onFilter: (value, record) => record.quarter === value,
    },
    {
      title: '评分人',
      key: 'reviewer',
      render: (_, record) => (
        <div>
          <div>{getUserName(record.reviewer._id)}</div>
          <div><Text type="secondary">{record.reviewer.employeeId}</Text></div>
          <div><Text type="secondary">{record.reviewer.department}</Text></div>
        </div>
      ),
    },
    {
      title: '被评人',
      key: 'reviewee',
      render: (_, record) => (
        <div>
          <div>{getUserName(record.reviewee._id)}</div>
          <div><Text type="secondary">{record.reviewee.employeeId}</Text></div>
          <div><Text type="secondary">{record.reviewee.department}</Text></div>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: status => (
        status === 'submitted' ? (
          <Tag color="green">已提交</Tag>
        ) : (
          <Tag color="orange">草稿</Tag>
        )
      ),
      filters: [
        { text: '已提交', value: 'submitted' },
        { text: '草稿', value: 'draft' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '最终绩点',
      key: 'finalScore',
      render: (_, record) => record.calculatedFinalScore ? `${record.calculatedFinalScore} 分` : '-',
      sorter: (a, b) => a.calculatedFinalScore - b.calculatedFinalScore,
    },
    {
      title: '提交时间',
      key: 'submittedAt',
      render: (_, record) => record.submittedAt ? moment(record.submittedAt).format('YYYY-MM-DD HH:mm') : '-',
      sorter: (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt),
    },
    {
      title: '评分详情',
      key: 'details',
      render: (_, record) => (
        <Collapse>
          <Panel header="查看评分详情">
            <div style={{ marginBottom: 16 }}>
              <Text strong>各维度评分:</Text>
            </div>
            {scoreDimensions.map(dimension => (
              <div key={dimension.key} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>{dimension.name} ({dimension.weight}%):</Text>
                  <Text strong>{record.scores[dimension.key]} 分</Text>
                </div>
              </div>
            ))}
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong>加权总分:</Text>
              <Text strong style={{ fontSize: 16 }}>{record.calculatedFinalScore} 分</Text>
            </div>
          </Panel>
        </Collapse>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>互评查询</Title>
      <Text type="secondary">查询和查看员工提交的绩效互评表单</Text>

      <Card style={{ margin: '16px 0' }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          initialValues={{ status: 'submitted' }}
        >
          <Form.Item name="year" label="年份" rules={[{ required: true }]}>
            <Select placeholder="选择年份" style={{ width: 120 }}>
              {[...Array(5).keys()].map(i => (
                <Option key={new Date().getFullYear() - i} value={new Date().getFullYear() - i}>
                  {new Date().getFullYear() - i}年
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="quarter" label="季度" rules={[{ required: true }]}>
            <Select placeholder="选择季度" style={{ width: 100 }}>
              <Option value={1}>Q1</Option>
              <Option value={2}>Q2</Option>
              <Option value={3}>Q3</Option>
              <Option value={4}>Q4</Option>
            </Select>
          </Form.Item>

          <Form.Item name="department" label="部门">
            <Select placeholder="选择部门" style={{ width: 150 }} allowClear>
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select placeholder="选择状态" style={{ width: 120 }}>
              <Option value="submitted">已提交</Option>
              <Option value="draft">草稿</Option>
              <Option value="all">全部</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit" loading={loading}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={reviews.map(review => ({ ...review, key: review._id }))}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          expandedRowRender={record => (
            <div style={{ margin: 0 }}>
              <Collapse defaultActiveKey={['1']}>
                <Panel header="评分详情" key="1">
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>各维度评分:</Text>
                  </div>
                  {scoreDimensions.map(dimension => (
                    <div key={dimension.key} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text>{dimension.name} ({dimension.weight}%):</Text>
                        <Text strong>{record.scores[dimension.key]} 分</Text>
                      </div>
                    </div>
                  ))}
                  <Divider />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>加权总分:</Text>
                    <Text strong style={{ fontSize: 16 }}>{record.calculatedFinalScore} 分</Text>
                  </div>
                </Panel>
              </Collapse>
            </div>
          )}
        />
      )}
    </div>
  );
};

export default ReviewQuery;