import React, { useCallback } from 'react';
import { Upload, FileVideo } from 'lucide-react';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onFileSelect, disabled }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('video/')) {
          onFileSelect(file);
        } else {
          alert('请上传有效的视频文件。');
        }
      }
    },
    [onFileSelect, disabled]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`relative group border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
        disabled 
          ? 'border-slate-700 bg-slate-900/50 opacity-50 cursor-not-allowed' 
          : 'border-slate-600 hover:border-blue-500 bg-slate-800/30 hover:bg-slate-800/50 cursor-pointer'
      }`}
    >
      <input
        type="file"
        accept="video/*"
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        disabled={disabled}
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full bg-slate-800 group-hover:bg-blue-500/10 transition-colors ${disabled ? '' : 'group-hover:text-blue-400'}`}>
          <Upload className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-200">
            上传视频
          </h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            将视频拖放到此处，或点击浏览。
            <br />
            <span className="text-xs text-slate-500">支持 MP4, MOV, WebM 格式</span>
          </p>
        </div>
      </div>
    </div>
  );
};