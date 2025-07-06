import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Award, Trophy, Share2, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  iconName: string;
  iconColor: string;
  category: string;
  criteria: string;
  pointsRequired: number;
  isActive: boolean;
  accountId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface UserBadgeData {
  id: string;
  userId: string;
  badgeId: string;
  awardedAt: string;
  reason?: string;
  badge: BadgeData;
}

interface LearningMilestoneData {
  id: string;
  userId: string;
  accountId: string;
  milestoneType: string;
  title: string;
  description: string;
  achievementData: any;
  pointsEarned: number;
  createdAt: string;
}

interface SocialShareData {
  id: string;
  userId: string;
  contentType: string;
  contentId: string;
  platform: string;
  shareUrl: string;
  shareText: string;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  sharedAt: string;
}

const BadgeSystem = () => {
  const [isCreateBadgeOpen, setIsCreateBadgeOpen] = useState(false);
  const [newBadge, setNewBadge] = useState({
    name: '',
    description: '',
    iconName: 'Award',
    iconColor: '#3B82F6',
    category: 'Achievement',
    criteria: '',
    pointsRequired: 100,
  });

  const queryClient = useQueryClient();

  // Fetch badges
  const { data: badges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ['/api/badges'],
  });

  // Fetch active badges
  const { data: activeBadges = [] } = useQuery({
    queryKey: ['/api/badges/active'],
  });

  // Fetch user badges (assuming current user)
  const { data: userBadges = [] } = useQuery({
    queryKey: ['/api/user-badges/user/current-user'],
  });

  // Fetch learning milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ['/api/learning-milestones/user/current-user'],
  });

  // Fetch public social shares
  const { data: publicShares = [] } = useQuery({
    queryKey: ['/api/social-shares/public'],
  });

  // Create badge mutation
  const createBadgeMutation = useMutation({
    mutationFn: async (badgeData: any) => {
      const response = await fetch('/api/badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(badgeData),
      });
      if (!response.ok) {
        throw new Error('Failed to create badge');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      toast({
        title: 'Success',
        description: 'Badge created successfully!',
      });
      setIsCreateBadgeOpen(false);
      setNewBadge({
        name: '',
        description: '',
        iconName: 'Award',
        iconColor: '#3B82F6',
        category: 'Achievement',
        criteria: '',
        pointsRequired: 100,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create badge. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Create learning milestone mutation
  const createMilestoneMutation = useMutation({
    mutationFn: async (milestoneData: any) => {
      const response = await fetch('/api/learning-milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(milestoneData),
      });
      if (!response.ok) {
        throw new Error('Failed to create milestone');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning-milestones/user/current-user'] });
      toast({
        title: 'Success',
        description: 'Learning milestone created!',
      });
    },
  });

  // Create social share mutation
  const createShareMutation = useMutation({
    mutationFn: async (shareData: any) => {
      const response = await fetch('/api/social-shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData),
      });
      if (!response.ok) {
        throw new Error('Failed to create share');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-shares/public'] });
      toast({
        title: 'Success',
        description: 'Content shared successfully!',
      });
    },
  });

  const handleCreateBadge = () => {
    createBadgeMutation.mutate(newBadge);
  };

  const handleCreateTestMilestone = () => {
    createMilestoneMutation.mutate({
      milestoneType: 'quiz_completion',
      title: 'First Quiz Completed',
      description: 'Successfully completed your first quiz!',
      achievementData: { quizId: 'test-quiz', score: 85 },
      pointsEarned: 50,
    });
  };

  const handleCreateTestShare = () => {
    createShareMutation.mutate({
      contentType: 'badge',
      contentId: userBadges[0]?.badgeId || 'test-badge',
      platform: 'twitter',
      shareUrl: 'https://example.com/badge/123',
      shareText: 'Just earned my first badge! 🏆',
      isPublic: true,
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Badge & Achievement System</h1>
          <p className="text-muted-foreground">
            Manage badges, track learning milestones, and share achievements
          </p>
        </div>
        <Dialog open={isCreateBadgeOpen} onOpenChange={setIsCreateBadgeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Badge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Badge</DialogTitle>
              <DialogDescription>
                Design a new badge for student achievements
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Badge Name</Label>
                <Input
                  id="name"
                  value={newBadge.name}
                  onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                  placeholder="e.g., Quiz Master"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newBadge.description}
                  onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                  placeholder="Describe what this badge represents..."
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newBadge.category}
                  onChange={(e) => setNewBadge({ ...newBadge, category: e.target.value })}
                  placeholder="e.g., Achievement, Progress, Excellence"
                />
              </div>
              <div>
                <Label htmlFor="criteria">Achievement Criteria</Label>
                <Textarea
                  id="criteria"
                  value={newBadge.criteria}
                  onChange={(e) => setNewBadge({ ...newBadge, criteria: e.target.value })}
                  placeholder="What must a student do to earn this badge?"
                />
              </div>
              <div>
                <Label htmlFor="points">Points Required</Label>
                <Input
                  id="points"
                  type="number"
                  value={newBadge.pointsRequired}
                  onChange={(e) => setNewBadge({ ...newBadge, pointsRequired: parseInt(e.target.value) })}
                />
              </div>
              <Button 
                onClick={handleCreateBadge} 
                className="w-full"
                disabled={createBadgeMutation.isPending}
              >
                {createBadgeMutation.isPending ? 'Creating...' : 'Create Badge'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="badges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="earned">Earned Badges</TabsTrigger>
          <TabsTrigger value="milestones">Learning Milestones</TabsTrigger>
          <TabsTrigger value="social">Social Shares</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Available Badges</h2>
            <Badge variant="secondary">{badges.length} total badges</Badge>
          </div>
          {loadingBadges ? (
            <div className="text-center py-8">Loading badges...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge: BadgeData) => (
                <Card key={badge.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <Award className="h-6 w-6" style={{ color: badge.iconColor }} />
                      <CardTitle className="text-lg">{badge.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {badge.category}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-3">
                      {badge.description}
                    </CardDescription>
                    <div className="space-y-2 text-sm">
                      <div><strong>Criteria:</strong> {badge.criteria}</div>
                      <div><strong>Points:</strong> {badge.pointsRequired}</div>
                      <div className="flex items-center space-x-2">
                        <span>Status:</span>
                        <Badge variant={badge.isActive ? "default" : "secondary"}>
                          {badge.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="earned" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Earned Badges</h2>
            <Badge variant="secondary">{userBadges.length} badges earned</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userBadges.map((userBadge: UserBadgeData) => (
              <Card key={userBadge.id} className="border-2 border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                    <CardTitle className="text-lg">{userBadge.badge?.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-3">
                    {userBadge.badge?.description}
                  </CardDescription>
                  <div className="space-y-1 text-sm">
                    <div><strong>Earned:</strong> {new Date(userBadge.awardedAt).toLocaleDateString()}</div>
                    {userBadge.reason && (
                      <div><strong>Reason:</strong> {userBadge.reason}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Learning Milestones</h2>
            <Button onClick={handleCreateTestMilestone} variant="outline">
              <Star className="mr-2 h-4 w-4" />
              Add Test Milestone
            </Button>
          </div>
          <div className="space-y-3">
            {milestones.map((milestone: LearningMilestoneData) => (
              <Card key={milestone.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{milestone.title}</CardTitle>
                      <Badge variant="outline">{milestone.milestoneType}</Badge>
                    </div>
                    <Badge variant="secondary">+{milestone.pointsEarned} pts</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{milestone.description}</CardDescription>
                  <div className="text-sm text-muted-foreground mt-2">
                    Achieved on {new Date(milestone.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Social Shares</h2>
            <Button onClick={handleCreateTestShare} variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Create Test Share
            </Button>
          </div>
          <div className="space-y-3">
            {publicShares.map((share: SocialShareData) => (
              <Card key={share.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm capitalize">{share.contentType} Share</CardTitle>
                      <Badge variant="outline">{share.platform}</Badge>
                    </div>
                    <div className="flex space-x-2 text-sm text-muted-foreground">
                      <span>{share.viewCount} views</span>
                      <span>{share.likeCount} likes</span>
                      <span>{share.commentCount} comments</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{share.shareText}</CardDescription>
                  <div className="text-sm text-muted-foreground mt-2">
                    Shared on {new Date(share.sharedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BadgeSystem;