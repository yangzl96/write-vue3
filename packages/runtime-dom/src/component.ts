import { ShapeFlags } from '@vue/shared'
import { PublicInstanceProxyHandlers } from 'packages/runtime-core/src/componentPublicInstance'
// 组件中所有的方法

// 创建实例
export function createComponentInstance(vnode) {
  //组件的实例
  const instance = {
    vnode, //当前对应的vnode
    type: vnode.type,
    props: {}, //指代接收的属性
    attrs: {}, // 指代所有属性
    slots: {},
    data: {},
    ctx: {},
    setupState: {}, //如果setup返回一个对象，这个对象会作为 setupState
    render: null,
  }
  // 为了方便后续代理
  instance.ctx = {
    _: instance,
  }
  console.log(1)
  console.log(instance)
  console.log(1)

  return instance
}

// 给实例添加属性
// 解析数据，将数据挂载到实例
export function setupComponent(instance) {
  const { props, children } = instance.vnode //{children,key,shapeFlag....}

  // 根据props解析出props和attrs，将其放到instance上
  instance.props = props //initProps()
  instance.children = children

  // 需要看下 当前组件是否是有状态的组件
  let isStateful = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
  if (isStateful) {
    //表示是一个带状态的组件
    // 调用 实例的setup方法，用setup的返回值 填充 setupState和对应的render方法

    setupStatefulComponent(instance)
  }
}

// 调用setup函数
function setupStatefulComponent(instance) {
  // 1. 代理 传递给 render 函数的参数
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers as any)
  // 2. 获取组件的类型 拿到组件的setup方法
  let Component = instance.type
  let { setup } = Component
  let setupContext = createSetupContext(instance)
  setup(instance.props, setupContext)
  // 执行render 给到 被代理的参数 方便访问更容易
  Component.render(instance.proxy)
}

// 提取一些开发的时候用到的属性
function createSetupContext(instance) {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: () => {},
    expose: () => {},
  }
}

// instance 表示组件的状态，组件的相关信息
// context 就是个参数，开发的时候用到
// proxy 主要是为了取值方便
