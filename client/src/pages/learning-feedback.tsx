import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, MessageCircle, BarChart3, Heart, Star } from "lucide-react";
import { EmojiMoodSelector } from "@/components/EmojiMoodSelector";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface MoodEntry {
  id: string;
  mood: string;
  moodLabel: string;
  context: string;
  notes: string | null;
  createdAt: string;
  metadata: any;
}

interface DifficultyEntry {
  id: string;
  difficultyScore: number;
  difficulty: string;
  difficultyLabel: string;
  contentType: string;
  contentTitle: string;
  feedback: string | null;
  createdAt: string;
  metadata: any;
}

export default function LearningFeedback() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("week");
  const [selectedContext, setSelectedContext] = useState("all");

  // Calculate date range based on selection
  const getDateRange = () => {
    const now = new Date();
    switch (selectedTimeRange) {
      case "week":
        return {
          startDate: startOfWeek(now).toISOString(),
          endDate: endOfWeek(now).toISOString()
        };
      case "month":
        return {
          startDate: startOfMonth(now).toISOString(),
          endDate: endOfMonth(now).toISOString()
        };
      default:
        return {};
    }
  };

  const dateRange = getDateRange();

  // Fetch mood entries
  const { data: moodEntries = [], isLoading: moodLoading } = useQuery({
    queryKey: ['/api/mood-entries', selectedTimeRange, selectedContext],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedContext !== 'all') params.append('context', selectedContext);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await fetch(`/api/mood-entries?${params}`);
      if (!response.ok) throw new Error('Failed to fetch mood entries');
      return response.json();
    }
  });

  // Fetch difficulty entries
  const { data: difficultyEntries = [], isLoading: difficultyLoading } = useQuery({
    queryKey: ['/api/difficulty-entries', selectedTimeRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await fetch(`/api/difficulty-entries?${params}`);
      if (!response.ok) throw new Error('Failed to fetch difficulty entries');
      return response.json();
    }
  });

  // Calculate mood statistics
  const moodStats = () => {
    if (!moodEntries.length) return { average: 0, total: 0, byContext: {} };
    
    const moodValues = moodEntries.map((entry: MoodEntry) => {
      const value = entry.metadata?.value || 3; // Default to neutral
      return value;
    });
    
    const average = moodValues.reduce((sum, val) => sum + val, 0) / moodValues.length;
    
    const byContext = moodEntries.reduce((acc: any, entry: MoodEntry) => {
      const context = entry.context || 'general';
      if (!acc[context]) acc[context] = [];
      acc[context].push(entry.metadata?.value || 3);
      return acc;
    }, {});

    return { average, total: moodEntries.length, byContext };
  };

  // Calculate difficulty statistics
  const difficultyStats = () => {
    if (!difficultyEntries.length) return { average: 0, total: 0, byType: {} };
    
    const scores = difficultyEntries.map((entry: DifficultyEntry) => entry.difficultyScore);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const byType = difficultyEntries.reduce((acc: any, entry: DifficultyEntry) => {
      const type = entry.contentType || 'concept';
      if (!acc[type]) acc[type] = [];
      acc[type].push(entry.difficultyScore);
      return acc;
    }, {});

    return { average, total: difficultyEntries.length, byType };
  };

  const mood = moodStats();
  const difficulty = difficultyStats();

  const getMoodColor = (value: number) => {
    if (value <= 2) return "text-red-500";
    if (value <= 3) return "text-yellow-500";
    return "text-green-500";
  };

  const getDifficultyColor = (value: number) => {
    if (value <= 2) return "text-green-500";
    if (value <= 3) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learning Feedback</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Track your learning mood and difficulty experiences
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedContext} onValueChange={setSelectedContext}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contexts</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="before_study">Before Study</SelectItem>
              <SelectItem value="during_study">During Study</SelectItem>
              <SelectItem value="after_study">After Study</SelectItem>
              <SelectItem value="before_quiz">Before Quiz</SelectItem>
              <SelectItem value="after_quiz">After Quiz</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="submit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mood">Mood Tracking</TabsTrigger>
          <TabsTrigger value="difficulty">Difficulty Tracking</TabsTrigger>
        </TabsList>

        {/* Submit Feedback Tab */}
        <TabsContent value="submit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Share Your Learning Experience
              </CardTitle>
              <CardDescription>
                Help us understand how you're feeling and the difficulty level you're experiencing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmojiMoodSelector
                context="general"
                contentType="concept"
                onSubmit={() => window.location.reload()}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Mood</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getMoodColor(mood.average)}`}>
                  {mood.average.toFixed(1)}/5
                </div>
                <p className="text-xs text-muted-foreground">
                  {mood.total} entries recorded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Difficulty</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getDifficultyColor(difficulty.average)}`}>
                  {difficulty.average.toFixed(1)}/5
                </div>
                <p className="text-xs text-muted-foreground">
                  {difficulty.total} entries recorded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Sessions</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.max(mood.total, difficulty.total)}
                </div>
                <p className="text-xs text-muted-foreground">
                  This {selectedTimeRange}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Feedback Notes</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {[...moodEntries, ...difficultyEntries].filter(entry => 
                    (entry as any).notes || (entry as any).feedback
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Notes provided
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mood by Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(mood.byContext).map(([context, values]: [string, any]) => {
                    const avg = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
                    return (
                      <div key={context} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{context.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${getMoodColor(avg)}`}>
                            {avg.toFixed(1)}
                          </span>
                          <Badge variant="outline">{values.length}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Difficulty by Content Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(difficulty.byType).map(([type, values]: [string, any]) => {
                    const avg = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${getDifficultyColor(avg)}`}>
                            {avg.toFixed(1)}
                          </span>
                          <Badge variant="outline">{values.length}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mood Tracking Tab */}
        <TabsContent value="mood" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Mood Entries</CardTitle>
              <CardDescription>
                Your learning mood history and feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              {moodLoading ? (
                <div className="text-center py-8">Loading mood entries...</div>
              ) : moodEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No mood entries found for the selected time range
                </div>
              ) : (
                <div className="space-y-4">
                  {moodEntries.map((entry: MoodEntry) => (
                    <div key={entry.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{entry.mood}</span>
                          <div>
                            <div className="font-medium capitalize">{entry.moodLabel}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {entry.context.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{entry.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Difficulty Tracking Tab */}
        <TabsContent value="difficulty" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Difficulty Entries</CardTitle>
              <CardDescription>
                Your learning difficulty assessments and feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              {difficultyLoading ? (
                <div className="text-center py-8">Loading difficulty entries...</div>
              ) : difficultyEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No difficulty entries found for the selected time range
                </div>
              ) : (
                <div className="space-y-4">
                  {difficultyEntries.map((entry: DifficultyEntry) => (
                    <div key={entry.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{entry.difficulty}</span>
                          <div>
                            <div className="font-medium capitalize">{entry.difficultyLabel}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.contentTitle} ({entry.contentType})
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                      {entry.feedback && (
                        <p className="text-sm text-muted-foreground mt-2">{entry.feedback}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}