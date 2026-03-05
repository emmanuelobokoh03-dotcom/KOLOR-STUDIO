import { useState, useEffect } from 'react'
import { X, Megaphone, Sparkles, PartyPopper } from 'lucide-react'

interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'celebration';
  link?: string;
  linkText?: string;
  dismissible?: boolean;
}

// In production, this would come from an API
const CURRENT_ANNOUNCEMENT: Announcement | null = {
  id: 'launch-2026',
  message: "Welcome to KOLOR STUDIO! We're excited to have you here.",
  type: 'celebration',
  dismissible: true,
}

export default function AnnouncementBanner() {
  const [visible, setVisible] = useState(false)
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    // Check if this announcement was already dismissed
    if (CURRENT_ANNOUNCEMENT) {
      const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]')
      if (!dismissedAnnouncements.includes(CURRENT_ANNOUNCEMENT.id)) {
        setAnnouncement(CURRENT_ANNOUNCEMENT)
        setVisible(true)
      }
    }
  }, [])

  const handleDismiss = () => {
    if (announcement) {
      const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]')
      dismissedAnnouncements.push(announcement.id)
      localStorage.setItem('dismissed_announcements', JSON.stringify(dismissedAnnouncements))
    }
    setVisible(false)
  }

  if (!visible || !announcement) return null

  const typeStyles = {
    info: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-500 text-black',
    celebration: 'bg-gradient-to-r from-brand-primary to-brand-primary text-white',
  }

  const typeIcons = {
    info: Megaphone,
    success: Sparkles,
    warning: Megaphone,
    celebration: PartyPopper,
  }

  const Icon = typeIcons[announcement.type]

  return (
    <div className={`${typeStyles[announcement.type]} px-4 py-2 flex items-center justify-center gap-3`} data-testid="announcement-banner">
      <Icon className="w-4 h-4 flex-shrink-0" />
      <p className="text-sm font-medium">
        {announcement.message}
        {announcement.link && (
          <a 
            href={announcement.link}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 underline hover:no-underline"
          >
            {announcement.linkText || 'Learn more'}
          </a>
        )}
      </p>
      {announcement.dismissible && (
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/20 rounded transition ml-2"
          data-testid="dismiss-announcement"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
