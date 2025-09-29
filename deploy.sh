#!/bin/bash

set -e

echo "🚀 开始部署 Todo App..."

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 部署后端 Worker
echo -e "${BLUE}📦 部署后端 Worker...${NC}"
cd packages/api

# 确保 Prisma 客户端是最新的
echo "   生成 Prisma 客户端..."
npx prisma generate

# 部署 Worker
echo "   部署到 Cloudflare Workers..."
npm run deploy

echo -e "${GREEN}✅ 后端部署完成！${NC}"
echo "   API 地址: https://todo-api.bassnova.workers.dev"

# 2. 构建并部署前端
cd ../client
echo -e "${BLUE}📦 构建并部署前端...${NC}"

# 构建生产版本
echo "   构建前端..."
npm run build

# 部署到 Cloudflare Pages
echo "   部署到 Cloudflare Pages..."
npx wrangler pages deploy dist --project-name="todo-app-client"

echo -e "${GREEN}✅ 前端部署完成！${NC}"
echo "   网站地址: https://todo-app-client.pages.dev"

# 回到根目录
cd ../..

echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "🌐 前端网站: ${YELLOW}https://todo-app-client.pages.dev${NC}"
echo -e "⚡ 后端 API: ${YELLOW}https://todo-api.bassnova.workers.dev${NC}"
echo -e "🗄️  数据库: ${YELLOW}Cloudflare D1 (todo-database)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}💡 提示: 部署通常需要 1-2 分钟生效${NC}"