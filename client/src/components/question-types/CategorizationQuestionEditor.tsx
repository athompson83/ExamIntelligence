import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  
  const [categoriesText, setCategoriesText] = useState("");
  const [itemsText, setItemsText] = useState("");

  // Initialize with default values if empty
  useEffect(() => {
    if (categories.length === 0 && categoriesText === "") {
      setCategoriesText("Category 1, Category 2, Category 3");
    }
    if (items.length === 0 && itemsText === "") {
      setItemsText("Item 1, Item 2, Item 3");
    }
  }, [categories.length, items.length, categoriesText, itemsText]);

  // Update categories when text changes
  const handleCategoriesChange = (value: string) => {
    setCategoriesText(value);
    
    const categoryNames = value.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);
    const newCategories = categoryNames.map((name, index) => ({
      id: `category-${index + 1}`,
      name,
      description: "",
      items: []
    }));
    
    onChange(newCategories, items);
  };

  // Update items when text changes
  const handleItemsChange = (value: string) => {
    setItemsText(value);
    
    const itemNames = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    const newItems = itemNames.map((text, index) => ({
      id: `item-${index + 1}`,
      text,
      categoryId: "unassigned" // Items start unassigned
    }));
    
    onChange(categories, newItems);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Categorization Setup</h3>
        
        {/* Categories Section */}
        <div className="space-y-2">
          <Label htmlFor="categories" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Categories (comma-separated)
          </Label>
          <Textarea
            id="categories"
            placeholder="Category 1, Category 2, Category 3"
            value={categoriesText}
            onChange={(e) => handleCategoriesChange(e.target.value)}
            className="min-h-[60px] text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Items Section */}
        <div className="space-y-2">
          <Label htmlFor="items" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Items to Categorize (comma-separated)
          </Label>
          <Textarea
            id="items"
            placeholder="Item 1, Item 2, Item 3"
            value={itemsText}
            onChange={(e) => handleItemsChange(e.target.value)}
            className="min-h-[60px] text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Instructions:</strong> Enter categories separated by commas, then enter the items that students will categorize. 
          Students will need to drag items into the correct categories during the exam.
        </p>
      </div>
    </div>
  );
}