export interface AppConfig {
  baseUrl: string;
  apiKey: string;
}

export interface VeoTask {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  model: string;
  prompt: string;
  enhancedPrompt?: string;
  videoUrl?: string;
  createdAt: number;
  updatedAt: number;
  selected?: boolean;
}

export interface GenerateResponse {
  id: string;
  status: string;
  status_update_time: number;
  enhanced_prompt?: string;
}

export interface TaskStatusResponse {
  code: string;
  message: string;
  data: {
    task_id?: string;
    action?: string;
    status: string; // "SUCCESS", "FAILURE", "IN_PROGRESS"
    fail_reason?: string;
    progress?: string;
    data?: {
      id?: string;
      status?: string;
      video_url?: string;
      error?: string;
      [key: string]: any;
    };
  };
}

// User specified models could be passed as strings, but we can keep constants for the UI
export const MODELS = [
  { id: 'veo3.1', name: 'veo3.1' },
  { id: 'veo3.1-pro', name: 'veo3.1-pro' },
  { id: 'veo3.1-components', name: 'veo3.1-components' },
  { id: 'veo2', name: 'veo2' },
  { id: 'veo2-fast', name: 'veo2-fast' },
  { id: 'veo2-fast-components', name: 'veo2-fast-components' },
  { id: 'veo2-fast-frames', name: 'veo2-fast-frames' },
  { id: 'veo2-pro', name: 'veo2-pro' },
  { id: 'veo3', name: 'veo3' },
  { id: 'veo3-fast', name: 'veo3-fast' },
  { id: 'veo3-fast-frames', name: 'veo3-fast-frames' },
  { id: 'veo3-frames', name: 'veo3-frames' },
  { id: 'veo3-pro', name: 'veo3-pro' },
  { id: 'veo3-pro-frames', name: 'veo3-pro-frames' }
];