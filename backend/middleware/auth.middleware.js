const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// 验证JWT令牌中间件
const auth = async (req, res, next) => {
  try {
    // 获取请求头中的token
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: '无效的令牌' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: '令牌已过期' });
    }
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

// 管理员权限检查中间件
const isAdmin = (req, res, next) => {
  if (req.user.role !== User.UserRole.ADMIN) {
    return res.status(403).json({ success: false, message: '没有管理员权限' });
  }
  next();
};

module.exports = { auth, isAdmin };