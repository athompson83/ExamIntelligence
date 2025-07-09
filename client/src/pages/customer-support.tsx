import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  FileText,
  Send,
  Home,
  ChevronRight,
  Headphones,
  Book,
  HelpCircle,
  MessageSquare,
  ExternalLink,
  Star,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import Layout from "@/components/Layout";
import { FeatureTooltip, AdminTooltip } from "@/components/SmartTooltip";

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  userId: string;
  userName: string;
  userEmail: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  responses: Array<{
    id: string;
    message: string;
    isStaff: boolean;
    createdAt: string;
    author: string;
  }>;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  notHelpful: number;
  views: number;
}

interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  lastUpdated: string;
}

export default function CustomerSupport() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as const
  });
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketResponse, setTicketResponse] = useState("");
  const { toast } = useToast();

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/support/tickets'],
  });

  const { data: faqs = [], isLoading: faqsLoading } = useQuery({
    queryKey: ['/api/support/faqs'],
  });

  const { data: knowledgeBase = [] } = useQuery({
    queryKey: ['/api/support/knowledge-base'],
  });

  const { data: supportStats } = useQuery({
    queryKey: ['/api/support/stats'],
  });

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: typeof newTicket) => {
      return apiRequest('/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
      setShowCreateTicket(false);
      setNewTicket({ title: "", description: "", category: "", priority: "medium" });
      toast({
        title: "Ticket Created",
        description: "Your support ticket has been submitted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    }
  });

  const respondToTicketMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      return apiRequest(`/api/support/tickets/${ticketId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
      setTicketResponse("");
      toast({
        title: "Response Sent",
        description: "Your response has been added to the ticket.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      return apiRequest(`/api/support/tickets/${ticketId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
      toast({
        title: "Status Updated",
        description: "Ticket status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ticket status. Please try again.",
        variant: "destructive",
      });
    }
  });

  const rateFAQMutation = useMutation({
    mutationFn: async ({ faqId, helpful }: { faqId: string; helpful: boolean }) => {
      return apiRequest(`/api/support/faqs/${faqId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ helpful })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/faqs'] });
      toast({
        title: "Thank You",
        description: "Your feedback has been recorded.",
      });
    }
  });

  const filteredTickets = tickets.filter((ticket: SupportTicket) => {
    const matchesCategory = selectedCategory === "all" || ticket.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || ticket.status === selectedStatus;
    const matchesPriority = selectedPriority === "all" || ticket.priority === selectedPriority;
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const categories = [
    { value: "technical", label: "Technical Issue" },
    { value: "account", label: "Account & Billing" },
    { value: "feature", label: "Feature Request" },
    { value: "quiz", label: "Quiz Issues" },
    { value: "proctoring", label: "Proctoring" },
    { value: "other", label: "Other" }
  ];

  if (ticketsLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
          <span>Customer Support</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Customer Support</h1>
            <p className="text-muted-foreground mt-1">
              Get help and support for your questions and issues
            </p>
          </div>
          <FeatureTooltip
            id="create-support-ticket"
            title="Create Support Ticket 🎫"
            content="Submit a new support ticket to get help with technical issues, account problems, or feature requests."
            position="top"
          >
            <Button onClick={() => setShowCreateTicket(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </FeatureTooltip>
        </div>

        {/* Support Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Open Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {supportStats?.openTickets || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Awaiting response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {supportStats?.avgResponseTime || '2.5'}h
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Average response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Resolved Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {supportStats?.resolvedToday || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Tickets resolved today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {supportStats?.satisfaction || 95}%
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Customer satisfaction
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search tickets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tickets List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((ticket: SupportTicket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedTicket(ticket)}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{ticket.title}</CardTitle>
                      <div className="flex gap-2">
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                      </span>
                      <span className="text-gray-500">
                        {ticket.responses.length} responses
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faqs.map((faq: FAQ) => (
                    <Card key={faq.id} className="border-l-4 border-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{faq.question}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-4">{faq.answer}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => rateFAQMutation.mutate({ faqId: faq.id, helpful: true })}
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Helpful ({faq.helpful})
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => rateFAQMutation.mutate({ faqId: faq.id, helpful: false })}
                            >
                              <ThumbsDown className="h-4 w-4 mr-1" />
                              Not Helpful ({faq.notHelpful})
                            </Button>
                          </div>
                          <span className="text-sm text-gray-500">{faq.views} views</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {knowledgeBase.map((article: KnowledgeBase) => (
                    <Card key={article.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        <Badge variant="outline">{article.category}</Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-3 line-clamp-3">{article.content}</p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">
                            Updated: {format(new Date(article.lastUpdated), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-gray-500">{article.views} views</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Support Channels</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-3 text-blue-600" />
                        <div>
                          <p className="font-medium">Email Support</p>
                          <p className="text-sm text-gray-600">support@proficiencyai.com</p>
                          <p className="text-xs text-gray-500">Response within 24 hours</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 mr-3 text-green-600" />
                        <div>
                          <p className="font-medium">Phone Support</p>
                          <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                          <p className="text-xs text-gray-500">Mon-Fri 9AM-6PM EST</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 mr-3 text-purple-600" />
                        <div>
                          <p className="font-medium">Live Chat</p>
                          <p className="text-sm text-gray-600">Available on website</p>
                          <p className="text-xs text-gray-500">Mon-Fri 9AM-6PM EST</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Resources</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Book className="h-4 w-4 mr-2" />
                        User Guide
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        API Documentation
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Video Tutorials
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Ticket Dialog */}
        <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Brief description of your issue"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newTicket.category} onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTicket.priority} onValueChange={(value: any) => setNewTicket({ ...newTicket, priority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of your issue..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateTicket(false)}>
                  Cancel
                </Button>
                <Button onClick={() => createTicketMutation.mutate(newTicket)}>
                  Create Ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Ticket Details Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedTicket?.title}</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => updateTicketStatusMutation.mutate({ ticketId: selectedTicket.id, status: value })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Original Message:</p>
                  <p className="text-gray-700">{selectedTicket.description}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Responses</h4>
                  {selectedTicket.responses.map((response) => (
                    <div key={response.id} className={`p-3 rounded-lg ${response.isStaff ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{response.author}</span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(response.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-gray-700">{response.message}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your response..."
                    value={ticketResponse}
                    onChange={(e) => setTicketResponse(e.target.value)}
                    rows={3}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => respondToTicketMutation.mutate({ ticketId: selectedTicket.id, message: ticketResponse })}
                    disabled={!ticketResponse.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}