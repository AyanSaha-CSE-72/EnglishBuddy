import { motion } from "motion/react";
import { Cpu, Gamepad, Briefcase, Sparkles, Send } from "lucide-react";
import { CONVERSATION_STARTERS } from "../constants";

const IconMap: Record<string, any> = {
  Cpu,
  Gamepad,
  Briefcase,
  Sparkles
};

interface PromptLibraryProps {
  onSelectPrompt: (prompt: string) => void;
}

export function PromptLibrary({ onSelectPrompt }: PromptLibraryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {CONVERSATION_STARTERS.map((category) => {
        const Icon = IconMap[category.icon];
        return (
          <div key={category.name} className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Icon size={16} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">{category.name}</h3>
            </div>
            <div className="space-y-2">
              {category.prompts.map((prompt, i) => (
                <motion.button
                  key={i}
                  whileHover={{ x: 5 }}
                  onClick={() => onSelectPrompt(prompt)}
                  className="w-full text-left p-3 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all flex items-center justify-between group"
                >
                  <span className="flex-1">{prompt}</span>
                  <Send size={12} className="opacity-0 group-hover:opacity-100 text-indigo-400 shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
