import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Scissors, Users, Zap, Shield, Clock, TrendingUp, Mail, Phone, MapPin, Star } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useTheme } from '../store/theme'

const heroImages = [
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=1920&h=1080&fit=crop',
]

export function LandingPage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const [activeHeroImage, setActiveHeroImage] = useState(0)
  useEffect(() => {
    setActiveHeroImage(0)
  }, [theme])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveHeroImage((current) => (current + 1) % 3)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [])

  const features = [
    {
      icon: Scissors,
      title: 'Ticket-Gated Service',
      description: 'Haircutters can only start work with a cashier-issued ticket.',
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Separate dashboards for Cashiers, Haircutters, Managers, and Admins.',
    },
    {
      icon: Zap,
      title: 'Real-Time Operations',
      description: 'Live floor monitoring, instant notifications, and automated commission.',
    },
    {
      icon: Shield,
      title: 'Audit Trail',
      description: 'Complete security logging, drawer reconciliation, and variance detection.',
    },
    {
      icon: Clock,
      title: 'Shift Management',
      description: 'Opening/closing registers, cash float tracking, and reconciliation reports.',
    },
    {
      icon: TrendingUp,
      title: 'Business Intelligence',
      description: 'Revenue trends, staff productivity, and payment method insights.',
    },
  ]

  const services = [
    {
      name: 'Men\'s Haircuts',
      image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop',
      description: 'Professional cuts for men of all ages'
    },
    {
      name: 'Kids & Baby',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop',
      description: 'Gentle care for children'
    },
    {
      name: 'Beard Grooming',
      image: 'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=400&h=300&fit=crop',
      description: 'Premium beard styling'
    },
  ]

  const testimonials = [
    {
      name: 'James Mensah',
      role: 'Salon Owner',
      content: 'Salloon transformed how we manage our walk-in business. The ticket system eliminated all our payment disputes.',
      rating: 5
    },
    {
      name: 'Sarah Osei',
      role: 'Manager',
      content: 'Real-time floor monitoring lets me manage staff efficiently. The audit trail gives me peace of mind.',
      rating: 5
    },
    {
      name: 'Kofi Asante',
      role: 'Cashier',
      content: 'Simple and intuitive. I can issue tickets and settle payments in seconds. No more manual calculations.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-dvh bg-white dark:bg-[#0a0a0a]">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh]">
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <img
              key={image}
              src={image}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 motion-reduce:transition-none ${index === activeHeroImage ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div className={`absolute inset-0 bg-gradient-to-b ${theme === 'dark'
            ? 'from-[#0a0a0a]/40 via-[#0a0a0a]/25 to-[#0a0a0a]/50'
            : 'from-white/50 via-white/65 to-white/75'}`} />
        </div>
        <div className="grid-dots pointer-events-none absolute inset-0 opacity-20" />
        
        <nav className="relative z-10 flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gold-gradient">
              <Scissors className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gray-900 dark:text-white">Salloon</h1>
              <p className="text-[10px] text-gray-700 dark:text-white/70">Salon Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button onClick={() => navigate('/login')} className="text-xs">
              Sign In
            </Button>
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[calc(90vh-88px)] max-w-6xl items-center px-6 py-16 lg:py-24">
          <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="order-1 max-w-3xl animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#d4af37]/20 px-3 py-1.5 text-xs font-medium text-[#d4af37] backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d4af37] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d4af37]" />
                </span>
                Single-Salon Operations
              </div>
              
              <h2 className="mt-6 font-display text-4xl font-bold leading-tight lg:text-5xl text-gray-900 dark:text-white">
                <span className="gradient-text">Digital Floor</span>
                <br />
                Traditional Care
              </h2>
              
              <p className="mt-4 max-w-xl text-sm text-gray-700 dark:text-white/80">
                Transform your walk-in salon with ticket-gated operations, real-time floor monitoring, 
                automated payroll, and complete audit trails.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={() => navigate('/login')} className="text-sm">
                  Get Started
                  <ArrowRight size={16} />
                </Button>
                <Button tone="ghost" className="text-sm text-gray-900 hover:bg-black/5 dark:text-white dark:hover:bg-white/10">
                  View Demo
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-6 text-xs text-gray-700 dark:text-white/70">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#4ade80]" />
                  No branches
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#4ade80]" />
                  Offline-first
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#4ade80]" />
                  Secure audit
                </div>
              </div>
            </div>

            <div className="order-2 hidden animate-scale-in lg:block">
              <div className="glass-card rounded-2xl p-5 shadow-xl backdrop-blur-xl sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600 dark:text-gray-400">Salon overview</p>
                    <h3 className="mt-1 font-display text-lg font-semibold text-gray-900 dark:text-white">Live Floor View</h3>
                  </div>
                  <span className="flex shrink-0 items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    3 Active
                  </span>
                </div>
                <div className="grid gap-2">
                  {[1, 2, 3, 4].map((chair) => (
                    <div
                      key={chair}
                      className={`flex items-center gap-3 rounded-xl border border-gray-200 bg-white/70 p-3 dark:border-gray-700 dark:bg-gray-900/70 ${chair <= 3 ? '' : 'opacity-60'}`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d4af37]/15">
                        <Scissors className="text-[#b8960c] dark:text-[#d4af37]" size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Chair {chair}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {chair <= 3 ? 'In service · 12 min' : 'Available'}
                        </p>
                      </div>
                      <span className={`h-2.5 w-2.5 rounded-full ${chair <= 3 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2" role="group" aria-label="Hero images">
          {heroImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveHeroImage(index)}
              aria-label={`Show hero image ${index + 1}`}
              aria-current={index === activeHeroImage ? 'true' : undefined}
              className={`h-2.5 rounded-full transition-all ${index === activeHeroImage ? 'w-7 bg-[#d4af37]' : 'w-2.5 bg-gray-500/50 hover:bg-gray-600 dark:bg-white/50 dark:hover:bg-white/80'}`}
            />
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section className="relative py-16 bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center animate-fade-in">
            <h3 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
              Our Services
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-white/70">
              Professional grooming for everyone
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {services.map((service, index) => (
              <div key={index} className="glass-card rounded-xl overflow-hidden transition-all duration-300 hover:border-[#d4af37]/50 group cursor-pointer" onClick={() => navigate('/login')}>
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-4">
                  <h4 className="font-display text-sm font-semibold text-white">{service.name}</h4>
                  <p className="mt-1 text-xs text-white/60">{service.description}</p>
                  <button className="mt-3 text-xs text-[#d4af37] hover:text-[#f4d03f] transition-colors">
                    View Styles →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center animate-fade-in">
            <h3 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
              Everything You Need
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Built for single-location salons with walk-in operations
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card rounded-xl p-5 transition-all duration-300 hover:border-[#d4af37]/50"
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                    hoveredFeature === index ? 'gold-gradient scale-110' : 'bg-[#d4af37]/10'
                  }`}
                >
                  <feature.icon
                    className={`transition-colors duration-300 ${
                      hoveredFeature === index ? 'text-white' : 'text-[#d4af37]'
                    }`}
                    size={20}
                  />
                </div>
                <h4 className="font-display text-sm font-semibold text-gray-900 dark:text-white">{feature.title}</h4>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center animate-fade-in">
            <h3 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
              What Our Users Say
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Trusted by salon professionals across the industry
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="glass-card rounded-xl p-6 transition-all duration-300 hover:border-[#d4af37]/50">
                <div className="mb-4 flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#d4af37] text-[#d4af37]" />
                  ))}
                </div>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">"{testimonial.content}"</p>
                <div>
                  <p className="font-display text-sm font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="glass-card rounded-xl p-8">
            <div className="mb-8 text-center">
              <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Get In Touch</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Have questions? We're here to help
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/10">
                  <Mail className="text-[#d4af37]" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">support@salloon.local</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/10">
                  <Phone className="text-[#d4af37]" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">+233 20 123 4567</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/10">
                  <MapPin className="text-[#d4af37]" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Location</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Accra, Ghana</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="gold-gradient rounded-xl p-8 text-white animate-fade-in">
            <h3 className="font-display text-2xl font-bold">
              Ready to Transform Your Salon?
            </h3>
            <p className="mt-2 text-sm text-white/80">
              Join hundreds of salons already using Salloon for seamless operations
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="mt-4 bg-white text-[#0a0a0a] hover:bg-white/90 text-sm"
            >
              Start Your Free Trial
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12 dark:border-gray-800 dark:bg-[#0a0a0a]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 sm:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gold-gradient">
                  <Scissors className="text-white" size={20} />
                </div>
                <div>
                  <h4 className="font-display text-lg font-bold text-gray-900 dark:text-white">Salloon</h4>
                  <p className="text-[10px] text-gray-600 dark:text-white/60">Salon Management System</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-600 dark:text-white/60">
                Professional salon management for single-location walk-in operations.
              </p>
            </div>
            <div>
              <h5 className="font-display text-sm font-semibold text-gray-900 dark:text-white mb-4">Product</h5>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs text-gray-600 dark:text-white/60 hover:text-[#d4af37] transition-colors">Features</a></li>
                <li><a href="#" className="text-xs text-gray-600 dark:text-white/60 hover:text-[#d4af37] transition-colors">Pricing</a></li>
                <li><a href="#" className="text-xs text-gray-600 dark:text-white/60 hover:text-[#d4af37] transition-colors">Security</a></li>
                <li><a href="#" className="text-xs text-gray-600 dark:text-white/60 hover:text-[#d4af37] transition-colors">Updates</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-display text-sm font-semibold text-gray-900 dark:text-white mb-4">Company</h5>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs text-gray-600 dark:text-white/60 hover:text-[#d4af37] transition-colors">About</a></li>
                <li><a href="#" className="text-xs text-gray-600 dark:text-white/60 hover:text-[#d4af37] transition-colors">Blog</a></li>
                <li><a href="#" className="text-xs text-gray-600 dark:text-white/60 hover:text-[#d4af37] transition-colors">Careers</a></li>
                <li><a href="#" className="text-xs text-gray-600 dark:text-white/60 hover:text-[#d4af37] transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-display text-sm font-semibold text-gray-900 dark:text-white mb-4">Legal</h5>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs text-gray-600 dark:text-white/60 hover:text-[#d4af37] transition-colors">Privacy</a></li>
                <li><a href="#" className="text-xs text-gray-600 dark:text-white/60 hover:text-[#d4af37] transition-colors">Terms</a></li>
                <li><a href="#" className="text-xs text-gray-600 dark:text-white/60 hover:text-[#d4af37] transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8 text-center dark:border-gray-800">
            <p className="text-xs text-gray-600 dark:text-white/60"> 2024 Salloon. Built for single-location salons. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
