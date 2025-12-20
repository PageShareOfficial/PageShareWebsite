interface CodeTitleProps {
  title: string;
  children: React.ReactNode;
}

export function CodeTitle({ title, children }: CodeTitleProps) {
  return (
    <div className="my-6">
      <div className="bg-white/5 border border-white/10 border-b-0 px-4 py-2 text-sm font-mono">
        {title}
      </div>
      <div className="bg-white/5 border border-white/10 p-4 overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

