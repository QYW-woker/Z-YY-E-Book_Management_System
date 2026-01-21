# 电子书后台管理系统

面向管理员的电子书后台管理系统（H5企业级应用），用于管理电子书资源。

## 技术栈

### 前端
- Vue 3 + TypeScript + Vite
- Element Plus
- Pinia (状态管理)
- Axios (HTTP客户端)
- ECharts (图表)

### 后端
- Node.js + Express + TypeScript
- SQLite (开发) / PostgreSQL (生产)
- JWT (认证)

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
# 同时启动前后端
npm run dev

# 单独启动前端
npm run dev:frontend

# 单独启动后端
npm run dev:backend
```

### 构建
```bash
npm run build
```

### 生产运行
```bash
npm run start
```

## 项目结构

```
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── api/       # API接口
│   │   ├── components/# 组件
│   │   ├── composables/# 组合式函数
│   │   ├── router/    # 路由
│   │   ├── stores/    # Pinia状态
│   │   ├── types/     # TypeScript类型
│   │   ├── utils/     # 工具函数
│   │   └── views/     # 页面
│   └── ...
├── backend/           # 后端项目
│   ├── src/
│   │   ├── config/    # 配置
│   │   ├── controllers/# 控制器
│   │   ├── middlewares/# 中间件
│   │   ├── models/    # 数据模型
│   │   ├── routes/    # 路由
│   │   ├── services/  # 业务服务
│   │   ├── types/     # TypeScript类型
│   │   └── utils/     # 工具函数
│   └── uploads/       # 上传文件存储
└── ...
```

## 默认账号

- 用户名: admin
- 密码: admin123
