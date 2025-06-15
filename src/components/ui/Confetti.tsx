
import React, { useEffect, useRef } from "react"

export const Confetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    let width = window.innerWidth
    let height = 180 // Restrict height to top
    canvas.width = width
    canvas.height = height

    const confettiCount = 60
    const confettiColors = ["#07c", "#38bdf8", "#818cf8", "#f472b6", "#facc15"]
    const confetti = Array.from({ length: confettiCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 6 + 6,
      d: Math.random() * confettiCount,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngle: 0
    }))

    let angle = 0
    let animationFrameId: number

    function draw() {
      ctx.clearRect(0, 0, width, height)
      angle += 0.02
      confetti.forEach((c, i) => {
        c.y += Math.cos(angle + c.d) + 1 + c.r / 6
        c.x += Math.sin(angle)
        c.tiltAngle += 0.1
        c.tilt = Math.sin(c.tiltAngle - (i % 2)) * 15

        if (c.y > height) {
          c.y = -10
          c.x = Math.random() * width
        }

        ctx.beginPath()
        ctx.lineWidth = c.r
        ctx.strokeStyle = c.color
        ctx.moveTo(c.x + c.tilt + c.r, c.y)
        ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r)
        ctx.stroke()
      })
      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        zIndex: 2000,
        top: 0,
        left: 0,
        width: "100vw",
        height: 180,
        pointerEvents: "none"
      }}
    />
  )
}
