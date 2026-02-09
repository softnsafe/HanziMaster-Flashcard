import React, { useState } from 'react';
import { Loader2, List, Type, UploadCloud, FileJson, Link as LinkIcon } from 'lucide-react';
import { generateDeckFromList } from '../services/geminiService';
import { Deck } from '../types';

interface DeckGeneratorProps {
  onDeckGenerated: (deck: Deck) => void;
}

type Mode = 'manual' | 'upload';

const DeckGenerator: React.FC<DeckGeneratorProps> = ({ onDeckGenerated }) => {
  const [mode, setMode] = useState<Mode>('manual');
  const [inputValue, setInputValue] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidDeck = (data: any): data is Deck => {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.title === 'string' &&
      Array.isArray(data.cards)
    );
  };

  const processJsonContent = async (content: string) => {
    try {
      const json = JSON.parse(content);

      if (isValidDeck(json)) {
        const cards = json.cards.map((c: any, i: number) => ({
          ...c,
          id: c.id || `imported-${Date.now()}-${i}`
        }));
        onDeckGenerated({ ...json, cards });
        return true;
      } else if (Array.isArray(json) && json.every(item => typeof item === 'string')) {
        const deck = await generateDeckFromList(json.join('\n'));
        onDeckGenerated(deck);
        return true;
      } else {
        setError("Invalid JSON format. Please upload a saved Deck file or a list of words (array of strings).");
        return false;
      }
    } catch (err) {
      console.error(err);
      setError("Failed to parse JSON content.");
      return false;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      await processJsonContent(content);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleDriveImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveLink.trim()) return;

    setIsLoading(true);
    setError(null);

    // Extract File ID from Google Drive URL
    // Supports: /file/d/ID/view, id=ID, etc.
    const idMatch = driveLink.match(/\/d\/([a-zA-Z0-9_-]+)/) || driveLink.match(/id=([a-zA-Z0-9_-]+)/);
    
    if (!idMatch) {
      setError("Could not find a valid Google Drive File ID in the link.");
      setIsLoading(false);
      return;
    }

    const fileId = idMatch[1];
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    // Use a CORS proxy as a fallback because Google Drive blocks direct fetch from browser JS
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`;

    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const text = await response.text();
      await processJsonContent(text);
    } catch (err) {
      console.error(err);
      setError("Could not download file. Ensure the file link is set to 'Anyone with the link' can view. If it still fails, please download the file manually and use the upload box above.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'upload') return;
    if (!inputValue.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const deck = await generateDeckFromList(inputValue);
      onDeckGenerated(deck);
    } catch (err) {
      setError("Failed to generate deck. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => { setMode('manual'); setInputValue(''); setError(null); }}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            mode === 'manual' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <List size={18} />
          List
        </button>
        <button
          onClick={() => { setMode('upload'); setInputValue(''); setError(null); }}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            mode === 'upload' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <UploadCloud size={18} />
          Upload
        </button>
      </div>

      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {mode === 'manual' && 'Create from List'}
            {mode === 'upload' && 'Import Deck'}
          </h2>
          <p className="text-gray-500 text-sm">
            {mode === 'manual' && 'Paste your own words or phrases. You can add specific examples too.'}
            {mode === 'upload' && 'Upload a previously saved deck JSON file.'}
          </p>
        </div>

        {mode === 'upload' ? (
          <div className="space-y-6">
             {/* File Upload Area */}
             <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative group cursor-pointer">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isLoading}
                />
                <div className="flex flex-col items-center justify-center text-gray-500">
                  {isLoading ? (
                    <Loader2 className="animate-spin text-blue-600 mb-3" size={40} />
                  ) : (
                    <FileJson className="text-blue-200 group-hover:text-blue-400 transition-colors mb-3" size={48} />
                  )}
                  <p className="font-medium text-gray-700">
                    {isLoading ? "Processing..." : "Click or Drag JSON file here"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Supports saved .json files</p>
                </div>
             </div>

             {/* Divider */}
             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">OR</span>
                </div>
             </div>

             {/* Google Drive Link Input */}
             <form onSubmit={handleDriveImport} className="space-y-3">
               <label className="block text-sm font-medium text-gray-700">Import via Google Drive Link</label>
               <div className="flex gap-2">
                 <div className="relative flex-grow">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <LinkIcon className="text-gray-400" size={16} />
                   </div>
                   <input
                     type="text"
                     value={driveLink}
                     onChange={(e) => setDriveLink(e.target.value)}
                     placeholder="https://drive.google.com/file/d/..."
                     className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                     disabled={isLoading}
                   />
                 </div>
                 <button
                   type="submit"
                   disabled={isLoading || !driveLink.trim()}
                   className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors whitespace-nowrap"
                 >
                   Import
                 </button>
               </div>
               <p className="text-xs text-gray-400">
                 Note: File must be set to "Anyone with the link".
               </p>
             </form>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="input" className="sr-only">Input</label>
              <textarea
                id="input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={"Enter words one per line. \nExample:\n苹果: 我想吃苹果 (Apple: I want to eat apples)\n你好: 你好吗？"}
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 resize-none"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <Type size={20} />
                  Create Deck
                </>
              )}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckGenerator;