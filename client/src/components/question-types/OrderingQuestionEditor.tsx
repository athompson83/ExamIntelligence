import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface OrderingItem {
  id: string;
  text: string;
  correctOrder: number;
}

interface OrderingQuestionEditorProps {
  items: OrderingItem[];
  onChange: (items: OrderingItem[]) => void;
}

function SortableItem({ id, text, onTextChange, onRemove }: {
  id: string;
  text: string;
  onTextChange: (text: string) => void;
  onRemove: () => void;
}) {
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      <Input
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Enter item text..."
        className="flex-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-red-500 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function OrderingQuestionEditor({ items, onChange }: OrderingQuestionEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      // Update correct order based on new positions
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        correctOrder: index + 1,
      }));
      
      onChange(updatedItems);
    }
  };

  const addItem = () => {
    const newItem: OrderingItem = {
      id: `item-${Date.now()}`,
      text: "",
      correctOrder: items.length + 1,
    };
    onChange([...items, newItem]);
  };

  const removeItem = (itemId: string) => {
    const filteredItems = items.filter((item) => item.id !== itemId);
    // Reorder remaining items
    const reorderedItems = filteredItems.map((item, index) => ({
      ...item,
      correctOrder: index + 1,
    }));
    onChange(reorderedItems);
  };

  const updateItemText = (itemId: string, text: string) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, text } : item
    );
    onChange(updatedItems);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ordering Question Setup</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Students will drag and drop items to put them in the correct order. 
          Arrange the items below in the correct order.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Items to Order</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item) => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  text={item.text}
                  onTextChange={(text) => updateItemText(item.id, text)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No items added yet. Click "Add Item" to start building your ordering question.
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Instructions:</strong> Drag items to reorder them. The current order will be the correct answer.
            Students will see the items in a randomized order and need to arrange them correctly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}