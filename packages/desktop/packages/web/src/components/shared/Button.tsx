import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  style?: React.CSSProperties;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  style,
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "none",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    fontWeight: 600,
    fontFamily: "var(--font-primary)",
    transition: "all 0.2s ease",
    opacity: disabled || loading ? 0.6 : 1,
    ...style,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--accent)",
      color: "#fff",
    },
    secondary: {
      background: "var(--bg-card)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-color)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-primary)",
    },
    danger: {
      background: "var(--danger, #e74c3c)",
      color: "#fff",
    },
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: "6px 12px", fontSize: 12, borderRadius: 4 },
    md: { padding: "10px 20px", fontSize: 14, borderRadius: 4 },
    lg: { padding: "14px 28px", fontSize: 16, borderRadius: 4 },
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{ ...baseStyle, ...variants[variant], ...sizes[size] }}
    >
      {loading && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
      {children}
    </button>
  );
}
