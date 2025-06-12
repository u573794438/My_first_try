import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Button, Typography, Spin, message } from 'antd';
import { TeamOutlined, FileTextOutlined, DashboardOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate, Outlet } from 'react-router-dom';
import axios from '../../utils/axios';

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingReviews: 0,
    submittedReviews: 0,
  });
  const navigate = useNavigate();

  // 获取系统统计数据
  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      // 获取用户统计
      const userResponse = await axios.get('/api/users');
      // 获取评分统计
      const reviewResponse = await axios.get('/api/admin/reviews');

      if (userResponse.data.success && reviewResponse.data.success) {
        const totalUsers = userResponse.data.count;
        const activeUsers = userResponse.data.data.filter(u => u.isActive).length;
        const totalReviews = reviewResponse.data.count;
        const submittedReviews = reviewResponse.data.data.filter(r => r.status === 'submitted').length;
        const pendingReviews = totalReviews - submittedReviews;

        setStats({
          totalUsers,
          activeUsers,
          pendingReviews,
          submittedReviews
        });
      }
    } catch (error) {
      console.error('获取系统统计失败:', error);
      message.error('获取系统统计失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStats();
  }, []);

  return (
    <div>
      <Title level={2}>管理员后台</Title>
      <Text type="secondary">绩效互评系统管理功能</Text>

      <Row gutter={[16, 16]} style={{ margin: '24px 0' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            title="总用户数"
            bordered={true}
            onClick={() => navigate('/admin/users')}
            style={{ cursor: 'pointer', transition: 'all 0.3s', hover: { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' } }}
          >
            <Statistic
              value={stats.totalUsers}
// 获取系统统计数据
const fetchSystemStats = async () => {
  try {
    setLoading(true);
    // 获取用户统计
    const userResponse = await axios.get('/api/users');
    // 获取评分统计
    const reviewResponse = await axios.get('/api/admin/reviews');

    if (userResponse.data.success && reviewResponse.data.success) {
      const totalUsers = userResponse.data.count;
      const activeUsers = userResponse.data.data.filter(u => u.isActive).length;
      const totalReviews = reviewResponse.data.count;
      const submittedReviews = reviewResponse.data.data.filter(r => r.status === 'submitted').length;
      const pendingReviews = totalReviews - submittedReviews;

      setStats({
        totalUsers,
        activeUsers,
        pendingReviews,
        submittedReviews
      });
    } else {
      message.error('获取系统统计失败');
    }
  } catch (error) {
    console.error('获取系统统计失败:', error);
    message.error('获取系统统计失败');
  } finally {
    setLoading(false);
  }
};
              precision={0}
              icon={<TeamOutlined style={{ color: '#1890ff' }} />}
            }
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            title="活跃用户"
            bordered={true}
            onClick={() => navigate('/admin/users')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              value={stats.activeUsers}
              precision={0}
              icon={<TeamOutlined style={{ color: '#52c41a' }} />
            }
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            title="已提交评分"
            bordered={true}
            onClick={() => navigate('/admin/reviews')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              value={stats.submittedReviews}
              precision={0}
              icon={<FileTextOutlined style={{ color: '#fa8c16' }} />
            }
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            title="待提交评分"
            bordered={true}
            onClick={() => navigate('/admin/reviews')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              value={stats.pendingReviews}
              precision={0}
              icon={<FileTextOutlined style={{ color: '#f5222d' }} />
            }
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            title="人员管理"
            bordered={true}
            actions={[
              <Button type="primary" icon={<TeamOutlined />} onClick={() => navigate('/admin/users')}>
                管理人员
              </Button>
            ]}
          >
            <p>维护参与互评人员名单，管理用户权限和状态</p>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="互评查询"
            bordered={true}
            actions={[
              <Button type="primary" icon={<FileTextOutlined />} onClick={() => navigate('/admin/reviews')}>
                查询表单
              </Button>
            ]}
          >
            <p>查询和查看员工提交的绩效互评表单内容</p>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="汇总统计"
            bordered={true}
            actions={[
              <Button type="primary" icon={<DownloadOutlined />} onClick={() => navigate('/admin/summary')}>
                统计导出
              </Button>
            ]}
          >
            <p>生成汇总统计表，计算平均值并导出Excel文件</p>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;