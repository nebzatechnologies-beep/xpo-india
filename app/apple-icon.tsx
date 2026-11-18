import { ImageResponse } from 'next/og';

// Apple touch icon — generated so no binary asset is needed.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#C8102E',
          color: '#ffffff',
          fontSize: 82,
          fontWeight: 800,
          letterSpacing: -4,
        }}
      >
        XPO
      </div>
    ),
    { ...size }
  );
}
