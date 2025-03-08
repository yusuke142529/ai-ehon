"use client";

import React, { useState, useEffect, forwardRef } from "react";
import type {
  FlipBookWrapperProps,
  FlipBookInstance as TFlipBookInstance,
} from "./types";

/** 
 * 別ファイルで定義した型を再エクスポートしてあげることで
 * `import { FlipBookInstance } from "./FlipBookWrapper";`
 * のようにインポートできるようになります。
 */
export type FlipBookInstance = TFlipBookInstance;

/**
 * react-pageflip の default export が実際には
 *   React.MemoExoticComponent<
 *     React.ForwardRefExoticComponent<
 *       FlipBookWrapperProps & React.RefAttributes<FlipBookInstance>
 *     >
 *   >
 * のような形なので、それを `ImportedHTMLFlipBookType` として定義。
 */
type ImportedHTMLFlipBookType = React.MemoExoticComponent<
  React.ForwardRefExoticComponent<
    FlipBookWrapperProps & React.RefAttributes<FlipBookInstance>
  >
>;

/** モジュールキャッシュ用。最初だけ dynamic import して再利用する */
let HTMLFlipBookModule: ImportedHTMLFlipBookType | null = null;

const FlipBookWrapper = forwardRef<FlipBookInstance, FlipBookWrapperProps>(
  function FlipBookWrapper(props, ref) {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      let isMounted = true;
      if (!HTMLFlipBookModule) {
        import("react-pageflip")
          .then((mod) => {
            if (isMounted) {
              /**
               * ライブラリ側の型とこちらの定義が少し異なる可能性があるので、
               * `as unknown as ImportedHTMLFlipBookType` でアサーションするやり方もあります。
               */
              HTMLFlipBookModule = mod.default as ImportedHTMLFlipBookType;
              setIsLoaded(true);
            }
          })
          .catch((err) => {
            console.error("Failed to load react-pageflip:", err);
          });
      } else {
        setIsLoaded(true);
      }

      return () => {
        isMounted = false;
      };
    }, []);

    if (!isLoaded || !HTMLFlipBookModule) {
      return (
        <div style={{ width: props.width, height: props.height }}>
          Loading flipbook...
        </div>
      );
    }

    // ここでは厳密な型定義済みなので <HTMLFlipBook> として JSX に書けます
    const HTMLFlipBook = HTMLFlipBookModule;
    return (
      <HTMLFlipBook ref={ref} {...props}>
        {props.children}
      </HTMLFlipBook>
    );
  }
);

FlipBookWrapper.displayName = "FlipBookWrapper";
export default FlipBookWrapper;