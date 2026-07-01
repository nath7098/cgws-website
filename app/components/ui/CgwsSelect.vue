<script setup lang="ts">
defineOptions({ inheritAttrs: false })

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  modelValue?: string
  label: string
  options: SelectOption[]
  placeholder?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: '— Sélectionnez —',
  error: undefined,
  hint: undefined,
  id: undefined,
  name: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const selectId = computed(
  () => props.id ?? `cgws-select-${Math.random().toString(36).slice(2, 7)}`,
)
const errorId = computed(() => `${selectId.value}-error`)
const hintId = computed(() => `${selectId.value}-hint`)

const describedBy = computed(() => {
  const ids: string[] = []
  if (props.hint) ids.push(hintId.value)
  if (props.error) ids.push(errorId.value)
  return ids.length ? ids.join(' ') : undefined
})
</script>

<template>
  <div class="flex flex-col gap-1">
    <label
      :for="selectId"
      class="block font-sans font-medium text-sm text-cgws-charcoal mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-cgws-rust ml-0.5" aria-hidden="true">*</span>
    </label>

    <div class="relative">
      <select
        :id="selectId"
        :name="name"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :aria-required="required ? 'true' : undefined"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        :class="[
          'w-full bg-cgws-cream border rounded-sm px-3 py-2.5 pr-10',
          'font-sans text-sm appearance-none',
          'transition-shadow transition-colors duration-150 outline-none',
          'focus:ring-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cgws-parchment/50',
          error
            ? 'border-cgws-rust focus:border-cgws-rust focus:ring-cgws-rust/20'
            : 'border-cgws-leather focus:border-cgws-copper focus:ring-cgws-copper/20',
          !modelValue ? 'text-cgws-rope' : 'text-cgws-charcoal',
        ]"
        v-bind="$attrs"
        @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled :selected="!modelValue">{{ placeholder }}</option>
        <option
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
          :selected="modelValue === opt.value"
        >
          {{ opt.label }}
        </option>
      </select>

      <!-- Custom dropdown arrow -->
      <div
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-cgws-leather"
        aria-hidden="true"
      >
        <UIcon name="i-lucide-chevron-down" class="w-4 h-4" />
      </div>
    </div>

    <p v-if="hint && !error" :id="hintId" class="mt-1 font-sans text-xs text-cgws-leather">
      {{ hint }}
    </p>
    <p v-if="error" :id="errorId" class="mt-1 font-sans text-xs text-cgws-rust" role="alert">
      {{ error }}
    </p>
  </div>
</template>
