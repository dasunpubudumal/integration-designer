<template>
  <div class="sidebar-inner">
    <div class="sidebar-top">
      <span class="sidebar-title">Flows</span>
      <button class="btn btn-ghost btn-sm" @click="showNewForm = !showNewForm" title="New Flow">+ New</button>
    </div>

    <NewFlowForm v-if="showNewForm" @done="showNewForm = false" />

    <div class="flow-list">
      <FlowListItem
        v-for="flow in store.flows"
        :key="flow.id"
        :flow="flow"
        :active="flow.id === store.selectedFlowId"
        @select="store.selectFlow(flow.id)"
        @delete="deleteFlow(flow)"
      />
      <div v-if="store.flows.length === 0" class="empty-hint">
        No flows yet. Click <strong>+ New</strong> or <strong>Load Example</strong>.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useFlowStore } from '../../stores/flows'
import NewFlowForm from './NewFlowForm.vue'
import FlowListItem from './FlowListItem.vue'

const store = useFlowStore()
const showNewForm = ref(false)

function deleteFlow(flow) {
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

/* Flow list */
.flow-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.empty-hint {
  padding: 24px 16px;
  color: var(--text-muted);
  font-size: 12px;
  text-align: center;
  line-height: 1.6;
}
</style>
