/**
 * KOLOR Framework — Notice (quiet confirm card)
 *
 * Extracted in iter 280-refactor. Encapsulates the framework's "quiet
 * completion" moment: Slate-tint background, hairline border, Fraunces
 * italic title, mono UPPERCASE metadata.
 *
 * Used across celebration surfaces where the framework voice is
 * "quiet-confident, not bright-jubilant."
 *
 * Framework Part 8.2 (voice): quiet-confident register.
 * Framework Move 1 (money): Fraunces + mono pairing pattern.
 * iter 280d rationale: KOLOR celebrates quietly.
 */

import React from 'react';

interface FrameworkNoticeProps {
  /** Fraunces italic title (e.g., "Payment received.") */
  title: string;
  /** Mono UPPERCASE metadata rendered below title (optional) */
  metadata?: string;
  /** Icon element rendered left of title (icon stands alone, no colored box) */
  icon?: React.ReactNode;
  /** Optional container className override */
  className?: string;
  /** Optional test ID */
  'data-testid'?: string;
}

export function FrameworkNotice({
  title,
  metadata,
  icon,
  className = '',
  'data-testid': testId,
}: FrameworkNoticeProps) {
  return (
    <div
      className={`rounded-xl p-6 border flex items-center gap-4 ${className}`}
      style={{
        background: 'var(--kolor-slate-tint)',
        borderColor: 'var(--kolor-slate)',
        borderStyle: 'solid',
        borderWidth: '1px',
      }}
      data-testid={testId}
    >
      {icon && (
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: '32px', height: '32px' }}
        >
          {icon}
        </div>
      )}
      <div>
        <h3
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 400,
            fontStyle: 'italic',
            fontSize: '18px',
            lineHeight: 1.2,
            color: 'var(--kolor-ink)',
          }}
        >
          {title}
        </h3>
        {metadata && (
          <p
            className="uppercase"
            style={{
              fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.24em',
              color: 'var(--kolor-ink-subtle)',
              marginTop: '6px',
            }}
          >
            {metadata}
          </p>
        )}
      </div>
    </div>
  );
}
