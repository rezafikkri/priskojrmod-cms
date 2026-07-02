import { CircleQuestionMark } from 'lucide-react';

export default function HelpIcon({ size = 14, ...props }) {
  return (
    <CircleQuestionMark
      {...props}
      size={size}
      className="inline-block cursor-help text-zinc-400 dark:text-zinc-600"
    />
  );
}
