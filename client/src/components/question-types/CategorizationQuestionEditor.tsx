import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, RotateCcw } from "lucide-react";

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

export default function CategorizationQuestionEditor({
  categories,
  items,
  onChange,
}: CategorizationQuestionEditorProps) {
  
  // Initialize with two default categories if none exist
  useEffect(() => {
    if (categories.length === 0) {
      const defaultCategories = [
        {
          id: 'category-1',
          name: 'Category 1',
          description: '',
          items: []
        },
        {
          id: 'category-2', 
          name: 'Category 2',
          description: '',
          items: []
        }
      ];
      onChange(defaultCategories, items);
    }
  }, [categories.length, items, onChange]);

  const addCategory = () => {
    const newCategory: Category = {
      id: `category-${Date.now()}`,
      name: `Category ${categories.length + 1}`,
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

  const addItemToCategory = (categoryId: string) => {
    const newItem: CategorizationItem = {
      id: `item-${Date.now()}`,
      text: "",
      categoryId: categoryId,
    };
    onChange(categories, [...items, newItem]);
  };

  const addDistractor = () => {
    const newItem: CategorizationItem = {
      id: `item-${Date.now()}`,
      text: "",
      categoryId: "unassigned",
    };
    onChange(categories, [...items, newItem]);
  };

  const removeItem = (itemId: string) => {
    const filteredItems = items.filter(item => item.id !== itemId);
    onChange(categories, filteredItems);
  };

  const updateItemText = (itemId: string, text: string) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, text } : item
    );
    onChange(categories, updatedItems);
  };

  const unassignedItems = items.filter(item => item.categoryId === "unassigned");

  return (
    <div className="space-y-6">
      {/* Category Columns Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Category Setup</h3>
          <Button type="button" onClick={addCategory} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Category
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4">
                <Input
                  placeholder="Category name"
                  value={category.name}
                  onChange={(e) => updateCategoryName(category.id, e.target.value)}
                  className="font-medium text-lg border-0 px-0 focus:ring-0 shadow-none bg-transparent"
                />
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCategory(category.id)}
                    className="text-gray-400 hover:text-red-600 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Category Items */}
              <div className="space-y-2">
                {items
                  .filter(item => item.categoryId === category.id)
                  .map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Input
                        placeholder="Add item"
                        value={item.text}
                        onChange={(e) => updateItemText(item.id, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-600 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                
                {/* Add Answer Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addItemToCategory(category.id)}
                  className="text-blue-600 hover:text-blue-700 justify-start px-0 h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Answer
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Distractors Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Additional Distractors</h3>
        <div className="space-y-2">
          {unassignedItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              <Input
                placeholder="Add distractor"
                value={item.text}
                onChange={(e) => updateItemText(item.id, e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="text-gray-400 hover:text-red-600 h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addDistractor}
            className="text-blue-600 hover:text-blue-700 justify-start px-0 h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Distractor
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Instructions:</strong> Create categories and add items that belong to each category. 
          Students will need to drag items into the correct categories during the exam. 
          Use distractors to add items that don't belong to any category to make the question more challenging.
        </p>
      </div>
    </div>
  );
}