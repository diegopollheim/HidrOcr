const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function extractReadingFromImage(_file: File): Promise<number> {

  await delay(5000);
  // throw new Error("processing_failed");
  const base = Math.floor(Date.now() / 100000) % 1000;
  return 1000 + base;
}
