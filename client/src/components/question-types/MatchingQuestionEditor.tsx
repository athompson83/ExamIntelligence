import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical } from "lucide-react";

export interface MatchingPair {
  id: string;
  leftItem: string;
  rightItem: string;
}

interface MatchingQuestionEditorProps {
  pairs: MatchingPair[];
  onChange: (pairs: MatchingPair[]) => void;
  distractors?: string[];
  onDistractorsChange?: (distractors: string[]) => void;
}

export function MatchingQuestionEditor({ 
  pairs, 
  onChange, 
  distractors = [], 
  onDistractorsChange 
}: MatchingQuestionEditorProps) {
  
  const addPair = () => {
    const newPair: MatchingPair = {
      id: `pair-${Date.now()}`,
      leftItem: "",
      rightItem: ""
    };
    onChange([...pairs, newPair]);
  };

  const removePair = (pairId: string) => {
    if (pairs.length <= 2) return; // Minimum 2 pairs required
    onChange(pairs.filter(pair => pair.id !== pairId));
  };

  const updatePair = (pairId: string, field: 'leftItem' | 'rightItem', value: string) => {
    const updatedPairs = pairs.map(pair =>
      pair.id === pairId ? { ...pair, [field]: value } : pair
    );
    onChange(updatedPairs);
  };

  const addDistractor = () => {
    if (onDistractorsChange) {
      onDistractorsChange([...distractors, ""]);
    }
  };

  const removeDistractor = (index: number) => {
    if (onDistractorsChange) {
      onDistractorsChange(distractors.filter((_, i) => i !== index));
    }
  };

  const updateDistractor = (index: number, value: string) => {
    if (onDistractorsChange) {
      const updatedDistractors = [...distractors];
      updatedDistractors[index] = value;
      onDistractorsChange(updatedDistractors);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Matching Question Setup</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create pairs of items that students will match. Students will see left items and must 
          select the correct corresponding right item from a dropdown or by dragging.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Matching Pairs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Matching Pairs</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPair}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Pair
            </Button>
          </div>
          
          <div className="space-y-3">
            {pairs.map((pair, index) => (
              <div key={pair.id} className="grid grid-cols-12 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="col-span-1 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                </div>
                
                <div className="col-span-5">
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Left Item (Prompt)</Label>
                  <Input
                    placeholder="Enter prompt text..."
                    value={pair.leftItem}
                    onChange={(e) => updatePair(pair.id, 'leftItem', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="col-span-5">
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Right Item (Match)</Label>
                  <Input
                    placeholder="Enter matching answer..."
                    value={pair.rightItem}
                    onChange={(e) => updatePair(pair.id, 'rightItem', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="col-span-1 flex items-center justify-center">
                  {pairs.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePair(pair.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distractors Section */}
        {onDistractorsChange && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Additional Distractors (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDistractor}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Distractor
              </Button>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Distractors:</strong> Add incorrect options that will appear in the dropdown 
                alongside correct matches to increase difficulty.
              </p>
            </div>
            
            {distractors.length > 0 && (
              <div className="space-y-2">
                {distractors.map((distractor, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder={`Distractor ${index + 1}`}
                      value={distractor}
                      onChange={(e) => updateDistractor(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDistractor(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Student View Preview</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Students will see the left items as prompts and must select or drag the correct 
            right items to match. The options will be randomized to prevent pattern memorization.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}