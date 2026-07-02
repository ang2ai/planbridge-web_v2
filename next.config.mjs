import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// data-pb-id 자동 주입 토글.
// 개발/스테이징에서 PLANBRIDGE_INJECT=true 로 켠다 (기본 off).
const injectPbId = process.env.PLANBRIDGE_INJECT === "true";
const loaderPath = path.resolve(__dirname, "plugins/planbridge-id-loader.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    // 프로덕션 빌드에서는 data-pb-* 속성을 제거
    reactRemoveProperties:
      process.env.NODE_ENV === "production"
        ? { properties: ["^data-pb-"] }
        : false,
  },

  ...(injectPbId
    ? {
        // Next.js 14 Turbopack (experimental) 로더 규칙
        experimental: {
          turbo: {
            rules: {
              "*.tsx": { loaders: [loaderPath] },
              "*.jsx": { loaders: [loaderPath] },
            },
          },
        },
        // webpack(next build 기본)용 로더 규칙
        webpack(config) {
          config.module.rules.push({
            test: /\.(tsx|jsx)$/,
            exclude: /node_modules/,
            use: [{ loader: loaderPath }],
          });
          return config;
        },
      }
    : {}),
};

export default nextConfig;
