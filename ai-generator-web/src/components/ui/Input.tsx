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

        // Handle focus - select all content if it's a number field with value 0
        // Use setTimeout for better mobile compatibility
        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            if (type === 'number') {
                const value = e.target.value;
                const target = e.target;
                if (value === '0' || value === '0.00' || value === '0.0' || parseFloat(value) === 0) {
                    // Use setTimeout for mobile compatibility
                    setTimeout(() => {
                        target.select();
                        // Also try setSelectionRange as fallback for some mobile browsers
                        try {
                            target.setSelectionRange(0, target.value.length);
                        } catch {
                            // setSelectionRange might not be supported for number inputs in some browsers
                        }
                    }, 0);
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
