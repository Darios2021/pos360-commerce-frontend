<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosShortcutsHelpDialog.vue -->
<template>
  <v-dialog :model-value="open" @update:model-value="$emit('update:open', $event)" max-width="760">
    <v-card class="rounded-xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="font-weight-black">
          <v-icon class="mr-2">mdi-keyboard</v-icon>
          Ayuda y atajos
        </div>
        <v-btn icon variant="text" @click="$emit('update:open', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <div class="text-caption text-medium-emphasis mb-3">
          Tip: no capturo teclas mientras estás escribiendo, salvo teclas de función.
        </div>

        <v-table density="compact">
          <thead>
            <tr>
              <th style="width: 220px;">Tecla</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><b>F1</b></td><td>Abrir/cerrar ayuda</td></tr>
            <tr><td><b>F2</b></td><td>Enfocar búsqueda</td></tr>
            <tr><td><b>F3</b></td><td>Limpiar búsqueda</td></tr>
            <tr><td><b>F5</b></td><td>Actualizar listado</td></tr>
            <tr><td><b>PgUp / PgDn</b></td><td>Página anterior / siguiente</td></tr>
            <tr><td><b>Ctrl + ← / Ctrl + →</b></td><td>Página anterior / siguiente</td></tr>
            <tr><td><b>F8</b></td><td>Abrir Cobrar</td></tr>
            <tr><td><b>Ctrl + Supr</b></td><td>Vaciar carrito</td></tr>
            <tr><td><b>+</b></td><td>Sumar 1 al último ítem del carrito</td></tr>
            <tr><td><b>-</b></td><td>Restar 1 al último ítem del carrito</td></tr>
            <tr><td><b>Alt + N</b></td><td>Enfocar “Nombre” cliente</td></tr>
            <tr><td><b>Alt + A</b></td><td>Enfocar “Apellido” cliente</td></tr>
            <tr><td><b>Alt + W</b></td><td>Enfocar “WhatsApp” cliente</td></tr>
            <tr><td><b>Alt + E</b></td><td>Enfocar “Email” cliente</td></tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-divider />

      <v-card-actions class="px-4 py-3">
        <v-spacer />
        <v-btn variant="tonal" @click="$emit('update:open', false)">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({ open: { type: Boolean, default: false } });
defineEmits(["update:open"]);
</script>