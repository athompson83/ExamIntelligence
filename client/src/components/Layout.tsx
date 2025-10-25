import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Breadcrumbs from "./Breadcrumbs";
import { Link } from "wouter";
import { Shield, Scale, FileText, HelpCircle, Mail, Globe } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex bg-background transition-all duration-200">
      {/* Skip to content link for screen readers */}
      <a
        href="#main-content"
        className="skip-to-content"
        tabIndex={0}
        data-testid="skip-to-content"
      >
        Skip to main content
      </a>

      <Sidebar />

      <div className="flex-1 lg:ml-64 transition-all duration-200 w-full min-w-0 flex flex-col min-h-screen">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 lg:left-64 z-50">
          <TopBar />
          <Breadcrumbs />
        </div>

        {/* Main Content - offset by header height (h-16) + breadcrumb */}
        <main
          id="main-content"
          role="main"
          aria-label="Main content"
          className="flex-1 pt-28 lg:pt-32 p-4 lg:p-6 pb-32 lg:pb-6"
          tabIndex={-1}
        >
          {children}
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