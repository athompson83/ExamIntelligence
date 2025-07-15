import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Download, QrCode } from 'lucide-react';

export default function MobileApp() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">ProficiencyAI Mobile App</h1>
          <p className="text-gray-600">Download our mobile app for better exam experience</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="mr-2 h-5 w-5" />
                Mobile Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>✓ Take exams on mobile devices</li>
                <li>✓ Real-time proctoring support</li>
                <li>✓ Offline exam capability</li>
                <li>✓ Push notifications</li>
                <li>✓ Built-in calculator</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5" />
                Download App
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  iOS App (Coming Soon)
                </Button>
                <Button className="w-full" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Android App (Coming Soon)
                </Button>
                <Button className="w-full" variant="outline">
                  <QrCode className="mr-2 h-4 w-4" />
                  QR Code Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}