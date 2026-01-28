"use client";

import { useState } from "react";
import { ui } from "@/lib/uiStyles";

interface OnboardingModalProps {
  onComplete: () => void;
  onDismiss: () => void;
}

const steps = [
  {
    title: "Welcome to Sowplan!",
    description:
      "Let's get your garden set up in just a few steps. We'll help you plan your planting schedule based on your location and create a visual layout of your garden beds.",
    icon: (
      <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: "Set Your Location",
    description:
      "First, go to Location Data and enter your ZIP code. This will automatically determine your USDA hardiness zone and local frost dates, which are essential for calculating when to plant.",
    icon: (
      <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Add Your Plants",
    description:
      "Head to the Plants page to add the vegetables, herbs, and flowers you want to grow. You can search our database or add custom plants with your own specifications.",
    icon: (
      <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    title: "Create Garden Beds",
    description:
      "Use the Beds page to create your garden beds with their actual dimensions. Then drag and drop plants onto the bed layout to see exactly how many will fit.",
    icon: (
      <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    title: "You're All Set!",
    description:
      "Check the Schedule page to see your personalized planting calendar, use Plant Now to see what's ready to plant today, and keep a garden journal to track your progress. Happy gardening!",
    icon: (
      <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function OnboardingModal({ onComplete, onDismiss }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className={`${ui.card} relative w-full max-w-md p-6 sm:p-8`}>
        {/* Skip button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label="Skip onboarding"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">{step.icon}</div>
          <h2 className="text-xl font-semibold text-slate-900">{step.title}</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? "bg-emerald-600" : "bg-slate-300"
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {!isFirstStep && (
            <button
              onClick={handlePrevious}
              className={`flex-1 ${ui.btnSecondary}`}
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-1 ${ui.btnPrimary}`}
          >
            {isLastStep ? "Get Started" : "Next"}
          </button>
        </div>

        {/* Skip link */}
        {!isLastStep && (
          <button
            onClick={onDismiss}
            className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700"
          >
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}
