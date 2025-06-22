// components/Dashboard/HelpTab.tsx
"use client";

import { useState } from "react";
import { 
  HelpCircle, 
  MessageSquare, 
  FileText, 
  Mail, 
  Phone, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Search
} from "lucide-react";

export default function HelpTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const faqs = [
    {
      id: "1",
      question: "How do I add items to my business lists?",
      answer: "To add items to your business lists, navigate to a business page and click on the items you want to save. You can also use the search function to find specific businesses and items."
    },
    {
      id: "2",
      question: "Can I edit or remove saved items?",
      answer: "Yes, you can edit or remove saved items by going to your 'My Lists' section, selecting the business, and then managing individual items. You can update quantities, prices, or remove items entirely."
    },
    {
      id: "3",
      question: "How do I share my lists with others?",
      answer: "Currently, lists are private to your account. We're working on sharing features that will be available in future updates."
    },
    {
      id: "4",
      question: "Is my data secure and private?",
      answer: "Yes, we take data security seriously. All your information is encrypted and stored securely. We never share your personal data with third parties without your consent."
    },
    {
      id: "5",
      question: "How do I delete my account?",
      answer: "You can delete your account by going to Settings > Advanced > Delete Account. Please note that this action is irreversible and will permanently delete all your data."
    },
    {
      id: "6",
      question: "Can I export my data?",
      answer: "Yes, you can export your data from the Settings > Advanced section. This will provide you with a complete copy of your saved businesses and items."
    }
  ];

  const supportOptions = [
    {
      title: "Email Support",
      description: "Get help via email within 24 hours",
      icon: Mail,
      action: "Send Email",
      contact: "support@example.com"
    },
    {
      title: "Live Chat",
      description: "Chat with our support team instantly",
      icon: MessageSquare,
      action: "Start Chat",
      contact: "Available 9 AM - 6 PM EST"
    },
    {
      title: "Phone Support",
      description: "Speak directly with our support team",
      icon: Phone,
      action: "Call Now",
      contact: "+1 (555) 123-4567"
    }
  ];

  const resources = [
    {
      title: "User Guide",
      description: "Complete guide to using all features",
      icon: FileText,
      link: "/docs/user-guide"
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video walkthroughs",
      icon: ExternalLink,
      link: "/docs/tutorials"
    },
    {
      title: "API Documentation",
      description: "For developers and integrations",
      icon: FileText,
      link: "/docs/api"
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Find answers to common questions or get in touch with our support team
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {supportOptions.map((option) => {
          const Icon = option.icon;
          return (
            <div key={option.title} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full mr-4">
                  <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{option.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{option.contact}</p>
              <button className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors">
                {option.action}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <HelpCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <div key={faq.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                {expandedFaq === faq.id ? (
                  <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
              {expandedFaq === faq.id && (
                <div className="px-4 pb-4">
                  <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-8">
            <HelpCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No FAQs found matching your search</p>
          </div>
        )}
      </div>

      {/* Resources */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Additional Resources
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <a
                key={resource.title}
                href={resource.link}
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{resource.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{resource.description}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}