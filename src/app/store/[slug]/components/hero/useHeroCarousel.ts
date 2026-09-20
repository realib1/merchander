'use client';

import { useState, useEffect, useCallback } from 'react';
import { StorefrontHeroSlide } from '@/types/storefront';

export type CarouselDirection = 'next' | 'prev';

export function useHeroCarousel(slides: StorefrontHeroSlide[]) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [previousSlideIndex, setPreviousSlideIndex] = useState(0);
  const [direction, setDirection] = useState<CarouselDirection>('next');
  const [isPaused, setIsPaused] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  const safeIndex = currentSlideIndex >= slides.length ? 0 : currentSlideIndex;
  const currentSlide = slides[safeIndex] || slides[0];

  const goToSlide = useCallback((targetIndex: number) => {
    if (slides.length <= 1) return;
    setPreviousSlideIndex(currentSlideIndex);
    setDirection(targetIndex >= currentSlideIndex ? 'next' : 'prev');
    setCurrentSlideIndex(targetIndex);
    setTimerKey((k) => k + 1);
  }, [currentSlideIndex, slides.length]);

  const handlePrev = useCallback(() => {
    if (slides.length <= 1) return;
    setPreviousSlideIndex(currentSlideIndex);
    setDirection('prev');
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimerKey((k) => k + 1);
  }, [currentSlideIndex, slides.length]);

  const handleNext = useCallback(() => {
    if (slides.length <= 1) return;
    setPreviousSlideIndex(currentSlideIndex);
    setDirection('next');
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    setTimerKey((k) => k + 1);
  }, [currentSlideIndex, slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setPreviousSlideIndex(currentSlideIndex);
      setDirection('next');
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [slides.length, isPaused, timerKey, currentSlideIndex]);

  return {
    currentSlideIndex: safeIndex,
    previousSlideIndex,
    currentSlide,
    direction,
    isPaused,
    setIsPaused,
    handlePrev,
    handleNext,
    goToSlide,
    setCurrentSlideIndex: goToSlide,
  };
}
