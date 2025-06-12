const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { WechatEnterprise } = require('wechat-enterprise-api');
const User = require('../models/user.model');
require('dotenv').config();

// 企业微信配置
const wechatConfig = {
  corpId: process.env.WECHAT_CORP_ID,
  agentId: process.env.WECHAT_AGENT_ID,
  secret: process.env.WECHAT_SECRET
};

// 初始化企业微信API
const wechatApi = new WechatEnterprise(wechatConfig.corpId, wechatConfig.secret, wechatConfig.agentId);

/**
 * @route   GET /api/auth/wechat
 * @desc    企业微信登录入口
 * @access  Public
 */
router.get('/wechat', (req, res) => {
  const redirectUri = encodeURIComponent(`${process.env.API_BASE_URL}/api/auth/wechat/callback`);
  const authUrl = wechatApi.getAuthorizeUrl(redirectUri, 'state', 'snsapi_base');
  res.redirect(authUrl);
});

/**
 * @route   GET /api/auth/wechat/callback
 * @desc    企业微信登录回调
 * @access  Public
 */
router.get('/wechat/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ success: false, message: '缺少授权码' });
    }

    // 获取用户信息
    const userInfo = await wechatApi.getUserInfoByCode(code);
    if (!userInfo || !userInfo.UserId) {
      return res.status(401).json({ success: false, message: '获取用户信息失败' });
    }

    // 查找或创建用户
    let user = await User.findOne({ wechatId: userInfo.UserId });
    if (!user) {
      // 新用户，需要管理员预先添加
      return res.status(403).json({
        success: false,
        message: '用户未授权，请联系管理员添加'
      });
    }

    // 更新最后登录时间
    user.lastLogin = Date.now();
    await user.save();

    // 生成JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 重定向到前端并携带token
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user._id,
      name: user.name,
      employeeId: user.employeeId,
      department: user.department,
      role: user.role
    }))}`);

  } catch (error) {
    console.error('微信登录错误:', error);
    res.status(500).json({ success: false, message: '登录失败，请重试' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    获取当前登录用户信息
 * @access  Private
 */
router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
  User.findById(req.user.id)
    .select('-__v')
    .then(user => res.json({ success: true, data: user }))
    .catch(err => res.status(500).json({ success: false, message: '获取用户信息失败' }));
});

module.exports = router;