@echo off
chcp 65001 >nul

echo 🚀 启动本地开发环境...

:: 检查并安装依赖
if not exist "node_modules" (
    echo 📦 安装依赖...
    call npm install
)

if not exist "packages\api\node_modules" (
    echo 📦 安装后端依赖...
    cd packages\api && call npm install && cd ..\..
)

if not exist "packages\client\node_modules" (
    echo 📦 安装前端依赖...
    cd packages\client && call npm install && cd ..\..
)

:: 生成 Prisma 客户端
echo 🔄 生成 Prisma 客户端...
cd packages\api && call npx prisma generate && cd ..\..

echo.
echo ✅ 准备完成！
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🔧 开发服务器将启动在:
echo    后端 API: http://localhost:8787
echo    前端网站: http://localhost:5173
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 💡 提示: 使用 Ctrl+C 停止所有服务
echo.

:: 启动开发服务器
call npm run dev