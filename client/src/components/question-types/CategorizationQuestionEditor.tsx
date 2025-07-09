import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
  useDroppable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CategorizationItem {
  id: string;
  text: string;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  items: string[]; // Array of item IDs
}

interface CategorizationQuestionEditorProps {
  categories: Category[];
  items: CategorizationItem[];
  onChange: (categories: Category[], items: CategorizationItem[]) => void;
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
      className={`flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <Input
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Enter item text..."
        className="flex-1"
        size="sm"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-red-500 hover:text-red-700"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

function DroppableCategory({ category, items, onRemoveItem }: {
  category: Category;
  items: CategorizationItem[];
  onRemoveItem: (itemId: string) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: category.id,
  });

  const categoryItems = items.filter(item => category.items.includes(item.id));

  return (
    <div
      ref={setNodeRef}
      className="min-h-[120px] p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50"
    >
      <div className="mb-3">
        <h4 className="font-medium text-base mb-1">{category.name}</h4>
        {category.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
        )}
      </div>
      <div className="space-y-2">
        {categoryItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm"
          >
            <span>{item.text}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveItem(item.id)}
              className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {categoryItems.length === 0 && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
            Drop answers here
          </div>
        )}
      </div>
    </div>
  );
}

export function CategorizationQuestionEditor({ categories, items, onChange }: CategorizationQuestionEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id;
    const newCategoryId = over.id;

    // Find the item and update its category
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, categoryId: newCategoryId } : item
    );

    // Update categories to reflect the new item assignments
    const updatedCategories = categories.map(category => ({
      ...category,
      items: updatedItems
        .filter(item => item.categoryId === category.id)
        .map(item => item.id)
    }));

    onChange(updatedCategories, updatedItems);
  };

  const addCategory = () => {
    const newCategory: Category = {
      id: `category-${Date.now()}`,
      name: "",
      description: "",
      items: [],
    };
    onChange([...categories, newCategory], items);
  };

  const removeCategory = (categoryId: string) => {
    const filteredCategories = categories.filter(cat => cat.id !== categoryId);
    // Move items from deleted category to unassigned
    const updatedItems = items.map(item =>
      item.categoryId === categoryId ? { ...item, categoryId: "unassigned" } : item
    );
    onChange(filteredCategories, updatedItems);
  };

  const updateCategoryName = (categoryId: string, name: string) => {
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId ? { ...cat, name } : cat
    );
    onChange(updatedCategories, items);
  };

  const updateCategoryDescription = (categoryId: string, description: string) => {
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId ? { ...cat, description } : cat
    );
    onChange(updatedCategories, items);
  };

  const addItem = () => {
    const newItem: CategorizationItem = {
      id: `item-${Date.now()}`,
      text: "",
      categoryId: "unassigned",
    };
    onChange(categories, [...items, newItem]);
  };

  const removeItem = (itemId: string) => {
    const filteredItems = items.filter(item => item.id !== itemId);
    // Update categories to remove the item reference
    const updatedCategories = categories.map(category => ({
      ...category,
      items: category.items.filter(id => id !== itemId)
    }));
    onChange(updatedCategories, filteredItems);
  };

  const updateItemText = (itemId: string, text: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, text } : item
    );
    onChange(categories, updatedItems);
  };

  const removeItemFromCategory = (itemId: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, categoryId: "unassigned" } : item
    );
    const updatedCategories = categories.map(category => ({
      ...category,
      items: category.items.filter(id => id !== itemId)
    }));
    onChange(updatedCategories, updatedItems);
  };

  const unassignedItems = items.filter(item => item.categoryId === "unassigned");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Categorization Question Setup</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Students will drag and drop items into the correct categories. 
          Set up categories and assign items to them.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categories Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Categories</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCategory}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Category
            </Button>
          </div>

          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Input
                    value={category.name}
                    onChange={(e) => updateCategoryName(category.id, e.target.value)}
                    placeholder="Category name..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCategory(category.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={category.description}
                  onChange={(e) => updateCategoryDescription(category.id, e.target.value)}
                  placeholder="Category description (optional)..."
                  rows={2}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Items Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Items to Categorize</Label>
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
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Unassigned Items */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Unassigned Items</Label>
              <SortableContext items={unassignedItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {unassignedItems.map((item) => (
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
            </div>

            {/* Categories with Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <DroppableCategory
                  key={category.id}
                  category={category}
                  items={items}
                  onRemoveItem={removeItemFromCategory}
                />
              ))}
            </div>

            <DragOverlay>
              {activeId ? (
                <div className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
                  {items.find(item => item.id === activeId)?.text || ""}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No items added yet. Click "Add Item" to start building your categorization question.
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Instructions:</strong> Drag items from the unassigned area into the correct categories. 
            Students will see all items mixed together and need to sort them into the right categories.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}