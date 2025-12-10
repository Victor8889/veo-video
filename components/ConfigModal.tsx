import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { X, Settings, RotateCcw, Check } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [formData, setFormData] = useState<AppConfig>(config);

  useEffect(() => {
    setFormData(config);
  }, [config, isOpen]);

  const handleReset = () => {
    setFormData({ baseUrl: '', apiKey: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-all duration-300 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
               <Settings size={18} />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white font-display">系统配置</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">服务地址 (Base URL)</label>
            <input
              type="text"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="https://api.example.com"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">访问密钥 (Key)</label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
            />
          </div>
        </div>

        <div className="bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/50">
          <div className="px-6 py-5 flex gap-3">
            <button 
              onClick={handleReset}
              className="flex-1 px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all"
            >
              <RotateCcw size={16} />
              重置
            </button>
            <button 
              onClick={() => {
                onSave(formData);
                onClose();
              }}
              className="flex-[2] px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-900/20"
            >
              <Check size={16} />
              确定
            </button>
          </div>
          
          <div className="px-6 pb-4 text-center -mt-1">
             <a 
               href="https://api.cphone.vip" 
               target="_blank" 
               rel="noopener noreferrer" 
               className="text-[10px] text-slate-400 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-mono opacity-80 hover:opacity-100"
             >
                MIT License • api.cphone.vip
             </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;