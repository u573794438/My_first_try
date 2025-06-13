import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

const { Title } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/users/login', values);
      if (response.success) {
        // 存储token和用户信息到localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        message.success('登录成功');
        // 重定向到管理后台
        navigate('/admin/users');
        window.location.reload(); // 刷新页面以应用认证状态
      }
    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败，请检查工号和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 350 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>绩效互评系统</Title>
          <Title level={4}>管理员登录</Title>
        </div>
        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="employeeId"
            rules={[{ required: true, message: '请输入工号' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="工号" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;