/**
 * planbridge-babel-plugin
 * JSX 빌드 시 data-pb-id 속성을 자동으로 주입합니다.
 *
 * 변환 예시:
 *   입력:  <button onClick={handleCart}>담기</button>
 *   출력:  <button data-pb-id="ProductCard.button_0" data-pb-type="element" onClick={handleCart}>담기</button>
 */

const path = require('path');

module.exports = function planBridgePlugin(babel) {
  const { types: t } = babel;

  // 주입 제외할 HTML 태그 (너무 작은 요소는 생략)
  const SKIP_TAGS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'script', 'style', 'path', 'svg', 'circle', 'rect', 'polygon', 'g']);

  // 주요 역할을 가진 태그 매핑
  const ROLE_MAP = {
    button: 'button',
    a: 'link',
    input: 'input',
    textarea: 'textarea',
    select: 'select',
    form: 'form',
    nav: 'navigation',
    header: 'header',
    footer: 'footer',
    main: 'main',
    section: 'section',
    article: 'article',
    aside: 'aside',
    ul: 'list',
    ol: 'list',
    li: 'list-item',
    table: 'table',
    th: 'table-header',
    td: 'table-cell',
    modal: 'modal',
    dialog: 'dialog',
    h1: 'heading',
    h2: 'heading',
    h3: 'heading',
    h4: 'heading',
    h5: 'heading',
    h6: 'heading',
    p: 'text',
    span: 'text',
    label: 'label',
    img: 'image',
  };

  // 현재 파일명에서 컴포넌트명 추출
  function getComponentNameFromFile(filename) {
    if (!filename) return null;
    const base = path.basename(filename, path.extname(filename));
    // index, page 등 특수 파일명 처리
    if (base === 'index' || base === 'page' || base === 'layout') {
      const dir = path.basename(path.dirname(filename));
      return toPascalCase(dir);
    }
    return toPascalCase(base);
  }

  function toPascalCase(str) {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }

  // 함수/클래스 컴포넌트명 추출
  function getEnclosingComponentName(nodePath) {
    let current = nodePath.parentPath;
    while (current) {
      // function ComponentName() { ... }
      if (
        current.isFunctionDeclaration() &&
        current.node.id &&
        /^[A-Z]/.test(current.node.id.name)
      ) {
        return current.node.id.name;
      }
      // const ComponentName = () => { ... }
      // const ComponentName = function() { ... }
      if (
        current.isVariableDeclarator() &&
        current.node.id &&
        current.node.id.type === 'Identifier' &&
        /^[A-Z]/.test(current.node.id.name)
      ) {
        return current.node.id.name;
      }
      // export default function ComponentName() { ... }
      if (
        current.isFunctionExpression() &&
        current.parentPath &&
        current.parentPath.isExportDefaultDeclaration()
      ) {
        return null; // 파일명에서 추출
      }
      current = current.parentPath;
    }
    return null;
  }

  return {
    visitor: {
      JSXOpeningElement(nodePath, state) {
        const filename = state.filename || state.file?.opts?.filename || '';

        // 이미 data-pb-id가 있으면 스킵
        const hasAlreadyPbId = nodePath.node.attributes.some(
          (attr) =>
            t.isJSXAttribute(attr) &&
            t.isJSXIdentifier(attr.name) &&
            attr.name.name === 'data-pb-id'
        );
        if (hasAlreadyPbId) return;

        // 태그명 가져오기
        const nameNode = nodePath.node.name;
        let tagName = '';
        if (t.isJSXIdentifier(nameNode)) {
          tagName = nameNode.name;
        } else if (t.isJSXMemberExpression(nameNode)) {
          tagName = nameNode.property.name;
        }

        // 소문자로 시작하는 HTML 태그 중 제외 목록 처리
        if (SKIP_TAGS.has(tagName.toLowerCase())) return;

        // 대문자 시작 = React 컴포넌트 → 컴포넌트 자체에 pb-type="component" 추가
        const isReactComponent = /^[A-Z]/.test(tagName);

        // 컴포넌트명 결정
        const componentName =
          getEnclosingComponentName(nodePath) ||
          getComponentNameFromFile(filename) ||
          'Unknown';

        // data-pb-id 생성
        // React 컴포넌트: "ParentComponent.ChildComponent"
        // HTML 요소: "ComponentName.tagName_index" 또는 역할명 사용
        let pbId;
        if (isReactComponent) {
          pbId = `${componentName}.${tagName}`;
        } else {
          const role = ROLE_MAP[tagName.toLowerCase()];
          // 같은 컴포넌트 내 동일 태그 카운터
          const counterKey = `${componentName}.${tagName}`;
          if (!state.pbCounters) state.pbCounters = {};
          const count = state.pbCounters[counterKey] || 0;
          state.pbCounters[counterKey] = count + 1;

          if (role) {
            pbId = count === 0
              ? `${componentName}.${role}`
              : `${componentName}.${role}_${count}`;
          } else {
            pbId = count === 0
              ? `${componentName}.${tagName}`
              : `${componentName}.${tagName}_${count}`;
          }
        }

        const pbType = isReactComponent ? 'component' : 'element';

        // 속성 주입
        nodePath.node.attributes.unshift(
          t.jsxAttribute(
            t.jsxIdentifier('data-pb-type'),
            t.stringLiteral(pbType)
          )
        );
        nodePath.node.attributes.unshift(
          t.jsxAttribute(
            t.jsxIdentifier('data-pb-id'),
            t.stringLiteral(pbId)
          )
        );
      },
    },
  };
};
