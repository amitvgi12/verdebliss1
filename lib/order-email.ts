import { Resend } from 'resend'
import type { CheckoutAddress, NormalizedCartItem, CartTotals } from './commerce'
import { createSupabaseAdmin, hasSupabaseAdminEnv } from './supabase-admin'
import { BUSINESS_COMPLIANCE, formatPostalAddress } from '@/constants/businessCompliance'

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
      from: process.env.ORDER_FROM_EMAIL ?? `VerdeBliss <${BUSINESS_COMPLIANCE.emails.orders}>`,
      to: data.address.email,
      subject: `Order confirmed — #${shortId} ✦ VerdeBliss`,
      html: buildHtml({ ...data, shortId, invoiceUrl, orderUrl }),
    })

    if (hasSupabaseAdminEnv()) {
      const admin = createSupabaseAdmin()
      await admin
        .from('invoices')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('order_id', data.orderId)
    }
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
  const firstName = d.address.name.split(' ')[0]
  const date = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const addr = d.address
  const addrLine = [addr.line1, addr.line2].filter(Boolean).join(', ')

  const sans = `-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif`
  const serif = `Georgia,'Times New Roman',serif`

  const itemRows = d.items
    .map(
      (item, i, arr) => `
    <tr>
      <td style="padding:11px 0;${i < arr.length - 1 ? 'border-bottom:1px solid #f0ebe3;' : ''}vertical-align:top">
        <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#2d3a2e;font-family:${sans}">${item.name}</p>
        <p style="margin:0;font-size:12px;color:#7a8a7b;font-family:${sans}">Qty: ${item.qty}&nbsp;&nbsp;·&nbsp;&nbsp;&#8377;${item.price.toLocaleString('en-IN')} each</p>
      </td>
      <td style="padding:11px 0;${i < arr.length - 1 ? 'border-bottom:1px solid #f0ebe3;' : ''}text-align:right;vertical-align:top">
        <p style="margin:0;font-size:14px;font-weight:700;color:#2d3a2e;font-family:${sans}">&#8377;${(item.price * item.qty).toLocaleString('en-IN')}</p>
      </td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
<head>
  <meta content="width=device-width" name="viewport"/>
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection"/>
</head>
<body style="margin:0;padding:0;background-color:#f5f1ea">

  <!-- Preheader -->
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
    Your order #${d.shortId} is confirmed — a little nature is on its way to you.
  </div>

  <!-- Outer wrapper -->
  <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#f5f1ea">
    <tr>
      <td align="center" style="padding:40px 16px;font-family:${sans};font-size:14px;line-height:1.55">

        <!-- Inner 600px container -->
        <table border="0" width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px;width:100%">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:12px">
              <img src="https://resend-attachments.s3.amazonaws.com/a7005c89-2d27-49ca-8ab0-edbf483d30ee"
                   width="160" height="106" alt="VerdeBliss"
                   style="display:block;border:none;outline:none;text-decoration:none;max-width:100%"/>
            </td>
          </tr>

          <!-- Tagline -->
          <tr>
            <td align="center" style="padding-bottom:6px">
              <p style="margin:0;font-size:11px;letter-spacing:3px;color:#7a8a7b;text-transform:uppercase;font-family:${sans}">
                Botanical &middot; Transparent &middot; Thoughtfully made
              </p>
            </td>
          </tr>

          <!-- Fleuron divider -->
          <tr>
            <td align="center" style="padding-bottom:32px">
              <p style="margin:0;font-size:20px;color:#a8b3a4;line-height:1">&#10086;</p>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding:0 24px 14px">
              <h1 style="margin:0;font-size:32px;font-weight:400;color:#2d3a2e;letter-spacing:-0.5px;line-height:1.2;font-family:${serif}">
                Thank you for your order
              </h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td align="center" style="padding:0 40px 36px">
              <p style="margin:0;font-size:16px;color:#5a6a5b;line-height:1.7;text-align:center;font-family:${sans}">
                Hi ${firstName}, we&#8217;ve received your order and it&#8217;s being prepared with care.<br/>
                A little nature is on its way to you.
              </p>
            </td>
          </tr>

          <!-- ── Order summary card ── -->
          <tr>
            <td style="padding-bottom:28px">
              <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:#ffffff;border-radius:12px;border:1px solid #e5e0d6">
                <tr>
                  <td style="padding:32px">

                    <!-- Order number -->
                    <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;color:#7a8a7b;text-transform:uppercase;text-align:center;font-family:${sans}">
                      Order Number
                    </p>
                    <p style="margin:0 0 24px;font-size:22px;font-weight:500;color:#2d3a2e;text-align:center;font-family:${serif}">
                      #${d.shortId}
                    </p>

                    <hr style="margin:0 0 20px;border:none;border-top:1px solid #e5e0d6"/>

                    <!-- Date + Status -->
                    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation"
                           style="margin-bottom:20px">
                      <tr>
                        <td style="padding-right:12px">
                          <p style="margin:0 0 3px;font-size:11px;letter-spacing:1.5px;color:#7a8a7b;text-transform:uppercase;font-family:${sans}">Order Date</p>
                          <p style="margin:0;font-size:15px;color:#2d3a2e;font-family:${sans}">${date}</p>
                        </td>
                        <td style="text-align:right;padding-left:12px">
                          <p style="margin:0 0 3px;font-size:11px;letter-spacing:1.5px;color:#7a8a7b;text-transform:uppercase;font-family:${sans}">Status</p>
                          <p style="margin:0;font-size:15px;font-weight:600;color:#4a7c59;font-family:${sans}">${d.status}</p>
                        </td>
                      </tr>
                    </table>

                    <hr style="margin:0 0 20px;border:none;border-top:1px solid #e5e0d6"/>

                    <!-- Items label -->
                    <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;color:#7a8a7b;text-transform:uppercase;font-family:${sans}">
                      Items Ordered
                    </p>

                    <!-- Item rows -->
                    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation"
                           style="margin-bottom:0">
                      ${itemRows}
                    </table>

                    <!-- Totals -->
                    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation"
                           style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e0d6">
                      <tr>
                        <td style="padding-bottom:6px">
                          <p style="margin:0;font-size:13px;color:#7a8a7b;font-family:${sans}">Subtotal</p>
                        </td>
                        <td style="text-align:right;padding-bottom:6px">
                          <p style="margin:0;font-size:13px;color:#2d3a2e;font-family:${sans}">&#8377;${d.totals.subtotal.toLocaleString('en-IN')}</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin:0;font-size:13px;color:#7a8a7b;font-family:${sans}">Shipping</p>
                        </td>
                        <td style="text-align:right">
                          <p style="margin:0;font-size:13px;color:#2d3a2e;font-family:${sans}">${d.totals.shipping === 0 ? 'Free' : `&#8377;${d.totals.shipping.toLocaleString('en-IN')}`}</p>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:10px 0 0">
                          <hr style="margin:0 0 10px;border:none;border-top:1px solid #e5e0d6"/>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin:0;font-size:16px;font-weight:700;color:#2d3a2e;font-family:${sans}">Total</p>
                        </td>
                        <td style="text-align:right">
                          <p style="margin:0;font-size:16px;font-weight:700;color:#2d3a2e;font-family:${sans}">&#8377;${d.totals.total.toLocaleString('en-IN')}</p>
                        </td>
                      </tr>
                      ${
                        d.totals.pointsToEarn > 0
                          ? `<tr><td colspan="2"><p style="margin:10px 0 0;font-size:12px;color:#4a7c59;font-weight:600;font-family:${sans}">&#10022; +${d.totals.pointsToEarn} Verde points earned on this order</p></td></tr>`
                          : ''
                      }
                    </table>

                    <hr style="margin:20px 0;border:none;border-top:1px solid #e5e0d6"/>

                    <!-- Delivery address + Payment -->
                    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr valign="top">
                        <td width="50%" style="padding-right:20px">
                          <p style="margin:0 0 8px;font-size:11px;letter-spacing:1.5px;color:#7a8a7b;text-transform:uppercase;font-family:${sans}">Shipping To</p>
                          <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#2d3a2e;font-family:${sans}">${addr.name}</p>
                          <p style="margin:0;font-size:13px;color:#5a6a5b;line-height:1.6;font-family:${sans}">${addrLine}<br/>${addr.city}, ${addr.state} ${addr.pincode}<br/>${addr.phone}</p>
                        </td>
                        <td width="50%" style="padding-left:20px;border-left:1px solid #e5e0d6">
                          <p style="margin:0 0 8px;font-size:11px;letter-spacing:1.5px;color:#7a8a7b;text-transform:uppercase;font-family:${sans}">Payment</p>
                          <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#2d3a2e;font-family:${sans}">${d.paymentMethod}</p>
                          <p style="margin:0;font-size:11px;color:#a8b3a4;word-break:break-all;font-family:${sans}">Ref: ${d.paymentId}</p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA buttons -->
          <tr>
            <td style="padding-bottom:36px">
              <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding-right:8px" width="50%">
                    <a href="${d.orderUrl}"
                       style="display:block;background-color:#4a7c59;color:#ffffff;text-decoration:none;border-radius:6px;padding:15px 20px;font-size:14px;font-weight:500;text-align:center;letter-spacing:0.5px;font-family:${sans}">
                      View Order Details
                    </a>
                  </td>
                  <td align="center" style="padding-left:8px" width="50%">
                    <a href="${d.invoiceUrl}"
                       style="display:block;background-color:#ffffff;color:#4a7c59;text-decoration:none;border-radius:6px;padding:15px 20px;font-size:14px;font-weight:500;text-align:center;border:1px solid #c2d4c2;letter-spacing:0.5px;font-family:${sans}">
                      Download Invoice
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping note -->
          <tr>
            <td align="center" style="padding:0 32px 8px">
              <p style="margin:0;font-size:14px;color:#7a8a7b;line-height:1.7;text-align:center;font-style:italic;font-family:${serif}">
                We&#8217;ll send another note when your order ships.<br/>
                Questions? Reply to this email &#8212; we&#8217;re always happy to help.
              </p>
            </td>
          </tr>

          <!-- Footer divider -->
          <tr>
            <td style="padding:32px 0 20px">
              <hr style="border:none;border-top:1px solid #e5e0d6;margin:0"/>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-bottom:40px">
              <p style="margin:0 0 4px;font-size:12px;color:#7a8a7b;font-family:${sans}">
                ${BUSINESS_COMPLIANCE.legalName}
              </p>
              <p style="margin:0 0 4px;font-size:12px;color:#a8b3a4;font-family:${sans}">
                ${formatPostalAddress()} &middot;
                <a href="https://www.verdebliss.com" style="color:#a8b3a4;text-decoration:none">verdebliss.com</a>
              </p>
              <p style="margin:0;font-size:11px;color:#c2cfc3;font-family:${sans}">
                Questions? ${BUSINESS_COMPLIANCE.emails.support} &middot; &copy; 2026 ${BUSINESS_COMPLIANCE.legalName}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}
