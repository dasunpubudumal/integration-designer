<template>
  <div class="form-group">
    <label>Invocation Type</label>
    <SelectMenu v-model="form.invocation_type" :options="['RequestResponse', 'Event']" />
  </div>
</template>

<script setup>
import SelectMenu from '../../common/SelectMenu.vue'

// Edits the shared config form in place; ConfigEditor autosaves it
defineProps({ form: { type: Object, required: true } })
</script>
