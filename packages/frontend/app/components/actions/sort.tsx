import { useEffect, useState } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./item"; // Assuming './item' is where SortableItem is located

export default function SortActions({
  _actions,
  mutate,
}: {
  _actions: any[];
  mutate: ((newValue: any, options?: any) => void) | undefined;
}) {
  const [actions, setActions] = useState<any[]>([]);
  useEffect(() => {
    setActions(_actions);
  }, [_actions]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeItem = activeId
    ? actions.find((item) => item.id === activeId)
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = actions.findIndex((item) => item.id === active.id);
      const newIndex = actions.findIndex((item) => item.id === over.id);
      const movedItems = arrayMove(actions, oldIndex, newIndex);
      const newOrderedItemsWithSortOrder = movedItems.map((item, index) => ({
        ...item,
        sort: index + 1,
      }));
      setActions(newOrderedItemsWithSortOrder);
      mutate?.(newOrderedItemsWithSortOrder);
    }
    setActiveId(null);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        style={{
          padding: "var(--spacing, 20px)",
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        <SortableContext items={actions} strategy={verticalListSortingStrategy}>
          <div
            style={{
              border: "1px dashed var(--border)",
              padding: "var(--spacing, 10px)",
              borderRadius: "var(--radius-sm, 4px)",
              backgroundColor: "var(--card)",
            }}
          >
            {actions.map((item) => (
              <SortableItem key={item.id} id={item.id} item={item} />
            ))}
          </div>
        </SortableContext>
      </div>
      <DragOverlay>
        {activeItem ? (
          <SortableItem item={activeItem} id={activeItem.id} isOverlayItem />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
