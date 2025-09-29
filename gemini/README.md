# Gemini API Worker

这是一个基于Cloudflare Workers的Gemini API代理服务，用于在前端应用中安全地调用Google Gemini API，避免暴露API密钥。

## 功能特点

- 安全代理Google Gemini API调用
- 隐藏API密钥，防止泄露
- 支持CORS，可从任何前端应用调用
- 简单的API接口设计

## 部署说明

### 前提条件

- [Node.js](https://nodejs.org/) (推荐v16或更高版本)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Google Gemini API密钥

### 安装步骤

1. 克隆或下载此仓库
2. 安装依赖：
   ```
   npm install
   ```
3. 配置环境变量：
   在Cloudflare Workers的环境变量中设置`GEMINI_API_KEY`，或者在本地开发时创建`.dev.vars`文件：
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. 部署Worker：
   ```
   npx wrangler deploy
   ```

## 使用方法

### API端点

部署后，您可以通过以下URL访问API：
```
https://gemini-api-worker.bassnova.workers.dev
```

### 请求格式

发送POST请求，包含以下JSON格式的请求体：

```json
{
  "prompt": "您的问题或提示",
  "model": "gemini-2.5-pro"  // 可选，默认为gemini-2.5-pro
}
```

### 响应格式

成功响应的JSON格式如下：

```json
{
  "text": "AI生成的回答内容",
  "response": {
    // 原始Gemini API响应
  }
}
```

### 使用示例

#### cURL

```bash
curl -X POST https://gemini-api-worker.bassnova.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"prompt": "解释什么是人工智能", "model": "gemini-2.5-pro"}'
```

#### JavaScript

```javascript
async function askGemini(prompt) {
  const response = await fetch("https://gemini-api-worker.bassnova.workers.dev", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: prompt,
      model: "gemini-2.5-pro"
    })
  });
  
  const data = await response.json();
  return data.text;
}

// 使用示例
askGemini("解释量子计算的基本原理").then(answer => {
  console.log(answer);
});
```

## 错误处理

API可能返回以下错误：

- 400: 请求格式错误或缺少必要参数
- 405: 使用了不支持的HTTP方法
- 500: 服务器内部错误或API密钥未配置

## 本地开发

1. 克隆仓库后，进入项目目录
2. 创建`.dev.vars`文件并设置`GEMINI_API_KEY`
3. 运行本地开发服务器：
   ```
   npx wrangler dev
   ```

## 注意事项

- 确保您的Gemini API密钥有足够的配额
- 此Worker仅作为代理，不存储任何请求或响应数据
- 默认使用`gemini-2.5-pro`模型，但可以在请求中指定其他支持的模型