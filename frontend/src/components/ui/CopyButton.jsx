// src/components/ui/CopyButton.jsx
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from './Button';
import { toast } from 'sonner';

export function CopyButton({ value, label = 'Copy', copiedLabel = 'Copied', size = 'sm', variant = 'ghost', className }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value ?? '');
      setCopied(true);
      toast.success(copiedLabel);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — please select and copy manually.");
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span className="hidden sm:inline">{copied ? copiedLabel : label}</span>
    </Button>
  );
}