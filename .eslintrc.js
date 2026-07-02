/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // 미사용 변수 경고
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // console.log 허용 (개발 편의)
    'no-console': 'off',
    // React import 생략 허용 (Next.js는 자동 주입)
    'react/react-in-jsx-scope': 'off',
    // any 타입 경고만 (에러 아님)
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
