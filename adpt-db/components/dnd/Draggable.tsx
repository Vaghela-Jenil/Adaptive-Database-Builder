'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

type Props = {
    id: string;
    children: React.ReactNode;
};

export function Draggable({ id, children }: Props) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="
            rounded-lg
            bg-primary
            text-white
            p-3
            shadow
            hover:shadow-lg
            transition
            cursor-grab
            active:scale-95
            "
            suppressHydrationWarning
        >
            {children}
        </div>
    );
}
