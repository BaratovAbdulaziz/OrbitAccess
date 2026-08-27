import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderDemoProps {
  className?: string;
}

const LoaderDemo: React.FC<LoaderDemoProps> = ({ className }) => {
  return (
    <section
      className={cn(
        "w-full min-h-screen flex items-center justify-center relative overflow-hidden",
        "bg-canvas",
        className
      )}
    >
      {/* Subtle background texture */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--ink) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />
      
      {/* Decorative gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-teal/5 rounded-full blur-3xl" />
      
      <div className="w-full max-w-6xl mx-auto px-8 relative z-10">
        {/* Hero Content */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-surface-card/80 backdrop-blur-sm rounded-pill px-4 py-2 mb-8 border border-hairline">
            <span className="w-2 h-2 rounded-full bg-accent-teal animate-pulse" />
            <span className="text-caption uppercase text-muted tracking-wider">Now in public beta</span>
          </div>
          
          <h1 className="font-display text-display-xl tracking-tight text-ink mb-6 max-w-4xl mx-auto leading-[1.05]">
            Employee access,{' '}
            <span className="text-primary">without the busywork.</span>
          </h1>
          
          <p className="font-body text-body-lg text-body max-w-2xl mx-auto mb-10 leading-relaxed">
            OrbitAccess automates provisioning, monitoring, and revocation of application access — 
            so your team can focus on what matters.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/login"
              className="group flex items-center gap-2 px-7 py-4 rounded-md text-button font-medium transition-all hover:bg-primary-active hover:shadow-lg hover:shadow-primary/20"
              style={{ 
                background: "var(--primary)", 
                color: "var(--on-primary)" 
              }}
            >
              Get started free
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-7 py-4 rounded-md text-button font-medium transition-all hover:bg-surface-card border border-hairline"
              style={{ 
                background: "var(--canvas)", 
                color: "var(--ink)", 
              }}
            >
              See how it works
            </a>
          </div>
          
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-8 text-body-sm text-muted">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Free for up to 10 users</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Setup in 5 minutes</span>
            </div>
          </div>
        </div>
        
        {/* Loader Container */}
        <div className="flex justify-center mb-16">
          <div 
            className="relative"
            style={{
              transform: 'scale(1.4)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Glow effect behind loader */}
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150" />
            
            <div className="loader relative">
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
        </div>
        
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 px-6 bg-surface-card/50 backdrop-blur-sm rounded-xl border border-hairline">
          {[
            { value: "4.5 days", label: "Avg. time saved per termination" },
            { value: "100+", label: "App integrations" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "< 5 min", label: "Average setup time" }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="font-display text-display-sm text-ink mb-1">{stat.value}</div>
              <div className="font-body text-body-sm text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LoaderDemo;
