// app/businesses/[slug]/BusinessFaqSection.tsx
'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Faq {
  question: string;
  answer: string;
}

interface BusinessFaqSectionProps {
  name: string;
  faqs: Faq[];
}

export default function BusinessFaqSection({ name, faqs }: BusinessFaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (faqs.length === 0) return null;

  return (
    <section aria-labelledby="faq-heading" className="scroll-mt-8">
      <h2 id="faq-heading" className="text-xl font-bold text-gray-900 mb-5">
        Frequently Asked Questions — {name} Business
      </h2>

      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
                id={`faq-question-${i}`}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-900 leading-snug">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              <div
                id={`faq-answer-${i}`}
                role="region"
                aria-labelledby={`faq-question-${i}`}
                hidden={!isOpen}
              >
                {isOpen && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}