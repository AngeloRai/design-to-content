import Link from "next/link";
import { CTAProps } from "@/lib/contentful/types/fields";
import IconRenderer, { IconName } from "../icons/IconRenderer";

interface CTAComponentProps extends CTAProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export default function CTA({
  label,
  url,
  variant = "primary",
  size = "medium",
  external,
  disabled,
  children,
  className = "",
  onClick,
  type = "button",
  icon,
}: CTAComponentProps) {
  
  const baseClasses = "inline-flex items-center justify-center font-body-bold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";
  
  const sizeClasses = {
    small: "px-4 py-2 text-sm gap-2",
    medium: "px-6 py-3 text-base gap-2",
    large: "px-8 py-4 text-lg gap-3",
  };

  const variantClasses = {
    primary: "bg-brand-primary text-white hover:bg-brand-secondary focus:ring-brand-primary/50 shadow-sm",
    secondary: "bg-white text-neutral-dark hover:bg-white/90 focus:ring-white/50 shadow-sm border-2 border-white",
    outline: "bg-transparent text-white border-2 border-white hover:bg-white hover:text-neutral-dark focus:ring-white/50",
    "outline-dark": "bg-transparent text-brand-primary border-2 border-brand-primary hover:bg-brand-accent/30 hover:text-neutral-dark focus:ring-white/50",
    ghost: "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 focus:ring-white/50",
    "ghost-dark": "bg-neutral-dark/10 text-neutral-dark hover:bg-neutral-dark/20 focus:ring-neutral-dark/50",
    icon: "bg-transparent text-brand-primary hover:bg-brand-primary/10 focus:ring-brand-primary/50 p-3",
    "icon-rounded": "bg-white/20 text-white hover:bg-white/30 focus:ring-white/50 p-3 rounded-full",
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  // Content with icon support
  const renderContent = () => {
    if (icon && !label && !children) {
      // Icon only
      return <IconRenderer name={icon as IconName} className="w-5 h-5" />;
    } else if (icon && (label || children)) {
      // Icon + text
      return (
        <>
          <IconRenderer name={icon as IconName} className="w-5 h-5" />
          {children || label}
        </>
      );
    } else {
      // Text only
      return children || label;
    }
  };

  const content = renderContent();

  if (!url || onClick) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={combinedClasses}
      >
        {content}
      </button>
    );
  }

  const isExternal = external || url.startsWith("http://") || url.startsWith("https://");

  if (isExternal) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={combinedClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={url} className={combinedClasses}>
      {content}
    </Link>
  );
}
