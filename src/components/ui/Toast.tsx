"use client";
import type { Toast as ToastProps } from "../../hooks/use-toast";
import { useToastStore } from "../../hooks/use-toast";

export function Toast({ id, title, description, type = "default" }: ToastProps) {
  const removeToast = useToastStore((s) => s.removeToast);

  const typeClasses: Record<NonNullable<ToastProps["type"]>, string> = {
    default: "border-eve-border bg-eve-panel text-eve-cryo",
    error: "border-status-red bg-zinc-950 text-status-red shadow-glow-red",
    success: "border-status-green bg-zinc-950 text-status-green",
    warning: "border-status-yellow bg-zinc-950 text-status-yellow shadow-glow-amber",
  };

  return (
    <div className={`pointer-events-auto relative flex w-full flex-col gap-1 border p-4 transition-all rounded-none ${typeClasses[type]}`}>
      {title && <div className="text-sm font-bold uppercase tracking-widest">{title}</div>}
      {description && <div className="text-xs opacity-90">{description}</div>}
      <button 
        onClick={() => removeToast(id)} 
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-300 min-h-[44px] min-w-[44px] -mt-2 -mr-2"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
