import { ServerStyleSheets } from "@material-ui/core";
import crypto from "crypto";
import Document, { Head, Html, Main, NextScript } from "next/document";
import React from "react";

const cspHashOf = (text: string): string => {
  const hash = crypto.createHash("sha256");
  hash.update(text);
  return `'sha256-${hash.digest("base64")}'`;
};

//const onboardStyles = `'sha256-b9ziL8IJLxwegMVUIsr1Xonaxx9fkYcSKScBVxty+b8=' 'sha256-BgOP/ML7iRgKpqjhNfXke6AKgTv2KiGYPBitEng05zo=' 'sha256-WEkB3t+nfyfJBFAy7S1VN7AGcsstGkPtH/sEme5McoM=' 'sha256-1q71146AbRaIXMXEynPmTgkuaVhiUlRiha3g3LjARmY=' 'sha256-2HcLdA7hf+eZilVMBcZB4VFlx8PSxhoPt5BZCxc/85s=' 'sha256-WLOC06MT+Dqzsp7Cy382ZCzwQQ4P0EneoLyM/Yao4rw=' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=' 'sha256-pA817lKKQj1w2GkmEolfMacD1BU4+jNuNTl3cKD16f4=' 'sha256-NYlZ6i82DNnjefyMZyP17TIpq26QW0lg5yF6PDEOpYA=' 'sha256-nDu9nFngbf6yKkK8kNYFmU+5A6Ew5P34jdNXAyYFeFw=' 'sha256-NB1qv9+tZOZ0Iy3B+6Y04eDYY2YS+HLIBGfZ3o57ek0='`;

export default class MyDocument extends Document {
  render() {
    //const nonce = crypto.randomBytes(8).toString("base64");

    let csp = `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' ${cspHashOf(
      NextScript.getInlineScriptSource(this.props)
    )}; `;

    if (process.env.NODE_ENV !== "production") {
      csp = `style-src 'self' 'unsafe-inline'; font-src 'self' data:; default-src 'self'; img-src 'self' data:; script-src 'unsafe-eval' 'self' ${cspHashOf(
        NextScript.getInlineScriptSource(this.props)
      )}; `;
    }

    csp += `connect-src 'self' *.sentry.io;`;

    return (
      <Html>
        <Head>
          <meta httpEquiv="Content-Security-Policy" content={csp} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with server-side generation (SSG).
MyDocument.getInitialProps = async (ctx) => {
  // Resolution order
  //
  // On the server:
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. document.getInitialProps
  // 4. app.render
  // 5. page.render
  // 6. document.render
  //
  // On the server with error:
  // 1. document.getInitialProps
  // 2. app.render
  // 3. page.render
  // 4. document.render
  //
  // On the client
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. app.render
  // 4. page.render

  // Render app and page and get the context of the page with collected side effects.
  const sheets = new ServerStyleSheets();
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => sheets.collect(<App {...props} />),
    });

  const initialProps = await Document.getInitialProps(ctx);

  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: [
      ...React.Children.toArray(initialProps.styles),
      sheets.getStyleElement(),
    ],
  };
};
