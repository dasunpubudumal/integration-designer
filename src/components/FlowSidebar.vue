<template>
  <div class="sidebar-inner">
    <div class="sidebar-top">
      <span class="sidebar-title">Flows</span>
      <button class="btn btn-ghost btn-sm" @click="toggleNewForm" title="New Flow">+ New</button>
    </div>

    <!-- New flow inline form -->
    <div v-if="showNewForm" class="new-flow-form">
      <div class="form-group">
        <label>Flow Name</label>
        <input v-model="newFlow.name" placeholder="get_studies/v1" spellcheck="false" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Method</label>
          <select v-model="newFlow.method">
            <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Version</label>
          <input v-model="newFlow.version" placeholder="v0.1" />
        </div>
      </div>
      <div class="form-group">
        <label>Path</label>
        <input v-model="newFlow.path" placeholder="/studies/v1" />
      </div>
      <div class="form-group">
        <label>Layer</label>
        <input v-model="newFlow.layer" placeholder="PAPI" />
      </div>
      <div class="new-flow-actions">
        <button class="btn btn-primary btn-sm" @click="handleCreate">Create</button>
        <button class="btn btn-ghost btn-sm" @click="cancelNew">Cancel</button>
      </div>
    </div>

    <!-- Flow list -->
    <div class="flow-list">
      <div
        v-for="flow in store.flows"
        :key="flow.id"
        class="flow-item"
        :class="{ active: flow.id === store.selectedFlowId }"
        @click="store.selectFlow(flow.id)"
      >
        <div class="flow-item-main">
          <span :class="['badge', 'badge-' + flow.method]">{{ flow.method }}</span>
          <span class="flow-name truncate" :title="flow.name">{{ flow.name }}</span>
        </div>
        <div class="flow-item-meta">
          <span class="flow-path truncate text-muted" :title="flow.path">{{ flow.path }}</span>
          <button
            class="btn btn-ghost btn-sm flow-delete"
            @click.stop="handleDelete(flow)"
            title="Delete flow"
          >✕</button>
        </div>
      </div>

      <div v-if="store.flows.length === 0" class="empty-hint">
        No flows yet. Click <strong>+ New</strong> or <strong>Load Example</strong>.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useFlowStore } from '../stores/flows'

const store = useFlowStore()
const showNewForm = ref(false)
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const newFlow = reactive({
  name: '',
  method: 'GET',
  version: 'v0.1',
  path: '',
  layer: 'PAPI'
})

function toggleNewForm() {
  showNewForm.value = !showNewForm.value
  if (showNewForm.value) {
    newFlow.name = ''
    newFlow.method = 'GET'
    newFlow.version = 'v0.1'
    newFlow.path = ''
    newFlow.layer = 'PAPI'
  }
}

function cancelNew() {
  showNewForm.value = false
}

function handleCreate() {
  if (!newFlow.name.trim()) return
  store.createFlow({ ...newFlow })
  showNewForm.value = false
}

function handleDelete(flow) {
  if (!confirm(`Delete flow "${flow.name}"?`)) return
  store.deleteFlow(flow.id)
}
</script>

<style scoped>
.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  border-bottom: 1px solid var(--border);
}

.sidebar-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

/* New flow form */
.new-flow-form {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
}

.new-flow-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

/* Flow list */
.flow-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.flow-item {
  padding: 8px 14px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background 0.12s, border-color 0.12s;
}

.flow-item:hover {
  background: var(--surface2);
}

.flow-item.active {
  background: var(--surface2);
  border-left-color: var(--accent);
}

.flow-item-main {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}

.flow-name {
  font-size: 12px;
  font-weight: 500;
  max-width: 160px;
}

.flow-item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 2px;
}

.flow-path {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  max-width: 140px;
}

.flow-delete {
  opacity: 0;
  transition: opacity 0.12s;
  color: var(--red);
  padding: 1px 5px;
  font-size: 10px;
}

.flow-item:hover .flow-delete {
  opacity: 1;
}

.text-muted {
  color: var(--text-muted);
}

.empty-hint {
  padding: 24px 16px;
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;
  line-height: 1.6;
}
</style>
