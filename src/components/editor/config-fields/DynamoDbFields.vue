<template>
  <div class="form-group">
    <label>Operation</label>
    <SelectMenu v-model="form.operation" :options="['PUT_ITEM', 'GET_ITEM', 'DELETE_ITEM', 'UPDATE_ITEM']" />
  </div>
  <div class="form-row">
    <div class="form-group">
      <label>Partition Key</label>
      <input v-model="form.partition_key" placeholder="pk" />
    </div>
    <div class="form-group">
      <label>Sort Key</label>
      <input v-model="form.sort_key" placeholder="sk" />
    </div>
  </div>
  <div class="form-group">
    <label>Table Name</label>
    <input v-model="form.table_name" placeholder="env:TABLE_NAME" spellcheck="false" />
  </div>
  <div class="form-group">
    <label>Region</label>
    <input v-model="form.region_name" placeholder="eu-west-2" />
  </div>
</template>

<script setup>
import SelectMenu from '../../common/SelectMenu.vue'

// Edits the shared config form in place; ConfigEditor autosaves it
defineProps({ form: { type: Object, required: true } })
</script>
