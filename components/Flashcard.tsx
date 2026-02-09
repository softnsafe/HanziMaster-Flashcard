import React from 'react';
import { FlashcardData } from '../types';
import HanziWriterPlayer from './HanziWriterPlayer';
import { Volume2 } from 'lucide-react';

interface FlashcardProps {
  data: FlashcardData;
  isFlipped: boolean;
  onFlip: () => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ data, isFlipped, onFlip }) => {
  
  const handleAudio = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div 
      key={data.id} // Forces re-mount on card change for clean state
      className="relative w-full max-w-3xl h-[65vh] min-h-[500px] max-h-[850px] cursor-pointer perspective-1000 mx-auto group select-none"
      onClick={onFlip}
    >
      <div 
        className={`w-full h-full transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform-style-3d relative shadow-xl rounded-2xl transition-all ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* FRONT SIDE */}
        <div 
          className={`absolute w-full h-full backface-hidden bg-white rounded-2xl flex flex-col p-6 border border-gray-200 overflow-hidden bg-gradient-to-br from-white to-gray-50 ${isFlipped ? 'pointer-events-none' : ''}`}
        >
          
          {/* Top Right: Traditional */}
          <div className="absolute top-6 right-6 z-10">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-sm text-center min-w-[80px]">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Traditional</span>
                <span className="text-5xl hanzi-tc text-gray-700 font-serif leading-none">{data.traditional}</span>
            </div>
          </div>

          {/* Center: Simplified */}
          <div className="flex-grow flex flex-col justify-center items-center -mt-4">
            <div className="flex flex-col items-center">
              <h1 className="text-8xl md:text-9xl hanzi-sc font-bold text-gray-900 mb-4 leading-none filter drop-shadow-sm">{data.simplified}</h1>
              <button 
                onClick={(e) => handleAudio(e, data.simplified)}
                className="p-3 rounded-full bg-white shadow-sm border border-gray-100 text-gray-500 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all duration-300 group/audio cursor-pointer pointer-events-auto"
                title="Listen"
              >
                <Volume2 size={28} className="group-hover/audio:animate-pulse" />
              </button>
            </div>
          </div>

          {/* Bottom: Examples (Centered) */}
          <div className="mt-auto pt-4 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Example Usage</p>
            <div className="space-y-2">
              {data.examples.slice(0, 2).map((ex, idx) => (
                <div key={idx} className="transition-colors hover:bg-gray-50 rounded-lg p-1">
                    {ex.pinyin && <p className="text-lg text-gray-500 mb-0.5 font-[Inter]">{ex.pinyin}</p>}
                    <p className="text-2xl hanzi-sc text-gray-700 leading-snug">
                      {ex.chinese}
                    </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div 
          className={`absolute w-full h-full backface-hidden bg-white rounded-2xl rotate-y-180 flex flex-col p-6 border border-gray-200 overflow-y-auto bg-gradient-to-bl from-white to-blue-50/30 ${!isFlipped ? 'pointer-events-none' : ''}`}
        >
          
          {/* Top Right: Traditional (Added to match front) */}
          <div className="absolute top-6 right-6 z-10">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-sm text-center min-w-[80px]">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Traditional</span>
                <span className="text-5xl hanzi-tc text-gray-700 font-serif leading-none">{data.traditional}</span>
            </div>
          </div>

          {/* Center Content: Pinyin + Stroke Order */}
          <div className="flex-grow flex flex-col justify-center items-center shrink-0">
            
            {/* Pinyin on top of words */}
            <div className="flex items-center gap-2 mb-2">
               <h2 className="text-5xl font-medium text-blue-600 tracking-wide font-[Inter]">{data.pinyin}</h2>
               <button 
                  onClick={(e) => handleAudio(e, data.simplified)}
                  className="p-2 rounded-full hover:bg-blue-50 text-blue-400 transition-colors hover:scale-110 active:scale-95 cursor-pointer pointer-events-auto"
                >
                  <Volume2 size={28} />
               </button>
            </div>

            {/* Stroke Order Box */}
            <div className="py-4 px-8 bg-white rounded-2xl mb-4 border border-blue-100 shadow-sm">
              {/* Conditional rendering to only load HanziWriter when flipped to save resources/prevent bugs */}
              {isFlipped && <HanziWriterPlayer text={data.simplified} size={120} />}
            </div>
          </div>

          {/* Bottom: English & Detailed Examples (Centered) */}
          <div className="mt-auto">
            <div className="mb-4 text-center border-b border-gray-100 pb-4">
               <h3 className="text-xl font-semibold text-gray-800">{data.english}</h3>
            </div>

            <div className="space-y-3">
              {data.examples.map((ex, idx) => (
                <div key={idx} className={`bg-white/80 p-3 rounded-lg border border-gray-100 text-center shadow-sm hover:shadow-md transition-shadow`}>
                  {ex.pinyin && <p className="text-base text-gray-500 mb-0.5 font-[Inter]">{ex.pinyin}</p>}
                  <p className="text-xl hanzi-sc text-gray-800 mb-1 leading-snug">{ex.chinese}</p>
                  <p className="text-sm text-gray-600 italic">{ex.english}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Flashcard;