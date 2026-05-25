'use client'

import { AlertTriangle } from 'lucide-react'
import { C } from '@/constants/theme'
import type { ProductCompliance } from '@/constants/productCompliance'

import Accordion from './Accordion'

const HOW_TO_USE = [
  'Cleanse and gently tone your face.',
  'Apply the amount recommended on the product packaging.',
  'Press gently into skin, avoiding the eye area.',
  'Follow with moisturiser and SPF in the morning.',
]

const BENEFITS = [
  {
    icon: '📋',
    title: 'Full formula context',
    desc: 'Full INCI, PAO, allergen notes, and seller details are available before purchase.',
  },
  {
    icon: '🌿',
    title: 'Routine-first positioning',
    desc: 'Designed as a cosmetic ritual step without medical, diagnostic, or treatment claims.',
  },
  {
    icon: '⚠️',
    title: 'Use with care',
    desc: 'Patch-test and allergen guidance help you decide whether the formula suits your skin.',
  },
]

interface ProductAccordionsProps {
  compliance: ProductCompliance
  openSection: string
  onToggle: (sectionId: string) => void
}

export default function ProductAccordions({
  compliance,
  openSection,
  onToggle,
}: ProductAccordionsProps) {
  return (
    <div style={{ borderTop: `1px solid ${C.border}` }}>
      <Accordion
        id="benefits"
        label="Key Product Notes"
        open={openSection === 'benefits'}
        onToggle={() => onToggle('benefits')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 20 }}>
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }} aria-hidden="true">
                {benefit.icon}
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                  {benefit.title}
                </div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{benefit.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion
        id="ingredients"
        label="Full Ingredients (INCI)"
        open={openSection === 'ingredients'}
        onToggle={() => onToggle('ingredients')}
      >
        <div style={{ paddingBottom: 20 }}>
          {compliance.inci ? (
            <>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.75, marginBottom: 10 }}>
                Listed in descending order of concentration (INCI standard):
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: C.text,
                  lineHeight: 1.8,
                  fontStyle: 'italic',
                  background: C.ivory,
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                {compliance.inci}
              </p>
            </>
          ) : (
            <p style={{ fontSize: 12, color: C.muted }}>
              Full ingredient list available on product packaging.
            </p>
          )}
          {compliance.freeFrom && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {compliance.freeFrom.map((f) => (
                <span
                  key={f}
                  style={{
                    fontSize: 10,
                    padding: '3px 9px',
                    borderRadius: 99,
                    background: C.sagePale,
                    color: C.forest,
                    fontWeight: 600,
                  }}
                >
                  ✓ {f}-Free
                </span>
              ))}
            </div>
          )}
        </div>
      </Accordion>

      <Accordion
        id="how_to_use"
        label="How To Use"
        open={openSection === 'how_to_use'}
        onToggle={() => onToggle('how_to_use')}
      >
        <ol
          className="product-usage-list"
          style={{
            paddingBottom: 20,
            display: 'grid',
            gap: 10,
          }}
        >
          {HOW_TO_USE.map((step) => (
            <li
              key={step}
              style={{
                fontSize: 13,
                color: C.muted,
                paddingLeft: 4,
              }}
            >
              {step}
            </li>
          ))}
        </ol>
      </Accordion>

      <Accordion
        id="allergens"
        label="Patch Test & Allergen Info"
        open={openSection === 'allergens'}
        onToggle={() => onToggle('allergens')}
      >
        <div style={{ paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {compliance.allergens && (
            <div
              style={{
                background: '#FFF8E7',
                border: '1px solid #F0D68A',
                borderRadius: 10,
                padding: '12px 14px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#8B6914',
                  marginBottom: 5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <AlertTriangle size={12} /> Allergen Information
              </div>
              <p style={{ fontSize: 12, color: '#665200', lineHeight: 1.7 }}>
                {compliance.allergens}
              </p>
            </div>
          )}
          {compliance.patchTest && (
            <div
              style={{
                background: C.ivory,
                borderRadius: 10,
                padding: '12px 14px',
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                🧪 Patch Test Recommended
              </div>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                Apply a small amount to the inner forearm 24 hours before first full use.
                Discontinue use if redness, itching, or irritation occurs. Seek professional advice
                if you have reactive skin or symptoms persist.
              </p>
            </div>
          )}
          {compliance.agingNote && (
            <div
              style={{
                background: C.terraPale,
                borderRadius: 10,
                padding: '12px 14px',
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: C.terra, marginBottom: 4 }}>
                ℹ️ Age Guidance
              </div>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                {compliance.agingNote}
              </p>
            </div>
          )}
          <div
            style={{
              background: C.ivory,
              borderRadius: 10,
              padding: '12px 14px',
              border: `1px solid ${C.border}`,
            }}
          >
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              <strong>For external use only.</strong> Avoid contact with eyes. If contact occurs,
              rinse thoroughly with water. Keep out of reach of children. Store in a cool, dry
              place.
            </p>
          </div>
        </div>
      </Accordion>

      <Accordion
        id="commerce-disclosures"
        label="Product & Seller Details"
        open={openSection === 'commerce-disclosures'}
        onToggle={() => onToggle('commerce-disclosures')}
      >
        <dl className="product-compliance-list">
          <div>
            <dt>Country of origin</dt>
            <dd>{compliance.countryOfOrigin}</dd>
          </div>
          <div>
            <dt>Manufacturer</dt>
            <dd>{compliance.manufacturer}</dd>
          </div>
          <div>
            <dt>Packer</dt>
            <dd>{compliance.packer}</dd>
          </div>
          <div>
            <dt>Importer</dt>
            <dd>{compliance.importer ?? 'Not applicable - manufactured in India'}</dd>
          </div>
          {compliance.cdSCoImportLicence && (
            <div>
              <dt>CDSCO import licence</dt>
              <dd>{compliance.cdSCoImportLicence}</dd>
            </div>
          )}
        </dl>
      </Accordion>
    </div>
  )
}
