interface DotTypingProps {
  className?: string;
}

export function DotTyping({ className = "" }: DotTypingProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></div>
    </div>
  );
}