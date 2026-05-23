import { Resend } from 'resend'
import type { CheckoutAddress, NormalizedCartItem, CartTotals } from './commerce'

export interface OrderEmailData {
  orderId: string
  paymentId: string
  paymentMethod: string
  status: string
  address: CheckoutAddress
  items: NormalizedCartItem[]
  totals: CartTotals
}

let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
  const resend = getResend()
  if (!resend) return

  const shortId = data.orderId.slice(0, 8).toUpperCase()
  const invoiceUrl = `https://www.verdebliss.com/account/orders/${data.orderId}/invoice`
  const orderUrl = `https://www.verdebliss.com/account/orders/${data.orderId}`

  try {
    await resend.emails.send({
      from: process.env.ORDER_FROM_EMAIL ?? 'VerdeBliss <onboarding@resend.dev>',
      to: data.address.email,
      subject: `Order confirmed — #${shortId} ✦ VerdeBliss`,
      html: buildHtml({ ...data, shortId, invoiceUrl, orderUrl }),
    })
  } catch {
    console.warn('[order-email] Failed to send order confirmation email')
  }
}

// ─── HTML template ───────────────────────────────────────────────────────────

interface TemplateData extends OrderEmailData {
  shortId: string
  invoiceUrl: string
  orderUrl: string
}

function buildHtml(d: TemplateData): string {
  const date = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const itemRows = d.items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #EDE5DA;font-size:13px;color:#1C221E;font-weight:600">${item.name}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #EDE5DA;font-size:13px;color:#5C6C4D;text-align:center">${item.qty}</td>
      <td style="padding:12px 0;border-bottom:1px solid #EDE5DA;font-size:13px;color:#1C221E;font-weight:700;text-align:right">₹${(item.price * item.qty).toLocaleString('en-IN')}</td>
    </tr>`
    )
    .join('')

  const addr = d.address
  const addrLine = [addr.line1, addr.line2].filter(Boolean).join(', ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Order Confirmed — VerdeBliss</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'DM Sans',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

  <!-- Header -->
  <tr>
    <td style="background:#2D4A32;border-radius:16px 16px 0 0;padding:28px 36px;text-align:center">
      <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff;letter-spacing:0.01em">VerdeBliss</div>
      <div style="font-size:9px;font-weight:700;letter-spacing:0.18em;color:rgba(255,255,255,0.5);margin-top:2px">COSMETICS</div>
      <div style="margin-top:16px;display:inline-block;background:rgba(255,255,255,0.12);border-radius:99px;padding:6px 18px">
        <span style="font-size:12px;font-weight:700;color:#BFA06A;letter-spacing:0.06em">✦ ORDER CONFIRMED</span>
      </div>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="background:#FDFAF6;padding:28px 36px">

      <!-- Greeting -->
      <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#1C221E;font-family:Georgia,serif">
        Thank you, ${addr.name.split(' ')[0]}!
      </p>
      <p style="margin:0 0 24px;font-size:13px;color:#5C6C4D;line-height:1.6">
        Your order <strong style="color:#2D4A32">#${d.shortId}</strong> has been received and is now being processed. We'll notify you once it ships.
      </p>

      <!-- Order meta -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;border-radius:10px;margin-bottom:24px">
        <tr>
          <td style="padding:14px 18px;border-right:1px solid #EDE5DA">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#C07A5A;margin-bottom:4px">ORDER ID</div>
            <div style="font-size:13px;font-weight:700;color:#1C221E">#${d.shortId}</div>
          </td>
          <td style="padding:14px 18px;border-right:1px solid #EDE5DA">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#C07A5A;margin-bottom:4px">DATE</div>
            <div style="font-size:13px;font-weight:700;color:#1C221E">${date}</div>
          </td>
          <td style="padding:14px 18px">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#C07A5A;margin-bottom:4px">STATUS</div>
            <div style="font-size:13px;font-weight:700;color:#2D4A32">${d.status}</div>
          </td>
        </tr>
      </table>

      <!-- Items -->
      <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#C07A5A;margin-bottom:10px">ORDER ITEMS</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:0">
        <tr>
          <th style="padding:8px 0;font-size:10px;font-weight:700;letter-spacing:0.08em;color:#A8BAA9;text-align:left;border-bottom:2px solid #EDE5DA">PRODUCT</th>
          <th style="padding:8px 8px;font-size:10px;font-weight:700;letter-spacing:0.08em;color:#A8BAA9;text-align:center;border-bottom:2px solid #EDE5DA">QTY</th>
          <th style="padding:8px 0;font-size:10px;font-weight:700;letter-spacing:0.08em;color:#A8BAA9;text-align:right;border-bottom:2px solid #EDE5DA">TOTAL</th>
        </tr>
        ${itemRows}
      </table>

      <!-- Totals -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">
        <tr>
          <td style="font-size:12px;color:#5C6C4D;padding:4px 0">Subtotal</td>
          <td style="font-size:12px;color:#1C221E;font-weight:600;text-align:right;padding:4px 0">₹${d.totals.subtotal.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="font-size:12px;color:#5C6C4D;padding:4px 0">Shipping</td>
          <td style="font-size:12px;color:#1C221E;font-weight:600;text-align:right;padding:4px 0">${d.totals.shipping === 0 ? 'Free' : `₹${d.totals.shipping.toLocaleString('en-IN')}`}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:4px 0"><div style="border-top:2px solid #EDE5DA;margin:6px 0"></div></td>
        </tr>
        <tr>
          <td style="font-size:15px;font-weight:800;color:#1C221E;padding:4px 0">Total</td>
          <td style="font-size:15px;font-weight:800;color:#2D4A32;text-align:right;padding:4px 0">₹${d.totals.total.toLocaleString('en-IN')}</td>
        </tr>
        ${d.totals.pointsToEarn > 0 ? `<tr><td colspan="2" style="font-size:11px;color:#7D9B76;font-weight:600;padding:6px 0">✦ +${d.totals.pointsToEarn} Verde points earned on this order</td></tr>` : ''}
      </table>

      <!-- Divider -->
      <div style="border-top:1px solid #EDE5DA;margin:24px 0"></div>

      <!-- Address + Payment side by side -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr valign="top">
          <td width="50%" style="padding-right:16px">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#C07A5A;margin-bottom:8px">DELIVERY ADDRESS</div>
            <div style="font-size:13px;font-weight:700;color:#1C221E;margin-bottom:3px">${addr.name}</div>
            <div style="font-size:12px;color:#5C6C4D;line-height:1.6">${addrLine}<br/>${addr.city}, ${addr.state} ${addr.pincode}<br/>${addr.phone}</div>
          </td>
          <td width="50%" style="padding-left:16px;border-left:1px solid #EDE5DA">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#C07A5A;margin-bottom:8px">PAYMENT</div>
            <div style="font-size:13px;font-weight:700;color:#1C221E;margin-bottom:3px">${d.paymentMethod}</div>
            <div style="font-size:11px;color:#A8BAA9;word-break:break-all">Ref: ${d.paymentId}</div>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <div style="border-top:1px solid #EDE5DA;margin:24px 0"></div>

      <!-- CTAs -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:0 8px 0 0">
            <a href="${d.orderUrl}" style="display:block;background:#2D4A32;color:#fff;text-decoration:none;border-radius:10px;padding:13px 0;font-size:13px;font-weight:700;text-align:center">
              View Order
            </a>
          </td>
          <td align="center" style="padding:0 0 0 8px">
            <a href="${d.invoiceUrl}" style="display:block;background:#FAF7F2;border:1px solid #E4DAD0;color:#2D4A32;text-decoration:none;border-radius:10px;padding:13px 0;font-size:13px;font-weight:700;text-align:center">
              Download Invoice
            </a>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#2D4A32;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center">
      <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.75)">Questions? Reply to this email or write to <a href="mailto:support@verdebliss.com" style="color:#BFA06A;text-decoration:none">support@verdebliss.com</a></p>
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4)">VerdeBliss Cosmetics · Pune, India · verdebliss.com</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
}
