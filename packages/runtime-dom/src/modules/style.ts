export const patchStyle = (el, prev, next) => {
  const style = el.style
  if (next === null) {
    // 新的没有
    el.removeAttribute('style')
  } else {
    // 老的里面新的有没有
    if (prev) {
      for (let key in prev) {
        // 老的有 新的没有
        if (next[key] === null) {
          style[key] = ''
        }
      }
    }
    // 新的赋值到style上
    for (let key in next) {
      style[key] = next[key]
    }
  }
}
