// app/layout.tsx: set the canonical host once
export const metadata = {
  metadataBase: new URL('https://www.cynbit.in'),
  openGraph: { images: ['/og.png'] }, // PNG, since SVG previews are usually ignored
};

// app/contact/page.tsx: and per page
export const metadata = {
  alternates: { canonical: '/contact' },
  openGraph: { url: '/contact' },
};
