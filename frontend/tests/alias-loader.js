// Node에서도 Vite의 @/ 별칭으로 실제 애플리케이션 모듈을 읽는다.
export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    return nextResolve(new URL(`../src/${specifier.slice(2)}.js`, import.meta.url).href, context);
  }
  return nextResolve(specifier, context);
}
