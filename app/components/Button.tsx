import React from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  id?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-pj-blue-600 text-white hover:bg-pj-blue-700 active:bg-pj-blue-800 shadow-sm hover:shadow-md",
  secondary:
    "bg-pj-blue-50 text-pj-blue-700 hover:bg-pj-blue-100 active:bg-pj-blue-200",
  outline:
    "bg-transparent text-pj-blue-600 border-2 border-pj-blue-600 hover:bg-pj-blue-50 active:bg-pj-blue-100",
  ghost:
    "bg-transparent text-pj-slate-600 hover:text-pj-blue-600 hover:bg-pj-slate-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  className = "",
  type = "button",
  disabled = false,
  onClick,
  id,
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pj-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} id={id}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      id={id}
    >
      {children}
    </button>
  );
}
