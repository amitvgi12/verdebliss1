export const dynamic = 'force-dynamic'

import QuizClient from './QuizClient'

export const metadata = {
  title: 'Skin Quiz — Find Your Perfect Routine',
  description:
    'Answer 5 questions to discover your personalised VerdeBliss routine. Our skin quiz matches your skin type and concerns to certified organic products.',
  alternates: { canonical: 'https://www.verdebliss.com/quiz' },
}

export default function QuizPage() {
  return <QuizClient />
}
