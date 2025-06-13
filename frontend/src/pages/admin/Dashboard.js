import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Button, Typography, Spin, message } from 'antd';
import { TeamOutlined, FileTextOutlined, DashboardOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate, Outlet } from 'react-router-dom';
import axios from '../../utils/axios';

const { Title, Text } = Typography;

import { useState } from 'react';

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
        const userResponse = await axios.get('/api/users');
        if (userResponse.data.success) {
          setStats({
            totalUsers: userResponse.data.count,
            activeUsers: userResponse.data.data.filter(u => u.isActive).length
          });
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
        message.error('获取统计数据失败');
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
        </Row>
        {/* 其他仪表盘内容 */}
      </Spin>
    </div>
  );
};

export default AdminDashboard;