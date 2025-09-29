# 📝 Dark Mode Project Management System

A modern project management system with a sophisticated deep dark theme, built with React + TypeScript, shadcn/ui, and Cloudflare infrastructure.

## 🎨 Design System

### Deep Dark Theme Specifications

This application follows a carefully crafted deep dark mode design system with amber accents:

**Color Palette:**
- **Background**: `hsl(240 10% 3.9%)` - Deep charcoal base
- **Card Background**: `hsl(240 6% 10%)` - Elevated surfaces
- **Primary Accent**: `hsl(43 86% 51%)` - Amber (#F59E0B) for actions and highlights
- **Text Primary**: `hsl(240 5% 96.1%)` - High contrast white-grey for main content
- **Text Secondary**: `hsl(240 4% 46.1%)` - Mid-grey for secondary information
- **Borders**: `hsl(240 5% 15%)` - Subtle dark grey for element separation
- **Success**: `hsl(142 71% 45%)` - Green for completed states
- **Warning**: `hsl(38 92% 50%)` - Orange for pending/warning states
- **Destructive**: `hsl(0 85% 60%)` - Red for errors and dangerous actions

**Visual Principles:**
- ✅ **No box-shadows**: Clean, flat design approach
- ✅ **CSS Grid layouts**: Responsive grid systems with `gap-6` spacing
- ✅ **Rounded corners**: `border-radius: 0.65rem` for modern feel
- ✅ **Border-based hierarchy**: Visual depth through border variations instead of shadows
- ✅ **Subtle animations**: Smooth transitions for interactive elements
- ✅ **Consistent spacing**: 8px base unit system (space-2, space-4, space-6, space-8)

**Typography Scale:**
- **Hero**: `text-3xl font-bold` - Page titles
- **Section**: `text-xl font-semibold` - Section headings
- **Body**: `text-sm` - Standard text
- **Caption**: `text-xs text-muted-foreground` - Secondary information

### Component Design Patterns

**Cards:**
```css
.card {
  background: hsl(240 6% 10%);
  border: 1px solid hsl(240 5% 15%);
  border-radius: 0.65rem;
}
```

**Interactive States:**
- Hover: `hover:border-primary/20` - Subtle amber border on hover
- Focus: `focus:border-primary` - Full amber border when focused
- Active: `bg-primary/5` - Light amber background for selected states

**Status Indicators:**
- Completed: Green check icons with `text-green-400`
- Pending: Clock icons with `text-muted-foreground`
- Progress: Amber progress bars with `bg-primary`

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui (`packages/client`)
- **Backend**: Cloudflare Worker + Hono + Prisma + D1 Database (`packages/api`)
- **UI Components**: shadcn/ui with custom dark theme configuration
- **Icons**: Lucide React for consistent iconography
- **Charts**: Recharts with custom amber theming

## 🖥️ UI Implementation

### Page Structure

**1. Project Dashboard** (`/`)
- Grid layout showcasing all projects
- Create new project functionality
- Project cards with completion status and progress indicators
- Responsive design: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)

**2. Daily Workbench** (`/workbench`)
- Today's active tasks across all projects
- Interactive checkboxes with amber borders for visibility
- Project-based task grouping
- Real-time completion tracking

**3. Project Detail** (`/project/:id`)
- Individual project management interface
- Todo creation and editing
- Progress visualization with amber-themed charts
- Requirements and task organization

**4. Daily Summaries** (`/summaries`)
- Historical task completion analytics
- Auto-generated daily summaries
- Completion rate badges with color coding
- Detailed task breakdown by date

### Key Component Features

**Navigation:**
- Clean horizontal navigation with amber hover states
- Active page indication with primary color accent
- Icon + text layout for clear identification

**Forms:**
- Consistent input styling with focus states
- Amber primary buttons for main actions
- Subtle border interactions on focus
- Proper validation states

**Data Visualization:**
- Custom Recharts integration with amber theming
- Progress bars using primary color scheme
- Badge system for status indication (success/warning/error)
- Completion rate visualization

**Interactive Elements:**
- Hover animations with border color transitions
- Focus management for accessibility
- Loading states with subtle text changes
- Error handling with destructive color scheme

### Responsive Design

- **Mobile First**: Base styles optimized for mobile devices
- **Breakpoints**:
  - `md:` 768px+ (tablets)
  - `lg:` 1024px+ (desktops)
- **Grid Adaptations**:
  - Projects: 1 → 2 → 3 columns
  - Tasks: Full width → 2 columns
- **Typography**: Scales appropriately across devices
- **Touch Targets**: 44px minimum for mobile interaction

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

## 🔧 Technical Implementation

### shadcn/ui Configuration

The application uses shadcn/ui with a custom configuration optimized for deep dark mode:

**components.json:**
```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

**Installed Components:**
- Button, Card, Input, Badge, Separator, Textarea
- Progress, Dialog, Checkbox
- Icons from Lucide React
- Custom color theming through CSS variables

### CSS Variables System

**Primary Color System:**
```css
:root {
  --background: 240 10% 3.9%;
  --foreground: 240 5% 96.1%;
  --card: 240 6% 10%;
  --card-foreground: 240 5% 96.1%;
  --primary: 43 86% 51%;
  --primary-foreground: 240 10% 3.9%;
  --border: 240 5% 15%;
  --radius: 0.65rem;
}
```

**Semantic Color Mapping:**
- Uses HSL color space for consistent color manipulation
- CSS variables allow for easy theme switching
- Tailwind utility classes automatically inherit these values

### State Management

- **React Hooks**: useState, useEffect for local component state
- **API Integration**: Custom API hooks for data fetching
- **Error Handling**: Consistent error boundaries and user feedback
- **Loading States**: Graceful loading indicators throughout the app

### Performance Optimizations

- **Code Splitting**: React Router for route-based code splitting
- **Vite Build System**: Fast HMR and optimized production builds
- **Tailwind Purging**: Unused styles removed in production
- **Component Lazy Loading**: Dynamic imports for large components

### Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **ARIA Labels**: Proper labeling for screen readers
- **Color Contrast**: WCAG AA compliant color ratios
- **Focus Management**: Visible focus indicators with amber accent
- **Semantic HTML**: Proper HTML structure and landmarks

### Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **CSS Grid**: Full support for layout system
- **CSS Variables**: Native browser support
- **ES Modules**: Vite handles module bundling for older browsers

## Next Steps

After the current implementation, consider adding:
- User authentication and multi-tenant support
- Advanced filtering and search capabilities
- Due dates and priority levels for todos
- Project categories and tags system
- Real-time collaboration features
- Mobile app with React Native
- Advanced analytics and reporting
- Export functionality (PDF, CSV)
- Integration with external calendar systems
- Offline support with service workers