import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight } from '@phosphor-icons/react'

interface CarouselSlide {
  image: string
  title: string
  subtitle: string
}

interface CarouselProps {
  slides: CarouselSlide[]
  autoPlay?: boolean
  interval?: number
  className?: string
}

export const Carousel = ({ 
  slides, 
  autoPlay = true, 
  interval = 5000,
  className = '' 
}: CarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, interval, slides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  if (!slides.length) return null

  return (
    <div className={`relative overflow-hidden rounded-lg bg-gray-100 ${className}`}>
      {/* Slides Container */}
      <div 
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={index} className="w-full flex-shrink-0 relative">
            <div className="aspect-[16/9] sm:aspect-[21/9] relative">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/30" />
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center justify-start">
                <div className="container mx-auto px-4">
                  <div className="max-w-2xl text-white">
                    <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">
                      {slide.title}
                    </h2>
                    <p className="text-sm sm:text-lg opacity-90">
                      {slide.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white border-0 h-10 w-10 rounded-full"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white border-0 h-10 w-10 rounded-full"
            onClick={goToNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentSlide
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}