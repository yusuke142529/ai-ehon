// src/app/[locale]/ehon/[id]/viewer/components/types.ts

/**
 * 絵本フリップブックで使用するページデータ型
 */
export type PageData = {
    id: number;
    pageNumber: number;
    text: string;
    imageUrl?: string | null;
  };