import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { features, Feature } from '@/data/hero-features';

interface CubeCalloutProps {
  feature: Feature;
  isVisible: boolean;
  scrollProgress: number;
}

const CubeCallout: React.FC<CubeCalloutProps> = ({ feature, isVisible, scrollProgress }) => {
  const calloutRef = useRef<HTMLDivElement>(null);
  
  // Calculate position based on cube index
  const getPosition = () => {
    const index = feature.cubeIndex;
    // Position callouts in a circular pattern around the center
    const angle = (index / 8) * Math.PI * 2 - Math.PI / 2;
    const radius = 280;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return { x, y };
  };
  
  const position = getPosition();
  
  return (
    <div
      ref={calloutRef}
      className={cn(
        "absolute transition-all duration-500 ease-out",
        "pointer-events-none",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
        transform: `translate(-50%, -50%) ${isVisible ? 'translate-y-0' : 'translate-y-4'}`,
      }}
    >
      <div className="relative">
        {/* Connecting line */}
        <div className={cn(
          "absolute w-px h-8 bg-gradient-to-b from-transparent to-zinc-900/20",
          "left-1/2 -translate-x-1/2",
          position.y > 0 ? "bottom-full mb-2" : "top-full mt-2"
        )} />
        
        {/* Callout card */}
        <div className={cn(
          "bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg",
          "border border-zinc-200/50",
          "max-w-[200px]"
        )}>
          <h3 className="font-display text-sm font-semibold text-zinc-900 mb-1">
            {feature.title}
          </h3>
          <p className="font-body text-xs text-zinc-600 leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </div>
  );
};

interface ScrollDrivenHeroProps {
  className?: string;
}

const ScrollDrivenHero: React.FC<ScrollDrivenHeroProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visibleFeatures, setVisibleFeatures] = useState<Set<number>>(new Set());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const animationFrameRef = useRef<number>();
  const lastScrollY = useRef(0);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress (0 to 1) based on scroll position
      // Hero section is 3x viewport height for scroll space
      const heroHeight = windowHeight * 3;
      const progress = Math.min(Math.max(scrollY / (heroHeight - windowHeight), 0), 1);
      
      setScrollProgress(progress);
      lastScrollY.current = scrollY;
      
      // Update CSS custom property
      document.documentElement.style.setProperty('--scroll-progress', progress.toString());
      
      // Calculate which features should be visible
      // Each cube lands at a specific progress point
      const newVisibleFeatures = new Set<number>();
      features.forEach((feature) => {
        const featureThreshold = (feature.cubeIndex + 1) / 9; // 8 cubes, land at 1/9, 2/9, ... 8/9
        if (progress >= featureThreshold) {
          newVisibleFeatures.add(feature.cubeIndex);
        }
      });
      setVisibleFeatures(newVisibleFeatures);
    });
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      // Show all features immediately if reduced motion is preferred
      setVisibleFeatures(new Set(features.map(f => f.cubeIndex)));
      setScrollProgress(1);
      return;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleScroll, prefersReducedMotion]);

  // Update loader animation state based on scroll progress
  useEffect(() => {
    if (!loaderRef.current) return;
    
    const loader = loaderRef.current;
    const animations = loader.getAnimations({ subtree: true });
    
    animations.forEach((animation) => {
      if (prefersReducedMotion) {
        // Play all animations in final state
        animation.finish();
      } else {
        // Pause all animations and set delay based on scroll
        animation.cancel();
        const timing = animation.effect?.getTiming();
        const duration = (timing?.duration && typeof timing.duration === 'number') ? timing.duration : 3000;
        animation.currentTime = scrollProgress * duration;
      }
    });
  }, [scrollProgress, prefersReducedMotion]);

  return (
    <section
      ref={containerRef}
      className={cn(
        "relative w-full h-[300vh]",
        className
      )}
    >
      {/* Sticky hero container */}
      <div className="sticky top-0 w-full h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 to-zinc-100" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Main content area */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-8">
          {/* Headline */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-zinc-900 tracking-tight mb-4">
              Build Faster
            </h1>
            <p className="font-body text-lg text-zinc-600 max-w-md">
              Scroll to assemble your workflow, one block at a time
            </p>
          </div>
          
          {/* Loader container */}
          <div 
            ref={loaderRef}
            className="relative"
            style={{
              transform: 'scale(1.2)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* The 3D Box Loader */}
            <div className="relative">
              <style>{`
                .loader {
                  animation-play-state: paused !important;
                }
                .loader .box, .loader .ground, .loader:before, .loader:after {
                  animation-play-state: paused !important;
                }
              `}</style>
              <div className="loader">
                {[...Array(8).keys()].map(i => (
                  <div key={i} className={`box box${i}`}>
                    <div></div>
                  </div>
                ))}
                <div className="ground">
                  <div></div>
                </div>
              </div>
            </div>
            
            {/* Feature callouts */}
            {features.map((feature) => (
              <CubeCallout
                key={feature.cubeIndex}
                feature={feature}
                isVisible={visibleFeatures.has(feature.cubeIndex)}
                scrollProgress={scrollProgress}
              />
            ))}
          </div>
          
          {/* Scroll indicator */}
          <div className={cn(
            "absolute bottom-12 left-1/2 -translate-x-1/2 text-center transition-opacity duration-500",
            scrollProgress > 0.1 ? "opacity-0" : "opacity-100"
          )}>
            <div className="flex flex-col items-center gap-2">
              <span className="font-body text-sm text-zinc-500">Scroll to explore</span>
              <div className="w-px h-12 bg-gradient-to-b from-zinc-400 to-transparent animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-200">
          <div 
            className="h-full bg-zinc-900 transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
};

export default ScrollDrivenHero;
