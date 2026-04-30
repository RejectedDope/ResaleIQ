'use client';

import { useState } from 'react';

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      className="bg-white px-3 py-2 text-xs font-extrabold text-ink hover:bg-ivory"
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
