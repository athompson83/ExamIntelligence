import { useEffect, useState } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Home, ChevronRight, Shield, CheckCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscribeFormProps {
  clientSecret: string;
  planName: string;
}

const SubscribeForm = ({ clientSecret, planName }: SubscribeFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentStatus('processing');

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/billing?success=true`,
      },
    });

    if (error) {
      setPaymentStatus('error');
      toast({
        title: "Payment Failed",
        description: error.message || "Your payment could not be processed. Please try again.",
        variant: "destructive",
      });
    } else {
      setPaymentStatus('success');
      toast({
        title: "Subscription Successful!",
        description: `Welcome to ${planName}! Your subscription is now active.`,
      });
      setTimeout(() => navigate('/billing'), 2000);
    }
    
    setIsProcessing(false);
  };

  if (paymentStatus === 'success') {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold">Subscription Successful!</h2>
        <p className="text-muted-foreground">
          Welcome to {planName}! Your subscription is now active.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to your billing dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Payment Details</h3>
        <div className="p-4 border rounded-lg">
          <PaymentElement />
        </div>
      </div>

      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing...' : `Subscribe to ${planName}`}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <p>By subscribing, you agree to our Terms of Service and Privacy Policy.</p>
        <p>You can cancel your subscription at any time.</p>
      </div>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [planName, setPlanName] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const secret = urlParams.get('client_secret');
    const plan = urlParams.get('plan');
    
    if (!secret) {
      navigate('/pricing');
      return;
    }
    
    setClientSecret(secret);
    setPlanName(plan || 'Premium');
  }, [navigate]);

  if (!clientSecret) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/pricing" className="hover:text-foreground">
          Pricing
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Subscribe</span>
      </nav>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Complete Your Subscription</CardTitle>
            <p className="text-muted-foreground">
              Subscribe to {planName} and unlock all features
            </p>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm clientSecret={clientSecret} planName={planName} />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}