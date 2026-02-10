import React from 'react';
import { FlashcardData } from '../types';
import HanziWriterPlayer from './HanziWriterPlayer';

interface FlashcardProps {
  data: FlashcardData;
  isFlipped: boolean;
  onFlip: () => void;
  scriptMode: 'simplified' | 'traditional';
}

const Flashcard: React.FC<FlashcardProps> = ({ data, isFlipped, onFlip, scriptMode }) => {
  
  // Determine which character set is "Primary" (Front) and "Secondary" (Back)
  const isSimplified = scriptMode === 'simplified';
  
  const mainChar = isSimplified ? data.simplified : data.traditional;
  const secondaryChar = isSimplified ? data.traditional : data.simplified;
  const secondaryLabel = isSimplified ? "Traditional" : "Simplified";
  
  // Font classes based on script
  const mainFontClass = isSimplified ? "hanzi-sc" : "hanzi-tc";
  const secondaryFontClass = isSimplified ? "hanzi-tc" : "hanzi-sc";

  return (
    <div 
      key={`${data.id}-${scriptMode}`} // Force remount when script mode changes to reset animations/state
      className="relative w-full max-w-4xl h-[60vh] min-h-[500px] max-h-[800px] cursor-pointer perspective-1000 mx-auto group select-none"
      onClick={onFlip}
    >
      <div 
        className={`w-full h-full transition-transform duration-500 cubic-bezier(0.2, 0.8, 0.2, 1) transform-style-3d relative shadow-lg hover:shadow-xl rounded-xl transition-all ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* FRONT SIDE (Main Character + Examples) */}
        <div 
          className={`absolute w-full h-full backface-hidden bg-white rounded-xl flex flex-col items-center justify-between p-6 md:p-8 border-b-4 border-gray-200 ${isFlipped ? 'pointer-events-none' : ''}`}
        >
          {/* Top Right Corner Box: Alternate Script */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
             <div className="flex flex-col items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{secondaryLabel}</span>
                <span className={`text-2xl md:text-3xl ${secondaryFontClass} text-gray-700 leading-none`}>
                  {secondaryChar}
                </span>
             </div>
          </div>

          {/* Main Content: HUGE Character */}
          <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
            <h1 className={`text-[8rem] md:text-[14rem] lg:text-[16rem] ${mainFontClass} font-normal text-gray-900 leading-none`}>
              {mainChar}
            </h1>
          </div>

          {/* Bottom: Examples (Context) - Row Layout */}
          <div className="w-full flex flex-col items-center mb-2">
            <div className="flex flex-row gap-6 md:gap-12 justify-center items-center text-center w-full px-4">
               {data.examples && data.examples.slice(0, 2).map((ex, idx) => (
                  <div key={idx} className="shrink-0 max-w-[45%]">
                    <p className={`text-xl md:text-3xl ${mainFontClass} text-gray-600`}>
                      {isSimplified ? ex.simplified : ex.traditional}
                    </p>
                  </div>
               ))}
            </div>
            <p className="mt-6 text-gray-300 font-medium tracking-widest text-xs uppercase">Tap to flip</p>
          </div>
        </div>

        {/* BACK SIDE (Details + Secondary Character) */}
        <div 
          className={`absolute w-full h-full backface-hidden bg-white rounded-xl rotate-y-180 flex flex-col border-b-4 border-blue-200 overflow-hidden ${!isFlipped ? 'pointer-events-none' : ''}`}
        >
          {/* Header Bar */}
          <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Definition</span>
          </div>

          <div className="flex-grow flex flex-col md:flex-row p-6 gap-6 overflow-y-auto">
            
            {/* Left Side: Characters & Pinyin */}
            <div className="flex-1 flex flex-col items-center justify-center border-r border-gray-100 pr-6">
               <p className="text-3xl text-blue-600 font-medium mb-4 font-[Inter]">{data.pinyin}</p>
               
               {/* Stroke Order (Using Main Character) */}
               <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  {isFlipped && <HanziWriterPlayer text={mainChar} size={220} />}
               </div>

               {/* Secondary Display */}
               <div className="text-center">
                 <span className="text-xs text-gray-400 uppercase tracking-wide block mb-1">{secondaryLabel}</span>
                 <span className={`text-4xl ${secondaryFontClass} text-gray-600 font-serif`}>{secondaryChar}</span>
               </div>
            </div>

            {/* Right Side: English & Examples */}
            <div className="flex-[1.5] flex flex-col justify-center text-left">
              <h3 className="text-3xl font-semibold text-gray-800 mb-8">{data.english}</h3>
              
              <div className="space-y-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Examples</p>
                {data.examples.map((ex, idx) => (
                  <div key={idx} className="pl-4 border-l-2 border-blue-100 hover:border-blue-300 transition-colors">
                    <p className={`text-xl ${mainFontClass} text-gray-700 mb-1`}>
                      {isSimplified ? ex.simplified : ex.traditional}
                    </p>
                    {ex.pinyin && <p className="text-sm text-gray-500 mb-0.5">{ex.pinyin}</p>}
                    <p className="text-sm text-gray-600 italic">{ex.english}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;