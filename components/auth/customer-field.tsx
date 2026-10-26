"use client"

import { useState } from "react"
import { Eye, EyeOff, type LucideIcon } from "lucide-react"

/**
 * Text field for the customer auth screens, drawn like the Checkout passenger
 * fields and the Account profile form (52px, warm fill, graphite edge, icon
 * inside). Checkout sign-in keeps `auth-classes` + `PasswordField`, so nothing
 * here may be shared back into it.
 */
interface CustomerFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  id: string
  label: string
  icon: LucideIcon
  /** Rendered at the right end of the label row, e.g. a link or counter. */
  labelAside?: React.ReactNode
  optional?: boolean
  hint?: React.ReactNode
  /** Extra control inside the field box, at the right edge. */
  trailing?: React.ReactNode
}

export function CustomerField({
  id,
  label,
  icon: Icon,
  labelAside,
  optional,
  hint,
  trailing,
  ...inputProps
}: CustomerFieldProps): React.JSX.Element {
  return (
    <div className="cauth-field">
      <div className="cauth-field-label-row">
        <label htmlFor={id} className="cauth-field-label">
          {label}
          {optional && <span className="cauth-field-optional"> · Optional</span>}
        </label>
        {labelAside}
      </div>
      <div className="cauth-field-box">
        <Icon className="cauth-field-icon" aria-hidden="true" />
        <input
          id={id}
          className={trailing ? "cauth-input cauth-input--trailing" : "cauth-input"}
          {...inputProps}
        />
        {trailing}
      </div>
      {hint}
    </div>
  )
}

interface CustomerPasswordFieldProps {
  id: string
  label: string
  icon: LucideIcon
  value: string
  onChange: (value: string) => void
  autoComplete: "current-password" | "new-password"
  disabled?: boolean
  placeholder?: string
  ariaDescribedBy?: string
  minLength?: number
  labelAside?: React.ReactNode
  hint?: React.ReactNode
}

export function CustomerPasswordField({
  value,
  onChange,
  minLength,
  ariaDescribedBy,
  ...rest
}: CustomerPasswordFieldProps): React.JSX.Element {
  const [visible, setVisible] = useState(false)

  return (
    <CustomerField
      {...rest}
      type={visible ? "text" : "password"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      minLength={minLength}
      maxLength={128}
      aria-describedby={ariaDescribedBy}
      trailing={
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="cauth-eye"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      }
    />
  )
}
