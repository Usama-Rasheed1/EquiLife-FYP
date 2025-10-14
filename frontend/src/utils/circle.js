// Utility helpers for circular progress SVGs
export function getCircleDash(radius = 16, progress = 0) {
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return {
    circumference,
    strokeDasharray,
    strokeDashoffset,
  };
}

export default getCircleDash;
