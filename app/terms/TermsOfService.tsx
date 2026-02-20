// app/terms/TermsOfService.tsx
'use client';
import { FileText, Shield, User, Database, AlertTriangle, Code, DollarSign, XCircle, Scale, Mail, Check } from 'lucide-react';

export default function TermsOfService() {
  const lastUpdated = "January 15, 2025";

  const sections = [
    { icon: User, title: "1. Eligibility", content: (<><p className="text-gray-600 mb-3">You must be at least 18 years old to use Hustlecare.</p><p className="text-gray-600 mb-3">By using the Services, you represent that:</p><ul className="list-disc list-inside text-gray-600 space-y-1"><li>You are at least 18 years old</li><li>You have the legal capacity to enter into these Terms</li><li>You will use the platform in compliance with applicable laws</li></ul></>) },
    { icon: FileText, title: "2. Description of Services", content: (<><p className="text-gray-600 mb-3">Hustlecare provides tools that help users:</p><ul className="list-disc list-inside text-gray-600 space-y-1 mb-3"><li>Identify business startup requirements</li><li>Estimate startup costs based on selected requirements</li><li>Save project data within user profiles</li><li>Generate downloadable PDF reports</li></ul><p className="text-gray-600">The platform is intended for informational and planning purposes only.</p></>) },
    { icon: Shield, title: "3. Accounts and User Responsibilities", content: (<><p className="text-gray-600 mb-3">To use core features, you must create an account.</p><p className="text-gray-600 mb-3">You agree to:</p><ul className="list-disc list-inside text-gray-600 space-y-1 mb-3"><li>Provide accurate and current information</li><li>Keep your login credentials secure</li><li>Be responsible for all activity under your account</li><li>Notify us immediately of unauthorized access</li></ul><p className="text-gray-600">We reserve the right to suspend or terminate accounts that violate these Terms.</p></>) },
    { icon: Database, title: "4. User Content and Data", content: (<><p className="text-gray-600 mb-3">You retain ownership of the information you submit, including:</p><ul className="list-disc list-inside text-gray-600 space-y-1 mb-4"><li>Business ideas</li><li>Requirements selections</li><li>Project data</li></ul><p className="text-gray-600 mb-3">By using Hustlecare, you grant us a limited license to:</p><ul className="list-disc list-inside text-gray-600 space-y-1 mb-4"><li>Store and process your data</li><li>Provide platform functionality</li><li>Improve and maintain the service</li></ul><p className="text-gray-600 mb-3">You agree not to upload:</p><ul className="list-disc list-inside text-gray-600 space-y-1"><li>Illegal content</li><li>Harmful or malicious material</li><li>Content that infringes on intellectual property rights</li></ul></>) },
    { icon: AlertTriangle, title: "5. Informational Use Only — No Professional Advice", content: (<><p className="text-gray-600 mb-3 font-semibold">Hustlecare provides general informational tools only.</p><p className="text-gray-600 mb-3">We do not provide:</p><ul className="list-disc list-inside text-gray-600 space-y-1 mb-4"><li>Financial advice</li><li>Legal advice</li><li>Accounting advice</li><li>Investment advice</li><li>Business certification or licensing guarantees</li></ul><div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mb-4"><p className="text-amber-900 text-sm"><strong>Important:</strong> Startup cost estimates are generated automatically and may not reflect real-world pricing or regulatory requirements.</p></div><p className="text-gray-600 font-semibold">You are solely responsible for verifying all business decisions with qualified professionals.</p></>) },
    { icon: Code, title: "6. Intellectual Property", content: (<><p className="text-gray-600 mb-3">All Hustlecare content, including software, design, branding, logos, text and graphics are owned by Hustlecare or its licensors and protected by intellectual property laws.</p><p className="text-gray-600 mb-3">You may not:</p><ul className="list-disc list-inside text-gray-600 space-y-1"><li>Copy or redistribute platform content</li><li>Reverse engineer or attempt to access source code</li><li>Use Hustlecare branding without permission</li></ul></>) },
    { icon: XCircle, title: "7. Prohibited Uses", content: (<><p className="text-gray-600 mb-3">You agree not to:</p><ul className="list-disc list-inside text-gray-600 space-y-1"><li>Use the platform for unlawful activities</li><li>Attempt to hack, disrupt, or interfere with the service</li><li>Scrape or extract data without permission</li><li>Upload malware or harmful code</li><li>Misrepresent your identity</li></ul></>) },
    { icon: FileText, title: "8. Analytics and Communications", content: (<><p className="text-gray-600 mb-3">By using Hustlecare, you agree that:</p><ul className="list-disc list-inside text-gray-600 space-y-1 mb-3"><li>We may collect analytics data to improve the platform</li><li>We may send service-related communications</li><li>We may send newsletters and marketing messages</li></ul><p className="text-gray-600">You may unsubscribe from marketing emails at any time.</p></>) },
    { icon: DollarSign, title: "9. Future Payments and Third-Party Services", content: (<><p className="text-gray-600 mb-3">Hustlecare may introduce paid features in the future.</p><p className="text-gray-600 mb-3">If payment processing is added:</p><ul className="list-disc list-inside text-gray-600 space-y-1 mb-3"><li>Payments will be handled by third-party processors</li><li>Additional terms may apply</li></ul><p className="text-gray-600">We are not responsible for third-party service failures.</p></>) },
    { icon: XCircle, title: "10. Termination", content: (<><p className="text-gray-600 mb-4">You may delete your account at any time.</p><p className="text-gray-600 mb-3">We may suspend or terminate accounts if users:</p><ul className="list-disc list-inside text-gray-600 space-y-1"><li>Violate these Terms</li><li>Engage in harmful or illegal conduct</li><li>Abuse the platform</li></ul></>) },
    { icon: AlertTriangle, title: "11. Disclaimer of Warranties", content: (<><p className="text-gray-600 mb-3 font-semibold">Hustlecare is provided &quot;as is&quot; and &quot;as available.&quot;</p><p className="text-gray-600 mb-3">We make no guarantees regarding:</p><ul className="list-disc list-inside text-gray-600 space-y-1"><li>Accuracy of cost estimates</li><li>Completeness of business requirements</li><li>Platform uptime or error-free performance</li><li>Suitability for any specific business purpose</li></ul></>) },
    { icon: Shield, title: "12. Limitation of Liability", content: (<><p className="text-gray-600 mb-3">To the maximum extent permitted by law, Hustlecare shall not be liable for:</p><ul className="list-disc list-inside text-gray-600 space-y-1 mb-4"><li>Business losses</li><li>Financial losses</li><li>Missed opportunities</li><li>Data loss</li><li>Indirect or consequential damages</li></ul><p className="text-gray-600 font-semibold">Your use of the platform is at your own risk.</p></>) },
    { icon: Shield, title: "13. Indemnification", content: (<><p className="text-gray-600 mb-3">You agree to defend and hold harmless Hustlecare from claims arising from:</p><ul className="list-disc list-inside text-gray-600 space-y-1"><li>Your misuse of the platform</li><li>Violation of these Terms</li><li>Content you submit</li></ul></>) },
    { icon: Scale, title: "14. Governing Law", content: (<p className="text-gray-600">These Terms are governed by the laws of the United States.</p>) },
    { icon: FileText, title: "15. Changes to Terms", content: (<><p className="text-gray-600 mb-3">We may update these Terms periodically.</p><p className="text-gray-600">Updated Terms will be posted with a revised &quot;Last Updated&quot; date. Continued use of Hustlecare constitutes acceptance of changes.</p></>) },
    { icon: Mail, title: "16. Contact Information", content: (<div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200"><p className="text-gray-900 font-semibold mb-2">Hustlecare</p><p className="text-gray-700">Email: <a href="mailto:info@hustlecare.net" className="text-emerald-600 hover:text-emerald-700 font-semibold">info@hustlecare.net</a></p><p className="text-gray-700">United States</p></div>) },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-emerald-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mb-6">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600 mb-6">Last Updated: {lastUpdated}</p>
          <p className="text-gray-600 max-w-3xl mx-auto mb-4">
            Welcome to Hustlecare. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Hustlecare website, platform, and services (&quot;Services&quot;) operated by Hustlecare (&quot;Hustlecare,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Agreement to Terms</h3>
              <p className="text-gray-600">By accessing or using Hustlecare, you agree to these Terms. If you do not agree, you must not use the Services.</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <div key={index} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 transform hover:scale-[1.01] transition-transform duration-300">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 pt-2">{section.title}</h2>
                </div>
                <div className="pl-16">{section.content}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl shadow-xl p-8 md:p-10 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Questions About Our Terms?</h3>
          <p className="text-emerald-50 mb-6 max-w-2xl mx-auto">If you have any questions or concerns about our Terms of Service, please don&apos;t hesitate to reach out.</p>
          <a href="mailto:info@hustlecare.net" className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors duration-200">
            <Mail className="w-5 h-5" /> Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}