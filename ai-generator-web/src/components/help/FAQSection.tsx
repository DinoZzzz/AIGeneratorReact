import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FAQCategory } from './faqData';

interface FAQSectionProps {
    faqCategories: FAQCategory[];
    language: string;
    onSwitchToSupport: () => void;
    t: (key: string) => string;
}

export const FAQSection = ({ faqCategories, language, onSwitchToSupport, t }: FAQSectionProps) => {
    const [openCategories, setOpenCategories] = useState<Set<number>>(new Set([0]));
    const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

    const toggleCategory = (index: number) => {
        const newOpen = new Set(openCategories);
        if (newOpen.has(index)) {
            newOpen.delete(index);
        } else {
            newOpen.add(index);
        }
        setOpenCategories(newOpen);
    };

    const toggleQuestion = (id: string) => {
        const newOpen = new Set(openQuestions);
        if (newOpen.has(id)) {
            newOpen.delete(id);
        } else {
            newOpen.add(id);
        }
        setOpenQuestions(newOpen);
    };

    return (
        <>
            <div className="space-y-4">
                {faqCategories.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="bg-card border border-border rounded-lg shadow">
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(categoryIndex)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="text-primary">
                                    {category.icon}
                                </div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {category.title}
                                </h2>
                            </div>
                            {openCategories.has(categoryIndex) ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                        </button>

                        {/* Category Content */}
                        {openCategories.has(categoryIndex) && (
                            <div className="border-t border-border">
                                {category.items.map((item, itemIndex) => {
                                    const questionId = `${categoryIndex}-${itemIndex}`;
                                    const isOpen = openQuestions.has(questionId);

                                    return (
                                        <div key={itemIndex} className="border-b border-border last:border-b-0">
                                            <button
                                                onClick={() => toggleQuestion(questionId)}
                                                className="w-full px-6 py-4 text-left hover:bg-muted/30 transition-colors flex items-center justify-between"
                                            >
                                                <span className="font-medium text-foreground pr-4">
                                                    {item.question}
                                                </span>
                                                {isOpen ? (
                                                    <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                )}
                                            </button>
                                            {isOpen && (
                                                <div className="px-6 py-4 bg-muted/20">
                                                    <div className="text-muted-foreground whitespace-pre-line">
                                                        {item.answer}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Contact Support */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                    {language === 'hr' ? 'Trebate dodatnu pomoć?' : 'Need Additional Help?'}
                </h3>
                <p className="text-muted-foreground mb-4">
                    {language === 'hr'
                        ? 'Ako niste pronašli odgovor na svoje pitanje, pošaljite nam zahtjev za podršku.'
                        : 'If you haven\'t found the answer to your question, send us a support request.'}
                </p>
                <button
                    onClick={onSwitchToSupport}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    {t('help.tabs.support')}
                </button>
            </div>
        </>
    );
};
