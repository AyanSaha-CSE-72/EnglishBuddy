import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { getSessionHistory, SessionReport } from '../lib/storage';
import { TrendingUp, BookOpen, MessageSquare, Award, Clock, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface ProgressDashboardProps {
  onBack: () => void;
}

export function ProgressDashboard({ onBack }: ProgressDashboardProps) {
  const history = getSessionHistory();
  const reversedHistory = [...history].reverse();

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Award size={64} className="text-slate-700 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No sessions yet</h2>
        <p className="text-slate-400 mb-8 max-w-sm">
          Complete your first English conversation with ProfX to see your progress data here.
        </p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-full font-medium transition-all"
        >
          <ArrowLeft size={18} /> Back to Class
        </button>
      </div>
    );
  }

  const latest = history[0];

  const chartData = reversedHistory.slice(-10).map(h => ({
    date: new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    grammar: h.grammarScore,
    vocab: h.vocabularyScore,
    fluency: h.fluencyScore,
    pacing: h.pacingScore || 0,
  }));

  const radarData = [
    { subject: 'Grammar', A: latest.grammarScore, fullMark: 100 },
    { subject: 'Vocab', A: latest.vocabularyScore, fullMark: 100 },
    { subject: 'Fluency', A: latest.fluencyScore, fullMark: 100 },
    { subject: 'Pacing', A: latest.pacingScore || 0, fullMark: 100 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-8 pb-12"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Your Progress</h2>
          <p className="text-slate-400">Tracking your evolution as a speaker</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all text-sm font-medium"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Award size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total Sessions</p>
            <p className="text-2xl font-bold">{history.length}</p>
          </div>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Latest Score</p>
            <p className="text-2xl font-bold">{Math.round((latest.grammarScore + latest.vocabularyScore + latest.fluencyScore + (latest.pacingScore || 0)) / 4)} avg</p>
          </div>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Last Active</p>
            <p className="text-2xl font-bold">{new Date(latest.timestamp).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 h-[400px]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">Performance Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ fontSize: '10px', textTransform: 'uppercase' }}
              />
              <Line type="monotone" dataKey="grammar" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="vocab" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="fluency" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="pacing" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart (Latest Session) */}
        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 h-[400px] flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Latest Session Focus</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Student" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary & Corrections Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Session Analysis</h3>
          </div>
          <p className="text-slate-200 leading-relaxed italic border-l-2 border-indigo-500/30 pl-4">
            "{latest.summary}"
          </p>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Key Takeaways</h4>
            <ul className="grid grid-cols-1 gap-2">
              {latest.keyImprovements.map((item, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="text-blue-400" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Vocabulary Booster</h3>
          </div>
          <div className="space-y-4">
            {latest.vocabularySuggestions.map((item, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="line-through text-slate-500 text-xs italic">{item.original}</span>
                  <span className="text-indigo-400 font-bold">→</span>
                  <span className="text-green-400 font-bold">{item.suggested}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
