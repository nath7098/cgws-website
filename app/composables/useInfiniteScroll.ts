import type { Ref } from 'vue'

export function useInfiniteScroll(
  sentinelRef: Ref<HTMLElement | null>,
  callback: () => void,
  options: IntersectionObserverInit = {},
): void {
  let observer: IntersectionObserver | null = null

  function connect(el: HTMLElement): void {
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          callback()
        }
      },
      { threshold: 0.1, ...options },
    )
    observer.observe(el)
  }

  function disconnect(): void {
    observer?.disconnect()
    observer = null
  }

  onMounted(() => {
    if (sentinelRef.value) connect(sentinelRef.value)
  })

  watch(sentinelRef, (newEl, oldEl) => {
    if (oldEl) disconnect()
    if (newEl) connect(newEl)
  })

  onUnmounted(() => {
    disconnect()
  })
}
