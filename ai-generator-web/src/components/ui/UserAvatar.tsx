import * as React from "react";
import { cn } from "../../lib/utils";
import {
    User,
    Ghost,
    Cat,
    Dog,
    Bird,
    Fish,
    Rabbit,
    Squirrel,
    Turtle,
    Bug,
    Flower2,
    TreeDeciduous,
    Mountain,
    Waves,
    Sun,
    Moon,
    Star,
    Heart,
    Diamond,
    Crown,
} from "lucide-react";

const AVATAR_ICONS = [
    User,
    Ghost,
    Cat,
    Dog,
    Bird,
    Fish,
    Rabbit,
    Squirrel,
    Turtle,
    Bug,
    Flower2,
    TreeDeciduous,
    Mountain,
    Waves,
    Sun,
    Moon,
    Star,
    Heart,
    Diamond,
    Crown,
];

const AVATAR_COLORS = [
    "bg-red-100 text-red-600",
    "bg-orange-100 text-orange-600",
    "bg-amber-100 text-amber-600",
    "bg-yellow-100 text-yellow-600",
    "bg-lime-100 text-lime-600",
    "bg-green-100 text-green-600",
    "bg-emerald-100 text-emerald-600",
    "bg-teal-100 text-teal-600",
    "bg-cyan-100 text-cyan-600",
    "bg-sky-100 text-sky-600",
    "bg-blue-100 text-blue-600",
    "bg-indigo-100 text-indigo-600",
    "bg-violet-100 text-violet-600",
    "bg-purple-100 text-purple-600",
    "bg-fuchsia-100 text-fuchsia-600",
    "bg-pink-100 text-pink-600",
    "bg-rose-100 text-rose-600",
];

// Generate a consistent random index based on a string (user id, email, or name)
function getHashIndex(str: string, max: number): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % max;
}

export interface UserAvatarProps {
    src?: string | null;
    name?: string | null;
    email?: string | null;
    id?: string | null;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
}

const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-32 w-32",
};

const iconSizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-16 w-16",
};

export function UserAvatar({
    src,
    name,
    email,
    id,
    size = "md",
    className,
}: UserAvatarProps) {
    // Use id, email, or name as seed for consistent random icon/color
    const seed = id || email || name || "default";
    const iconIndex = getHashIndex(seed, AVATAR_ICONS.length);
    const colorIndex = getHashIndex(seed + "color", AVATAR_COLORS.length);

    const IconComponent = AVATAR_ICONS[iconIndex];
    const colorClass = AVATAR_COLORS[colorIndex];

    if (src) {
        return (
            <div
                className={cn(
                    "rounded-full overflow-hidden flex-shrink-0",
                    sizeClasses[size],
                    className
                )}
            >
                <img
                    src={src}
                    alt={name || "Profile"}
                    className="h-full w-full object-cover"
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "rounded-full flex items-center justify-center flex-shrink-0",
                sizeClasses[size],
                colorClass,
                className
            )}
        >
            <IconComponent className={iconSizeClasses[size]} />
        </div>
    );
}
