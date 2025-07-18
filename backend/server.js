const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/user.model');

// 加载环境变量
dotenv.config();

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库连接
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('MongoDB连接成功');

    // 创建默认管理员用户
    User.findOne({ employeeId: 'hradmin' })
      .then(existingUser => {
        if (!existingUser) {
          const adminUser = new User({
            name: 'HR Admin',
            employeeId: 'hradmin',
            password: '771117',
            department: 'HR',
            role: User.UserRole.ADMIN,
            isActive: true
          });
          return adminUser.save();
        }
        return null;
      })
      .then(newUser => {
        if (newUser) {
          console.log('默认管理员用户创建成功');
        } else {
          console.log('管理员用户已存在');
        }
      })
      .catch(err => {
        console.error('创建管理员用户错误:', err);
      });

    // 启动服务器
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`服务器运行在 ${process.env.API_BASE_URL || `http://localhost:${PORT}`}`);
    });

    // 处理未捕获的异常
    process.on('unhandledRejection', (err) => {
      console.log('未处理的拒绝:', err);
      server.close(() => process.exit(1));
    });
  })
  .catch((err) => {
    console.error('MongoDB连接失败:', err.message);
    process.exit(1);
  });

// 路由
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// 生产环境静态文件服务
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;