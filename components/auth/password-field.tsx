"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { inputClass, fieldLabelClass, passwordToggleClass } from "./auth-classes"

interface PasswordFieldProps {
  id: string
  label?: string
  value: string
  onChange: (value: string) => void
  autoComplete: "current-password" | "new-password"
  disabled?: boolean
  placeholder?: string
  ariaDescribedBy?: string
  minLength?: number
  hint?: React.ReactNode
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  placeholder = "••••••••",
  ariaDescribedBy,
  minLength,
  hint,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      {label && <label htmlFor={id} className={fieldLabelClass}>{label}</label>}
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
          maxLength={128}
          disabled={disabled}
          placeholder={placeholder}
          aria-describedby={ariaDescribedBy}
          className={inputClass + " pr-12"}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Hide password" : "Show password"}
          className={passwordToggleClass}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint}
    </div>
  )
}
