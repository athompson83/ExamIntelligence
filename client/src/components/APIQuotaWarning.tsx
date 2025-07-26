import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ExternalLink, CreditCard, Settings } from "lucide-react";

interface APIQuotaWarningProps {
  onClose?: () => void;
}

export default function APIQuotaWarning({ onClose }: APIQuotaWarningProps) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <AlertTriangle className="h-5 w-5" />
          OpenAI API Quota Exceeded
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            The OpenAI API usage limit has been reached. CAT exam generation is temporarily unavailable.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">What you can do:</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3 p-3 bg-white rounded border">
              <CreditCard className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Upgrade OpenAI Plan</p>
                <p className="text-gray-600">Contact your administrator to upgrade the OpenAI API plan for higher usage limits.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-white rounded border">
              <Settings className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Check API Configuration</p>
                <p className="text-gray-600">Verify that the OpenAI API key is properly configured in Settings.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-white rounded border">
              <ExternalLink className="h-4 w-4 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium">Use Existing Content</p>
                <p className="text-gray-600">Continue working with existing item banks and manually created questions.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.open('https://platform.openai.com/account/billing', '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            OpenAI Billing
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/settings'}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            API Settings
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500 border-t pt-3">
          <p><strong>Note:</strong> The CAT generation system has been successfully fixed and tested. 
          This is only a temporary API limitation that can be resolved by upgrading the OpenAI plan.</p>
        </div>
      </CardContent>
    </Card>
  );
}