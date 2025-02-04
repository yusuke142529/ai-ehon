import { extendTheme, type ThemeConfig, type ThemeOverride } from "@chakra-ui/react";

/* ------------------------------------------------------
  1) カラーモード & cssVarPrefix
------------------------------------------------------- */
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
  cssVarPrefix: "myapp",
};

/* ------------------------------------------------------
  2) Breakpoints (レスポンシブ)
     createBreakpoints は不要。単純にオブジェクトとして定義。
------------------------------------------------------- */
const breakpoints = {
  sm: "360px",
  md: "768px",
  lg: "992px",
  xl: "1200px",
  "2xl": "1440px",
};

// 必要であればコンテナ幅なども別途定義
const containerSizes = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1200px",
};

/* ------------------------------------------------------
  3) カラー拡張
     - ネイビー (brand) / オレンジ (accent)
     - success, warning, danger は任意
------------------------------------------------------- */
const colors = {
  brand: {
    50: "#F2F6FA",
    100: "#DCE4EE",
    200: "#B4C3DB",
    300: "#8AA2C7",
    400: "#6381B4",
    500: "#3C60A2", // メインのネイビー
    600: "#2E4B80",
    700: "#1F355E",
    800: "#121E3A",
    900: "#070B1A",
  },
  accent: {
    50: "#FFEFE8",
    100: "#FFDCCB",
    200: "#FFB899",
    300: "#FF9264",
    400: "#FF6D2F",
    500: "#F55200", // メインのオレンジ
    600: "#D84800",
    700: "#B93B00",
    800: "#7A2600",
    900: "#3C1300",
  },
  success: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#10B981",
    600: "#059669",
    700: "#047857",
    800: "#065F46",
    900: "#064E3B",
  },
  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
  danger: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
  },
};

/* ------------------------------------------------------
  4) Semantic Tokens (ダークモード時の調整含む)
------------------------------------------------------- */
const semanticTokens = {
  colors: {
    // 背景
    "bg.primary": {
      default: "#FFFFFF",
      _dark: "#1A1A1A",
    },
    "bg.secondary": {
      default: "#F7F7F7",
      _dark: "#242424",
    },
    "bg.tertiary": {
      default: "#EFEFEF",
      _dark: "#2E2E2E",
    },

    // 文字色
    "fg.primary": {
      default: "#333333",
      _dark: "#EEEEEE",
    },
    "fg.secondary": {
      default: "#666666",
      _dark: "#999999",
    },

    // ブランディング
    "brand.primary": {
      default: "brand.500",
      _dark: "brand.300",
    },
    "brand.accent": {
      default: "accent.500",
      _dark: "accent.300",
    },
  },
  space: {
    // セクション余白
    "section.lg": {
      default: "6rem",
      _dark: "5rem",
    },
    "section.md": {
      default: "4rem",
      _dark: "3.5rem",
    },
    "section.sm": {
      default: "2rem",
      _dark: "1.5rem",
    },
    // カード内パディング例
    "card.padding": {
      default: "1.5rem",
      _dark: "1.5rem",
    },
  },
};

/* ------------------------------------------------------
  5) Fluid Typography + フォント設定
------------------------------------------------------- */
const fontSizes = {
  xs: "clamp(0.75rem, 1vw, 0.875rem)",
  sm: "clamp(0.875rem, 1vw, 1rem)",
  md: "clamp(1rem, 1.2vw, 1.125rem)",
  lg: "clamp(1.25rem, 2vw, 1.5rem)",
  xl: "clamp(1.5rem, 3vw, 2rem)",
  "2xl": "clamp(2rem, 5vw, 3rem)",
};

const fonts = {
  heading: "'Inter', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "Menlo, monospace",
};

const lineHeights = {
  normal: 1.5,
  shorter: 1.25,
  short: 1.3,
  tall: 1.7,
};

const letterSpacings = {
  tighter: "-0.02em",
  tight: "-0.01em",
  normal: "0",
  wide: "0.01em",
  wider: "0.02em",
};

/* ------------------------------------------------------
  6) グローバルなトランジション & モーションプリセット
------------------------------------------------------- */
const transitions = {
  fast: "all 0.1s ease-in-out",
  normal: "all 0.2s ease-in-out",
  slow: "all 0.3s ease",
};

const motionPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.4 },
  },
  bounceIn: {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  },
};

/* ------------------------------------------------------
  7) グローバルスタイル
     - focus ring
     - カラーモード切り替えトランジション
------------------------------------------------------- */
const styles = {
  global: {
    "*:focus:not(:focus-visible)": {
      outline: "none",
      boxShadow: "none",
    },
    ":focus-visible": {
      outline: "2px solid var(--myapp-colors-brand-primary)",
      outlineOffset: "2px",
    },

    "html, body": {
      bg: "bg.primary",
      color: "fg.primary",
      transition: "background-color 0.3s ease",
      lineHeight: "normal",
    },

    section: {
      marginBottom: "var(--myapp-space-section-md)",
    },
  },
};

/* ------------------------------------------------------
  8) コンポーネント拡張 (Button, Heading, etc.)
------------------------------------------------------- */
const components = {
  Button: {
    baseStyle: {
      borderRadius: "md",
      fontWeight: "semibold",
      transition: transitions.normal,
      _focusVisible: {
        boxShadow: "0 0 0 3px var(--myapp-colors-brand-primary)",
      },
    },
    variants: {
      solid: {
        bg: "brand.primary",
        color: "white",
        _hover: {
          bg: "brand.600",
        },
        _active: {
          bg: "brand.700",
        },
      },
      outline: {
        border: "2px solid",
        borderColor: "brand.primary",
        color: "brand.primary",
        _hover: {
          bg: "brand.50", // ネイビー系が薄く乗る
        },
      },
      ghost: {
        color: "brand.primary",
        _hover: {
          bg: "brand.50",
        },
      },
    },
    defaultProps: {
      variant: "solid",
    },
  },

  Heading: {
    baseStyle: {
      fontFamily: "heading",
      color: "fg.primary",
    },
    sizes: {
      xl: {
        fontSize: "2xl",
        lineHeight: 1.2,
      },
      lg: {
        fontSize: "xl",
      },
      md: {
        fontSize: "lg",
      },
      sm: {
        fontSize: "md",
      },
    },
    defaultProps: {
      size: "lg",
    },
  },

  // 必要に応じて他のコンポーネント (Input, Drawer, Modal, etc.) も拡張
};

/* ------------------------------------------------------
  9) ExtendTheme で一括拡張
------------------------------------------------------- */
const overrides: ThemeOverride = {
  config,
  breakpoints,
  colors,
  semanticTokens,
  fontSizes,
  fonts,
  lineHeights,
  letterSpacings,
  transitions,
  motionPresets,
  styles,
  components,

  // カスタム追加 (レイアウト設定等)
  layout: {
    containerSizes,
  },
};

const theme = extendTheme(overrides);

export default theme;
