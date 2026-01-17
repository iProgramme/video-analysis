import React, { useState, useRef, useEffect } from 'react';
import { VideoUploader } from './components/VideoUploader';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { ChatInterface } from './components/ChatInterface';
import { extractFramesFromVideo } from './services/videoUtils';
import { analyzeVideoContent, createVideoChat } from './services/geminiService';
import { AppStatus, AnalysisResult, VideoFrame } from './types';
import { BrainCircuit, Play, BarChart2, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { Chat } from '@google/genai';

function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [frames, setFrames] = useState<VideoFrame[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clean up object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleFileSelect = async (file: File) => {
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setStatus(AppStatus.IDLE);
    setAnalysisResult(null);
    setChatSession(null);
    setFrames([]);
    setErrorMessage(null);
  };

  const startAnalysis = async () => {
    if (!videoFile) return;

    try {
      setErrorMessage(null);
      
      // Step 1: Extract Frames
      setStatus(AppStatus.PROCESSING_VIDEO);
      setProgress(0);
      
      const extractedFrames = await extractFramesFromVideo(videoFile, 20, (p) => {
        setProgress(p);
      });
      setFrames(extractedFrames);

      // Step 2: Analyze with Gemini
      setStatus(AppStatus.ANALYZING);
      const result = await analyzeVideoContent(extractedFrames);
      setAnalysisResult(result);

      // Step 3: Initialize Chat
      const chat = createVideoChat(extractedFrames);
      setChatSession(chat);

      setStatus(AppStatus.COMPLETE);
    } catch (error: any) {
      console.error(error);
      setStatus(AppStatus.ERROR);
      setErrorMessage(error.message || "分析过程中发生了错误。");
    }
  };

  const isBusy = status === AppStatus.PROCESSING_VIDEO || status === AppStatus.ANALYZING;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              VideoInsight AI
            </span>
          </div>
          <div className="text-sm text-slate-500 font-mono">
            由 Gemini 3 Pro 驱动
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input & Player */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/50 rounded-2xl p-1 border border-slate-800">
              {videoUrl ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video group">
                  <video 
                    src={videoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                  <button 
                    onClick={() => {
                        setVideoFile(null);
                        setVideoUrl(null);
                        setAnalysisResult(null);
                        setStatus(AppStatus.IDLE);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all text-xs"
                  >
                    更换视频
                  </button>
                </div>
              ) : (
                <VideoUploader onFileSelect={handleFileSelect} disabled={isBusy} />
              )}
            </div>

            {/* Controls / Status */}
            {videoFile && (
              <div className="space-y-4">
                {status === AppStatus.IDLE && (
                   <button
                    onClick={startAnalysis}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                   >
                     <Sparkles className="w-5 h-5" />
                     分析视频内容
                   </button>
                )}

                {isBusy && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                    <div>
                      <h3 className="font-medium text-slate-200">
                        {status === AppStatus.PROCESSING_VIDEO ? '正在提取视觉数据...' : '正在咨询 Gemini AI...'}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {status === AppStatus.PROCESSING_VIDEO ? `已完成 ${progress}%` : '正在生成见解和摘要'}
                      </p>
                    </div>
                    {status === AppStatus.PROCESSING_VIDEO && (
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {status === AppStatus.ERROR && (
                   <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center">
                     {errorMessage || "发生了错误。"}
                     <button onClick={startAnalysis} className="block mx-auto mt-2 underline">重试</button>
                   </div>
                )}

                {status === AppStatus.COMPLETE && (
                   <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400">
                     <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                       <Sparkles size={16} />
                     </div>
                     <div className="text-sm">
                       <p className="font-semibold">分析完成</p>
                       <p className="opacity-80">请查看右侧的详细报告。</p>
                     </div>
                   </div>
                )}
              </div>
            )}
            
            {/* Tech Specs (Decoration) */}
            {frames.length > 0 && (
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                 <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                   <span className="block mb-1 opacity-70 uppercase tracking-wider">已分析帧数</span>
                   <span className="text-lg font-mono text-slate-300">{frames.length}</span>
                 </div>
                 <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                   <span className="block mb-1 opacity-70 uppercase tracking-wider">模型</span>
                   <span className="text-lg font-mono text-slate-300">Gemini 3 Pro</span>
                 </div>
              </div>
            )}
          </div>

          {/* Right Column: Results & Chat */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-h-[600px]">
              {/* Tabs */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'analysis' 
                      ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-400' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <BarChart2 size={16} />
                  分析报告
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'chat' 
                      ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-400' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <MessageSquare size={16} />
                  智能问答
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeTab === 'analysis' ? (
                  analysisResult ? (
                    <AnalysisDashboard result={analysisResult} />
                  ) : (
                    <div className="h-96 flex flex-col items-center justify-center text-slate-600 space-y-4">
                      <BarChart2 className="w-16 h-16 opacity-20" />
                      <p>上传并分析视频以查看见解。</p>
                    </div>
                  )
                ) : (
                  <ChatInterface 
                    chatSession={chatSession} 
                    isEnabled={status === AppStatus.COMPLETE} 
                  />
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;