// src/services/parseRefinedStory.ts
/**
 * "Title: ..." + "Xページ目:\n(本文)\n(空行)" 形式をパース。
 * 最終的に pages[] に1ページぶんの本文を格納。
 */
export function parseLabelAndBlankPages(lines: string[], pageCount: number): string[] {
    let titleFound = false;
    let currentPageLines: string[] = [];
    const pages: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // skip title line
        if (line.startsWith("Title:")) {
            continue;
        }

        if (line.match(/^\d+ページ目:$/)) {
            // 新ページ開始 → もし溜まってたらpush
            if (currentPageLines.length > 0) {
                pages.push(currentPageLines.join("\n").trim());
                currentPageLines = [];
            }
            // label行を保存
            currentPageLines.push(line);
        }
        else if (line === "") {
            // 空行 → ページ終了
            if (currentPageLines.length > 0) {
                pages.push(currentPageLines.join("\n").trim());
                currentPageLines = [];
            }
        } else {
            // 普通の本文行
            currentPageLines.push(line);
        }
    }

    // ループ後、余りがあればpush
    if (currentPageLines.length > 0) {
        pages.push(currentPageLines.join("\n").trim());
    }

    // ページ数に足りなければ空文字で補う
    while (pages.length < pageCount) {
        pages.push("");
    }
    return pages.slice(0, pageCount);
}