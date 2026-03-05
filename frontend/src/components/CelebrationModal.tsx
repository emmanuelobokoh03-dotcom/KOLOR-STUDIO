import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import Confetti from 'react-confetti'

export interface Achievement {
  emoji: string
  title: string
  message: string
}

export const achievements: Record<string, Achievement> = {
  firstProject: {
    emoji: '\u{1F3A8}',
    title: 'First Project Created!',
    message: "You're officially managing your creative business like a pro!",
  },
  firstQuote: {
    emoji: '\u{1F4B0}',
    title: 'First Quote Sent!',
    message: 'Great work on sending your first professional quote.',
  },
  quoteAccepted: {
    emoji: '\u{1F389}',
    title: 'Quote Accepted!',
    message: 'Time to create a contract and get to work!',
  },
  portfolioPublished: {
    emoji: '\u{1F5BC}\u{FE0F}',
    title: 'Portfolio Live!',
    message: 'Your work is now showcased to the world. Share that link!',
  },
  firstBooking: {
    emoji: '\u{1F4C5}',
    title: 'First Booking!',
    message: 'Your calendar is filling up. This is just the beginning!',
  },
  firstContract: {
    emoji: '\u{1F4DD}',
    title: 'First Contract Signed!',
    message: "You're protecting yourself and your clients. Professional move!",
  },
}

interface CelebrationModalProps {
  achievement: Achievement | null
  show: boolean
  onClose: () => void
}

export function CelebrationModal({ achievement, show, onClose }: CelebrationModalProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (show) {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
  }, [show])

  if (!show || !achievement) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-6"
          data-testid="celebration-modal"
        >
          <Confetti
            width={dimensions.width}
            height={dimensions.height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
          />

          <div className="absolute inset-0 bg-black/70" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-brand-primary-dark/50 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl shadow-brand-primary-dark/30"
            data-testid="celebration-content"
          >
            <div className="text-6xl md:text-7xl mb-4 animate-bounce select-none">{achievement.emoji}</div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h2 className="text-2xl md:text-3xl font-bold text-[#FAFAFA]">{achievement.title}</h2>
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-brand-primary-light text-base md:text-lg mb-6">{achievement.message}</p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-brand-primary hover:bg-brand-primary text-white rounded-xl font-semibold transition-all"
              data-testid="celebration-close"
            >
              Awesome!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Helper: check and trigger celebration for a milestone
export function checkCelebration(
  key: string,
  achievementKey: keyof typeof achievements
): Achievement | null {
  const storageKey = `celebrated_${key}`
  if (localStorage.getItem(storageKey) === 'true') return null
  localStorage.setItem(storageKey, 'true')
  return achievements[achievementKey]
}
