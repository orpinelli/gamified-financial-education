"use client";

import { cn } from "@/lib/utils";

const DICE_FACES: Record<number, number[][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

interface DiceProps {
  value: number;
  isRolling?: boolean;
  size?: "sm" | "md";
}

function Dice({ value, isRolling, size = "md" }: DiceProps) {
  const dots = DICE_FACES[value] ?? DICE_FACES[1];
  const sizeClass = size === "sm" ? "h-12 w-12" : "h-16 w-16";
  const dotSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";

  return (
    <div
      className={cn(
        sizeClass,
        "relative rounded-lg border-2 border-game-gold/50 bg-card shadow-lg",
        isRolling && "animate-bounce"
      )}
    >
      <div className="grid h-full w-full grid-cols-3 grid-rows-3 p-1.5">
        {Array.from({ length: 9 }).map((_, idx) => {
          const row = Math.floor(idx / 3);
          const col = idx % 3;
          const hasDot = dots.some(([r, c]) => r === row && c === col);

          return (
            <div key={idx} className="flex items-center justify-center">
              {hasDot && (
                <span
                  className={cn(dotSize, "rounded-full bg-foreground")}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DiceRollerProps {
  values: number[];
  isRolling: boolean;
}

export function DiceRoller({ values, isRolling }: DiceRollerProps) {
  if (values.length === 0 && !isRolling) return null;

  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        {isRolling ? (
          <>
            <Dice value={Math.ceil(Math.random() * 6)} isRolling />
            {values.length !== 1 && <Dice value={Math.ceil(Math.random() * 6)} isRolling />}
          </>
        ) : (
          values.map((v, i) => <Dice key={i} value={v} />)
        )}
      </div>
      {!isRolling && values.length > 0 && (
        <p className="text-lg font-bold tabular-nums text-game-gold">
          Total: {total}
        </p>
      )}
    </div>
  );
}
