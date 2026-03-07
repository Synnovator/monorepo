'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@synnovator/ui';

interface FAQItem {
  q: string;
  q_en?: string;
  a: string;
  a_en?: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  lang: 'zh' | 'en';
}

function loc(lang: 'zh' | 'en', en?: string, zh?: string): string {
  if (lang === 'zh') return zh || en || '';
  return en || zh || '';
}

export function FAQAccordion({ items, lang }: FAQAccordionProps) {
  return (
    <Accordion type="multiple" className="space-y-2">
      {items.map((item, idx) => (
        <AccordionItem key={idx} value={`faq-${idx}`} className="rounded-lg border border-secondary-bg bg-dark-bg">
          <AccordionTrigger className="px-4 py-3 text-sm text-white font-medium hover:text-lime-primary transition-colors">
            {loc(lang, item.q_en, item.q)}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-sm text-muted">
            {loc(lang, item.a_en, item.a)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
