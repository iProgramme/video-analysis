import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AnalysisResult, VideoFrame } from '../types';

// Initialize the client with dynamic API Key and Custom Base URL
// We allow the user to provide an API key, falling back to env var.
const getAI = (apiKey?: string) => {
  const finalKey = apiKey || process.env.API_KEY;
  if (!finalKey) {
    throw new Error("API Key is missing. Please provide it in the settings.");
  }
  
  return new GoogleGenAI({ 
    apiKey: finalKey,
    // @ts-ignore: Applying user-requested custom configuration for proxy/base URL
    httpOptions: { baseUrl: 'https://api.vectorengine.ai' }
  });
};

const MODEL_NAME = 'gemini-3-pro-preview';

export const analyzeVideoContent = async (frames: VideoFrame[], apiKey?: string): Promise<AnalysisResult> => {
  const ai = getAI(apiKey);

  // Construct parts: prompt + images
  const parts = [
    { text: "请严格分析提供的视频帧。提供详细的视频摘要，基于内容的行动建议，识别情感倾向，列出关键主题，并提供3个用户可能会问的关于该视频的问题。请务必使用中文（简体）输出纯 JSON 格式。" },
    ...frames.map(f => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: f.dataUrl
      }
    }))
  ];

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      role: 'user',
      parts: parts
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "视频内容的详细摘要（中文）。" },
          keyTakeaways: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3-5 个核心要点（中文）。"
          },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "基于视频背景的可行建议或想法（中文）。"
          },
          sentiment: {
            type: Type.STRING,
            enum: ['Positive', 'Neutral', 'Negative', 'Mixed'],
            description: "视频的整体情绪或情感倾向 (Retain English enum values for code logic)."
          },
          topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "与视频相关的关键主题或标签（中文）。"
          },
          suggestedQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3个基于视频内容的用户可能感兴趣的后续问题（中文）。"
          }
        },
        required: ["summary", "keyTakeaways", "suggestions", "sentiment", "topics", "suggestedQuestions"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as AnalysisResult;
};

export const createVideoChat = (frames: VideoFrame[], apiKey?: string): Chat => {
  const ai = getAI(apiKey);
  
  const history = [
    {
      role: 'user',
      parts: [
        { text: "这是我正在分析的视频帧，请以此作为我们对话的背景。" },
        ...frames.map(f => ({
          inlineData: {
            mimeType: 'image/jpeg',
            data: f.dataUrl
          }
        }))
      ]
    },
    {
      role: 'model',
      parts: [{ text: "我已经分析了视频帧。你想了解关于这个视频的什么信息？" }]
    }
  ];

  return ai.chats.create({
    model: MODEL_NAME,
    history: history,
    config: {
      // Instruct the model to append suggested questions in a machine-parseable format
      systemInstruction: "你是一个乐于助人的视频分析助手。请根据提供的视频帧回答问题。请务必使用中文（简体）回答。每次回答结束时，你**必须**基于当前对话上下文，提供3个用户可能感兴趣的追问问题。这些问题必须严格按照此格式放在回答的最后：<<问题1|问题2|问题3>>"
    }
  });
};