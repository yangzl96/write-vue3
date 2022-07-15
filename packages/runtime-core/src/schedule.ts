let queue = []
export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job)
    queueFlush()
  }
}

let isFlushPending = false

function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true
    Promise.resolve().then(flushJob)
  }
}

function flushJob() {
  isFlushPending = false
  // 清空时 我们需要根据调用的顺序依次刷新，保证先刷新父再刷新子
  // 父的id 要比 子的id 小 所以要升序
  queue.sort((a, b) => (a.id = b.id))

  for (let i = 0; i < queue.length; i++) {
    const job = queue[i]
    job()
  }
  queue.length = 0
}
