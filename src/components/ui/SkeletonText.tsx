export interface SkeletonTextProps {
  width?: string;
}

export function SkeletonText({ width = 'w-12' }: SkeletonTextProps) {
  return (
    <span 
      className={`inline-block h-3.5 bg-zinc-800/80 animate-pulse rounded-none align-middle ${width}`} 
      aria-hidden="true" 
    />
  );
}
