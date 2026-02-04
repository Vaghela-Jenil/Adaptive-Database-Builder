'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';

type Props = {
  id: string;
  children: React.ReactNode;
};

export function Droppable({ id, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const isCanvas = id === 'canvas';

  return (
    <div
      ref={setNodeRef}
      style={{
        padding: 20,
        minWidth: isCanvas ? 520 : 220,
        minHeight: 240,
        border: '2px dashed gray',
        background: isOver ? '#e0f2fe' : '#fafafa',

        /* 🔥 GRID MAGIC */
        display: isCanvas ? 'grid' : 'block',
        gridTemplateColumns: isCanvas ? 'repeat(auto, 300px)' : undefined,
        gap: isCanvas ? 12 : undefined,
        alignContent: 'start',
      }}
    >
      {children}
    </div>
  );
}
