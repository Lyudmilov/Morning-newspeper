// Direct Gemini TTS Client-side Fallback (for static Netlify / GitHub Pages deployments)
// Ensures the female Aoede voice is generated even if backend Express server is absent

export async function generateClientGeminiTTS(
  title: string,
  text: string
): Promise<{ audioBase64: string; mimeType: string } | null> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const textToSpeak = text?.length > 1000 ? text.slice(0, 1000) + '...' : text || title;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${title ? title + '. ' : ''}${textToSpeak}`,
              speechMetadata: {
                style: 'Warm, pleasant, soft, friendly, and gentle conversational tone in Bulgarian with soothing natural cadence',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

    if (base64Audio) {
      return { audioBase64: base64Audio, mimeType };
    }
  } catch (e) {
    console.warn('Direct client-side Gemini TTS fallback error:', e);
  }
  return null;
}
