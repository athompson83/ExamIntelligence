import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Cookie, Shield, BarChart, Bell, Camera, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ConsentPreferences {
  essential: boolean; // Always true - required for app to function
  analytics: boolean;
  performance: boolean;
  marketing: boolean;
  proctoring: boolean;
  consentTimestamp?: string;
  consentVersion?: string;
}

interface ConsentManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
  showBanner?: boolean;
}

export default function ConsentManager({ isOpen = false, onClose, showBanner = false }: ConsentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(isOpen);
  const [showBannerState, setShowBannerState] = useState(showBanner);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    performance: false,
    marketing: false,
    proctoring: false
  });

  // Fetch current consent preferences
  const { data: savedPreferences } = useQuery({
    queryKey: ["/api/user/consent-preferences"],
    retry: false
  });

  // Save consent preferences mutation
  const saveConsentMutation = useMutation({
    mutationFn: (data: ConsentPreferences) =>
      apiRequest("POST", "/api/user/consent-preferences", data),
    onSuccess: () => {
      toast({
        title: "Preferences Saved",
        description: "Your privacy preferences have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/consent-preferences"] });
      localStorage.setItem("consent_given", "true");
      localStorage.setItem("consent_timestamp", new Date().toISOString());
      setShowBannerState(false);
      setOpen(false);
      if (onClose) onClose();
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Check if user has given consent before
    const hasConsented = localStorage.getItem("consent_given");
    if (!hasConsented && !savedPreferences) {
      setShowBannerState(true);
    }

    if (savedPreferences) {
      setPreferences(savedPreferences);
    }
  }, [savedPreferences]);

  const handleAcceptAll = () => {
    const allAccepted = {
      ...preferences,
      analytics: true,
      performance: true,
      marketing: true,
      proctoring: true,
      consentTimestamp: new Date().toISOString(),
      consentVersion: "1.0"
    };
    setPreferences(allAccepted);
    saveConsentMutation.mutate(allAccepted);
  };

  const handleRejectNonEssential = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      performance: false,
      marketing: false,
      proctoring: false,
      consentTimestamp: new Date().toISOString(),
      consentVersion: "1.0"
    };
    setPreferences(essentialOnly);
    saveConsentMutation.mutate(essentialOnly);
  };

  const handleSavePreferences = () => {
    const updatedPreferences = {
      ...preferences,
      consentTimestamp: new Date().toISOString(),
      consentVersion: "1.0"
    };
    saveConsentMutation.mutate(updatedPreferences);
  };

  const consentOptions = [
    {
      id: "essential",
      title: "Essential Cookies",
      description: "Required for the application to function properly. Cannot be disabled.",
      icon: Cookie,
      required: true
    },
    {
      id: "analytics",
      title: "Analytics & Statistics",
      description: "Help us understand how you use the platform to improve educational outcomes.",
      icon: BarChart,
      required: false
    },
    {
      id: "performance",
      title: "Performance Monitoring",
      description: "Monitor app performance and identify technical issues for better user experience.",
      icon: Shield,
      required: false
    },
    {
      id: "marketing",
      title: "Marketing & Communications",
      description: "Receive updates about new features, educational resources, and platform improvements.",
      icon: Bell,
      required: false
    },
    {
      id: "proctoring",
      title: "Proctoring & Recording",
      description: "Enable exam monitoring and recording features when required by your institution.",
      icon: Camera,
      required: false
    }
  ];

  // Consent Banner
  if (showBannerState && !open) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg animate-in slide-in-from-bottom-0 duration-300">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Cookie className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Privacy & Cookie Settings</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                We use cookies and similar technologies to provide you with the best educational experience. 
                Some are essential for the platform to function, while others help us improve our services.
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Link href="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                <span className="text-muted-foreground">•</span>
                <button 
                  onClick={() => setOpen(true)}
                  className="text-primary hover:underline"
                  data-testid="button-manage-preferences"
                >
                  Manage Preferences
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleRejectNonEssential}
                data-testid="button-reject-cookies"
              >
                Essential Only
              </Button>
              <Button 
                onClick={handleAcceptAll}
                data-testid="button-accept-all-cookies"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Consent Management Dialog
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-[90vw] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy Preferences
          </SheetTitle>
          <SheetDescription>
            Manage how we collect and use your data to provide educational services.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              We respect your privacy. Your preferences apply to all data collection and processing activities. 
              You can change these settings at any time.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {consentOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card key={option.id} className={option.required ? "border-primary/20" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">{option.title}</CardTitle>
                      </div>
                      <Switch
                        id={option.id}
                        checked={preferences[option.id as keyof ConsentPreferences] as boolean}
                        onCheckedChange={(checked) => {
                          if (!option.required) {
                            setPreferences(prev => ({ ...prev, [option.id]: checked }));
                          }
                        }}
                        disabled={option.required}
                        data-testid={`switch-consent-${option.id}`}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {option.description}
                      {option.required && (
                        <span className="block mt-1 text-xs text-primary">
                          Required for basic functionality
                        </span>
                      )}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Your Rights</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Access and export your personal data</li>
              <li>• Request correction of inaccurate information</li>
              <li>• Request deletion of your data (with exceptions for educational records)</li>
              <li>• Withdraw consent at any time</li>
              <li>• Lodge a complaint with supervisory authorities</li>
            </ul>
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setOpen(false);
              setShowBannerState(false);
            }}
            data-testid="button-cancel-consent"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSavePreferences}
            disabled={saveConsentMutation.isPending}
            data-testid="button-save-consent"
          >
            {saveConsentMutation.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}