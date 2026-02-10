import React, { useState } from 'react';
import DeckGenerator from './components/DeckGenerator';
import Flashcard from './components/Flashcard';
import { Deck } from './types';
import { ArrowLeft, ArrowRight, RotateCw, Plus, BookOpen, Download, Languages } from 'lucide-react';

const App: React.FC = () => {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [scriptMode, setScriptMode] = useState<'simplified' | 'traditional'>('simplified');

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
    }, 200);
  };

  const handlePrev = () => {
    if (!deck) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + deck.cards.length) % deck.cards.length);
    }, 200);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
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
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shrink-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetDeck}>
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <BookOpen className="text-white" size={18} />
            </div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">HanziMaster</h1>
          </div>
          <div className="flex items-center gap-2">
            
            {/* Toggle Button */}
            <button
              onClick={toggleScriptMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors mr-2"
              title={`Switch to ${scriptMode === 'simplified' ? 'Traditional' : 'Simplified'}`}
            >
              <Languages size={14} />
              <span>{scriptMode === 'simplified' ? '简' : '繁'}</span>
            </button>

            {deck && (
              <>
                <button 
                  onClick={saveDeck}
                  className="text-xs font-medium text-gray-600 hover:text-blue-600 flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
                  title="Download JSON"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Save</span>
                </button>
                <button 
                  onClick={resetDeck}
                  className="text-xs font-medium text-gray-600 hover:text-blue-600 flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">New</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-2 overflow-y-auto">
        {!deck ? (
          <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-300 py-10">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Master Chinese Vocabulary</h2>
              <p className="text-lg text-gray-600 max-w-xl mx-auto">
                Generate custom flashcards instantly with AI. Learn simplified & traditional characters, stroke order, and context.
              </p>
            </div>
            <DeckGenerator onDeckGenerated={handleDeckGenerated} />
          </div>
        ) : (
          <div className="w-full max-w-5xl flex flex-col items-center h-full justify-center">
            
            {/* Progress Bar (Title removed) */}
            <div className="w-full max-w-3xl flex justify-center items-center mb-6 shrink-0 gap-4">
               <span className="text-xs text-gray-400 font-medium tabular-nums">
                 {currentCardIndex + 1} / {deck.cards.length}
               </span>
               <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                 <div 
                    className="h-full bg-blue-600 transition-all duration-300" 
                    style={{ width: `${((currentCardIndex + 1) / deck.cards.length) * 100}%` }}
                 />
               </div>
            </div>

            {/* Flashcard Area */}
            <div className="w-full mb-4 shrink-0 flex justify-center">
              <Flashcard 
                data={deck.cards[currentCardIndex]} 
                isFlipped={isFlipped} 
                onFlip={handleFlip} 
                scriptMode={scriptMode}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-8 shrink-0 pb-4">
              <button 
                onClick={handlePrev}
                className="p-3 bg-white rounded-full shadow-sm text-gray-600 hover:text-blue-600 hover:shadow-md transition-all border border-gray-200"
                aria-label="Previous Card"
              >
                <ArrowLeft size={20} />
              </button>

              <button 
                onClick={handleFlip}
                className="flex flex-col items-center gap-1 group"
              >
                 <div className="w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-200 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                    <RotateCw size={24} />
                 </div>
                 <span className="text-[10px] font-medium text-gray-500 group-hover:text-blue-600 uppercase tracking-wide">Flip</span>
              </button>

              <button 
                onClick={handleNext}
                className="p-3 bg-white rounded-full shadow-sm text-gray-600 hover:text-blue-600 hover:shadow-md transition-all border border-gray-200"
                aria-label="Next Card"
              >
                <ArrowRight size={20} />
              </button>
            </div>
            
          </div>
        )}
      </main>
      
      {/* Footer (Simplified) */}
      <footer className="bg-white border-t border-gray-200 py-2 text-center shrink-0">
         <p className="text-xs text-gray-400">
           Powered by Gemini AI & HanziWriter
         </p>
      </footer>
    </div>
  );
};

export default App;