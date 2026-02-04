'use client';

import React, { useEffect, useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    pointerWithin,
    closestCorners,
    CollisionDetection,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { DragOverlay } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Droppable } from './Droppable';
import SortableItem from './SortableItem';
import Sidebar from './Sidebar';
import EditPanel from './EditFieldModal';

type Item = {
    id: string;
    label: string;
    span: number;
};

const STORAGE_KEY = 'canvas-items';

const sourceItems: Item[] = [
    { id: 'text', label: 'Text Field', span: 1 },
    { id: 'number', label: 'Number Field', span: 1 },
    { id: 'email', label: 'Email Field', span: 1 },
    { id: 'password', label: 'Password Field', span: 1 },
    { id: 'date', label: 'Date Field', span: 1 },
    { id: 'checkbox', label: 'Checkbox Field', span: 1 },
    { id: 'radio', label: 'Radio Button Field', span: 1 },
    { id: 'select', label: 'Select Field', span: 1 },
];


export default function Example() {
    const [canvasItems, setCanvasItems] = useState<Item[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<Item | null>(null);


    /* -------------------- LOAD / SAVE -------------------- */
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setCanvasItems(JSON.parse(stored));
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(canvasItems));
    }, [canvasItems]);

    /* -------------------- DRAG END -------------------- */
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const isCanvasItem = canvasItems.some((i) => i.id === activeId);

        /* 🔹 REORDER inside builder */
        if (isCanvasItem && canvasItems.some((i) => i.id === overId)) {
            setCanvasItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === activeId);
                const newIndex = items.findIndex((i) => i.id === overId);
                return arrayMove(items, oldIndex, newIndex);
            });
            return;
        }

        /* 🔹 CLONE from sidebar → builder */
        if (overId === 'builder') {
            const template = sourceItems.find((i) => i.id === activeId);
            if (!template) return;

            setCanvasItems((prev) => [
                ...prev,
                {
                    id: `${template.id}-${crypto.randomUUID()}`,
                    label: template.label,
                    span: template.span,
                },
            ]);
        }
    }

    function handleResize(id: string, newSpan: number) {
        setCanvasItems((items) =>
            items.map((item) =>
                item.id === id ? { ...item, span: newSpan } : item
            )
        );
    }

    function handleDelete(id: string) {
        setCanvasItems((items) => items.filter((item) => item.id !== id));
    }

    /* -------------------- COLLISION -------------------- */
    const canvasCollisionDetection: CollisionDetection = (args) => {
        const pointerHits = pointerWithin(args);
        if (pointerHits.length > 0) return pointerHits;
        return closestCorners(args);
    };

    /* -------------------- RENDER -------------------- */
    return (
        <div className="h-screen overflow-hidden">
            <DndContext
                collisionDetection={canvasCollisionDetection}
                onDragStart={(e) => setActiveId(e.active.id as string)}
                onDragCancel={() => setActiveId(null)}
                onDragEnd={(event) => {
                    handleDragEnd(event);
                    setActiveId(null);
                }}
            >
                <div className="flex h-screen gap-4 p-4">

                    {/* SIDEBAR */}
                    <Sidebar />

                    {/* 🔧 BUILDER */}
                    <Droppable id="builder">
                        <Card className="w-[320px] p-4 flex flex-col h-full overflow-y-auto scrollbar-hide">
                            <h3 className="font-semibold mb-4">Builder</h3>

                            <SortableContext
                                items={canvasItems.map((i) => i.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {canvasItems.length === 0 && (
                                    <div className="text-sm text-muted-foreground">
                                        Drop fields here
                                    </div>
                                )}

                                {canvasItems.map((item) => (
                                    <SortableItem
                                        key={item.id}
                                        id={item.id}
                                        span={item.span}
                                        onResize={handleResize}
                                        onDelete={() => handleDelete(item.id)}
                                        onEdit={() => setEditingItem(item)}
                                    >
                                        {item.label}
                                    </SortableItem>
                                ))}
                            </SortableContext>
                        </Card>
                    </Droppable>

                    {/* Preview */}
                    <Card className="min-w-80 flex-1 p-4 h-full overflow-y-auto scrollbar-hide">
                        <h3 className="font-semibold mb-4">Preview</h3>

                        <div className="grid grid-cols-3 gap-4 auto-rows-min">
                            {canvasItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`
          rounded-md
          border
          bg-background
          p-3
          text-sm
          min-h-12
          flex items-center
          justify-center
        `}
                                    style={{
                                        gridColumn: `span ${item.span}`,
                                    }}
                                >
                                    {/* ShadCN Input field */}
                                    <input
                                        type="text"
                                        className="w-full border border-muted rounded px-2 py-1"
                                        placeholder={item.label}
                                        readOnly
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>


                </div>
                {editingItem && (
                    <EditPanel
                        open={true}
                        label={editingItem.label}
                        span={editingItem.span}
                        onClose={() => setEditingItem(null)}
                        onSave={(label, span) => {
                            setCanvasItems((items) =>
                                items.map((i) =>
                                    i.id === editingItem.id ? { ...i, label, span } : i
                                )
                            );
                            setEditingItem(null);
                        }}
                    />
                )}


                {/* DRAG OVERLAY */}
                <DragOverlay dropAnimation={{
                    duration: 220,
                    easing: 'cubic-bezier(0.22,1,0.36,1)',
                }}>
                    {activeId ? (
                        <Card className="w-40 p-3 shadow-xl opacity-90">
                            {sourceItems.find((f) => activeId.includes(f.id))?.label || 'Field'}
                        </Card>
                    ) : null}
                </DragOverlay>

            </DndContext>
        </div>
    );
}
