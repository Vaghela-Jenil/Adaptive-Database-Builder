"use client";

import type { CardComponentProps } from "onborda";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { useOnborda } from "onborda";

export function DashboardTourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: CardComponentProps) {
  const { currentTheme } = useTheme();
  const { closeOnborda } = useOnborda();
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div
      className="relative w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-[28px] border p-5 shadow-2xl"
      style={{
        background: `linear-gradient(135deg, ${currentTheme.surface}EE 0%, ${currentTheme.background}D9 100%)`,
        borderColor: currentTheme.border,
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        color: currentTheme.text,
        boxShadow: "0 24px 80px rgba(15, 23, 42, 0.28)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at top right, ${currentTheme.primary}24 0%, transparent 45%)`,
        }}
      />

      <div className="relative space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{
                backgroundColor: `${currentTheme.primary}18`,
                color: currentTheme.primary,
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Product Tour
            </div>

            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: currentTheme.textSecondary }}>
              <span>{String(currentStep + 1).padStart(2, "0")}</span>
              <span>/</span>
              <span>{String(totalSteps).padStart(2, "0")}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={closeOnborda}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
            style={{
              borderColor: currentTheme.border,
              backgroundColor: `${currentTheme.background}99`,
              color: currentTheme.textSecondary,
            }}
            aria-label="Close onboarding tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${currentTheme.primary}16`,
                color: currentTheme.primary,
              }}
            >
              {step.icon ?? <Sparkles className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold leading-tight">{step.title}</h2>
              <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                Guided overview of a core workspace feature.
              </p>
            </div>
          </div>

          <div className="text-sm leading-6" style={{ color: currentTheme.textSecondary }}>
            {step.content}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: currentTheme.border }}>
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="rounded-xl"
            style={{
              borderColor: currentTheme.border,
              color: currentTheme.text,
              backgroundColor: `${currentTheme.background}80`,
            }}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeOnborda}
              className="rounded-xl"
              style={{
                borderColor: currentTheme.border,
                color: currentTheme.textSecondary,
                backgroundColor: "transparent",
              }}
            >
              Skip tour
            </Button>
            <Button
              type="button"
              onClick={isLastStep ? closeOnborda : nextStep}
              className="rounded-xl text-white"
              style={{ backgroundColor: currentTheme.primary }}
            >
              {isLastStep ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute" style={{ color: currentTheme.surface }}>
        {arrow}
      </div>
    </div>
  );
}
