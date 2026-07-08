import { useWindowScroll } from '@vueuse/core'
import { computed } from 'vue'

export function useScrollHeader(threshold = 50) {
  const { y } = useWindowScroll()
  const isScrolled = computed(() => y.value > threshold)
  return { isScrolled }
}
