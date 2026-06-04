"use client";

import { forwardRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type IndicatorStatus = "green" | "yellow" | "red" | "offline";

interface StatusIndicatorProps {
  label: string;
  status: IndicatorStatus;
  onClick?: () => void;
}

const LEDIndicator = forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ label, status, onClick, ...props }, ref) => {
    // EVE NeoCom Aesthetic: Sharp corners, deep blacks, glowing accents, technical typography
    const statusClasses = {
      green: "border-status-green/50 text-status-green shadow-[0_0_10px_hsl(var(--status-green)/0.2)] hover:shadow-[0_0_15px_hsl(var(--status-green)/0.4)]",
      yellow: "border-status-yellow/50 text-status-yellow shadow-glow-amber hover:shadow-[0_0_20px_hsl(var(--status-yellow)/0.4)]",
      red: "border-status-red/50 text-status-red shadow-glow-red hover:shadow-[0_0_20px_hsl(var(--status-red)/0.4)]",
      offline: "border-eve-border text-zinc-600 opacity-50 hover:opacity-80 bg-eve-bg",
    };

    const ledDotClasses = {
      green: "bg-status-green shadow-[0_0_5px_hsl(var(--status-green))]",
      yellow: "bg-status-yellow shadow-[0_0_5px_hsl(var(--status-yellow))]",
      red: "bg-status-red shadow-[0_0_5px_hsl(var(--status-red))]",
      offline: "bg-eve-border",
    };

    return (
      <div
        ref={ref}
        {...props}
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-12 h-12 bg-eve-panel border cursor-pointer transition-all duration-200 rounded-none uppercase text-[10px] font-mono tracking-widest ${statusClasses[status]}`}
      >
        <span className="mb-1 leading-none">{label}</span>
        <div className={`w-1.5 h-1.5 rounded-none ${ledDotClasses[status]}`} />
      </div>
    );
  }
);
LEDIndicator.displayName = "LEDIndicator";

export interface CharacterStatusBoardProps {
  statuses: {
    skill: IndicatorStatus;
    pi: IndicatorStatus;
    indy: IndicatorStatus;
    mail: IndicatorStatus;
  };
  alerts?: {
    skill?: string[] | undefined;
    pi?: string[] | undefined;
    indy?: string[] | undefined;
    mail?: string[] | undefined;
  } | undefined;
  visibility?: {
    trackSkills: boolean;
    trackPi: boolean;
    trackIndy: boolean;
    trackMail: boolean;
  } | undefined;
}

export function CharacterStatusBoard({ statuses, alerts, visibility }: CharacterStatusBoardProps) {
  const defaultVis = { trackSkills: true, trackPi: true, trackIndy: true, trackMail: true };
  const vis = visibility || defaultVis;

  const indicators = [
    ...(vis.trackSkills ? [{ key: "skill", label: "SKILL", status: statuses.skill, contextAlerts: alerts?.skill }] : []),
    ...(vis.trackPi ? [{ key: "pi", label: "PI", status: statuses.pi, contextAlerts: alerts?.pi }] : []),
    ...(vis.trackIndy ? [{ key: "indy", label: "INDY", status: statuses.indy, contextAlerts: alerts?.indy }] : []),
    ...(vis.trackMail ? [{ key: "mail", label: "MAIL", status: statuses.mail, contextAlerts: alerts?.mail }] : []),
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="bg-zinc-900/40 border-t border-zinc-800 p-3 flex justify-center gap-6 items-center px-6 relative mt-auto min-h-[73px]">
        {indicators.map(({ key, label, status, contextAlerts }) => (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <LEDIndicator 
                label={label} 
                status={status} 
              />
            </TooltipTrigger>
            {contextAlerts && contextAlerts.length > 0 && (
              <TooltipContent side="top" className="bg-zinc-950 border-zinc-800 text-zinc-300 font-mono text-xs rounded-none max-w-[250px]">
                <ul className="list-disc pl-4 space-y-1">
                  {contextAlerts.filter(a => !a.startsWith("Total Queue:")).map((alert, idx) => (
                    <li key={idx}>{alert}</li>
                  ))}
                </ul>
                {contextAlerts.filter(a => a.startsWith("Total Queue:")).map((alert, idx) => (
                  <div key={idx} className="mt-2 pt-2 border-t border-zinc-800 text-amber-500/80 tracking-wider">
                    {alert}
                  </div>
                ))}
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
