import { Rocket, Lightbulb, ShoppingCart, Download, CheckCircle, Users, GraduationCap, BarChart2, Search, List, ShoppingBag, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="bg-gradient-to-b from-background to-muted/10">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-foreground">
            About Hustlecare
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            Helping you start smarter.
          </p>
          <div className="mt-8 max-w-2xl mx-auto">
            <p className="text-lg">
              Starting a business can be exciting—but also confusing, expensive, and overwhelming. 
              Hustlecare exists to make the process easier. Whether you're launching a side hustle, 
              building your dream company, or just exploring ideas, we help you understand what you'll 
              need and how much it might cost—before you even spend a shilling.
            </p>
          </div>
        </div>
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">What We Do</h2>
          <p className="mt-4 text-muted-foreground max-w-3xl mx-auto">
            We provide practical startup planning tools to help aspiring entrepreneurs:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { 
              icon: <Search className="w-8 h-8 text-primary" />, 
              title: "Discover requirements", 
              description: "Find out exactly what's needed to start your specific business" 
            },
            { 
              icon: <BarChart2 className="w-8 h-8 text-primary" />, 
              title: "Understand costs", 
              description: "Get realistic estimates of startup expenses" 
            },
            { 
              icon: <ShoppingBag className="w-8 h-8 text-primary" />, 
              title: "Access products", 
              description: "Connect with trusted sellers for what you need" 
            },
            { 
              icon: <Download className="w-8 h-8 text-primary" />, 
              title: "Save plans", 
              description: "Download and store your business plans offline" 
            },
            { 
              icon: <ShoppingCart className="w-8 h-8 text-primary" />, 
              title: "Shop conveniently", 
              description: "Get everything in one place" 
            },
            { 
              icon: <Rocket className="w-8 h-8 text-primary" />, 
              title: "Focus on execution", 
              description: "We handle the research so you can build your business" 
            },
          ].map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Lightbulb className="w-5 h-5 mr-2" />
            <span>Our Mission</span>
          </div>
          <h2 className="text-3xl font-bold mb-6">
            To empower entrepreneurs with the clarity, confidence, and tools they need to launch and grow sustainable businesses.
          </h2>
          <div className="flex justify-center">
            <Separator className="w-16 bg-primary" />
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Who It's For</h2>
          <p className="mt-4 text-muted-foreground max-w-3xl mx-auto">
            Hustlecare is built for everyone with entrepreneurial dreams
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              icon: <Rocket className="w-6 h-6" />, 
              title: "First-time entrepreneurs", 
              description: "Figuring out where to start" 
            },
            { 
              icon: <Users className="w-6 h-6" />, 
              title: "Side hustlers", 
              description: "Looking to formalize their idea" 
            },
            { 
              icon: <GraduationCap className="w-6 h-6" />, 
              title: "Students & researchers", 
              description: "Exploring business models" 
            },
            { 
              icon: <BarChart2 className="w-6 h-6" />, 
              title: "Small business owners", 
              description: "Expanding into new areas" 
            },
          ].map((item, index) => (
            <div key={index} className="flex items-start space-x-4 p-6 bg-background rounded-lg border">
              <div className="mt-1 p-2 rounded-full bg-primary/10 text-primary">
                {item.icon}
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="mt-4 text-muted-foreground">
              Get from idea to execution in simple steps
            </p>
          </div>

          <div className="space-y-8">
            {[
              { step: "1", title: "Search for a business idea", icon: <Search className="w-5 h-5" /> },
              { step: "2", title: "View startup requirements", icon: <List className="w-5 h-5" /> },
              { step: "3", title: "Explore costs & products", icon: <BarChart2 className="w-5 h-5" /> },
              { step: "4", title: "Customize & download plan", icon: <Download className="w-5 h-5" /> },
              { step: "5", title: "Shop from verified sellers", icon: <ShoppingCart className="w-5 h-5" /> },
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white">
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium">
                    <span className="mr-2">{item.icon}</span>
                    {item.title}
                  </p>
                  <Separator className="mt-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Globe className="w-5 h-5 mr-2" />
            <span>Our Vision</span>
          </div>
          <h2 className="text-3xl font-bold mb-6">
            Building the go-to platform for business setup across Africa—where anyone, anywhere, can turn a great idea into a working business with clarity and confidence.
          </h2>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Let's Build Together</h2>
          <p className="text-lg mb-8">
            We're constantly improving and adding more businesses, requirements, and tools. 
            If there's something you'd like to see—or a business idea you'd like us to add—let us know!
          </p>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2">
                Contact Us
                
              </Button>
              <Button variant="outline" size="lg">
                Suggest a Business Idea
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Have feedback or questions? Reach us at support@hustlecare.com
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}