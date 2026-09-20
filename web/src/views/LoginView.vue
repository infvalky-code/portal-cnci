<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { iniciarSesion } from '@/services/auth'

const router = useRouter()
const session = useSessionStore()

const usuario = ref('')
const contrasena = ref('')
const cargando = ref(false)
const mensajeError = ref('')

async function enviar() {
  mensajeError.value = ''
  cargando.value = true
  try {
    const respuesta = await iniciarSesion(usuario.value, contrasena.value)
    session.iniciarSesion({
      token: respuesta.token,
      usuario: respuesta.usuario.nombre,
      rol: respuesta.usuario.rol
    })
    router.push('/')
  } catch (error) {
    mensajeError.value = error.message
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <v-card class="pa-8" max-width="360" title="Portal CNCI">
    <v-form @submit.prevent="enviar">
      <v-text-field v-model="usuario" label="Usuario" autocomplete="username" />
      <v-text-field
        v-model="contrasena"
        label="Contraseña"
        type="password"
        autocomplete="current-password"
      />
      <v-alert v-if="mensajeError" type="error" density="compact" class="mb-4">
        {{ mensajeError }}
      </v-alert>
      <v-btn type="submit" color="primary" block :loading="cargando">Entrar</v-btn>
    </v-form>
  </v-card>
</template>
