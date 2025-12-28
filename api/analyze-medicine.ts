const MEDICINE_SCHEMA_JSON = {
  type: "object",
  properties: {
    name: { type: "string", description: "药品通用名" },
    brand: { type: "string", description: "品牌或生产厂家" },
    ingredients: { type: "string", description: "主要成分" },
    specs: { type: "string", description: "规格" },
    indications: { type: "string", description: "适应症/功能主治" },
    usage: { type: "string", description: "用法用量" },
    expiryDate: { type: "string", description: "有效期至（格式：YYYY-MM-DD）" },
  },
  required: ["name", "brand", "usage", "expiryDate"]
};

export default async function handler(req: any, res: any) {
  // CORS 跨域配置
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 环境变量检查 - 支持多种命名方式
  const deepseekKey = process.env.DEEPSEEK_API_KEY || 
                      process.env.DEEPSEEK_API || 
                      process.env['deepseek-api'] ||
                      process.env.API_KEY;
  
  // 可选的模型名称配置，默认为 deepseek-chat
  const modelName = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  
  if (!deepseekKey) {
    console.error("Vercel Environment Check Failed: DeepSeek API Key is missing.");
    return res.status(500).json({ 
      error: '后端 API Key 未配置', 
      debug: '请执行以下操作：1. 在 Vercel Settings -> Environment Variables 添加名为 DEEPSEEK_API_KEY 或 deepseek-api 的变量。 2. 勾选 Production 选项。 3. 在 Deployments 页面点击 Redeploy 重新构建。' 
    });
  }

  let { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: '缺少图片数据' });
  }

  // 清洗 Base64 数据
  const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;

  try {
    // 使用 DeepSeek API 进行图片识别
    // DeepSeek 使用 OpenAI 兼容格式，支持 vision 模型
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model: modelName, // 默认 'deepseek-chat'，可通过 DEEPSEEK_MODEL 环境变量自定义
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`
                }
              },
              {
                type: 'text',
                text: `请作为专业的药师识别该药品包装图片。识别内容包含：药品通用名、品牌、成分、规格、主治功能、用法用量。如果是处方药或包装信息模糊，请根据该药名的临床常识补全。日期格式必须为 YYYY-MM-DD。

请严格按照以下 JSON 格式返回，不要包含任何其他文字或说明：
${JSON.stringify(MEDICINE_SCHEMA_JSON, null, 2)}

返回示例：
{
  "name": "阿莫西林胶囊",
  "brand": "XX制药",
  "ingredients": "阿莫西林",
  "specs": "0.25g*24粒",
  "indications": "用于敏感菌所致的各种感染",
  "usage": "口服，一次0.5g，一日3次",
  "expiryDate": "2025-12-31"
}`
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("DeepSeek API Error:", response.status, errorData);
      
      // 尝试解析错误信息
      let errorMessage = `DeepSeek API 请求失败 (${response.status})`;
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.error?.message || errorJson.error || errorMessage;
      } catch (e) {
        errorMessage = errorData || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("AI 未能返回有效内容");
    }

    // 尝试解析 JSON（可能包含 markdown 代码块）
    let jsonText = content.trim();
    
    // 移除可能的 markdown 代码块标记
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    // 如果内容以 { 开头，尝试提取 JSON
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const result = JSON.parse(jsonText);
    
    // 验证必需字段
    if (!result.name || !result.brand || !result.usage || !result.expiryDate) {
      throw new Error("AI 返回的数据不完整，缺少必需字段");
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("DeepSeek Execution Error:", error.message);
    console.error("Error details:", error);
    
    return res.status(500).json({ 
      error: 'AI 识别服务暂时不可用', 
      details: error.message || '未知错误',
      hint: '请检查：1. DeepSeek API Key 是否正确 2. 网络连接是否正常 3. 图片格式是否正确'
    });
  }
}