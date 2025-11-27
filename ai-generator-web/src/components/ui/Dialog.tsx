import * as React from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0" onClick={() => onOpenChange(false)} />
            {children}
        </div>
    );
};

export const DialogContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div
            className={cn(
                "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg h-full sm:h-auto overflow-y-auto rounded-t-xl sm:rounded-t-lg animate-scale-in",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    onClose?: () => void;
}

export const DialogHeader = ({ className, onClose, children, ...props }: DialogHeaderProps) => {
    return (
        <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left relative", className)} {...props}>
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute -top-2 -right-2 sm:top-0 sm:right-0 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Close dialog"
                >
                    <X className="h-5 w-5" />
                </button>
            )}
            {children}
        </div>
    );
};

export const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    return (
        <h2 className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)} {...props} />
    );
};

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
    );
};
