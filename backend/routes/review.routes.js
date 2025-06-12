const express = require('express');
const router = express.Router();

const Review = require('../models/review.model');
const User = require('../models/user.model');

// 检查提交时间是否在允许范围内
const isSubmissionPeriod = (quarter, year) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 月份从0开始，所以+1

  // 如果不是指定的年份和季度，直接返回false
  if (year !== currentYear) return false;

  // 计算提交时间段：季度最后一周至下季度第二周
  let submissionStart, submissionEnd;

  switch(quarter) {
    case 1:
      // Q1: 3月最后一周至4月第二周
      submissionStart = new Date(year, 2, 25); // 3月25日
      submissionEnd = new Date(year, 3, 14); // 4月14日
      break;
    case 2:
      // Q2: 6月最后一周至7月第二周
      submissionStart = new Date(year, 5, 25); // 6月25日
      submissionEnd = new Date(year, 6, 14); // 7月14日
      break;
    case 3:
      // Q3: 9月最后一周至10月第二周
      submissionStart = new Date(year, 8, 25); // 9月25日
      submissionEnd = new Date(year, 9, 14); // 10月14日
      break;
    case 4:
      // Q4: 12月最后一周至次年1月第二周
      submissionStart = new Date(year, 11, 25); // 12月25日
      submissionEnd = new Date(year + 1, 0, 14); // 次年1月14日
      break;
    default:
      return false;
  }

  return now >= submissionStart && now <= submissionEnd;
};

/**
 * @route   POST /api/reviews
 * @desc    创建或更新绩效互评表单（保存草稿或提交）
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
      const { reviewee, quarter, year, scores, status } = req.body;
      const reviewer = req.body.reviewer;

      // 验证不能给自己评分
      if (reviewer === reviewee) {
        return res.status(400).json({ success: false, message: '不能给自己评分' });
      }

      // 验证评分维度完整性
      const requiredDimensions = Object.values(Review.ScoreDimension);
      for (const dimension of requiredDimensions) {
        if (scores[dimension] === undefined || scores[dimension] < 1 || scores[dimension] > 5) {
          return res.status(400).json({
            success: false,
            message: `评分维度${dimension}不完整或值不在1-5范围内`
          });
        }
      }

      // 验证提交状态
      if (status === Review.ReviewStatus.SUBMITTED) {
        // 检查是否在提交时间段内
        if (!isSubmissionPeriod(quarter, year)) {
          return res.status(403).json({
            success: false,
            message: '不在提交时间段内，只能在每季度最后一周至下季度第二周之间提交'
          });
        }
      }

      // 查找是否已有该被评人的评分
      let review = await Review.findOne({
        reviewer,
        reviewee,
        quarter,
        year
      });

      if (review) {
        // 更新现有评分
        review.scores = scores;
        review.status = status || review.status;
        review.updatedAt = Date.now();
        if (status === Review.ReviewStatus.SUBMITTED) {
          review.submittedAt = Date.now();
        }
      } else {
        // 创建新评分
        review = new Review({
          reviewer,
          reviewee,
          quarter,
          year,
          scores,
          status: status || Review.ReviewStatus.DRAFT
        });
      }

      await review.save();
      res.json({ success: true, data: review });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

/**
 * @route   GET /api/reviews/me
 * @desc    获取当前用户提交的所有评分
 * @access  Private
 */
router.get('/me', async (req, res) => {
    try {
      const reviews = await Review.find({
        reviewer: req.user.id
      })
      .populate('reviewee', 'name employeeId department')
      .sort({ year: -1, quarter: -1 });

      res.json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

/**
 * @route   GET /api/reviews/pending
 * @desc    获取当前用户需要评分的人员列表及状态
 * @access  Private
 */
router.get('/pending', async (req, res) => {
    try {
      // 获取当前季度和年份
      const now = new Date();
      const year = now.getFullYear();
      let quarter = Math.floor(now.getMonth() / 3) + 1;

      // 如果当前时间在下季度的前两周，仍属于上一季度的提交期
      const month = now.getMonth() + 1;
      if (month % 3 === 1 && now.getDate() <= 14) {
        quarter = quarter === 1 ? 4 : quarter - 1;
      }

      // 获取所有需要评分的活跃员工
      const employeesToReview = await User.find({
        isActive: true,
        _id: { $ne: req.user.id }
      }).select('name employeeId department _id');

      // 获取已提交的评分
      const submittedReviews = await Review.find({
        reviewer: req.user.id,
        quarter,
        year
      }).select('reviewee status');

      // 整合结果
      const result = employeesToReview.map(employee => {
        const review = submittedReviews.find(r => r.reviewee.toString() === employee._id.toString());
        return {
          ...employee._doc,
          reviewStatus: review ? review.status : null,
          reviewId: review ? review._id : null
        };
      });

      res.json({
        success: true,
        period: { quarter, year },
        data: result
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

/**
 * @route   GET /api/reviews/:id
 * @desc    获取特定评分详情
 * @access  Private
 */
router.get('/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const review = await Review.findById(req.params.id)
        .populate('reviewee', 'name employeeId department')
        .populate('reviewer', 'name employeeId');

      if (!review) {
        return res.status(404).json({ success: false, message: '评分记录不存在' });
      }

      // 检查权限：只能查看自己提交的或自己被评的
      if (
        review.reviewer.toString() !== req.user.id && 
        review.reviewee.toString() !== req.user.id &&
        req.user.role !== User.UserRole.ADMIN
      ) {
        return res.status(403).json({ success: false, message: '没有权限查看此评分' });
      }

      res.json({ success: true, data: review });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

module.exports = router;