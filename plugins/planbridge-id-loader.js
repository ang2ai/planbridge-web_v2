/**
 * planbridge-id-loader
 *
 * webpack / Turbopack 로더. .tsx/.jsx 소스에 data-pb-id 속성을 자동 주입한다.
 * babel-pb-id 플러그인을 @babel/core 로 실행하되, JSX 변환(react-jsx)은 하지 않고
 * 파서 플러그인(jsx, typescript)만 사용해 JSX/TS 문법을 그대로 보존한다.
 * → 주입 후의 코드도 여전히 TSX 이므로 Turbopack/SWC 가 최종 컴파일을 담당한다.
 *
 * 프로덕션에서는 next.config 의 compiler.reactRemoveProperties 로 data-pb-* 를 제거한다.
 */

const babel = require("@babel/core");
const pbPlugin = require("./babel-pb-id.js");

module.exports = function planbridgeIdLoader(source) {
  const callback = this.async();
  const filename = this.resourcePath || "";

  // node_modules 는 변환 대상에서 제외 (룰에서 거르지만 이중 안전장치)
  if (filename.includes("node_modules")) {
    return callback(null, source);
  }

  babel
    .transformAsync(source, {
      filename,
      babelrc: false,
      configFile: false,
      // JSX/TS 문법을 파싱만 하고 그대로 다시 출력 (변환은 Turbopack/SWC 담당)
      parserOpts: { plugins: ["jsx", "typescript"] },
      generatorOpts: { retainLines: true },
      plugins: [pbPlugin],
      sourceMaps: false,
    })
    .then((result) => {
      callback(null, result && result.code != null ? result.code : source);
    })
    .catch((err) => {
      // 변환 실패 시 원본을 그대로 통과시켜 빌드가 깨지지 않게 한다.
      console.warn(`[planbridge-id-loader] skip ${filename}: ${err.message}`);
      callback(null, source);
    });
};
