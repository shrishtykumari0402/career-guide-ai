"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const HeroSection = () => {
  const imageRef = useRef(null);

  useEffect(() => {
    const imageElement = imageRef.current;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (scrollPosition > scrollThreshold) {
        imageElement.classList.add("scrolled");
      } else {
        imageElement.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="w-full px-5 pb-16 pt-32 md:px-8 md:pb-24 md:pt-44">
      <div className="space-y-8 text-center">
        <div className="mx-auto space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">Clarity for your next move</p>
        <h1 className="mx-auto max-w-5xl text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight gradient-title animate-gradient">
            CareerGuide AI
            <br />
            Your AI-Powered Career Companion
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground md:text-xl">
            Advance your career with personalized guidance, AI-powered resume
            building, interview preparation, and career insights.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="h-12 w-full px-8 shadow-lg sm:w-auto">
              Get Started
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-full px-8 sm:w-auto"
            onClick={() =>
              document.getElementById("features")?.scrollIntoView({
                behavior: "smooth",
              })
            }
          >
            Explore Features
          </Button>
        </div>
        <div className="hero-image-wrapper mt-8 md:mt-4">
          <div ref={imageRef} className="hero-image">
            <Image
              src="/banner.jpeg"
              width={1280}
              height={720}
              alt="Dashboard Preview"
              className="mx-auto rounded-xl border border-border/70 shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
