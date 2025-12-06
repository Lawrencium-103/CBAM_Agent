"use client";

import Link from 'next/link';
import { ArrowRight, Shield, Zap, Globe, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          AIXplore
        </div>
        <div className="flex gap-6 text-sm font-medium text-gray-300">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#about" className="hover:text-white transition">About</a>
          <Link href="/chat" className="bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition">
            Try CBAg Now
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -top-20 -left-20 animate-pulse"></div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold mb-6 max-w-4xl leading-tight"
        >
          Master CBAM Complexity, <span className="text-blue-500">Instantly.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-400 max-w-2xl mb-10"
        >
          CBAg is your AI-powered guide to the Carbon Border Adjustment Mechanism. Get simple, clear, and verifiable answers on demand.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/chat" className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600">
            Try CBAg Now
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 rounded-full ring-4 ring-white/20 group-hover:ring-white/40 transition-all"></div>
          </Link>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-black/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Navigating CBAM is <span className="text-red-400">Overwhelming.</span></h2>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-blue-400" />}
              title="Complexity"
              desc="Constant regulatory updates and dense legal text make compliance a moving target."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-yellow-400" />}
              title="Time"
              desc="Researchers spend countless hours sifting through documents for a single piece of data."
            />
            <FeatureCard
              icon={<Lock className="w-8 h-8 text-red-400" />}
              title="Risk"
              desc="Misinterpretation leads to costly errors, trade friction, and non-compliance risks."
            />
          </div>
        </div>
      </section>

      {/* Value Prop Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Your Instant CBAM Expert.</h2>
            <p className="text-gray-400 text-lg mb-8">
              CBAg cuts through the noise. Built on a foundation of up-to-date regulations and expert analysis, our AI assistant provides immediate, sourced answers.
            </p>
            <ul className="space-y-4">
              <ListItem text="Instant Answers in natural language" />
              <ListItem text="Verifiable Sources for every claim" />
              <ListItem text="24/7 Accessibility" />
              <ListItem text="Deep Analysis of obligations" />
            </ul>
          </div>
          <div className="glass-card p-8 rounded-2xl border border-white/10 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 p-3 rounded-lg w-3/4">What are the reporting obligations for steel?</div>
                <div className="bg-blue-500/20 p-3 rounded-lg w-full border border-blue-500/30">
                  <p className="text-sm text-blue-100">Importers must report direct and indirect emissions embedded in steel products...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 bg-black">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-gray-400 text-sm">
            © 2025 AIXplore. All Rights Reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
            <a href="mailto:oladeji.lawrence@gmail.com" className="text-gray-400 hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass-card p-8 rounded-xl hover:bg-white/5 transition duration-300">
      <div className="mb-4 bg-white/5 w-14 h-14 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function ListItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-gray-300">
      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
      {text}
    </li>
  );
}
