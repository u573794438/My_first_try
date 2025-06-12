const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 用户角色枚举
const UserRole = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee'
};

// 用户模型定义
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.EMPLOYEE
  },
  wechatId: {
    type: String,
    unique: true,
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间戳
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 添加静态方法
userSchema.statics.UserRole = UserRole;

const User = mongoose.model('User', userSchema);
module.exports = User;