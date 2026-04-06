import { useCopy } from '../hooks/useCopy';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  /** 'link' = small text with color feedback (default) | 'button' = keeps your className colors, just changes label */
  variant?: 'link' | 'button';
}

export function CopyButton({ text, label = 'copy', className = '', variant = 'link' }: CopyButtonProps) {
  const { copy, copied } = useCopy();

  const colorClass = variant === 'link'
    ? copied ? 'text-green-600 font-medium' : 'text-gray-400 hover:text-blue-600'
    : '';

  return (
    <button
      onClick={() => copy(text)}
      className={`transition-colors ${colorClass} ${className}`}
    >
      {copied ? '✓ Đã copy' : label}
    </button>
  );
}
