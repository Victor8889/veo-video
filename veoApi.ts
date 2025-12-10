import { GenerateResponse, TaskStatusResponse } from '../types';

export const generateVideo = async (
  baseUrl: string,
  apiKey: string,
  prompt: string,
  model: string,
  images: string[] = [],
  enhancePrompt: boolean = true
): Promise<GenerateResponse> => {
  
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${cleanBaseUrl}/veo/v1/generate`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const body: any = {
    prompt,
    model,
    enhance_prompt: enhancePrompt
  };

  if (images.length > 0) {
    body.images = images;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data;
};

export const checkTaskStatus = async (
  baseUrl: string,
  apiKey: string,
  taskId: string
): Promise<TaskStatusResponse> => {
  
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${cleanBaseUrl}/veo/v1/feed/${taskId}`;

  const headers: HeadersInit = {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
     const errorText = await response.text();
     throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data;
};