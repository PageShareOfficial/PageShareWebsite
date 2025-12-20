interface CalloutProps {
  title?: string;
  type?: "note" | "warning" | "tip";
  children: React.ReactNode;
}

export function Callout({ title, type = "note", children }: CalloutProps) {
  const borderWidth = type === "warning" ? "4px" : "2px";
  const opacity = type === "warning" ? "0.5" : "0.2";

  return (
    <div
      className="my-8 p-6 border-l"
      style={{
        borderLeftWidth: borderWidth,
        borderColor: `rgba(255, 255, 255, ${opacity})`,
        backgroundColor: "rgba(255, 255, 255, 0.02)",
      }}
    >
      {title && (
        <div className="font-bold mb-2 uppercase text-sm tracking-wider">
          {title}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

