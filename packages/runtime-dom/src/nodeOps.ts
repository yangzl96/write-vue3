export const nodeOps = {
  // 不同的平台 创建元素的方式不同
  createElement: (tagName) => document.createElement(tagName),
  remove: (child) => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },
  insert: (child, parent, anchor = null) => {
    // anchor 为空 就是 appendChild
    parent.insertBefore(child, anchor)
  },
  querySelector: (selector) => document.querySelector(selector),
  setElementText: (el, text) => (el.textContent = text),
  // 文本操作
  createText: (text) => document.createTextNode(text),
  setText: (node, text) => (node.nodeValue = text),
}
