/**
 * planbridge-id-loader 변환 검증 테스트.
 * 로더와 동일한 babel 옵션(파서: jsx+typescript, 플러그인: babel-pb-id, react-jsx 변환 없음)으로
 * TSX 소스를 변환하여 ①data-pb-id 주입 ②JSX/TS 문법 보존 ③기존 data-pb-id 미덮어쓰기를 확인한다.
 *
 * 실행: node plugins/__test__/loader-test.js   (크레딧/네트워크 불필요)
 */

const assert = require("assert");
const babel = require("@babel/core");
const pbPlugin = require("../babel-pb-id.js");

function transform(source, filename) {
  return babel.transformSync(source, {
    filename,
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ["jsx", "typescript"] },
    plugins: [pbPlugin],
    sourceMaps: false,
  }).code;
}

let passed = 0;
function check(name, cond) {
  assert.ok(cond, `FAIL: ${name}`);
  console.log("  ✅", name);
  passed++;
}

// 1. TSX (타입 포함) 컴포넌트 — 주입 + JSX/타입 보존
const tsxSource = `
interface Props { title: string }
export default function ProductCard({ title }: Props) {
  const handleCart = () => {};
  return (
    <div className="card">
      <h3>{title}</h3>
      <button onClick={handleCart}>담기</button>
      <a href="/detail">상세</a>
    </div>
  );
}
`;
const out = transform(tsxSource, "components/ProductCard.tsx");
console.log("=== 변환 결과 (TSX) ===\n" + out + "\n");

check("data-pb-id 속성이 주입됨", /data-pb-id=/.test(out));
check("div 에 컴포넌트명 기반 id", /data-pb-id="ProductCard\.div"/.test(out));
check("button 역할(role) 기반 id", /data-pb-id="ProductCard\.button"/.test(out));
check("a 태그 link 역할 id", /data-pb-id="ProductCard\.link"/.test(out));
check("data-pb-type 주입됨", /data-pb-type="element"/.test(out));
check("JSX 가 createElement 로 변환되지 않고 보존됨", !/createElement/.test(out) && /<div/.test(out));
check("TypeScript interface 보존됨", /interface Props/.test(out));

// 2. 이미 data-pb-id 가 있으면 덮어쓰지 않음
const preset = `
export function Foo() {
  return <button data-pb-id="Custom.Save">저장</button>;
}
`;
const out2 = transform(preset, "components/Foo.tsx");
check("기존 data-pb-id 보존(미덮어쓰기)", /data-pb-id="Custom\.Save"/.test(out2));
check("기존 id 있을 때 중복 주입 안 함", (out2.match(/data-pb-id=/g) || []).length === 1);

// 3. SKIP_TAGS (input 등)은 주입 제외
const skip = `
export function Bar() {
  return <input type="text" />;
}
`;
const out3 = transform(skip, "components/Bar.tsx");
check("SKIP_TAGS(input) 는 주입 제외", !/data-pb-id/.test(out3));

console.log(`\n총 ${passed}개 통과`);
