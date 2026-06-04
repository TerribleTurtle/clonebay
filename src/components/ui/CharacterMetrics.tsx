import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface CharacterMetricsProps {
  clonesCount?: number | undefined;
  maxClones?: number | undefined;
  clonesContext?: { locationName: string }[] | undefined;
  fatigueTimer?: string | undefined;
  fatigueContext?: { jumpFatigueExpireDate?: string } | undefined;
  activeShip?: string | undefined;
  shipContext?: { shipName: string; typeName: string } | undefined;
  activeOrders?: number | undefined;
  ordersContext?: { typeName: string; price?: number }[] | undefined;
  unreadMail?: number | undefined;
  mailContext?: { subject: string }[] | undefined;
}

export function CharacterMetrics({
  clonesCount = 0,
  maxClones = 0,
  clonesContext,
  fatigueTimer = '00:00:00',
  fatigueContext,
  activeShip = 'Capsule',
  shipContext,
  activeOrders = 0,
  ordersContext,
  unreadMail = 0,
  mailContext,
}: CharacterMetricsProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-5 gap-[1px] bg-zinc-800/80 font-mono text-xs text-zinc-400 w-full border-t border-zinc-800/80">
        
        {/* Clones Metric */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center justify-center py-2 min-h-[44px] active:scale-95 bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-200 transition-colors cursor-pointer">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Clones</span>
              <span className="text-zinc-100 font-semibold">
                {clonesCount} <span className="text-zinc-500 font-normal">/ {maxClones}</span>
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-zinc-950 border-zinc-800 text-zinc-300 font-mono text-xs rounded-none">
            {clonesContext && clonesContext.length > 0 ? (
              <ul className="list-disc pl-4 space-y-2">
                {(() => {
                  const grouped: Record<string, typeof clonesContext[0] & { count: number }> = {};
                  clonesContext.forEach(clone => {
                    const key = clone.locationName;
                    if (!grouped[key]) grouped[key] = { ...clone, count: 0 };
                    grouped[key].count++;
                  });
                  return Object.values(grouped).map((clone, idx) => (
                    <li key={idx} className="break-words max-w-[250px]">
                    <span className="text-zinc-300">
                      {clone.locationName}
                    </span>
                    {clone.count > 1 && (
                      <span className="text-amber-500 font-bold ml-2">(x{clone.count})</span>
                    )}
                  </li>
                  ));
                })()}
              </ul>
            ) : (
              <p>Jump clone systems will be listed here.</p>
            )}
          </TooltipContent>
        </Tooltip>

        {/* Fatigue Metric */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center justify-center py-2 min-h-[44px] active:scale-95 bg-zinc-950 hover:bg-zinc-900 hover:text-amber-400 transition-colors cursor-pointer">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Fatigue</span>
              <span className={`font-semibold ${fatigueTimer !== '00:00:00' ? 'text-amber-400' : 'text-zinc-100'}`}>
                {fatigueTimer}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-zinc-950 border-zinc-800 text-zinc-300 font-mono text-xs rounded-none">
            {fatigueContext?.jumpFatigueExpireDate ? (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase">Expires</span>
                <span>{new Date(fatigueContext.jumpFatigueExpireDate).toLocaleString()}</span>
              </div>
            ) : (
              <p>No active jump fatigue.</p>
            )}
          </TooltipContent>
        </Tooltip>

        {/* Ship Metric */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center justify-center py-2 min-h-[44px] active:scale-95 bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-200 transition-colors cursor-pointer px-1">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Ship</span>
              <span className="text-zinc-100 font-semibold truncate w-full text-center">{activeShip}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-zinc-950 border-zinc-800 text-zinc-300 font-mono text-xs rounded-none">
            {shipContext ? (
              <div className="flex flex-col gap-1">
                <span className="text-zinc-100">{shipContext.shipName}</span>
                <span className="text-[10px] text-zinc-500">{shipContext.typeName}</span>
              </div>
            ) : (
              <p>Ship fitting and cargo details will be listed here.</p>
            )}
          </TooltipContent>
        </Tooltip>

        {/* Orders Metric */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center justify-center py-2 min-h-[44px] active:scale-95 bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-200 transition-colors cursor-pointer">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Orders</span>
              <span className="text-zinc-100 font-semibold">{activeOrders}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-zinc-950 border-zinc-800 text-zinc-300 font-mono text-xs rounded-none max-h-[200px] overflow-y-auto">
            {ordersContext && ordersContext.length > 0 ? (
              <ul className="list-disc pl-4 space-y-1">
                {ordersContext.map((order, idx) => (
                  <li key={idx} className="truncate max-w-[200px]">
                    {order.typeName} {order.price ? `(${order.price.toLocaleString()} ISK)` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No active market orders.</p>
            )}
          </TooltipContent>
        </Tooltip>

        {/* Mail Metric */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center justify-center py-2 min-h-[44px] active:scale-95 bg-zinc-950 hover:bg-zinc-900 hover:text-cyan-400 transition-colors cursor-pointer">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Mail</span>
              <span className={`font-semibold ${unreadMail > 0 ? 'text-cyan-400' : 'text-zinc-100'}`}>
                {unreadMail}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-zinc-950 border-zinc-800 text-zinc-300 font-mono text-xs rounded-none">
            {mailContext && mailContext.length > 0 ? (
              <ul className="list-disc pl-4 space-y-1">
                {mailContext.map((mail, idx) => (
                  <li key={idx} className="truncate max-w-[200px]">{mail.subject}</li>
                ))}
              </ul>
            ) : (
              <p>No recent unread mail.</p>
            )}
          </TooltipContent>
        </Tooltip>

      </div>
    </TooltipProvider>
  );
}
