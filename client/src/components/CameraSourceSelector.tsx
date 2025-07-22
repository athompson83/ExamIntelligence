import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Camera, 
  Video, 
  VideoOff, 
  Settings, 
  RefreshCw, 
  Monitor, 
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface MediaDeviceInfo {
  deviceId: string;
  kind: MediaDeviceKind;
  label: string;
  groupId: string;
}

interface CameraCapabilities {
  resolution: { width: number; height: number }[];
  frameRate: { min: number; max: number };
  facingMode?: string[];
}

interface CameraSourceSelectorProps {
  onCameraChange?: (deviceId: string, stream: MediaStream | null) => void;
  onMicrophoneChange?: (deviceId: string, stream: MediaStream | null) => void;
  onPermissionChange?: (hasCamera: boolean, hasMicrophone: boolean) => void;
  defaultCameraId?: string;
  defaultMicrophoneId?: string;
  showPreview?: boolean;
  autoStart?: boolean;
  className?: string;
}

export default function CameraSourceSelector({
  onCameraChange,
  onMicrophoneChange,
  onPermissionChange,
  defaultCameraId,
  defaultMicrophoneId,
  showPreview = true,
  autoStart = false,
  className = ''
}: CameraSourceSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>(defaultCameraId || '');
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string>(defaultMicrophoneId || '');
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermissions, setHasPermissions] = useState({ camera: false, microphone: false });
  const [capabilities, setCapabilities] = useState<CameraCapabilities | null>(null);
  const [isPreviewEnabled, setIsPreviewEnabled] = useState(showPreview);
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high'>('medium');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoConstraints = {
    low: { width: 320, height: 240, frameRate: 15 },
    medium: { width: 640, height: 480, frameRate: 30 },
    high: { width: 1280, height: 720, frameRate: 30 }
  };

  useEffect(() => {
    if (autoStart) {
      initializeDevices();
    }
  }, [autoStart]);

  useEffect(() => {
    if (selectedCameraId && isPreviewEnabled) {
      startCamera();
    }
  }, [selectedCameraId, isPreviewEnabled, videoQuality]);

  const initializeDevices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Request permissions first
      const permissions = await requestPermissions();
      setHasPermissions(permissions);
      onPermissionChange?.(permissions.camera, permissions.microphone);

      if (permissions.camera || permissions.microphone) {
        // Get available devices
        const deviceList = await enumerateDevices();
        setDevices(deviceList);

        // Auto-select default devices
        if (!selectedCameraId && deviceList.length > 0) {
          const defaultCamera = findDefaultCamera(deviceList);
          if (defaultCamera) {
            setSelectedCameraId(defaultCamera.deviceId);
          }
        }

        if (!selectedMicrophoneId && deviceList.length > 0) {
          const defaultMicrophone = findDefaultMicrophone(deviceList);
          if (defaultMicrophone) {
            setSelectedMicrophoneId(defaultMicrophone.deviceId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to initialize devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to access camera/microphone');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async (): Promise<{ camera: boolean; microphone: boolean }> => {
    const permissions = { camera: false, microphone: false };

    try {
      // Request camera permission
      const cameraStream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      permissions.camera = true;
      cameraStream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.warn('Camera permission denied:', err);
    }

    try {
      // Request microphone permission
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        video: false,
        audio: true 
      });
      permissions.microphone = true;
      audioStream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.warn('Microphone permission denied:', err);
    }

    return permissions;
  };

  const enumerateDevices = async (): Promise<MediaDeviceInfo[]> => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => 
      device.kind === 'videoinput' || device.kind === 'audioinput'
    ) as MediaDeviceInfo[];
  };

  const findDefaultCamera = (deviceList: MediaDeviceInfo[]): MediaDeviceInfo | null => {
    const cameras = deviceList.filter(d => d.kind === 'videoinput');
    
    // Prefer front camera for exams
    const frontCamera = cameras.find(cam => 
      cam.label.toLowerCase().includes('front') || 
      cam.label.toLowerCase().includes('user')
    );
    if (frontCamera) return frontCamera;

    // Fall back to first available camera
    return cameras[0] || null;
  };

  const findDefaultMicrophone = (deviceList: MediaDeviceInfo[]): MediaDeviceInfo | null => {
    const microphones = deviceList.filter(d => d.kind === 'audioinput');
    
    // Prefer built-in microphone
    const builtIn = microphones.find(mic => 
      mic.label.toLowerCase().includes('built') || 
      mic.label.toLowerCase().includes('internal')
    );
    if (builtIn) return builtIn;

    return microphones[0] || null;
  };

  const startCamera = async () => {
    if (!selectedCameraId) return;

    try {
      // Stop existing stream
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          deviceId: { exact: selectedCameraId },
          ...videoConstraints[videoQuality]
        },
        audio: selectedMicrophoneId ? {
          deviceId: { exact: selectedMicrophoneId }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCurrentStream(stream);
      
      // Get camera capabilities
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        const trackCapabilities = videoTrack.getCapabilities?.();
        
        if (trackCapabilities) {
          setCapabilities({
            resolution: [
              { width: settings.width || 640, height: settings.height || 480 }
            ],
            frameRate: {
              min: trackCapabilities.frameRate?.min || 15,
              max: trackCapabilities.frameRate?.max || 30
            },
            facingMode: trackCapabilities.facingMode || []
          });
        }
      }

      // Set video preview
      if (videoRef.current && isPreviewEnabled) {
        videoRef.current.srcObject = stream;
      }

      // Notify parent component
      onCameraChange?.(selectedCameraId, stream);
      if (selectedMicrophoneId) {
        onMicrophoneChange?.(selectedMicrophoneId, stream);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to start camera:', err);
      setError(`Failed to start camera: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const stopCamera = () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
      onCameraChange?.(selectedCameraId, null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const refreshDevices = () => {
    initializeDevices();
  };

  const togglePreview = () => {
    setIsPreviewEnabled(!isPreviewEnabled);
    if (!isPreviewEnabled && selectedCameraId) {
      startCamera();
    } else if (isPreviewEnabled) {
      stopCamera();
    }
  };

  const getCameraIcon = (label: string) => {
    if (label.toLowerCase().includes('front') || label.toLowerCase().includes('user')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (label.toLowerCase().includes('back') || label.toLowerCase().includes('environment')) {
      return <Camera className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const cameras = devices.filter(d => d.kind === 'videoinput');
  const microphones = devices.filter(d => d.kind === 'audioinput');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Camera & Microphone Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permissions Status */}
        <div className="flex items-center gap-4">
          <Badge variant={hasPermissions.camera ? "default" : "destructive"} className="flex items-center gap-1">
            {hasPermissions.camera ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            Camera {hasPermissions.camera ? 'Allowed' : 'Denied'}
          </Badge>
          <Badge variant={hasPermissions.microphone ? "default" : "destructive"} className="flex items-center gap-1">
            {hasPermissions.microphone ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            Microphone {hasPermissions.microphone ? 'Allowed' : 'Denied'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDevices}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Device Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Camera Selection */}
          <div className="space-y-3">
            <Label>Camera Source</Label>
            <Select
              value={selectedCameraId}
              onValueChange={setSelectedCameraId}
              disabled={!hasPermissions.camera || cameras.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select camera..." />
              </SelectTrigger>
              <SelectContent>
                {cameras.map((camera) => (
                  <SelectItem key={camera.deviceId} value={camera.deviceId}>
                    <div className="flex items-center gap-2">
                      {getCameraIcon(camera.label)}
                      <span className="truncate">
                        {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                {cameras.length === 0 && (
                  <SelectItem value="none" disabled>
                    No cameras available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Microphone Selection */}
          <div className="space-y-3">
            <Label>Microphone Source</Label>
            <Select
              value={selectedMicrophoneId}
              onValueChange={setSelectedMicrophoneId}
              disabled={!hasPermissions.microphone || microphones.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select microphone..." />
              </SelectTrigger>
              <SelectContent>
                {microphones.map((mic) => (
                  <SelectItem key={mic.deviceId} value={mic.deviceId}>
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <span className="truncate">
                        {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                {microphones.length === 0 && (
                  <SelectItem value="none" disabled>
                    No microphones available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Video Quality Settings */}
        <div className="space-y-3">
          <Label>Video Quality</Label>
          <Select value={videoQuality} onValueChange={(value: 'low' | 'medium' | 'high') => setVideoQuality(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low (320x240, 15fps)</SelectItem>
              <SelectItem value="medium">Medium (640x480, 30fps)</SelectItem>
              <SelectItem value="high">High (1280x720, 30fps)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Preview Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Camera Preview</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={isPreviewEnabled}
                onCheckedChange={togglePreview}
                disabled={!selectedCameraId || !hasPermissions.camera}
              />
              {isPreviewEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </div>
          </div>

          {/* Video Preview */}
          {isPreviewEnabled && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-w-md h-auto bg-black rounded-lg border"
                style={{ maxHeight: '240px' }}
              />
              {currentStream && (
                <Badge 
                  variant="default" 
                  className="absolute top-2 right-2 bg-red-500 animate-pulse"
                >
                  <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
                  LIVE
                </Badge>
              )}
              {!currentStream && isPreviewEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <VideoOff className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Camera Capabilities */}
        {capabilities && (
          <div className="space-y-2">
            <Label>Camera Capabilities</Label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Resolution: {capabilities.resolution[0]?.width}x{capabilities.resolution[0]?.height}</div>
              <div>Frame Rate: {capabilities.frameRate.min}-{capabilities.frameRate.max}fps</div>
              {capabilities.facingMode && capabilities.facingMode.length > 0 && (
                <div className="col-span-2">
                  Facing: {capabilities.facingMode.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!hasPermissions.camera && !hasPermissions.microphone && (
            <Button onClick={initializeDevices} disabled={isLoading}>
              <Settings className="h-4 w-4 mr-2" />
              Request Permissions
            </Button>
          )}
          
          {selectedCameraId && !currentStream && (
            <Button onClick={startCamera} disabled={isLoading}>
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          )}
          
          {currentStream && (
            <Button onClick={stopCamera} variant="outline">
              <VideoOff className="h-4 w-4 mr-2" />
              Stop Camera
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}