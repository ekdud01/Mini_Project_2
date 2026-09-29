// 아직 없는 스토어를 import하지 않는다. 각 스토어가 생성된 뒤 reset을 등록한다.
const resetters = new Map();

export function registerStoreReset(name, reset) {
  resetters.set(name, reset);
  return () => {
    if (resetters.get(name) === reset) resetters.delete(name);
  };
}

export function resetStores() {
  for (const reset of resetters.values()) reset();
}
