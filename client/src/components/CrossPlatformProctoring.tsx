import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import CameraSourceSelector from '@/components/CameraSourceSelector';
import { 
  Camera, 
  Mic, 
  Shield, 
  Monitor, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Smartphone,
  Laptop,
  Tablet
} from 'lucide-react';

interface ProctoringState {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenShareEnabled: boolean;
  fullscreenEnabled: boolean;
  deviceLocked: boolean;
  violations: Array<{
    type: string;
    timestamp: Date;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface DeviceCapabilities {
  hasCamera: boolean;
  hasMicrophone: boolean;
  canScreenShare: boolean;
  canFullscreen: boolean;
  canLockOrientation: boolean;
  deviceType: 'laptop' | 'tablet' | 'mobile';
  platform: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown';
}

interface CrossPlatformProctoringProps {
  examId: string;
  onViolation: (violation: any) => void;
  onStatusChange: (status: ProctoringState) => void;
  settings: {
    requireCamera: boolean;
    requireMicrophone: boolean;
    requireFullscreen: boolean;
    preventTabSwitching: boolean;
    lockOrientation: boolean;
    allowScreenShare: boolean;
  };
}

export const CrossPlatformProctoring: React.FC<CrossPlatformProctoringProps> = ({
  examId,
  onViolation,
  onStatusChange,
  settings
}) => {
  const [state, setState] = useState<ProctoringState>({
    cameraEnabled: false,
    microphoneEnabled: false,
    screenShareEnabled: false,
    fullscreenEnabled: false,
    deviceLocked: false,
    violations: []
  });
  
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>({
    hasCamera: false,
    hasMicrophone: false,
    canScreenShare: false,
    canFullscreen: false,
    canLockOrientation: false,
    deviceType: 'laptop',
    platform: 'unknown'
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const violationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Detect device capabilities
  const detectDeviceCapabilities = useCallback(async (): Promise<DeviceCapabilities> => {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    
    // Detect device type and platform
    let deviceType: DeviceCapabilities['deviceType'] = 'laptop';
    let platformType: DeviceCapabilities['platform'] = 'unknown';
    
    // Platform detection
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      deviceType = userAgent.includes('ipad') ? 'tablet' : 'mobile';
      platformType = 'ios';
    } else if (userAgent.includes('android')) {
      deviceType = userAgent.includes('tablet') ? 'tablet' : 'mobile';
      platformType = 'android';
    } else if (platform.includes('mac')) {
      platformType = 'macos';
    } else if (platform.includes('win')) {
      platformType = 'windows';
    } else if (platform.includes('linux')) {
      platformType = 'linux';
    }
    
    // Check for media device capabilities
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some(device => device.kind === 'videoinput');
    const hasMicrophone = devices.some(device => device.kind === 'audioinput');
    
    // Check for screen sharing capability
    const canScreenShare = 'getDisplayMedia' in navigator.mediaDevices;
    
    // Check for fullscreen capability
    const canFullscreen = 'requestFullscreen' in document.documentElement || 
                         'webkitRequestFullscreen' in document.documentElement;
    
    // Check for orientation lock (mainly mobile)
    const canLockOrientation = 'orientation' in screen && 'lock' in (screen as any).orientation;
    
    return {
      hasCamera,
      hasMicrophone,
      canScreenShare,
      canFullscreen,
      canLockOrientation,
      deviceType,
      platform: platformType
    };
  }, []);

  // Initialize camera and microphone
  const initializeCamera = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: settings.requireMicrophone
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      mediaStreamRef.current = stream;
      
      setState(prev => ({
        ...prev,
        cameraEnabled: true,
        microphoneEnabled: settings.requireMicrophone
      }));
      
      return true;
    } catch (error) {
      console.error('Camera initialization error:', error);
      
      let errorMessage = 'Failed to access camera';
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera access denied. Please allow camera permissions.';
            break;
          case 'NotFoundError':
            errorMessage = 'No camera found on this device.';
            break;
          case 'NotReadableError':
            errorMessage = 'Camera is being used by another application.';
            break;
        }
      }
      
      setInitializationError(errorMessage);
      return false;
    }
  }, [settings.requireMicrophone]);

  // Initialize screen sharing (for laptops)
  const initializeScreenShare = useCallback(async () => {
    if (!deviceCapabilities.canScreenShare || !settings.allowScreenShare) return false;
    
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      screenStreamRef.current = stream;
      
      setState(prev => ({
        ...prev,
        screenShareEnabled: true
      }));
      
      return true;
    } catch (error) {
      console.error('Screen share initialization error:', error);
      return false;
    }
  }, [deviceCapabilities.canScreenShare, settings.allowScreenShare]);

  // Initialize fullscreen mode
  const initializeFullscreen = useCallback(async () => {
    if (!deviceCapabilities.canFullscreen || !settings.requireFullscreen) return false;
    
    try {
      await document.documentElement.requestFullscreen();
      
      setState(prev => ({
        ...prev,
        fullscreenEnabled: true
      }));
      
      return true;
    } catch (error) {
      console.error('Fullscreen initialization error:', error);
      return false;
    }
  }, [deviceCapabilities.canFullscreen, settings.requireFullscreen]);

  // Lock device orientation (mobile/tablet)
  const lockOrientation = useCallback(async () => {
    if (!deviceCapabilities.canLockOrientation || !settings.lockOrientation) return false;
    
    try {
      await (screen as any).orientation.lock('portrait');
      
      setState(prev => ({
        ...prev,
        deviceLocked: true
      }));
      
      return true;
    } catch (error) {
      console.error('Orientation lock error:', error);
      return false;
    }
  }, [deviceCapabilities.canLockOrientation, settings.lockOrientation]);

  // Add violation
  const addViolation = useCallback((type: string, description: string, severity: 'low' | 'medium' | 'high' = 'medium') => {
    const violation = {
      type,
      timestamp: new Date(),
      description,
      severity
    };
    
    setState(prev => ({
      ...prev,
      violations: [...prev.violations, violation]
    }));
    
    onViolation(violation);
    
    toast({
      title: `Proctoring Alert: ${severity.toUpperCase()}`,
      description,
      variant: severity === 'high' ? 'destructive' : 'default'
    });
  }, [onViolation, toast]);

  // Monitor for violations
  useEffect(() => {
    if (!isInitialized) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation('tab_switch', 'Student switched tabs or minimized window', 'high');
      }
    };
    
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && settings.requireFullscreen) {
        addViolation('fullscreen_exit', 'Student exited fullscreen mode', 'high');
      }
    };
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (settings.preventTabSwitching) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? This will be recorded as a violation.';
      }
    };
    
    const handleOrientationChange = () => {
      if (deviceCapabilities.deviceType !== 'laptop') {
        addViolation('orientation_change', 'Device orientation changed', 'medium');
      }
    };
    
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isInitialized, settings, deviceCapabilities, addViolation]);

  // Initialize proctoring
  const initializeProctoring = useCallback(async () => {
    try {
      setInitializationError(null);
      
      // Detect device capabilities
      const capabilities = await detectDeviceCapabilities();
      setDeviceCapabilities(capabilities);
      
      // Initialize camera if required
      if (settings.requireCamera && capabilities.hasCamera) {
        const cameraSuccess = await initializeCamera();
        if (!cameraSuccess) {
          throw new Error('Failed to initialize camera');
        }
      }
      
      // Initialize screen sharing if available and enabled
      if (capabilities.canScreenShare && settings.allowScreenShare) {
        await initializeScreenShare();
      }
      
      // Initialize fullscreen if required
      if (capabilities.canFullscreen && settings.requireFullscreen) {
        await initializeFullscreen();
      }
      
      // Lock orientation if required (mobile/tablet)
      if (capabilities.canLockOrientation && settings.lockOrientation) {
        await lockOrientation();
      }
      
      setIsInitialized(true);
      
      toast({
        title: 'Proctoring Initialized',
        description: `${capabilities.deviceType} proctoring active on ${capabilities.platform}`,
      });
      
    } catch (error) {
      console.error('Proctoring initialization failed:', error);
      setInitializationError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [
    detectDeviceCapabilities,
    initializeCamera,
    initializeScreenShare,
    initializeFullscreen,
    lockOrientation,
    settings,
    toast
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current);
      }
    };
  }, []);

  // Update parent component with state changes
  useEffect(() => {
    onStatusChange(state);
  }, [state, onStatusChange]);

  const getDeviceIcon = () => {
    switch (deviceCapabilities.deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Laptop className="w-5 h-5" />;
    }
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (enabled: boolean) => {
    return enabled ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Cross-Platform Proctoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Information */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {getDeviceIcon()}
            <span className="font-medium capitalize">
              {deviceCapabilities.deviceType} - {deviceCapabilities.platform}
            </span>
          </div>
          <Badge variant={isInitialized ? 'default' : 'secondary'}>
            {isInitialized ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Initialization Error */}
        {initializationError && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{initializationError}</AlertDescription>
          </Alert>
        )}

        {/* Camera Preview */}
        {state.cameraEnabled && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-sm">
              LIVE
            </div>
          </div>
        )}

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="text-sm">Camera</span>
            </div>
            <div className={`flex items-center gap-1 ${getStatusColor(state.cameraEnabled)}`}>
              {getStatusIcon(state.cameraEnabled)}
              <span className="text-sm">{state.cameraEnabled ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <span className="text-sm">Microphone</span>
            </div>
            <div className={`flex items-center gap-1 ${getStatusColor(state.microphoneEnabled)}`}>
              {getStatusIcon(state.microphoneEnabled)}
              <span className="text-sm">{state.microphoneEnabled ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span className="text-sm">Screen Share</span>
            </div>
            <div className={`flex items-center gap-1 ${getStatusColor(state.screenShareEnabled)}`}>
              {getStatusIcon(state.screenShareEnabled)}
              <span className="text-sm">{state.screenShareEnabled ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Fullscreen</span>
            </div>
            <div className={`flex items-center gap-1 ${getStatusColor(state.fullscreenEnabled)}`}>
              {getStatusIcon(state.fullscreenEnabled)}
              <span className="text-sm">{state.fullscreenEnabled ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>

        {/* Violations Summary */}
        {state.violations.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Violations</span>
              <Badge variant="destructive">{state.violations.length}</Badge>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {state.violations.slice(-5).map((violation, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded text-sm">
                  <span>{violation.description}</span>
                  <Badge variant="outline" className="text-xs">
                    {violation.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Camera Source Selector */}
        {(settings.requireCamera || settings.requireMicrophone) && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Camera & Microphone Setup</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCameraSelector(!showCameraSelector)}
                >
                  {showCameraSelector ? 'Hide' : 'Configure'} Sources
                </Button>
              </div>
              
              {showCameraSelector && (
                <CameraSourceSelector
                  onCameraChange={(deviceId, stream) => {
                    setSelectedCameraId(deviceId);
                    if (stream && videoRef.current) {
                      videoRef.current.srcObject = stream;
                      setState(prev => ({ ...prev, cameraEnabled: true }));
                    }
                  }}
                  onMicrophoneChange={(deviceId, stream) => {
                    setSelectedMicrophoneId(deviceId);
                    setState(prev => ({ ...prev, microphoneEnabled: !!stream }));
                  }}
                  onPermissionChange={(hasCamera, hasMicrophone) => {
                    setDeviceCapabilities(prev => ({
                      ...prev,
                      hasCamera,
                      hasMicrophone
                    }));
                  }}
                  defaultCameraId={selectedCameraId}
                  defaultMicrophoneId={selectedMicrophoneId}
                  showPreview={true}
                  autoStart={false}
                />
              )}
            </div>
          </>
        )}

        {/* Action Button */}
        <div className="flex gap-2">
          {!isInitialized ? (
            <Button onClick={initializeProctoring} className="flex-1">
              Initialize Proctoring
            </Button>
          ) : (
            <Button variant="outline" onClick={initializeProctoring} className="flex-1">
              Restart Proctoring
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};