import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.CLERK_PUBLISHABLE_KEY = "${process.env.NEXT_APP_CLERK_PUBLISHABLE_KEY || ''}";
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 