import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Image, Trash2, Info } from "lucide-react";

interface HotSpotArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isCorrect: boolean;
  feedback?: string;
}

interface HotSpotQuestionEditorProps {
  imageUrl?: string;
  hotSpots: HotSpotArea[];
  showCalculator?: boolean;
  onChange: (imageUrl: string, hotSpots: HotSpotArea[], showCalculator: boolean) => void;
}

export function HotSpotQuestionEditor({ 
  imageUrl = "", 
  hotSpots = [], 
  showCalculator = false, 
  onChange 
}: HotSpotQuestionEditorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentHotSpot, setCurrentHotSpot] = useState<HotSpotArea | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result, hotSpots, showCalculator);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to percentage for responsiveness
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    const newHotSpot: HotSpotArea = {
      id: `hotspot-${Date.now()}`,
      x: xPercent,
      y: yPercent,
      width: 10, // Default width as percentage
      height: 10, // Default height as percentage
      isCorrect: true,
      feedback: "",
    };

    onChange(imageUrl, [...hotSpots, newHotSpot], showCalculator);
  };

  const updateHotSpot = (id: string, updates: Partial<HotSpotArea>) => {
    const updatedHotSpots = hotSpots.map(spot => 
      spot.id === id ? { ...spot, ...updates } : spot
    );
    onChange(imageUrl, updatedHotSpots, showCalculator);
  };

  const removeHotSpot = (id: string) => {
    const filteredHotSpots = hotSpots.filter(spot => spot.id !== id);
    onChange(imageUrl, filteredHotSpots, showCalculator);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result, hotSpots, showCalculator);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Hot Spot Question Setup</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload an image and click on areas to create clickable hot spots. Students will click on the correct areas.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Upload */}
        <div className="space-y-4">
          <Label>Question Image</Label>
          {!imageUrl ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                isDragging 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                  : "border-gray-300 dark:border-gray-600"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Drag and drop an image here, or{" "}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          ) : (
            <div className="relative">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Question image"
                className="max-w-full h-auto border border-gray-300 dark:border-gray-600 rounded-lg cursor-crosshair"
                onClick={handleImageClick}
              />
              
              {/* Hot Spots Overlay */}
              {hotSpots.map((spot) => (
                <div
                  key={spot.id}
                  className={`absolute border-2 ${
                    spot.isCorrect 
                      ? "border-green-500 bg-green-200 dark:bg-green-900" 
                      : "border-red-500 bg-red-200 dark:bg-red-900"
                  } opacity-70 cursor-pointer`}
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    width: `${spot.width}%`,
                    height: `${spot.height}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentHotSpot(spot);
                  }}
                >
                  <div className="absolute -top-6 left-0 text-xs font-medium text-gray-600 dark:text-gray-400">
                    {spot.isCorrect ? "✓" : "✗"}
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  onChange("", [], showCalculator);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Hot Spot Management */}
        {hotSpots.length > 0 && (
          <div className="space-y-4">
            <Label>Hot Spots ({hotSpots.length})</Label>
            <div className="space-y-3">
              {hotSpots.map((spot) => (
                <div
                  key={spot.id}
                  className={`p-3 border rounded-lg ${
                    currentHotSpot?.id === spot.id 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`correct-${spot.id}`}
                        checked={spot.isCorrect}
                        onCheckedChange={(checked) => 
                          updateHotSpot(spot.id, { isCorrect: checked as boolean })
                        }
                      />
                      <Label htmlFor={`correct-${spot.id}`} className="text-sm">
                        Correct answer
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHotSpot(spot.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <Label>Position: {spot.x.toFixed(1)}%, {spot.y.toFixed(1)}%</Label>
                    </div>
                    <div>
                      <Label>Size: {spot.width.toFixed(1)}% × {spot.height.toFixed(1)}%</Label>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Label className="text-sm">Feedback (optional)</Label>
                    <Textarea
                      value={spot.feedback || ""}
                      onChange={(e) => updateHotSpot(spot.id, { feedback: e.target.value })}
                      placeholder="Feedback when this area is clicked..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Options */}
        <div className="space-y-4">
          <Label>Options</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-calculator"
              checked={showCalculator}
              onCheckedChange={(checked) => onChange(imageUrl, hotSpots, checked as boolean)}
            />
            <Label htmlFor="show-calculator">Show on-screen calculator</Label>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">How to use:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Upload an image first</li>
                <li>Click on the image to create hot spots</li>
                <li>Mark correct areas with the checkbox</li>
                <li>Add feedback for each hot spot if needed</li>
                <li>Students will click on areas to answer</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}