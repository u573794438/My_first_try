import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, Form, Select, Card, Spin, message, Tag, Space, Divider } from 'antd';
import { DownloadOutlined, ReloadOutlined, BarChartOutlined } from '@ant-design/icons';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title as ChartTitle, Tooltip, Legend } from 'chart.js';
import axios from '../../utils/axios';

// 注册Chart.js组件
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend);

const { Title, Text } = Typography;
const { Option } = Select;

// 评分维度配置
const scoreDimensions = [
  { key: 'avgJobPerformance', name: '本职工作', weight: 50 },
  { key: 'avgAdditionalAchievements', name: '附加业绩', weight: 20 },
  { key: 'avgCompliance', name: '合规守纪', weight: 15 },
  { key: 'avgTeamwork', name: '互助', weight: 10 },
  { key: 'avgDiligence', name: '勤勉', weight: 5 },
];

const SummaryStatistics = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [period, setPeriod] = useState({ quarter: 0, year: 0 });
  const [department, setDepartment] = useState('');

  // 获取部门列表
  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/users');
      if (response.data.success) {
        const depts = ['全部', ...Array.from(new Set(response.data.data.map(user => user.department)))];
        setDepartments(depts);
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
    // 如果当前时间在下季度的前两周，显示上一季度数据
    const month = now.getMonth() + 1;
    if (month % 3 === 1 && now.getDate() <= 14) {
      quarter = quarter === 1 ? 4 : quarter - 1;
    }
    form.setFieldsValue({ quarter, year, department: '全部' });
    // 自动查询当前季度数据
    handleSearch({ quarter, year, department: '全部' });
  }, []);

  // 查询汇总统计数据
  const handleSearch = async (values) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('quarter', values.quarter);
      params.append('year', values.year);
      if (values.department && values.department !== '全部') {
        params.append('department', values.department);
      }

      const response = await axios.get(`/api/admin/summary?${params.toString()}`);
      if (response.data.success) {
        setSummaryData(response.data.data);
        setPeriod(response.data.period);
        setDepartment(response.data.department);
        // 更新图表数据
        updateChartData(response.data.data);
      }
    } catch (error) {
      console.error('查询汇总统计失败:', error);
      message.error('查询汇总统计失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 更新图表数据
  const updateChartData = (data) => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    // 按平均绩点排序，取前10名
    const sortedData = [...data].sort((a, b) => b.averageScore - a.averageScore).slice(0, 10);

    setChartData({
      labels: sortedData.map(item => item.employee.name),
      datasets: [
        {
          label: '最终平均绩点',
          data: sortedData.map(item => item.averageScore),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    });
  };

  // 导出Excel
  const handleExport = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const params = new URLSearchParams();
      params.append('quarter', values.quarter);
      params.append('year', values.year);
      if (values.department && values.department !== '全部') {
        params.append('department', values.department);
      }

      // 创建下载链接
      const url = `${process.env.REACT_APP_API_BASE_URL || ''}/api/admin/export?${params.toString()}`;
      window.open(url, '_blank');
      message.success('导出Excel文件成功');
    } catch (error) {
      console.error('导出Excel失败:', error);
      message.error('导出Excel失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '排名',
      key: 'rank',
      render: (_, record, index) => index + 1,
      width: 60,
    },
    {
      title: '员工姓名',
      dataIndex: ['employee', 'name'],
      key: 'name',
      sorter: (a, b) => a.employee.name.localeCompare(b.employee.name),
    },
    {
      title: '工号',
      dataIndex: ['employee', 'employeeId'],
      key: 'employeeId',
    },
    {
      title: '部门',
      dataIndex: ['employee', 'department'],
      key: 'department',
      filters: departments.map(dept => ({ text: dept, value: dept })),
      onFilter: (value, record) => record.employee.department === value,
    },
    {
      title: '评价人数',
      dataIndex: 'reviewCount',
      key: 'reviewCount',
      sorter: (a, b) => a.reviewCount - b.reviewCount,
    },
    ...scoreDimensions.map(dimension => ({
      title: `${dimension.name}`,
      dataIndex: dimension.key,
      key: dimension.key,
      render: value => `${value} 分`,
      sorter: (a, b) => a[dimension.key] - b[dimension.key],
    })),
    {
      title: '最终平均绩点',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: score => (
        <Text strong style={{ fontSize: 14 }}>
          {score} 分
          {score >= 90 ? <Tag color="red">优秀</Tag> : null}
          {score >= 80 && score < 90 ? <Tag color="orange">良好</Tag> : null}
          {score >= 70 && score < 80 ? <Tag color="blue">合格</Tag> : null}
          {score < 70 ? <Tag color="gray">待改进</Tag> : null}
        </Text>
      ),
      sorter: (a, b) => a.averageScore - b.averageScore,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3}>汇总统计</Title>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport} loading={loading}>
          导出Excel
        </Button>
      </div>

      <Text type="secondary">
        {period.year}年 Q{period.quarter} {department}绩效互评汇总统计 (按最终平均绩点排序)
      </Text>

      <Card style={{ margin: '16px 0' }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
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

          <Form.Item name="department" label="部门" rules={[{ required: true }]}>
            <Select placeholder="选择部门" style={{ width: 150 }}>
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" icon={<BarChartOutlined />} htmlType="submit" loading={loading}>查询统计</Button>
              <Button icon={<ReloadOutlined />} onClick={() => form.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 图表展示 */}
      {chartData && (
        <Card style={{ marginBottom: 16 }}>
          <Title level={4}>绩效排名前10名员工</Title>
          <div style={{ height: 400, padding: '20px 0' }}>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: '最终平均绩点'
                    }
                  }
                }
              }}
            />
          </div>
        </Card>
      )}

      {/* 表格数据 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : summaryData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Text type="secondary">暂无统计数据，请选择查询条件</Text>
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={summaryData}
          rowKey={record => record.employee._id}
          pagination={{ pageSize: 10 }}
        />
      )}
    </div>
  );
};

export default SummaryStatistics;