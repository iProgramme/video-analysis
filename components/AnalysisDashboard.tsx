import React from 'react';
import { AnalysisResult } from '../types';
import { CheckCircle2, Lightbulb, Hash, Activity } from 'lucide-react';

interface AnalysisDashboardProps {
  result: AnalysisResult | null;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ result }) => {
  if (!result) return null;

  const sentimentColor = 
    result.sentiment === 'Positive' ? 'text-green-400 bg-green-400/10' :
    result.sentiment === 'Negative' ? 'text-red-400 bg-red-400/10' :
    result.sentiment === 'Mixed' ? 'text-yellow-400 bg-yellow-400/10' :
    'text-blue-400 bg-blue-400/10';

  const sentimentLabel = {
    'Positive': '正面',
    'Negative': '负面',
    'Mixed': '混合',
    'Neutral': '中性'
  }[result.sentiment] || result.sentiment;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sentiment Card */}
        <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-5 h-5 text-purple-400" />
            <h3 className="font-medium text-slate-200">情感倾向</h3>
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${sentimentColor}`}>
            {sentimentLabel}
          </div>
        </div>

        {/* Topics Card */}
        <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Hash className="w-5 h-5 text-pink-400" />
            <h3 className="font-medium text-slate-200">关键主题</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.topics.map((topic, i) => (
              <span key={i} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-md border border-slate-600">
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
        <h3 className="text-xl font-semibold text-slate-100 mb-4">视频摘要</h3>
        <p className="text-slate-300 leading-relaxed text-justify">
          {result.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Takeaways */}
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl h-full">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-semibold text-slate-200">核心要点</h3>
          </div>
          <ul className="space-y-3">
            {result.keyTakeaways.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-slate-300 items-start">
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-emerald-500/50" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Suggestions */}
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl h-full">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-amber-400" />
            <h3 className="text-lg font-semibold text-slate-200">建议</h3>
          </div>
          <ul className="space-y-3">
            {result.suggestions.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-slate-300 items-start">
                <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-amber-500/50" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};