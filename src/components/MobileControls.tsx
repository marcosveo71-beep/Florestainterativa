import React, { useRef } from 'react';
import { controlsState } from './store';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

export function MobileControls() {
  const lastTouch = useRef<{ x: number; y: number } | null>(null);

  const handleStart = (action: keyof typeof controlsState) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (controlsState as any)[action] = true;
  };
  
  const handleEnd = (action: keyof typeof controlsState) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (controlsState as any)[action] = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      // Only track the first touch for looking around
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!lastTouch.current || e.touches.length === 0) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - lastTouch.current.x;
    const deltaY = touch.clientY - lastTouch.current.y;
    
    controlsState.lookDeltaX += deltaX;
    controlsState.lookDeltaY += deltaY;
    
    lastTouch.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    lastTouch.current = null;
  };

  // Also support mouse drag for testing on desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    lastTouch.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!lastTouch.current) return;
    
    const deltaX = e.clientX - lastTouch.current.x;
    const deltaY = e.clientY - lastTouch.current.y;
    
    controlsState.lookDeltaX += deltaX;
    controlsState.lookDeltaY += deltaY;
    
    lastTouch.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    lastTouch.current = null;
  };

  return (
    <>
      {/* Full screen touch area for looking around */}
      <div 
        className="absolute inset-0 z-0 touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      />

      <div className="absolute bottom-10 left-0 right-0 flex justify-between px-8 pointer-events-none select-none z-10">
        {/* Movement Controls */}
        <div className="flex flex-col gap-4 pointer-events-auto">
          <button 
            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center active:bg-white/40 touch-none shadow-lg border border-white/10"
            onPointerDown={handleStart('forward')}
            onPointerUp={handleEnd('forward')}
            onPointerLeave={handleEnd('forward')}
            onContextMenu={(e) => e.preventDefault()}
          >
            <ArrowUp className="text-white" size={32} />
          </button>
          <button 
            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center active:bg-white/40 touch-none shadow-lg border border-white/10"
            onPointerDown={handleStart('backward')}
            onPointerUp={handleEnd('backward')}
            onPointerLeave={handleEnd('backward')}
            onContextMenu={(e) => e.preventDefault()}
          >
            <ArrowDown className="text-white" size={32} />
          </button>
        </div>

        {/* Look Controls (Optional now, but keeping them just in case) */}
        <div className="flex gap-4 items-end pointer-events-auto">
          <button 
            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center active:bg-white/40 touch-none shadow-lg border border-white/10"
            onPointerDown={handleStart('turnLeft')}
            onPointerUp={handleEnd('turnLeft')}
            onPointerLeave={handleEnd('turnLeft')}
            onContextMenu={(e) => e.preventDefault()}
          >
            <ArrowLeft className="text-white" size={32} />
          </button>
          <button 
            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center active:bg-white/40 touch-none shadow-lg border border-white/10"
            onPointerDown={handleStart('turnRight')}
            onPointerUp={handleEnd('turnRight')}
            onPointerLeave={handleEnd('turnRight')}
            onContextMenu={(e) => e.preventDefault()}
          >
            <ArrowRight className="text-white" size={32} />
          </button>
        </div>
      </div>
    </>
  );
}
