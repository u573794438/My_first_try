import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import jwtDecode from 'jwt-decode';
import 'antd/dist/reset.css';
import App from './App';
import Login from './pages/Login';
import EmployeeDashboard from './pages/employee/Dashboard';
import ReviewForm from './pages/employee/ReviewForm';
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import ReviewQuery from './pages/admin/ReviewQuery';
import SummaryStatistics from './pages/admin/SummaryStatistics';
import NotFound from './pages/NotFound';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// 保护路由组件 - 需要登录
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div>加载中...</div>;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// 管理员路由组件 - 需要管理员权限
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>加载中...</div>;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

const RootApp = () => (
  <AuthProvider>
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <App />
            </PrivateRoute>
          }>
            {/* 员工路由 */}
            <Route index element={<EmployeeDashboard />} />
            <Route path="review/:revieweeId?" element={<ReviewForm />} />

            {/* 管理员路由 */}
            <Route path="admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }>
              <Route index element={<Navigate to="summary" replace />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="reviews" element={<ReviewQuery />} />
              <Route path="summary" element={<SummaryStatistics />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ConfigProvider>
  </AuthProvider>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);