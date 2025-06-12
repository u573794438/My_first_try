import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Space, Typography, message, Spin } from 'antd';
import {
  WechatOutlined,
  LoginOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import axios from '../utils/axios';

const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAuth();

  // 处理URL中的token和用户信息
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    const userStr = queryParams.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        // 保存token到本地存储
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        // 更新认证状态
        login(user, token);
        // 跳转到首页
        navigate('/');
        message.success('登录成功');
      } catch (error) {
        console.error('解析用户信息失败:', error);
        message.error('登录信息解析失败，请重试');
      }
    }
  }, [location, login, navigate]);

  // 如果已登录，跳转到首页
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);

  // 企业微信登录
  const handleWechatLogin = () => {
    // 后端企业微信登录接口
    window.location.href = `${process.env.REACT_APP_API_BASE_URL || ''}/api/auth/wechat`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card title={<Title level={3}>绩效互评系统</Title>} style={{ width: 400 }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <WechatOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 24 }} />
          <Title level={4}>企业微信登录</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            请使用企业微信账号登录系统
          </Text>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              onClick={handleWechatLogin}
              style={{ width: '100%' }}
            >
              企业微信快捷登录
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Login;