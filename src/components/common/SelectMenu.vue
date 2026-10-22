<template>
  <div ref="rootEl" :class="['select-menu', { open: isOpen }]">
    <!-- Editable: free text with filtered suggestions (replaces <datalist>) -->
    <div v-if="editable" class="select-trigger select-trigger--editable">
      <input
        ref="inputEl"
        :value="modelValue"
        :placeholder="placeholder"
        spellcheck="false"
        role="combobox"
        :aria-expanded="isOpen"
        @input="onInput"
        @focus="openMenu"
        @blur="onInputBlur"
        @keydown="onKeydown"
      />
      <button
        class="select-chevron-btn"
        type="button"
        tabindex="-1"
        aria-label="Show options"
        @mousedown.prevent="toggleFromChevron"
      >
        <svg class="select-chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
      </button>
    </div>

    <!-- Fixed list -->
    <button
      v-else
      ref="buttonEl"
      class="select-trigger"
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      @click="isOpen ? closeMenu() : openMenu()"
      @keydown="onKeydown"
    >
      <span v-if="selectedOption?.color" class="select-dot" :style="{ background: selectedOption.color }"></span>
      <span :class="['select-value', { 'select-value--placeholder': !selectedOption }]">
        {{ selectedOption ? selectedOption.label : placeholder }}
      </span>
      <svg class="select-chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
    </button>

    <!-- Menu is teleported so scrolling panels can't clip it -->
    <Teleport to="body">
      <Transition name="select-pop">
        <ul
          v-if="isOpen && (visibleOptions.length > 0 || showEmptyText)"
          ref="menuEl"
          class="select-popover"
          role="listbox"
          :style="menuStyle"
          @mousedown.prevent
        >
          <li
            v-for="(opt, idx) in visibleOptions"
            :key="opt.value"
            :ref="el => { if (el) optionEls[idx] = el }"
            role="option"
            :title="opt.label"
            :aria-selected="opt.value === modelValue"
            :class="['select-option', {
              'select-option--active': idx === activeIndex,
              'select-option--selected': opt.value === modelValue
            }]"
            @mouseenter="activeIndex = idx"
            @click="choose(opt)"
          >
            <span v-if="opt.color" class="select-dot" :style="{ background: opt.color }"></span>
            <span class="select-option-label">{{ opt.label }}</span>
            <svg v-if="opt.value === modelValue" class="select-check" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2.5 6.5 5 9l4.5-6" />
            </svg>
          </li>
          <li v-if="showEmptyText" class="select-empty" role="presentation">{{ emptyText }}</li>
        </ul>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  // Strings, or { value, label, color? }
  options: { type: Array, default: () => [] },
  // Allow free text; options become filtered suggestions
  editable: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Select…' },
  // Shown in the open menu when there are no options at all, so an empty
  // list doesn't look broken. (Typing that filters everything out shows nothing.)
  emptyText: { type: String, default: '' }
})

// change: value committed (option picked, or editable input blurred)
// select: an option was picked from the list
const emit = defineEmits(['update:modelValue', 'change', 'select'])

const rootEl = ref(null)
const inputEl = ref(null)
const buttonEl = ref(null)
const menuEl = ref(null)
const optionEls = []
const isOpen = ref(false)
const activeIndex = ref(-1)
const filterText = ref('')
const menuStyle = ref({})

const normalizedOptions = computed(() =>
  props.options.map(o => (typeof o === 'object' ? o : { value: o, label: String(o) }))
)

const selectedOption = computed(() =>
  normalizedOptions.value.find(o => o.value === props.modelValue) || null
)

const showEmptyText = computed(() => !!props.emptyText && normalizedOptions.value.length === 0)

// Editable menus filter by what has been typed since opening
const visibleOptions = computed(() => {
  if (!props.editable || !filterText.value) return normalizedOptions.value
  const q = filterText.value.toLowerCase()
  return normalizedOptions.value.filter(o => o.label.toLowerCase().includes(q))
})

function positionMenu() {
  const rect = rootEl.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const openUp = spaceBelow < 220 && rect.top > spaceBelow
  // Grow towards whichever side has more room so long values stay readable
  const anchorRight = rect.left + rect.width / 2 > window.innerWidth / 2
  menuStyle.value = {
    ...(anchorRight
      ? { right: window.innerWidth - rect.right + 'px', maxWidth: rect.right - 12 + 'px' }
      : { left: rect.left + 'px', maxWidth: window.innerWidth - rect.left - 12 + 'px' }),
    minWidth: rect.width + 'px',
    ...(openUp
      ? { bottom: window.innerHeight - rect.top + 4 + 'px', maxHeight: Math.min(260, rect.top - 12) + 'px' }
      : { top: rect.bottom + 4 + 'px', maxHeight: Math.min(260, spaceBelow - 12) + 'px' })
  }
}

// Keep the menu attached to the trigger when a panel scrolls or the window resizes
function onViewportChange(e) {
  if (e?.type === 'scroll' && menuEl.value?.contains(e.target)) return
  const rect = rootEl.value.getBoundingClientRect()
  if (rect.bottom < 0 || rect.top > window.innerHeight) return closeMenu()
  positionMenu()
}

function onDocumentPointerDown(e) {
  if (rootEl.value?.contains(e.target) || menuEl.value?.contains(e.target)) return
  closeMenu()
}

function openMenu() {
  if (isOpen.value) return
  filterText.value = ''
  positionMenu()
  isOpen.value = true
  activeIndex.value = Math.max(0, visibleOptions.value.findIndex(o => o.value === props.modelValue))
  scrollActiveIntoView()
  window.addEventListener('scroll', onViewportChange, true)
  window.addEventListener('resize', onViewportChange)
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
}

function closeMenu() {
  if (!isOpen.value) return
  isOpen.value = false
  window.removeEventListener('scroll', onViewportChange, true)
  window.removeEventListener('resize', onViewportChange)
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
}

onBeforeUnmount(closeMenu)

function choose(opt) {
  emit('update:modelValue', opt.value)
  emit('select', opt.value)
  // Editable inputs keep focus and report change on blur
  if (!props.editable) emit('change', opt.value)
  closeMenu()
  if (!props.editable) buttonEl.value?.focus()
}

function toggleFromChevron() {
  if (isOpen.value) {
    closeMenu()
  } else {
    inputEl.value.focus()
    openMenu()
  }
}

function onInput(e) {
  emit('update:modelValue', e.target.value)
  if (!isOpen.value) openMenu()
  filterText.value = e.target.value
  activeIndex.value = 0
}

function onInputBlur() {
  closeMenu()
  emit('change', props.modelValue)
}

function scrollActiveIntoView() {
  nextTick(() => optionEls[activeIndex.value]?.scrollIntoView({ block: 'nearest' }))
}

function onKeydown(e) {
  const count = visibleOptions.value.length
  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowUp': {
      e.preventDefault()
      if (!isOpen.value) return openMenu()
      if (count === 0) return
      const step = e.key === 'ArrowDown' ? 1 : -1
      activeIndex.value = (activeIndex.value + step + count) % count
      scrollActiveIntoView()
      break
    }
    case 'Enter':
      if (isOpen.value && visibleOptions.value[activeIndex.value]) {
        e.preventDefault()
        choose(visibleOptions.value[activeIndex.value])
      } else if (!props.editable) {
        e.preventDefault()
        openMenu()
      }
      break
    case ' ':
      if (!props.editable) {
        e.preventDefault()
        isOpen.value ? closeMenu() : openMenu()
      }
      break
    case 'Escape':
      if (isOpen.value) {
        e.preventDefault()
        e.stopPropagation()
        closeMenu()
      }
      break
    case 'Tab':
      closeMenu()
      break
  }
}

function focus({ select = false } = {}) {
  const el = (props.editable ? inputEl : buttonEl).value
  el?.focus()
  if (select) el?.select?.()
}

defineExpose({ focus })

watch(visibleOptions, () => {
  optionEls.length = 0
  if (activeIndex.value >= visibleOptions.value.length) activeIndex.value = 0
})
</script>

<style scoped>
.select-menu {
  position: relative;
  width: 100%;
}

.select-trigger {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  min-height: 29px;
  padding: 5px 8px 5px 9px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 12px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}

.select-trigger:hover {
  background: var(--surface3);
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
}

.select-trigger:focus-visible,
.select-menu.open .select-trigger,
.select-trigger--editable:focus-within {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
}

.select-trigger--editable {
  padding: 0 4px 0 0;
  cursor: text;
}

.select-trigger--editable input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 5px 0 5px 9px;
  box-shadow: none;
}

.select-chevron-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.select-chevron-btn:hover {
  background: var(--surface3);
}

.select-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-value--placeholder {
  color: var(--text-muted);
}

.select-chevron {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  fill: none;
  stroke: var(--text-muted);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.18s ease, stroke 0.15s;
}

.select-menu.open .select-chevron {
  transform: rotate(180deg);
  stroke: var(--accent);
}

.select-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>

<!-- Unscoped: the popover is teleported to <body> -->
<style>
.select-popover {
  position: fixed;
  z-index: 1000;
  list-style: none;
  margin: 0;
  padding: 4px;
  overflow-y: auto;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.45),
    0 2px 6px rgba(0, 0, 0, 0.3);
}

.select-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 5px;
  font-size: 12px;
  color: var(--text);
  cursor: pointer;
  user-select: none;
}

.select-option--active {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
}

.select-option--selected {
  color: #c7d2fe;
  font-weight: 600;
}

.select-empty {
  /* Wrap to the trigger's width instead of widening the menu */
  width: 0;
  min-width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  font-size: 12px;
  font-style: italic;
  color: var(--text-muted);
  white-space: normal;
}

.select-option-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-check {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.select-pop-enter-active,
.select-pop-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.select-pop-enter-from,
.select-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
