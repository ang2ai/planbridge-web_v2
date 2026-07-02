import type { NextConfig } from "next";
import path from "path";

// webpack 타입을 직접 의존하지 않기 위한 최소 형태 (config.module.rules 만 사용)
type MinimalWebpackConfig = { module: { rules: unknown[] } };

// data-pb-id 자동 주입 토글.
// 개발/스테이징에서 PLANBRIDGE_INJECT=true 로 켠다 (기본 off — 기존 dev 환경 보호).
const injectPbId = process.env.PLANBRIDGE_INJECT === "true";
const loaderPath = path.resolve(__dirname, "plugins/planbridge-id-loader.js");

const nextConfig: NextConfig = {
  compiler: {
    // 프로덕션 빌드에서는 data-pb-* 속성을 제거 (개발/스테이징 식별자 노출 방지)
    reactRemoveProperties:
      process.env.NODE_ENV === "production"
        ? { properties: ["^data-pb-"] }
        : false,
  },

  // ⚠️ 주입이 꺼져 있으면 turbopack/webpack 키를 아예 넣지 않는다.
  // (webpack 키만 있고 turbopack 키가 없으면 next dev(Turbopack)가
  //  "webpack config and no turbopack config" 에러를 냄 → 일반 dev 깨짐)
  ...(injectPbId
    ? {
        // Turbopack(next dev / next build --turbopack)용 로더 규칙
        turbopack: {
          rules: {
            // as 를 지정하면 import 해석 시 확장자가 중복(.tsx.tsx)되어 모듈을 못 찾는다.
            // 같은 언어(TSX→TSX)로 변환하므로 as 없이 로더만 적용하고 이후는 Turbopack 기본 처리.
            "*.tsx": { loaders: [loaderPath] },
            "*.jsx": { loaders: [loaderPath] },
          },
        },
        // webpack(next build 기본)용 로더 규칙
        webpack(config: MinimalWebpackConfig) {
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
