import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    className?: string;
    dragHandleClassName?: string;
    showDragHandle?: boolean;
}

export const SortableItem: React.FC<SortableItemProps> = ({
    id,
    children,
    className,
    dragHandleClassName,
    showDragHandle = true,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'relative',
                isDragging && 'z-50',
                className
            )}
        >
            {showDragHandle && (
                <div
                    {...attributes}
                    {...listeners}
                    className={cn(
                        'absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none',
                        'text-muted-foreground hover:text-foreground transition-colors',
                        dragHandleClassName
                    )}
                >
                    <GripVertical className="h-5 w-5" />
                </div>
            )}
            <div className={showDragHandle ? 'pl-8' : ''}>
                {children}
            </div>
        </div>
    );
};
