import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, Scale, BookOpen, AlertTriangle, Shield, UserCheck, Ban, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function TermsOfService() {
  const [, navigate] = useLocation();
  const lastUpdated = "September 27, 2025";
  const effectiveDate = "October 1, 2025";

  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: FileText,
      content: `By accessing or using ProficiencyAI ("Platform", "Service", "we", "our", or "us"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you do not have permission to access the Service.

**Eligibility:**
• You must be at least 13 years old to use this Service
• Students under 18 require parental or school authorization
• You must be affiliated with an educational institution
• You must provide accurate registration information

**Account Types:**
• Individual Student Accounts (with institutional affiliation)
• Teacher/Instructor Accounts
• Institutional Administrator Accounts
• Super Administrator Accounts (enterprise only)`
    },
    {
      id: "educational-use",
      title: "Educational Use Policy",
      icon: BookOpen,
      content: `ProficiencyAI is designed exclusively for educational purposes:

**Acceptable Educational Use:**
• Creating and administering academic assessments
• Conducting formative and summative evaluations
• Tracking student learning progress
• Generating educational analytics and insights
• Supporting distance learning initiatives
• Professional development and training

**Required Educational Context:**
• All assessments must serve legitimate educational purposes
• Content must align with educational standards
• Users must respect academic calendars and schedules
• Grading must follow institutional policies

**Prohibited Non-Educational Use:**
• Commercial testing services without educational license
• Employment screening or hiring assessments
• Psychological or medical evaluations
• Entertainment quizzes or trivia
• Data mining for non-educational purposes`
    },
    {
      id: "academic-integrity",
      title: "Academic Integrity Guidelines",
      icon: Shield,
      content: `All users must uphold the highest standards of academic integrity:

**Student Responsibilities:**
• Complete all assessments independently unless specified
• Do not share login credentials or assessment content
• Do not use unauthorized aids or resources
• Report suspected violations to instructors
• Accept proctoring requirements when applicable

**Instructor Responsibilities:**
• Design assessments that promote learning
• Clearly communicate assessment rules and expectations
• Investigate potential violations fairly
• Maintain confidentiality of student data
• Use platform features ethically

**Violations and Consequences:**
• Cheating: Immediate assessment invalidation
• Impersonation: Account suspension
• Content theft: Legal action may be taken
• System manipulation: Permanent ban
• Multiple violations: Institutional notification

**Honor Code:**
By using this platform, you pledge to:
• Act with integrity in all assessments
• Respect intellectual property rights
• Support a fair learning environment
• Report violations when observed`
    },
    {
      id: "user-responsibilities",
      title: "User Responsibilities",
      icon: UserCheck,
      content: `**Account Security:**
• Maintain strong, unique passwords
• Enable two-factor authentication when available
• Immediately report unauthorized access
• Log out after each session on shared devices
• Keep login credentials confidential

**Content Standards:**
• No offensive, discriminatory, or harmful content
• No copyright-infringing materials
• No malicious code or harmful files
• Respect cultural and religious sensitivities
• Follow institutional content guidelines

**Technical Requirements:**
• Maintain compatible devices and browsers
• Ensure stable internet connection for assessments
• Keep software updated for security
• Allow necessary permissions for proctoring
• Back up important data locally

**Communication Guidelines:**
• Professional and respectful interactions
• No harassment or bullying
• Constructive feedback only
• Respect privacy of other users
• Follow institutional communication policies`
    },
    {
      id: "prohibited-activities",
      title: "Prohibited Activities",
      icon: Ban,
      content: `The following activities are strictly prohibited:

**System Abuse:**
• Attempting to hack or compromise the platform
• Creating multiple accounts without authorization
• Using automated tools or bots
• Overloading servers with excessive requests
• Circumventing security measures

**Content Violations:**
• Uploading malware or viruses
• Sharing inappropriate or illegal content
• Plagiarizing or stealing intellectual property
• Creating fake or misleading assessments
• Distributing answer keys or solutions

**Privacy Violations:**
• Accessing other users' accounts
• Sharing personal data without consent
• Recording proctored sessions illegally
• Data scraping or harvesting
• Violating FERPA or privacy laws

**Commercial Misuse:**
• Reselling access or content
• Using the platform for profit without license
• Advertising non-educational services
• Conducting market research
• Competing service promotion`
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property Rights",
      icon: Scale,
      content: `**Platform Ownership:**
• ProficiencyAI owns all platform technology and features
• Our trademarks and branding are protected
• Platform design and user interface are proprietary
• AI models and algorithms are confidential

**User Content:**
• You retain ownership of original content you create
• You grant us license to use content for service operation
• Content may be used for platform improvement (anonymized)
• You warrant that your content doesn't infringe rights

**Educational Materials:**
• Respect textbook and publisher copyrights
• Follow fair use guidelines for educational content
• Properly attribute all referenced materials
• Do not redistribute copyrighted test banks

**License Grant:**
By uploading content, you grant ProficiencyAI:
• Worldwide, non-exclusive license to use
• Right to store, display, and distribute within platform
• Permission to create derivatives for technical purposes
• Right to anonymize and aggregate for analytics`
    },
    {
      id: "payment-terms",
      title: "Payment and Billing",
      icon: Gavel,
      content: `**Subscription Plans:**
• Free Tier: Basic features with usage limits
• Professional: Monthly or annual billing
• Institutional: Custom enterprise agreements
• Add-ons: Proctoring, AI features, storage

**Billing Policies:**
• Payments processed securely via Stripe
• Automatic renewal unless cancelled
• Pro-rated refunds for annual plans
• No refunds for monthly subscriptions
• Institutional invoicing available

**Usage Limits:**
• Enforced based on subscription tier
• Overage charges may apply
• Fair use policy for unlimited plans
• API rate limiting in effect

**Cancellation:**
• Cancel anytime through account settings
• Access continues until period ends
• Data export available before cancellation
• No partial month refunds`
    },
    {
      id: "privacy-data",
      title: "Privacy and Data Protection",
      icon: Shield,
      content: `**Data Handling:**
• See our comprehensive Privacy Policy for details
• FERPA compliant for educational records
• GDPR compliant for EU users
• CCPA compliant for California residents

**Key Privacy Points:**
• Educational data never sold to third parties
• Proctoring recordings deleted after 90 days
• Right to data deletion (with legal exceptions)
• Encryption for data at rest and in transit
• Regular security audits conducted

**Consent and Control:**
• Explicit consent for data processing
• Granular privacy controls available
• Data portability supported
• Opt-out options for non-essential features`
    },
    {
      id: "disclaimers",
      title: "Disclaimers and Limitations",
      icon: AlertTriangle,
      content: `**Service Availability:**
• Provided "as is" and "as available"
• No guarantee of uninterrupted service
• Maintenance windows may occur
• Features subject to change
• Best effort support provided

**Educational Outcomes:**
• No guarantee of specific learning outcomes
• Assessment accuracy depends on proper use
• AI suggestions are not infallible
• Results should be professionally interpreted

**Limitation of Liability:**
• Not liable for indirect or consequential damages
• Maximum liability limited to fees paid
• Not responsible for user-generated content
• No warranty for third-party integrations

**Indemnification:**
You agree to indemnify ProficiencyAI against:
• Claims arising from your use
• Violations of these terms
• Infringement of third-party rights
• Unauthorized use of your account`
    },
    {
      id: "termination",
      title: "Termination",
      icon: Ban,
      content: `**Termination by User:**
• Cancel subscription anytime
• Request account deletion
• Export data before termination
• Obligations survive termination

**Termination by ProficiencyAI:**
We may terminate or suspend access for:
• Violation of these Terms
• Non-payment of fees
• Suspected fraudulent activity
• Legal or regulatory requirements
• Extended inactivity (2 years)

**Effects of Termination:**
• Immediate loss of platform access
• Data retained per legal requirements
• Refunds per refund policy
• Option to export data (30 days)

**Survival:**
The following sections survive termination:
• Intellectual Property Rights
• Limitation of Liability
• Indemnification
• Dispute Resolution`
    },
    {
      id: "governing-law",
      title: "Governing Law and Disputes",
      icon: Gavel,
      content: `**Applicable Law:**
• Governed by laws of [Jurisdiction]
• Without regard to conflict of law provisions
• Educational regulations supersede when applicable

**Dispute Resolution:**
• First attempt: Direct negotiation
• Second step: Mediation
• Final resort: Binding arbitration
• Class action waiver applies

**Exceptions:**
• Intellectual property disputes
• Injunctive relief claims
• Small claims court eligible

**Notice for Legal Process:**
Legal notices should be sent to:
ProficiencyAI Legal Department
[Address]
legal@proficiencyai.com`
    },
    {
      id: "changes",
      title: "Modifications to Terms",
      icon: FileText,
      content: `**Update Process:**
• We may modify these Terms periodically
• Material changes require 30-day notice
• Continued use constitutes acceptance
• Previous versions available upon request

**Notification Methods:**
• Email to registered address
• In-platform notifications
• Website announcement banner

**Right to Terminate:**
If you disagree with changes:
• Terminate account before effective date
• Export your data
• Receive pro-rated refund if applicable

**Version Information:**
• Current Version: 2.0
• Last Updated: ${lastUpdated}
• Effective Date: ${effectiveDate}
• Previous Version: Available on request`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scale className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-muted-foreground">
            Please read these terms carefully before using ProficiencyAI.
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
                  data-testid={`link-terms-${section.id}`}
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
                <p className="font-medium">Questions about our terms?</p>
                <p className="text-sm text-muted-foreground">
                  Contact our legal team for clarification.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/privacy-policy")}
                  data-testid="button-privacy-policy"
                >
                  Privacy Policy
                </Button>
                <Button 
                  onClick={() => navigate("/contact")}
                  data-testid="button-contact-legal"
                >
                  Contact Legal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}