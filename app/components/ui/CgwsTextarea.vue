<script setup lang="ts">
defineOptions({ inheritAttrs: false })

interface Props {
  modelValue?: string
  label: string
  placeholder?: string
  rows?: number
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  rows: 4,
  modelValue: undefined,
  placeholder: undefined,
  error: undefined,
  hint: undefined,
  id: undefined,
  name: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const textareaId = computed(
  () => props.id ?? `cgws-textarea-${Math.random().toString(36).slice(2, 7)}`,
)
const errorId = computed(() => `${textareaId.value}-error`)
const hintId = computed(() => `${textareaId.value}-hint`)

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
      :for="textareaId"
      class="block font-sans font-medium text-sm text-cgws-charcoal mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-cgws-rust ml-0.5" aria-hidden="true">*</span>
    </label>

    <textarea
      :id="textareaId"
      :name="name"
      :rows="rows"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :aria-required="required ? 'true' : undefined"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      :class="[
        'w-full bg-cgws-cream text-cgws-charcoal border rounded-sm px-3 py-2.5',
        'font-sans text-sm placeholder:text-cgws-rope placeholder:font-normal',
        'transition-shadow transition-colors duration-150 outline-none',
        'resize-y min-h-[100px]',
        'focus:ring-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cgws-parchment/50',
        error
          ? 'border-cgws-rust focus:border-cgws-rust focus:ring-cgws-rust/20'
          : 'border-cgws-leather focus:border-cgws-copper focus:ring-cgws-copper/20',
      ]"
      v-bind="$attrs"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />

    <p v-if="hint && !error" :id="hintId" class="mt-1 font-sans text-xs text-cgws-leather">
      {{ hint }}
    </p>
    <p v-if="error" :id="errorId" class="mt-1 font-sans text-xs text-cgws-rust" role="alert">
      {{ error }}
    </p>
  </div>
</template>
