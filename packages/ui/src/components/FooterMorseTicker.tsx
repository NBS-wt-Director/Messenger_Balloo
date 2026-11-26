// FooterMorseTicker — морзе-тикер подвала (тикет 1795677854).
//
// Требование владельца (26.11.2026): точки в подвале бежат ОТ КРАЁВ К ЦЕНТРУ
// и кодируют азбукой Морзе текст: точка = короткий импульс, тире = длинный,
// пауза между буквами, большая пауза между словами.
//
// Направление: `ltr` — левый тикер (движение вправо, к центру),
// `rtl` — правый тикер (движение влево, к центру).
// `prefers-reduced-motion` — статичный паттерн без анимации (CSS).

import React, { useMemo } from 'react';
import { toMorse } from '../lib/morse';

export interface FooterMorseTickerProps {
  /** Текст, который проигрывается морзе-паттерном */
  text: string;
  /** 'ltr' — от левого края к центру; 'rtl' — от правого края к центру */
  direction: 'ltr' | 'rtl';
  /** 'emergency' — красный (ЧС, MVP2) */
  variant?: 'default' | 'emergency';
}

type Cell = 'dot' | 'dash' | 'gap' | 'wordgap';

/** Морзе-строка → последовательность ячеек для рендера. */
function buildCells(morse: string): Cell[] {
  const cells: Cell[] = [];
  for (const char of morse) {
    if (char === '.') cells.push('dot');
    else if (char === '-') cells.push('dash');
    else if (char === '/') cells.push('wordgap');
    else if (char === ' ') cells.push('gap');
  }
  return cells;
}

/** Секунды на один прогон паттерна: масштабируется от длины. */
function durationFor(cells: Cell[]): number {
  const units = cells.reduce(
    (acc, c) => acc + (c === 'dot' ? 1 : c === 'dash' ? 3 : c === 'gap' ? 1 : 4),
    0
  );
  // ~0.09 с на «тик» — читаемый темп без слишком длинного цикла
  return Math.min(24, Math.max(6, units * 0.09));
}

export function FooterMorseTicker({ text, direction, variant = 'default' }: FooterMorseTickerProps) {
  const cells = useMemo(() => buildCells(toMorse(text)), [text]);
  const duration = useMemo(() => durationFor(cells), [cells]);

  if (cells.length === 0) return null;

  const className = [
    'balloo-footer__ticker',
    `balloo-footer__ticker--${direction}`,
    variant === 'emergency' ? 'balloo-footer__ticker--emergency' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    // Обёртка держит подсказку расшифровки (тик. 1795721513): сам тикер имеет
    // overflow: hidden, поэтому тултип живёт рядом с ним, а не внутри.
    <span className="balloo-footer__ticker-wrap">
      <span className={className} aria-hidden="true" title={text}>
        {/* Два одинаковых прогона — бесшовная петля (translateX на 50%) */}
        <span
          className="balloo-footer__ticker-track"
          style={{ animationDuration: `${duration.toFixed(2)}s` }}
        >
          {[0, 1].map((copy) => (
            <span className="balloo-footer__ticker-run" key={copy}>
              {cells.map((cell, i) => (
                <i key={i} className={`balloo-footer__morse balloo-footer__morse--${cell}`} />
              ))}
            </span>
          ))}
        </span>
      </span>
      <span className="balloo-footer__morse-tip" role="tooltip">
        {text}
      </span>
    </span>
  );
}
