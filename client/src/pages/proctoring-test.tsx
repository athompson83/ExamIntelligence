import React, { useState, useEffect } from 'react';
import { CrossPlatformProctoring } from '@/components/CrossPlatformProctoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Monitor, 
  Camera, 
  Mic, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Smartphone,
  Laptop,
  Tablet,
  Download,
  TestTube
} from 'lucide-react';

interface ProctoringTestPageProps {}

interface ProctoringViolation {
  type: string;
  timestamp: Date;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface ProctoringStatus {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenShareEnabled: boolean;
  fullscreenEnabled: boolean;
  deviceLocked: boolean;
  violations: ProctoringViolation[];
}

export const ProctoringTestPage: React.FC<ProctoringTestPageProps> = () => {
  const [proctoringSettings, setProctoringSettings] = useState({
    requireCamera: true,
    requireMicrophone: true,
    requireFullscreen: false,
    preventTabSwitching: true,
    lockOrientation: true,
    allowScreenShare: false,
  });

  const [proctoringStatus, setProctoringStatus] = useState<ProctoringStatus>({
    cameraEnabled: false,
    microphoneEnabled: false,
    screenShareEnabled: false,
    fullscreenEnabled: false,
    deviceLocked: false,
    violations: []
  });

  const [testResults, setTestResults] = useState<{
    deviceDetection: boolean;
    cameraAccess: boolean;
    microphoneAccess: boolean;
    screenShareAccess: boolean;
    fullscreenSupport: boolean;
    orientationLock: boolean;
    violationDetection: boolean;
  }>({
    deviceDetection: false,
    cameraAccess: false,
    microphoneAccess: false,
    screenShareAccess: false,
    fullscreenSupport: false,
    orientationLock: false,
    violationDetection: false
  });

  const [deviceInfo, setDeviceInfo] = useState<{
    userAgent: string;
    platform: string;
    deviceType: string;
    screenSize: string;
    hasCamera: boolean;
    hasMicrophone: boolean;
    supportsFullscreen: boolean;
    supportsScreenShare: boolean;
    supportsOrientationLock: boolean;
  }>({
    userAgent: '',
    platform: '',
    deviceType: '',
    screenSize: '',
    hasCamera: false,
    hasMicrophone: false,
    supportsFullscreen: false,
    supportsScreenShare: false,
    supportsOrientationLock: false
  });

  const { toast } = useToast();

  // Detect device capabilities on mount
  useEffect(() => {
    const detectDevice = async () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const platform = navigator.platform.toLowerCase();
      
      let deviceType = 'laptop';
      if (userAgent.includes('iphone') || userAgent.includes('android')) {
        deviceType = 'mobile';
      } else if (userAgent.includes('ipad') || userAgent.includes('tablet')) {
        deviceType = 'tablet';
      }

      const screenSize = `${screen.width}x${screen.height}`;
      
      // Check media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      const hasMicrophone = devices.some(device => device.kind === 'audioinput');
      
      // Check API support
      const supportsFullscreen = 'requestFullscreen' in document.documentElement;
      const supportsScreenShare = 'getDisplayMedia' in navigator.mediaDevices;
      const supportsOrientationLock = 'orientation' in screen && 'lock' in (screen as any).orientation;

      setDeviceInfo({
        userAgent,
        platform,
        deviceType,
        screenSize,
        hasCamera,
        hasMicrophone,
        supportsFullscreen,
        supportsScreenShare,
        supportsOrientationLock
      });

      setTestResults(prev => ({
        ...prev,
        deviceDetection: true
      }));
    };

    detectDevice();
  }, []);

  // Handle proctoring violations
  const handleViolation = (violation: ProctoringViolation) => {
    console.log('Proctoring violation:', violation);
    
    setTestResults(prev => ({
      ...prev,
      violationDetection: true
    }));

    toast({
      title: `Violation Detected: ${violation.severity.toUpperCase()}`,
      description: violation.description,
      variant: violation.severity === 'high' ? 'destructive' : 'default'
    });
  };

  // Handle proctoring status updates
  const handleStatusChange = (status: ProctoringStatus) => {
    setProctoringStatus(status);
    
    setTestResults(prev => ({
      ...prev,
      cameraAccess: status.cameraEnabled,
      microphoneAccess: status.microphoneEnabled,
      screenShareAccess: status.screenShareEnabled,
      fullscreenSupport: status.fullscreenEnabled,
      orientationLock: status.deviceLocked
    }));
  };

  // Test violation detection
  const testViolationDetection = () => {
    const testViolation: ProctoringViolation = {
      type: 'test_violation',
      timestamp: new Date(),
      description: 'Test violation triggered manually',
      severity: 'medium'
    };
    
    handleViolation(testViolation);
  };

  // Export test results
  const exportTestResults = () => {
    const results = {
      timestamp: new Date().toISOString(),
      deviceInfo,
      proctoringSettings,
      testResults,
      violations: proctoringStatus.violations
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proctoring-test-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTestStatus = (result: boolean) => {
    return result ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Pass
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Fail
      </Badge>
    );
  };

  const getDeviceIcon = () => {
    switch (deviceInfo.deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Laptop className="w-5 h-5" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Proctoring System Test</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive testing of cross-platform proctoring functionality
          </p>
        </div>
        <Button onClick={exportTestResults} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Results
        </Button>
      </div>

      <Tabs defaultValue="device-info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="device-info">Device Info</TabsTrigger>
          <TabsTrigger value="proctoring-test">Proctoring Test</TabsTrigger>
          <TabsTrigger value="test-results">Test Results</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
        </TabsList>

        <TabsContent value="device-info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getDeviceIcon()}
                Device Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Device Type</Label>
                  <p className="text-sm text-gray-600 capitalize">{deviceInfo.deviceType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Platform</Label>
                  <p className="text-sm text-gray-600">{deviceInfo.platform}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Screen Size</Label>
                  <p className="text-sm text-gray-600">{deviceInfo.screenSize}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">User Agent</Label>
                  <p className="text-sm text-gray-600 truncate">{deviceInfo.userAgent}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    <span className="text-sm">Camera</span>
                  </div>
                  {getTestStatus(deviceInfo.hasCamera)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    <span className="text-sm">Microphone</span>
                  </div>
                  {getTestStatus(deviceInfo.hasMicrophone)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    <span className="text-sm">Screen Share</span>
                  </div>
                  {getTestStatus(deviceInfo.supportsScreenShare)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Fullscreen</span>
                  </div>
                  {getTestStatus(deviceInfo.supportsFullscreen)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-sm">Orientation Lock</span>
                  </div>
                  {getTestStatus(deviceInfo.supportsOrientationLock)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proctoring-test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proctoring Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="require-camera">Require Camera</Label>
                  <Switch
                    id="require-camera"
                    checked={proctoringSettings.requireCamera}
                    onCheckedChange={(checked) => 
                      setProctoringSettings(prev => ({ ...prev, requireCamera: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="require-microphone">Require Microphone</Label>
                  <Switch
                    id="require-microphone"
                    checked={proctoringSettings.requireMicrophone}
                    onCheckedChange={(checked) => 
                      setProctoringSettings(prev => ({ ...prev, requireMicrophone: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="require-fullscreen">Require Fullscreen</Label>
                  <Switch
                    id="require-fullscreen"
                    checked={proctoringSettings.requireFullscreen}
                    onCheckedChange={(checked) => 
                      setProctoringSettings(prev => ({ ...prev, requireFullscreen: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="prevent-tab-switching">Prevent Tab Switching</Label>
                  <Switch
                    id="prevent-tab-switching"
                    checked={proctoringSettings.preventTabSwitching}
                    onCheckedChange={(checked) => 
                      setProctoringSettings(prev => ({ ...prev, preventTabSwitching: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="lock-orientation">Lock Orientation</Label>
                  <Switch
                    id="lock-orientation"
                    checked={proctoringSettings.lockOrientation}
                    onCheckedChange={(checked) => 
                      setProctoringSettings(prev => ({ ...prev, lockOrientation: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allow-screen-share">Allow Screen Share</Label>
                  <Switch
                    id="allow-screen-share"
                    checked={proctoringSettings.allowScreenShare}
                    onCheckedChange={(checked) => 
                      setProctoringSettings(prev => ({ ...prev, allowScreenShare: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <CrossPlatformProctoring
            examId="test-exam-001"
            onViolation={handleViolation}
            onStatusChange={handleStatusChange}
            settings={proctoringSettings}
          />
        </TabsContent>

        <TabsContent value="test-results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Test Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Device Detection</span>
                  {getTestStatus(testResults.deviceDetection)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Camera Access</span>
                  {getTestStatus(testResults.cameraAccess)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Microphone Access</span>
                  {getTestStatus(testResults.microphoneAccess)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Screen Share Access</span>
                  {getTestStatus(testResults.screenShareAccess)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Fullscreen Support</span>
                  {getTestStatus(testResults.fullscreenSupport)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Orientation Lock</span>
                  {getTestStatus(testResults.orientationLock)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Violation Detection</span>
                  {getTestStatus(testResults.violationDetection)}
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button onClick={testViolationDetection} variant="outline">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Test Violation Detection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Violation Log</CardTitle>
            </CardHeader>
            <CardContent>
              {proctoringStatus.violations.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No violations detected. The proctoring system is working correctly.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {proctoringStatus.violations.map((violation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={violation.severity === 'high' ? 'destructive' : 'default'}>
                          {violation.severity.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{violation.description}</p>
                          <p className="text-xs text-gray-500">
                            {violation.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
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
};

export default ProctoringTestPage;