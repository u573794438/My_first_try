import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, message, Spin } from 'antd';
import {
  HomeOutlined,
  TeamOutlined,
  FileTextOutlined,
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

import axios from './utils/axios';

const { Header, Sider, Content } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 检查localStorage中的token和用户信息
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    } else {
      setCurrentUser(null);
      setIsAuthenticated(false);
      // 如果当前路径是管理页面且未认证，则重定向到登录页
      if (location.pathname.startsWith('/admin')) {
        navigate('/login');
      }
    }
  }, []);

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },

  ];

  // 导航菜单 - 根据用户角色显示不同菜单
  const getNavMenuItems = () => {
    const baseMenu = [
      {
        key: '/',
        icon: <HomeOutlined />,
        label: '首页',
      },
      {
        key: '/review',
        icon: <FileTextOutlined />,
        label: '绩效互评',
      },
    ];

    // 如果是管理员，添加管理员菜单
    if (currentUser && currentUser.role === 'admin') {
      return [
        ...baseMenu,
        {
          key: '/admin',
          icon: <DashboardOutlined />,
          label: '管理后台',
          children: [
            {
              key: '/admin/users',
              icon: <TeamOutlined />,
              label: '人员管理',
            },
            {
              key: '/admin/reviews',
              icon: <FileTextOutlined />,
              label: '互评查询',
            },
            {
              key: '/admin/summary',
              icon: <DashboardOutlined />,
              label: '汇总统计',
            },
          ],
        },
      ];
    }

    return baseMenu;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64px', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
          绩效互评系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getNavMenuItems()}
          onClick={({ key }) => {
            navigate(key);
          }}
        />
      </Sider>
      <Layout className="site-layout">
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {currentUser?.name} ({currentUser?.role === 'admin' ? '管理员' : '员工'})
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button type="text" icon={<LogoutOutlined />} onClick={logout} style={{ marginRight: 16 }}>
              退出登录
            </Button>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" size="large" icon={<Avatar icon={<UserOutlined />} />} />
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;