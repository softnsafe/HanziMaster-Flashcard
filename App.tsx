import React, { useState, useEffect } from 'react';
import DeckGenerator from './components/DeckGenerator';
import Flashcard from './components/Flashcard';
import { Deck } from './types';
import { ArrowLeft, ArrowRight, BookOpen, Download, Languages, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [scriptMode, setScriptMode] = useState<'simplified' | 'traditional'>('simplified');

  // Keyboard Shortcuts
  useEffect(() => {
    if (!deck) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      switch(e.code) {
        case 'Space':
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          handleFlip();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deck, currentCardIndex, isFlipped]);

  const handleDeckGenerated = (newDeck: Deck) => {
    setDeck(newDeck);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleNext = () => {
    if (!deck) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % deck.cards.length);
    }, 150);
  };

  const handlePrev = () => {
    if (!deck) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + deck.cards.length) % deck.cards.length);
    }, 150);
  };

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  const resetDeck = () => {
    setDeck(null);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const saveDeck = () => {
    if (!deck) return;
    const blob = new Blob([JSON.stringify(deck, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleScriptMode = () => {
    setScriptMode(prev => prev === 'simplified' ? 'traditional' : 'simplified');
  };

  return (
    <div className="h-screen bg-[#f6f7fb] flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shrink-0 z-20 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={resetDeck}>
            <div className="bg-blue-600 text-white p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
              <BookOpen size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">HanziMaster</h1>
          </div>
          
          <div className="flex items-center gap-3">
             {deck && (
               <>
                 <span className="hidden md:block text-sm font-medium text-gray-500 mr-2 bg-gray-100 px-3 py-1 rounded-full">
                    {currentCardIndex + 1} / {deck.cards.length}
                 </span>
                 
                 <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block"></div>
                 
                 <button
                    onClick={toggleScriptMode}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors border border-gray-200"
                    title={`Switch to ${scriptMode === 'simplified' ? 'Traditional' : 'Simplified'}`}
                  >
                    <Languages size={16} className="text-gray-400" />
                    <span>{scriptMode === 'simplified' ? 'Simplified' : 'Traditional'}</span>
                 </button>

                 <button 
                  onClick={saveDeck}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Download JSON"
                >
                  <Download size={20} />
                </button>
               </>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 overflow-y-auto relative">
        {!deck ? (
          <div className="w-full max-w-2xl animate-fade-in-up py-8">
            <div className="text-center mb-12">
               <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-2xl mb-6">
                  <Sparkles size={32} />
               </div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Master Chinese Vocabulary</h2>
            </div>
            <DeckGenerator onDeckGenerated={handleDeckGenerated} />
          </div>
        ) : (
          <div className="w-full max-w-5xl flex flex-col items-center h-full justify-center gap-8 py-4">
            
            {/* Flashcard Area */}
            <div className="w-full flex-grow flex flex-col justify-center">
              <Flashcard 
                data={deck.cards[currentCardIndex]} 
                isFlipped={isFlipped} 
                onFlip={handleFlip} 
                scriptMode={scriptMode}
              />
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-6 md:gap-12 shrink-0 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-200 shadow-sm mb-4">
              <button 
                onClick={handlePrev}
                className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all active:scale-95"
                title="Previous (Left Arrow)"
              >
                <ArrowLeft size={24} />
              </button>

              <button 
                onClick={handleFlip}
                className="flex flex-col items-center gap-1 group min-w-[80px]"
                title="Flip (Spacebar)"
              >
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Flip</span>
                 <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden group-hover:bg-blue-200">
                    <div className={`h-full bg-blue-600 transition-all duration-300 ${isFlipped ? 'w-full' : 'w-0'}`}></div>
                 </div>
              </button>

              <button 
                onClick={handleNext}
                className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all active:scale-95"
                title="Next (Right Arrow)"
              >
                <ArrowRight size={24} />
              </button>
            </div>
            
          </div>
        )}
      </main>
      
      {/* Keyboard Hint Footer */}
      {deck && (
        <div className="fixed bottom-4 right-4 hidden lg:flex flex-col gap-2 pointer-events-none opacity-50">
           <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md">Space to flip</div>
           <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md">← → to navigate</div>
        </div>
      )}
    </div>
  );
};

export default App;