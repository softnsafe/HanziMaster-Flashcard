import React, { useEffect, useRef } from 'react';

interface HanziWriterPlayerProps {
  text: string;
  size?: number;
}

const HanziWriterPlayer: React.FC<HanziWriterPlayerProps> = ({ text, size = 100 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const writersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!containerRef.current || !window.HanziWriter) return;

    // Clear previous content
    containerRef.current.innerHTML = '';
    writersRef.current = [];

    const chars = text.split('');

    // Create a writer for each character
    chars.forEach((char) => {
      const charDiv = document.createElement('div');
      charDiv.style.display = 'inline-block';
      charDiv.style.margin = '0 5px';
      containerRef.current?.appendChild(charDiv);

      const writer = window.HanziWriter.create(charDiv, char, {
        width: size,
        height: size,
        padding: 5,
        strokeAnimationSpeed: 1, // 1x normal speed
        delayBetweenStrokes: 200, // ms
        showOutline: true,
        strokeColor: '#3b82f6', // blue-500
        radicalColor: '#1d4ed8', // blue-700
      });

      writersRef.current.push(writer);
    });

    // Animate them sequentially or all at once? Let's loop them individually for a "busy" effect or sequential.
    // Sequential looks cleaner for learning.
    
    const animateSequence = async () => {
        // Simple loop implementation: start all writers
        writersRef.current.forEach(w => w.loopCharacterAnimation());
    };

    animateSequence();

    return () => {
      // Cleanup not strictly necessary for HanziWriter as clearing innerHTML handles DOM, 
      // but strictly we should probably stop animations if the API supported a simple 'destroy'.
      // Clearing innerHTML is usually sufficient for simple usages.
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [text, size]);

  return (
    <div 
      ref={containerRef} 
      className="flex justify-center items-center flex-wrap pointer-events-none select-none"
    />
  );
};

export default HanziWriterPlayer;