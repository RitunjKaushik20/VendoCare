import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  FileText,
  FileUp,
  CreditCard,
  Shield,
  ArrowRight,
  CheckCircle,
  Building2,
  HardHat,
  Hotel,
  Briefcase,
  Home,
  Sparkles,
} from 'lucide-react'
import { AnimatedButton } from '../../components/ui/AnimatedButton'
import { Logo } from '../../components/common/Logo'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
}

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const industries = [
  { icon: Building2, label: 'Real Estate' },
  { icon: HardHat, label: 'Construction' },
  { icon: Hotel, label: 'Hotels' },
  { icon: Briefcase, label: 'Offices' },
  { icon: Home, label: 'Societies' },
]

const features = [
  {
    icon: Users,
    title: 'Vendor Management',
    description: 'Centralize all your vendor information, ratings, and history in one secure platform.',
  },
  {
    icon: FileText,
    title: 'Contract Tracking',
    description: 'Never miss a contract renewal. Track all agreements with automated expiry alerts.',
  },
  {
    icon: FileUp,
    title: 'Invoice Uploads',
    description: 'Vendors can easily upload invoices with automatic data extraction and validation.',
  },
  {
    icon: CreditCard,
    title: 'Payment Tracking',
    description: 'Streamline payment workflows with approval chains and transaction history.',
  },
  {
    icon: Shield,
    title: 'Secure Cloud System',
    description: 'Enterprise-grade security with role-based access control and audit trails.',
  },
]

const pricingPlans = [
  {
    name: 'Free Trial',
    price: '$0',
    period: '/1 day',
    description: 'Try all features free for 1 day',
    features: [
      'Unlimited vendors',
      'Unlimited contracts',
      'All invoicing features',
      'Payment tracking',
      'Reports & analytics',
      'Email & chat support',
      'No credit card required',
    ],
    popular: false,
  },
  {
    name: 'Weekly',
    price: '$15',
    period: '/week',
    description: 'Perfect for short-term projects',
    features: ['Unlimited vendors', 'Up to 10 contracts', 'Basic invoicing', 'Email support'],
    popular: false,
  },
  {
    name: 'Monthly',
    price: '$50',
    period: '/month',
    description: 'Best for growing businesses',
    features: ['Unlimited vendors', 'Unlimited contracts', 'Advanced invoicing', 'Priority support', 'Payment tracking', 'Reports & analytics'],
    popular: true,
  },
  {
    name: 'Annually',
    price: '$150',
    period: '/year',
    description: 'Maximum savings for enterprises',
    features: ['Everything in Monthly', 'Custom integrations', 'Dedicated account manager', '24/7 phone support', 'API access', 'White-label options'],
    popular: false,
  },
]

export const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark overflow-x-hidden">
      {}
      <div className="fixed top-4 left-6 z-50">
        <Logo size="lg" />
      </div>
      
      {}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-dark via-darkBg to-dark" />
          <motion.div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-rose/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-mauve/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </div>

        {}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {}
          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {industries.map((industry, index) => (
              <motion.div
                key={industry.label}
                className="flex items-center gap-2 px-4 py-2 bg-darkBg/50 backdrop-blur-sm border border-softPurple/20 rounded-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05, borderColor: 'rgba(192, 108, 132, 0.5)' }}
              >
                <industry.icon className="w-4 h-4 text-purple" />
                <span className="text-sm text-light/80">{industry.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {}
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <span className="text-light">All Your Vendors.</span>
            <br />
            <span className="gradient-text">One Secure Platform.</span>
          </motion.h1>

          {}
          <motion.p
            className="text-xl text-light/60 max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Streamline vendor management, contract tracking, invoice processing, and payments 
            for your real estate, construction, and hospitality business.
          </motion.p>

          {}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <AnimatedButton
              size="lg"
              onClick={() => navigate('/login')}
              icon={ArrowRight}
            >
              Get Started
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              size="lg"
              onClick={() => navigate('/register')}
            >
              Sign Up Free
            </AnimatedButton>
          </motion.div>

          {}
          <motion.div
            className="mt-16 flex flex-wrap justify-center gap-6 text-light/40 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Free 1 day trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>
        </div>

        {}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-light/30 rounded-full flex justify-center pt-2">
            <motion.div
              className="w-1.5 h-1.5 bg-light/60 rounded-full"
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-4xl font-bold text-light mb-4">
              Everything You Need to <span className="gradient-text">Manage Vendors</span>
            </h2>
            <p className="text-light/60 text-lg max-w-2xl mx-auto">
              A complete suite of tools designed for property managers and finance teams
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="glass-card p-6 group hover:border-purple/40 transition-all duration-300"
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-rose/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-rose/30 transition-all">
                  <feature.icon className="w-6 h-6 text-rose" />
                </div>
                <h3 className="text-xl font-semibold text-light mb-2">{feature.title}</h3>
                <p className="text-light/60 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {}
      <section className="py-24 px-6 relative overflow-hidden">
        {}
        <div className="absolute inset-0 bg-gradient-to-b from-dark via-darkBg to-dark" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-light mb-4">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-light/60 text-lg max-w-2xl mx-auto">
              Choose the plan that fits your business needs. No hidden fees, cancel anytime.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-4 gap-4 lg:gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                className={`relative glass-card p-6 flex flex-col min-w-[220px] max-w-xs mx-auto
                  ${plan.popular ? 'border-purple/50 shadow-lg shadow-purple/20 scale-105 z-10' : 'border-softPurple/20'}`}
                variants={fadeInUp}
                whileHover={{ y: -12, scale: plan.popular ? 1.08 : 1.05 }}
                transition={{ duration: 0.3 }}
              >
                {}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple to-softPurple rounded-full text-white text-sm font-medium shadow-lg">
                      <Sparkles className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}

                {}
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-xl font-semibold text-light mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-light">{plan.price}</span>
                    <span className="text-light/60">{plan.period}</span>
                  </div>
                  <p className="text-light/50 text-sm mt-2">{plan.description}</p>
                </div>

                {}
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-purple" />
                      </div>
                      <span className="text-light/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {}
                <AnimatedButton
                  variant={plan.popular ? 'primary' : 'secondary'}
                  className="w-full justify-center"
                  onClick={() => navigate('/register')}
                  icon={ArrowRight}
                >
                  Get Started
                </AnimatedButton>
              </motion.div>
            ))}
          </motion.div>

          {}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-light/40 text-sm flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              14-day money-back guarantee • No credit card required for trial
            </p>
          </motion.div>
        </div>
      </section>

      {}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple/10 via-transparent to-primary/10" />
        <motion.div
          className="max-w-4xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-light mb-6">
            Ready to Transform Your <span className="gradient-text">Vendor Management?</span>
          </h2>
          <p className="text-xl text-light/60 mb-10 max-w-2xl mx-auto">
            Join thousands of property managers who have streamlined their vendor operations with VendoCare.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AnimatedButton
              size="lg"
              onClick={() => navigate('/register')}
              icon={ArrowRight}
            >
              Start Free Trial
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              size="lg"
              onClick={() => navigate('/login')}
            >
              Sign In
            </AnimatedButton>
          </div>
        </motion.div>
      </section>

      {}
      <footer className="py-8 px-6 border-t border-softPurple/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple to-softPurple rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">V</span>
            </div>
            <span className="text-light font-semibold">VendoCare</span>
          </div>
          <p className="text-light/40 text-sm">
            © 2024 VendoCare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
