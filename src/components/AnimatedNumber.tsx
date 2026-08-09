import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedNumber({
  value,
  duration = 0.8,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValue = useRef(value)
  const spring = useSpring(value, { stiffness: 80, damping: 20, duration: duration * 1000 })

  useEffect(() => {
    const unsubscribe = spring.on('change', (v) => {
      setDisplayValue(v)
    })

    // 数值变化时触发弹簧动画
    if (value !== prevValue.current) {
      spring.set(value)
      prevValue.current = value
    } else {
      spring.set(value)
    }

    return unsubscribe
  }, [value, spring])

  return (
    <motion.span
      className={className}
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </motion.span>
  )
}
