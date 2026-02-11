import { AspectRatioOption, ModelId, ModelOption } from "./types";

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: '1:1', label: 'Square', value: '1:1', width: 1, height: 1 },
  { id: '16:9', label: 'Landscape', value: '16:9', width: 16, height: 9 },
  { id: '9:16', label: 'Portrait', value: '9:16', width: 9, height: 16 },
  { id: '4:3', label: 'Standard', value: '4:3', width: 4, height: 3 },
  { id: '3:4', label: 'Portrait Std', value: '3:4', width: 3, height: 4 },
];

export const MODELS: ModelOption[] = [
  { 
    id: ModelId.GEMINI_2_FLASH, 
    name: 'Gemini 2.5 Flash', 
    badge: 'Fast', 
    badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30' 
  },
  { 
    id: ModelId.GEMINI_3_PRO_IMAGE, 
    name: 'Gemini 3 Pro', 
    badge: 'Nano Banana Pro', 
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' 
  },
  { 
    id: ModelId.IMAGEN_3, 
    name: 'Imagen 3', 
    badge: 'High Quality', 
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
  },
  { 
    id: ModelId.IMAGEN_3_FAST, 
    name: 'Imagen 3 Fast', 
    badge: 'Speed', 
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
  },
];

export const SAMPLE_PROMPTS = [
  "A futuristic city built inside a giant glass bubble on Mars, neon lights, 8k resolution, cinematic lighting",
  "A cute baby dragon playing with a soap bubble, vibrant colors, pixar style, detailed scales",
  "Cyberpunk street food vendor in Tokyo, rain reflections, neon signage, detailed atmosphere",
  "An ancient library floating in the clouds, magical aura, flying books, fantasy art",
  "Portrait of a robot with human emotions, rusty metal texture, soft dramatic lighting, bokeh background",
  "A minimalistic landscape of sand dunes at sunset, long shadows, pastel colors, digital art",
  "Astronaut floating in a garden of giant glowing mushrooms, deep space background, ethereal",
  "Steampunk coffee machine with intricate gears and brass pipes, steam rising, macro photography",
  "A crystal palace reflecting in a calm lake, midnight, aurora borealis in the sky",
  "Oil painting of a cozy cottage in the woods during autumn, warm light coming from windows"
];
