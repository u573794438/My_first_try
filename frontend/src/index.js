import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import 'antd/dist/reset.css';
import App from './App';

import EmployeeDashboard from './pages/employee/Dashboard';
import ReviewForm from './pages/employee/ReviewForm';
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import ReviewQuery from './pages/admin/ReviewQuery';
import SummaryStatistics from './pages/admin/SummaryStatistics';
import NotFound from './pages/NotFound';


const RootApp = () => (
  <ConfigProvider locale={zhCN}>
    <Router>
      <Routes>
        <Route path="/" element={<App />}>
            {/* 员工路由 */}
            <Route index element={<EmployeeDashboard />} />
            <Route path="review/:revieweeId?" element={<ReviewForm />} />

            {/* 管理员路由 */}
            <Route path="admin" element={<AdminDashboard />}>
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

);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);