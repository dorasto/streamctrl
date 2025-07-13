import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import { cn } from "~/lib/utils";

interface SortableItemProps {
  id: string;
  item: any;
  isOverlayItem?: boolean;
  isLocked?: boolean;
  activeId?: string | null; // Add activeId prop
  onClick?: React.MouseEventHandler<HTMLDivElement>;
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
  };

  const finalListeners = props.isLocked ? {} : listeners;
  const finalAttributes = props.isLocked
    ? { role: "button", "aria-disabled": true }
    : attributes;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-2 my-1 border rounded-sm w-full box-border touch-none",
        // Style for the overlay item when dragging
        props.isOverlayItem &&
          "bg-secondary text-secondary-foreground shadow-sm z-[9999]",
        // Style for a locked item
        props.isLocked && "bg-muted text-muted-foreground cursor-not-allowed",
        // Default style for a draggable item
        !props.isOverlayItem &&
          !props.isLocked &&
          "bg-muted text-muted-foreground cursor-grab",
        // Style to hide the original item while dragging
        isThisItemActive && !props.isOverlayItem && "opacity-0"
      )}
      {...finalAttributes}
      {...finalListeners}
      onClick={props?.onClick}
    >
      ID: {props.item.id.substring(0, 8)}... | Name: {props.item.name} | Sort:{" "}
      {props.item.sort}
    </div>
  );
}
