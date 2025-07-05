import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MoodOption {
  value: number;
  icon: string;
  label: string;
  description: string;
}

interface DifficultyOption {
  value: number;
  icon: string;
  label: string;
  description: string;
}

const moodOptions: MoodOption[] = [
  { value: 1, icon: "😢", label: "Frustrated", description: "Feeling overwhelmed or discouraged" },
  { value: 2, icon: "😕", label: "Confused", description: "Struggling to understand concepts" },
  { value: 3, icon: "😐", label: "Neutral", description: "Average learning experience" },
  { value: 4, icon: "🙂", label: "Confident", description: "Understanding material well" },
  { value: 5, icon: "😊", label: "Excited", description: "Enjoying the learning experience" }
];

const difficultyOptions: DifficultyOption[] = [
  { value: 1, icon: "😌", label: "Too Easy", description: "Material feels too simple" },
  { value: 2, icon: "🙂", label: "Easy", description: "Comfortable with the content" },
  { value: 3, icon: "😐", label: "Just Right", description: "Appropriately challenging" },
  { value: 4, icon: "😅", label: "Hard", description: "Requires significant effort" },
  { value: 5, icon: "😰", label: "Too Hard", description: "Material feels overwhelming" }
];

interface EmojiMoodSelectorProps {
  context?: string;
  contentType?: string;
  contentId?: string;
  onSubmit?: () => void;
}

export function EmojiMoodSelector({ 
  context = "general", 
  contentType = "general", 
  contentId = null, 
  onSubmit 
}: EmojiMoodSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [moodNotes, setMoodNotes] = useState("");
  const [difficultyFeedback, setDifficultyFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (selectedMood === null && selectedDifficulty === null) {
      toast({
        title: "Selection Required",
        description: "Please select at least your mood or difficulty level.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit mood entry if selected
      if (selectedMood !== null) {
        const moodOption = moodOptions.find(m => m.value === selectedMood);
        await apiRequest('/api/mood-entries', {
          method: 'POST',
          body: JSON.stringify({
            moodIcon: moodOption?.icon,
            moodLabel: moodOption?.label.toLowerCase(),
            context,
            notes: moodNotes || null,
            metadata: {
              label: moodOption?.label,
              description: moodOption?.description
            }
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      // Submit difficulty entry if selected
      if (selectedDifficulty !== null) {
        const difficultyOption = difficultyOptions.find(d => d.value === selectedDifficulty);
        await apiRequest('/api/difficulty-entries', {
          method: 'POST',
          body: JSON.stringify({
            difficultyLevel: selectedDifficulty,
            difficultyIcon: difficultyOption?.icon,
            difficultyLabel: difficultyOption?.label.toLowerCase().replace(' ', '_'),
            contentType,
            contentTitle: contentId || 'Learning Content',
            contentId: contentId || null,
            feedback: difficultyFeedback || null,
            needsHelp: selectedDifficulty >= 4,
            metadata: {
              label: difficultyOption?.label,
              description: difficultyOption?.description
            }
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      toast({
        title: "Feedback Submitted",
        description: "Thank you for sharing your learning experience!",
      });

      // Reset form
      setSelectedMood(null);
      setSelectedDifficulty(null);
      setMoodNotes("");
      setDifficultyFeedback("");

      // Call onSubmit callback if provided
      onSubmit?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mood Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>😊</span>
            How are you feeling about your learning?
          </CardTitle>
          <CardDescription>
            Let us know your current mood and learning experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {moodOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedMood === option.value ? "default" : "outline"}
                className="h-20 flex-col gap-1 text-xs"
                onClick={() => setSelectedMood(option.value)}
              >
                <span className="text-2xl">{option.icon}</span>
                <span>{option.label}</span>
              </Button>
            ))}
          </div>
          {selectedMood && (
            <div className="text-sm text-muted-foreground">
              {moodOptions.find(m => m.value === selectedMood)?.description}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="mood-notes">Additional Notes (Optional)</Label>
            <Textarea
              id="mood-notes"
              placeholder="Share more about how you're feeling..."
              value={moodNotes}
              onChange={(e) => setMoodNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎯</span>
            How challenging is this content?
          </CardTitle>
          <CardDescription>
            Help us understand the difficulty level you're experiencing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {difficultyOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedDifficulty === option.value ? "default" : "outline"}
                className="h-20 flex-col gap-1 text-xs"
                onClick={() => setSelectedDifficulty(option.value)}
              >
                <span className="text-2xl">{option.icon}</span>
                <span>{option.label}</span>
              </Button>
            ))}
          </div>
          {selectedDifficulty && (
            <div className="text-sm text-muted-foreground">
              {difficultyOptions.find(d => d.value === selectedDifficulty)?.description}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="difficulty-feedback">Feedback (Optional)</Label>
            <Textarea
              id="difficulty-feedback"
              placeholder="What made this easy or difficult? Any suggestions?"
              value={difficultyFeedback}
              onChange={(e) => setDifficultyFeedback(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || (selectedMood === null && selectedDifficulty === null)}
          className="min-w-[120px]"
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </div>
  );
}