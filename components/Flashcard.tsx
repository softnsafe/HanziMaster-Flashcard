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
      key={`${data.id}-${scriptMode}`} // Force remount when script mode changes
      className="relative w-full max-w-4xl h-[60vh] min-h-[500px] max-h-[700px] cursor-pointer perspective-1000 mx-auto group select-none"
      onClick={onFlip}
    >
      <div 
        className={`w-full h-full transition-transform duration-500 cubic-bezier(0.2, 0.8, 0.2, 1) transform-style-3d relative shadow-xl hover:shadow-2xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* FRONT SIDE */}
        <div 
          className={`absolute w-full h-full backface-hidden bg-white rounded-2xl flex flex-col items-center justify-between p-8 md:p-12 border-b-[6px] border-gray-100 ${isFlipped ? 'pointer-events-none' : ''}`}
        >
          {/* Top Right: Traditional / Alternate Script (Floating cleanly) */}
          <div className="absolute top-6 right-6 md:top-8 md:right-8 z-10 opacity-70 hover:opacity-100 transition-opacity">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{secondaryLabel}</span>
                <span className={`text-3xl md:text-4xl ${secondaryFontClass} text-gray-500 font-medium`}>
                  {secondaryChar}
                </span>
             </div>
          </div>

          {/* Center: HUGE Simplified Character */}
          <div className="flex-1 flex items-center justify-center w-full">
            <h1 className={`text-[8rem] md:text-[12rem] lg:text-[15rem] ${mainFontClass} font-normal text-gray-900 leading-none filter drop-shadow-sm`}>
              {mainChar}
            </h1>
          </div>

          {/* Bottom: Click Hint (Clean, no examples) */}
          <div className="w-full flex flex-col items-center mt-4 h-8 justify-end">
            <p className="text-gray-300 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
              Click to flip
            </p>
          </div>
        </div>

        {/* BACK SIDE */}
        <div 
          className={`absolute w-full h-full backface-hidden bg-white rounded-2xl rotate-y-180 flex flex-col border-b-[6px] border-blue-600 overflow-hidden ${!isFlipped ? 'pointer-events-none' : ''}`}
        >
          {/* Header */}
          <div className="h-16 border-b border-gray-100 flex items-center justify-between px-8 bg-gray-50">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Definition</span>
             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{data.pinyin}</span>
          </div>

          <div className="flex-grow flex flex-col md:flex-row p-8 gap-8 overflow-y-auto">
            
            {/* Left Column: Visuals */}
            <div className="w-full md:w-1/3 flex flex-col items-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
               <div className="bg-gray-50 rounded-xl p-6 mb-6 w-full aspect-square flex items-center justify-center relative overflow-hidden border border-gray-100 shadow-inner">
                  {/* Animation Container */}
                  {isFlipped && <HanziWriterPlayer text={mainChar} size={180} />}
               </div>
               
               <div className="text-center w-full">
                 <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">{secondaryLabel}</p>
                 <p className={`text-5xl ${secondaryFontClass} text-gray-700`}>{secondaryChar}</p>
               </div>
            </div>

            {/* Right Column: Text Details */}
            <div className="w-full md:w-2/3 flex flex-col justify-center text-left space-y-8">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight mb-2">{data.english}</h3>
                <p className="text-lg text-blue-600 font-medium">{data.pinyin}</p>
              </div>
              
              <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-2">Usage Examples</p>
                {data.examples.map((ex, idx) => (
                  <div key={idx} className="group/ex">
                    <p className={`text-xl ${mainFontClass} text-gray-800 mb-1`}>
                      {isSimplified ? ex.simplified : ex.traditional}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-sm text-gray-500">
                       <span className="font-mono text-blue-500/80">{ex.pinyin}</span>
                       <span className="hidden sm:inline text-gray-300">•</span>
                       <span className="italic text-gray-600">{ex.english}</span>
                    </div>
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