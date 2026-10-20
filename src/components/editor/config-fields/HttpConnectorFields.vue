<template>
  <div class="form-group">
    <label>Provider Key</label>
    <input v-model="form.provider_key" placeholder="notification_api" spellcheck="false" />
  </div>
  <div class="subsection-header">Auth Config</div>
  <div class="form-group">
    <label>Auth Type</label>
    <SelectMenu v-model="form.auth_type" :options="['OAUTH_CLIENT_CREDENTIALS', 'BEARER_TOKEN', 'BASIC', 'NONE']" />
  </div>
  <div class="form-group">
    <label>Token URL</label>
    <input v-model="form.token_url" placeholder="env:TOKEN_URL" spellcheck="false" />
  </div>
  <div class="form-group">
    <label>Grant Type</label>
    <input v-model="form.grant_type" placeholder="client_credentials" />
  </div>
  <div class="form-group">
    <label>Client ID</label>
    <input v-model="form.client_id" placeholder="sm:inthub-env:ENV-api.client_id" spellcheck="false" />
  </div>
  <div class="form-group">
    <label>Client Secret</label>
    <input v-model="form.client_secret" placeholder="sm:inthub-env:ENV-api.client_secret" spellcheck="false" />
  </div>
  <div class="form-group">
    <label>Scope</label>
    <input v-model="form.scope" placeholder="resource/action" />
  </div>
  <div class="form-row">
    <div class="form-group">
      <label>Max Retries</label>
      <input v-model.number="form.max_retries" type="number" min="0" />
    </div>
    <div class="form-group">
      <label>Timeout (ms)</label>
      <input v-model.number="form.timeout" type="number" min="0" />
    </div>
  </div>
</template>

<script setup>
import SelectMenu from '../../common/SelectMenu.vue'

// Edits the shared config form in place; ConfigEditor autosaves it
defineProps({ form: { type: Object, required: true } })
</script>
