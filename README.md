# Todo App MVP

A simple todo application with React frontend and Cloudflare Worker backend.

## Architecture

- **Frontend**: React + Vite + TailwindCSS (`packages/client`)
- **Backend**: Cloudflare Worker + Hono + Prisma + D1 Database (`packages/api`)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
cd packages/api && npm install
cd ../client && npm install
cd ../..
```

### 2. Setup D1 Database

Create a D1 database:
```bash
cd packages/api
npx wrangler d1 create todo-database
```

Copy the database ID from the output and update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "todo-database"
database_id = "your-actual-database-id-here"
```

### 3. Initialize Database Schema

```bash
cd packages/api
npx prisma generate
npx wrangler d1 execute todo-database --local --file=./prisma/migrations/init.sql
```

If you don't have a migration file, create the tables manually:
```bash
npx wrangler d1 execute todo-database --local --command="CREATE TABLE Project (id TEXT PRIMARY KEY, name TEXT NOT NULL);"
npx wrangler d1 execute todo-database --local --command="CREATE TABLE Todo (id TEXT PRIMARY KEY, content TEXT NOT NULL, is_completed BOOLEAN DEFAULT false, project_id TEXT NOT NULL, FOREIGN KEY (project_id) REFERENCES Project(id) ON DELETE CASCADE);"
```

### 4. Development

Start both frontend and backend in development mode:

```bash
# Start backend (runs on http://localhost:8787)
npm run dev:api

# In another terminal, start frontend (runs on http://localhost:5173)
npm run dev:client
```

Or run both simultaneously:
```bash
npm run dev
```

## MVP Features

✅ **Core Functionality**:
- Create projects
- Add todos to projects
- Toggle todo completion status
- Data persistence with D1 database

✅ **API Endpoints**:
- `GET /api/projects` - Get all projects with their todos
- `POST /api/projects` - Create a new project
- `POST /api/todos` - Add a todo to a project
- `PUT /api/todos/:id` - Toggle todo completion

✅ **Frontend Features**:
- Simple, clean UI with TailwindCSS
- Real-time updates without page refresh
- Form validation and error handling

## Testing the MVP

1. Open http://localhost:5173
2. Create a project (e.g., "第一个项目")
3. Add a todo (e.g., "完成MVP")
4. Check the todo as completed
5. Refresh the page - data should persist

## 🚀 一键部署

### 快速部署到 Cloudflare

**Windows 用户:**
```bash
.\deploy.bat
```

**Mac/Linux 用户:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### 本地开发

**Windows 用户:**
```bash
.\dev.bat
```

**Mac/Linux 用户:**
```bash
chmod +x dev.sh
./dev.sh
```

## 📋 部署清单

部署脚本会自动执行以下步骤：

✅ **后端部署**:
1. 生成最新的 Prisma 客户端
2. 部署 Worker 到 Cloudflare Workers
3. 验证 API 连接

✅ **前端部署**:
1. 构建生产版本 (Vite build)
2. 部署静态文件到 Cloudflare Pages
3. 更新 DNS 配置

✅ **数据库**:
- D1 数据库已配置并运行
- Schema 同步完成
- 数据持久化正常

## 🌐 生产环境地址

- **前端网站**: https://todo-app-client.pages.dev
- **API 接口**: https://todo-api.bassnova.workers.dev
- **数据库**: Cloudflare D1 (todo-database)

## 📝 更新流程

每次修改代码后，只需运行部署脚本即可更新线上版本：

1. **修改代码** (前端或后端)
2. **运行部署脚本** (`./deploy.sh` 或 `.\deploy.bat`)
3. **等待 1-2 分钟生效**
4. **访问生产网站验证**

## Next Steps

After MVP validation, consider adding:
- User authentication
- Due dates for todos
- Priority levels
- Project categories
- Better error handling
- Loading states
- Responsive design improvements