interface PredictionFormSectionProps {
  step: number;
  title: string;
  children: React.ReactNode;
}

export default function PredictionFormSection({
  step,
  title,
  children,
}: PredictionFormSectionProps) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md bg-white/10 text-xs font-semibold text-white">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}
