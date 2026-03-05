import { driver, DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useEffect, useState, useCallback } from 'react'

const tourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Welcome to KOLOR STUDIO!',
      description: "Let's take a quick 2-minute tour to show you around. You can skip anytime.",
      side: 'over',
      align: 'center',
    },
  },
  {
    element: '[data-tour="add-lead"]',
    popover: {
      title: 'Create Your First Project',
      description: 'Click here to start a new project with a client. This is where everything begins!',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="kanban-board"]',
    popover: {
      title: 'Your Project Pipeline',
      description: 'Projects move through stages: New, Contacted, Quoted, Booked. Drag cards to update status.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="view-portfolio"]',
    popover: {
      title: 'Portfolio Showcase',
      description: 'Upload your best work to create a public portfolio you can share with potential clients.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="view-calendar"]',
    popover: {
      title: 'Manage Your Schedule',
      description: 'Track all your bookings, shoots, and deadlines in one place.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="help-button"]',
    popover: {
      title: 'Need Help Anytime?',
      description: 'Click this button to access quick-start guides, FAQs, and contact support.',
      side: 'left',
      align: 'end',
    },
  },
  {
    popover: {
      title: "You're All Set!",
      description: "Ready to manage your creative business like a pro. Let's create your first project!",
      side: 'over',
      align: 'center',
    },
  },
]

export function useOnboardingTour() {
  const [tourComplete, setTourComplete] = useState(
    () => localStorage.getItem('onboarding_tour_complete') === 'true'
  )

  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      showButtons: ['next', 'previous', 'close'],
      steps: tourSteps,
      onDestroyed: () => {
        localStorage.setItem('onboarding_tour_complete', 'true')
        setTourComplete(true)
      },
      popoverClass: 'kolor-tour-popover',
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Get Started!',
      overlayColor: 'rgba(0,0,0,0.75)',
    })

    driverObj.drive()
  }, [])

  return { startTour, tourComplete }
}
