/**
 * scripts/check-i18n-keys.ts
 * 
 * コード中で呼ばれている
 *   `useTranslations("namespace")` / `getTranslator(_, "namespace")`
 *   → そこからの `t("someKey")` / `t.raw("prefix")` / `t.rich("someKey")` を抽出し、
 * messages/ja.json・messages/en.json 等と比較して Missing/Unused キーを検出。
 *
 * さらに拡張として、
 * 1) 関数引数 (key:string)=>string も翻訳関数とみなし、 t("someKey") の呼び出しを拾う
 * 2) オブジェクト分割パラメータ ({ t, ... }) 内の t も検出する
 */

import { Project, SyntaxKind } from "ts-morph";
import fs from "fs";
import path from "path";

const TS_CONFIG_PATH = path.resolve("tsconfig.json");
const SRC_GLOB = "src/**/*.{ts,tsx}";
const MESSAGES_DIR = path.resolve("messages");
const SUPPORTED_LOCALES = ["ja", "en"];

import type { 
  ParameterDeclaration, 
  FunctionDeclaration, 
  ArrowFunction, 
  FunctionExpression 
} from "ts-morph";

interface UsedKeysMap {
  [namespace: string]: Set<string>;
}
interface PrefixUsageMap {
  [namespace: string]: Set<string>;
}

const usedKeysMap: UsedKeysMap = {};
const prefixUsageMap: PrefixUsageMap = {};

/** fallback 用 namespace (関数引数の t に対応) */
const FALLBACK_NAMESPACE = "common";

/**
 * 簡易的に「(key: string)=>string」かどうか判定するヘルパー
 */
function isTranslateFunctionParameter(param: ParameterDeclaration): boolean {
  const paramType = param.getType();
  const callSignatures = paramType.getCallSignatures();
  if (callSignatures.length === 1) {
    const sig = callSignatures[0];
    const returnTypeText = sig.getReturnType().getText();
    // 引数がちょうど1つ & 戻り値が string なら「(key: string) => string」とみなす
    if (sig.getParameters().length === 1 && returnTypeText === "string") {
      return true;
    }
  }
  return false;
}

/**
 * オブジェクト分割パラメータ ({ t, ... }) 内の要素をチェックし、
 * その要素が (key:string)=>string なら fallback namespace (common) として登録
 */
function checkBindingPattern(
  param: ParameterDeclaration, 
  paramTranslatorMap: Map<string, string>
) {
  const bindingPattern = param.getFirstChildByKind(SyntaxKind.ObjectBindingPattern);
  if (!bindingPattern) return;

  const bindingElements = bindingPattern.getElements();
  for (const elem of bindingElements) {
    const nameNode = elem.getNameNode();
    const nameText = nameNode.getText(); // 例: "t"
    const elemType = elem.getType();
    const callSigs = elemType.getCallSignatures();
    if (callSigs.length === 1) {
      const sig = callSigs[0];
      if (sig.getParameters().length === 1 && sig.getReturnType().getText() === "string") {
        // これは t: (key:string)=>string と同等
        paramTranslatorMap.set(nameText, FALLBACK_NAMESPACE);
        if (!usedKeysMap[FALLBACK_NAMESPACE]) {
          usedKeysMap[FALLBACK_NAMESPACE] = new Set<string>();
        }
      }
    }
  }
}

/**
 * コード解析して UsedKeys / prefixUsage を集める
 */
async function collectUsedKeys() {
  const project = new Project({
    tsConfigFilePath: TS_CONFIG_PATH,
  });
  project.addSourceFilesAtPaths(SRC_GLOB);

  const sourceFiles = project.getSourceFiles();

  for (const sourceFile of sourceFiles) {
    // すべての CallExpression を取得
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    // translatorVarMap: useTranslations / getTranslator で取得された変数名とその namespace
    const translatorVarMap = new Map<string, string>();

    // 1) useTranslations("xyz") / getTranslator(..., "xyz") を解析
    for (const ce of callExpressions) {
      const exprText = ce.getExpression().getText();
      if (exprText === "useTranslations" || exprText === "getTranslator") {
        const args = ce.getArguments();
        if (args.length > 0) {
          const lastArg = args[args.length - 1];
          if (lastArg.getKind() === SyntaxKind.StringLiteral) {
            const ns = lastArg.getText().replace(/['"]/g, "");
            const parentDecl = ce.getParentIfKind(SyntaxKind.VariableDeclaration);
            if (parentDecl) {
              const varName = parentDecl.getName();
              translatorVarMap.set(varName, ns);

              if (!usedKeysMap[ns]) usedKeysMap[ns] = new Set<string>();
              if (!prefixUsageMap[ns]) prefixUsageMap[ns] = new Set<string>();
            }
          }
        }
      }
    }

    // 2) 関数のパラメータに (key:string)=>string があれば fallback namespace "common"
    const fnDecls = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
    const arrowFuncs = sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction);
    const fnExprs = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionExpression);

    // paramName -> namespace
    const paramTranslatorMap = new Map<string, string>();

    const checkParams = (nodes: (FunctionDeclaration | ArrowFunction | FunctionExpression)[]) => {
      for (const fn of nodes) {
        const params = fn.getParameters();
        for (const p of params) {
          // (A) 直接 t: (key:string)=>string の場合
          if (isTranslateFunctionParameter(p)) {
            const paramName = p.getName();
            paramTranslatorMap.set(paramName, FALLBACK_NAMESPACE);
            if (!usedKeysMap[FALLBACK_NAMESPACE]) {
              usedKeysMap[FALLBACK_NAMESPACE] = new Set<string>();
            }
          }
          // (B) オブジェクト分割パラメータの場合 ({ t, ... })
          if (p.getFirstChildByKind(SyntaxKind.ObjectBindingPattern)) {
            checkBindingPattern(p, paramTranslatorMap);
          }
        }
      }
    };

    checkParams(fnDecls);
    checkParams(arrowFuncs);
    checkParams(fnExprs);

    // 3) callExpressions を再度見て、translatorVarMap / paramTranslatorMap からキー取得
    for (const ce of callExpressions) {
      const expression = ce.getExpression();

      // a) t.raw("prefix"), t.rich("someKey") など PropertyAccess
      if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
        const propAccess = expression.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
        const objName = propAccess.getExpression().getText(); // 例: "t"
        const propName = propAccess.getName();                // 例: "raw", "rich"...
        const nsOrFallback = translatorVarMap.get(objName) || paramTranslatorMap.get(objName);

        if (nsOrFallback) {
          const args = ce.getArguments();
          if (args.length > 0) {
            const firstArg = args[0];
            if (firstArg.getKind() === SyntaxKind.StringLiteral) {
              const keyName = firstArg.getText().replace(/['"]/g, "");
              if (propName === "raw") {
                // raw("prefix") → prefixUsageMap
                if (!prefixUsageMap[nsOrFallback]) prefixUsageMap[nsOrFallback] = new Set<string>();
                prefixUsageMap[nsOrFallback].add(keyName);
              } else if (propName === "rich") {
                // rich("someKey") は t("someKey") と同じ扱い
                usedKeysMap[nsOrFallback].add(keyName);
              } else {
                // 他のプロパティ (例: t.somethingElse("key")) → もし必要なら追加
                // ここでは fallback で "t("someKey")" と同じ扱いにする
                usedKeysMap[nsOrFallback].add(keyName);
              }
            }
          }
        }
      } else {
        // b) t("someKey") 形式 (直接 CallExpression: t(...)
        const exprText = expression.getText();
        const nsOrFallback = translatorVarMap.get(exprText) || paramTranslatorMap.get(exprText);
        if (nsOrFallback) {
          const args = ce.getArguments();
          if (args.length > 0) {
            const firstArg = args[0];
            if (firstArg.getKind() === SyntaxKind.StringLiteral) {
              const keyName = firstArg.getText().replace(/['"]/g, "");
              usedKeysMap[nsOrFallback].add(keyName);
            }
          }
        }
      }
    }
  }
}

// -----------------------------------------------------
// 翻訳ファイルを読み取り、定義済みキーを収集
// -----------------------------------------------------

interface DefinedKeys {
  [locale: string]: {
    [namespace: string]: Set<string>;
  };
}
const definedKeys: DefinedKeys = {};

function collectDefinedKeys() {
  for (const loc of SUPPORTED_LOCALES) {
    const filePath = path.join(MESSAGES_DIR, `${loc}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: ${filePath} not found.`);
      continue;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    let jsonObj: any;
    try {
      jsonObj = JSON.parse(raw);
    } catch (err) {
      console.error(`Could not parse JSON in ${filePath}:`, err);
      continue;
    }
    if (!definedKeys[loc]) {
      definedKeys[loc] = {};
    }
    for (const ns of Object.keys(jsonObj)) {
      if (!definedKeys[loc][ns]) {
        definedKeys[loc][ns] = new Set<string>();
      }
      function traverse(obj: any, parentKey: string) {
        for (const k of Object.keys(obj)) {
          const val = obj[k];
          const newKey = parentKey ? `${parentKey}.${k}` : k;
          if (val && typeof val === "object") {
            traverse(val, newKey);
          } else {
            // 実際の文字列が入っている
            definedKeys[loc][ns].add(newKey);
          }
        }
      }
      const nsObj = jsonObj[ns];
      if (nsObj && typeof nsObj === "object") {
        traverse(nsObj, "");
      }
    }
  }
}

// -----------------------------------------------------
// Missing / Unused キーを判定
// -----------------------------------------------------

interface Issue {
  type: "missing" | "unused";
  locale: string;
  namespace: string;
  key: string;
}

async function main() {
  console.log("Collecting used keys from source code...");
  await collectUsedKeys();

  console.log("Collecting defined keys from translation files...");
  collectDefinedKeys();

  // prefix usage の展開 (例: t.raw("sections") により sections.xxx を used とみなす)
  for (const ns of Object.keys(prefixUsageMap)) {
    const prefixes = prefixUsageMap[ns];
    for (const prefix of prefixes) {
      for (const locale of SUPPORTED_LOCALES) {
        const nsSet = definedKeys[locale]?.[ns];
        if (!nsSet) continue;
        for (const definedKey of nsSet) {
          if (definedKey === prefix || definedKey.startsWith(prefix + ".")) {
            usedKeysMap[ns].add(definedKey);
          }
        }
      }
    }
  }

  const missingIssues: Issue[] = [];
  const unusedIssues: Issue[] = [];

  // missing: コードで使われたキーが翻訳ファイルに存在しない場合
  for (const ns of Object.keys(usedKeysMap)) {
    for (const key of usedKeysMap[ns]) {
      for (const locale of SUPPORTED_LOCALES) {
        const nsKeys = definedKeys[locale]?.[ns];
        if (!nsKeys || !nsKeys.has(key)) {
          missingIssues.push({
            type: "missing",
            locale,
            namespace: ns,
            key,
          });
        }
      }
    }
  }

  // unused: 翻訳ファイルに存在するが、コードで使われていないキーの場合
  for (const locale of Object.keys(definedKeys)) {
    for (const ns of Object.keys(definedKeys[locale])) {
      const fileKeys = definedKeys[locale][ns];
      const usedKeys = usedKeysMap[ns] || new Set<string>();
      for (const k of fileKeys) {
        if (!usedKeys.has(k)) {
          unusedIssues.push({
            type: "unused",
            locale,
            namespace: ns,
            key: k,
          });
        }
      }
    }
  }

  if (missingIssues.length === 0 && unusedIssues.length === 0) {
    console.log("All good! No missing or unused i18n keys found.");
    process.exit(0);
  }

  if (missingIssues.length > 0) {
    console.log("\n=== Missing keys ===");
    for (const issue of missingIssues) {
      console.log(`  [${issue.locale}] ${issue.namespace}.${issue.key}`);
    }
  }

  if (unusedIssues.length > 0) {
    console.log("\n=== Unused keys ===");
    for (const issue of unusedIssues) {
      console.log(`  [${issue.locale}] ${issue.namespace}.${issue.key}`);
    }
  }

  // CI等で失敗とする場合
  process.exit(1);
}

main().catch((e) => {
  console.error("Error in check-i18n-keys:", e);
  process.exit(1);
});
