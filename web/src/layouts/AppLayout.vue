<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { rutasDelPortal } from '@/router/portalRoutes'

const session = useSessionStore()
const router = useRouter()

// Cada ruta de pantalla declara meta.menu = { titulo } y meta.roles.
// El menú se arma solo con lo que el rol de la sesión puede ver.
const opcionesMenu = computed(() =>
  rutasDelPortal
    .filter((ruta) => ruta.meta?.menu && ruta.meta?.roles?.includes(session.rol))
    .map((ruta) => ({
      titulo: ruta.meta.menu.titulo,
      ruta: `/${ruta.path}`
    }))
)

function cerrarSesion() {
  session.cerrarSesion()
  router.push('/login')
}
</script>

<template>
  <v-app>
    <v-navigation-drawer permanent width="260">
      <v-list-item
        :title="session.usuario ?? 'Sin nombre'"
        :subtitle="session.rol ?? 'Sin rol'"
      >
        <template #prepend>
          <v-avatar color="primary">
            <span class="text-white">{{ (session.usuario ?? '?').charAt(0) }}</span>
          </v-avatar>
        </template>
      </v-list-item>

      <v-divider />

      <v-list v-if="opcionesMenu.length" nav color="primary">
        <v-list-item
          v-for="opcion in opcionesMenu"
          :key="opcion.ruta"
          :to="opcion.ruta"
          :title="opcion.titulo"
        />
      </v-list>
      <p v-else class="text-medium-emphasis text-body-2 pa-4">
        Sin opciones de menú todavía.
      </p>

      <template #append>
        <v-divider />
        <v-list nav>
          <v-list-item title="Cerrar sesión" class="text-error font-weight-medium" @click="cerrarSesion" />
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-main class="bg-background">
      <router-view v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </v-main>
  </v-app>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
