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
    activeUsers: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSystemStats = async () => {
      setLoading(true);
      try {
        // 获取当前季度和年份
        const now = new Date();
        const year = now.getFullYear();
        const quarter = Math.floor((now.getMonth() / 3)) + 1;

        const response = await axios.get('/api/admin/summary', {
          params: { year, quarter }
        });

        if (response.success) {
          setStats({ 
            totalUsers: response.count,
            activeUsers: response.data.length
          });
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
        message.error('获取统计数据失败: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStats();
  }, []);

  return (
    <div className="dashboard-container">
      <Spin spinning={loading} tip="加载中...">
        <Title level={2}>管理控制台</Title>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6} lg={6} xl={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={stats.totalUsers}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6} lg={6} xl={6}>
            <Card>
              <Statistic
                title="活跃用户"
                value={stats.activeUsers}
                prefix={<DashboardOutlined />}
              />
            </Card>
          </Col>
        </Row>
        {/* 其他仪表盘内容 */}
      </Spin>
    </div>
  );
};

export default AdminDashboard;