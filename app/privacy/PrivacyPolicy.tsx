// app/privacy/PrivacyPolicy.tsx
'use client';
import { Shield, Lock, Eye, Mail, FileText, Globe, Clock, UserCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  const lastUpdated = "January 15, 2025";

  const sections = [
    {
      icon: FileText,
      title: "1. Information We Collect",
      content: (
        <>
          <h4 className="font-semibold text-gray-900 mb-2">a) Information You Provide</h4>
          <p className="text-gray-600 mb-3">When you create an account or use our services, we may collect:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Full name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Business requirements and selections you enter into the platform</li>
            <li>Startup cost data generated from your selections</li>
          </ul>
          <p className="text-gray-600 mb-4">This information is saved to your account so you can access your projects and download PDF reports.</p>
          <h4 className="font-semibold text-gray-900 mb-2">b) Automatically Collected Information</h4>
          <p className="text-gray-600 mb-3">We may automatically collect certain technical and usage information, including:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Device information</li><li>Browser type</li><li>IP address</li>
            <li>Pages visited and time spent on the platform</li>
            <li>Usage behavior and interactions</li>
          </ul>
          <p className="text-gray-600 mb-4">We collect this information using analytics tools and cookies to improve the service.</p>
          <h4 className="font-semibold text-gray-900 mb-2">c) Cookies and Tracking Technologies</h4>
          <p className="text-gray-600 mb-3">Hustlecare uses cookies and similar technologies to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-3">
            <li>Improve website functionality</li><li>Analyze user behavior</li><li>Enhance user experience</li>
          </ul>
          <p className="text-gray-600">You can control cookies through your browser settings, though disabling cookies may affect certain features.</p>
        </>
      )
    },
    { icon: Eye, title: "2. How We Use Your Information", content: (<><p className="text-gray-600 mb-3">We use your information to:</p><ul className="list-disc list-inside text-gray-600 space-y-1"><li>Provide and maintain the Hustlecare platform</li><li>Calculate startup requirements and generate downloadable PDF reports</li><li>Store and manage your saved projects</li><li>Improve product features and user experience</li><li>Send important service notifications</li><li>Send newsletters, updates, and marketing communications</li><li>Monitor platform performance and analytics</li></ul></>) },
    { icon: UserCheck, title: "3. Account Requirement", content: (<><p className="text-gray-600 mb-3">Users must create an account to:</p><ul className="list-disc list-inside text-gray-600 space-y-1"><li>Access saved business requirements</li><li>Generate and download PDF reports</li><li>Use core Hustlecare features</li></ul></>) },
    { icon: Lock, title: "4. Data Storage and Security", content: (<><p className="text-gray-600 mb-3">Hustlecare is hosted on infrastructure provided by Vercel.</p><p className="text-gray-600 mb-3">We implement reasonable technical and organizational measures to protect your data from unauthorized access, misuse, or disclosure.</p><p className="text-gray-600">However, no online system is completely secure, and we cannot guarantee absolute security.</p></>) },
    { icon: Shield, title: "5. Data Sharing and Third Parties", content: (<><p className="text-gray-600 mb-3 font-semibold">Currently:</p><ul className="list-disc list-inside text-gray-600 space-y-1 mb-4"><li>We do not sell your personal information</li><li>We do not share personal data with third parties for commercial purposes</li><li>We may use third-party analytics providers to help us understand platform usage</li></ul><p className="text-gray-600 mb-3">In the future, we may integrate third-party payment processors. If we do, payment data will be handled according to those providers&apos; privacy policies.</p><p className="text-gray-600">We may also disclose information if required by law or to protect legal rights and platform security.</p></>) },
    { icon: Mail, title: "6. Marketing Communications", content: (<><p className="text-gray-600 mb-3">We may send:</p><ul className="list-disc list-inside text-gray-600 space-y-1 mb-3"><li>Product updates</li><li>Newsletters</li><li>Educational content</li><li>Promotional messages</li></ul><p className="text-gray-600">You may unsubscribe from marketing emails at any time using the unsubscribe link included in our communications.</p></>) },
    { icon: Clock, title: "7. Data Retention", content: (<><p className="text-gray-600 mb-3">We retain your data as long as:</p><ul className="list-disc list-inside text-gray-600 space-y-1"><li>Your account remains active</li><li>It is necessary to provide services</li><li>Required for legal or operational purposes</li></ul></>) },
    { icon: FileText, title: "8. Your Rights and Choices", content: (<><p className="text-gray-600 mb-3">You may:</p><ul className="list-disc list-inside text-gray-600 space-y-1 mb-4"><li>Access your account information</li><li>Update or correct your data</li><li>Delete your account and stored information</li></ul><p className="text-gray-600 mb-2">To request account deletion or data removal, contact:</p><a href="mailto:info@hustlecare.net" className="text-emerald-600 hover:text-emerald-700 font-semibold">info@hustlecare.net</a></>) },
    { icon: UserCheck, title: "9. Children's Privacy", content: (<><p className="text-gray-600 mb-2">Hustlecare is intended for users aged 18 and older.</p><p className="text-gray-600">We do not knowingly collect information from minors.</p></>) },
    { icon: Globe, title: "10. International Users", content: (<><p className="text-gray-600 mb-3">Hustlecare is registered in the United States but may be used internationally.</p><p className="text-gray-600">By using the platform, you consent to the transfer and processing of your information in the United States and other countries where our services operate.</p></>) },
    { icon: FileText, title: "11. Changes to This Privacy Policy", content: (<><p className="text-gray-600 mb-3">We may update this Privacy Policy from time to time.</p><p className="text-gray-600">Updates will be posted on this page with a revised &quot;Last Updated&quot; date. Continued use of the platform after changes indicates acceptance of the revised policy.</p></>) },
    { icon: Mail, title: "12. Contact Information", content: (<><p className="text-gray-600 mb-3">If you have questions about this Privacy Policy or your personal data, contact:</p><div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200"><p className="text-gray-900 font-semibold mb-2">Hustlecare</p><p className="text-gray-700">Email: <a href="mailto:info@hustlecare.net" className="text-emerald-600 hover:text-emerald-700 font-semibold">info@hustlecare.net</a></p><p className="text-gray-700">United States</p></div></>) },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-emerald-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600 mb-2">Last Updated: {lastUpdated}</p>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Hustlecare (&quot;Hustlecare,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our website, platform, and services.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Agreement to Terms</h3>
              <p className="text-gray-600">By using Hustlecare, you agree to the practices described in this Privacy Policy.</p>
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
          <h3 className="text-2xl font-bold mb-4">Have Questions?</h3>
          <p className="text-emerald-50 mb-6 max-w-2xl mx-auto">If you have any questions or concerns about our Privacy Policy, we&apos;re here to help.</p>
          <a href="mailto:info@hustlecare.net" className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors duration-200">
            <Mail className="w-5 h-5" /> Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}