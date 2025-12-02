"use client";

import { useState } from "react";

type CopyButtonProps = {
  text: string;
  label?: string;
};

export function CopyButton({ text, label = "Copy URL" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Unable to copy automatically. Long-press the link to copy.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
