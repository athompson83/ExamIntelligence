import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface SortableItem {
  id: string;
  text: string;
  correctPosition: number;
}

interface SortingQuestionEditorProps {
  items: SortableItem[];
  onChange: (items: SortableItem[]) => void;
  sortingCriteria?: string;
  onCriteriaChange?: (criteria: string) => void;
  sortingType?: 'alphabetical' | 'numerical' | 'chronological' | 'custom';
  onSortingTypeChange?: (type: 'alphabetical' | 'numerical' | 'chronological' | 'custom') => void;
}

function SortableDragItem({ id, text, onTextChange, onRemove, index, canRemove }: {
  id: string;
  text: string;
  onTextChange: (text: string) => void;
  onRemove: () => void;
  index: number;
  canRemove: boolean;
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
      className={`flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full flex items-center justify-center text-sm font-medium">
          {index + 1}
        </div>
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      <div className="flex-1">
        <Input
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Enter item to be sorted..."
          className="w-full"
        />
      </div>
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function SortingQuestionEditor({ 
  items, 
  onChange, 
  sortingCriteria = "",
  onCriteriaChange,
  sortingType = 'custom',
  onSortingTypeChange
}: SortingQuestionEditorProps) {
  
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
      
      // Update correct positions based on new order
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        correctPosition: index + 1,
      }));
      
      onChange(updatedItems);
    }
  };

  const addItem = () => {
    const newItem: SortableItem = {
      id: `item-${Date.now()}`,
      text: "",
      correctPosition: items.length + 1,
    };
    onChange([...items, newItem]);
  };

  const removeItem = (itemId: string) => {
    if (items.length <= 2) return; // Minimum 2 items required
    const filteredItems = items.filter((item) => item.id !== itemId);
    // Reorder remaining items
    const reorderedItems = filteredItems.map((item, index) => ({
      ...item,
      correctPosition: index + 1,
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
        <CardTitle className="text-lg">Sorting Question Setup</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Students will drag and drop items to sort them according to the specified criteria.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sorting Type and Criteria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sorting Type</Label>
            <Select value={sortingType} onValueChange={onSortingTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select sorting type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alphabetical">Alphabetical Order</SelectItem>
                <SelectItem value="numerical">Numerical Order</SelectItem>
                <SelectItem value="chronological">Chronological Order</SelectItem>
                <SelectItem value="custom">Custom Criteria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Sorting Criteria</Label>
            <Input
              placeholder="E.g., 'smallest to largest', 'oldest to newest'..."
              value={sortingCriteria}
              onChange={(e) => onCriteriaChange?.(e.target.value)}
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Items to Sort</Label>
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
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Instructions:</strong> Arrange the items below in the correct order. 
              Students will see them shuffled and must sort them according to your criteria.
            </p>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item, index) => (
                <SortableDragItem
                  key={item.id}
                  id={item.id}
                  text={item.text}
                  onTextChange={(text) => updateItemText(item.id, text)}
                  onRemove={() => removeItem(item.id)}
                  index={index}
                  canRemove={items.length > 2}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Preview Information */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Student View Preview</h4>
          <p className="text-sm text-green-700 dark:text-green-300 mb-2">
            Students will see the items in a randomized order and need to sort them according to: 
            <strong> {sortingCriteria || `${sortingType} order`}</strong>
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            Current correct order: {items.map((item, index) => `${index + 1}. ${item.text || 'Empty'}`).join(' → ')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}