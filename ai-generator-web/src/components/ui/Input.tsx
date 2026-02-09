import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, id, onFocus, ...props }, ref) => {
        // Generate a unique ID if not provided
        const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

        // Handle focus - clear zero values on focus for better mobile UX
        // This allows users to start typing immediately without having to delete 0 first
        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            if (type === 'number') {
                const value = e.target.value;
                const numValue = parseFloat(value);
                if (value === '0' || value === '0.00' || value === '0.0' || numValue === 0) {
                    // Clear the value on focus so user can type fresh
                    e.target.value = '';
                    // Also trigger a synthetic change event if there's an onChange handler
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                    if (nativeInputValueSetter) {
                        nativeInputValueSetter.call(e.target, '');
                        const inputEvent = new Event('input', { bubbles: true });
                        e.target.dispatchEvent(inputEvent);
                    }
                }
            }
            // Call the original onFocus if provided
            onFocus?.(e);
        };

        return (
            <div className="space-y-2">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        {label}
                    </label>
                )}
                <input
                    id={inputId}
                    type={type}
                    className={cn(
                        "flex h-12 w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                        className
                    )}
                    ref={ref}
                    onFocus={handleFocus}
                    {...props}
                />
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
