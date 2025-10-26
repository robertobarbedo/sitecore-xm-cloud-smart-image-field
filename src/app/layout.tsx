import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sitecore Marketplace Extensions',
  description: 'Sitecore Marketplace extension starter application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{__html: `
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background-color: #ffffff;
            color: #3B3B3B;
            font-size: 0.8125rem;
          }
          
          html, body {
            height: 100%;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  )
}
