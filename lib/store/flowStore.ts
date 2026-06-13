import { create } from 'zustand';
import type {
  FlowStep,
  Message,
  IntentResult,
  Direction,
  Outline,
  GeneratedContent,
  PublishState,
} from '@/lib/types';

interface FlowStore {
  // 流程状态
  currentStep: FlowStep;
  isLoading: boolean;

  // 对话消息
  messages: Message[];

  // 各阶段数据
  intentResult: IntentResult | null;
  selectedDirection: Direction | null;
  outline: Outline | null;
  generatedContent: GeneratedContent | null;
  publishState: PublishState | null;

  // 操作方法
  setStep: (step: FlowStep) => void;
  setLoading: (loading: boolean) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateLastAssistantMessage: (content: string) => void;
  setIntentResult: (result: IntentResult) => void;
  selectDirection: (direction: Direction) => void;
  setOutline: (outline: Outline) => void;
  setGeneratedContent: (content: GeneratedContent) => void;
  setPublishState: (state: PublishState) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 'idle' as FlowStep,
  isLoading: false,
  messages: [],
  intentResult: null,
  selectedDirection: null,
  outline: null,
  generatedContent: null,
  publishState: null,
};

let messageCounter = 0;

export const useFlowStore = create<FlowStore>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),
  setLoading: (isLoading) => set({ isLoading }),

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg-${++messageCounter}`,
          timestamp: Date.now(),
        },
      ],
    })),

  updateLastAssistantMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
          messages[i] = { ...messages[i], content };
          break;
        }
      }
      return { messages };
    }),

  setIntentResult: (intentResult) => set({ intentResult }),
  selectDirection: (direction) => set({ selectedDirection: direction }),
  setOutline: (outline) => set({ outline }),
  setGeneratedContent: (generatedContent) => set({ generatedContent }),
  setPublishState: (publishState) => set({ publishState }),

  reset: () => set(initialState),
}));
