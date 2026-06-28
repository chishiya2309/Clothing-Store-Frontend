import { useState, useEffect } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CategoryResponse } from '../../../services/category.service';

interface SortableCategoryItemProps {
  category: CategoryResponse;
  parentId: number | null;
  onEdit: (category: CategoryResponse, parentId: number | null) => void;
  onDelete: (id: number) => void;
  onOrderChange: (reorderedChildren: CategoryResponse[]) => void;
}

function SortableItem({ category, parentId, onEdit, onDelete, onOrderChange }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 99 : 'auto',
    position: 'relative' as const,
  };

  return (
    <li ref={setNodeRef} style={style} className="py-xs">
      <div className="flex items-center justify-between p-sm bg-surface-alt rounded border border-border-subtle hover:bg-surface-container-low transition-colors group">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab hover:text-primary text-text-muted p-1 touch-none">
             <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
          </div>
          <div>
            <span className="font-semibold text-text-primary">{category.name}</span>
            <span className="text-[10px] text-text-muted ml-sm">Slug: {category.slug}</span>
          </div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(category, parentId)}
            className="px-2 py-1 text-xs text-primary hover:bg-primary-container rounded transition-colors"
          >
            Sửa
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="px-2 py-1 text-xs text-error hover:bg-error-container rounded transition-colors"
          >
            Xóa
          </button>
        </div>
      </div>
      {category.children && category.children.length > 0 && (
        <div className="mt-xs">
          <SortableCategoryTree
            categories={category.children}
            parentId={category.id}
            onEdit={onEdit}
            onDelete={onDelete}
            onOrderChange={onOrderChange}
          />
        </div>
      )}
    </li>
  );
}

interface SortableCategoryTreeProps {
  categories: CategoryResponse[];
  parentId?: number | null;
  onEdit: (category: CategoryResponse, parentId: number | null) => void;
  onDelete: (id: number) => void;
  onOrderChange: (reorderedChildren: CategoryResponse[]) => void;
}

export function SortableCategoryTree({ categories, parentId = null, onEdit, onDelete, onOrderChange }: SortableCategoryTreeProps) {
  const [items, setItems] = useState<CategoryResponse[]>(categories);

  useEffect(() => {
    setItems(categories);
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        // Map to update displayOrder based on index
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          displayOrder: index,
        }));
        
        // Notify parent of order change
        onOrderChange(updatedItems);
        return updatedItems;
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="pl-lg border-l border-border-subtle flex flex-col gap-sm">
          {items.map((category) => (
            <SortableItem
              key={category.id}
              category={category}
              parentId={parentId}
              onEdit={onEdit}
              onDelete={onDelete}
              onOrderChange={onOrderChange}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
