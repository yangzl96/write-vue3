export const patchEvent = (el, key, value) => {
  // 对函数的缓存 缓存绑定过的事件
  const invokers = el._vei || (el.evi = {})
  // 缓存的事件
  const exists = invokers[key]

  if (value && exists) {
    // 替换以前的方法
    // 改变 invoker 中value属性指向最新的事件
    exists.value = value
  } else {
    const eventName = key.slice(2).toLowerCase()
    if (value) {
      // 缓存中没有，而且value有值
      // 绑定事件 以前没绑过的
      // 绑定方法并且缓存
      let invoker = (invokers[key] = createInvoker(value))
      el.addEventListener(eventName, invoker)
    } else {
      // 以前绑定过 但是value没有值 就删除掉
      el.removeListener(eventName, exists)
      // 清空
      invokers[key] = undefined
    }
  }
}
// 创建一个事件
function createInvoker(value) {
  // 包裹一层函数，执行invoker里面的value，因为value可能要改变
  const invoker = (e) => {
    invoker.value(e)
  }
  invoker.value = value // 为了随时更改value属性
  return invoker
}
