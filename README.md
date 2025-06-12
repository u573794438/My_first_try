# 绩效互评系统

一个用于部门人员在线填写绩效互评表单的Web应用，包含员工填写端和管理员后台。

## 功能特点

- **员工端**：在线填写绩效互评表单，支持企业微信单点登录，按权重计算百分制绩点
- **管理员端**：管理互评人员名单和权限，查询提交表单，生成汇总统计表并导出Excel

## 技术栈

- **前端**：React.js, Ant Design
- **后端**：Node.js, Express, MongoDB
- **部署**：Docker, Docker Compose

## 安装与配置

### 1. 克隆仓库

```bash
# 克隆代码仓库
git clone <repository-url>
cd performance-review-system
```

### 2. 环境变量配置

复制环境变量模板并修改为您的配置：

```bash
cp .env.example .env
```

编辑.env文件，设置以下关键配置：

```
# 服务器配置
PORT=5000
NODE_ENV=production
API_BASE_URL=http://localhost:5000
FRONTEND_BASE_URL=http://localhost:3000

# MongoDB配置
MONGODB_URI=mongodb://mongodb:27017/performance-review

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d

# 企业微信配置
WECHAT_CORP_ID=your_corp_id
WECHAT_AGENT_ID=your_agent_id
WECHAT_SECRET=your_agent_secret
WECHAT_REDIRECT_URI=http://localhost:5000/api/auth/wechat/callback
```

### 3. 本地开发环境运行

#### 后端启动

```bash
cd backend
npm install
npm run dev
```

#### 前端启动

```bash
cd frontend
npm install
npm start
```

### 4. Docker部署

使用Docker Compose一键部署：

```bash
docker-compose up -d
```

服务将在以下地址可用：
- 前端: http://localhost:3000
- 后端API: http://localhost:5000

## 使用指南

### 员工使用

1. 访问系统首页，点击"企业微信登录"
2. 使用企业微信扫码授权
3. 在仪表盘查看待评人员列表
4. 点击"评分"按钮填写绩效互评表单
5. 可选择"保存草稿"或"提交"

### 管理员使用

1. 使用管理员账号登录系统
2. 在"人员管理"页面维护员工信息
3. 在"互评查询"页面查看提交的表单
4. 在"汇总统计"页面查看绩效统计结果并导出Excel

## 提交时间段设置

系统默认设置为每季度最后一周至下季度第二周之间允许提交绩效互评表单。
如需修改此设置，请调整`backend/routes/review.routes.js`中的`isSubmissionPeriod`函数。

## 评分维度与权重

- 本职工作：50%
- 附加业绩：20%
- 合规守纪：15%
- 互助：10%
- 勤勉：5%

## 故障排除

- **数据库连接问题**：确保MongoDB服务已启动或Docker Compose中的mongodb服务正常运行
- **企业微信登录失败**：检查企业微信应用配置和redirect_uri是否正确
- **权限问题**：确保管理员账号的role字段设置为'admin'

## 维护与更新

- 更新代码后，使用`docker-compose down && docker-compose up -d --build`重新构建容器
- 定期备份MongoDB数据