import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Trophy,
  Target,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import HeroSection from "@/components/hero";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import { features } from "@/data/features";
import { testimonial } from "@/data/testimonial";
import { faqs } from "@/data/faqs";
import { howItWorks } from "@/data/howItWorks";

export default function LandingPage() {
  return (
    <>
      <div className="grid-background"></div>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section id="features" className="w-full border-y border-border/60 bg-background/80 py-16 md:py-24 lg:py-28">
        <div className="container mx-auto px-5 md:px-8">
          <h2 className="mx-auto mb-12 max-w-2xl text-center text-3xl font-bold tracking-tight md:text-4xl">
            Powerful Features for Your Career Growth
          </h2>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group border-border/70 bg-card/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-card hover:shadow-xl"
              >
                <CardContent className="flex h-full flex-col items-center p-6 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full bg-muted/30 py-14 md:py-20">
        <div className="container mx-auto px-5 md:px-8">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-y-10 text-center md:grid-cols-4 md:gap-8">
            <div className="flex flex-col items-center justify-center gap-2">
              <h3 className="text-3xl font-bold tracking-tight md:text-4xl">50+</h3>
              <p className="text-muted-foreground">Industries Covered</p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <h3 className="text-3xl font-bold tracking-tight md:text-4xl">1000+</h3>
              <p className="text-muted-foreground">Interview Questions</p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <h3 className="text-3xl font-bold tracking-tight md:text-4xl">95%</h3>
              <p className="text-muted-foreground">Success Rate</p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <h3 className="text-3xl font-bold tracking-tight md:text-4xl">24/7</h3>
              <p className="text-muted-foreground">AI Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full bg-background py-16 md:py-24">
        <div className="container mx-auto px-5 md:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">How It Works</h2>
            <p className="text-muted-foreground">
              Four simple steps to accelerate your career growth
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {howItWorks.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center space-y-4 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-inner">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-5 md:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
            What Our Users Say
          </h2>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-3">
            {testimonial.map((testimonial, index) => (
              <Card key={index} className="border-border/70 bg-background/90 shadow-sm transition-transform duration-300 hover:-translate-y-1">
                <CardContent className="h-full p-6 md:p-7">
                  <div className="flex h-full flex-col justify-between gap-8">
                    <blockquote>
                      <p className="relative text-sm leading-7 text-muted-foreground italic">
                        <span className="absolute -left-2 -top-5 text-4xl text-primary/60">&quot;</span>
                        {testimonial.quote}
                        <span className="absolute -bottom-5 text-4xl text-primary/60">&quot;</span>
                      </p>
                    </blockquote>
                    <div className="flex items-center space-x-4">
                      <div className="relative h-12 w-12 flex-shrink-0">
                        <Image
                          width={40}
                          height={40}
                          src={testimonial.image}
                          alt={testimonial.author}
                          className="rounded-full object-cover border-2 border-primary/20"
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </p>
                        <p className="text-sm text-primary">
                          {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-12 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Find answers to common questions about our platform
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full px-4 pb-8 md:px-8 md:pb-12">
        <div className="mx-auto rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/90 via-primary/80 to-primary/60 px-5 py-16 shadow-2xl md:py-24">
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center space-y-5 text-center">
            <h2 className="text-3xl font-bold tracking-tighter text-primary-foreground sm:text-4xl md:text-5xl">
              Ready to Accelerate Your Career?
            </h2>
            <p className="mx-auto max-w-[600px] text-primary-foreground/80 md:text-xl">
              Join thousands of professionals who are advancing their careers
              with AI-powered guidance.
            </p>
            <Link href="/dashboard" passHref>
              <Button
                size="lg"
                variant="secondary"
                className="mt-5 h-11 px-6 shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Start Your Journey Today <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
