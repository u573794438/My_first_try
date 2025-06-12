const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 评分维度枚举
const ScoreDimension = {
  JOB_PERFORMANCE: 'jobPerformance',
  ADDITIONAL_ACHIEVEMENTS: 'additionalAchievements',
  COMPLIANCE: 'compliance',
  TEAMWORK: 'teamwork',
  DILIGENCE: 'diligence'
};

// 评分状态枚举
const ReviewStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted'
};

// 绩效互评模型定义
const reviewSchema = new Schema({
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quarter: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  year: {
    type: Number,
    required: true,
    min: 2020
  },
  scores: {
    [ScoreDimension.JOB_PERFORMANCE]: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    [ScoreDimension.ADDITIONAL_ACHIEVEMENTS]: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    [ScoreDimension.COMPLIANCE]: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    [ScoreDimension.TEAMWORK]: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    [ScoreDimension.DILIGENCE]: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  calculatedFinalScore: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: Object.values(ReviewStatus),
    default: ReviewStatus.DRAFT
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  submittedAt: Date
});

// 计算最终得分 (百分制)
reviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // 权重配置
  const weights = {
    [ScoreDimension.JOB_PERFORMANCE]: 0.5,
    [ScoreDimension.ADDITIONAL_ACHIEVEMENTS]: 0.2,
    [ScoreDimension.COMPLIANCE]: 0.15,
    [ScoreDimension.TEAMWORK]: 0.1,
    [ScoreDimension.DILIGENCE]: 0.05
  };
  
  // 计算加权总分
  let totalScore = 0;
  for (const dimension in weights) {
    totalScore += this.scores[dimension] * 20 * weights[dimension]; // 5分制转百分制: 5分=100分, 1分=20分
  }
  
  this.calculatedFinalScore = Math.round(totalScore * 100) / 100; // 保留两位小数
  
  // 如果状态变为已提交，记录提交时间
  if (this.status === ReviewStatus.SUBMITTED && !this.submittedAt) {
    this.submittedAt = Date.now();
  }
  
  next();
});

// 添加静态方法
reviewSchema.statics.ScoreDimension = ScoreDimension;
reviewSchema.statics.ReviewStatus = ReviewStatus;

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;