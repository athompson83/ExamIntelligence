import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Breadcrumbs from "./Breadcrumbs";
import { BottomTabNav } from "./BottomTabNav";
import { Link } from "wouter";
import { Shield, Scale, FileText, HelpCircle, Mail, Globe } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 transition-all duration-200">
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
      <BottomTabNav />

      <div className="flex-1 lg:ml-72 transition-all duration-200 w-full min-w-0 flex flex-col min-h-screen">
        {/* Fixed Header */}
        <TopBar />

        {/* Fixed Breadcrumbs */}
        <Breadcrumbs />

        {/* Main Content - with padding to offset fixed header and breadcrumbs, plus bottom nav on mobile */}
        <main
          id="main-content"
          role="main"
          aria-label="Main content"
          className="flex-1 max-w-7xl mx-auto w-full lg:px-8 lg:pt-6 lg:pb-8"
          tabIndex={-1}
        >
          {children}
        </main>

        {/* Footer with legal and compliance links */}
        <footer className="bg-white dark:bg-gray-900 border-t mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link href="/privacy-policy" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" data-testid="link-footer-privacy">
                <Shield className="h-4 w-4" />
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" data-testid="link-footer-terms">
                <Scale className="h-4 w-4" />
                Terms of Service
              </Link>
              <Link href="/help" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" data-testid="link-footer-help">
                <HelpCircle className="h-4 w-4" />
                Help Center
              </Link>
              <Link href="/contact" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" data-testid="link-footer-contact">
                <Mail className="h-4 w-4" />
                Contact Us
              </Link>
              <Link href="/accessibility-settings" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" data-testid="link-footer-accessibility">
                <Globe className="h-4 w-4" />
                Accessibility
              </Link>
              <Link href="/admin/account-settings" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" data-testid="link-footer-account">
                <FileText className="h-4 w-4" />
                Account Settings
              </Link>
            </div>
            <div className="mt-4 pt-4 border-t text-center text-xs text-gray-500 dark:text-gray-400">
              <p>© {new Date().getFullYear()} ProficiencyAI. All rights reserved. Educational use only.</p>
              <p className="mt-1">FERPA, GDPR, and CCPA compliant</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}