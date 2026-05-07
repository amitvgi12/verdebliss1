import ContactClient from './ContactClient'

export const metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the VerdeBliss team for skincare advice, order support and partnership enquiries.',
  alternates: { canonical: 'https://www.verdebliss.com/contact' },
}

export default function ContactPage() {
  return <ContactClient />
}
