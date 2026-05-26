import type { ReactNode } from 'react'

interface FieldProps {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
  span?: boolean
}

/** Stable id for the inline error element — pass to aria-describedby on the control. */
export function fieldErrorId(id: string) {
  return `${id}-error`
}

export default function Field({ id, label, required = false, error, children, span }: FieldProps) {
  return (
    <div className={`mb-4 ${span ? 'col-span-full' : ''}`}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold tracking-wide text-text">
        {label}
        {required && (
          <span className="ml-0.5 text-terra" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <div id={fieldErrorId(id)} className="mt-1 text-[11px] text-terra">
          {error}
        </div>
      )}
    </div>
  )
}

/**
 * Reusable input className. Pass `error` to switch to the invalid state.
 */
export function inputClassName(error?: string | boolean): string {
  return [
    'input-base',
    error ? 'border-terra focus:border-terra focus:ring-2 focus:ring-terra/20' : '',
  ]
    .filter(Boolean)
    .join(' ')
}
