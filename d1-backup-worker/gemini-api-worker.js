// 使用直接fetch调用Gemini API

export default {
  async fetch(request, env, ctx) {
    // 处理CORS预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // 只接受POST请求
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    try {
      // 解析请求体
      const requestData = await request.json();
      const { prompt, model = "gemini-2.5-pro" } = requestData;

      if (!prompt) {
        return new Response(JSON.stringify({ error: "Prompt is required" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // 使用环境变量中的API密钥
      const apiKey = env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "API Key is not configured on the server" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
      
      // 直接调用Gemini API
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      });
      
      // 处理Gemini API响应
      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json();
        return new Response(JSON.stringify({ error: errorData }), {
          status: geminiResponse.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
      
      const geminiData = await geminiResponse.json();
      
      // 提取文本内容
      let responseText = "";
      if (geminiData.candidates && geminiData.candidates.length > 0 && 
          geminiData.candidates[0].content && geminiData.candidates[0].content.parts) {
        const parts = geminiData.candidates[0].content.parts;
        for (const part of parts) {
          if (part.text) {
            responseText += part.text;
          }
        }
      }
      
      return new Response(JSON.stringify({ 
        text: responseText,
        response: geminiData 
      }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  }
};