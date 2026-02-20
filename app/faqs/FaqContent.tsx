// app/faq/FaqContent.tsx
"use client";

import { useState, useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Mail, Search } from "lucide-react";

const faqCategories = [
  {
    id: "general",
    name: "General Questions",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    items: [
      { id: "what-is-hustlecare", question: "What is Hustlecare?", answer: "Hustlecare is a platform that helps aspiring business owners figure out everything they need to start a business—requirements, estimated costs, and where to get what they need." },
      { id: "how-to-use", question: "How do I use Hustlecare?", answer: "Just search for a business idea. Hustlecare will show you a list of startup requirements, estimated costs, and related products you can buy." },
      { id: "need-account", question: "Do I need an account to use Hustlecare?", answer: "No. You can search, browse, and even estimate costs without signing up. However, you'll need an account to save your progress, download lists, or use the marketplace fully." },
      { id: "is-it-free", question: "Is it free to use?", answer: "Yes, Hustlecare is free to use for planning and research. Some future features may require a subscription, but the core tools are free." },
      { id: "not-ready-yet", question: "Can I use it even if I'm not ready to start my business yet?", answer: "Yes. Many users use Hustlecare to plan and prepare in advance. It's also a great tool for comparing different business ideas." }
    ]
  },
  {
    id: "requirements",
    name: "Business Requirements",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    items: [
      { id: "requirements-source", question: "Where do these business requirements come from?", answer: "Our team researches and compiles requirement lists based on industry standards and common startup needs." },
      { id: "suggest-changes", question: "Can I suggest changes to a requirement list?", answer: "Yes! If something seems missing or inaccurate, you can suggest an edit. We review every suggestion before making updates." },
      { id: "fewer-requirements", question: "Why do some businesses have fewer requirements than others?", answer: "Each business is unique. Some require only basic tools or licenses, while others need more detailed setups." },
      { id: "download-requirements", question: "Can I download the requirement list?", answer: "Yes. After selecting a business, you can export the requirement list along with estimated costs as a PDF or spreadsheet." },
      { id: "save-lists", question: "Can I save my list for later?", answer: "Yes, if you're logged in, you can save multiple lists and access them anytime." }
    ]
  },
  {
    id: "calculator",
    name: "Cost Calculator",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    items: [
      { id: "what-is-calculator", question: "What is the cost calculator?", answer: "It's a tool that lets you estimate how much it will cost to start a business based on selected products and services." },
      { id: "adjust-calculator", question: "Can I change the quantities or prices in the calculator?", answer: "Yes, you can adjust item quantities and even enter custom prices if needed." },
      { id: "taxes-included", question: "Does the total include taxes and delivery?", answer: "Not yet. The calculator shows estimated product costs. You may need to factor in taxes, delivery, or service fees manually." },
      { id: "download-estimate", question: "Can I download my cost estimate?", answer: "Yes. You can download your entire list and cost estimate as a PDF or spreadsheet for sharing or offline use." }
    ]
  },
  {
    id: "marketplace",
    name: "Marketplace & Products",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    items: [
      { id: "product-sources", question: "Where do the products come from?", answer: "We partner with sellers and suppliers who provide tools, equipment, and services that match the business requirements." },
      { id: "buy-directly", question: "Can I buy products directly from Hustlecare?", answer: "Yes. You can add products to your cart and purchase them directly through the platform." },
      { id: "price-accuracy", question: "Are the prices accurate?", answer: "We do our best to keep them updated, but prices may change based on supplier stock or location." },
      { id: "out-of-stock", question: "What if a product I want is out of stock?", answer: "You can either wait for it to be restocked or choose an alternative from the suggestions shown." }
    ]
  },
  {
    id: "accounts",
    name: "User Accounts & Support",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    items: [
      { id: "account-benefits", question: "What can I do with an account?", answer: "Save your business plans, download requirement and cost lists, track your cart and past purchases, and get alerts for product updates." },
      { id: "reset-password", question: "How do I reset my password?", answer: "Click on 'Forgot Password' on the login page and follow the instructions to reset it." },
      { id: "contact-support", question: "How do I contact support?", answer: "You can email us at support@hustlecare.com or use the contact form on the site." },
      { id: "suggest-business", question: "Can I suggest a new business idea?", answer: "Yes! If you don't see your business idea listed, you can suggest it. We review all submissions and regularly add new businesses." },
      { id: "data-safety", question: "Is my information safe?", answer: "Yes. We take user privacy seriously and use secure systems to protect your data." }
    ]
  }
];

export default function FaqContent() {
  const [searchQuery, setSearchQuery] = useState("");

  const allQuestions = useMemo(() => {
    return faqCategories.flatMap(category =>
      category.items.map(item => ({
        ...item,
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color
      }))
    );
  }, []);

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return allQuestions.filter(q =>
      q.question.toLowerCase().includes(query) ||
      q.answer.toLowerCase().includes(query)
    );
  }, [searchQuery, allQuestions]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-foreground">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know about using Hustlecare to kickstart your business.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search questions..."
              className="pl-10 pr-4 py-6 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {filteredQuestions ? (
          <div className="space-y-6">
            {filteredQuestions.length > 0 ? (
              <div className="bg-background rounded-2xl shadow-lg overflow-hidden border border-muted">
                <div className="px-6 py-4 bg-muted/50">
                  <h2 className="text-lg font-semibold">
                    {filteredQuestions.length} result{filteredQuestions.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
                  </h2>
                </div>
                <Accordion type="multiple" className="divide-y divide-muted">
                  {filteredQuestions.map((item) => (
                    <AccordionItem key={item.id} value={item.id} className="px-6 py-4">
                      <AccordionTrigger className="hover:no-underline group">
                        <div className="flex items-start space-x-4">
                          <div className={`mt-1 ${item.categoryColor} p-1 rounded-md`}>
                            <div className="w-2 h-2 rounded-full" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-medium">{item.question}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{item.categoryName}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-14 pr-4 pt-2 text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ) : (
              <Card className="text-center border-dashed border-2">
                <CardContent className="py-12">
                  <div className="mx-auto bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">No results found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    We couldn&apos;t find any questions matching &quot;{searchQuery}&quot;. Try different keywords or contact our support team.
                  </p>
                  <Button size="lg" className="gap-2">
                    Contact Support <Mail className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {faqCategories.map((category) => (
              <div key={category.id} className="bg-background rounded-2xl shadow-lg overflow-hidden border border-muted">
                <div className={`px-6 py-4 ${category.color} font-medium`}>
                  <h2 className="text-lg font-semibold">{category.name}</h2>
                </div>
                <Accordion type="multiple" className="divide-y divide-muted">
                  {category.items.map((item) => (
                    <AccordionItem key={item.id} value={item.id} className="px-6 py-4">
                      <AccordionTrigger className="hover:no-underline group">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary/10 text-primary p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <ChevronRight className="w-5 h-5 transform group-data-[state=open]:rotate-90 transition-transform" />
                          </div>
                          <h3 className="text-lg font-medium text-left">{item.question}</h3>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-16 pr-4 pt-2 text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        )}

        <Separator className="my-12" />

        <Card className="border border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardContent className="py-8 px-6 text-center">
            <div className="mx-auto bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2">Contact Support <ChevronRight className="w-4 h-4" /></Button>
              <Button variant="outline" size="lg" className="gap-2">Email Us <Mail className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}