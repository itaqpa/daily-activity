import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Maximize2, Image as ImageIcon, Download } from 'lucide-react';

export default function ImageZoomModal({ isOpen, onClose, imageUrl, label }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset state saat modal dibuka atau gambar berganti
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setIsDragging(false);
    }
  }, [isOpen, imageUrl]);

  // Listener tombol Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setScale(prev => Math.min(Number((prev + 0.3).toFixed(1)), 5));
  const handleZoomOut = () => setScale(prev => Math.max(Number((prev - 0.3).toFixed(1)), 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleDoubleClick = () => {
    if (scale > 1.2) {
      handleReset();
    } else {
      setScale(2);
    }
  };

  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support untuk Smartphone & Tablet
  const handleTouchStart = (e) => {
    if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[92vh] sm:h-[88vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-gray-800"
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 bg-gray-900/95 border-b border-gray-800 text-white shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold truncate text-gray-200">
              {label ? `Panduan: ${label}` : 'Pratinjau Foto Panduan'}
            </span>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-gray-800 rounded-lg p-0.5 border border-gray-700 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                title="Perkecil (-)"
                className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded disabled:opacity-40 transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="Klik untuk reset zoom (100%)"
                className="px-2 py-0.5 font-mono text-[11px] font-bold text-blue-400 hover:text-blue-300 min-w-[44px] text-center"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 5}
                title="Perbesar (+)"
                className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded disabled:opacity-40 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rotate Button */}
            <button
              type="button"
              onClick={handleRotate}
              title="Putar 90° (Rotate)"
              className="p-1.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              title="Reset Tampilan (100%)"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-xs transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Reset</span>
            </button>

            {/* Buka Tab Baru / Download */}
            {imageUrl && !imageUrl.startsWith('data:') && (
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                title="Buka Gambar Resolusi Penuh"
                className="hidden sm:inline-flex p-1.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="Tutup (Esc)"
              className="p-1.5 bg-gray-800/90 border border-gray-700 hover:bg-red-600 hover:border-red-500 text-gray-300 hover:text-white rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas (Interactive Zoom & Pan) */}
        <div
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDoubleClick={handleDoubleClick}
          className={`flex-1 overflow-hidden relative flex items-center justify-center bg-gray-950 ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
        >
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out'
            }}
            className="flex items-center justify-center origin-center select-none"
          >
            <img
              src={imageUrl}
              alt="Foto Panduan Detail"
              draggable={false}
              className="max-h-[78vh] sm:max-h-[75vh] w-auto max-w-full object-contain pointer-events-none drop-shadow-md rounded"
            />
          </div>

          {/* Hint Overlay di Bawah */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] sm:text-[11px] text-gray-300 pointer-events-none flex items-center gap-2">
            <span>Scroll mouse / cubit untuk zoom ({Math.round(scale * 100)}%)</span>
            {scale > 1 && <span>• Klik & geser untuk menggeser</span>}
            <span>• Dobel-klik untuk reset</span>
          </div>
        </div>
      </div>
    </div>
  );
}
