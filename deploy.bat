@echo off
chcp 65001 >nul

echo 🚀 开始部署 Todo App...

:: 1. 部署后端 Worker
echo.
echo 📦 部署后端 Worker...
cd packages\api

echo    生成 Prisma 客户端...
call npx prisma generate

echo    部署到 Cloudflare Workers...
call npm run deploy

echo ✅ 后端部署完成！
echo    API 地址: https://todo-api.bassnova.workers.dev

:: 2. 构建并部署前端
cd ..\client
echo.
echo 📦 构建并部署前端...

echo    构建前端...
call npm run build

echo    部署到 Cloudflare Pages...
call npx wrangler pages deploy dist --project-name="todo-app-client"

echo ✅ 前端部署完成！
echo    网站地址: https://todo-app-client.pages.dev

:: 回到根目录
cd ..\..

echo.
echo 🎉 部署完成！
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🌐 前端网站: https://todo-app-client.pages.dev
echo ⚡ 后端 API: https://todo-api.bassnova.workers.dev
echo 🗄️ 数据库: Cloudflare D1 (todo-database)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 💡 提示: 部署通常需要 1-2 分钟生效

pause