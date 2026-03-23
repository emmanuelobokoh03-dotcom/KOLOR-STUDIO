import { useState, useEffect } from 'react'

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CountdownTimer({ endDate }: { endDate: Date }) {
  const [time, setTime] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calc = () => {
      const d = endDate.getTime() - Date.now()
      if (d <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      return {
        days: Math.floor(d / 86400000),
        hours: Math.floor((d % 86400000) / 3600000),
        minutes: Math.floor((d % 3600000) / 60000),
        seconds: Math.floor((d % 60000) / 1000),
      }
    }
    setTime(calc())
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  }, [endDate])

  return (
    <div className="flex gap-3 justify-center items-center flex-wrap" data-testid="countdown-timer">
      <TimeUnit value={time.days} label="Days" />
      <span className="text-2xl font-bold text-brand-400 hidden sm:block">:</span>
      <TimeUnit value={time.hours} label="Hours" />
      <span className="text-2xl font-bold text-brand-400 hidden sm:block">:</span>
      <TimeUnit value={time.minutes} label="Min" />
      <span className="text-2xl font-bold text-brand-400 hidden sm:block">:</span>
      <TimeUnit value={time.seconds} label="Sec" />
    </div>
  )
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass-card px-4 sm:px-6 py-3 sm:py-4 min-w-[70px] sm:min-w-[90px] text-center">
      <div className="text-2xl sm:text-3xl font-heading font-bold text-brand-600">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[10px] sm:text-xs text-text-tertiary uppercase tracking-wider mt-1">{label}</div>
    </div>
  )
}
