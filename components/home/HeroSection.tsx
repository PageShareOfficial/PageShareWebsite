"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  const headline = "Stories That Matter";
  const subheadline = "Discover extraordinary writing from independent authors";

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Headline with letter stagger */}
          <motion.h1
            className="text-6xl md:text-8xl font-serif font-bold leading-tight"
            variants={containerVariants}
          >
            {headline.split(" ").map((word, wordIndex) => (
              <motion.span
                key={wordIndex}
                className="inline-block mr-4"
                variants={containerVariants}
              >
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={letterIndex}
                    className="inline-block"
                    variants={letterVariants}
                  >
                    {letter === " " ? "\u00A0" : letter}
                  </motion.span>
                ))}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            {subheadline}
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={itemVariants}
          >
            <Link
              href="/explore"
              className="px-8 py-4 border-2 border-white hover:bg-white hover:text-black transition-all duration-300 font-medium"
            >
              Start Reading
            </Link>
            <Link
              href="/write"
              className="px-8 py-4 border-2 border-white/20 hover:border-white/40 transition-all duration-300 font-medium"
            >
              Start Writing
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

