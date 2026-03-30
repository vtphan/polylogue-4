"use client";

interface PhaseIndicatorProps {
  currentPhase: number;
}

export default function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      {[1, 2, 3, 4].map((phase) => {
        const isCurrent = phase === currentPhase;
        const isCompleted = phase < currentPhase;
        const isFuture = phase > currentPhase;

        return (
          <div
            key={phase}
            className={`
              flex items-center justify-center rounded-full font-semibold transition-all duration-300
              ${isCurrent
                ? "w-10 h-10 bg-indigo-500 text-white text-lg shadow-md"
                : isCompleted
                  ? "w-8 h-8 bg-indigo-100 text-indigo-600 text-sm"
                  : "w-8 h-8 bg-gray-100 text-gray-400 text-sm"
              }
            `}
          >
            {isCompleted ? "✓" : phase}
          </div>
        );
      })}
    </div>
  );
}
