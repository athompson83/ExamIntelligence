import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import Layout from '@/components/Layout';
import { User, BookOpen, Briefcase, GraduationCap, Settings, Save, Plus, X } from 'lucide-react';

export default function ProfileEnhancement() {
  const { toast } = useToast();
  
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
  });

  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [topicsOfInterest, setTopicsOfInterest] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [industryEmployment, setIndustryEmployment] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');
  const [preferredStudyAids, setPreferredStudyAids] = useState<string[]>([]);
  const [difficultyLevel, setDifficultyLevel] = useState('');

  // Initialize form values when data loads
  useState(() => {
    if (userProfile) {
      setFieldOfStudy(userProfile.fieldOfStudy || '');
      setTopicsOfInterest(userProfile.topicsOfInterest || []);
      setIndustryEmployment(userProfile.industryEmployment || '');
      setAcademicLevel(userProfile.academicLevel || '');
      setPreferredStudyAids(userProfile.learningPreferences?.preferredStudyAidTypes || []);
      setDifficultyLevel(userProfile.learningPreferences?.difficultyLevel || '');
    }
  }, [userProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/user/profile', { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully. This will help generate better study aids.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    const profileData = {
      fieldOfStudy,
      topicsOfInterest,
      industryEmployment,
      academicLevel,
      learningPreferences: {
        preferredStudyAidTypes: preferredStudyAids,
        difficultyLevel,
      }
    };

    updateProfileMutation.mutate(profileData);
  };

  const addTopic = () => {
    if (newTopic.trim() && !topicsOfInterest.includes(newTopic.trim())) {
      setTopicsOfInterest([...topicsOfInterest, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setTopicsOfInterest(topicsOfInterest.filter(topic => topic !== topicToRemove));
  };

  const toggleStudyAid = (type: string) => {
    if (preferredStudyAids.includes(type)) {
      setPreferredStudyAids(preferredStudyAids.filter(t => t !== type));
    } else {
      setPreferredStudyAids([...preferredStudyAids, type]);
    }
  };

  const studyAidTypes = [
    { value: 'summary', label: 'Study Summaries' },
    { value: 'flashcards', label: 'Flashcards' },
    { value: 'practice_questions', label: 'Practice Questions' },
    { value: 'concept_map', label: 'Concept Maps' },
    { value: 'study_guide', label: 'Study Guides' }
  ];

  const academicLevels = [
    { value: 'high_school', label: 'High School' },
    { value: 'undergraduate', label: 'Undergraduate' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'professional', label: 'Professional' },
    { value: 'continuing_education', label: 'Continuing Education' }
  ];

  const industries = [
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'sciences', label: 'Sciences' },
    { value: 'business', label: 'Business' },
    { value: 'arts', label: 'Arts & Humanities' },
    { value: 'other', label: 'Other' }
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <User className="h-4 w-4" />
          <span>/</span>
          <span>Profile Enhancement</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile Enhancement</h1>
            <p className="text-muted-foreground">
              Enhance your profile to receive better personalized study aids
            </p>
          </div>
          <Button 
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>Academic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Field of Study</Label>
                <Input
                  placeholder="e.g., Biology, Computer Science, Psychology"
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Academic Level</Label>
                <Select value={academicLevel} onValueChange={setAcademicLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your academic level" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Industry Employment</Label>
                <Select value={industryEmployment} onValueChange={setIndustryEmployment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Learning Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Learning Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Preferred Study Aid Types</Label>
                <div className="grid grid-cols-2 gap-2">
                  {studyAidTypes.map((type) => (
                    <Button
                      key={type.value}
                      variant={preferredStudyAids.includes(type.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStudyAid(type.value)}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Difficulty Level Preference</Label>
                <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Topics of Interest */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Topics of Interest</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Add a topic (e.g., Cell Biology, Algorithms, History)"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addTopic();
                  }
                }}
              />
              <Button onClick={addTopic}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {topicsOfInterest.map((topic) => (
                <Badge
                  key={topic}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>{topic}</span>
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeTopic(topic)}
                  />
                </Badge>
              ))}
            </div>

            {topicsOfInterest.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                No topics added yet. Add topics to help AI generate better study aids for you.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Current Profile Summary */}
        {userProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Current Profile Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Field of Study</p>
                  <p className="font-medium">{userProfile.fieldOfStudy || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Academic Level</p>
                  <p className="font-medium">{userProfile.academicLevel || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-medium">{userProfile.industryEmployment || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Topics of Interest</p>
                  <p className="font-medium">{userProfile.topicsOfInterest?.length || 0} topics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}