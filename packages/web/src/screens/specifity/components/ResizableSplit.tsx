// ResizableSplit — resizable split layout (перетаскиваемый разделитель)
// Тикет №59 — Specifity: спецификация

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface ResizableSplitProps {
  left: ReactNode;
  right: ReactNode;
  initialLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
}

export function ResizableSplit({
  left,
  right,
  initialLeftWidth = 380,
  minLeftWidth = 280,
  maxLeftWidth = 600,
}: ResizableSplitProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startWidth: leftWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [leftWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const newWidth = Math.max(
        minLeftWidth,
        Math.min(maxLeftWidth, dragRef.current.startWidth + dx)
      );
      setLeftWidth(newWidth);
    };

    const onMouseUp = () => {
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [minLeftWidth, maxLeftWidth]);

  return (
    <div className="spec-split" ref={containerRef}>
      <div className="spec-split__left" style={{ width: `${leftWidth}px`, flexShrink: 0 }}>
        {left}
      </div>
      <div className="spec-split__handle" onMouseDown={onMouseDown} />
      <div className="spec-split__right" style={{ flex: 1, minWidth: 0 }}>
        {right}
      </div>
    </div>
  );
}
