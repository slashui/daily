import { useState, useEffect } from 'react'

function DateTimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatBeijingTime = (date: Date) => {
    // 创建北京时间（UTC+8）
    const beijingTime = new Date(date.getTime() + (8 * 60 * 60 * 1000))

    const dateStr = beijingTime.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC'
    })

    const timeStr = beijingTime.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    })

    return { dateStr, timeStr }
  }

  const { dateStr, timeStr } = formatBeijingTime(currentTime)

  return (
    <div className="flex flex-col items-end text-sm">
      <div className="text-gray-600 font-medium">
        {dateStr}
      </div>
      <div className="text-gray-500">
        北京时间 {timeStr}
      </div>
    </div>
  )
}

export default DateTimeDisplay