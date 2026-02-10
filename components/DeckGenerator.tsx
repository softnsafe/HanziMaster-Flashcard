import React, { useState, useRef, useEffect } from 'react';
import { Loader2, List, Type, UploadCloud, FileJson, HardDrive, AlertCircle, ExternalLink, Settings, X, Info, Link as LinkIcon } from 'lucide-react';
import { generateDeckFromList } from '../services/geminiService';
import { Deck } from '../types';

interface DeckGeneratorProps {
  onDeckGenerated: (deck: Deck) => void;
}

type Mode = 'manual' | 'upload' | 'link';

// Types for Google API
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DeckGenerator: React.FC<DeckGeneratorProps> = ({ onDeckGenerated }) => {
  const [mode, setMode] = useState<Mode>('manual');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Drive State
  const tokenClient = useRef<any>(null);
  
  // Environment variables & Manual Override with Persistence
  const ENV_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  
  // Initialize from URL param or LocalStorage
  const [manualClientId, setManualClientId] = useState(() => {
    if (typeof window !== 'undefined') {
       const params = new URLSearchParams(window.location.search);
       if (params.get('client_id')) return params.get('client_id') || '';
       return localStorage.getItem('hanzi_client_id') || '';
    }
    return '';
  });

  const CLIENT_ID = ENV_CLIENT_ID || manualClientId;

  // Save manual client ID when it changes
  useEffect(() => {
    if (manualClientId) {
      localStorage.setItem('hanzi_client_id', manualClientId);
    } else {
      localStorage.removeItem('hanzi_client_id');
    }
  }, [manualClientId]);

  // Helper to dynamically load scripts if they aren't already there
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  };

  const initGoogleAuth = async () => {
    try {
      // 1. Ensure scripts are loaded
      if (!window.gapi) await loadScript('https://apis.google.com/js/api.js');
      if (!window.google) await loadScript('https://accounts.google.com/gsi/client');

      // 2. Load GAPI Picker
      await new Promise<void>((resolve) => {
        window.gapi.load('picker', resolve);
      });

      // 3. Init Token Client (GIS)
      if (window.google?.accounts && CLIENT_ID) {
        tokenClient.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.readonly',
          callback: '', // defined at request time
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error("Auth Init Failed", e);
      throw e;
    }
  };

  const handleDrivePick = async () => {
    if (!CLIENT_ID) {
      setError("Google Client ID is missing.");
      return;
    }
    
    // Check for embedded environment (simple heuristic)
    if (window.navigator.userAgent.includes('Electron') || window.location.protocol === 'file:') {
        setError("Google Sign-In is not supported in embedded environments. Please open this app in a standard web browser (Chrome, Edge, etc).");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
        // Lazy initialize auth only when button is clicked
        if (!tokenClient.current) {
            await initGoogleAuth();
        }

        if (!tokenClient.current) {
             throw new Error("Could not initialize Google Auth. Check Client ID and Network.");
        }
        
        // Define callback for the token request
        tokenClient.current.callback = async (response: any) => {
          if (response.error !== undefined) {
            console.error("Auth Error:", response);
            setError("Authentication failed. Please check your Authorized Origins in Google Cloud Console.");
            setIsLoading(false);
            throw response;
          }
          createPicker(response.access_token);
        };

        // Always request consent to ensure the popup appears correctly
        tokenClient.current.requestAccessToken({ prompt: 'consent' });
        
    } catch (e) {
        console.error(e);
        setError("Failed to initialize Google Drive connection.");
        setIsLoading(false);
    }
  };

  const createPicker = (accessToken: string) => {
    try {
      const pickerCallback = async (data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const fileId = data.docs[0].id;
          await fetchDriveFile(fileId, accessToken);
        } else if (data.action === window.google.picker.Action.CANCEL) {
          setIsLoading(false);
        }
      };

      // Ensure API Key is available
      const apiKey = process.env.API_KEY || '';
      if (!apiKey) {
          setError("API Key is missing. The Google Picker requires a valid API Key.");
          setIsLoading(false);
          return;
      }

      const picker = new window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.DOCS)
        .setOAuthToken(accessToken)
        .setDeveloperKey(apiKey)
        .setCallback(pickerCallback)
        .build();
      picker.setVisible(true);
    } catch (e) {
      console.error(e);
      setError("Failed to create picker. Ensure Google Picker API is enabled in Cloud Console.");
      setIsLoading(false);
    }
  };

  const fetchDriveFile = async (fileId: string, accessToken: string) => {
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) throw new Error("Failed to download file");
      
      const text = await response.text();
      await processContent(text);
    } catch (err) {
      console.error(err);
      setError("Failed to read file from Google Drive.");
    } finally {
      setIsLoading(false);
    }
  };

  const isValidDeck = (data: any): boolean => {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.title === 'string' &&
      Array.isArray(data.cards)
    );
  };

  // Unified content processor (JSON Deck, JSON List, or Plain Text)
  const processContent = async (content: string) => {
    try {
      // 1. Try to parse as JSON first
      let json;
      try {
        json = JSON.parse(content);
      } catch (e) {
        // Not JSON, fall through to text processing
      }

      if (json) {
        if (isValidDeck(json)) {
          const cards = json.cards.map((c: any, i: number) => {
            const examples = c.examples?.map((ex: any) => ({
              simplified: ex.simplified || ex.chinese || "",
              traditional: ex.traditional || ex.chinese || "",
              pinyin: ex.pinyin,
              english: ex.english
            })) || [];

            return {
              ...c,
              examples,
              id: c.id || `imported-${Date.now()}-${i}`
            };
          });
          onDeckGenerated({ ...json, cards });
          return true;
        } else if (Array.isArray(json) && json.every(item => typeof item === 'string')) {
          // It's a simple array of strings ["Word", "Word 2"]
          const deck = await generateDeckFromList(json.join('\n'));
          onDeckGenerated(deck);
          return true;
        }
      }

      // 2. If not valid JSON or JSON Deck, treat as text list for AI
      // Ensure content isn't empty or just whitespace
      if (!content || !content.trim()) {
          throw new Error("Content is empty");
      }
      
      const deck = await generateDeckFromList(content);
      onDeckGenerated(deck);
      return true;

    } catch (err) {
      console.error(err);
      setError("Failed to process content. Ensure it is a valid JSON deck or a list of words.");
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
      await processContent(content);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleUrlSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        // Simple URL validation
        new URL(inputValue);

        const response = await fetch(inputValue);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        
        await processContent(text);
        
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch from URL. Note: The URL must be public and allow CORS (e.g. GitHub Raw Gist).");
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
          onClick={() => { setMode('link'); setInputValue(''); setError(null); }}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            mode === 'link' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <LinkIcon size={18} />
          Link
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
            {mode === 'link' && 'Import from Link'}
            {mode === 'upload' && 'Import File'}
          </h2>
          <p className="text-gray-500 text-sm">
            {mode === 'manual' && 'Paste your own words or phrases. You can add specific examples too.'}
            {mode === 'link' && 'Paste a direct link to a JSON deck file or a plain text list (e.g. GitHub Raw).'}
            {mode === 'upload' && 'Upload a previously saved deck JSON file from your computer or Google Drive.'}
          </p>
        </div>

        {/* MODE: MANUAL */}
        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label htmlFor="input" className="sr-only">Input</label>
              <textarea
                id="input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={"Enter words one per line. \nExample:\n你好: 你好吗？ (Hello: How are you?)"}
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
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Type size={20} />}
              {isLoading ? 'Processing...' : 'Create Deck'}
            </button>
          </form>
        )}

        {/* MODE: LINK */}
        {mode === 'link' && (
          <form onSubmit={handleUrlSubmit} className="space-y-4">
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 text-sm text-blue-900 mb-4">
                <Info className="shrink-0 mt-0.5" size={18} />
                <p>Ensure the URL allows <strong>CORS</strong> access. <br/>Recommended: <strong>GitHub Gist (Raw)</strong> or standard JSON APIs.</p>
             </div>
             
             <div>
               <label htmlFor="urlInput" className="sr-only">URL</label>
               <input 
                 id="urlInput"
                 type="url" 
                 placeholder="https://gist.githubusercontent.com/..."
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                 disabled={isLoading}
               />
             </div>
             <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LinkIcon size={20} />}
              {isLoading ? 'Fetching...' : 'Import'}
            </button>
          </form>
        )}

        {/* MODE: UPLOAD */}
        {mode === 'upload' && (
          <div className="space-y-6">
             {/* Local File Upload */}
             <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative group cursor-pointer bg-gray-50/50">
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
                    Click to Upload from Computer
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Supports saved .json files</p>
                </div>
             </div>

             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">OR</span>
                </div>
             </div>

             {/* Google Drive Button */}
             <div className="relative group/drive">
               <button
                 type="button"
                 onClick={handleDrivePick}
                 disabled={isLoading || !CLIENT_ID}
                 className={`w-full flex items-center justify-center gap-2 px-4 py-3 border shadow-sm font-medium rounded-xl transition-all
                   ${!CLIENT_ID 
                     ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' 
                     : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-md focus:ring-2 focus:ring-blue-100'
                   }`}
               >
                 {isLoading ? (
                   <Loader2 className="animate-spin" size={20} />
                 ) : (
                   <HardDrive size={20} className={!CLIENT_ID ? "text-gray-400" : "text-blue-600"} />
                 )}
                 {CLIENT_ID ? "Pick from Google Drive" : "Google Drive"}
               </button>
             </div>

             {/* Client ID Configuration Section */}
             <div className="mt-4 pt-4 border-t border-gray-100">
               {!CLIENT_ID ? (
                 <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900">
                   <p className="font-bold mb-2 flex items-center gap-1.5 text-blue-800">
                     <AlertCircle size={14} />
                     Setup Required for Drive
                   </p>
                   <ol className="list-decimal list-inside space-y-2 ml-1 opacity-90 text-blue-800 mb-3">
                     <li>
                       Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-600 inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink size={10}/></a>
                     </li>
                     <li>Create <strong>OAuth client ID</strong> (Web application).</li>
                     <li>Add origin: <code className="bg-white/50 px-1 rounded">{window.location.origin}</code></li>
                   </ol>
                   
                   <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        placeholder="Paste Client ID here (starts with numbers...)"
                        className="flex-1 px-3 py-2 rounded border border-blue-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          setManualClientId(inputValue);
                          setInputValue('');
                        }}
                        disabled={!inputValue}
                        className="px-3 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                   </div>
                 </div>
               ) : (
                 !ENV_CLIENT_ID && (
                   <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                     <div className="flex items-center gap-2">
                       <Settings size={12} />
                       <span>Using saved Client ID: {CLIENT_ID.substring(0, 10)}...</span>
                     </div>
                     <button 
                       onClick={() => setManualClientId('')}
                       className="text-red-500 hover:text-red-700 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                     >
                       <X size={12} /> Reset
                     </button>
                   </div>
                 )
               )}
             </div>

             {/* Help Info Box if error is about OAuth */}
             {error && error.includes("OAuth") && (
                 <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded-lg flex gap-2">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold mb-1">Troubleshooting "Secure App Policy" Error:</p>
                        <ul className="list-disc list-inside space-y-1 opacity-90">
                            <li>Ensure you are using a standard browser (Chrome, Edge), not an embedded IDE browser.</li>
                            <li>Verify <strong>{window.location.origin}</strong> is listed in "Authorized JavaScript origins" in Google Cloud Console.</li>
                            <li>Check that you aren't using an IP address (use localhost or a real domain).</li>
                        </ul>
                    </div>
                 </div>
             )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center flex items-center justify-center gap-2 animate-pop-in">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckGenerator;