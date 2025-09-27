import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, Database, Users, Globe, Calendar, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();
  const lastUpdated = "September 27, 2025";
  const effectiveDate = "October 1, 2025";

  const sections = [
    {
      id: "introduction",
      title: "Introduction",
      icon: Shield,
      content: `ProficiencyAI ("we", "our", or "us") is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our educational assessment platform.

As an educational technology provider, we comply with the Family Educational Rights and Privacy Act (FERPA), the Children's Online Privacy Protection Act (COPPA) where applicable, and international data protection regulations including the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA).`
    },
    {
      id: "data-collection",
      title: "Information We Collect",
      icon: Database,
      content: `We collect the following categories of information:

**Personal Information:**
• Name, email address, and contact details
• Educational institution and role (student, teacher, administrator)
• Account credentials and authentication data
• Profile information and preferences

**Educational Data:**
• Quiz and exam responses
• Assessment scores and performance metrics
• Learning progress and achievement data
• Time spent on assessments
• Question interaction patterns

**Proctoring Data (when enabled):**
• Camera recordings during proctored exams
• Screen activity monitoring
• Browser activity and tab switching events
• Keyboard and mouse activity patterns
• System information for security verification

**Technical Information:**
• IP address and device identifiers
• Browser type and version
• Operating system information
• Session data and cookies
• Usage logs and analytics data`
    },
    {
      id: "data-use",
      title: "How We Use Your Information",
      icon: Eye,
      content: `We use collected information for the following purposes:

**Educational Services:**
• Providing assessment and testing services
• Grading and evaluation of academic performance
• Generating performance analytics and insights
• Creating personalized learning recommendations
• Supporting adaptive testing algorithms

**Platform Operations:**
• Account creation and authentication
• Platform security and fraud prevention
• Technical support and customer service
• System maintenance and improvements
• Bug tracking and error resolution

**Communication:**
• Sending assessment notifications
• Providing progress updates to authorized parties
• System announcements and updates
• Educational content recommendations

**Legal Compliance:**
• Meeting educational regulatory requirements
• Responding to legal requests
• Protecting rights and safety
• Academic integrity enforcement`
    },
    {
      id: "data-sharing",
      title: "Information Sharing and Disclosure",
      icon: Users,
      content: `We share information only in the following circumstances:

**Educational Institutions:**
• With your school, college, or educational organization as authorized
• Grade and performance data with authorized instructors
• Attendance and participation records as required

**Service Providers:**
• Cloud hosting providers (data encrypted)
• Analytics services (anonymized data only)
• Email communication providers
• Payment processors (for institutional accounts)

**Legal Requirements:**
• When required by law or legal process
• To protect rights, property, or safety
• To investigate academic integrity violations
• To comply with educational regulations

**With Consent:**
• When you explicitly authorize sharing
• For research purposes (anonymized)
• To third-party integrations you enable

We NEVER sell your personal information or educational data to third parties for marketing purposes.`
    },
    {
      id: "data-retention",
      title: "Data Retention and Deletion",
      icon: Calendar,
      content: `**Retention Periods:**
• Active account data: Retained while account is active
• Educational records: 7 years per educational standards
• Proctoring recordings: 90 days unless flagged
• Technical logs: 1 year for security purposes
• Deleted account data: Anonymized after 30 days

**Deletion Rights:**
• You can request account deletion at any time
• Educational records may be retained as required by law
• Anonymized data may be retained for analytics
• Deletion requests processed within 30 days

**Data Archival:**
• Inactive accounts archived after 2 years
• Archived data can be reactivated upon request
• Academic records preserved per institutional policies`
    },
    {
      id: "user-rights",
      title: "Your Rights and Choices",
      icon: Lock,
      content: `You have the following rights regarding your data:

**Access and Portability:**
• Request a copy of your personal data
• Export your educational records
• Access proctoring recordings of yourself
• Download assessment history

**Correction and Updates:**
• Update your profile information
• Correct inaccurate data
• Manage communication preferences
• Update consent choices

**Deletion and Restriction:**
• Request account deletion
• Restrict processing of your data
• Object to certain data uses
• Withdraw consent where applicable

**GDPR Rights (EU Residents):**
• Right to be forgotten
• Right to data portability
• Right to restrict processing
• Right to object to processing

**CCPA Rights (California Residents):**
• Right to know what data is collected
• Right to delete personal information
• Right to opt-out of data sales (we don't sell data)
• Right to non-discrimination`
    },
    {
      id: "security",
      title: "Data Security",
      icon: Lock,
      content: `We implement industry-standard security measures:

**Technical Safeguards:**
• End-to-end encryption for sensitive data
• TLS/SSL encryption for data in transit
• AES-256 encryption for data at rest
• Regular security audits and penetration testing
• Multi-factor authentication options

**Organizational Measures:**
• Limited access to personal data
• Employee training and confidentiality agreements
• Vendor security assessments
• Incident response procedures
• Regular security updates and patches

**Compliance Certifications:**
• FERPA compliance for educational data
• GDPR compliance for EU data
• SOC 2 Type II certification (in progress)
• ISO 27001 standards alignment`
    },
    {
      id: "cookies",
      title: "Cookies and Tracking",
      icon: Globe,
      content: `**Essential Cookies:**
• Session management and authentication
• Security tokens and CSRF protection
• User preferences and settings
• Load balancing and performance

**Analytics Cookies (with consent):**
• Usage patterns and feature adoption
• Performance monitoring
• Error tracking and debugging
• Anonymous usage statistics

**Third-party Cookies:**
• LMS integration tokens
• Payment processing (institutional accounts)
• Support chat widgets (if enabled)

You can manage cookie preferences through your browser settings or our consent manager.`
    },
    {
      id: "children",
      title: "Children's Privacy",
      icon: Users,
      content: `**Under 13 (COPPA Compliance):**
• Parental or school consent required
• Limited data collection
• No behavioral advertising
• Enhanced privacy protections

**13-18 Year Olds:**
• School or parental authorization required
• Age-appropriate privacy controls
• Limited sharing capabilities
• Educational use only

We do not knowingly collect data from children under 13 without proper consent.`
    },
    {
      id: "international",
      title: "International Data Transfers",
      icon: Globe,
      content: `**Data Location:**
• Primary servers in the United States
• CDN endpoints globally for performance
• Backup facilities in multiple regions

**Transfer Safeguards:**
• EU-US Data Privacy Framework participation
• Standard Contractual Clauses for EU data
• Adequacy decisions where applicable
• Privacy Shield principles adherence`
    },
    {
      id: "contact",
      title: "Contact Information",
      icon: Mail,
      content: `For privacy-related questions or requests:

**Data Protection Officer:**
Email: privacy@proficiencyai.com
Phone: 1-800-XXX-XXXX

**Mailing Address:**
ProficiencyAI Privacy Team
[Address]
[City, State ZIP]

**Response Time:**
• General inquiries: 5 business days
• Data requests: 30 days
• Urgent security issues: 24 hours

You may also contact us through the in-app support system.`
    },
    {
      id: "changes",
      title: "Changes to This Policy",
      icon: AlertCircle,
      content: `We may update this Privacy Policy periodically to reflect:
• Changes in our practices
• New legal requirements
• Feature additions or modifications
• User feedback and suggestions

**Notification of Changes:**
• Email notification for material changes
• In-app notifications
• 30-day notice before significant changes take effect

**Version History:**
• Current Version: 2.0
• Last Updated: ${lastUpdated}
• Effective Date: ${effectiveDate}`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground">
            Your privacy is important to us. This policy explains how we handle your data.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="secondary">Last Updated: {lastUpdated}</Badge>
            <Badge variant="outline">Effective: {effectiveDate}</Badge>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  data-testid={`link-privacy-${section.id}`}
                >
                  <section.icon className="h-4 w-4 mr-2" />
                  {section.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {sections.map((section) => (
              <Card key={section.id} id={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <section.icon className="h-5 w-5 text-primary" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
                    {section.content}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <Card className="mt-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="font-medium">Have questions about our privacy practices?</p>
                <p className="text-sm text-muted-foreground">
                  Contact our Data Protection Officer for assistance.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/admin/account-settings")}
                  data-testid="button-manage-privacy"
                >
                  Manage Privacy Settings
                </Button>
                <Button 
                  onClick={() => navigate("/contact")}
                  data-testid="button-contact-dpo"
                >
                  Contact DPO
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}