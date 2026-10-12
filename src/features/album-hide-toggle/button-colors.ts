type AlbumActionTone = {
  background: string;
  border: string;
  color: string;
  hoverBackground: string;
  hoverBorder: string;
  hoverColor: string;
};

export const albumActionTones = {
  hide: {
    background: "hsla(210, 48%, 42%, 0.2)",
    border: "hsla(210, 55%, 62%, 0.72)",
    color: "#93c5fd",
    hoverBackground: "hsla(210, 48%, 42%, 0.34)",
    hoverBorder: "hsla(210, 60%, 70%, 0.9)",
    hoverColor: "#bfdbfe",
  },
  unhide: {
    background: "#0369a1",
    border: "#38bdf8",
    color: "#f0f9ff",
    hoverBackground: "#0284c7",
    hoverBorder: "#7dd3fc",
    hoverColor: "#ffffff",
  },
  exclude: {
    background: "hsla(350, 42%, 38%, 0.22)",
    border: "hsla(350, 48%, 58%, 0.72)",
    color: "#e8a0b0",
    hoverBackground: "hsla(350, 42%, 38%, 0.36)",
    hoverBorder: "hsla(350, 52%, 66%, 0.9)",
    hoverColor: "#f3c4ce",
  },
  include: {
    background: "#9f1239",
    border: "#fb7185",
    color: "#fff1f2",
    hoverBackground: "#be123c",
    hoverBorder: "#fda4af",
    hoverColor: "#ffffff",
  },
} as const satisfies Record<string, AlbumActionTone>;

export function toneCss(name: keyof typeof albumActionTones): string {
  const t = albumActionTones[name];
  return `
.ext-btn--${name} {
  background: ${t.background};
  border-color: ${t.border};
  color: ${t.color};
}

.ext-btn--${name}:hover:not(:disabled) {
  background: ${t.hoverBackground};
  border-color: ${t.hoverBorder};
  color: ${t.hoverColor};
}
`.trim();
}
