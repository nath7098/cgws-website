<script setup lang="ts">
defineOptions({ inheritAttrs: false })

interface Props {
  modelValue?: string
  label: string
  placeholder?: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'url'
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  modelValue: undefined,
  placeholder: undefined,
  error: undefined,
  hint: undefined,
  id: undefined,
  name: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const inputId = computed(() => props.id ?? `cgws-input-${Math.random().toString(36).slice(2, 7)}`)
const errorId = computed(() => `${inputId.value}-error`)
const hintId = computed(() => `${inputId.value}-hint`)

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
      :for="inputId"
      class="block font-sans font-medium text-sm text-cgws-ink mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-cgws-danger ml-0.5" aria-hidden="true">*</span>
    </label>

    <input
      :id="inputId"
      :name="name"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :aria-required="required ? 'true' : undefined"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      :class="[
        'w-full bg-cgws-ground text-cgws-ink border rounded-sm px-3 py-2.5',
        'font-sans text-sm placeholder:text-cgws-ink-soft placeholder:font-normal',
        'transition-shadow transition-colors duration-150 outline-none',
        'focus:ring-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-cgws-surface/50',
        error
          ? 'border-cgws-danger focus:border-cgws-danger focus:ring-cgws-danger/20'
          : 'border-cgws-edge focus:border-cgws-accent focus:ring-cgws-accent/20',
      ]"
      v-bind="$attrs"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >

    <p v-if="hint && !error" :id="hintId" class="mt-1 font-sans text-xs text-cgws-ink-soft">
      {{ hint }}
    </p>
    <p v-if="error" :id="errorId" class="mt-1 font-sans text-xs text-cgws-danger" role="alert">
      {{ error }}
    </p>
  </div>
</template>
