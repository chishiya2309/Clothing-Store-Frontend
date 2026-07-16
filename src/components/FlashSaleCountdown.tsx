import { useEffect, useState } from 'react'

interface FlashSaleCountdownProps {
  serverTime: string
  startAt: string
  endAt: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const EMPTY_TIME: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 }

function toTimeLeft(milliseconds: number): TimeLeft {
  if (milliseconds <= 0) return EMPTY_TIME
  const totalSeconds = Math.floor(milliseconds / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  }
}

export default function FlashSaleCountdown({ serverTime, startAt, endAt }: FlashSaleCountdownProps) {
  const [serverOffset] = useState(() => new Date(serverTime).getTime() - Date.now())
  const [now, setNow] = useState(() => Date.now() + serverOffset)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now() + serverOffset), 1000)
    return () => window.clearInterval(timer)
  }, [serverOffset])

  const startTime = new Date(startAt).getTime()
  const endTime = new Date(endAt).getTime()
  const isUpcoming = now < startTime
  const isEnded = now >= endTime
  const timeLeft = toTimeLeft((isUpcoming ? startTime : endTime) - now)

  if (isEnded) {
    return (
      <div className="flex flex-col items-start gap-2 md:items-end">
        <span className="w-fit rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide">Đã kết thúc</span>
        <span className="text-sm font-semibold text-white/85">Chương trình đã kết thúc</span>
      </div>
    )
  }

  const units = [
    ...(timeLeft.days > 0 ? [{ label: 'Ngày', value: timeLeft.days }] : []),
    { label: 'Giờ', value: timeLeft.hours },
    { label: 'Phút', value: timeLeft.minutes },
    { label: 'Giây', value: timeLeft.seconds }
  ]

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <span className="w-fit rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide">
        {isUpcoming ? 'Sắp diễn ra' : 'Đang diễn ra'}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-white/75">
        {isUpcoming ? 'Bắt đầu sau' : 'Kết thúc sau'}
      </span>
      <div className="flex gap-2" aria-label={isUpcoming ? 'Thời gian đến khi bắt đầu' : 'Thời gian đến khi kết thúc'}>
        {units.map((unit) => (
          <div key={unit.label} className="min-w-12 rounded-lg border border-white/20 bg-black/15 px-2 py-1.5 text-center backdrop-blur-sm">
            <strong className="block text-lg leading-5">{String(unit.value).padStart(2, '0')}</strong>
            <span className="text-[9px] uppercase tracking-wide text-white/70">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
