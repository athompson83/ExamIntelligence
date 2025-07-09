import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OfflineSyncManager from '@/components/OfflineSyncManager';
import { Smartphone, Wifi, Database, Users, AlertTriangle, CheckCircle } from 'lucide-react';

export default function OfflineSyncPage() {
  const deviceId = `device-${Date.now()}`;
  const userId = "test-user";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Offline Sync Management</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive offline synchronization capabilities for mobile exam taking
              </p>
            </div>
            <Badge variant="outline" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Sync Engine Active</span>
            </Badge>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <Smartphone className="h-4 w-4 mr-2 text-blue-500" />
                Mobile Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Full offline exam taking capabilities with automatic sync when connection is restored
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <Wifi className="h-4 w-4 mr-2 text-green-500" />
                Connection Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Real-time connection quality monitoring with intelligent retry mechanisms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2 text-purple-500" />
                Teacher Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Automatic notifications when students disconnect during exams
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                Data Integrity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Guaranteed data synchronization with conflict resolution and error handling
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Benefits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Key Benefits</CardTitle>
            <CardDescription>
              Advanced offline synchronization features designed for educational environments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Uninterrupted Exam Taking</h4>
                    <p className="text-sm text-gray-600">
                      Students can continue taking exams even when internet connection is lost
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Automatic Sync</h4>
                    <p className="text-sm text-gray-600">
                      All offline actions are automatically synchronized when connection is restored
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Priority Queue System</h4>
                    <p className="text-sm text-gray-600">
                      Critical actions like exam submissions are prioritized during sync
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Teacher Visibility</h4>
                    <p className="text-sm text-gray-600">
                      Teachers receive real-time notifications when students disconnect
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Connection Logs</h4>
                    <p className="text-sm text-gray-600">
                      Detailed logs of connection events for auditing and troubleshooting
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Data Recovery</h4>
                    <p className="text-sm text-gray-600">
                      Built-in error handling and retry mechanisms ensure no data is lost
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Implementation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
            <CardDescription>
              Comprehensive offline sync architecture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Database Tables</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• offline_sync_queue</li>
                  <li>• connection_logs</li>
                  <li>• teacher_notifications</li>
                  <li>• device_sync_status</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">API Endpoints</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• POST /api/offline-sync/queue</li>
                  <li>• GET /api/offline-sync/pending</li>
                  <li>• POST /api/offline-sync/process</li>
                  <li>• POST /api/offline-sync/connection-log</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Sync Actions</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• quiz_response</li>
                  <li>• progress_update</li>
                  <li>• proctoring_event</li>
                  <li>• quiz_completion</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offline Sync Manager Component */}
        <OfflineSyncManager 
          deviceId={deviceId}
          userId={userId}
          isTeacher={true}
        />
      </div>
    </div>
  );
}