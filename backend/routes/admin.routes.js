const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const User = require('../models/user.model');
const Review = require('../models/review.model');

// 权限检查中间件
const isAdmin = (req, res, next) => {
  if (req.user.role !== User.UserRole.ADMIN) {
    return res.status(403).json({ success: false, message: '没有管理员权限' });
  }
  next();
};

/**
 * @route   GET /api/admin/reviews
 * @desc    查询所有提交的绩效互评表单
 * @access  Private (Admin only)
 */
router.get('/reviews', async (req, res) => {
    try {
      const { quarter, year, status, department } = req.query;
      const query = {};

      // 构建查询条件
      if (quarter) query.quarter = parseInt(quarter);
      if (year) query.year = parseInt(year);
      if (status) query.status = status;

      // 执行查询
      const reviews = await Review.find(query)
        .populate('reviewer', 'name employeeId department')
        .populate('reviewee', 'name employeeId department')
        .sort({ year: -1, quarter: -1, submittedAt: -1 });

      res.json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

/**
 * @route   GET /api/admin/summary
 * @desc    生成绩效互评汇总统计表
 * @access  Private (Admin only)
 */
router.get('/summary', async (req, res) => {
    try {
      const { quarter, year, department } = req.query;

      if (!quarter || !year) {
        return res.status(400).json({ success: false, message: '请提供季度和年份参数' });
      }

      // 构建查询条件
      const query = {
        quarter: parseInt(quarter),
        year: parseInt(year),
        status: Review.ReviewStatus.SUBMITTED
      };

      // 部门筛选
      let userFilter = {};
      if (department) {
        userFilter.department = department;
      }

      // 获取部门所有员工
      const employees = await User.find({ ...userFilter, isActive: true });
      const employeeIds = employees.map(emp => emp._id);

      // 聚合查询计算每个员工的平均得分
      const summary = await Review.aggregate([
        {
          $match: {
            ...query,
            reviewee: { $in: employeeIds }
          }
        },
        {
          $group: {
            _id: '$reviewee',
            averageScore: { $avg: '$calculatedFinalScore' },
            reviewCount: { $sum: 1 },
            scores: {
              $push: {
                jobPerformance: '$scores.jobPerformance',
                additionalAchievements: '$scores.additionalAchievements',
                compliance: '$scores.compliance',
                teamwork: '$scores.teamwork',
                diligence: '$scores.diligence'
              }
            }
          }
        },
        {
          $project: {
            reviewee: '$_id',
            averageScore: { $round: ['$averageScore', 2] },
            reviewCount: 1,
            avgJobPerformance: { $round: [{ $avg: '$scores.jobPerformance' }, 2] },
            avgAdditionalAchievements: { $round: [{ $avg: '$scores.additionalAchievements' }, 2] },
            avgCompliance: { $round: [{ $avg: '$scores.compliance' }, 2] },
            avgTeamwork: { $round: [{ $avg: '$scores.teamwork' }, 2] },
            avgDiligence: { $round: [{ $avg: '$scores.diligence' }, 2] },
            _id: 0
          }
        }
      ]);

      // 关联员工信息
      const result = await Promise.all(
        summary.map(async item => {
          const employee = await User.findById(item.reviewee).select('name employeeId department');
          return {
            ...item,
            employee
          };
        })
      );

      // 按平均得分排序
      result.sort((a, b) => b.averageScore - a.averageScore);

      res.json({
        success: true,
        period: { quarter, year },
        department: department || '全部',
        count: result.length,
        data: result
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

/**
 * @route   GET /api/admin/export
 * @desc    导出绩效互评汇总统计表为Excel
 * @access  Private (Admin only)
 */
router.get('/export', async (req, res) => {
    try {
      const { quarter, year, department } = req.query;

      if (!quarter || !year) {
        return res.status(400).json({ success: false, message: '请提供季度和年份参数' });
      }

      // 调用汇总统计接口获取数据
      const summaryResponse = await new Promise((resolve, reject) => {
        // 模拟请求汇总统计接口
        req.query.quarter = quarter;
        req.query.year = year;
        req.query.department = department;

        // 调用summary接口的处理函数
        router.stack.find(r => r.route && r.route.path === '/summary').handle(req, {
          json: (data) => resolve(data)
        }, reject);
      });

      if (!summaryResponse.success) {
        return res.status(400).json(summaryResponse);
      }

      const { data: summaryData, period, department: dept } = summaryResponse;

      // 准备Excel数据
      const excelData = summaryData.map(item => ({
        '员工姓名': item.employee.name,
        '工号': item.employee.employeeId,
        '部门': item.employee.department,
        '评价人数': item.reviewCount,
        '本职工作平均分': item.avgJobPerformance,
        '附加业绩平均分': item.avgAdditionalAchievements,
        '合规守纪平均分': item.avgCompliance,
        '互助平均分': item.avgTeamwork,
        '勤勉平均分': item.avgDiligence,
        '最终平均绩点': item.averageScore
      }));

      // 创建工作簿和工作表
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(excelData);

      // 设置工作表名称
      const sheetName = `${period.year}年Q${period.quarter}${dept ? dept : '全部门'}绩效互评汇总`;
      xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

      // 生成Excel文件
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      const fileName = `${sheetName.replace(///g, '-')}.xlsx`;
      const filePath = path.join(tempDir, fileName);

      xlsx.writeFile(workbook, filePath);

      // 发送文件给客户端
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('文件下载错误:', err);
        }
        // 删除临时文件
        setTimeout(() => {
          fs.unlinkSync(filePath);
        }, 5000);
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

module.exports = router;