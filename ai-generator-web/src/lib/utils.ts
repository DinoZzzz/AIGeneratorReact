import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Stable callback ref that moves focus to an element when it mounts.
 * Use instead of the autoFocus attribute on inputs that appear in response
 * to a user action (e.g. inline edit forms), where shifting focus is
 * deliberate focus management rather than a page-load focus steal.
 */
export const focusOnMount = (el: HTMLElement | null) => {
    el?.focus()
}
