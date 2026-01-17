import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AnalysisResult, VideoFrame } from '../types';

// Initialize the client
// NOTE: We create a new instance in functions to ensure we pick up the latest API key if it changes, 
// though typically env var is static.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-pro-preview'; // Enhanced reasoning and multimodal capabilities

export const analyzeVideoContent = async (frames: VideoFrame[]): Promise<AnalysisResult> => {
  const ai = getAI();

  // Construct parts: prompt + images
  const parts = [
    { text: "请严格分析提供的视频帧。提供详细的视频摘要，基于内容的行动建议，识别情感倾向，并列出关键主题。请务必使用中文（简体）输出纯 JSON 格式。" },
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
          }
        },
        required: ["summary", "keyTakeaways", "suggestions", "sentiment", "topics"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as AnalysisResult;
};

export const createVideoChat = (frames: VideoFrame[]): Chat => {
  const ai = getAI();
  
  // Initialize chat with the video context in history
  // This allows the user to ask follow-up questions without re-uploading everything manually
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
      systemInstruction: "你是一个乐于助人的视频分析助手。请根据提供的视频帧回答问题。请务必使用中文（简体）回答，保持简洁和乐于助人。"
    }
  });
};