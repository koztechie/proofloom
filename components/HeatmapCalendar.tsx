"use client";

import { useMemo } from "react";

interface Proof {
  date: string; // Формат: YYYY-MM-DD
  score: number;
}

interface HeatmapCalendarProps {
  proofs: Proof[];
}

export default function HeatmapCalendar({ proofs }: HeatmapCalendarProps) {
  // Конвертуємо масив у карту для миттєвого пошуку O(1)
  const proofMap = useMemo(() => {
    const map = new Map<string, number>();
    proofs.forEach((p) => {
      map.set(p.date, p.score);
    });
    return map;
  }, [proofs]);

  // Генеруємо масив з останніх 364 днів (52 тижні)
  const days = useMemo(() => {
    const result = [];
    const today = new Date();

    for (let i = 363; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      result.push(dateStr);
    }
    return result;
  }, []);

  const getColorClass = (score: number | undefined) => {
    if (score === undefined) return "bg-zinc-800"; // порожня клітинка
    if (score <= 40)
      return "bg-emerald-950 text-emerald-400 border border-emerald-900/30";
    if (score <= 70) return "bg-emerald-700 text-emerald-100";
    return "bg-emerald-400 text-zinc-950 font-bold";
  };

  return (
    <div className="w-full overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-zinc-800">
      <div className="min-w-[720px] flex flex-col space-y-2">
        {/* Календарна сітка 52 стовпці x 7 рядків */}
        <div className="grid grid-flow-col grid-rows-7 gap-1 h-[100px] w-max">
          {days.map((dateStr) => {
            const score = proofMap.get(dateStr);
            const colorClass = getColorClass(score);
            const formattedDate = new Date(dateStr).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            );

            return (
              <div
                key={dateStr}
                className={`w-3 h-3 rounded-[2px] transition-all hover:scale-125 cursor-pointer relative group ${colorClass}`}
              >
                {/* Кастомний безбібліотечний Tooltip на чистому Tailwind */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-200 px-2 py-1.5 rounded shadow-xl whitespace-nowrap pointer-events-none">
                  <span className="font-bold">{formattedDate}</span>
                  {score !== undefined ? (
                    <span className="block text-emerald-400 font-semibold">
                      Score: {score}/100
                    </span>
                  ) : (
                    <span className="block text-zinc-500">No submission</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Легенда інтенсивності кольорів */}
        <div className="flex items-center justify-end space-x-2 text-[10px] text-zinc-500 pr-4 pr-12">
          <span>Less</span>
          <div className="w-2.5 h-2.5 bg-zinc-800 rounded-[1px]"></div>
          <div className="w-2.5 h-2.5 bg-emerald-950 rounded-[1px]"></div>
          <div className="w-2.5 h-2.5 bg-emerald-700 rounded-[1px]"></div>
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-[1px]"></div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
