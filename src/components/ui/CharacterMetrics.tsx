import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface CharacterMetricsData {
  clonesCount: number;
  maxClones: number;
  clonesContext?: { locationName: string; count: number }[] | undefined;
  fatigueTimer: string;
  fatigueContext?: { jumpFatigueExpireDate?: string } | undefined;
  activeShip: string;
  shipContext?: { shipName: string; typeName: string } | undefined;
  activeOrders: number;
  ordersContext?: { typeName: string; price?: number }[] | undefined;
  unreadMail: number;
  mailContext?: { subject: string }[] | undefined;
}

export interface CharacterMetricsProps {
  data: CharacterMetricsData;
}

interface MetricBlockProps {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  children: ReactNode;
}

function MetricBlock({ label, value, valueClassName = "text-zinc-100", children }: MetricBlockProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center justify-center py-2 min-h-[44px] active:scale-95 bg-eve-void hover:bg-eve-tactical hover:border-status-cyan/50 border border-transparent transition-all cursor-pointer px-1 relative group overflow-hidden">
          <div className="absolute inset-0 bg-status-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[10px] uppercase tracking-widest text-eve-cryo mb-1 z-10 opacity-80">{label}</span>
          <span className={`font-mono text-xs font-semibold truncate w-full text-center z-10 ${valueClassName}`}>
            {value}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-eve-tactical border-eve-border text-zinc-300 font-mono text-xs rounded-none shadow-[0_0_10px_rgba(34,211,238,0.15)]">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

export function CharacterMetrics({ data }: CharacterMetricsProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-5 gap-[1px] bg-eve-border font-mono text-xs text-zinc-400 w-full border-t border-eve-border">
        
        <MetricBlock
          label="Clones"
          value={<>{data.clonesCount} <span className="text-zinc-500 font-normal">/ {data.maxClones}</span></>}
        >
          {data.clonesContext && data.clonesContext.length > 0 ? (
            <ul className="list-disc pl-4 space-y-2">
              {data.clonesContext.map((clone, idx) => (
                <li key={idx} className="break-words max-w-[250px]">
                  <span className="text-zinc-300">{clone.locationName}</span>
                  {clone.count > 1 && (
                    <span className="text-status-yellow font-bold ml-2">(x{clone.count})</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>Jump clone systems will be listed here.</p>
          )}
        </MetricBlock>

        <MetricBlock
          label="Fatigue"
          value={data.fatigueTimer}
          valueClassName={data.fatigueTimer !== '00:00:00' ? 'text-status-yellow' : 'text-zinc-100'}
        >
          {data.fatigueContext?.jumpFatigueExpireDate ? (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 uppercase">Expires</span>
              <span>{new Date(data.fatigueContext.jumpFatigueExpireDate).toLocaleString()}</span>
            </div>
          ) : (
            <p>No active jump fatigue.</p>
          )}
        </MetricBlock>

        <MetricBlock
          label="Ship"
          value={data.activeShip}
        >
          {data.shipContext ? (
            <div className="flex flex-col gap-1">
              <span className="text-zinc-100">{data.shipContext.shipName}</span>
              <span className="text-[10px] text-zinc-500">{data.shipContext.typeName}</span>
            </div>
          ) : (
            <p>Ship fitting and cargo details will be listed here.</p>
          )}
        </MetricBlock>

        <MetricBlock
          label="Orders"
          value={data.activeOrders}
        >
          {data.ordersContext && data.ordersContext.length > 0 ? (
            <ul className="list-disc pl-4 space-y-1 max-h-[200px] overflow-y-auto">
              {data.ordersContext.map((order, idx) => (
                <li key={idx} className="truncate max-w-[200px]">
                  {order.typeName} {order.price ? `(${order.price.toLocaleString()} ISK)` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p>No active market orders.</p>
          )}
        </MetricBlock>

        <MetricBlock
          label="Mail"
          value={data.unreadMail}
          valueClassName={data.unreadMail > 0 ? 'text-status-cyan font-bold' : 'text-zinc-100'}
        >
          {data.mailContext && data.mailContext.length > 0 ? (
            <ul className="list-disc pl-4 space-y-1">
              {data.mailContext.map((mail, idx) => (
                <li key={idx} className="truncate max-w-[200px]">{mail.subject}</li>
              ))}
            </ul>
          ) : (
            <p>No recent unread mail.</p>
          )}
        </MetricBlock>

      </div>
    </TooltipProvider>
  );
}
