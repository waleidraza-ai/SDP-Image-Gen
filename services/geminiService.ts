import { GoogleGenAI } from "@google/genai";
import { ModelId } from "../types";

export const generateImages = async (
  modelId: ModelId,
  prompt: string,
  aspectRatio: string,
  negativePrompt?: string,
  count: number = 1,
  seed?: number,
  guidanceScale?: number
): Promise<string[]> => {
  // Fix: Use process.env.API_KEY directly as required by guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const images: string[] = [];

    // Gemini Image Models (generateContent)
    // Includes Gemini 2.5 Flash and Gemini 3 Pro Image (Nano Banana Pro)
    if (modelId === ModelId.GEMINI_2_FLASH || modelId === ModelId.GEMINI_3_PRO_IMAGE) {
      // Gemini Image models typically generate 1 image per request via generateContent
      
      const requests = Array.from({ length: count }).map(async () => {
        const finalPrompt = negativePrompt 
          ? `${prompt}. Avoid: ${negativePrompt}` 
          : prompt;

        // Construct config object
        const config: any = {
          imageConfig: {
              aspectRatio: aspectRatio,
          }
        };

        // Add seed if provided
        if (seed !== undefined) {
          config.seed = seed;
        }

        const response = await ai.models.generateContent({
          model: modelId,
          contents: {
            parts: [{ text: finalPrompt }]
          },
          config: config
        });

        // Parse response
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
      });

      const results = await Promise.all(requests);
      results.forEach(img => { if(img) images.push(img); });

    } else {
      // Imagen Models (generateImages)
      // Append negative prompt to main prompt as a safer fallback
      const finalPrompt = negativePrompt 
          ? `${prompt}. Negative prompt: ${negativePrompt}` 
          : prompt;

      const config: any = {
        numberOfImages: count,
        aspectRatio: aspectRatio,
        outputMimeType: 'image/jpeg'
      };

      if (seed !== undefined) {
        config.seed = seed;
      }
      
      // Only apply guidance scale if provided and model is Imagen
      if (guidanceScale !== undefined) {
        config.guidanceScale = guidanceScale;
      }

      const response = await ai.models.generateImages({
        model: modelId,
        prompt: finalPrompt,
        config: config
      });

      if (response.generatedImages) {
        response.generatedImages.forEach((img: any) => {
           if (img.image && img.image.imageBytes) {
             images.push(`data:${img.image.mimeType || 'image/jpeg'};base64,${img.image.imageBytes}`);
           }
        });
      }
    }

    if (images.length === 0) {
      throw new Error("No images were returned by the model.");
    }

    return images;

  } catch (error: any) {
    console.error("Image generation failed:", error);
    
    // Improve error message for 404
    if (error.status === 404 || (error.message && error.message.includes('404'))) {
       throw new Error(`Model not found (${modelId}). Please check if your API key has access to this model.`);
    }
    
    throw error;
  }
};