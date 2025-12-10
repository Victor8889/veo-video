import React from 'react';
import { VeoTask } from '../types';
import { Loader2, AlertCircle, Play, Download, Trash2, Check, Clock, Sparkles } from 'lucide-react';

interface VideoCardProps {
  task: VeoTask;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ task, onSelect, onDelete }) => {
  const isSelected = task.selected;

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('zh-CN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div 
      onClick={() => onSelect(task.id)}
      className={`
        group relative flex flex-col rounded-xl border shadow-xl transition-all duration-300 cursor-pointer overflow-hidden
        dark:bg-[#0f0f0f] dark:border-white/5 bg-white border-slate-200
        ${isSelected 
          ? 'ring-2 ring-blue-500 shadow-blue-500/20 dark:shadow-blue-900/20 scale-[1.02]' 
          : 'hover:border-blue-400/30 dark:hover:border-white/20 hover:scale-[1.01]'
        }
      `}
    >
      {/* Frame Content - The Video/Image area */}
      <div className="relative aspect-video bg-slate-100 dark:bg-black flex items-center justify-center overflow-hidden border-b border-slate-200 dark:border-white/5">
        {task.status === 'completed' && task.videoUrl ? (
          <video 
            src={task.videoUrl} 
            controls 
            className="w-full h-full object-cover"
            preload="metadata"
            onClick={(e) => e.stopPropagation()} 
          />
        ) : task.status === 'failed' ? (
          <div className="text-center p-6 flex flex-col items-center">
             <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
             <p className="text-xs text-red-400 font-mono uppercase tracking-wider">生成失败</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 dark:bg-[#050505]">
             {/* Custom AI Loader */}
             <div className="ai-loader mb-4">
                <span></span>
                <span></span>
                <span></span>
             </div>
             <p className="text-xs text-blue-500 dark:text-blue-400 font-mono animate-pulse tracking-widest uppercase">处理中</p>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3 flex gap-2">
            <span className={`
                px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md backdrop-blur-md border shadow-sm
                ${task.status === 'completed' ? 'bg-green-100/80 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30' : ''}
                ${task.status === 'pending' ? 'bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30' : ''}
                ${task.status === 'failed' ? 'bg-red-100/80 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' : ''}
            `}>
                {task.status === 'completed' && '完成'}
                {task.status === 'pending' && '进行中'}
                {task.status === 'failed' && '失败'}
            </span>
        </div>

        {/* Selection Indicator */}
        <div className={`
            absolute top-3 right-3 w-6 h-6 rounded-full border flex items-center justify-center transition-all shadow-sm
            ${isSelected 
              ? 'bg-blue-500 border-blue-500 text-white' 
              : 'bg-white/80 dark:bg-black/50 border-slate-200 dark:border-white/20 text-transparent hover:border-blue-400'
            }
        `}>
            <Check size={14} strokeWidth={3} />
        </div>
      </div>

      {/* Frame Footer - Metadata like a gallery label */}
      <div className="p-4 flex-1 flex flex-col justify-between bg-white dark:bg-[#141414]">
        <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {formatDate(task.createdAt)}
                </span>
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] uppercase">
                    {task.model.replace('veo-3.1-', '').replace('-preview', '')}
                </span>
            </div>

            <div className="group/text relative">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2 font-medium">
                    {task.prompt}
                </p>
                {task.enhancedPrompt && (
                     <div className="mt-2 pl-2 border-l-2 border-purple-500/50">
                        <p className="text-xs text-purple-600 dark:text-purple-400 line-clamp-1 italic flex items-center gap-1">
                            <Sparkles size={10} />
                            {task.enhancedPrompt}
                        </p>
                     </div>
                )}
            </div>
        </div>

        {/* Actions - Appear on hover */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
             {task.status === 'completed' && task.videoUrl && (
                <a 
                    href={task.videoUrl}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
                    title="下载视频"
                >
                    <Download size={16} />
                </a>
             )}
             <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                }}
                className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                title="删除"
             >
                <Trash2 size={16} />
             </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;