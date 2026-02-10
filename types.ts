export interface Example {
  simplified: string;
  traditional: string;
  pinyin?: string;
  english: string;
}

export interface FlashcardData {
  id: string;
  simplified: string;
  traditional: string;
  pinyin: string;
  english: string;
  examples: Example[];
}

export interface Deck {
  title: string;
  cards: FlashcardData[];
}

// Minimal type definition for HanziWriter global since we are loading via CDN
export interface HanziWriterOptions {
  width?: number;
  height?: number;
  padding?: number;
  strokeAnimationSpeed?: number;
  delayBetweenStrokes?: number;
  showOutline?: boolean;
  strokeColor?: string;
  radicalColor?: string;
  showCharacter?: boolean;
}

export interface HanziWriterInstance {
  animateCharacter: (options?: { onComplete?: () => void }) => void;
  loopCharacterAnimation: () => void;
  hideCharacter: () => void;
  showCharacter: () => void;
}

export interface HanziWriterStatic {
  create: (element: HTMLElement | string, character: string, options?: HanziWriterOptions) => HanziWriterInstance;
}

declare global {
  interface Window {
    HanziWriter: HanziWriterStatic;
  }
}