export const playfair = {
  fontFamily: "'Playfair Display', serif",
} as const;

export const metricsSurfaceClass =
  "rounded-2xl border border-gray-200/80 bg-white shadow-[0_12px_32px_-24px_rgba(15,23,42,0.12)]";

export const metricsSectionTitleClass =
  "text-[1.65rem] leading-[1.15] font-normal text-black tracking-tight font-serif";

export const metricsEyebrowClass =
  "text-[10px] tracking-[0.18em] uppercase font-medium text-gray-400";

export const withAlpha = (color: string, alphaHex: string) => {
  if (color.startsWith("#") && color.length === 7) {
    return `${color}${alphaHex}`;
  }

  return color;
};
