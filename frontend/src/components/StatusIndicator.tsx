import { useState, useEffect } from 'react'
import { CheckCircle, Warning, XCircle, SpinnerGap } from '@phosphor-icons/react'

type SystemStatus = 'operational' | 'degraded' | 'outage' | 'checking';

interface StatusIndicatorProps {
  showLabel?: boolean;
}

export default function StatusIndicator({ showLabel = true }: StatusIndicatorProps) {
  const [status, setStatus] = useState<SystemStatus>('checking')

  useEffect(() => {
    // Check system status by pinging the API
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
        
        if (response.ok) {
          setStatus('operational')
        } else {
          setStatus('degraded')
        }
      } catch (error) {
        // API is unreachable
        setStatus('degraded')
      }
    }

    checkStatus()
    // Check every 60 seconds
    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const statusConfig = {
    operational: {
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-400',
      label: 'All Systems Operational'
    },
    degraded: {
      icon: Warning,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400',
      label: 'Partial Outage'
    },
    outage: {
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-400',
      label: 'System Outage'
    },
    checking: {
      icon: SpinnerGap,
      color: 'text-text-secondary',
      bgColor: 'bg-gray-400',
      label: 'Checking Status...'
    }
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2" data-testid="status-indicator">
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${config.bgColor}`} />
        {status === 'operational' && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${config.bgColor} animate-ping opacity-75`} />
        )}
        {status === 'checking' && (
          <SpinnerGap className={`w-3 h-3 ${config.color} animate-spin absolute -top-0.5 -left-0.5`} />
        )}
      </div>
      {showLabel && (
        <span className={`text-xs ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  )
}
