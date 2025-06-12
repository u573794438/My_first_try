const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user.model');

// 权限检查中间件
const isAdmin = (req, res, next) => {
  if (req.user.role !== User.UserRole.ADMIN) {
    return res.status(403).json({ success: false, message: '没有管理员权限' });
  }
  next();
};

/**
 * @route   GET /api/users
 * @desc    获取所有用户列表
 * @access  Private (Admin only)
 */
router.get('/', async (req, res) => {
    try {
      const users = await User.find().select('-__v');
      res.json({ success: true, count: users.length, data: users });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

/**
 * @route   POST /api/users
 * @desc    创建新用户
 * @access  Private (Admin only)
 */
router.post('/', async (req, res) => {
    try {
      const { name, employeeId, department, role, wechatId } = req.body;

      // 验证必填字段
      if (!name || !employeeId || !department) {
        return res.status(400).json({ success: false, message: '请提供所有必填字段' });
      }

      // 检查工号是否已存在
      const existingUser = await User.findOne({ employeeId });
      if (existingUser) {
        return res.status(400).json({ success: false, message: '该工号已存在' });
      }

      // 创建新用户
      const user = new User({
        name,
        employeeId,
        department,
        role: role || User.UserRole.EMPLOYEE,
        wechatId
      });

      await user.save();
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

/**
 * @route   PUT /api/users/:id
 * @desc    更新用户信息
 * @access  Private (Admin only)
 */
router.put('/:id', async (req, res) => {
    try {
      const { name, department, role, wechatId, isActive } = req.body;

      // 查找用户
      let user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      // 更新用户信息
      if (name) user.name = name;
      if (department) user.department = department;
      if (role) user.role = role;
      if (wechatId !== undefined) user.wechatId = wechatId;
      if (isActive !== undefined) user.isActive = isActive;
      user.updatedAt = Date.now();

      await user.save();
      res.json({ success: true, data: user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

/**
 * @route   GET /api/users/active
 * @desc    获取所有活跃员工（用于互评列表）
 * @access  Private
 */
router.get('/active', async (req, res) => {
    try {
      const users = await User.find({
        isActive: true,
        _id: { $ne: req.user.id } // 排除当前用户
      }).select('name employeeId department _id');
      res.json({ success: true, count: users.length, data: users });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

module.exports = router;