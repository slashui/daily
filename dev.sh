#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 启动本地开发环境...${NC}"

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

if [ ! -d "packages/api/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd packages/api && npm install && cd ../..
fi

if [ ! -d "packages/client/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd packages/client && npm install && cd ../..
fi

# 生成 Prisma 客户端
echo "🔄 生成 Prisma 客户端..."
cd packages/api && npx prisma generate && cd ../..

echo ""
echo -e "${GREEN}✅ 准备完成！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "🔧 开发服务器将启动在:"
echo -e "   后端 API: ${YELLOW}http://localhost:8787${NC}"
echo -e "   前端网站: ${YELLOW}http://localhost:5173${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}💡 提示: 使用 Ctrl+C 停止所有服务${NC}"
echo ""

# 启动开发服务器（并行）
npm run dev