'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FormattedFAQProps {
  text: string;
}

export default function FormattedFAQ({ text }: FormattedFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Parse FAQ text with Q: / A: format
  const parseFAQ = (text: string) => {
    const lines = text.split('\n');
    const faqs: Array<{ question: string; answer: string }> = [];
    let currentQuestion = '';
    let currentAnswer: string[] = [];
    let inAnswer = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.match(/^Q:\s*/i) || trimmed.match(/^Question:\s*/i)) {
        if (currentQuestion && currentAnswer.length > 0) {
          faqs.push({
            question: currentQuestion,
            answer: currentAnswer.join('\n').trim()
          });
        }
        currentQuestion = trimmed.replace(/^Q:\s*/i, '').replace(/^Question:\s*/i, '').trim();
        currentAnswer = [];
        inAnswer = false;
      }
      else if (trimmed.match(/^A:\s*/i) || trimmed.match(/^Answer:\s*/i)) {
        inAnswer = true;
        const answerText = trimmed.replace(/^A:\s*/i, '').replace(/^Answer:\s*/i, '').trim();
        if (answerText) {
          currentAnswer.push(answerText);
        }
      }
      else if (inAnswer && trimmed) {
        currentAnswer.push(trimmed);
      }
      else if (currentQuestion && !inAnswer && trimmed) {
        currentQuestion += ' ' + trimmed;
      }
    }

    if (currentQuestion && currentAnswer.length > 0) {
      faqs.push({
        question: currentQuestion,
        answer: currentAnswer.join('\n').trim()
      });
    }

    return faqs;
  };

  const faqs = parseFAQ(text);

  if (faqs.length === 0) {
    return (
      <div className="text-gray-700 dark:text-gray-300 leading-relaxed break-words whitespace-pre-wrap" 
           style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {text}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <span className="font-semibold text-gray-900 dark:text-gray-100 pr-4">{faq.question}</span>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              )}
            </button>
            {isOpen && (
              <div className="px-6 pb-4">
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed break-words whitespace-pre-wrap"
                     style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {faq.answer}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

