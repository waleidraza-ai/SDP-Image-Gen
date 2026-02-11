export interface GeneratedImage {
  id: string;
  url: string; // Base64 or remote URL
  prompt: string;
  model: string;
  timestamp: number;
  aspectRatio: string;
}

export enum ModelId {
  GEMINI_2_FLASH = 'gemini-2.5-flash-image',
  GEMINI_3_PRO_IMAGE = 'gemini-3-pro-image-preview',
  IMAGEN_3 = 'imagen-3.0-generate-002',
  IMAGEN_3_FAST = 'imagen-3.0-generate-001',
}

export interface GenerationSettings {
  prompt: string;
  negativePrompt: string;
  model: ModelId;
  aspectRatio: string;
  imageCount: number;
  seed?: number;
  guidanceScale: number;
}

export interface AspectRatioOption {
  id: string;
  label: string;
  value: string; // For API config if needed, or internal logic
  width: number; // Relative width for UI representation
  height: number; // Relative height for UI representation
}

export interface ModelOption {
  id: ModelId;
  name: string;
  badge: string;
  badgeColor: string;
}