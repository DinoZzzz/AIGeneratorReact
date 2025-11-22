import React, { useEffect } from 'react';
import { X, CheckCircle2, XCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    onClose: (id: string) => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ id, type, message, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const config = {
        success: {
            icon: <CheckCircle2 className="h-5 w-5" />,
            className: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
            iconClassName: 'text-green-600 dark:text-green-400',
        },
        error: {
            icon: <XCircle className="h-5 w-5" />,
            className: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
            iconClassName: 'text-red-600 dark:text-red-400',
        },
        info: {
            icon: <Info className="h-5 w-5" />,
            className: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
            iconClassName: 'text-blue-600 dark:text-blue-400',
        },
    };

    const { icon, className, iconClassName } = config[type];

    return (
        <div
            className={cn(
                "max-w-md w-full shadow-lg rounded-lg pointer-events-auto border overflow-hidden",
                "transform transition-all duration-300 ease-out",
                "animate-in slide-in-from-right-full",
                className
            )}
        >
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className={cn("flex-shrink-0 mt-0.5", iconClassName)}>
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-relaxed">
                            {message}
                        </p>
                    </div>
                    <button
                        className="flex-shrink-0 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        onClick={() => onClose(id)}
                        aria-label="Close notification"
                    >
                        <X className="h-4 w-4 opacity-60 hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            </div>
        </div>
    );
};
