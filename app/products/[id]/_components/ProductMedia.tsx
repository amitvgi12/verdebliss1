'use client'

import { motion } from 'framer-motion'
import ProductImage from '@/components/ui/ProductImage'
import { C } from '@/constants/theme'
import type { Product } from '@/types'

import PAOSymbol from './PAOSymbol'

interface ProductCertification {
  label: string
  emoji: string
  url: string
  org: string
  status: string
}

interface ProductMediaProps {
  product: Product
  isMobile: boolean
  paoMonths: number
  certifications: ProductCertification[]
}

export default function ProductMedia({
  product,
  isMobile,
  paoMonths,
  certifications,
}: ProductMediaProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isMobile ? 0 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45 }}
      style={isMobile ? {} : { position: 'sticky', top: 80 }}
    >
      <div
        style={{
          borderRadius: isMobile ? 16 : 24,
          overflow: 'hidden',
          aspectRatio: '1 / 1',
          width: '100%',
          position: 'relative',
          boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
          marginBottom: isMobile ? 20 : 0,
        }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          <ProductImage product={product} sizes="(max-width: 1024px) 90vw, 560px" />
        </div>
      </div>

      {paoMonths && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 16px',
            background: C.goldPale,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
          }}
        >
          <PAOSymbol months={paoMonths} />
          <p style={{ fontSize: 10, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
            Store in a cool, dry place away from direct sunlight. Best before date printed on
            packaging.
          </p>
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {certifications.map((cert) =>
          cert.url ? (
            <a
              key={cert.label}
              href={cert.url}
              title={`${cert.label}: ${cert.org}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '5px 12px',
                borderRadius: 99,
                border: `1px solid ${C.border}`,
                color: C.olive,
                background: C.sagePale,
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              <span aria-hidden="true">{cert.emoji}</span> {cert.label} · {cert.status}
            </a>
          ) : (
            <span
              key={cert.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '5px 12px',
                borderRadius: 99,
                border: `1px solid ${C.border}`,
                color: C.muted,
                textTransform: 'uppercase',
              }}
            >
              <span aria-hidden="true">{cert.emoji}</span> {cert.label} · {cert.status}
            </span>
          )
        )}
      </div>
    </motion.div>
  )
}
