'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRef } from 'react';

type Props = {
  id: string;
  span: number;
  onResize: (id: string, span: number) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
  children: React.ReactNode;
};

const COL_WIDTH = 150;
const MAX_COLS = 3;

export default function SortableItem({
  id,
  span,
  onResize,
  onDelete,
  onEdit,
  children,
}: Props) {
  const { attributes, listeners, setNodeRef, transform } =
    useSortable({ id });

  const startX = useRef(0);
  const startSpan = useRef(span);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
    gridColumn: `span ${span}`,
  };

  const beginResize = (
    e: React.MouseEvent,
    dir: 'left' | 'right'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    startX.current = e.clientX;
    startSpan.current = span;

    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - startX.current;
      const delta = dx / COL_WIDTH;

      let next =
        dir === 'right'
          ? startSpan.current + delta
          : startSpan.current - delta;

      next = Math.max(1, Math.min(MAX_COLS, Math.round(next)));
      onResize(id, next);
    };

    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  return (
<div
  ref={setNodeRef}
  style={style}
  className="
    group
    relative
    rounded-xl
    border
    border-border
    bg-background
    p-2
    shadow-sm
    hover:shadow-md
    transition-all
  "
>
  {/* EDIT + DELETE (top-right overlay) */}
  <div className="absolute top-1 right-1 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition">
    <button
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-primary"
    >
      ✏️
    </button>

    <button
  onClick={(e) => {
    e.stopPropagation();
    onDelete(id);
  }}
  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-red-500"
>
  🗑️
</button>

  </div>

  {/* FIELD BODY (drag handle) */}
  <div
    {...attributes}
    {...listeners}
    className="
      flex
      items-center
      justify-center
      min-h-12
      rounded-md
      border
      border-dashed
      border-muted
      bg-muted/30
      text-sm
      font-medium
      cursor-grab
      select-none
      hover:bg-muted/40
      transition
    "
  >
    {children}
  </div>

  {/* LEFT RESIZE */}
  <div
    onMouseDown={(e) => beginResize(e, 'left')}
    className="
      absolute
      left-0
      top-0
      h-full
      w-1.5
      cursor-ew-resize
      opacity-0
      group-hover:opacity-100
      hover:bg-primary/20
      transition
    "
  />

  {/* RIGHT RESIZE */}
  <div
    onMouseDown={(e) => beginResize(e, 'right')}
    className="
      absolute
      right-0
      top-0
      h-full
      w-1.5
      cursor-ew-resize
      opacity-0
      group-hover:opacity-100
      hover:bg-primary/20
      transition
    "
  />
</div>

  );
}
