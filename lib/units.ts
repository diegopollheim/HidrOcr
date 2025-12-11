export function digitsToLiters(digits: string[]): number {
  const pad = (s: string) => (s && /\d/.test(s) ? s : "0");
  const d = Array(6)
    .fill("0")
    .map((_, i) => pad(digits[i] ?? ""));
  const m3Int = Number(`${d[0]}${d[1]}${d[2]}${d[3]}`);
  const hundredsL = Number(d[4]);
  const tensL = Number(d[5]);
  const liters = m3Int * 1000 + hundredsL * 100 + tensL * 10;
  return liters;
}

export function formatLiters(liters: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.max(0, Math.floor(liters))) + " L";
}

export function formatCubicMetersFromLiters(liters: number): string {
  const m3 = liters / 1000;
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(m3) + " m³";
}
