import './globals.css'

export const metadata = {
  title: 'OGBESA Temple - Ifa Priesthood Portal',
  description: 'Sacred consultations and records management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
