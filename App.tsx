import React, { useState, useEffect, useRef } from 'react';
import { Settings, Trash2, Wand2, Send, Layers, ImageIcon, X, Eraser, Sun, Moon } from './components/Icons';
import VideoCard from './components/VideoCard';
import ConfigModal from './components/ConfigModal';
import { VeoTask, MODELS, AppConfig } from './types';
import * as veoApi from './services/veoApi';

function App() {
  // --- State ---
  const [tasks, setTasks] = useState<VeoTask[]>(() => {
    const saved = localStorage.getItem('veo_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('veo_config');
    return saved ? JSON.parse(saved) : { baseUrl: '', apiKey: '' };
  });
  const [showConfig, setShowConfig] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
  });
  
  // Image Upload State
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use a ref to track if this is the first load of the app to trigger a full refresh
  const isFirstLoad = useRef(true);

  // --- Effects ---

  // Theme application
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('veo_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('veo_config', JSON.stringify(config));
  }, [config]);

  // Polling Logic
  useEffect(() => {
    if (!pollingActive) return;

    // Define the polling function
    const pollTasks = async () => {
       // If no config, we can't poll.
       if (!config.baseUrl) return;
       
       // On first load, check ALL tasks to refresh status/URLs.
       // On subsequent intervals, only check PENDING tasks.
       const tasksToCheck = isFirstLoad.current 
          ? tasks 
          : tasks.filter(t => t.status === 'pending');

       if (tasksToCheck.length === 0) {
          isFirstLoad.current = false;
          return;
       }
       
       const updates: Record<string, Partial<VeoTask>> = {};
       let hasUpdates = false;

       await Promise.all(tasksToCheck.map(async (task) => {
        try {
          const res = await veoApi.checkTaskStatus(config.baseUrl, config.apiKey, task.id);
          
          // Parse new API structure
          // Outer data: res.data
          // Inner data: res.data.data
          const apiData = res.data;
          const innerData = apiData?.data;
          
          let newStatus: 'pending' | 'completed' | 'failed' = 'pending';
          const apiStatus = apiData?.status; // SUCCESS, FAILURE, IN_PROGRESS, etc.

          if (apiStatus === 'SUCCESS') {
            newStatus = 'completed';
          } else if (apiStatus === 'FAILURE' || apiStatus === 'FAILED') {
            newStatus = 'failed';
          } else {
            newStatus = 'pending';
          }

          // Video URL is usually inside the inner data object for success
          const newVideoUrl = innerData?.video_url;

          // We update if the status changed OR if we found a video URL for a completed task 
          // (e.g. refreshing a signed URL on page load, or first time completion)
          if (newStatus !== task.status || (newStatus === 'completed' && newVideoUrl && newVideoUrl !== task.videoUrl)) {
             updates[task.id] = {
               status: newStatus,
               videoUrl: newVideoUrl || task.videoUrl,
               updatedAt: Date.now()
             };
             hasUpdates = true;
          }
        } catch (error) {
          console.error(`Error polling task ${task.id}:`, error);
        }
       }));

       if (hasUpdates) {
        setTasks(prev => prev.map(t => updates[t.id] ? { ...t, ...updates[t.id] } : t));
       }
       
       // After the first run, turn off the "check all" flag
       isFirstLoad.current = false;
    };

    // Execute immediately on mount/update
    pollTasks();

    // Poll every 5 seconds
    const intervalId = setInterval(pollTasks, 5000); 

    return () => clearInterval(intervalId);
  }, [tasks, pollingActive, config]);

  // --- Handlers ---
  const handleGenerate = async () => {
    if (!config.baseUrl) {
      setShowConfig(true);
      return;
    }

    if (!prompt.trim() && selectedImages.length === 0) return;

    setIsGenerating(true);
    try {
      const response = await veoApi.generateVideo(
        config.baseUrl,
        config.apiKey,
        prompt, 
        model, 
        selectedImages,
        enhancePrompt
      );
      
      const newTask: VeoTask = {
        id: response.id,
        status: 'pending',
        model: model,
        prompt: prompt || '图片转视频 (Image to Video)',
        enhancedPrompt: response.enhanced_prompt,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        selected: false
      };

      setTasks(prev => [newTask, ...prev]);
      handleClear();
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      alert(`生成失败: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchDelete = () => {
    if (window.confirm('确定删除所有选中的项目吗？')) {
      setTasks(prev => prev.filter(t => !t.selected));
    }
  };

  const toggleSelection = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string') {
            setSelectedImages(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    if (hoveredIndex === index) setHoveredIndex(null);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setPrompt('');
    setSelectedImages([]);
    setHoveredIndex(null);
  };

  const toggleTheme = () => {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const selectedCount = tasks.filter(t => t.selected).length;
  const isSendDisabled = (!prompt.trim() && selectedImages.length === 0) || isGenerating;

  return (
    <div className="relative min-h-screen flex flex-col pb-72 md:pb-60 transition-colors duration-500">
      
      {/* Background with animated gradient */}
      <div className="fixed inset-0 z-[-1] bg-slate-50 dark:bg-[#020202] transition-colors duration-500">
         {theme === 'dark' && (
             <>
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
                <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] rounded-full bg-cyan-900/10 blur-[80px] animate-float"></div>
             </>
         )}
      </div>
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-black/40 border-b border-slate-200 dark:border-white/5 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/20 transition-colors">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 opacity-90 transition-opacity"></div>
               <span className="relative text-white font-bold font-display z-10">V</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white font-display">Veo 创作工坊</h1>
          </div>

          <div className="flex items-center gap-4">
            {selectedCount > 0 && (
              <button 
                onClick={handleBatchDelete}
                className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-full hover:bg-red-200 dark:hover:bg-red-500/20 transition-all hover:scale-105"
              >
                <Trash2 size={12} />
                删除 {selectedCount}
              </button>
            )}

            <button
                onClick={toggleTheme}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-full transition-colors"
            >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Gallery Area */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1600px]">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in zoom-in duration-700">
             <div className="w-32 h-32 rounded-3xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-black border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-8 relative shadow-xl shadow-blue-500/5 dark:shadow-blue-900/20">
                <div className="absolute inset-0 bg-blue-500/5 rounded-3xl animate-pulse"></div>
                <Layers size={48} className="text-slate-400 dark:text-slate-700" />
             </div>
             <h2 className="text-4xl font-bold text-slate-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-b dark:from-white dark:to-slate-500 mb-4 font-display text-center">
                释放无限想象
             </h2>
             <p className="text-slate-500 text-center max-w-md text-sm leading-relaxed">
               配置您的服务地址和密钥，使用下方的指令中心生成电影级 AI 视频。
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
            {tasks.map(task => (
              <VideoCard 
                key={task.id} 
                task={task} 
                onSelect={toggleSelection}
                onDelete={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
              />
            ))}
          </div>
        )}
      </main>

      {/* Settings Button (Global) */}
      <button 
        onClick={() => setShowConfig(true)}
        className="fixed bottom-6 left-6 z-50 p-3.5 bg-white dark:bg-black/80 text-slate-400 hover:text-blue-600 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-full shadow-2xl backdrop-blur-xl transition-all hover:scale-110 hover:shadow-blue-500/20 group"
        title="配置系统"
      >
        <Settings size={22} className="group-hover:rotate-90 transition-transform duration-700" />
      </button>

      {/* Config Modal */}
      <ConfigModal 
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        config={config}
        onSave={(newConfig) => setConfig(newConfig)}
      />

      {/* Floating Command Center (Bottom) */}
      <div className="fixed bottom-0 left-0 w-full z-40 px-4 pb-4 bg-gradient-to-t from-white via-white/80 dark:from-black dark:via-black/80 to-transparent pointer-events-none transition-colors duration-500">
        <div className="container mx-auto max-w-4xl pointer-events-auto">
          
          <div className={`
            relative flex flex-col bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5
            ${isGenerating ? 'opacity-90 grayscale-[0.5] pointer-events-none' : 'opacity-100 hover:border-blue-400/30 dark:hover:border-white/20 hover:shadow-xl'}
          `}>
                
                {/* Top Bar: Model & Secondary Actions */}
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 dark:border-white/5">
                    {/* Model Selector */}
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                        <span className="text-blue-600 dark:text-blue-400">模型:</span>
                        <select 
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            {MODELS.map(m => (
                                <option key={m.id} value={m.id} className="bg-white dark:bg-black text-slate-800 dark:text-slate-200">
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setEnhancePrompt(!enhancePrompt)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all
                            ${enhancePrompt 
                                ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30' 
                                : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-transparent hover:bg-slate-200 dark:hover:bg-white/10'
                            }`}
                            title="自动优化提示词"
                        >
                            <Wand2 size={12} />
                            <span className="hidden sm:inline">优化提示词</span>
                        </button>
                        
                        <button
                            onClick={handleClear}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="清空"
                        >
                            <Eraser size={14} />
                        </button>
                    </div>
                </div>

                {/* Middle: Input Area */}
                <div className="relative p-2">
                    <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                        }
                    }}
                    placeholder="描述您的创意 (中文自动转英文)..."
                    className="w-full min-h-[60px] max-h-[120px] bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 text-lg px-4 py-2 outline-none resize-none font-medium leading-relaxed scrollbar-thin rounded-xl focus:bg-slate-50 dark:focus:bg-white/5 transition-colors"
                    />
                </div>

                {/* Bottom Bar: Images + Generate */}
                <div className="flex items-end justify-between px-4 pb-4 pt-1">
                    
                    {/* Left: Images & Upload Button */}
                    <div className="flex items-center flex-wrap gap-3">
                        {/* Selected Images Thumbnails with Floating Preview */}
                        {selectedImages.map((img, idx) => (
                            <div 
                                key={idx} 
                                className="relative group w-10 h-10 rounded-lg border border-slate-200 dark:border-white/10 overflow-visible bg-slate-50 dark:bg-black/50 cursor-pointer"
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                {/* Floating Hover Preview - Increased size to w-80 (320px) */}
                                {hoveredIndex === idx && (
                                    <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-80 p-1.5 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                                        <div className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-black">
                                            <img src={img} alt="preview" className="w-full h-auto object-cover" />
                                        </div>
                                        {/* Arrow */}
                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-[#1a1a1a] border-b border-r border-slate-200 dark:border-white/10 rotate-45"></div>
                                    </div>
                                )}

                                <div className="w-full h-full rounded-lg overflow-hidden relative">
                                    <img src={img} alt="upload" className="w-full h-full object-cover" />
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeImage(idx);
                                        }}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Upload Trigger */}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-10 h-10 flex items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                            title="上传参考图片"
                        >
                            <ImageIcon size={16} />
                        </button>
                    </div>

                    {/* Right: Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isSendDisabled}
                        className={`
                        flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm
                        ${isSendDisabled
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none border border-slate-200 dark:border-slate-700'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]'
                        }
                        `}
                    >
                        {isGenerating ? (
                            <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>生成中...</span>
                            </>
                        ) : (
                            <>
                            <span>生成</span>
                            <Send size={16} />
                            </>
                        )}
                    </button>
                </div>

                {/* Progress Bar (Absolute Bottom) */}
                {isGenerating && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden rounded-b-3xl">
                        <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 w-1/3 animate-[shimmer_2s_infinite_linear]"></div>
                    </div>
                )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;