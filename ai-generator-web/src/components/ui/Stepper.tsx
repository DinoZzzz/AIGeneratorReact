
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StepperProps {
    steps: string[];
    currentStep: number;
    onStepClick?: (step: number) => void;
}

export const Stepper = ({ steps, currentStep, onStepClick }: StepperProps) => {
    return (
        <nav aria-label="Progress" className="w-full py-4">
            <ol className="flex items-center justify-center">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isLast = index === steps.length - 1;

                    const stepContent = (
                        <>
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 font-semibold z-10 bg-background",
                                    isCompleted ? "bg-primary border-primary text-primary-foreground" :
                                        isCurrent ? "border-primary text-primary" :
                                            "border-muted-foreground/30 text-muted-foreground"
                                )}
                                aria-hidden="true"
                            >
                                {isCompleted ? <Check className="w-6 h-6" /> : index + 1}
                            </div>
                            <div className={cn(
                                "absolute top-12 text-xs font-medium whitespace-nowrap transition-colors duration-200",
                                isCurrent ? "text-primary" : "text-muted-foreground"
                            )}>
                                {step}
                            </div>
                        </>
                    );

                    return (
                        <li key={step} className="flex items-center">
                            {onStepClick ? (
                                <button
                                    type="button"
                                    className={cn(
                                        "relative flex flex-col items-center group cursor-pointer"
                                    )}
                                    onClick={() => onStepClick(index)}
                                    aria-current={isCurrent ? 'step' : undefined}
                                    aria-label={`${step} (${isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'})`}
                                >
                                    {stepContent}
                                </button>
                            ) : (
                                <div
                                    className="relative flex flex-col items-center group"
                                    aria-current={isCurrent ? 'step' : undefined}
                                >
                                    {stepContent}
                                </div>
                            )}
                            {!isLast && (
                                <div
                                    className={cn(
                                        "w-24 h-0.5 mx-2 transition-colors duration-200",
                                        index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                                    )}
                                    aria-hidden="true"
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
