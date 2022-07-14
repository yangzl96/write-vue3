export const enum ShapeFlags {
  ELEMENT = 1, // 1
  FUNCTIONAL_COMPONENT = 1 << 1, // 2
  STATEFUL_COMPONENT = 1 << 2, // 4
  TEXT_CHILDREN = 1 << 3, // 16
  ARRAY_CHILDREN = 1 << 4, // 196
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}

// 做标识
// 位运算做 权限判断 和 类型 是最佳实践

// 2进 一个字节8位数组成
// 1 => 00000001
// 1 << 1 向左边移动一位 => 00000010 => 1 * 2^1 + 0 * 2^0 => 2
// 1 << 2 向左边移动二位 => 00000100 => 1 * 2^2 + 0 * 2^1 + 0 * 2^0 => 4

// COMPONENT 表示是否是组件
// COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
// |运算 => 对两个二进制进行 或运算 有1就为1
// STATEFUL_COMPONENT: 00000100 + FUNCTIONAL_COMPONENT:0000010 => 00000110 => 6

// 有什么用？判断是不是组件

// &运算 全1才是1

// 取一个组件来和他做与运算
// STATEFUL_COMPONENT(00000100) & COMPONENT(00000110) => 00000100 => 4
// 4 & 6 => 4 为 true

// 取一个文本来和他做与运算
// TEXT_CHILDREN(000001000) & COMPONENT(00000110) => 00000000 => 0
// 16 & 6 => 0 为 false

// 用法

// shapeFlag：是在vnode根据类型绑定的
// 这样就可以判断是不是一个 元素 类型了
// shapeFlag & ShapeFlags.ELEMENT
