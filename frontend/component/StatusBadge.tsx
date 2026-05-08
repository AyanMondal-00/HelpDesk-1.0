/**
 * @file StatusBadge.tsx
 * @description Reusable component for displaying ticket status with consistent color coding and sizing.
 */

/**
 * @interface StatusBadgeProps
 * @description Props for the StatusBadge component.
 */
interface StatusBadgeProps {
  // The status string to display (e.g., 'CREATED', 'ASSIGNED')
  status: string;
  // Optional size variant for the badge
  size?: "sm" | "md" | "lg";
}

/**
 * @component StatusBadge
 * @description Renders a styled badge representing a specific status.
 */
export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  /**
   * Color mapping for each supported status.
   * Defines background, text, and border colors.
   */
  const styles: Record<string, string> = {
    CREATED: "bg-blue-100 text-blue-800 border border-blue-300",
    ASSIGNED: "bg-purple-100 text-purple-800 border border-purple-300",
    STARTED: "bg-amber-100 text-amber-800 border border-amber-300",
    RESOLVED: "bg-green-100 text-green-800 border border-green-300",
    CLOSED: "bg-slate-100 text-slate-700 border border-slate-300",
  };

  /**
   * Size mapping for different badge variants.
   * Adjusts padding and font size.
   */
  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full tracking-wide ${
        sizeStyles[size]
      } ${styles[status] || "bg-slate-100 text-slate-700 border border-slate-300"}`}
    >
      {status}
    </span>
  );
}