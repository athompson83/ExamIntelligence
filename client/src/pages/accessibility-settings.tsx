import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Volume2, 
  Eye, 
  MousePointer, 
  Keyboard, 
  AccessibilityIcon,
  Settings,
  TestTube,
  VolumeX,
  Play,
  Pause
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AccessibilitySettings {
  highContrast: boolean;
  textToSpeech: boolean;
  fontSize: string;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
  voiceSpeed: number;
  voicePitch: number;
  autoReadContent: boolean;
}

export default function AccessibilitySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [testText] = useState("This is a test of the text-to-speech feature. You can adjust the speed and pitch using the controls below.");

  // Fetch current accessibility settings
  const { data: settings, isLoading } = useQuery<AccessibilitySettings>({
    queryKey: ["/api/accessibility-settings"],
  });

  // Mutation to update settings
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: AccessibilitySettings) =>
      apiRequest("/api/accessibility-settings", {
        method: "PUT",
        body: JSON.stringify(newSettings),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessibility-settings"] });
      toast({
        title: "Settings Updated",
        description: "Your accessibility preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update accessibility settings.",
        variant: "destructive",
      });
    },
  });

  // Apply accessibility settings to the document
  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;
    
    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Font size
    root.style.setProperty('--font-size-multiplier', 
      settings.fontSize === 'small' ? '0.875' :
      settings.fontSize === 'large' ? '1.125' :
      settings.fontSize === 'extra-large' ? '1.25' : '1'
    );

    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }

    // Keyboard navigation focus enhancement
    if (settings.keyboardNavigation) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

  }, [settings]);

  // Text-to-speech functions
  const speak = (text: string) => {
    if (!settings?.textToSpeech) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.voiceSpeed;
    utterance.pitch = settings.voicePitch;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const testTextToSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(testText);
    }
  };

  const updateSetting = (key: keyof AccessibilitySettings, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings, [key]: value };
    updateSettingsMutation.mutate(newSettings);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AccessibilityIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Settings Not Found</h3>
          <p className="text-gray-500">Unable to load accessibility settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <AccessibilityIcon className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Accessibility Settings</h1>
          <p className="text-gray-600">Customize your experience for better accessibility</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Visual Accessibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visual Accessibility
            </CardTitle>
            <CardDescription>
              Adjust visual settings for better readability and contrast
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="high-contrast">High Contrast Mode</Label>
                <p className="text-sm text-gray-500">
                  Increases contrast for better visibility
                </p>
              </div>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Font Size</Label>
              <Select
                value={settings.fontSize}
                onValueChange={(value) => updateSetting('fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium (Default)</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra-large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="reduced-motion">Reduced Motion</Label>
                <p className="text-sm text-gray-500">
                  Minimizes animations and transitions
                </p>
              </div>
              <Switch
                id="reduced-motion"
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Audio & Speech */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Audio & Speech
            </CardTitle>
            <CardDescription>
              Configure text-to-speech and audio assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="text-to-speech">Text-to-Speech</Label>
                <p className="text-sm text-gray-500">
                  Enable voice reading of content
                </p>
              </div>
              <Switch
                id="text-to-speech"
                checked={settings.textToSpeech}
                onCheckedChange={(checked) => updateSetting('textToSpeech', checked)}
              />
            </div>

            {settings.textToSpeech && (
              <>
                <Separator />

                <div className="space-y-3">
                  <Label>Voice Speed: {settings.voiceSpeed.toFixed(1)}x</Label>
                  <Slider
                    value={[settings.voiceSpeed]}
                    onValueChange={([value]) => updateSetting('voiceSpeed', value)}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Voice Pitch: {settings.voicePitch.toFixed(1)}</Label>
                  <Slider
                    value={[settings.voicePitch]}
                    onValueChange={([value]) => updateSetting('voicePitch', value)}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Test Text-to-Speech</Label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {testText}
                  </div>
                  <Button
                    onClick={testTextToSpeech}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {isSpeaking ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Reading
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Test Voice
                      </>
                    )}
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-read">Auto-Read Content</Label>
                    <p className="text-sm text-gray-500">
                      Automatically read new content
                    </p>
                  </div>
                  <Switch
                    id="auto-read"
                    checked={settings.autoReadContent}
                    onCheckedChange={(checked) => updateSetting('autoReadContent', checked)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation & Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Navigation & Input
            </CardTitle>
            <CardDescription>
              Enhance keyboard and navigation accessibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="keyboard-nav">Enhanced Keyboard Navigation</Label>
                <p className="text-sm text-gray-500">
                  Improved focus indicators and keyboard support
                </p>
              </div>
              <Switch
                id="keyboard-nav"
                checked={settings.keyboardNavigation}
                onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="screen-reader">Screen Reader Optimization</Label>
                <p className="text-sm text-gray-500">
                  Enhanced compatibility with screen readers
                </p>
              </div>
              <Switch
                id="screen-reader"
                checked={settings.screenReader}
                onCheckedChange={(checked) => updateSetting('screenReader', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Active Settings
            </CardTitle>
            <CardDescription>
              Summary of your current accessibility preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {settings.highContrast && (
                <Badge variant="secondary" className="mr-2">
                  High Contrast
                </Badge>
              )}
              {settings.textToSpeech && (
                <Badge variant="secondary" className="mr-2">
                  Text-to-Speech
                </Badge>
              )}
              {settings.fontSize !== 'medium' && (
                <Badge variant="secondary" className="mr-2">
                  Font: {settings.fontSize}
                </Badge>
              )}
              {settings.reducedMotion && (
                <Badge variant="secondary" className="mr-2">
                  Reduced Motion
                </Badge>
              )}
              {settings.keyboardNavigation && (
                <Badge variant="secondary" className="mr-2">
                  Enhanced Navigation
                </Badge>
              )}
              {settings.screenReader && (
                <Badge variant="secondary" className="mr-2">
                  Screen Reader
                </Badge>
              )}
              {!settings.highContrast && 
               !settings.textToSpeech && 
               settings.fontSize === 'medium' && 
               !settings.reducedMotion && 
               !settings.keyboardNavigation && 
               !settings.screenReader && (
                <p className="text-gray-500 text-sm">No accessibility features enabled</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Accessibility Help
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-1">Keyboard Shortcuts</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Tab - Navigate between elements</li>
                <li>• Space/Enter - Activate buttons and links</li>
                <li>• Escape - Close dialogs and menus</li>
                <li>• Arrow keys - Navigate within menus</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Text-to-Speech</h4>
              <p className="text-gray-600">
                When enabled, content will be read aloud. You can adjust voice speed and pitch to your preference.
                Use the test button to preview your settings.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">High Contrast Mode</h4>
              <p className="text-gray-600">
                Increases color contrast for better visibility. This is especially helpful for users with
                visual impairments or in bright lighting conditions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}