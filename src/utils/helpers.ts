// src/utils/helpers.ts

export function chunkArray<T>(arr: T[], size: number): T[][] {
    const result: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size))
    }
    return result
  }
  
  export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // "fetcher" という名前でエクスポート
export async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch error: ${res.status}`);
  }
  return res.json();
}