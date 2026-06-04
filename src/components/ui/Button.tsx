import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'ghost';
}

export function Button({ variant = 'default', className = '', ...props }: ButtonProps) {
  const baseClasses = "font-mono tracking-widest uppercase rounded-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 px-4 py-2 min-h-[44px]";
  
  let variantClasses = "";
  switch (variant) {
    case 'default':
      variantClasses = "text-status-cyan border border-status-cyan/50 hover:bg-status-cyan/10 focus-visible:ring-status-cyan";
      break;
    case 'destructive':
      variantClasses = "text-status-red border border-status-red/50 hover:bg-status-red/10 focus-visible:ring-status-red";
      break;
    case 'warning':
      variantClasses = "text-status-yellow border border-status-yellow/50 hover:bg-status-yellow/10 focus-visible:ring-status-yellow";
      break;
    case 'success':
      variantClasses = "text-status-green border border-status-green/50 hover:bg-status-green/10 focus-visible:ring-status-green";
      break;
    case 'ghost':
      variantClasses = "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50 focus-visible:ring-zinc-400";
      break;
  }

  const combinedClassName = `${baseClasses} ${variantClasses} ${className}`.trim();

  return (
    <button className={combinedClassName} {...props} />
  );
}
