/** @type {import('tailwindcss').Config} */
import plugin from "tailwindcss/plugin";

const BASE = 16;
const getValues = (px) => ({ tw: px / 4, rem: `${px / BASE}rem` });
const pxToRem = (px) => getValues(px).rem;
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      boxShadow: {
        dropdown: "0px 41px 158px 0px rgba(0, 0, 0, 0.06), 0px 12px 48px 0px rgba(0, 0, 0, 0.04), 0px 5px 20px 0px rgba(0, 0, 0, 0.03), 0px 2px 7px 0px rgba(0, 0, 0, 0.02);",
      },
      spacing: {
        6.5: pxToRem(26),
        12.5: pxToRem(50),
        15: pxToRem(60),
        18: pxToRem(72),
        25: pxToRem(100),
        26: pxToRem(104),
        50: pxToRem(200),
      },
      gap: {},
      colors: {
        blue: "#6874E8",
        green: "#2CA58D",
        black: "#1B1E2E",
        red: "#F9564F",
        "n-60": "#75778A",
        "n-40": "#A3A4B2",
        "n-5": "#F4F4F6",
        "n-3": "#F8F8F9",
      },
      fontSize: {
        "seo-1": [
          pxToRem(52),
          {
            lineHeight: "0.8769",
            letterSpacing: "-3.12px",
            fontWeight: "400",
          },
        ],
        "seo-2": [
          pxToRem(44),
          {
            lineHeight: "0.77273",
            letterSpacing: "-2.64px",
            fontWeight: "400",
          },
        ],
        "seo-2-big": [
          pxToRem(72),
          {
            lineHeight: "0.72",
            letterSpacing: "-5.04px",
            fontWeight: "400",
          },
        ],
        "seo-3": [
          pxToRem(34),
          {
            lineHeight: "0.88235",
            letterSpacing: "-2.04px",
            fontWeight: "400",
          },
        ],
        "seo-1-dp": [
          pxToRem(96),
          {
            lineHeight: "0.8",
            letterSpacing: "-4.8x",
            fontWeight: "400",
          },
        ],
        "seo-2-dp": [
          pxToRem(80),
          {
            // 56px
            lineHeight: "0.8",
            letterSpacing: "-4.8px",
            fontWeight: "400",
          },
        ],
        "seo-2-big-dp": [
          pxToRem(220),
          {
            lineHeight: "0.8",
            letterSpacing: "-18.7px",
            fontWeight: "400",
          },
        ],
        "seo-3-dp": [
          pxToRem(60),
          {
            lineHeight: "0.83",
            letterSpacing: "-3.6px",
            fontWeight: "400",
          },
        ],
        "seo-1-blog": [
          pxToRem(34),
          {
            lineHeight: "1.058",
            letterSpacing: "-2.04px",
            fontWeight: "400",
          },
        ],
        "seo-1-blog-dp": [
          pxToRem(50),
          {
            lineHeight: "1",
            letterSpacing: "-3px",
            fontWeight: "400",
          },
        ],
        "seo-2-blog": [
          pxToRem(30),
          {
            lineHeight: "1.13",
            letterSpacing: "-1.5px",
            fontWeight: "400",
          },
        ],
        "seo-2-blog-dp": [
          pxToRem(40),
          {
            lineHeight: "1.05",
            letterSpacing: "-2.4px",
            fontWeight: "400",
          },
        ],
        "seo-3-blog": [
          pxToRem(26),
          {
            lineHeight: "1.15385",
            letterSpacing: "-1.04px",
            fontWeight: "400",
          },
        ],
        "seo-3-blog-dp": [
          pxToRem(30),
          {
            lineHeight: "1.13",
            letterSpacing: "-1.5px",
            fontWeight: "400",
          },
        ],
        "seo-4-blog": [
          pxToRem(21),
          {
            lineHeight: "1.2381",
            letterSpacing: "-0.84px",
            fontWeight: "400",
          },
        ],
        "seo-4-blog-dp": [
          pxToRem(24),
          {
            lineHeight: "1.25",
            letterSpacing: "-0.96",
            fontWeight: "400",
          },
        ],
        96: [
          pxToRem(96),
          {
            lineHeight: "0.79167",
            letterSpacing: "-5.76px",
            fontWeight: "400",
          },
        ],
        80: [
          pxToRem(80),
          {
            lineHeight: "0.8",
            letterSpacing: "-4.8px",
            fontWeight: "400",
          },
        ],
        60: [
          pxToRem(60),
          {
            lineHeight: "0.83",
            letterSpacing: "-3.6px",
            fontWeight: "400",
          },
        ],
        50: [
          pxToRem(50),
          {
            lineHeight: "0.84",
            letterSpacing: "-3x",
            fontWeight: "400",
          },
        ],
        44: [
          pxToRem(44),
          {
            lineHeight: "0.77273",
            letterSpacing: "-2.64px",
            fontWeight: "400",
          },
        ],
        40: [
          pxToRem(40),
          {
            lineHeight: "0.9",
            letterSpacing: "-2.4px",
            fontWeight: "400",
          },
        ],
        34: [
          pxToRem(34),
          {
            lineHeight: "0.88235",
            letterSpacing: "-2.04px",
            fontWeight: "400",
          },
        ],
        30: [
          pxToRem(30),
          {
            lineHeight: "1",
            letterSpacing: "-1.5px",
            fontWeight: "400",
          },
        ],
        24: [
          pxToRem(24),
          {
            lineHeight: "1.16667",
            letterSpacing: "-0.96px",
            fontWeight: "400",
          },
        ],
        20: [
          pxToRem(20),
          {
            // 20px
            lineHeight: "1.2",
            letterSpacing: "-0.8px",
            fontWeight: "400",
          },
        ],
        16: [
          pxToRem(16),
          {
            // 16px
            lineHeight: "1.25",
            fontWeight: "400",
            letterSpacing: "-0.48px",
          },
        ],
        14: [
          pxToRem(14),
          {
            // 14px
            lineHeight: "1.28571",
            fontWeight: "400",
          },
        ],
        12: [
          pxToRem(12),
          {
            // 14px
            lineHeight: "1.1667",
            letterSpacing: "-0.24px",
          },
        ],
        "m-18": [
          pxToRem(18),
          {
            lineHeight: "1.5556",
          },
        ],
        "m-17": [
          pxToRem(17),
          {
            lineHeight: "1.52941",
            letterSpacing: "-0.28px",
          },
        ],
        "s-16": [
          pxToRem(16),
          {
            lineHeight: "1.5",
            letterSpacing: "-0.48px",
          },
        ],
        "s-14": [
          pxToRem(14),
          {
            lineHeight: "1.42857",
            letterSpacing: "-0.28px",
          },
        ],
      },
    },
    screens: {
      sm: "576px",
      md: "768px",
      lg: "1024px",
      xl: "1200px",
      "2xl": "1536px",
      "3xl": "1920px",
    },
  },
  plugins: [],
  corePlugins: {
    container: false,
    preflight: false,
  },
};
