/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Mic, MicOff, AlertCircle, MessageSquare, Info, BarChart2, Share2, RotateCcw, Loader2, TrendingUp, Sparkles as SparklesIcon, Zap, Gauge } from "lucide-react";
import { useLiveAPI, RealtimeFeedback } from "./hooks/useLiveAPI";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { ProgressDashboard } from "./components/ProgressDashboard";
import { PromptLibrary } from "./components/PromptLibrary";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { analyzeSession } from "./lib/gemini";
import { saveSessionReport } from "./lib/storage";

type View = 'chat' | 'dashboard' | 'prompts';

export default function App() {
  const { state, error, transcript, realtimeFeedback, wpm, connect, disconnect } = useLiveAPI();
  const [view, setView] = useState<View>('chat');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastSessionAnalyzed, setLastSessionAnalyzed] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const handleFinishAndAnalyze = async () => {
    if (transcript.length < 2) return;
    setIsAnalyzing(true);
    try {
      const report = await analyzeSession(transcript);
      saveSessionReport({
        ...report,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      });
      setLastSessionAnalyzed(true);
      setView('dashboard');
    } catch (err) {
      console.error("Failed to analyze session:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleSession = () => {
    if (state === 'connected') {
      disconnect();
      setLastSessionAnalyzed(false);
    } else {
      connect();
      setLastSessionAnalyzed(false);
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    // If not connected, connect first
    if (state !== 'connected') {
      connect();
    }
    setView('chat');
    // Note: In a real implementation we might send this as text input to the model
    // But since this is a voice-first agent, the user can just read it out
    // or we can just switch them back to the chat view to start talking about it.
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-slate-950 text-slate-100 overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between mb-12">
        <div className="flex flex-col">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-1"
          >
            English<span className="text-indigo-400 font-bold">Buddy</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-[10px] md:text-xs font-medium uppercase tracking-[0.2em]"
          >
            English Specialist AI Voice Agent • Made By Ayan Saha
          </motion.p>
        </div>

        <nav className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setView('chat')}
            className={`px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
              view === 'chat' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Practice
          </button>
          <button
            onClick={() => setView('prompts')}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
              view === 'prompts' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <SparklesIcon size={14} /> Prompts
          </button>
          <button
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
              view === 'dashboard' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 size={14} /> Progress
          </button>
        </nav>
      </header>

      <main className="relative z-10 w-full max-w-4xl">
        <AnimatePresence mode="wait">
          {view === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col md:grid md:grid-cols-2 gap-8 items-center"
            >
              {/* Voice Control Section */}
              <section className="relative flex flex-col items-center justify-center p-8 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl w-full h-[500px]">
                {/* Real-time Alerts Overlay */}
                <div className="absolute top-6 left-6 right-6 flex flex-col gap-2 pointer-events-none z-20">
                  <AnimatePresence>
                    {realtimeFeedback.map((feedback) => (
                      <motion.div
                        key={feedback.timestamp}
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`flex items-center gap-3 p-3 rounded-2xl border backdrop-blur-md shadow-xl ${
                          feedback.severity === 'error' ? 'bg-red-500/20 border-red-500/30' :
                          feedback.severity === 'warning' ? 'bg-orange-500/20 border-orange-500/30' :
                          'bg-indigo-500/20 border-indigo-500/30'
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${
                          feedback.severity === 'error' ? 'bg-red-500/40 text-red-200' :
                          feedback.severity === 'warning' ? 'bg-orange-500/40 text-orange-200' :
                          'bg-indigo-500/40 text-indigo-100'
                        }`}>
                          <Zap size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                            {feedback.type === 'pace' ? 'Speed Alert' : feedback.type.toUpperCase()}
                          </span>
                          <p className="text-xs font-medium text-white">{feedback.message}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <AudioVisualizer active={state === 'connected'} />
                
                <div className="mt-12 w-full flex flex-col items-center">
                  {/* Pace Indicator */}
                  {state === 'connected' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-8 flex items-center gap-6"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 text-indigo-400 mb-1">
                          <Gauge size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Speech Rate</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-2xl font-bold tracking-tighter ${
                            wpm > 160 ? 'text-red-400' : wpm > 130 ? 'text-orange-400' : 'text-green-400'
                          }`}>
                            {wpm || '--'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">WPM</span>
                        </div>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Pace</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest ${
                          wpm > 160 ? 'bg-red-500/10 text-red-400' : 
                          wpm > 130 ? 'bg-orange-500/10 text-orange-400' : 
                          wpm > 60 ? 'bg-green-500/10 text-green-400' : 
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {wpm > 160 ? 'Too Fast' : wpm > 130 ? 'Fast' : wpm > 60 ? 'Steady' : 'Waiting...'}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <div className="mb-6 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${state === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                      {state === 'idle' && 'Ready to connect'}
                      {state === 'connecting' && 'Establishing link...'}
                      {state === 'connected' && 'Live Communication Active'}
                      {state === 'error' && 'System Error'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleToggleSession}
                      disabled={state === 'connecting' || isAnalyzing}
                      className={`group relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${
                        state === 'connected' 
                        ? 'bg-red-500/10 border-2 border-red-500/50 text-red-400 hover:bg-red-500/20 shadow-lg shadow-red-500/10' 
                        : 'bg-indigo-500 border-2 border-indigo-400 text-white hover:bg-indigo-600 hover:scale-105 shadow-lg shadow-indigo-500/30'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {state === 'connected' ? <MicOff size={32} /> : <Mic size={32} />}
                      <span className="absolute -bottom-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        {state === 'connected' ? 'Disconnect' : 'Start Session'}
                      </span>
                    </button>

                    {state === 'idle' && transcript.length > 2 && !lastSessionAnalyzed && (
                      <button
                        onClick={handleFinishAndAnalyze}
                        disabled={isAnalyzing}
                        className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/50 text-green-400 hover:bg-green-500/20 transition-all duration-300"
                      >
                        {isAnalyzing ? <Loader2 size={24} className="animate-spin" /> : <TrendingUp size={24} />}
                        <span className="absolute -bottom-10 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          {isAnalyzing ? 'Analyzing...' : 'View Report'}
                        </span>
                      </button>
                    )}
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-8 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs"
                    >
                      <AlertCircle size={14} />
                      {error}
                    </motion.div>
                  )}
                </div>
              </section>

              {/* Console / Transcript Section */}
              <section className="w-full flex flex-col h-[500px] bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-6 border-bottom border-white/5 bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-400" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">Live Transcript</h2>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {transcript.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                          <Info size={24} />
                        </div>
                        <p className="text-sm font-medium">Session logs will appear here.</p>
                        <p className="text-[10px] uppercase tracking-widest mt-2">Start conversation to begin</p>
                      </div>
                    ) : (
                      transcript.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: item.type === 'user' ? -10 : 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex flex-col ${item.type === 'user' ? 'items-start' : 'items-end'}`}
                        >
                          <span className={`text-[10px] uppercase tracking-widest font-bold mb-1 opacity-50 ${item.type === 'user' ? 'text-blue-400' : 'text-indigo-400'}`}>
                            {item.type === 'user' ? 'Student' : 'ProfX'}
                          </span>
                          <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                            item.type === 'user' 
                            ? 'bg-slate-800 text-slate-200 border-l border-blue-500/30' 
                            : 'bg-indigo-500/10 text-slate-100 border-r border-indigo-500/30 text-right'
                          }`}>
                            {item.text}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                  <div ref={transcriptEndRef} />
                </div>
              </section>
            </motion.div>
          )}

          {view === 'prompts' && (
            <motion.div
              key="prompts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold">Speaking Prompts</h2>
                <p className="text-slate-400">Choose a topic to spark a conversation with EnglishBuddy</p>
              </div>
              <PromptLibrary onSelectPrompt={handleSelectPrompt} />
            </motion.div>
          )}

          {view === 'dashboard' && (
            <ProgressDashboard onBack={() => setView('chat')} />
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 mt-12 text-center flex flex-col items-center gap-4">
        <div className="flex items-center gap-6">
          <button className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
            <Share2 size={14} /> Export Logs
          </button>
          <button className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
            <RotateCcw size={14} /> Clear Cache
          </button>
        </div>
        <p className="text-slate-600 text-[9px] uppercase tracking-[0.3em] font-medium">
          Designed for Immersion
        </p>
      </footer>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

