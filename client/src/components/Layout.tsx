import { ReactNode, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { Link } from "wouter";
import { Shield, Scale, FileText, HelpCircle, Mail, Globe } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Enhanced loading animation with preload optimization
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    // Preload critical resources
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--page-loaded', '1');
    });

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-background/95 transition-all duration-500 safe-area-inset">
      {/* Skip to content link for screen readers */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[10003] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        tabIndex={0}
      >
        Skip to main content
      </a>
      
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 transition-all duration-300 ease-out w-full min-w-0 flex flex-col min-h-screen">
        {/* Fixed/Sticky header container */}
        <div className="sticky top-0 z-[100] bg-background">
          <TopBar />
        </div>
        
        <main 
          id="main-content"
          role="main"
          aria-label="Main content"
          className={`flex-1 p-4 lg:p-6 pb-32 lg:pb-6 overflow-auto ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          tabIndex={-1}
        >
          <div className="animate-in fade-in-0 duration-700">
            {children}
          </div>
        </main>

        {/* Footer with legal and compliance links */}
        <footer className="bg-background/95 border-t mt-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Link href="/privacy-policy" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-privacy">
                <Shield className="h-4 w-4" />
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-terms">
                <Scale className="h-4 w-4" />
                Terms of Service
              </Link>
              <Link href="/help" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-help">
                <HelpCircle className="h-4 w-4" />
                Help Center
              </Link>
              <Link href="/contact" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-contact">
                <Mail className="h-4 w-4" />
                Contact Us
              </Link>
              <Link href="/accessibility-settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-accessibility">
                <Globe className="h-4 w-4" />
                Accessibility
              </Link>
              <Link href="/admin/account-settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-account">
                <FileText className="h-4 w-4" />
                Account Settings
              </Link>
            </div>
            <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} ProficiencyAI. All rights reserved. Educational use only.</p>
              <p className="mt-1">FERPA, GDPR, and CCPA compliant</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
