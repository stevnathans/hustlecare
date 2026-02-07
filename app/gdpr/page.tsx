'use client';
import { Shield, Database, Scale, Globe, Lock, Users, FileText, Mail, AlertCircle, UserCheck } from 'lucide-react';

export default function GDPRNotice() {
  const lastUpdated = "January 15, 2025";

  const legalBases = [
    {
      title: "a) Contractual Necessity",
      description: "To provide core platform features including:",
      items: [
        "Account creation",
        "Saving projects",
        "Generating PDF reports",
        "Delivering platform functionality"
      ]
    },
    {
      title: "b) Legitimate Interests",
      description: "To:",
      items: [
        "Improve platform performance",
        "Analyze usage patterns",
        "Maintain system security",
        "Prevent fraud and abuse"
      ]
    },
    {
      title: "c) Consent",
      description: "For:",
      items: [
        "Marketing emails and newsletters",
        "Non-essential cookies (where required)"
      ],
      note: "Users may withdraw consent at any time."
    },
    {
      title: "d) Legal Obligations",
      description: "To comply with applicable laws and legal requirements.",
      items: []
    }
  ];

  const gdprRights = [
    "Access your personal data",
    "Correct inaccurate information",
    "Request deletion of your data",
    "Restrict processing",
    "Object to processing based on legitimate interests",
    "Request data portability",
    "Withdraw consent at any time",
    "Lodge a complaint with a supervisory authority"
  ];

  const sections = [
    {
      icon: Database,
      title: "1. Data Controller",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            The data controller responsible for your personal data is:
          </p>
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <p className="text-gray-900 font-semibold mb-2">Hustlecare</p>
            <p className="text-gray-700">United States</p>
            <p className="text-gray-700">
              Email: <a href="mailto:info@hustlecare.net" className="text-emerald-600 hover:text-emerald-700 font-semibold">info@hustlecare.net</a>
            </p>
          </div>
        </>
      )
    },
    {
      icon: FileText,
      title: "2. Personal Data We Collect",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            We may collect and process the following personal data:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Account login information</li>
            <li>Business requirements and selections saved in your profile</li>
            <li>Startup cost estimates generated through the platform</li>
            <li>Technical and analytics data (IP address, browser, device, usage behavior)</li>
            <li>Cookie and tracking information</li>
          </ul>
        </>
      )
    },
    {
      icon: FileText,
      title: "4. How We Use Personal Data",
      content: (
        <>
          <p className="text-gray-600 mb-3">We use personal data to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Operate and maintain the Hustlecare platform</li>
            <li>Provide startup planning tools and cost calculations</li>
            <li>Store and manage user projects</li>
            <li>Improve services and user experience</li>
            <li>Send service communications and updates</li>
            <li>Send marketing emails (with consent)</li>
            <li>Monitor analytics and performance</li>
          </ul>
        </>
      )
    },
    {
      icon: Globe,
      title: "5. International Data Transfers",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            Hustlecare is based in the United States. Your data may be transferred to and processed in the United States or other countries where our service providers operate.
          </p>
          <p className="text-gray-600">
            We take reasonable measures to ensure that appropriate safeguards are in place to protect personal data during international transfers.
          </p>
        </>
      )
    },
    {
      icon: Lock,
      title: "6. Data Retention",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            We retain personal data only as long as necessary to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-3">
            <li>Maintain active accounts</li>
            <li>Provide services</li>
            <li>Meet legal obligations</li>
            <li>Resolve disputes and enforce agreements</li>
          </ul>
          <p className="text-gray-600 font-semibold">
            Users may request deletion of their data at any time.
          </p>
        </>
      )
    },
    {
      icon: AlertCircle,
      title: "8. Automated Processing",
      content: (
        <>
          <p className="text-gray-600">
            Hustlecare generates startup cost estimates automatically based on user-selected requirements. These estimates are informational tools and do not constitute professional advice or legally binding decisions.
          </p>
        </>
      )
    },
    {
      icon: Shield,
      title: "9. Data Security",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            We implement reasonable technical and organizational measures to protect personal data from unauthorized access, loss, or misuse.
          </p>
          <p className="text-gray-600">
            Our platform is hosted on infrastructure provided by Vercel.
          </p>
        </>
      )
    },
    {
      icon: UserCheck,
      title: "10. Children's Data",
      content: (
        <>
          <p className="text-gray-600 mb-2">
            Hustlecare is intended for individuals aged 18 and older.
          </p>
          <p className="text-gray-600">
            We do not knowingly collect personal data from minors.
          </p>
        </>
      )
    },
    {
      icon: FileText,
      title: "11. Updates to This Notice",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            We may update this GDPR Notice periodically to reflect changes in legal requirements or platform features.
          </p>
          <p className="text-gray-600">
            Updates will be posted on this page with a revised &quot;Last Updated&quot; date.
          </p>
        </>
      )
    },
    {
      icon: Mail,
      title: "12. Contact",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            For any GDPR or data protection inquiries:
          </p>
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <p className="text-gray-900 font-semibold mb-2">Hustlecare</p>
            <p className="text-gray-700">
              Email: <a href="mailto:info@hustlecare.net" className="text-emerald-600 hover:text-emerald-700 font-semibold">info@hustlecare.net</a>
            </p>
            <p className="text-gray-700">United States</p>
          </div>
        </>
      )
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-emerald-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            GDPR & Data Protection Notice
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Last Updated: {lastUpdated}
          </p>
          <p className="text-gray-600 max-w-3xl mx-auto mb-4">
            This GDPR & Data Protection Notice explains how Hustlecare (&quot;Hustlecare,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, processes, and protects personal data in accordance with the General Data Protection Regulation (GDPR) and similar international data protection laws.
          </p>
        </div>

        {/* Applicability Notice */}
        <div className="bg-blue-50 rounded-2xl shadow-xl p-6 md:p-8 mb-12 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Applicability</h3>
              <p className="text-gray-600">
                This notice applies to users located in the European Economic Area (EEA), United Kingdom (UK), and other jurisdictions with similar data protection rights.
              </p>
            </div>
          </div>
        </div>

        {/* First Two Sections */}
        <div className="space-y-8 mb-12">
          {sections.slice(0, 2).map((section, index) => {
            const IconComponent = section.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-2xl shadow-xl p-6 md:p-8 transform hover:scale-[1.01] transition-transform duration-300"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 pt-2">
                    {section.title}
                  </h2>
                </div>
                <div className="pl-16">
                  {section.content}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legal Bases Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 transform hover:scale-[1.01] transition-transform duration-300">
          <div className="flex items-start gap-4 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 pt-2">
              3. Legal Bases for Processing (GDPR Article 6)
            </h2>
          </div>

          <div className="pl-16">
            <p className="text-gray-600 mb-6">
              We process personal data under the following lawful bases:
            </p>
            
            <div className="space-y-6">
              {legalBases.map((basis, index) => (
                <div 
                  key={index}
                  className="border-l-4 border-emerald-500 bg-gray-50 rounded-lg p-6"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {basis.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{basis.description}</p>
                  
                  {basis.items.length > 0 && (
                    <ul className="list-disc list-inside text-gray-600 space-y-1 mb-3">
                      {basis.items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                  
                  {basis.note && (
                    <p className="text-gray-600 font-semibold italic">{basis.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sections 4-6, 8-11 */}
        <div className="space-y-8 mb-8">
          {sections.slice(2, 5).map((section, index) => {
            const IconComponent = section.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-2xl shadow-xl p-6 md:p-8 transform hover:scale-[1.01] transition-transform duration-300"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 pt-2">
                    {section.title}
                  </h2>
                </div>
                <div className="pl-16">
                  {section.content}
                </div>
              </div>
            );
          })}
        </div>

        {/* GDPR Rights Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 transform hover:scale-[1.01] transition-transform duration-300">
          <div className="flex items-start gap-4 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 pt-2">
              7. Your GDPR Rights
            </h2>
          </div>

          <div className="pl-16">
            <p className="text-gray-600 mb-4">
              If you are located in the EEA or UK, you have the right to:
            </p>
            
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {gdprRights.map((right, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 bg-emerald-50 rounded-lg p-3 border border-emerald-200"
                >
                  <div className="flex-shrink-0 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700 text-sm">{right}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-blue-900 text-sm">
                <strong>To exercise any of these rights, contact:</strong>{' '}
                <a href="mailto:info@hustlecare.net" className="text-blue-600 hover:text-blue-700 font-semibold">
                  info@hustlecare.net
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Remaining Sections */}
        <div className="space-y-8">
          {sections.slice(5).map((section, index) => {
            const IconComponent = section.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-2xl shadow-xl p-6 md:p-8 transform hover:scale-[1.01] transition-transform duration-300"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 pt-2">
                    {section.title}
                  </h2>
                </div>
                <div className="pl-16">
                  {section.content}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl shadow-xl p-8 md:p-10 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">GDPR Questions?</h3>
          <p className="text-emerald-50 mb-6 max-w-2xl mx-auto">
            If you have questions about your data protection rights or how we handle your personal data, please contact us.
          </p>
          <a
            href="mailto:info@hustlecare.net"
            className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors duration-200"
          >
            <Mail className="w-5 h-5" />
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}