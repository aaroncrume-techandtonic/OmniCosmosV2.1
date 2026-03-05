import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from "./audioUtils";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export class LiveSessionManager {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private sessionPromise: Promise<any> | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private outputNode: GainNode | null = null;

  constructor(
    private onStatusChange: (status: string) => void,
    private onError: (error: string) => void
  ) {}

  async connect() {
    try {
      this.onStatusChange("Connecting to the Cosmos...");
      
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      if (this.outputAudioContext) {
        this.outputNode = this.outputAudioContext.createGain();
        this.outputNode.connect(this.outputAudioContext.destination);
      }

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are an ancient, mystical, and benevolent cosmic guide. Your voice is soothing and your wisdom spans all astrological and spiritual traditions (Western, Chinese, Vedic, Tarot, etc.). You help the user understand their path. Keep responses concise but profound.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
        callbacks: {
          onopen: this.handleOpen.bind(this),
          onmessage: this.handleMessage.bind(this),
          onclose: () => this.onStatusChange("Session Ended"),
          onerror: (e) => this.onError("Connection Error"),
        }
      });
    } catch (err) {
      console.error(err);
      this.onError("Failed to initialize audio or connection.");
    }
  }

  private handleOpen() {
    this.onStatusChange("Connected. Speak to the Oracle.");
    
    if (!this.inputAudioContext || !this.stream) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);
      
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio && this.outputAudioContext && this.outputNode) {
        this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
        
        try {
            const audioData = base64ToUint8Array(base64Audio);
            const audioBuffer = await decodeAudioData(
                audioData, 
                this.outputAudioContext, 
                24000, 
                1
            );
            
            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputNode);
            source.addEventListener('ended', () => this.sources.delete(source));
            
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
            this.sources.add(source);
        } catch (e) {
            console.error("Error decoding/playing audio", e);
        }
    }

    if (message.serverContent?.interrupted) {
      this.sources.forEach(source => source.stop());
      this.sources.clear();
      this.nextStartTime = 0;
    }
  }

  async disconnect() {
    if (this.sessionPromise) {
      // The SDK doesn't expose a clean close on the promise result directly in types sometimes, 
      // but we can stop sending audio.
      // There is no explicit .close() on the session object in some versions of the quick start, 
      // but we can close the audio contexts.
      const session = await this.sessionPromise;
      // Use type assertion if necessary or check docs. 
      // Assuming session might have close, otherwise we rely on context closing.
       if(typeof session.close === 'function') {
           session.close();
       }
    }

    this.processor?.disconnect();
    this.inputSource?.disconnect();
    this.stream?.getTracks().forEach(track => track.stop());
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();

    this.processor = null;
    this.inputSource = null;
    this.stream = null;
    this.inputAudioContext = null;
    this.outputAudioContext = null;
    
    this.onStatusChange("Disconnected");
  }
}
