import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Menu, X, Home, Building2, Play, Instagram, Phone, Mail, ArrowRight, Quote, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createContactInquiry } from "@/lib/supabase";
import { Toaster } from "@/components/ui/toaster";

const contactFormSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  projectType: z.string({ required_error: "Please select a project type" }),
  message: z.string().min(10, "Please provide more details about your project"),
});

function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Only run on desktop
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const updateHoverState = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = target.closest('a, button, input, select, textarea, [role="button"]');
      setIsHovering(!!isClickable);
    };

    window.addEventListener("mousemove", updatePosition);
    window.addEventListener("mouseover", updateHoverState);

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      window.removeEventListener("mouseover", updateHoverState);
    };
  }, []);

  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return null;

  return (
    <motion.div
      className={`custom-cursor ${isHovering ? "hover" : ""}`}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "tween", ease: "backOut", duration: 0.15 }}
    />
  );
}

function AnimatedCounter({ end, text }: { end: string, text: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <div ref={ref} className="flex flex-col items-start">
      <motion.span 
        className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {end}
      </motion.span>
      <motion.span 
        className="text-sm tracking-widest text-muted-foreground uppercase mt-2"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        {text}
      </motion.span>
    </div>
  );
}

function SectionHeading({ children, subtitle }: { children: React.ReactNode, subtitle?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="mb-12 md:mb-20 text-center"
    >
      <h2 className="text-3xl md:text-5xl font-serif mb-4">{children}</h2>
      {subtitle && <p className="text-muted-foreground tracking-widest uppercase text-xs md:text-sm">{subtitle}</p>}
    </motion.div>
  );
}

function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portfolioFilter, setPortfolioFilter] = useState<"Interior" | "Exterior">("Interior");
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroY = useTransform(scrollY, [0, 500], [0, 100]);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      company: "",
      projectType: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof contactFormSchema>) {
    try {
      await createContactInquiry({
        fullName: values.fullName,
        email: values.email,
        company: values.company,
        projectType: values.projectType,
        message: values.message,
      });

      toast({
        title: "Inquiry Sent",
        description: "Thanks for reaching out. We'll get back to you within 24 hours.",
      });
      form.reset();
    } catch (error) {
      console.error("Failed to submit contact inquiry", error);
      toast({
        variant: "destructive",
        title: "Inquiry Not Sent",
        description: "Please try again in a moment or email hearthastudio@gmail.com directly.",
      });
    }
  }

  const portfolioItems = {
    Interior: [
      { id: 1, src: "/assets/portfolio/int-1.png", title: "Minimalist Living", type: "Interior" },
      { id: 2, src: "/assets/portfolio/int-2.png", title: "Luxury Bath", type: "Interior" },
      { id: 3, src: "/assets/portfolio/int-3.png", title: "Open Kitchen", type: "Interior" },
    ],
    Exterior: [
      { id: 4, src: "/assets/portfolio/ext-1.png", title: "Modern Villa", type: "Exterior" },
      { id: 5, src: "/assets/portfolio/ext-2.png", title: "Minimalist Facade", type: "Exterior" },
      { id: 6, src: "/assets/portfolio/ext-3.png", title: "Contemporary Res", type: "Exterior" },
    ]
  };

  return (
    <div className="bg-background min-h-[100dvh] text-foreground font-sans selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <CustomCursor />
      
      {/* 1. NAVBAR */}
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          isScrolled ? "bg-background/90 backdrop-blur-md py-4 border-b border-border/50" : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
          <button 
            onClick={() => scrollTo("home")}
            className="text-primary font-serif tracking-[0.2em] text-sm md:text-base uppercase hover:opacity-80 transition-opacity"
          >
            Heartha Studio
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm tracking-widest uppercase">
            {["Portfolio", "Services", "About", "Contact"].map((item) => (
              <button 
                key={item} 
                onClick={() => scrollTo(item.toLowerCase())}
                className="hover:text-primary transition-colors duration-300"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Mobile Nav Toggle */}
          <button 
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center gap-8 md:hidden"
          >
            {["Portfolio", "Services", "About", "Contact"].map((item) => (
              <button 
                key={item} 
                onClick={() => scrollTo(item.toLowerCase())}
                className="text-2xl font-serif hover:text-primary transition-colors"
              >
                {item}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. HERO */}
      <section id="home" className="relative h-[100dvh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-background/60 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background z-10"></div>
          <div className="noise-bg"></div>
          <img 
            src="/assets/hero.png" 
            alt="Luxury interior architecture visualization" 
            className="w-full h-full object-cover"
          />
        </div>

        <motion.div 
          className="relative z-20 container mx-auto px-6 text-center flex flex-col items-center"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <motion.span 
            initial={{ opacity: 0, letterSpacing: "0em" }}
            animate={{ opacity: 1, letterSpacing: "0.3em" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-xs md:text-sm text-muted-foreground uppercase mb-6 block"
          >
            Architectural Visualization
          </motion.span>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-4xl md:text-6xl lg:text-7xl font-serif max-w-4xl leading-tight mb-8"
          >
            We visualize spaces <br/>
            <span className="relative inline-block mt-2">
              before they exist
              <motion.span 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, delay: 1 }}
                className="absolute -bottom-2 left-0 h-[2px] bg-primary"
              />
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-muted-foreground md:text-lg max-w-lg mb-10"
          >
            Interior & Exterior Rendering for architects and developers who refuse to present anything less than extraordinary.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <Button 
              size="lg" 
              onClick={() => scrollTo("contact")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none px-8 py-6 text-sm tracking-widest uppercase"
            >
              Start a Project
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* 3. PORTFOLIO */}
      <section id="portfolio" className="py-24 md:py-40 container mx-auto px-6">
        <SectionHeading subtitle="Featured Projects">Our Work</SectionHeading>
        
        <div className="flex justify-center gap-8 mb-12">
          {(["Interior", "Exterior"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setPortfolioFilter(tab)}
              className={`text-sm tracking-widest uppercase pb-2 border-b-2 transition-all duration-300 ${
                portfolioFilter === tab 
                  ? "border-primary text-foreground" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {portfolioItems[portfolioFilter].map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="group relative aspect-[4/3] overflow-hidden bg-card"
              >
                <img 
                  src={item.src} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-primary text-xs tracking-widest uppercase mb-2">{item.type}</span>
                  <h3 className="text-xl font-serif">{item.title}</h3>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* 4. SERVICES */}
      <section id="services" className="py-24 md:py-40 bg-card border-y border-border/50">
        <div className="container mx-auto px-6">
          <SectionHeading subtitle="Expertise">What We Offer</SectionHeading>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Home,
                title: "Interior Rendering",
                desc: "Photorealistic interior visuals that help clients fall in love with a space before it's built."
              },
              {
                icon: Building2,
                title: "Exterior Rendering",
                desc: "Stunning facade and landscape visualizations for presentations, approvals, and marketing."
              },
              {
                icon: Play,
                title: "Walkthrough Animation",
                desc: "Full 3D walkthroughs that bring your project to life in motion."
              }
            ].map((service, idx) => (
              <motion.div 
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="p-10 border border-border bg-background hover:border-primary transition-colors duration-500 group"
              >
                <service.icon className="w-10 h-10 text-primary mb-8 opacity-80 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-2xl font-serif mb-4">{service.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. ABOUT */}
      <section id="about" className="py-24 md:py-40 container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl font-serif mb-8">About Heartha Studio</h2>
            <div className="text-muted-foreground space-y-6 leading-relaxed text-lg mb-12">
              <p>
                We are a specialized architectural visualization studio crafting high-fidelity renders for architects, interior designers, and real estate developers.
              </p>
              <p>
                Every project we take on is treated with precision, artistic care, and a deep understanding of space and light. We don't just render models; we compose atmospheres.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
              <AnimatedCounter end="50+" text="Projects" />
              <AnimatedCounter end="30+" text="Clients" />
              <AnimatedCounter end="3+" text="Years" />
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative aspect-[3/4] w-full"
          >
            <img 
              src="/assets/about.png" 
              alt="Heartha Studio Workspace" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-border/50"></div>
          </motion.div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-24 md:py-40 bg-card border-y border-border/50">
        <div className="container mx-auto px-6">
          <SectionHeading>What Clients Say</SectionHeading>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                text: "Working with Heartha Studio transformed how we present our projects to clients. The renders are simply breathtaking.",
                author: "Ahmad Al-Rashid",
                role: "Principal Architect, Form & Space Studio"
              },
              {
                text: "Our real estate listings sold faster after switching to Heartha's visualizations. The quality speaks for itself.",
                author: "Sarah Chen",
                role: "Development Director, Meridian Properties"
              }
            ].map((quote, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="p-10 md:p-14 bg-background relative overflow-hidden"
              >
                <Quote className="absolute top-8 right-8 w-24 h-24 text-primary/10" />
                <p className="text-lg md:text-xl font-serif italic mb-8 relative z-10 text-foreground/90">
                  "{quote.text}"
                </p>
                <div className="relative z-10">
                  <p className="font-medium tracking-wide">{quote.author}</p>
                  <p className="text-sm text-primary uppercase tracking-wider mt-1">{quote.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CONTACT */}
      <section id="contact" className="py-24 md:py-40 container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeading subtitle="Tell us about your project and we'll get back within 24 hours">
            Start a Project
          </SectionHeading>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
            <div className="lg:col-span-3">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-base pb-2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-base pb-2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Company (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Architecture Firm" className="bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-base pb-2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="projectType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Project Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none px-0 focus:ring-0 focus:border-primary text-base pb-2">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="interior">Interior Rendering</SelectItem>
                              <SelectItem value="exterior">Exterior Rendering</SelectItem>
                              <SelectItem value="walkthrough">Walkthrough</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Message / Brief</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about the scope, style, and timeline..." 
                            className="min-h-[120px] bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-base resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    disabled={form.formState.isSubmitting}
                    className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-none px-12 py-6 text-sm tracking-widest uppercase group"
                  >
                    {form.formState.isSubmitting ? "Sending..." : "Send Inquiry"}
                    {form.formState.isSubmitting ? (
                      <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    )}
                  </Button>
                </form>
              </Form>
            </div>
            
            <div className="lg:col-span-2 space-y-10 lg:pl-10 lg:border-l border-border">
              <div>
                <h4 className="font-serif text-2xl mb-6">Contact Info</h4>
                <div className="space-y-6">
                  <a href="mailto:hearthastudio@gmail.com" className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors">
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center bg-card">
                      <Mail className="w-4 h-4" />
                    </div>
                    hearthastudio@gmail.com
                  </a>
                  <a href="tel:+919645123926" className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors">
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center bg-card">
                      <Phone className="w-4 h-4" />
                    </div>
                    +91 9645123926
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors">
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center bg-card">
                      <Instagram className="w-4 h-4" />
                    </div>
                    @hearthastudio
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-card py-12 border-t border-border">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted-foreground text-sm">
            © 2026 Heartha Studio. All rights reserved.
          </p>
          
          <div className="flex gap-6">
            {["Portfolio", "Services", "About", "Contact"].map((item) => (
              <button 
                key={item} 
                onClick={() => scrollTo(item.toLowerCase())}
                className="text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
          
          <div className="flex gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="tel:+919645123926" className="text-muted-foreground hover:text-primary transition-colors">
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}

export default App;
