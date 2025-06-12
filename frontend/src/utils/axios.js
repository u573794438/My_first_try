import axios from 'axios';
import { message } from 'antd';
import { useAuth } from '../contexts/AuthContext';

// 创建axios实例
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 请求错误处理
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 只返回data部分
    return response.data;
  },
  (error) => {
    // 响应错误处理
    const { response } = error;

    // 未认证，token过期或无效
    if (response && response.status === 401) {
      // 清除本地存储并重定向到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      message.error('登录已过期，请重新登录');
    } else if (response && response.status === 403) {
      message.error('没有权限执行此操作');
    } else if (response && response.status === 404) {
      message.error('请求的资源不存在');
    } else if (response && response.data && response.data.message) {
      message.error(response.data.message);
    } else {
      message.error('服务器错误，请稍后重试');
    }

    console.error('Response error:', error);
    return Promise.reject(error);
  }
);

export default instance;