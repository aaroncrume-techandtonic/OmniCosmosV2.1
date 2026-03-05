import { GoogleGenAI, Type, Modality } from "@google/genai";
import { HoroscopeReading } from "../types";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to format text for speech - centralized here for pre-generation
export const formatTextForSpeech = (data: HoroscopeReading) => {
  let text = `Greetings, stardust. Here is your unified cosmic reading. \n\n ${data.summary} \n\n`;
  
  const transitions = [
    "Turning to the stars,",
    "Through the lens of,",
    "The cards reveal,",
    "Spirit guides whisper,",
    "Wisdom from the void,"
  ];

  data.sections.forEach((section, index) => {
    const transition = transitions[index % transitions.length];
    text += `${transition} ${section.title}. ${section.content} \n\n`;
  });
  
  text += "Go forth in light.";
  return text;
};

export const generateHoroscopeText = async (
  name: string,
  birthDate: string,
  birthPlace: string,
  focus: string
): Promise<HoroscopeReading> => {
  const prompt = `
    Generate a comprehensive, gender-neutral horoscope reading for ${name}, born on ${birthDate} in ${birthPlace}.
    Focus area: ${focus}.
    Include insights from:
    1. Western Astrology (Sun, Moon, Rising if inferable, current transits)
    2. Chinese Zodiac
    3. Tarot (Simulate a 3-card spread)
    4. Native American Totem
    5. Buddhist cosmic philosophy

    IMPORTANT: Use Google Search to find current planetary positions and any significant celestial events happening right now (March 2026) to make the reading as accurate and timely as possible.

    Tone: Mystical, universal, empowering, non-binary.
    Format as JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                icon: { type: Type.STRING }
              }
            }
          },
          luckyNumbers: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          luckyColors: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  if (!response.text) throw new Error("No text generated");
  return JSON.parse(response.text) as HoroscopeReading;
};

export const generateHoroscopeImage = async (description: string, name: string, size: "1K" | "2K" | "4K" = "1K"): Promise<string> => {
  // Use a fresh instance for models requiring user API key
  const userAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
  
  const prompt = `A digital masterpiece of abstract cosmic art representing: ${description}. 
  Critically Important: Integrate the text "${name}" into the artwork. The name should be stylized and blended perfectly into the image, appearing as if formed by constellations, glowing nebula gas, or woven into sacred geometry. It should be legible but feel like a natural part of the cosmic environment.
  Style: Sacred geometry, nebula clouds, bioluminescent structures. 
  Aesthetics: Androgynous, universal, non-binary, avoiding gendered human figures. 
  Colors: Deep indigo, cyan, silver, iridescent. High quality, intricate details.`;
  
  const response = await userAi.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        imageSize: size,
        aspectRatio: "1:1"
      }
    }
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData && part.inlineData.data) {
      return part.inlineData.data;
    }
  }
  throw new Error("No image generated");
};

export const editHoroscopeImage = async (base64Image: string, instruction: string): Promise<string> => {
  const userAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
  
  const response = await userAi.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image
          }
        },
        { text: instruction }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData && part.inlineData.data) {
      return part.inlineData.data;
    }
  }
  throw new Error("No edited image generated");
};

export const generateHoroscopeVideo = async (base64Image: string, prompt: string): Promise<string> => {
  const userAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
  
  let operation = await userAi.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Animate this cosmic artwork: ${prompt}. Subtle movement of nebula gas, twinkling stars, and flowing energy.`,
    image: {
      imageBytes: base64Image,
      mimeType: 'image/png',
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await userAi.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");

  const response = await fetch(downloadLink, {
    method: 'GET',
    headers: {
      'x-goog-api-key': process.env.API_KEY || process.env.GEMINI_API_KEY || '',
    },
  });
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const generateTTS = async (text: string): Promise<Uint8Array> => {
  // REMOVED "ethereal" to prevent echo/reverb artifacts.
  // CHANGED to "warm, grounded" to ensure audio stability.
  const styledText = `Speak in a clear, warm, and grounded gender-neutral tone. Maintain a steady, natural conversational pace. You are a cosmic guide: ${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: {
      parts: [{ text: styledText }]
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          // Zephyr is often more neutral/calm/airy than Kore (fem) or Fenrir (masc)
          prebuiltVoiceConfig: { voiceName: "Zephyr" }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};