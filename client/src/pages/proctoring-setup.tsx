import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import CameraSourceSelector from '@/components/CameraSourceSelector';
import { CrossPlatformProctoring } from '@/components/CrossPlatformProctoring';
import { 
  Camera, 
  Mic, 
  Shield, 
  Monitor, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Play,
  RefreshCw
} from 'lucide-react';

interface ProctoringSettings {
  requireCamera: boolean;
  requireMicrophone: boolean;
  requireFullscreen: boolean;
  preventTabSwitching: boolean;
  lockOrientation: boolean;
  allowScreenShare: boolean;
}

export default function ProctoringSetup() {
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string>('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);
  const [hasPermissions, setHasPermissions] = useState({ camera: false, microphone: false });
  const [proctoringStatus, setProctoringStatus] = useState<any>(null);
  const [violations, setViolations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('setup');

  const proctoringSettings: ProctoringSettings = {
    requireCamera: true,
    requireMicrophone: true,
    requireFullscreen: true,
    preventTabSwitching: true,
    lockOrientation: true,
    allowScreenShare: false
  };

  const handleCameraChange = (deviceId: string, stream: MediaStream | null) => {
    setSelectedCameraId(deviceId);
    setCameraStream(stream);
  };

  const handleMicrophoneChange = (deviceId: string, stream: MediaStream | null) => {
    setSelectedMicrophoneId(deviceId);
    setMicrophoneStream(stream);
  };

  const handlePermissionChange = (hasCamera: boolean, hasMicrophone: boolean) => {
    setHasPermissions({ camera: hasCamera, microphone: hasMicrophone });
  };

  const handleViolation = (violation: any) => {
    setViolations(prev => [...prev, violation]);
  };

  const handleStatusChange = (status: any) => {
    setProctoringStatus(status);
  };

  const startExam = () => {
    if (!hasPermissions.camera || !hasPermissions.microphone) {
      alert('Please ensure camera and microphone permissions are granted before starting the exam.');
      return;
    }
    
    if (!selectedCameraId || !selectedMicrophoneId) {
      alert('Please select camera and microphone sources before starting the exam.');
      return;
    }

    // Navigate to exam interface
    window.location.href = '/cat-exam-test';
  };

  const getPermissionStatus = () => {
    if (hasPermissions.camera && hasPermissions.microphone) {
      return { status: 'success', message: 'All permissions granted' };
    } else if (hasPermissions.camera || hasPermissions.microphone) {
      return { status: 'warning', message: 'Partial permissions granted' };
    } else {
      return { status: 'error', message: 'Permissions required' };
    }
  };

  const permissionStatus = getPermissionStatus();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Exam Proctoring Setup
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Configure camera and microphone sources for secure exam monitoring
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={permissionStatus.status === 'success' ? 'default' : 
                      permissionStatus.status === 'warning' ? 'secondary' : 'destructive'}
              className="flex items-center gap-1"
            >
              {permissionStatus.status === 'success' ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {permissionStatus.message}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Device Setup</TabsTrigger>
            <TabsTrigger value="proctoring">Proctoring Test</TabsTrigger>
            <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
          </TabsList>

          {/* Device Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Camera & Microphone Selector */}
              <div className="lg:col-span-2">
                <CameraSourceSelector
                  onCameraChange={handleCameraChange}
                  onMicrophoneChange={handleMicrophoneChange}
                  onPermissionChange={handlePermissionChange}
                  defaultCameraId={selectedCameraId}
                  defaultMicrophoneId={selectedMicrophoneId}
                  showPreview={true}
                  autoStart={true}
                />
              </div>

              {/* Device Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Selected Devices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        <span className="text-sm">Camera Source</span>
                      </div>
                      <Badge variant={selectedCameraId ? 'default' : 'secondary'}>
                        {selectedCameraId ? 'Selected' : 'None'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        <span className="text-sm">Microphone Source</span>
                      </div>
                      <Badge variant={selectedMicrophoneId ? 'default' : 'secondary'}>
                        {selectedMicrophoneId ? 'Selected' : 'None'}
                      </Badge>
                    </div>
                  </div>

                  {(selectedCameraId || selectedMicrophoneId) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Stream Status</h4>
                        {cameraStream && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Camera stream active
                          </div>
                        )}
                        {microphoneStream && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Microphone stream active
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Proctoring Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Proctoring Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(proctoringSettings).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <Badge variant={enabled ? 'default' : 'secondary'}>
                        {enabled ? 'Required' : 'Optional'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Start Exam Button */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium">Ready to Start Exam?</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Ensure all devices are configured and permissions are granted
                    </p>
                  </div>
                  <Button 
                    onClick={startExam}
                    disabled={!hasPermissions.camera || !hasPermissions.microphone || !selectedCameraId || !selectedMicrophoneId}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start Proctored Exam
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Proctoring Test Tab */}
          <TabsContent value="proctoring" className="space-y-6">
            <CrossPlatformProctoring
              examId="test-exam"
              onViolation={handleViolation}
              onStatusChange={handleStatusChange}
              settings={proctoringSettings}
            />
          </TabsContent>

          {/* Live Monitor Tab */}
          <TabsContent value="monitor" className="space-y-6">
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Camera</p>
                      <p className="font-medium">
                        {proctoringStatus?.cameraEnabled ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Microphone</p>
                      <p className="font-medium">
                        {proctoringStatus?.microphoneEnabled ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Screen Share</p>
                      <p className="font-medium">
                        {proctoringStatus?.screenShareEnabled ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">Violations</p>
                      <p className="font-medium">{violations.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Violations */}
            {violations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Recent Violations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {violations.slice(-5).map((violation, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{violation.type}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{violation.description}</p>
                        </div>
                        <Badge variant="destructive">{violation.severity}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}