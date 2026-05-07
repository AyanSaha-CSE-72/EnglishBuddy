export interface PromptCategory {
  name: string;
  icon: string;
  prompts: string[];
}

export const CONVERSATION_STARTERS: PromptCategory[] = [
  {
    name: "Technology",
    icon: "Cpu",
    prompts: [
      "What do you think is the most useful piece of technology in your daily life?",
      "How do you feel about the rapid advancement of Artificial Intelligence?",
      "If you could invent one gadget, what would it do?",
      "Do you think social media has a positive or negative impact on society?"
    ]
  },
  {
    name: "Hobbies & Life",
    icon: "Gamepad",
    prompts: [
      "What is something you've always wanted to learn but haven't started yet?",
      "How do you usually spend your weekends to relax?",
      "If you could travel anywhere in the world right now, where would you go?",
      "Tell me about a book or movie that changed your perspective on something."
    ]
  },
  {
    name: "Career & Goals",
    icon: "Briefcase",
    prompts: [
      "What originally motivated you to start improving your English skills?",
      "Where do you see yourself professionally in five years?",
      "What is the most challenging task you've ever completed at work?",
      "If you could have any job in the world for just one day, what would it be?"
    ]
  },
  {
    name: "Hypotheticals",
    icon: "Sparkles",
    prompts: [
      "If you won the lottery tomorrow, what would be the first thing you'd buy?",
      "If you could meet any historical figure, who would it be and why?",
      "What would you do if you were the president of your country for a day?",
      "If you could have any superpower, which one would you choose?"
    ]
  }
];
