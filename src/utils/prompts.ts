export function createImagePrompts(pages: string[]): string[] {
    // ページ本文からパステル調、絵本風などキーワードを付与
    return pages.map(text => `パステル調, 絵本風, ${text}`)
}