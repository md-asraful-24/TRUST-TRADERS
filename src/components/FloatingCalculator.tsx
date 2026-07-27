"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Calculator, X, Equal, Delete, History, ChevronLeft } from 'lucide-react';

type HistoryItem = { expression: string, result: string };

export default function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const dragRef = useRef<HTMLDivElement>(null);
  const initialPos = useRef({ x: 0, y: 0 });
  const offset = useRef({ x: 0, y: 0 });

  // Calculator State
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    setMounted(true);
    
    try {
      const saved = localStorage.getItem('calc_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch(e) {}
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Set initial position to bottom right of screen for desktop
    setPosition({
      x: window.innerWidth - 80,
      y: window.innerHeight - 100
    });
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ensure calculator stays on screen when opened
  useEffect(() => {
    if (isOpen && !isMobile && typeof window !== 'undefined') {
      setPosition(prev => {
        const boxWidth = 288;
        const boxHeight = 450;
        const maxX = Math.max(0, window.innerWidth - boxWidth - 16);
        const maxY = Math.max(0, window.innerHeight - boxHeight - 16);
        return {
          x: Math.min(Math.max(16, prev.x), maxX),
          y: Math.min(Math.max(16, prev.y), maxY)
        };
      });
    }
  }, [isOpen, isMobile]);

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    try { localStorage.setItem('calc_history', JSON.stringify(newHistory)); } catch(e) {}
  };

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isMobile) return; // Disable drag on mobile

    // Only allow drag if clicking the header or if closed
    if (isOpen && !(e.target as HTMLElement).closest('.drag-handle')) return;
    
    setIsDragging(true);
    initialPos.current = { x: e.clientX, y: e.clientY };
    offset.current = { x: position.x, y: position.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - initialPos.current.x;
    const dy = e.clientY - initialPos.current.y;
    
    let newX = offset.current.x + dx;
    let newY = offset.current.y + dy;
    
    // Simple bounds check
    const isMobileViewport = window.innerWidth < 640;
    const boxWidth = isOpen ? (isMobileViewport ? 256 : 288) : 60;
    const boxHeight = isOpen ? 450 : 60;
    const maxX = window.innerWidth - boxWidth;
    const maxY = window.innerHeight - boxHeight;
    
    setPosition({
      x: Math.min(Math.max(0, newX), Math.max(0, maxX)),
      y: Math.min(Math.max(0, newY), Math.max(0, maxY))
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isMobile) return;
    
    setIsDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(err) {}
    
    // If we didn't drag much, it's a click. Toggle open if closed.
    const dist = Math.hypot(e.clientX - initialPos.current.x, e.clientY - initialPos.current.y);
    if (dist < 5 && !isOpen) {
      setIsOpen(true);
    }
  };

  // Calculator logic
  const handleInput = (val: string) => {
    // Prevent starting with operators or multiple operators
    const lastChar = expression.slice(-1);
    const isOperator = ['+', '-', '*', '/'].includes(val);
    
    if (isOperator && expression === '') return;
    if (isOperator && ['+', '-', '*', '/'].includes(lastChar)) {
      setExpression(prev => prev.slice(0, -1) + val);
      return;
    }
    
    setExpression(prev => prev + val);
  };

  const calculateResult = () => {
    if (!expression) return;
    try {
      const evalExpression = expression.replace(/%/g, '/100');

      // Safe evaluation
      // eslint-disable-next-line no-new-func
      const evaluated = new Function('return ' + evalExpression)();
      if (evaluated === Infinity || Number.isNaN(evaluated)) {
        setResult('Error');
      } else {
        // Format to handle long decimals nicely
        const finalVal = Number.isInteger(evaluated) ? evaluated : parseFloat(evaluated.toFixed(4));
        const finalStr = String(finalVal);
        setResult(finalStr);
        
        if (expression !== finalStr) {
          saveHistory([{ expression, result: finalStr }, ...history].slice(0, 50));
        }
        
        setExpression(finalStr);
      }
    } catch {
      setResult('Error');
    }
  };

  const clear = () => {
    setExpression('');
    setResult('');
  };
  
  const backspace = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  if (!mounted) return null;

  return (
    <div
      ref={dragRef}
      className={`fixed z-[100] transition-shadow no-print ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{
        ...(isMobile ? { bottom: '16px', right: '16px' } : { left: `${position.x}px`, top: `${position.y}px` }),
        touchAction: 'none'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`w-[56px] h-[56px] bg-teal-600 hover:bg-teal-500 text-white rounded-full shadow-lg shadow-teal-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${isMobile ? 'cursor-pointer' : 'cursor-grab'}`}
          title="Open Calculator"
        >
          <Calculator className="w-6 h-6 pointer-events-none" />
        </button>
      ) : (
        <div className="w-64 sm:w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header / Drag Handle */}
          <div className={`drag-handle p-2.5 sm:p-3 bg-slate-800/80 border-b border-slate-700/50 flex justify-between items-center ${isMobile ? '' : 'cursor-move'}`}>
            <div 
              className="flex items-center gap-2 text-teal-400 cursor-pointer hover:text-teal-300 transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            >
              <Calculator className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Calculator</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showHistory ? 'bg-teal-600/20 text-teal-400' : 'text-slate-400 hover:bg-slate-700/50 hover:text-teal-400'}`}
                title="History"
              >
                <History className="w-4 h-4" />
              </button>
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="relative flex-1 flex flex-col">
          
          {/* Display */}
          <div className="p-3 sm:p-4 bg-slate-950/50 flex flex-col items-end gap-1 min-h-[70px] sm:min-h-[80px] justify-end overflow-hidden">
            <div className="text-slate-400 text-[10px] sm:text-xs font-mono h-4 overflow-hidden whitespace-nowrap w-full text-right tracking-wider">
              {expression || ''}
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-100 h-8 sm:h-10 overflow-hidden whitespace-nowrap w-full text-right">
              {result || expression || '0'}
            </div>
          </div>
          
          {/* Keypad */}
          <div className="p-3 sm:p-4 grid grid-cols-4 gap-2 sm:gap-2.5 bg-slate-800/40">
            {['C', '⌫', '%', '/'].map(btn => (
              <button 
                key={btn} 
                onClick={(e) => { e.stopPropagation(); btn === 'C' ? clear() : btn === '⌫' ? backspace() : handleInput(btn); }} 
                className="p-2 sm:p-3 bg-slate-700/50 hover:bg-slate-600 text-teal-400 font-bold rounded-xl transition-all active:scale-95 text-sm cursor-pointer"
              >
                {btn}
              </button>
            ))}
            {[7, 8, 9, '*'].map(btn => (
              <button 
                key={btn} 
                onClick={(e) => { e.stopPropagation(); handleInput(String(btn)); }} 
                className={`p-2 sm:p-3 rounded-xl transition-all active:scale-95 font-bold text-sm cursor-pointer ${typeof btn === 'number' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-700/50 hover:bg-slate-600 text-teal-400'}`}
              >
                {btn}
              </button>
            ))}
            {[4, 5, 6, '-'].map(btn => (
              <button 
                key={btn} 
                onClick={(e) => { e.stopPropagation(); handleInput(String(btn)); }} 
                className={`p-2 sm:p-3 rounded-xl transition-all active:scale-95 font-bold text-sm cursor-pointer ${typeof btn === 'number' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-700/50 hover:bg-slate-600 text-teal-400'}`}
              >
                {btn}
              </button>
            ))}
            {[1, 2, 3, '+'].map(btn => (
              <button 
                key={btn} 
                onClick={(e) => { e.stopPropagation(); handleInput(String(btn)); }} 
                className={`p-2 sm:p-3 rounded-xl transition-all active:scale-95 font-bold text-sm cursor-pointer ${typeof btn === 'number' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-700/50 hover:bg-slate-600 text-teal-400'}`}
              >
                {btn}
              </button>
            ))}
            <button 
              onClick={(e) => { e.stopPropagation(); handleInput('0'); }} 
              className="col-span-2 p-2 sm:p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all active:scale-95 text-sm cursor-pointer"
            >
              0
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleInput('.'); }} 
              className="p-2 sm:p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all active:scale-95 text-sm cursor-pointer"
            >
              .
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); calculateResult(); }} 
              className="p-2 sm:p-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-md shadow-teal-600/20 cursor-pointer"
            >
              <Equal className="w-5 h-5" />
            </button>
          </div>
          </div>
          
          {/* History Overlay */}
          {showHistory && (
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md flex flex-col z-10 rounded-b-2xl">
              <div className="p-2 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowHistory(false); }}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); saveHistory([]); }}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-400/10 hover:bg-rose-400/20 rounded transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {history.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs mt-4">No history yet</div>
                ) : (
                  history.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="text-right p-2 rounded-lg hover:bg-slate-800/80 cursor-pointer transition-colors"
                      onClick={(e) => { e.stopPropagation(); setExpression(item.expression); setResult(item.result); setShowHistory(false); }}
                    >
                      <div className="text-slate-400 text-[10px] sm:text-xs font-mono">{item.expression} =</div>
                      <div className="text-slate-200 text-lg sm:text-xl font-mono font-bold">{item.result}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
