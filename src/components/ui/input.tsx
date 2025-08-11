import * as React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, type, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <input
          type={type}
          className={`w-full px-4 py-3 text-white transition-all duration-300 border rounded-lg bg-white/5 border-white/10 focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 ${className || ''}`}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = "Input"
