项目：Project-Daily Workbench 开发任务编排
阶段一：项目初始化与技术栈打通 (Foundation & MVP)
这个阶段的目标是搭建一个能跑通前后端数据交互的最小化应用。

Task 1: 环境搭建 - Monorepo 初始化

目标: 创建一个管理前后端代码的单体仓库。

要求:

使用 pnpm workspace 或 npm/yarn workspace 初始化项目。

创建两个工作区：packages/api (后端) 和 packages/client (前端)。

Task 2: 后端设置 - Cloudflare Worker 与 Hono

目标: 初始化后端 HTTP 服务器和路由。

要求:

在 packages/api 中，使用 wrangler CLI 初始化一个新的 Cloudflare Worker 项目。

安装 hono 库，并创建一个返回 "Hello World" 的根路由 / 以测试服务是否正常运行。

Task 3: 数据库集成 - Prisma 与 Cloudflare D1

目标: 连接数据库并定义核心数据模型。

要求:

使用 wrangler 创建一个新的 D1 数据库。

在 wrangler.toml 中配置数据库绑定。

在 packages/api 中，安装 prisma 和 @prisma/adapter-d1。

创建 prisma/schema.prisma 文件，并定义文档中描述的 Projects, Todos, 和 DailyLogs 三个表的完整结构。

运行 prisma db push 将数据模型同步到 D1 数据库。

Task 4: 前端设置 - Vite, React & TailwindCSS

目标: 创建前端应用并配置样式。

要求:

在 packages/client 中，使用 Vite 初始化一个新的 React (TypeScript + SWC) 项目。

根据 TailwindCSS 官方文档，完成在 Vite 项目中的安装和配置。

Task 5: 前后端联调 - 配置开发代理

目标: 确保在开发环境下，前端发出的 API 请求能被后端服务正确接收。

要求:

修改 client/vite.config.ts 文件。

添加 server.proxy 配置，将所有 /api 开头的请求代理到 wrangler dev server 运行的地址 (通常是 http://127.0.0.1:8787)。

阶段二：核心功能开发 - 项目 (Projects)
这个阶段我们专注于实现项目管理的核心 CRUD (增删改查) 功能。

Task 6: 后端 - Projects API 实现

目标: 编写所有与项目相关的后端接口。

要求:

POST /api/projects: 创建新项目。

GET /api/projects: 获取所有项目列表。

核心逻辑: 在从数据库查询出数据后，为每个项目动态计算并附加 days_since_update 字段。

GET /api/projects/:id: 获取单个项目的详情，需要包含其关联的 Todos 和 DailyLogs。

PUT /api/projects/:id: 更新项目的基础信息（如 name, description）。

Task 7: 前端 - 项目看板页面 (ProjectDashboard)

目标: 创建一个可以展示和创建项目的页面。

要求:

创建一个名为 ProjectDashboard.tsx 的页面组件。

使用 useEffect 在页面加载时调用 GET /api/projects 接口获取数据。

创建一个 ProjectCard.tsx 组件，用于展示单个项目信息。

在 ProjectDashboard 中渲染项目列表，并根据 days_since_update 字段进行降序排序。

在 ProjectCard 上明确显示 "X天未更新" 的提示。

在页面上添加一个表单和按钮，用于调用 POST /api/projects 创建新项目。

阶段三：核心功能开发 - 待办事项 (Todos)
现在我们为项目添加具体的待办事项管理功能。

Task 8: 后端 - Todos API 实现

目标: 编写所有与待办事项相关的后端接口。

要求:

POST /api/todos: 创建一个新的 Todo (请求体需要 project_id 和 content)。

PUT /api/todos/:id: 更新一个 Todo，主要用于切换 is_completed 状态。

核心逻辑: 使用 Prisma 事务，在更新 Todo 状态的同时，必须将该 Todo 所属 Project 的 last_updated_at 字段更新为当前时间。

DELETE /api/todos/:id: 删除一个 Todo。

Task 9: 前端 - 项目详情页 (ProjectDetail)

目标: 创建一个展示和管理单个项目所有 Todos 的页面。

要求:

创建 ProjectDetail.tsx 页面组件，它能接收一个 projectId 作为参数。

页面加载时调用 GET /api/projects/:id 获取项目详情和 Todos 列表。

渲染该项目下的所有 Todos，每个 Todo 前面有一个复选框。

实现勾选/取消勾选复选框时，调用 PUT /api/todos/:id 接口更新状态，并实时刷新UI。

在页面上添加一个输入框和按钮，用于调用 POST /api/todos 为当前项目添加新的 Todo。

阶段四：工作台与日志功能开发 (Workbench & Logs)
这是应用的核心特色功能，将分散的项目信息聚合到每日视图中。

Task 10: 后端 - DailyLogs API 实现

目标: 编写记录工作日志的后端接口。

要求:

POST /api/logs: 创建一条新的日志 (请求体需要 project_id 和 content)。

核心逻辑: 与 Todos 类似，创建日志后，必须更新其所属 Project 的 last_updated_at 字段。

Task 11: 前端 - “今日待办”状态管理

目标: 设计一个前端机制来管理哪些 Todos 被选入了“今天的工作台”。

要求:

选择一种前端状态管理方案（初期建议使用 localStorage + React Context，或轻量级的 Zustand）。

在 ProjectDetail 页面的每个 Todo 旁边，添加一个“添加到今天”的按钮。点击后，将该 Todo 的 ID 存入全局状态。

Task 12: 前端 - 今日工作台页面 (DailyWorkbench)

目标: 构建核心的每日工作界面。

要求:

创建 DailyWorkbench.tsx 页面组件。

左侧区域: 从全局状态中读取“今日待办”的 Todo ID 列表，然后从所有项目中筛选出这些 Todos 并显示它们。这里的操作应与 ProjectDetail 页中的 Todo 列表功能一致（可复用组件），允许直接更新状态。

右侧区域:

根据“今日待办”列表涉及的项目，动态生成对应的日志输入区 (LogEditor 组件)。

每个日志输入区包含一个文本框和一个保存按钮，点击保存时调用 POST /api/logs 接口。
















