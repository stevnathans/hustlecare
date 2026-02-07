'use client';
import { Cookie, Lock, BarChart3, Settings, Globe, FileText, Mail, CheckCircle } from 'lucide-react';

export default function CookiePolicy() {
  const lastUpdated = "January 15, 2025";

  const cookieTypes = [
    {
      type: "Essential Cookies",
      description: "These cookies are necessary for the platform to function. Without them, core features such as account login and saved projects may not work.",
      examples: [
        "Authentication cookies",
        "Security cookies",
        "Session management cookies"
      ],
      color: "emerald"
    },
    {
      type: "Analytics Cookies",
      description: "We use analytics tools to understand how users interact with Hustlecare. This helps us improve usability and platform performance.",
      examples: [
        "Pages visited",
        "Time spent on pages",
        "Device and browser information",
        "Interaction patterns"
      ],
      color: "blue"
    },
    {
      type: "Functionality Cookies",
      description: "These cookies remember user preferences and settings to provide a smoother experience.",
      examples: [],
      color: "purple"
    }
  ];

  const sections = [
    {
      icon: Cookie,
      title: "1. What Are Cookies?",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            Cookies are small text files placed on your device when you visit a website. They help websites function properly, improve performance, remember user preferences, and provide analytics insights.
          </p>
          <p className="text-gray-600 mb-3">Cookies may be:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li><strong>Session cookies</strong> — deleted when you close your browser</li>
            <li><strong>Persistent cookies</strong> — remain on your device until they expire or are deleted</li>
          </ul>
        </>
      )
    },
    {
      icon: BarChart3,
      title: "2. How Hustlecare Uses Cookies",
      content: (
        <>
          <p className="text-gray-600 mb-3">We use cookies to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Keep you logged into your account</li>
            <li>Enable core platform functionality</li>
            <li>Save user preferences</li>
            <li>Understand how visitors use the platform</li>
            <li>Improve performance and user experience</li>
            <li>Monitor analytics and usage trends</li>
          </ul>
          <p className="text-gray-600">
            Cookies help ensure that key features such as account access, project saving, and PDF generation work correctly.
          </p>
        </>
      )
    },
    {
      icon: Settings,
      title: "4. Third-Party Cookies",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            We may use third-party analytics services that set their own cookies to analyze usage trends and improve the platform.
          </p>
          <p className="text-gray-600 mb-3 font-semibold">
            We do not sell personal data through cookies.
          </p>
          <p className="text-gray-600">
            If third-party payment tools or additional integrations are introduced in the future, their cookie usage will be updated in this policy.
          </p>
        </>
      )
    },
    {
      icon: Settings,
      title: "5. Managing Cookies",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            You can control or disable cookies through your browser settings.
          </p>
          <p className="text-gray-600 mb-3">Most browsers allow you to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>View stored cookies</li>
            <li>Delete cookies</li>
            <li>Block specific cookies</li>
            <li>Block all cookies</li>
          </ul>
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-amber-900 text-sm">
              <strong>Please note:</strong> Disabling essential cookies may affect the functionality of Hustlecare.
            </p>
          </div>
        </>
      )
    },
    {
      icon: Globe,
      title: "6. International Users",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            Hustlecare is based in the United States but may be used globally. Users from certain regions, including the European Union and United Kingdom, may have additional rights regarding cookie consent and data processing.
          </p>
          <p className="text-gray-600">
            We may implement cookie consent banners or additional controls as required by law.
          </p>
        </>
      )
    },
    {
      icon: FileText,
      title: "7. Updates to This Cookie Policy",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            We may update this Cookie Policy periodically to reflect changes in technology, legal requirements, or platform features.
          </p>
          <p className="text-gray-600">
            Changes will be posted on this page with a revised &quot;Last Updated&quot; date.
          </p>
        </>
      )
    },
    {
      icon: Mail,
      title: "8. Contact Us",
      content: (
        <>
          <p className="text-gray-600 mb-3">
            If you have questions about this Cookie Policy or our use of cookies, contact:
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
            <Cookie className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Cookie Policy
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Last Updated: {lastUpdated}
          </p>
          <p className="text-gray-600 max-w-3xl mx-auto">
            This Cookie Policy explains how Hustlecare (&quot;Hustlecare,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) uses cookies and similar tracking technologies when you visit or use our website and platform (&quot;Services&quot;).
          </p>
        </div>

        {/* Consent Notice */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Consent to Use Cookies</h3>
              <p className="text-gray-600">
                By continuing to use Hustlecare, you consent to the use of cookies as described in this policy, unless you disable them through your browser settings.
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

        {/* Cookie Types Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 transform hover:scale-[1.01] transition-transform duration-300">
          <div className="flex items-start gap-4 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 pt-2">
              3. Types of Cookies We Use
            </h2>
          </div>

          <div className="space-y-6">
            {cookieTypes.map((cookie, index) => (
              <div 
                key={index}
                className="border-l-4 border-emerald-500 bg-gray-50 rounded-lg p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {String.fromCharCode(97 + index)}) {cookie.type}
                </h3>
                <p className="text-gray-600 mb-4">{cookie.description}</p>
                
                {cookie.examples.length > 0 && (
                  <>
                    <p className="text-gray-600 font-semibold mb-2">
                      {cookie.type === "Analytics Cookies" ? "Analytics cookies may collect:" : "Examples:"}
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {cookie.examples.map((example, idx) => (
                        <li key={idx}>{example}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Remaining Sections */}
        <div className="space-y-8">
          {sections.slice(2).map((section, index) => {
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
          <h3 className="text-2xl font-bold mb-4">Questions About Cookies?</h3>
          <p className="text-emerald-50 mb-6 max-w-2xl mx-auto">
            If you have any questions about our use of cookies or how to manage them, we&apos;re here to help.
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