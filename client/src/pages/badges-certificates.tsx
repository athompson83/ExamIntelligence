import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Award, FileText, Palette, Settings, Users, Edit, Trash2, Eye } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// Badge schema
const badgeSchema = z.object({
  name: z.string().min(1, 'Badge name is required'),
  description: z.string().min(1, 'Description is required'),
  iconUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  badgeColor: z.string().min(1, 'Badge color is required'),
  textColor: z.string().min(1, 'Text color is required'),
  criteria: z.string().min(1, 'Criteria is required'),
  pointsValue: z.number().min(0, 'Points must be non-negative').optional(),
  category: z.string().min(1, 'Category is required'),
  isActive: z.boolean().default(true)
});

// Certificate template schema
const certificateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().min(1, 'Description is required'),
  certificateText: z.string().min(1, 'Certificate text is required'),
  designTemplate: z.string().min(1, 'Design template is required'),
  backgroundColor: z.string().min(1, 'Background color is required'),
  textColor: z.string().min(1, 'Text color is required'),
  borderStyle: z.string().min(1, 'Border style is required'),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isActive: z.boolean().default(true)
});

type BadgeForm = z.infer<typeof badgeSchema>;
type CertificateForm = z.infer<typeof certificateSchema>;

export default function BadgesCertificates() {
  const [activeTab, setActiveTab] = useState('badges');
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  const [editingBadge, setEditingBadge] = useState<any>(null);
  const [editingCertificate, setEditingCertificate] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Badge queries
  const { data: badges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ['/api/badges'],
    enabled: activeTab === 'badges'
  });

  // Certificate template queries
  const { data: certificates = [], isLoading: loadingCertificates } = useQuery({
    queryKey: ['/api/certificate-templates'],
    enabled: activeTab === 'certificates'
  });

  // Badge form
  const badgeForm = useForm<BadgeForm>({
    resolver: zodResolver(badgeSchema),
    defaultValues: {
      name: '',
      description: '',
      iconUrl: '',
      badgeColor: '#3B82F6',
      textColor: '#FFFFFF',
      criteria: '',
      pointsValue: 0,
      category: 'achievement',
      isActive: true
    }
  });

  // Certificate form
  const certificateForm = useForm<CertificateForm>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      name: '',
      description: '',
      certificateText: '',
      designTemplate: 'classic',
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      borderStyle: 'solid',
      logoUrl: '',
      isActive: true
    }
  });

  // Mutations
  const createBadgeMutation = useMutation({
    mutationFn: (data: BadgeForm) => apiRequest('/api/badges', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      setShowBadgeDialog(false);
      setEditingBadge(null);
      badgeForm.reset();
      toast({ title: 'Success', description: 'Badge created successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create badge', variant: 'destructive' });
    }
  });

  const updateBadgeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BadgeForm }) => 
      apiRequest(`/api/badges/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      setShowBadgeDialog(false);
      setEditingBadge(null);
      badgeForm.reset();
      toast({ title: 'Success', description: 'Badge updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update badge', variant: 'destructive' });
    }
  });

  const createCertificateMutation = useMutation({
    mutationFn: (data: CertificateForm) => apiRequest('/api/certificate-templates', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificate-templates'] });
      setShowCertificateDialog(false);
      setEditingCertificate(null);
      certificateForm.reset();
      toast({ title: 'Success', description: 'Certificate template created successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create certificate template', variant: 'destructive' });
    }
  });

  const updateCertificateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CertificateForm }) => 
      apiRequest(`/api/certificate-templates/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificate-templates'] });
      setShowCertificateDialog(false);
      setEditingCertificate(null);
      certificateForm.reset();
      toast({ title: 'Success', description: 'Certificate template updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update certificate template', variant: 'destructive' });
    }
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/badges/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      toast({ title: 'Success', description: 'Badge deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete badge', variant: 'destructive' });
    }
  });

  const deleteCertificateMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/certificate-templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificate-templates'] });
      toast({ title: 'Success', description: 'Certificate template deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete certificate template', variant: 'destructive' });
    }
  });

  const handleEditBadge = (badge: any) => {
    setEditingBadge(badge);
    badgeForm.reset({
      name: badge.name,
      description: badge.description,
      iconUrl: badge.iconUrl || '',
      badgeColor: badge.badgeColor,
      textColor: badge.textColor,
      criteria: badge.criteria,
      pointsValue: badge.pointsValue || 0,
      category: badge.category,
      isActive: badge.isActive
    });
    setShowBadgeDialog(true);
  };

  const handleEditCertificate = (certificate: any) => {
    setEditingCertificate(certificate);
    certificateForm.reset({
      name: certificate.name,
      description: certificate.description,
      certificateText: certificate.certificateText,
      designTemplate: certificate.designTemplate,
      backgroundColor: certificate.backgroundColor,
      textColor: certificate.textColor,
      borderStyle: certificate.borderStyle,
      logoUrl: certificate.logoUrl || '',
      isActive: certificate.isActive
    });
    setShowCertificateDialog(true);
  };

  const onSubmitBadge = (data: BadgeForm) => {
    if (editingBadge) {
      updateBadgeMutation.mutate({ id: editingBadge.id, data });
    } else {
      createBadgeMutation.mutate(data);
    }
  };

  const onSubmitCertificate = (data: CertificateForm) => {
    if (editingCertificate) {
      updateCertificateMutation.mutate({ id: editingCertificate.id, data });
    } else {
      createCertificateMutation.mutate(data);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Badges & Certificates</h1>
          <p className="text-muted-foreground">Manage your recognition and achievement system</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Certificates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Badge Management</h2>
              <p className="text-muted-foreground">Create and manage achievement badges for students</p>
            </div>
            <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingBadge(null);
                  badgeForm.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Badge
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingBadge ? 'Edit Badge' : 'Create New Badge'}</DialogTitle>
                  <DialogDescription>
                    Design a badge that students can earn for achievements and milestones.
                  </DialogDescription>
                </DialogHeader>
                <Form {...badgeForm}>
                  <form onSubmit={badgeForm.handleSubmit(onSubmitBadge)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={badgeForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Badge Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Excellence in Learning" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={badgeForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="achievement">Achievement</SelectItem>
                                <SelectItem value="completion">Completion</SelectItem>
                                <SelectItem value="participation">Participation</SelectItem>
                                <SelectItem value="excellence">Excellence</SelectItem>
                                <SelectItem value="leadership">Leadership</SelectItem>
                                <SelectItem value="collaboration">Collaboration</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={badgeForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what this badge represents and how students can earn it..."
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={badgeForm.control}
                      name="criteria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Earning Criteria</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Specific requirements students must meet to earn this badge..."
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={badgeForm.control}
                        name="badgeColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Badge Color</FormLabel>
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={badgeForm.control}
                        name="textColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Text Color</FormLabel>
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={badgeForm.control}
                        name="pointsValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Points Value</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={badgeForm.control}
                      name="iconUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icon URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/icon.png" {...field} />
                          </FormControl>
                          <FormDescription>
                            URL to an icon image for this badge
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={badgeForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Active Badge</FormLabel>
                            <FormDescription>
                              Allow this badge to be awarded to students
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowBadgeDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createBadgeMutation.isPending || updateBadgeMutation.isPending}>
                        {editingBadge ? 'Update Badge' : 'Create Badge'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingBadges ? (
              <div className="col-span-full text-center py-8">Loading badges...</div>
            ) : badges.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No badges yet</h3>
                <p className="text-muted-foreground mb-4">Create your first badge to start recognizing student achievements.</p>
                <Button onClick={() => setShowBadgeDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Badge
                </Button>
              </div>
            ) : (
              badges.map((badge: any) => (
                <Card key={badge.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: badge.badgeColor, color: badge.textColor }}
                        >
                          {badge.iconUrl ? (
                            <img src={badge.iconUrl} alt={badge.name} className="w-8 h-8 rounded-full" />
                          ) : (
                            badge.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{badge.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {badge.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditBadge(badge)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteBadgeMutation.mutate(badge.id)}
                          disabled={deleteBadgeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                    <div className="space-y-2">
                      <div className="text-xs">
                        <strong>Criteria:</strong> {badge.criteria}
                      </div>
                      {badge.pointsValue > 0 && (
                        <div className="text-xs">
                          <strong>Points:</strong> {badge.pointsValue}
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <Badge variant={badge.isActive ? "default" : "secondary"}>
                          {badge.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Created {new Date(badge.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Certificate Templates</h2>
              <p className="text-muted-foreground">Design certificate templates for completion recognition</p>
            </div>
            <Dialog open={showCertificateDialog} onOpenChange={setShowCertificateDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingCertificate(null);
                  certificateForm.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCertificate ? 'Edit Certificate Template' : 'Create New Certificate Template'}</DialogTitle>
                  <DialogDescription>
                    Design a certificate template that can be issued to students upon completion.
                  </DialogDescription>
                </DialogHeader>
                <Form {...certificateForm}>
                  <form onSubmit={certificateForm.handleSubmit(onSubmitCertificate)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={certificateForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Course Completion Certificate" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={certificateForm.control}
                        name="designTemplate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Design Template</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select design" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="classic">Classic</SelectItem>
                                <SelectItem value="modern">Modern</SelectItem>
                                <SelectItem value="elegant">Elegant</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="academic">Academic</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={certificateForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what this certificate template is for..."
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={certificateForm.control}
                      name="certificateText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certificate Text</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="This is to certify that {studentName} has successfully completed..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Use {`{studentName}`} for dynamic student name insertion
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={certificateForm.control}
                        name="backgroundColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Background Color</FormLabel>
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={certificateForm.control}
                        name="textColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Text Color</FormLabel>
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={certificateForm.control}
                        name="borderStyle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Border Style</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select border" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="solid">Solid</SelectItem>
                                <SelectItem value="dashed">Dashed</SelectItem>
                                <SelectItem value="dotted">Dotted</SelectItem>
                                <SelectItem value="double">Double</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={certificateForm.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/logo.png" {...field} />
                          </FormControl>
                          <FormDescription>
                            URL to a logo image for this certificate
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={certificateForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Active Template</FormLabel>
                            <FormDescription>
                              Allow this template to be used for issuing certificates
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowCertificateDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createCertificateMutation.isPending || updateCertificateMutation.isPending}>
                        {editingCertificate ? 'Update Template' : 'Create Template'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingCertificates ? (
              <div className="col-span-full text-center py-8">Loading certificate templates...</div>
            ) : certificates.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Certificate className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No certificate templates yet</h3>
                <p className="text-muted-foreground mb-4">Create your first certificate template to start issuing completion certificates.</p>
                <Button onClick={() => setShowCertificateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Template
                </Button>
              </div>
            ) : (
              certificates.map((cert: any) => (
                <Card key={cert.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cert.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">
                          {cert.designTemplate}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditCertificate(cert)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteCertificateMutation.mutate(cert.id)}
                          disabled={deleteCertificateMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{cert.description}</p>
                    <div 
                      className="rounded-lg p-4 mb-3 text-xs border-2"
                      style={{ 
                        backgroundColor: cert.backgroundColor,
                        color: cert.textColor,
                        borderStyle: cert.borderStyle,
                        borderColor: cert.textColor
                      }}
                    >
                      {cert.certificateText.substring(0, 100)}...
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant={cert.isActive ? "default" : "secondary"}>
                        {cert.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Created {new Date(cert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}