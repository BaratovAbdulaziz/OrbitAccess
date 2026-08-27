import React from "react";
import LoaderDemo from "./components/LoaderDemo";

function App() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full h-16 bg-canvas/80 backdrop-blur-md border-b border-hairline/50">
        <div className="max-w-6xl mx-auto h-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: "var(--primary)" }}>
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="font-display text-xl tracking-tight text-ink">
              OrbitAccess
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-nav-link text-body hover:text-ink transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-nav-link text-body hover:text-ink transition-colors">
              How it works
            </a>
            <a href="#pricing" className="text-nav-link text-body hover:text-ink transition-colors">
              Pricing
            </a>
            <a
              href="/login"
              className="text-button font-medium px-5 py-2.5 rounded-md transition-all hover:bg-primary-active"
              style={{ 
                background: "var(--primary)", 
                color: "var(--on-primary)" 
              }}
            >
              Get started
            </a>
          </div>
          
          <button className="md:hidden p-2 text-body hover:text-ink transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero Section with Loader */}
      <LoaderDemo />

      {/* Logo Bar */}
      <section className="py-12 bg-surface-soft/50 border-y border-hairline/30">
        <div className="max-w-6xl mx-auto px-8">
          <p className="text-center text-body-sm text-muted mb-8">Trusted by forward-thinking teams worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16 opacity-30">
            {["Vercel", "Linear", "Notion", "Stripe", "Figma", "GitHub"].map((company) => (
              <div key={company} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-ink/80" />
                <span className="font-body text-title-sm text-ink">{company}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-section bg-canvas">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-caption uppercase text-primary tracking-wider mb-4 block">The problem</span>
              <h2 className="font-display text-display-lg tracking-tight text-ink mb-6">
                Access management is broken
              </h2>
              <p className="font-body text-body-lg text-body mb-8 leading-relaxed">
                Manual provisioning creates security gaps. IT teams spend hours on repetitive tasks. 
                When employees leave, access lingers for days.
              </p>
              <div className="space-y-5">
                {[
                  { stat: "4.5 days", text: "Average time to revoke access after termination" },
                  { stat: "67%", text: "Of security breaches involve compromised credentials" },
                  { stat: "15+ hours", text: "Weekly IT time spent on access requests" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-surface-card/50 rounded-lg border border-hairline/30">
                    <div className="font-display text-display-sm text-primary shrink-0">{item.stat}</div>
                    <span className="font-body text-body-md text-body pt-1">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              {/* Mock dashboard */}
              <div className="bg-surface-dark rounded-xl p-8 relative overflow-hidden shadow-2xl shadow-black/20">
                {/* Dashboard header */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-error/80" />
                  <div className="w-3 h-3 rounded-full bg-accent-amber/80" />
                  <div className="w-3 h-3 rounded-full bg-accent-teal/80" />
                  <span className="ml-4 text-body-sm text-on-dark-soft">orbitaccess.app/dashboard</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-caption uppercase text-on-dark-soft tracking-wider">Pending access requests</span>
                    <span className="flex items-center gap-2 text-title-sm text-on-dark">
                      <span className="w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
                      12 pending
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { name: "Sarah Chen", role: "Marketing", apps: ["Slack", "HubSpot"], time: "2h ago" },
                      { name: "James Wilson", role: "Engineering", apps: ["GitHub", "AWS"], time: "4h ago" },
                      { name: "Maria Garcia", role: "Design", apps: ["Figma", "Notion"], time: "6h ago" }
                    ].map((request, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-surface-dark-elevated/80 rounded-lg border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="text-caption text-primary font-medium">{request.name.split(' ').map(n => n[0]).join('')}</span>
                          </div>
                          <div>
                            <div className="text-title-sm text-on-dark font-medium">{request.name}</div>
                            <div className="text-body-sm text-on-dark-soft">{request.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex gap-1">
                            {request.apps.map((app, i) => (
                              <span key={i} className="text-caption text-on-dark-soft bg-white/5 px-2 py-0.5 rounded">
                                {app}
                              </span>
                            ))}
                          </div>
                          <span className="text-body-sm text-on-dark-soft">{request.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Auto-provision indicator */}
                  <div className="flex items-center gap-3 p-3 bg-accent-teal/10 rounded-lg border border-accent-teal/20">
                    <div className="w-8 h-8 rounded-full bg-accent-teal/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-accent-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-title-sm text-on-dark">Auto-provisioning active</div>
                      <div className="text-body-sm text-on-dark-soft">New hires get access automatically based on role</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating accent */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-xl blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-section bg-surface-soft">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-20">
            <span className="text-caption uppercase text-primary tracking-wider mb-4 block">How it works</span>
            <h2 className="font-display text-display-lg tracking-tight text-ink mb-4">
              Three simple steps
            </h2>
            <p className="font-body text-body-lg text-body max-w-xl mx-auto">
              From onboarding to offboarding, OrbitAccess handles the complexity.
            </p>
          </div>
          
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-hairline via-primary/30 to-hairline" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  step: "01",
                  title: "Connect your apps",
                  description: "Integrate with your existing tools in minutes. GitHub, Notion, and 100+ more.",
                  icon: (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  )
                },
                {
                  step: "02",
                  title: "Define roles",
                  description: "Set up access patterns by role, department, or team. One-time configuration.",
                  icon: (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  )
                },
                {
                  step: "03",
                  title: "Automate everything",
                  description: "New hires get access instantly. Departures trigger automatic revocation.",
                  icon: (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  )
                }
              ].map((item, index) => (
                <div key={index} className="relative text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-surface-card border-2 border-hairline flex items-center justify-center text-primary relative z-10">
                    {item.icon}
                  </div>
                  <div className="font-display text-display-sm text-primary/30 mb-2">{item.step}</div>
                  <h3 className="font-body text-title-lg text-ink mb-3">{item.title}</h3>
                  <p className="font-body text-body-md text-body max-w-xs mx-auto">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-section bg-canvas">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <span className="text-caption uppercase text-primary tracking-wider mb-4 block">Features</span>
            <h2 className="font-display text-display-lg tracking-tight text-ink mb-4">
              Everything you need
            </h2>
            <p className="font-body text-body-lg text-body max-w-xl mx-auto">
              Purpose-built for modern teams who value security and speed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                ),
                title: "Automated Provisioning",
                description: "New hires get access instantly based on their role and department. No manual tickets."
              },
              {
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ),
                title: "Real-time Monitoring",
                description: "Track who has access to what across all your applications. Complete visibility."
              },
              {
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                title: "Instant Revocation",
                description: "When someone leaves, access is revoked in seconds, not days. Zero security gaps."
              },
              {
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                ),
                title: "Role-based Access",
                description: "Define access patterns by role, not by individual requests. Set it and forget it."
              },
              {
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                  </svg>
                ),
                title: "Audit Trail",
                description: "Complete history of every access change for compliance and security reviews."
              },
              {
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                ),
                title: "Team Insights",
                description: "Understand access patterns and optimize your security posture with analytics."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-surface-card rounded-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1 border border-transparent hover:border-hairline"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-body text-title-lg text-ink mb-3">
                  {feature.title}
                </h3>
                <p className="font-body text-body-md text-body leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-section bg-surface-dark">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <span className="text-caption uppercase text-accent-teal tracking-wider mb-4 block">Testimonials</span>
            <h2 className="font-display text-display-lg tracking-tight text-on-dark mb-4">
              Loved by teams
            </h2>
            <p className="font-body text-body-lg text-on-dark-soft max-w-xl mx-auto">
              See what our customers have to say.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "OrbitAccess saved our IT team 20 hours per week. Onboarding new employees went from a 3-day process to instant.",
                author: "Sarah Chen",
                role: "Head of Engineering",
                company: "TechCorp"
              },
              {
                quote: "We had a security audit and OrbitAccess made compliance effortless. The audit trail feature is incredible.",
                author: "Michael Rodriguez",
                role: "CISO",
                company: "FinanceHub"
              },
              {
                quote: "When someone left the company, we used to worry about lingering access. Now it's automatic and instant.",
                author: "Emily Watson",
                role: "VP of People",
                company: "GrowthStartup"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-surface-dark-elevated rounded-xl p-8 border border-white/5">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-accent-amber" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <p className="font-body text-body-md text-on-dark mb-6 italic leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                    <span className="text-caption text-primary font-medium">{testimonial.author.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <div className="text-title-sm text-on-dark font-medium">{testimonial.author}</div>
                    <div className="text-body-sm text-on-dark-soft">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-section bg-canvas">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <div className="bg-gradient-to-br from-primary to-primary-active rounded-2xl p-16 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
            
            {/* Grid pattern */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            />
            
            <div className="relative z-10">
              <h2 className="font-display text-display-md tracking-tight text-on-primary mb-6">
                Ready to simplify access?
              </h2>
              <p className="font-body text-body-lg text-on-primary/80 mb-8 max-w-xl mx-auto leading-relaxed">
                Join teams who have eliminated the busywork of access management. 
                Start free, scale as you grow.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/login"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-md text-button font-medium transition-all hover:shadow-xl hover:shadow-black/20"
                  style={{ 
                    background: "var(--surface-dark)", 
                    color: "var(--on-dark)" 
                  }}
                >
                  Get started for free
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-md text-button font-medium text-on-primary/80 hover:text-on-primary transition-colors border border-on-primary/20 hover:border-on-primary/40"
                >
                  Talk to sales
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-surface-dark">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: "var(--primary)" }}>
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="font-display text-xl tracking-tight text-on-dark">
                  OrbitAccess
                </span>
              </div>
              <p className="font-body text-body-md text-on-dark-soft max-w-xs mb-6">
                Employee access, without the busywork. Automate provisioning, monitoring, and revocation.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-on-dark-soft hover:text-on-dark hover:bg-white/10 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-on-dark-soft hover:text-on-dark hover:bg-white/10 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-on-dark-soft hover:text-on-dark hover:bg-white/10 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="text-caption uppercase text-on-dark-soft mb-4 tracking-wider">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="font-body text-body-sm text-on-dark-soft hover:text-on-dark transition-colors">Features</a></li>
                <li><a href="#pricing" className="font-body text-body-sm text-on-dark-soft hover:text-on-dark transition-colors">Pricing</a></li>
                <li><a href="#" className="font-body text-body-sm text-on-dark-soft hover:text-on-dark transition-colors">Integrations</a></li>
                <li><a href="#" className="font-body text-body-sm text-on-dark-soft hover:text-on-dark transition-colors">Changelog</a></li>
                <li><a href="#" className="font-body text-body-sm text-on-dark-soft hover:text-on-dark transition-colors">API Docs</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-caption uppercase text-on-dark-soft mb-4 tracking-wider">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="font-body text-body-sm text-on-dark-soft hover:text-on-dark transition-colors">About</a></li>
                <li><a href="#" className="font-body text-body-sm text-on-dark-soft hover:text-on-dark transition-colors">Blog</a></li>
                <li><a href="#" className="font-body text-body-sm text-on-dark-soft hover:text-on-dark transition-colors">Careers</a></li>
                <li><a href="#" className="font-body text-body-sm text-on-dark-soft hover:text-on-dark transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-caption uppercase text-on-dark-soft mb-4 tracking-wider">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="font-body text-body-sm text-on-dark-soft hover:text-on-dark transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="font-body text-body-sm text-on-dark-soft hover:text-on-dark transition-colors">Terms of Service</a></li>
                <li><a href="#" className="font-body text-body-sm text-on-dark-soft hover:text-on-dark transition-colors">Security</a></li>
                <li><a href="#" className="font-body text-body-sm text-on-dark-soft hover:text-on-dark transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-body text-body-sm text-on-dark-soft">
              © 2026 OrbitAccess, Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span className="font-body text-body-sm text-on-dark-soft">Made with care for modern teams</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
