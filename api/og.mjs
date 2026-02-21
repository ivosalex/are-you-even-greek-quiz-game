import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default async function handler() {
  // Load Cinzel font (serif Greek-style) from Google Fonts
  let cinzelData;
  try {
    const cssRes = await fetch(
      'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap',
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    );
    const css = await cssRes.text();
    const urlMatch = css.match(/url\(([^)]+)\)/);
    if (urlMatch) {
      const fontRes = await fetch(urlMatch[1]);
      cinzelData = await fontRes.arrayBuffer();
    }
  } catch (_) {
    // font load failed — fall back to system serif
  }

  const fonts = cinzelData
    ? [{ name: 'Cinzel', data: cinzelData, weight: 700 }]
    : [];

  // Helper: inline style objects (Satori only supports subset of CSS, no shorthand)
  const gold = '#c9a84c';
  const cream = '#e8d5a0';
  const dark = '#06050f';

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(160deg, #1a1440 0%, #0c0a24 50%, #06050f 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: cinzelData ? 'Cinzel' : 'Georgia, serif',
        },
        children: [

          // ── Gold top border ───────────────────────────────────────────────
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '4px',
                background: `linear-gradient(90deg, transparent, ${gold}, transparent)`,
              },
            },
          },

          // ── Gold bottom border ────────────────────────────────────────────
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                height: '4px',
                background: `linear-gradient(90deg, transparent, ${gold}, transparent)`,
              },
            },
          },

          // ── Left column ───────────────────────────────────────────────────
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                left: '60px',
                top: '0px',
                width: '40px',
                height: '630px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              },
              children: [
                // capital (top)
                { type: 'div', props: { style: { width: '40px', height: '16px', background: gold, opacity: 0.8, borderRadius: '2px 2px 0 0' } } },
                { type: 'div', props: { style: { width: '30px', height: '8px', background: gold, opacity: 0.6 } } },
                // shaft
                { type: 'div', props: { style: { width: '20px', flex: 1, background: `linear-gradient(90deg, ${gold}33, ${gold}99, ${gold}33)` } } },
                // base
                { type: 'div', props: { style: { width: '30px', height: '8px', background: gold, opacity: 0.6 } } },
                { type: 'div', props: { style: { width: '40px', height: '16px', background: gold, opacity: 0.8, borderRadius: '0 0 2px 2px' } } },
              ],
            },
          },

          // ── Right column ──────────────────────────────────────────────────
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                right: '60px',
                top: '0px',
                width: '40px',
                height: '630px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              },
              children: [
                { type: 'div', props: { style: { width: '40px', height: '16px', background: gold, opacity: 0.8, borderRadius: '2px 2px 0 0' } } },
                { type: 'div', props: { style: { width: '30px', height: '8px', background: gold, opacity: 0.6 } } },
                { type: 'div', props: { style: { width: '20px', flex: 1, background: `linear-gradient(90deg, ${gold}33, ${gold}99, ${gold}33)` } } },
                { type: 'div', props: { style: { width: '30px', height: '8px', background: gold, opacity: 0.6 } } },
                { type: 'div', props: { style: { width: '40px', height: '16px', background: gold, opacity: 0.8, borderRadius: '0 0 2px 2px' } } },
              ],
            },
          },

          // ── Omega watermark ───────────────────────────────────────────────
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '420px',
                color: gold,
                opacity: 0.06,
                lineHeight: 1,
                fontFamily: cinzelData ? 'Cinzel' : 'Georgia, serif',
              },
              children: 'Ω',
            },
          },

          // ── Stars ─────────────────────────────────────────────────────────
          ...[
            [120, 80], [300, 50], [480, 100], [700, 40], [870, 90], [1050, 60],
            [150, 540], [400, 580], [600, 560], [800, 590], [1000, 555],
            [200, 300], [1000, 280], [950, 400],
          ].map(([x, y], i) => ({
            type: 'div',
            props: {
              key: String(i),
              style: {
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: i % 3 === 0 ? '3px' : '2px',
                height: i % 3 === 0 ? '3px' : '2px',
                borderRadius: '50%',
                background: cream,
                opacity: 0.5 + (i % 3) * 0.15,
              },
            },
          })),

          // ── Main content (centered) ───────────────────────────────────────
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                gap: '0px',
                paddingTop: '24px',
              },
              children: [

                // Lightning bolt icon
                {
                  type: 'div',
                  props: {
                    style: { fontSize: '40px', lineHeight: 1, marginBottom: '12px' },
                    children: '⚡',
                  },
                },

                // "ARE YOU EVEN"
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '64px',
                      fontWeight: 400,
                      color: cream,
                      letterSpacing: '0.18em',
                      lineHeight: 1,
                      textAlign: 'center',
                    },
                    children: 'ARE YOU EVEN',
                  },
                },

                // "GREEK?"
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '148px',
                      fontWeight: 700,
                      color: gold,
                      letterSpacing: '0.06em',
                      lineHeight: 1,
                      textAlign: 'center',
                      marginTop: '-4px',
                    },
                    children: 'GREEK?',
                  },
                },

                // Divider: ── ✦ ──
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '20px',
                      marginBottom: '20px',
                    },
                    children: [
                      { type: 'div', props: { style: { width: '120px', height: '1px', background: `linear-gradient(90deg, transparent, ${gold})` } } },
                      { type: 'div', props: { style: { width: '8px', height: '8px', background: gold, borderRadius: '50%' } } },
                      { type: 'div', props: { style: { color: gold, fontSize: '18px', lineHeight: 1 }, children: '✦' } },
                      { type: 'div', props: { style: { width: '8px', height: '8px', background: gold, borderRadius: '50%' } } },
                      { type: 'div', props: { style: { width: '120px', height: '1px', background: `linear-gradient(90deg, ${gold}, transparent)` } } },
                    ],
                  },
                },

                // Subtitle
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '22px',
                      fontWeight: 400,
                      color: cream,
                      opacity: 0.75,
                      letterSpacing: '0.22em',
                      textAlign: 'center',
                    },
                    children: 'A VOICE TRIAL OF ANCIENT WISDOM',
                  },
                },

                // URL
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '18px',
                      color: gold,
                      opacity: 0.6,
                      letterSpacing: '0.12em',
                      marginTop: '18px',
                    },
                    children: 'areyouevengreek.com',
                  },
                },

              ],
            },
          },

        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts,
    },
  );
}
