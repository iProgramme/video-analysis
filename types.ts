export interface VideoFrame {
  timestamp: number;
  dataUrl: string; // Base64
}

export interface AnalysisResult {
  summary: string;
  keyTakeaways: string[];
  suggestions: string[];
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Mixed';
  topics: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING_VIDEO = 'PROCESSING_VIDEO', // Extracting frames
  ANALYZING = 'ANALYZING', // Calling API
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
