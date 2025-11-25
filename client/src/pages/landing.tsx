import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, Users, Sparkles, Brain, Apple, Dumbbell,
  Sun, Coffee, Target, TrendingUp, Heart, Award,
  CheckCircle, Lock, Shield, Play, Zap, BarChart3,
  Moon, MessageCircle, Mail, Send, Loader2
} from "lucide-react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import logoImage from "@assets/1_1753425387748.png";
import webImage from "@assets/Web Img_1753427692751.jpg";
import fitnessTrackerImage from "@assets/q_1753436934390.jpg";
import morningImage from "@assets/stock_images/person_doing_morning_5b4c9d02.jpg";
import dinnerImage from "@assets/stock_images/healthy_dinner_meal__737e0362.jpg";
import celebrationImage from "@assets/stock_images/person_celebrating_a_24d32b8e.jpg";

// Simple fade in animation
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

// Animated section wrapper
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Contact Form Section Component
function ContactFormSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you soon.",
      });

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-primary/10 to-blue-600/10 text-primary border-primary/20 px-4 py-2">
              <Mail className="w-4 h-4 mr-2 inline" />
              Get In Touch
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Have questions about MikeAI? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <Card className="p-8 shadow-xl border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contact-name" className="text-gray-700 font-medium">Name</Label>
                  <Input
                    id="contact-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="border-gray-200 focus:border-primary focus:ring-primary"
                    disabled={isSubmitting}
                    data-testid="input-contact-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="text-gray-700 font-medium">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="border-gray-200 focus:border-primary focus:ring-primary"
                    disabled={isSubmitting}
                    data-testid="input-contact-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject" className="text-gray-700 font-medium">Subject</Label>
                <Input
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What is this about?"
                  className="border-gray-200 focus:border-primary focus:ring-primary"
                  disabled={isSubmitting}
                  data-testid="input-contact-subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message" className="text-gray-700 font-medium">Message</Label>
                <Textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us more about your inquiry..."
                  className="border-gray-200 focus:border-primary focus:ring-primary min-h-[150px] resize-none"
                  disabled={isSubmitting}
                  data-testid="input-contact-message"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-primary to-blue-600 text-white py-6 text-lg font-semibold hover:opacity-90 transition-opacity"
                data-testid="button-contact-submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <AnimatedPage className="min-h-screen bg-white">
      {/* Clean Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/10">
                <img src={logoImage} alt="MikeAI Logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">MikeAI</span>
                <span className="text-xs text-gray-500">Nutrition & Fitness</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.href = '/signin'} 
                data-testid="button-signin-header"
              >
                Sign In
              </Button>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-primary to-blue-600 text-white"
                onClick={() => window.location.href = '/signin'}
                data-testid="button-signup-header"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO: Clear Split-Screen */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: BEFORE */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Badge className="mb-6 bg-gray-100 text-gray-600 border-gray-200">Before</Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-400 mb-4 line-through">
                Confused
                <br />Overwhelmed
                <br />Stuck
              </h2>
              <p className="text-lg text-gray-500">
                Trying every diet. Guessing workouts. Seeing no progress.
              </p>
            </motion.div>

            {/* Right: AFTER */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-primary to-blue-600 text-white border-none">With MikeAI</Badge>
              <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
                <span className="block text-primary">Clear.</span>
                <span className="block text-blue-600">Confident.</span>
                <span className="block text-purple-600">Transformed.</span>
              </h1>
              <p className="text-xl text-gray-700 mb-8 font-medium">
                AI-powered meal plans and workouts that actually work for you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white px-8 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                  onClick={() => window.location.href = '/signin'}
                  data-testid="button-individual-signup"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Realistic Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { value: "100+", label: "Active Users" },
                  { value: "50+", label: "Meal Plans" },
                  { value: "60+", label: "Workouts" },
                  { value: "95%", label: "Success Rate" }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-2xl md:text-3xl font-black text-primary">{stat.value}</div>
                    <div className="text-xs md:text-sm text-gray-600 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* YOUR DAY TIMELINE */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <Section className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary">Your Day, Optimized</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Every Moment Counts
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how AI transforms your daily routine into a path to success
            </p>
          </Section>

          <div className="space-y-20">
            {[
              {
                time: "6:00 AM",
                icon: <Sun className="w-10 h-10" />,
                title: "Wake Up Ready",
                description: "Start your day with energy. AI adjusts your workout based on sleep quality.",
                gradient: "from-yellow-400 to-orange-500",
                image: morningImage
              },
              {
                time: "8:00 AM",
                icon: <Coffee className="w-10 h-10" />,
                title: "Perfect Breakfast",
                description: "Your personalized meal plan serves exactly what your body needs.",
                gradient: "from-amber-500 to-orange-600",
                image: webImage
              },
              {
                time: "12:00 PM",
                icon: <Dumbbell className="w-10 h-10" />,
                title: "Smart Workout",
                description: "Video guides and AI coaching help you nail every rep with perfect form.",
                gradient: "from-blue-500 to-purple-600",
                image: fitnessTrackerImage
              },
              {
                time: "6:00 PM",
                icon: <Apple className="w-10 h-10" />,
                title: "Delicious Dinner",
                description: "AI recipe generator creates meals you'll love that hit your macros perfectly.",
                gradient: "from-green-500 to-teal-600",
                image: dinnerImage
              },
              {
                time: "10:00 PM",
                icon: <Moon className="w-10 h-10" />,
                title: "Track Progress",
                description: "Check your streaks, earn points, and see your transformation unfold.",
                gradient: "from-indigo-500 to-purple-600",
                image: celebrationImage
              }
            ].map((moment, idx) => (
              <Section key={idx}>
                <div className={`grid md:grid-cols-2 gap-12 items-center ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                  <div className={idx % 2 === 1 ? 'md:order-2' : ''}>
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${moment.gradient} rounded-xl text-white mb-4 shadow-lg`}>
                      {moment.icon}
                    </div>
                    <div className="text-sm font-bold text-gray-400 tracking-wide mb-2">{moment.time}</div>
                    <h3 className="text-3xl font-black text-gray-900 mb-3">{moment.title}</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">{moment.description}</p>
                  </div>
                  <div className={idx % 2 === 1 ? 'md:order-1' : ''}>
                    <div className="relative rounded-2xl overflow-hidden shadow-xl group">
                      <img 
                        src={moment.image} 
                        alt={moment.title} 
                        className="w-full h-72 object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${moment.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                    </div>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <Section className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary">Complete Platform</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              All the tools to transform your health, in one powerful platform
            </p>
          </Section>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: <Brain className="w-8 h-8" />,
                title: "AI Meal Planner",
                description: "Personalized meal plans that adapt to your goals and preferences",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Dumbbell className="w-8 h-8" />,
                title: "Workout Programs",
                description: "Custom workout plans with video guides and progress tracking",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "Habit Tracking",
                description: "Build healthy habits with daily tracking and streak rewards",
                gradient: "from-orange-500 to-red-500"
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: "Fitness GPT",
                description: "AI chatbot for instant nutrition and fitness advice 24/7",
                gradient: "from-green-500 to-teal-500"
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Community",
                description: "Connect with others, share progress, stay motivated together",
                gradient: "from-indigo-500 to-blue-500"
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Progress Analytics",
                description: "Visual insights and detailed tracking of your transformation",
                gradient: "from-pink-500 to-rose-500"
              }
            ].map((feature, idx) => (
              <motion.div key={idx} variants={fadeIn}>
                <Card className="p-6 border-2 border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300 group h-full bg-white">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 text-white transform group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* FINAL CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary via-blue-600 to-purple-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <Section>
            <Badge className="mb-6 bg-white/20 text-white border-white/30 px-6 py-2">
              <Award className="w-5 h-5 mr-2 inline" />
              Join 100+ People Transforming Their Lives
            </Badge>

            <h2 className="text-4xl md:text-6xl font-black mb-6">
              Ready to Transform?
            </h2>

            <p className="text-xl md:text-2xl mb-10 text-blue-100">
              Start your free 7-day trial today. No credit card required.
            </p>

            <Button
              size="lg"
              className="bg-white text-primary hover:bg-gray-100 px-10 py-7 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all"
              onClick={() => window.location.href = '/signin'}
            >
              Start Free Trial
              <Play className="ml-2 h-6 w-6" />
            </Button>

            <div className="flex flex-wrap gap-6 justify-center mt-10 text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>7-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>No Credit Card</span>
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* CONTACT FORM SECTION */}
      <ContactFormSection />

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoImage} alt="Logo" className="w-8 h-8 rounded-full" />
                <span className="font-bold text-white">MikeAI</span>
              </div>
              <p className="text-sm">
                Transform your health with AI-powered nutrition and fitness.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/terms" className="hover:text-white transition-colors">Terms & Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 MikeAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </AnimatedPage>
  );
}
