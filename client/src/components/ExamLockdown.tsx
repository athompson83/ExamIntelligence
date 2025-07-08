import React, { useEffect, useState, useCallback } from 'react';
import { Shield, Camera, Mic, AlertTriangle, Monitor, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ExamLockdownProps {
  isProctored: boolean;
  onLockdownReady: (ready: boolean) => void;
  onViolation: (violation: string) => void;
  examTitle: string;
}

interface LockdownState {
  fullscreen: boolean;
  cameraPermission: boolean;
  micPermission: boolean;
  screenShare: boolean;
  tabSwitches: number;
  violations: string[];
}

export const ExamLockdown: React.FC<ExamLockdownProps> = ({
  isProctored,
  onLockdownReady,
  onViolation,
  examTitle
}) => {
  const [lockdownState, setLockdownState] = useState<LockdownState>({
    fullscreen: false,
    cameraPermission: false,
    micPermission: false,
    screenShare: false,
    tabSwitches: 0,
    violations: []
  });

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Request camera and microphone permissions
  const requestMediaPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setMediaStream(stream);
      setLockdownState(prev => ({
        ...prev,
        cameraPermission: true,
        micPermission: true
      }));
    } catch (error) {
      console.error('Media permissions denied:', error);
      onViolation('Camera or microphone access denied');
    }
  }, [onViolation]);

  // Request screen sharing permission
  const requestScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      setScreenStream(stream);
      setLockdownState(prev => ({
        ...prev,
        screenShare: true
      }));
    } catch (error) {
      console.error('Screen sharing denied:', error);
      onViolation('Screen sharing access denied');
    }
  }, [onViolation]);

  // Enter fullscreen mode
  const enterFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setLockdownState(prev => ({
          ...prev,
          fullscreen: true
        }));
      }
    } catch (error) {
      console.error('Fullscreen denied:', error);
      onViolation('Fullscreen mode denied');
    }
  }, [onViolation]);

  // Setup browser lockdown
  useEffect(() => {
    if (!isProctored) return;

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onViolation('Right-click context menu attempted');
    };

    // Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 or Ctrl+Shift+I or Ctrl+Shift+J or Ctrl+U
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
          (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        onViolation('Developer tools access attempted');
      }
      
      // Alt+Tab (partial prevention)
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        onViolation('Alt+Tab attempted');
      }
    };

    // Detect tab/window focus changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setLockdownState(prev => {
          const newTabSwitches = prev.tabSwitches + 1;
          onViolation(`Tab/window switched (${newTabSwitches} times)`);
          return { ...prev, tabSwitches: newTabSwitches };
        });
      }
    };

    // Detect fullscreen exit
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      setLockdownState(prev => ({
        ...prev,
        fullscreen: isFullscreen
      }));
      
      if (!isFullscreen) {
        onViolation('Fullscreen mode exited');
      }
    };

    // Prevent copy/paste
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      onViolation('Copy attempted');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      onViolation('Paste attempted');
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [isProctored, onViolation]);

  // Check if lockdown is ready
  useEffect(() => {
    if (!isProctored) {
      onLockdownReady(true);
      return;
    }

    const ready = lockdownState.fullscreen && 
                  lockdownState.cameraPermission && 
                  lockdownState.micPermission && 
                  lockdownState.screenShare;
    
    onLockdownReady(ready);
  }, [isProctored, lockdownState, onLockdownReady]);

  // Cleanup media streams on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream, screenStream]);

  if (!isProctored) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Standard Exam Mode
          </span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          This exam does not require proctoring. You may begin when ready.
        </p>
      </div>
    );
  }

  const allPermissionsGranted = lockdownState.fullscreen && 
                               lockdownState.cameraPermission && 
                               lockdownState.micPermission && 
                               lockdownState.screenShare;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="h-6 w-6 text-red-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          Proctored Exam Setup
        </h2>
      </div>

      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This exam requires proctoring. Please complete all setup steps below before starting.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {/* Fullscreen Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Monitor className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium">Fullscreen Mode</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={lockdownState.fullscreen ? 'default' : 'secondary'}>
              {lockdownState.fullscreen ? 'Active' : 'Required'}
            </Badge>
            {!lockdownState.fullscreen && (
              <Button size="sm" onClick={enterFullscreen}>
                Enable
              </Button>
            )}
          </div>
        </div>

        {/* Camera Permission */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Camera className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium">Camera Access</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={lockdownState.cameraPermission ? 'default' : 'secondary'}>
              {lockdownState.cameraPermission ? 'Granted' : 'Required'}
            </Badge>
            {!lockdownState.cameraPermission && (
              <Button size="sm" onClick={requestMediaPermissions}>
                Grant Access
              </Button>
            )}
          </div>
        </div>

        {/* Microphone Permission */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Mic className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium">Microphone Access</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={lockdownState.micPermission ? 'default' : 'secondary'}>
              {lockdownState.micPermission ? 'Granted' : 'Required'}
            </Badge>
          </div>
        </div>

        {/* Screen Share */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Monitor className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium">Screen Sharing</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={lockdownState.screenShare ? 'default' : 'secondary'}>
              {lockdownState.screenShare ? 'Active' : 'Required'}
            </Badge>
            {!lockdownState.screenShare && (
              <Button size="sm" onClick={requestScreenShare}>
                Start Sharing
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Violations Counter */}
      {lockdownState.tabSwitches > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              Security Violations: {lockdownState.tabSwitches}
            </span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            Your exam activity is being monitored. Multiple violations may result in exam termination.
          </p>
        </div>
      )}

      {/* Ready Status */}
      {allPermissionsGranted && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Exam Environment Secured
            </span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            All proctoring requirements have been met. You may now begin the exam.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExamLockdown;