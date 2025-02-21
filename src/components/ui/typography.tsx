import { cn } from "../../lib/utils";

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function Text({ className, children, ...props }: TextProps) {
  return (
    <p className={cn("text-gray-300", className)} {...props}>
      {children}
    </p>
  );
} 