'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PLAN_FAQS, type PlanFaqItem } from './planFaqs';

function FaqItem({
  item,
  isOpen,
  onToggle,
}: {
  item: PlanFaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-3 py-3.5 text-left"
      >
        <span className="text-base sm:text-lg font-medium text-white leading-snug">
          {item.question}
        </span>
        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {isOpen ? (
        <p className="pb-3.5 pr-6 text-sm sm:text-base text-gray-400 leading-relaxed">
          {item.answer}
        </p>
      ) : null}
    </div>
  );
}

export default function PlansFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section className="mb-4" aria-labelledby="plans-faq-heading">
      <h2
        id="plans-faq-heading"
        className="text-base sm:text-lg font-semibold text-white mb-3 tracking-wide"
      >
        Frequently Asked Questions
      </h2>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 sm:px-5">
        {PLAN_FAQS.map((item, index) => (
          <FaqItem
            key={item.question}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>
    </section>
  );
}
