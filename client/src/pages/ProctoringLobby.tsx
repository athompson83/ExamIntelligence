import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Users, Video, Clock, Shield, Play, Square, UserCheck, AlertTriangle, Eye } from "lucide-react";

const createLobbySchema = z.object({
  catExamId: z.string().min(1, "CAT Exam is required"),
  lobbyName: z.string().min(1, "Lobby name is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  scheduledStartTime: z.string().optional(),
  scheduledEndTime: z.string().optional(),
  maxStudents: z.number().min(1).max(100),
  allowLateJoin: z.boolean(),
  lateJoinCutoffMinutes: z.number().min(0).max(60),
  requireStudentVerification: z.boolean(),
  accessCode: z.string().optional(),
  isPublic: z.boolean(),
  autoGradeOnCompletion: z.boolean(),
  generateReport: z.boolean(),
});

type CreateLobbyFormData = z.infer<typeof createLobbySchema>;

interface ProctoringLobby {
  id: string;
  catExamId: string;
  proctorId: string;
  lobbyName: string;
  description: string;
  instructions: string;
  status: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  maxStudents: number;
  currentStudentCount: number;
  allowLateJoin: boolean;
  lateJoinCutoffMinutes: number;
  requireStudentVerification: boolean;
  accessCode?: string;
  isPublic: boolean;
  autoGradeOnCompletion: boolean;
  generateReport: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Student {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: string;
  joinedAt: string;
  verifiedAt?: string;
  webcamStatus: string;
  microphoneStatus: string;
  screenShareStatus: string;
  totalViolations: number;
  flaggedForReview: boolean;
  proctorNotes?: string;
}

export default function ProctoringLobby() {
  const [selectedLobby, setSelectedLobby] = useState<ProctoringLobby | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  
  const queryClient = useQueryClient();

  // Fetch proctoring lobbies
  const { data: lobbies = [], isLoading: isLoadingLobbies, refetch: refetchLobbies } = useQuery({
    queryKey: ["/api/proctoring-lobbies"],
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  // Fetch CAT exams for the dropdown
  const { data: catExams = [] } = useQuery({
    queryKey: ["/api/cat-exams"],
  });

  // Fetch students in selected lobby
  const { data: students = [], isLoading: isLoadingStudents, refetch: refetchStudents } = useQuery({
    queryKey: ["/api/proctoring-lobbies", selectedLobby?.id, "students"],
    enabled: !!selectedLobby?.id,
    refetchInterval: 3000, // Refresh every 3 seconds for live updates
  });

  const form = useForm<CreateLobbyFormData>({
    resolver: zodResolver(createLobbySchema),
    defaultValues: {
      maxStudents: 50,
      allowLateJoin: false,
      lateJoinCutoffMinutes: 10,
      requireStudentVerification: true,
      isPublic: false,
      autoGradeOnCompletion: true,
      generateReport: true,
    },
  });

  // Create lobby mutation
  const createLobbyMutation = useMutation({
    mutationFn: (data: CreateLobbyFormData) => apiRequest("/api/proctoring-lobbies", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data) 
    }),
    onSuccess: () => {
      toast({ title: "Success", description: "Proctoring lobby created successfully" });
      setIsCreateDialogOpen(false);
      form.reset();
      refetchLobbies();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create proctoring lobby", variant: "destructive" });
    },
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: (lobbyId: string) => apiRequest(`/api/proctoring-lobbies/${lobbyId}/start`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }),
    onSuccess: () => {
      toast({ title: "Success", description: "Proctoring session started" });
      refetchLobbies();
      if (selectedLobby) {
        setSelectedLobby(prev => prev ? { ...prev, status: 'waiting_for_students' } : null);
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to start session", variant: "destructive" });
    },
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: (lobbyId: string) => apiRequest(`/api/proctoring-lobbies/${lobbyId}/end`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }),
    onSuccess: () => {
      toast({ title: "Success", description: "Proctoring session ended" });
      refetchLobbies();
      if (selectedLobby) {
        setSelectedLobby(prev => prev ? { ...prev, status: 'completed' } : null);
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to end session", variant: "destructive" });
    },
  });

  // Verify student mutation
  const verifyStudentMutation = useMutation({
    mutationFn: ({ lobbyId, studentId }: { lobbyId: string; studentId: string }) => 
      apiRequest(`/api/proctoring-lobbies/${lobbyId}/verify/${studentId}`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Student verified successfully" });
      refetchStudents();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to verify student", variant: "destructive" });
    },
  });

  // Start exam for student mutation
  const startExamMutation = useMutation({
    mutationFn: ({ lobbyId, studentId, catExamId }: { lobbyId: string; studentId: string; catExamId: string }) => 
      apiRequest(`/api/proctoring-lobbies/${lobbyId}/start-exam/${studentId}`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catExamId })
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Exam started for student" });
      refetchStudents();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to start exam", variant: "destructive" });
    },
  });

  const onSubmit = (data: CreateLobbyFormData) => {
    createLobbyMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { variant: 'secondary' as const, color: 'bg-gray-500' },
      'scheduled': { variant: 'default' as const, color: 'bg-blue-500' },
      'waiting_for_students': { variant: 'default' as const, color: 'bg-yellow-500' },
      'active': { variant: 'default' as const, color: 'bg-green-500' },
      'completed': { variant: 'outline' as const, color: 'bg-gray-400' },
      'cancelled': { variant: 'destructive' as const, color: 'bg-red-500' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge variant={config.variant}>
        <div className={`w-2 h-2 rounded-full ${config.color} mr-2`} />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getStudentStatusBadge = (status: string) => {
    const statusConfig = {
      'waiting': { variant: 'secondary' as const, color: 'bg-gray-500' },
      'verified': { variant: 'default' as const, color: 'bg-green-500' },
      'exam_started': { variant: 'default' as const, color: 'bg-blue-500' },
      'exam_completed': { variant: 'outline' as const, color: 'bg-gray-400' },
      'flagged': { variant: 'destructive' as const, color: 'bg-red-500' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.waiting;
    
    return (
      <Badge variant={config.variant}>
        <div className={`w-2 h-2 rounded-full ${config.color} mr-2`} />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (isLoadingLobbies) {
    return <div className="flex items-center justify-center h-64">Loading proctoring lobbies...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Proctoring Lobbies</h1>
          <p className="text-gray-600 mt-2">Manage live proctored CAT exam sessions</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Shield className="w-4 h-4 mr-2" />
              Create Lobby
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Proctoring Lobby</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="catExamId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CAT Exam</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select CAT exam" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(catExams as any[]).map((exam: any) => (
                              <SelectItem key={exam.id} value={exam.id}>
                                {exam.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lobbyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lobby Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter lobby name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions for Students</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter exam instructions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduledStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Start Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="scheduledEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled End Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="maxStudents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Students</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="100" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="allowLateJoin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Allow Late Join</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lateJoinCutoffMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Late Join Cutoff (min)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="60" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requireStudentVerification"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Require Student Verification</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Public Lobby</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="accessCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Code (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter access code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="autoGradeOnCompletion"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Auto Grade on Completion</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="generateReport"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Generate Report</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLobbyMutation.isPending}>
                    {createLobbyMutation.isPending ? "Creating..." : "Create Lobby"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lobbies List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Your Lobbies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(lobbies as ProctoringLobby[]).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No lobbies created yet</p>
              ) : (
                (lobbies as ProctoringLobby[]).map((lobby: ProctoringLobby) => (
                  <Card 
                    key={lobby.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedLobby?.id === lobby.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedLobby(lobby)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold truncate">{lobby.lobbyName}</h3>
                          {getStatusBadge(lobby.status)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {lobby.currentStudentCount}/{lobby.maxStudents}
                          </div>
                          {lobby.scheduledStartTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(lobby.scheduledStartTime).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          {lobby.status === 'draft' && (
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                startSessionMutation.mutate(lobby.id);
                              }}
                              disabled={startSessionMutation.isPending}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Start
                            </Button>
                          )}
                          
                          {lobby.status === 'waiting_for_students' && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                endSessionMutation.mutate(lobby.id);
                              }}
                              disabled={endSessionMutation.isPending}
                            >
                              <Square className="w-3 h-3 mr-1" />
                              End
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lobby Details and Students */}
        <div className="lg:col-span-2">
          {selectedLobby ? (
            <div className="space-y-6">
              {/* Lobby Info */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedLobby.lobbyName}</CardTitle>
                      <p className="text-gray-600 mt-2">{selectedLobby.description}</p>
                    </div>
                    {getStatusBadge(selectedLobby.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedLobby.currentStudentCount}</div>
                      <div className="text-sm text-gray-600">Students Joined</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedLobby.maxStudents}</div>
                      <div className="text-sm text-gray-600">Max Capacity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {(students as Student[]).filter((s: Student) => s.status === 'verified').length}
                      </div>
                      <div className="text-sm text-gray-600">Verified</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {(students as Student[]).filter((s: Student) => s.flaggedForReview).length}
                      </div>
                      <div className="text-sm text-gray-600">Flagged</div>
                    </div>
                  </div>
                  
                  {selectedLobby.instructions && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Instructions:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedLobby.instructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Students Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Students in Lobby
                    {(students as Student[]).length > 0 && (
                      <Badge variant="secondary">{(students as Student[]).length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingStudents ? (
                    <div className="text-center py-8">Loading students...</div>
                  ) : (students as Student[]).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No students have joined yet</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Devices</TableHead>
                          <TableHead>Violations</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(students as Student[]).map((student: Student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{student.studentName}</div>
                                <div className="text-sm text-gray-600">{student.studentEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStudentStatusBadge(student.status)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(student.joinedAt).toLocaleTimeString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Badge variant={student.webcamStatus === 'active' ? 'default' : 'secondary'}>
                                  <Video className="w-3 h-3 mr-1" />
                                  Cam
                                </Badge>
                                <Badge variant={student.microphoneStatus === 'active' ? 'default' : 'secondary'}>
                                  🎤
                                </Badge>
                                <Badge variant={student.screenShareStatus === 'active' ? 'default' : 'secondary'}>
                                  <Eye className="w-3 h-3 mr-1" />
                                  Screen
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={student.totalViolations > 0 ? 'text-red-600 font-semibold' : ''}>
                                  {student.totalViolations}
                                </span>
                                {student.flaggedForReview && (
                                  <AlertTriangle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {student.status === 'waiting' && (
                                  <Button
                                    size="sm"
                                    onClick={() => verifyStudentMutation.mutate({
                                      lobbyId: selectedLobby.id,
                                      studentId: student.studentId
                                    })}
                                    disabled={verifyStudentMutation.isPending}
                                  >
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    Verify
                                  </Button>
                                )}
                                
                                {student.status === 'verified' && (
                                  <Button
                                    size="sm"
                                    onClick={() => startExamMutation.mutate({
                                      lobbyId: selectedLobby.id,
                                      studentId: student.studentId,
                                      catExamId: selectedLobby.catExamId
                                    })}
                                    disabled={startExamMutation.isPending}
                                  >
                                    <Play className="w-3 h-3 mr-1" />
                                    Start Exam
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Lobby</h3>
                <p className="text-gray-600">Choose a proctoring lobby from the list to view details and manage students</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}