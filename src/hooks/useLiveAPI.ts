import { useState, useCallback, useRef, useEffect } from 'react';
import { Modality } from "@google/genai";
import { ai } from '../lib/gemini';

export type LiveState = 'idle' | 'connecting' | 'connected' | 'error';

export interface RealtimeFeedback {
  type: 'pace' | 'pronunciation' | 'grammar' | 'general';
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: number;
}

export function useLiveAPI() {
  const [state, setState] = useState<LiveState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{ text: string, type: 'user' | 'model' }[]>([]);
  const [realtimeFeedback, setRealtimeFeedback] = useState<RealtimeFeedback[]>([]);
  const [wpm, setWpm] = useState<number>(0);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const systemInstruction = `You are EnglishBuddy, a friendly and highly skilled English Language Specialist AI Voice Agent. Your goal is to help users improve their English speaking and communication skills through natural conversation.
Personality: Encouraging, patient, professional yet conversational. Use a clear and neutral English accent. 
Support both English and Bengali (for explanations and UI instructions).

Real-time Feedback Mandate:
- When you detect a mispronounced word, use the phrase "[PRONUNCIATION]" followed by the correction.
- When you detect a grammar error, use "[GRAMMAR]" followed by the correction.
- When you detect the user is speaking too fast or slow, use "[PACE]" followed by a short encouraging tip.
- Keep these interjections VERY BRIEF so you don't stall the conversation.

Core Functions:
1. Conversation Partner: Engage the user in interesting topics (hobbies, tech, daily life) to encourage them to speak.
2. Real-time Correction: If the user makes a grammatical mistake, pronunciation error, or uses the wrong word, gently correct them after they finish their sentence. Explain the correction in Bengali if necessary.
3. Pronunciation Coach: Identify specific mispronounced words and offer simple phonetic guidance (e.g., "instead of 'aks', it's 'ask', with the 's' sound before the 'k'").
4. Pace & Rhythm: Monitor the user's speaking speed. If they are speaking too fast (blending words together) or too slow (with unnatural pauses), provide gentle feedback to help them achieve a more natural English flow.
5. Vocabulary Booster: Suggest better or more advanced synonyms for simple words used by the user.
6. Language Support: If the user gets stuck or asks a question in Bengali, respond in English but provide a brief Bengali translation/explanation to ensure they understand.
7. Proactive Engagement: If the user stops speaking or the conversation stalls, suggest a new topic or ask an open-ended question from various categories like Technology, Hobbies, Career, or Hypotheticals to keep the flow alive.

Interaction Guidelines:
- Keep responses concise and optimized for a voice-first experience. 
- Avoid long paragraphs; use short, punchy sentences.
- When correcting pronunciation, use phonetic approximations that are easy to understand.
- Format for corrections: "You said [incorrect], but it's better to say [correct] because..." or "For the word [word], try to say it like [phonetic approximation]..."
- When giving pace feedback, be very encouraging, e.g., "Take a breath, you're doing great! Try to slow down just a bit for the longer words."
- Never mock mistakes. Always motivate the user to keep speaking.`;

  const audioDestinationRef = useRef<AudioNode | null>(null);
  const sessionStartRef = useRef<number>(0);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addFeedback = useCallback((feedback: Omit<RealtimeFeedback, 'timestamp'>) => {
    const newFeedback = { ...feedback, timestamp: Date.now() };
    setRealtimeFeedback(prev => [newFeedback, ...prev].slice(0, 5));
    
    // Clear old feedback after some time
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setRealtimeFeedback([]);
    }, 8000);
  }, []);

  const playPCMChunk = useCallback((base64Data: string) => {
    if (!audioContextRef.current || !audioDestinationRef.current) return;
    
    const binary = atob(base64Data);
    const length = binary.length / 2;
    const pcmData = new Int16Array(length);
    
    for (let i = 0; i < length; i++) {
        pcmData[i] = (binary.charCodeAt(i * 2) | (binary.charCodeAt(i * 2 + 1) << 8));
    }
    
    const float32Data = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        float32Data[i] = pcmData[i] / 32768.0;
    }
    
    const buffer = audioContextRef.current.createBuffer(1, length, 24000);
    buffer.getChannelData(0).set(float32Data);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioDestinationRef.current);
    
    const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
  }, []);

  const connect = useCallback(async () => {
    try {
      setState('connecting');
      setError(null);

      // 1. Setup Audio Context - Force 16kHz for input
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      // Add a compressor to the destination to make the voice sound more polished and consistent
      const compressor = audioContextRef.current.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, audioContextRef.current.currentTime);
      compressor.knee.setValueAtTime(40, audioContextRef.current.currentTime);
      compressor.ratio.setValueAtTime(12, audioContextRef.current.currentTime);
      compressor.attack.setValueAtTime(0, audioContextRef.current.currentTime);
      compressor.release.setValueAtTime(0.25, audioContextRef.current.currentTime);
      compressor.connect(audioContextRef.current.destination);

      audioDestinationRef.current = compressor;
      
      // 2. Setup Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      // ScriptProcessor is deprecated but widely supported for this use case
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      // 3. Connect to Live API
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction: systemInstruction + "\n\nSpeak naturally with varying intonation. Use conversational fillers when appropriate to sound more human and encouraging. Your voice should sound lively and energetic.",
          inputAudioTranscription: {}, 
        },
        callbacks: {
          onopen: () => {
            setState('connected');
            sessionStartRef.current = Date.now();
            console.log('Live API session opened');
          },
          onmessage: (message: any) => {
            console.log('Live API message received:', message);
            
            // Handle audio output - iterate to find inlineData
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  playPCMChunk(part.inlineData.data);
                }
              }
            }

            // Handle user transcriptions
            const userTranscript = message.serverContent?.userContent?.parts?.map((p: any) => p.text).filter(Boolean).join(' ');
            if (userTranscript) {
              setTranscript(prev => [...prev, { text: userTranscript, type: 'user' }]);
              
              // Analyze Pace (WPM)
              const words = userTranscript.split(/\s+/).filter(Boolean).length;
              const now = Date.now();
              const durationSeconds = (now - Math.max(sessionStartRef.current, nextStartTimeRef.current)) / 1000;
              
              if (durationSeconds > 1 && words > 1) {
                const calculatedWpm = Math.round((words / durationSeconds) * 60);
                setWpm(calculatedWpm);
                
                if (calculatedWpm > 160) {
                  addFeedback({ type: 'pace', message: 'Speaking Very Fast', severity: 'error' });
                } else if (calculatedWpm > 130) {
                  addFeedback({ type: 'pace', message: 'Speaking Fast', severity: 'warning' });
                } else if (calculatedWpm < 60 && words > 5) {
                  addFeedback({ type: 'pace', message: 'Speaking Slow', severity: 'info' });
                }
              }
            }

            // Handle model transcriptions and detect feedback
            const modelTranscript = message.serverContent?.modelTurn?.parts?.map((p: any) => p.text).filter(Boolean).join(' ');
            if (modelTranscript) {
              setTranscript(prev => [...prev, { text: modelTranscript, type: 'model' }]);
              
              // Detect tagged feedback
              if (modelTranscript.includes("[PRONUNCIATION]")) {
                addFeedback({ type: 'pronunciation', message: 'Pronunciation Tip', severity: 'info' });
              } else if (modelTranscript.includes("[GRAMMAR]")) {
                addFeedback({ type: 'grammar', message: 'Grammar Correction', severity: 'warning' });
              } else if (modelTranscript.includes("[PACE]")) {
                addFeedback({ type: 'pace', message: 'Pace Feedback', severity: 'info' });
              } else {
                // Fallback to simple heuristics
                const lowerTranscript = modelTranscript.toLowerCase();
                if (lowerTranscript.includes("say it like") || lowerTranscript.includes("instead of") || lowerTranscript.includes("pronounce")) {
                  addFeedback({ type: 'pronunciation', message: 'Pronunciation Tip', severity: 'info' });
                } else if (lowerTranscript.includes("better to say") || lowerTranscript.includes("grammar") || lowerTranscript.includes("correction")) {
                  addFeedback({ type: 'grammar', message: 'Grammar Correction', severity: 'warning' });
                }
              }
            }

            // Interruptions
            if (message.serverContent?.interrupted) {
                nextStartTimeRef.current = 0;
            }
          },
          onerror: (err) => {
            console.error('Live API Error:', err);
            setError('Connection error occurred.');
            setState('error');
          },
          onclose: () => {
            setState('idle');
          }
        },
      });

      sessionRef.current = session;

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        }
        
        const buffer = pcmData.buffer;
        const uint8Array = new Uint8Array(buffer);
        let binary = '';
        const len = uint8Array.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64Data = btoa(binary);
        
        try {
          if (sessionRef.current) {
            sessionRef.current.sendRealtimeInput({
              audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
            });
          }
        } catch (err) {
          console.error("Error sending realtime input:", err);
        }
      };

    } catch (err: any) {
      console.error('Failed to connect:', err);
      setError(err.message || 'Failed to initialize microphone or connection.');
      setState('error');
    }
  }, [systemInstruction]);


  const disconnect = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    
    processorRef.current?.disconnect();
    processorRef.current = null;
    
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    
    audioContextRef.current?.close();
    audioContextRef.current = null;
    
    nextStartTimeRef.current = 0;
    sessionStartRef.current = 0;
    setState('idle');
    setTranscript([]);
    setRealtimeFeedback([]);
    setWpm(0);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
  }, []);

  useEffect(() => {
      return () => {
          disconnect();
      };
  }, [disconnect]);

  return { state, error, transcript, realtimeFeedback, wpm, connect, disconnect };
}
