'use client'
import { motion } from 'framer-motion'
import type { ChangeEvent } from 'react'
import Field, { inputClassName } from './Field'
import type { CheckoutForm, CheckoutErrors } from '../checkout-types'

interface AddressStepProps {
  form: CheckoutForm
  errors: CheckoutErrors
  onChange: (field: keyof CheckoutForm) => (e: ChangeEvent<HTMLInputElement>) => void
  onContinue: () => void
}

export default function AddressStep({ form, errors, onChange, onContinue }: AddressStepProps) {
  return (
    <motion.div
      key="address"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="checkout-panel checkout-panel--form checkout-address-form">
        <h2 className="mb-5 font-serif text-[1.35rem] font-normal text-text">Delivery Address</h2>
        <div className="checkout-address-form__grid grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Field id="checkout-name" label="Full Name" required error={errors.name} span>
            <input
              id="checkout-name"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={onChange('name')}
              placeholder="Kavya Menon"
              className={inputClassName(errors.name)}
            />
          </Field>
          <Field id="checkout-email" label="Email" required error={errors.email}>
            <input
              id="checkout-email"
              name="email"
              autoComplete="email"
              type="email"
              value={form.email}
              onChange={onChange('email')}
              placeholder="you@email.com"
              className={inputClassName(errors.email)}
            />
          </Field>
          <Field id="checkout-phone" label="Phone" required error={errors.phone}>
            <input
              id="checkout-phone"
              name="phone"
              autoComplete="tel"
              type="tel"
              value={form.phone}
              onChange={onChange('phone')}
              placeholder="9876543210"
              maxLength={10}
              className={inputClassName(errors.phone)}
            />
          </Field>
          <Field id="checkout-line1" label="Address Line 1" required error={errors.line1} span>
            <input
              id="checkout-line1"
              name="address-line1"
              autoComplete="address-line1"
              value={form.line1}
              onChange={onChange('line1')}
              placeholder="Flat / House number, Street"
              className={inputClassName(errors.line1)}
            />
          </Field>
          <Field id="checkout-line2" label="Address Line 2" span>
            <input
              id="checkout-line2"
              name="address-line2"
              autoComplete="address-line2"
              value={form.line2}
              onChange={onChange('line2')}
              placeholder="Area, Landmark (optional)"
              className={inputClassName(false)}
            />
          </Field>
          <Field id="checkout-city" label="City" required error={errors.city}>
            <input
              id="checkout-city"
              name="city"
              autoComplete="address-level2"
              value={form.city}
              onChange={onChange('city')}
              placeholder="Pune"
              className={inputClassName(errors.city)}
            />
          </Field>
          <Field id="checkout-state" label="State" required error={errors.state}>
            <input
              id="checkout-state"
              name="state"
              autoComplete="address-level1"
              value={form.state}
              onChange={onChange('state')}
              placeholder="Maharashtra"
              className={inputClassName(errors.state)}
            />
          </Field>
          <Field id="checkout-pincode" label="PIN Code" required error={errors.pincode}>
            <input
              id="checkout-pincode"
              name="postal-code"
              autoComplete="postal-code"
              inputMode="numeric"
              value={form.pincode}
              onChange={onChange('pincode')}
              placeholder="411014"
              maxLength={6}
              className={inputClassName(errors.pincode)}
            />
          </Field>
        </div>
      </div>
      <button onClick={onContinue} className="btn-primary checkout-primary-action w-full px-6">
        Continue to Review →
      </button>
    </motion.div>
  )
}
