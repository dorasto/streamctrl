import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";

interface SortableItemProps {
  id: string;
  item: any;
  isOverlayItem?: boolean;
  isLocked?: boolean;
  activeId?: string | null; // Add activeId prop
}

// SortableItem.tsx

export function SortableItem(props: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    // isDragging is less critical here now, as we use activeId for opacity
  } = useSortable({
    id: props.id,
    disabled: props.isLocked,
  });

  const isThisItemActive = props.activeId === props.id;

  const style: CSSProperties = {
    // 1. Transform & Transition: Handled by dnd-kit, usually performant
    transform: transform
      ? CSS.Transform.toString({ ...transform, x: 0 })
      : undefined,
    transition, // This comes from dnd-kit and handles the item's movement animation

    // 2. Padding/Margin/Border/Border-Radius: Generally fine, but can contribute on many elements
    padding: "var(--spacing, 8px)",
    margin: "var(--spacing, 4px) 0",
    border: "1px solid var(--border)", // Solid border, usually okay
    borderRadius: "var(--radius-sm, 4px)", // Simple border-radius, usually okay

    // 3. Background Color: Fine
    backgroundColor: props.isOverlayItem
      ? "var(--accent)"
      : props.isLocked
      ? "var(--muted)"
      : "var(--secondary)",

    // 4. Color: Fine
    color: props.isOverlayItem
      ? "var(--accent-foreground)"
      : props.isLocked
      ? "var(--muted-foreground)"
      : "var(--secondary-foreground)",

    // 5. Cursor, touchAction: Fine
    cursor: props.isLocked ? "not-allowed" : "grab",
    touchAction: "none", // Important for drag-and-drop performance

    // 6. Box Shadow: This is the MOST LIKELY CULPRIT for painting delays
    boxShadow: props.isOverlayItem ? "var(--shadow-sm)" : "none", // Only on overlay

    // 7. Z-Index: Fine
    zIndex: props.isOverlayItem ? 9999 : 0,

    // 8. Opacity: Controlled by activeId, less likely the cause unless there's a slow transition applying
    opacity: isThisItemActive && !props.isOverlayItem ? 0 : 1,

    // 9. Box Sizing, Width: Fine
    boxSizing: "border-box",
    width: "100%",
  };

  const finalListeners = props.isLocked ? {} : listeners;
  const finalAttributes = props.isLocked
    ? { role: "button", "aria-disabled": true }
    : attributes;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...finalAttributes}
      {...finalListeners}
    >
      ID: {props.item.id.substring(0, 8)}... | Name: {props.item.name} | Sort:{" "}
      {props.item.sort}
    </div>
  );
}
