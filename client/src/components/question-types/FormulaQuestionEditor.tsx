import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, ChevronUp, ChevronDown } from "lucide-react";

interface FormulaVariable {
  id: string;
  name: string;
  min: number;
  max: number;
  decimals: number;
}

interface FormulaQuestionEditorProps {
  variables: FormulaVariable[];
  formula: string;
  possibleAnswers: number;
  decimalPlaces: number;
  marginType: 'absolute' | 'percentage';
  marginValue: number;
  scientificNotation: boolean;
  onChange: (config: {
    variables: FormulaVariable[];
    formula: string;
    possibleAnswers: number;
    decimalPlaces: number;
    marginType: 'absolute' | 'percentage';
    marginValue: number;
    scientificNotation: boolean;
  }) => void;
}

export function FormulaQuestionEditor({
  variables = [],
  formula = "",
  possibleAnswers = 200,
  decimalPlaces = 0,
  marginType = 'absolute',
  marginValue = 0,
  scientificNotation = false,
  onChange
}: FormulaQuestionEditorProps) {
  const updateConfig = (updates: Partial<Parameters<typeof onChange>[0]>) => {
    onChange({
      variables,
      formula,
      possibleAnswers,
      decimalPlaces,
      marginType,
      marginValue,
      scientificNotation,
      ...updates
    });
  };

  const addVariable = () => {
    const newVariable: FormulaVariable = {
      id: `var-${Date.now()}`,
      name: `x${variables.length + 1}`,
      min: 1,
      max: 10,
      decimals: 0,
    };
    updateConfig({ variables: [...variables, newVariable] });
  };

  const updateVariable = (id: string, updates: Partial<FormulaVariable>) => {
    const updatedVariables = variables.map(variable =>
      variable.id === id ? { ...variable, ...updates } : variable
    );
    updateConfig({ variables: updatedVariables });
  };

  const removeVariable = (id: string) => {
    const filteredVariables = variables.filter(variable => variable.id !== id);
    updateConfig({ variables: filteredVariables });
  };

  const incrementValue = (value: number, step: number = 1) => {
    return Math.max(0, value + step);
  };

  const decrementValue = (value: number, step: number = 1) => {
    return Math.max(0, value - step);
  };

  const NumberInput = ({ value, onChange, min = 0, max = 999999, step = 1 }: {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
  }) => (
    <div className="relative">
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          const newValue = parseFloat(e.target.value) || 0;
          onChange(Math.min(Math.max(newValue, min), max));
        }}
        min={min}
        max={max}
        step={step}
        className="pr-8"
      />
      <div className="absolute right-1 top-0 bottom-0 flex flex-col">
        <button
          type="button"
          onClick={() => onChange(incrementValue(value, step))}
          className="flex-1 px-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t text-gray-500 hover:text-gray-700"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => onChange(decrementValue(value, step))}
          className="flex-1 px-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-b text-gray-500 hover:text-gray-700"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Formula Question Setup</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create a formula question with variables that generate different values for each student.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Variables Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Variables</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariable}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Variable
            </Button>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Once you have entered your variables above, you should see them listed below. 
            You can specify the range of possible values for each variable below.
          </p>

          {variables.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                <div>Variable</div>
                <div>Min</div>
                <div>Max</div>
                <div>Decimals</div>
              </div>
              {variables.map((variable) => (
                <div key={variable.id} className="grid grid-cols-4 gap-2 items-center">
                  <Input
                    value={variable.name}
                    onChange={(e) => updateVariable(variable.id, { name: e.target.value })}
                    placeholder="Variable name"
                    className="font-mono"
                  />
                  <NumberInput
                    value={variable.min}
                    onChange={(value) => updateVariable(variable.id, { min: value })}
                    max={variable.max - 1}
                  />
                  <NumberInput
                    value={variable.max}
                    onChange={(value) => updateVariable(variable.id, { max: value })}
                    min={variable.min + 1}
                  />
                  <div className="flex items-center space-x-1">
                    <NumberInput
                      value={variable.decimals}
                      onChange={(value) => updateVariable(variable.id, { decimals: value })}
                      max={10}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariable(variable.id)}
                      className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formula Definition */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Formula Definition</Label>
          <div className="space-y-2">
            <Label className="text-sm">
              Next, write the formula or formulas used to compute the correct answer. 
              Use the same variable names listed above. (e.g., "5 + x")
            </Label>
            <Textarea
              value={formula}
              onChange={(e) => updateConfig({ formula: e.target.value })}
              placeholder="Enter your formula here (e.g., 5 + x * y)"
              rows={3}
              className="font-mono"
            />
          </div>
        </div>

        {/* Generate Possible Solutions */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Generate Possible Solutions</Label>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Finally, build as many variable-solution combinations as you need for your quiz.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Number of solutions *</Label>
                <NumberInput
                  value={possibleAnswers}
                  onChange={(value) => updateConfig({ possibleAnswers: value })}
                  min={1}
                  max={1000}
                />
              </div>
              
              <div>
                <Label className="text-sm">Decimal places</Label>
                <NumberInput
                  value={decimalPlaces}
                  onChange={(value) => updateConfig({ decimalPlaces: value })}
                  min={0}
                  max={10}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Margin type</Label>
                <Select
                  value={marginType}
                  onValueChange={(value: 'absolute' | 'percentage') => updateConfig({ marginType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absolute">Absolute</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm">+/- margin of error</Label>
                <NumberInput
                  value={marginValue}
                  onChange={(value) => updateConfig({ marginValue: value })}
                  min={0}
                  step={0.1}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="scientific-notation"
                checked={scientificNotation}
                onCheckedChange={(checked) => updateConfig({ scientificNotation: checked as boolean })}
              />
              <Label htmlFor="scientific-notation" className="text-sm">
                Display as Scientific Notation
              </Label>
            </div>
          </div>
        </div>

        {/* Preview */}
        {variables.length > 0 && formula && (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Variables:</strong> {variables.map(v => `${v.name} (${v.min}-${v.max})`).join(', ')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Formula:</strong> <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">{formula}</code>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Solutions:</strong> {possibleAnswers} combinations with {decimalPlaces} decimal places
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Instructions:</strong> Students will see a question with randomized variable values 
            and need to calculate the result using the formula. Each student gets different values 
            but the same formula.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}