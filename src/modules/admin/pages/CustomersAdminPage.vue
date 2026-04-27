<template>
  <div class="lp">

    <!-- ── HEADER ───────────────────────────────────────── -->
    <header class="lp-header">
      <div class="lp-header__left">
        <h1 class="lp-title">Clientes</h1>
        <div class="lp-meta">
          <span class="lp-meta__strong">{{ Number(meta.total || 0).toLocaleString('es') }}</span>
          <span class="lp-meta__sep">·</span>
          <span>Banco de datos para promociones, fidelización y reportes</span>
        </div>
      </div>
      <div v-if="isAdmin" class="lp-header__right">
        <v-btn
          variant="tonal"
          size="small"
          rounded="lg"
          prepend-icon="mdi-email-fast-outline"
          @click="testEmailDialog.show = true"
        >
          Probar email
        </v-btn>
        <v-btn
          variant="tonal"
          size="small"
          rounded="lg"
          prepend-icon="mdi-text-box-multiple-outline"
          @click="templatesDialog.show = true"
        >
          Plantillas
        </v-btn>
        <v-btn
          variant="tonal"
          size="small"
          rounded="lg"
          prepend-icon="mdi-database-sync-outline"
          :loading="busyBackfill"
          @click="onBackfill"
        >
          Backfill desde ventas
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          rounded="lg"
          prepend-icon="mdi-account-plus-outline"
          @click="openCreate"
        >
          Nuevo cliente
        </v-btn>
      </div>
    </header>

    <!-- ── STATS KPI (reducido) ─────────────────────────── -->
    <section class="lp-stats">
      <div class="lp-kpi">
        <div class="lp-kpi__badge lp-kpi__badge--primary">
          <v-icon size="16" color="white">mdi-account-group-outline</v-icon>
        </div>
        <div class="lp-kpi__body">
          <div class="lp-kpi__lbl">Total</div>
          <div v-if="!statsLoading" class="lp-kpi__val">{{ stats.ready ? fmtInt(stats.total) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
          <div class="lp-kpi__sub">Clientes en filtro actual</div>
        </div>
      </div>

      <div class="lp-kpi">
        <div class="lp-kpi__badge lp-kpi__badge--green">
          <v-icon size="16" color="white">mdi-cellphone-check</v-icon>
        </div>
        <div class="lp-kpi__body">
          <div class="lp-kpi__lbl">Con contacto</div>
          <div v-if="!statsLoading" class="lp-kpi__val">{{ stats.ready ? fmtInt(stats.with_contact) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
          <div class="lp-kpi__sub">{{ stats.ready ? `${pct(stats.with_contact, stats.total)} del total` : '' }}</div>
        </div>
      </div>

      <div class="lp-kpi">
        <div class="lp-kpi__badge lp-kpi__badge--orange">
          <v-icon size="16" color="white">mdi-bell-ring-outline</v-icon>
        </div>
        <div class="lp-kpi__body">
          <div class="lp-kpi__lbl">Acepta promos</div>
          <div v-if="!statsLoading" class="lp-kpi__val">{{ stats.ready ? fmtInt(stats.accepts_promos) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
          <div class="lp-kpi__sub">{{ stats.ready ? `${pct(stats.accepts_promos, stats.total)} del total` : '' }}</div>
        </div>
      </div>

      <div class="lp-kpi">
        <div class="lp-kpi__badge lp-kpi__badge--indigo">
          <v-icon size="16" color="white">mdi-cart-check</v-icon>
        </div>
        <div class="lp-kpi__body">
          <div class="lp-kpi__lbl">Compraron</div>
          <div v-if="!statsLoading" class="lp-kpi__val">{{ stats.ready ? fmtInt(stats.with_purchases) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
          <div class="lp-kpi__sub">{{ stats.ready ? `${pct(stats.with_purchases, stats.total)} del total` : '' }}</div>
        </div>
      </div>
    </section>

    <!-- ── ALERT ─────────────────────────────────────────── -->
    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="lp-alert">
      {{ error }}
    </v-alert>

    <!-- ── FILTER BAR ───────────────────────────────────── -->
    <section class="lp-filters">
      <div class="lp-filters__primary">
        <v-text-field
          v-model="filters.q"
          placeholder="Buscar por nombre, email, teléfono, documento…"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="lp-filters__search"
          @update:model-value="onSearch"
        />
        <v-select
          v-model="filters.customer_type"
          :items="customerTypeItems"
          label="Tipo"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="lp-filters__primary-field"
        />
        <v-checkbox
          v-model="filters.accepts_promos"
          label="Solo con promos"
          density="compact"
          hide-details
          class="lp-filters__check"
        />
      </div>
    </section>

    <!-- ── BULK BAR (admin only, con cap anti-spam) ─────── -->
    <div
      v-if="isAdmin && selectionCount > 0"
      class="lp-bulk lp-bulk--active"
      :class="{ 'lp-bulk--cap': bulkAtCap }"
    >
      <div class="lp-bulk__select">
        <div class="cad-bulk__counter" :class="{ 'cad-bulk__counter--cap': bulkAtCap }">
          <div class="cad-bulk__counter-num">
            <v-icon size="14">mdi-checkbox-multiple-marked-outline</v-icon>
            <b>{{ selectionCount }}</b>
            <span class="cad-bulk__counter-max">/ {{ MAX_BULK_RECIPIENTS }}</span>
          </div>
          <div class="cad-bulk__counter-bar">
            <div
              class="cad-bulk__counter-bar-fill"
              :style="{ width: ((selectionCount / MAX_BULK_RECIPIENTS) * 100) + '%' }"
            />
          </div>
        </div>
        <div class="cad-bulk__hint">
          <v-icon size="13" :color="bulkAtCap ? 'warning' : 'medium-emphasis'">
            {{ bulkAtCap ? 'mdi-alert-circle' : 'mdi-shield-check-outline' }}
          </v-icon>
          <span v-if="bulkAtCap">Tope alcanzado · Para más enviá en otra tanda</span>
          <span v-else>Envío profesional · máx {{ MAX_BULK_RECIPIENTS }} para evitar SPAM</span>
        </div>
        <button class="cad-bulk__clear" type="button" @click="clearSelection">Limpiar</button>
      </div>

      <div class="lp-bulk__actions">
        <v-btn
          color="primary"
          size="small"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-email-outline"
          :disabled="bulkEmailableCount === 0"
          @click="openSendDialog('email', true)"
        >
          Email · {{ bulkEmailableCount }}
        </v-btn>
        <v-btn
          color="success"
          size="small"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-whatsapp"
          :disabled="bulkWhatsAppableCount === 0"
          @click="openSendDialog('whatsapp', true)"
        >
          WhatsApp · {{ bulkWhatsAppableCount }}
        </v-btn>
        <v-btn
          v-if="selectionCount >= 2"
          color="primary"
          size="small"
          variant="tonal"
          rounded="lg"
          prepend-icon="mdi-set-merge"
          @click="openMerge"
        >
          Unificar {{ selectionCount }} en uno
        </v-btn>
      </div>
    </div>

    <!-- ── CONTENT ──────────────────────────────────────── -->
    <section class="lp-content">
      <div class="lp-content__head">
        <div class="lp-content__head-left">
          <span class="lp-content__title">Listado</span>
          <v-chip size="x-small" variant="tonal">{{ items.length }} de {{ meta.total }}</v-chip>
        </div>
      </div>

      <div class="lp-content__body lp-content__body--flush" :class="{ 'lp-content__body--loading': loading && items.length }">
        <table class="cad-table">
          <thead>
            <tr>
              <th v-if="isAdmin" class="col-check">
                <v-checkbox
                  :model-value="allOnPageSelected"
                  :indeterminate="!allOnPageSelected && someOnPageSelected"
                  hide-details
                  density="compact"
                  color="primary"
                  @click.stop="toggleSelectAllOnPage"
                />
              </th>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Contacto</th>
              <th>Tipo</th>
              <th class="num">Compras</th>
              <th class="num">Total</th>
              <th>Última</th>
              <th>Promos</th>
              <th class="cad-action"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && !items.length">
              <td :colspan="isAdmin ? 10 : 9" class="cad-loading">
                <v-progress-circular indeterminate size="22" color="primary" />
              </td>
            </tr>
            <tr v-else-if="!items.length">
              <td :colspan="isAdmin ? 10 : 9" class="cad-empty">
                <v-icon size="36" color="medium-emphasis">mdi-account-search-outline</v-icon>
                <div>Sin clientes para estos filtros.</div>
                <v-btn
                  v-if="isAdmin && !filters.q"
                  size="small"
                  variant="tonal"
                  color="primary"
                  class="mt-2"
                  prepend-icon="mdi-database-sync-outline"
                  @click="onBackfill"
                >
                  Importar desde historial de ventas
                </v-btn>
              </td>
            </tr>
            <tr
              v-for="r in items"
              :key="r.id"
              class="cad-row"
              :class="{
                'is-selected': isSelected(r.id),
                'is-inactive': !r.is_active,
                'is-uncontactable': !hasContact(r),
              }"
              @click="openEdit(r)"
            >
              <td v-if="isAdmin" class="cad-check" @click.stop>
                <v-tooltip v-if="!hasContact(r)" location="right" text="Sin contacto cargado — agregale email o teléfono primero">
                  <template #activator="{ props: tipProps }">
                    <span v-bind="tipProps" class="cad-check__disabled">
                      <v-icon size="14" color="medium-emphasis">mdi-checkbox-blank-off-outline</v-icon>
                    </span>
                  </template>
                </v-tooltip>
                <v-checkbox
                  v-else
                  :model-value="isSelected(r.id)"
                  hide-details
                  density="compact"
                  color="primary"
                  @update:model-value="toggleSelect(r.id)"
                />
              </td>
              <td>
                <div class="cad-name">
                  <div class="cad-name__avatar">{{ initialsOf(r) }}</div>
                  <div>
                    <div class="cad-name__main">{{ r.display_name }}</div>
                    <div v-if="r.tags" class="cad-name__tags">{{ r.tags }}</div>
                  </div>
                </div>
              </td>
              <td class="cad-doc">
                <span v-if="r.doc_number">
                  <span class="cad-doc__type">{{ r.doc_type || 'DNI' }}</span>
                  <span class="cad-doc__num">{{ r.doc_number }}</span>
                </span>
                <span v-else class="cad-dim">—</span>
              </td>
              <td>
                <div v-if="r.email" class="cad-contact">
                  <v-icon size="12">mdi-email-outline</v-icon>{{ r.email }}
                </div>
                <div v-if="r.phone" class="cad-contact">
                  <v-icon size="12">mdi-phone-outline</v-icon>{{ r.phone }}
                </div>
                <span v-if="!r.email && !r.phone" class="cad-dim">—</span>
              </td>
              <td>
                <span class="cad-type-chip" :class="`cad-type-chip--${r.customer_type?.toLowerCase()}`">
                  {{ typeLabel(r.customer_type) }}
                </span>
              </td>
              <td class="num">{{ r.stats?.sales_count || 0 }}</td>
              <td class="num"><b>${{ fmtNum(r.stats?.sales_total) }}</b></td>
              <td>{{ fmtDate(r.stats?.last_sold_at) }}</td>
              <td>
                <v-icon v-if="r.accepts_promos" size="16" color="success">mdi-bell-ring</v-icon>
                <v-icon v-else size="16" color="medium-emphasis">mdi-bell-off-outline</v-icon>
              </td>
              <td class="cad-action" @click.stop>
                <v-menu :close-on-content-click="true">
                  <template #activator="{ props: menuProps }">
                    <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" />
                  </template>
                  <v-list density="compact" nav>
                    <v-list-item prepend-icon="mdi-card-account-details-outline" @click="openEdit(r)">
                      <v-list-item-title>Ver detalle</v-list-item-title>
                    </v-list-item>
                    <template v-if="isAdmin">
                      <v-divider />
                      <v-list-item
                        :disabled="!r.email"
                        prepend-icon="mdi-email-outline"
                        @click="r.email && openSendDialogForOne(r, 'email')"
                      >
                        <v-list-item-title>
                          Enviar email
                          <span v-if="!r.email" class="text-caption text-medium-emphasis ms-1">(sin email)</span>
                        </v-list-item-title>
                      </v-list-item>
                      <v-list-item
                        :disabled="!r.phone"
                        prepend-icon="mdi-whatsapp"
                        @click="r.phone && openSendDialogForOne(r, 'whatsapp')"
                      >
                        <v-list-item-title>
                          Enviar WhatsApp
                          <span v-if="!r.phone" class="text-caption text-medium-emphasis ms-1">(sin tel)</span>
                        </v-list-item-title>
                      </v-list-item>
                      <v-divider />
                      <v-list-item
                        prepend-icon="mdi-bell-ring-outline"
                        @click="quickToggleAcceptsPromos(r)"
                      >
                        <v-list-item-title>{{ r.accepts_promos ? 'Quitar de promos' : 'Marcar para promos' }}</v-list-item-title>
                      </v-list-item>
                      <v-divider />
                      <v-list-item
                        prepend-icon="mdi-trash-can-outline"
                        @click="confirmDelete(r)"
                        class="text-error"
                      >
                        <v-list-item-title>{{ r.is_active ? 'Desactivar' : 'Eliminar definitivo' }}</v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-list>
                </v-menu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ── PAGINATION ───────────────────────────────────── -->
    <footer v-if="meta.total > 0" class="lp-pagination">
      <span class="lp-pagination__info">{{ items.length }} de {{ meta.total }}</span>
      <v-pagination
        v-model="filters.page"
        :length="totalPages"
        :total-visible="7"
        rounded="lg"
        size="small"
        @update:modelValue="reload"
      />
    </footer>

    <!-- DIALOG: edit/create -->
    <v-dialog v-model="editDialog.show" max-width="640" persistent>
      <v-card rounded="xl" class="cad-edit">
        <div class="cad-edit__head">
          <v-icon size="22" color="primary">{{ editDialog.id ? 'mdi-account-edit-outline' : 'mdi-account-plus-outline' }}</v-icon>
          <div>
            <p class="cad-edit__eyebrow">{{ editDialog.id ? `Cliente #${editDialog.id}` : 'Nuevo cliente' }}</p>
            <h3 class="cad-edit__title">{{ editDialog.id ? form.display_name : 'Crear cliente' }}</h3>
          </div>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="editDialog.show = false" />
        </div>
        <div class="cad-edit__body">
          <div class="cad-edit__grid">
            <v-text-field v-model="form.first_name" label="Nombre" variant="outlined" density="compact" hide-details />
            <v-text-field v-model="form.last_name" label="Apellido / Razón social" variant="outlined" density="compact" hide-details />
            <v-select
              v-model="form.doc_type"
              :items="['DNI','CUIT','CUIL','PASAPORTE','OTRO']"
              label="Tipo doc"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
            <v-text-field v-model="form.doc_number" label="Número doc" variant="outlined" density="compact" hide-details />
            <v-text-field v-model="form.email" label="Email" variant="outlined" density="compact" hide-details type="email" />
            <v-text-field v-model="form.phone" label="Teléfono" variant="outlined" density="compact" hide-details />
            <v-select
              v-model="form.customer_type"
              :items="customerTypeItems"
              label="Tipo de cliente"
              variant="outlined"
              density="compact"
              hide-details
            />
            <v-text-field v-model="form.tax_condition" label="Condición fiscal" variant="outlined" density="compact" hide-details />
            <v-text-field v-model="form.address" label="Dirección" variant="outlined" density="compact" hide-details class="cad-edit__full" />
            <v-text-field v-model="form.city" label="Ciudad" variant="outlined" density="compact" hide-details />
            <v-text-field v-model="form.province" label="Provincia" variant="outlined" density="compact" hide-details />
            <v-text-field v-model="form.postal_code" label="CP" variant="outlined" density="compact" hide-details />
            <v-text-field v-model="form.tags" label="Tags (separados por coma)" placeholder="vip, mayorista" variant="outlined" density="compact" hide-details class="cad-edit__full" />
            <v-textarea v-model="form.notes" label="Notas internas" variant="outlined" density="compact" hide-details rows="2" auto-grow class="cad-edit__full" />
          </div>

          <div class="cad-edit__switches">
            <v-switch
              v-model="form.accepts_promos"
              color="primary"
              hide-details
              density="compact"
              :label="form.accepts_promos ? 'Acepta promociones / marketing' : 'No recibir promociones'"
            />
            <v-switch
              v-model="form.is_active"
              color="success"
              hide-details
              density="compact"
              :label="form.is_active ? 'Cliente activo' : 'Cliente inactivo'"
            />
          </div>

          <div v-if="editDialog.id && editDialog.stats" class="cad-edit__stats">
            <div class="cad-edit__stat">
              <span class="cad-edit__stat-k">Compras</span>
              <span class="cad-edit__stat-v">{{ editDialog.stats.sales_count || 0 }}</span>
            </div>
            <div class="cad-edit__stat">
              <span class="cad-edit__stat-k">Total</span>
              <span class="cad-edit__stat-v">${{ fmtNum(editDialog.stats.sales_total) }}</span>
            </div>
            <div class="cad-edit__stat">
              <span class="cad-edit__stat-k">Ticket prom.</span>
              <span class="cad-edit__stat-v">${{ fmtNum(editDialog.stats.avg_ticket) }}</span>
            </div>
            <div class="cad-edit__stat">
              <span class="cad-edit__stat-k">Última</span>
              <span class="cad-edit__stat-v">{{ fmtDate(editDialog.stats.last_sold_at) }}</span>
            </div>
          </div>
        </div>
        <div class="cad-edit__actions">
          <v-btn variant="text" :disabled="busySave" @click="editDialog.show = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="busySave"
            prepend-icon="mdi-content-save-outline"
            @click="onSave"
          >
            {{ editDialog.id ? 'Guardar cambios' : 'Crear cliente' }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- DIALOG: merge -->
    <v-dialog v-model="mergeDialog.show" max-width="540" persistent>
      <v-card rounded="xl">
        <div class="cad-edit__head">
          <v-icon size="22" color="primary">mdi-set-merge</v-icon>
          <div>
            <p class="cad-edit__eyebrow">Unificar {{ mergeDialog.candidates.length }} clientes</p>
            <h3 class="cad-edit__title">Elegí el cliente principal</h3>
          </div>
        </div>
        <div class="cad-edit__body">
          <p class="cad-help">
            Las ventas de los demás clientes se reasignarán al principal y los duplicados se eliminarán.
            Esta acción no se puede deshacer.
          </p>
          <v-radio-group v-model="mergeDialog.target_id" hide-details density="compact">
            <v-radio
              v-for="c in mergeDialog.candidates"
              :key="c.id"
              :value="c.id"
              :label="`${c.display_name} (${c.stats?.sales_count || 0} compras · $${fmtNum(c.stats?.sales_total)})`"
            />
          </v-radio-group>
        </div>
        <div class="cad-edit__actions">
          <v-btn variant="text" :disabled="busyMerge" @click="mergeDialog.show = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="busyMerge"
            :disabled="!mergeDialog.target_id"
            prepend-icon="mdi-set-merge"
            @click="onMerge"
          >
            Unificar en seleccionado
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- DIALOG: confirm delete -->
    <v-dialog v-model="deleteDialog.show" max-width="460" persistent>
      <v-card rounded="xl">
        <div class="cad-edit__head">
          <v-icon size="22" color="error">mdi-trash-can-outline</v-icon>
          <div>
            <p class="cad-edit__eyebrow">Cliente #{{ deleteDialog.row?.id }}</p>
            <h3 class="cad-edit__title">{{ deleteDialog.row?.is_active ? 'Desactivar cliente' : 'Eliminar definitivo' }}</h3>
          </div>
        </div>
        <div class="cad-edit__body">
          <v-alert type="warning" variant="tonal" density="compact">
            <span v-if="deleteDialog.row?.is_active">
              Desactivar lo oculta de listados pero mantiene el historial de ventas asociado. Podés
              reactivarlo después.
            </span>
            <span v-else>
              Esta acción borra el cliente para siempre. Las ventas existentes pierden el vínculo
              (quedan como "Cliente eliminado" con el snapshot del momento de la venta).
            </span>
          </v-alert>
        </div>
        <div class="cad-edit__actions">
          <v-btn variant="text" :disabled="busyDelete" @click="deleteDialog.show = false">Cancelar</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="busyDelete"
            @click="doDelete"
          >
            {{ deleteDialog.row?.is_active ? 'Desactivar' : 'Eliminar' }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- CRM: dialog de envío de mensajes -->
    <SendMessageDialog
      :open="sendDialog.show"
      :targets="sendDialog.targets"
      :initial-channel="sendDialog.channel"
      :initial-promo-ids="sendDialog.initialPromoIds"
      @close="onSendDialogClose"
      @sent="onMessagesSent"
      @open-templates="templatesDialog.show = true"
    />

    <!-- CRM: dialog de plantillas -->
    <MessageTemplatesDialog
      :open="templatesDialog.show"
      @close="templatesDialog.show = false"
      @changed="onTemplatesChanged"
    />

    <!-- CRM: diagnóstico SMTP / test rápido de envío -->
    <TestEmailDialog
      :open="testEmailDialog.show"
      @close="testEmailDialog.show = false"
    />

    <v-snackbar v-model="snack.show" :timeout="3500" rounded="xl" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";

const router = useRouter();
const auth = useAuthStore();

import {
  listCustomers, getCustomer, createCustomer, updateCustomer,
  deleteCustomer, mergeCustomers, backfillCustomers,
  getCustomersStats,
} from "../services/customers.service";
import SendMessageDialog from "../components/SendMessageDialog.vue";
import MessageTemplatesDialog from "../components/MessageTemplatesDialog.vue";
import TestEmailDialog from "../components/TestEmailDialog.vue";

const isAdmin = computed(() => {
  const u = auth?.user || {};
  if (u.is_admin === true || u.isAdmin === true || u.admin === true) return true;
  const roleId = Number(u.role_id || u.roleId || u.perfil_id || 0);
  if (Number.isFinite(roleId) && roleId === 1) return true;
  const raw = [];
  const push = (r) => {
    if (!r) return;
    if (typeof r === "string") raw.push(r);
    else if (typeof r?.name === "string") raw.push(r.name);
    else if (typeof r?.role === "string") raw.push(r.role);
    else if (typeof r?.role?.name === "string") raw.push(r.role.name);
  };
  if (Array.isArray(u.roles)) u.roles.forEach(push);
  if (u.role) push(u.role);
  if (u.perfil) push(u.perfil);
  const roles = raw.map((s) => String(s || "").trim().toLowerCase()).filter(Boolean);
  return roles.some((r) =>
    ["admin", "administrador", "administrator", "super_admin", "superadmin", "root", "owner", "dueño", "dueno"].includes(r),
  );
});

const customerTypeItems = [
  { title: "Consumidor final", value: "CONSUMIDOR_FINAL" },
  { title: "Responsable inscripto", value: "RESPONSABLE_INSCRIPTO" },
  { title: "Monotributo", value: "MONOTRIBUTO" },
  { title: "Exento", value: "EXENTO" },
  { title: "Otro", value: "OTRO" },
];

const items = ref([]);
const meta = ref({ page: 1, limit: 25, total: 0, pages: 1 });
const loading = ref(false);
const error = ref("");

const filters = reactive({
  q: "",
  customer_type: null,
  accepts_promos: false,
  page: 1,
  limit: 25,
});

const selectedIds = ref(new Set());
const editDialog = reactive({ show: false, id: null, stats: null });
const form = reactive(emptyForm());
const mergeDialog = reactive({ show: false, candidates: [], target_id: null });
const deleteDialog = reactive({ show: false, row: null });
const snack = reactive({ show: false, text: "" });

const busySave = ref(false);
const busyMerge = ref(false);
const busyDelete = ref(false);
const busyBackfill = ref(false);

// CRM: dialogs de envío y plantillas
const sendDialog = reactive({ show: false, targets: [], channel: "email", initialPromoIds: [] });

// Si veniste desde "Promociones email" con promos pre-seleccionadas, las
// levantamos del sessionStorage para que el dialog las precargue.
function consumePreselectedPromoIds() {
  try {
    const raw = sessionStorage.getItem("crm.preselectedPromoIds");
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map(Number).filter(Boolean);
  } catch { return []; }
}

const incomingPromoIds = consumePreselectedPromoIds();
if (incomingPromoIds.length) {
  setTimeout(() => {
    snack.show = true;
    snack.text = `${incomingPromoIds.length} promo(s) listas. Seleccioná clientes y hacé click en "Email · N".`;
  }, 200);
}

function onSendDialogClose() {
  sendDialog.show = false;
  sendDialog.initialPromoIds = [];
  sessionStorage.removeItem("crm.preselectedPromoIds");
}
const templatesDialog = reactive({ show: false });
const testEmailDialog = reactive({ show: false });

function emptyForm() {
  return {
    first_name: "",
    last_name: "",
    display_name: "",
    doc_type: null,
    doc_number: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    customer_type: "CONSUMIDOR_FINAL",
    tax_condition: "",
    tags: "",
    notes: "",
    accepts_promos: false,
    is_active: true,
  };
}

const totalPages = computed(() => Math.max(1, Math.ceil((meta.value.total || 0) / (filters.limit || 25))));
const selectionCount = computed(() => selectedIds.value.size);

const MAX_BULK_RECIPIENTS = 10;
const bulkAtCap = computed(() => selectionCount.value >= MAX_BULK_RECIPIENTS);

const selectedRows = computed(() =>
  items.value.filter((r) => selectedIds.value.has(r.id))
);
const bulkEmailableCount = computed(() =>
  selectedRows.value.filter((r) => !!r.email).length
);
const bulkWhatsAppableCount = computed(() =>
  selectedRows.value.filter((r) => !!r.phone).length
);
const contactableOnPage = computed(() =>
  items.value.filter((r) => !!(r.email || r.phone))
);
const allOnPageSelected = computed(() =>
  contactableOnPage.value.length > 0 && contactableOnPage.value.every((r) => selectedIds.value.has(r.id))
);
const someOnPageSelected = computed(() =>
  contactableOnPage.value.some((r) => selectedIds.value.has(r.id))
);

function toast(text) { snack.show = true; snack.text = String(text || ""); }
function fmtNum(v) { return new Intl.NumberFormat("es-AR").format(Number(v || 0)); }
function fmtInt(v) { return Number(v || 0).toLocaleString('es'); }
function pct(part, whole) {
  const w = Number(whole || 0);
  if (!w) return '0%';
  const p = Math.round((Number(part || 0) / w) * 100);
  return `${p}%`;
}
function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function initialsOf(r) {
  const src = r.display_name || `${r.first_name || ""} ${r.last_name || ""}`;
  const parts = String(src).trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || "?";
}
function typeLabel(v) {
  const found = customerTypeItems.find((i) => i.value === v);
  return found?.title || v || "—";
}

/* ── STATS ── */
const statsLoading = ref(false);
const stats = ref({
  ready: false,
  total: 0,
  with_contact: 0,
  accepts_promos: 0,
  with_purchases: 0,
});

async function fetchStats() {
  statsLoading.value = true;
  try {
    const params = {
      q: filters.q,
      customer_type: filters.customer_type || "",
    };
    const { data } = await getCustomersStats(params);
    if (data?.ok && data.data) {
      stats.value = {
        ready: true,
        total: Number(data.data.total || 0),
        with_contact: Number(data.data.with_contact || 0),
        accepts_promos: Number(data.data.accepts_promos || 0),
        with_purchases: Number(data.data.with_purchases || 0),
      };
    } else {
      stats.value.ready = false;
    }
  } catch {
    stats.value.ready = false;
  } finally {
    statsLoading.value = false;
  }
}

async function reload() {
  loading.value = true;
  error.value = "";
  try {
    const params = {
      q: filters.q,
      customer_type: filters.customer_type || "",
      accepts_promos: filters.accepts_promos ? 1 : "",
      page: filters.page,
      limit: filters.limit,
    };
    const { data } = await listCustomers(params);
    items.value = data?.data || [];
    meta.value = data?.meta || { page: 1, limit: filters.limit, total: 0 };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cargar.";
    items.value = [];
  } finally {
    loading.value = false;
  }
  fetchStats();
}

let searchTimer = null;
function onSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { filters.page = 1; reload(); }, 300);
}
watch(() => filters.customer_type, () => { filters.page = 1; reload(); });
watch(() => filters.accepts_promos, () => { filters.page = 1; reload(); });

// Selección
function hasContact(r) { return !!(r?.email || r?.phone); }
function isSelected(id) { return selectedIds.value.has(id); }
function toggleSelect(id) {
  const row = items.value.find((r) => r.id === id);
  if (!row) return;
  if (!hasContact(row)) {
    toast("Este cliente no tiene email ni teléfono. Editalo y agregale uno antes de incluirlo en envíos.");
    return;
  }
  const next = new Set(selectedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    if (next.size >= MAX_BULK_RECIPIENTS) {
      toast(`Máximo ${MAX_BULK_RECIPIENTS} destinatarios por envío. Quitá alguno antes de sumar otro.`);
      return;
    }
    next.add(id);
  }
  selectedIds.value = next;
}
function toggleSelectAllOnPage() {
  const next = new Set(selectedIds.value);
  if (allOnPageSelected.value) {
    for (const r of items.value) next.delete(r.id);
  } else {
    let added = 0;
    let skippedCap = 0;
    let skippedNoContact = 0;
    for (const r of items.value) {
      if (next.has(r.id)) continue;
      if (!hasContact(r)) { skippedNoContact++; continue; }
      if (next.size >= MAX_BULK_RECIPIENTS) { skippedCap++; continue; }
      next.add(r.id); added++;
    }
    const reasons = [];
    if (skippedNoContact > 0) reasons.push(`${skippedNoContact} sin contacto`);
    if (skippedCap > 0) reasons.push(`${skippedCap} por cap de ${MAX_BULK_RECIPIENTS}`);
    if (reasons.length) {
      toast(`Se agregaron ${added} clientes. Omitidos: ${reasons.join(" · ")}.`);
    }
  }
  selectedIds.value = next;
}
function clearSelection() { selectedIds.value = new Set(); }

// Crear / editar
function openCreate() {
  Object.assign(form, emptyForm());
  editDialog.id = null;
  editDialog.stats = null;
  editDialog.show = true;
}
function openEdit(row) {
  if (!row?.id) return;
  router.push({ name: "adminCustomerDetail", params: { id: row.id } });
}

async function _openEditLegacy(row) {
  editDialog.id = row.id;
  editDialog.stats = row.stats || null;
  Object.assign(form, emptyForm(), {
    first_name: row.first_name || "",
    last_name:  row.last_name || "",
    display_name: row.display_name || "",
    doc_type:   row.doc_type || null,
    doc_number: row.doc_number || "",
    email:      row.email || "",
    phone:      row.phone || "",
    address:    row.address || "",
    city:       row.city || "",
    province:   row.province || "",
    postal_code: row.postal_code || "",
    customer_type: row.customer_type || "CONSUMIDOR_FINAL",
    tax_condition: row.tax_condition || "",
    tags:       row.tags || "",
    notes:      row.notes || "",
    accepts_promos: !!row.accepts_promos,
    is_active:  row.is_active !== false,
  });
  editDialog.show = true;
  try {
    const { data } = await getCustomer(row.id);
    if (data?.data) {
      editDialog.stats = data.data.stats || null;
    }
  } catch (_) {}
}

async function onSave() {
  busySave.value = true;
  try {
    if (editDialog.id) {
      await updateCustomer(editDialog.id, form);
      toast("Cliente actualizado");
    } else {
      await createCustomer(form);
      toast("Cliente creado");
    }
    editDialog.show = false;
    await reload();
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "No se pudo guardar");
  } finally {
    busySave.value = false;
  }
}

async function quickToggleAcceptsPromos(row) {
  try {
    await updateCustomer(row.id, { accepts_promos: !row.accepts_promos });
    toast(`Marketing ${!row.accepts_promos ? "activado" : "desactivado"}`);
    await reload();
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "No se pudo actualizar");
  }
}

// Merge
function openMerge() {
  const cands = items.value.filter((r) => selectedIds.value.has(r.id));
  if (cands.length < 2) {
    toast("Seleccioná al menos 2 clientes para unificar");
    return;
  }
  const sorted = [...cands].sort(
    (a, b) => (b.stats?.sales_count || 0) - (a.stats?.sales_count || 0)
  );
  mergeDialog.candidates = sorted;
  mergeDialog.target_id = sorted[0]?.id || null;
  mergeDialog.show = true;
}
async function onMerge() {
  if (!mergeDialog.target_id) return;
  busyMerge.value = true;
  try {
    const targetId = mergeDialog.target_id;
    const sourceIds = mergeDialog.candidates
      .map((c) => c.id)
      .filter((id) => id !== targetId);
    const { data } = await mergeCustomers({ target_id: targetId, source_ids: sourceIds });
    toast(`Unificados ${data?.data?.merged || 0} clientes (${data?.data?.sales_reassigned || 0} ventas reasignadas)`);
    mergeDialog.show = false;
    clearSelection();
    await reload();
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "No se pudo unificar");
  } finally {
    busyMerge.value = false;
  }
}

// Delete
function confirmDelete(row) {
  deleteDialog.row = row;
  deleteDialog.show = true;
}
async function doDelete() {
  const row = deleteDialog.row;
  if (!row?.id) return;
  busyDelete.value = true;
  try {
    await deleteCustomer(row.id, { force: !row.is_active });
    toast(row.is_active ? "Cliente desactivado" : "Cliente eliminado");
    deleteDialog.show = false;
    await reload();
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "No se pudo eliminar");
  } finally {
    busyDelete.value = false;
  }
}

// CRM: envío de mensajes
function openSendDialogForOne(row, channel) {
  if (channel === "email" && !row.email) {
    toast("Este cliente no tiene email cargado");
    return;
  }
  if (channel === "whatsapp" && !row.phone) {
    toast("Este cliente no tiene teléfono cargado");
    return;
  }
  sendDialog.targets = [{
    id: row.id,
    display_name: row.display_name,
    email: row.email,
    phone: row.phone,
  }];
  sendDialog.channel = channel;
  sendDialog.initialPromoIds = channel === "email" ? incomingPromoIds : [];
  sendDialog.show = true;
}

function openSendDialog(channel, useSelection = false) {
  const rows = useSelection
    ? selectedRows.value.filter((r) => channel === "email" ? !!r.email : !!r.phone)
    : [];
  if (!rows.length) {
    toast(`No hay clientes seleccionados con ${channel === "email" ? "email" : "teléfono"}.`);
    return;
  }
  sendDialog.targets = rows.map((r) => ({
    id: r.id,
    display_name: r.display_name,
    email: r.email,
    phone: r.phone,
  }));
  sendDialog.channel = channel;
  sendDialog.initialPromoIds = channel === "email" ? incomingPromoIds : [];
  sendDialog.show = true;
}

function onMessagesSent(payload) {
  if (payload?.summary) {
    const s = payload.summary;
    toast(`Enviados ${s.ok} · Fallidos ${s.failed} · Sin contacto ${s.skipped}`);
  } else if (payload?.link) {
    toast("Link wa.me abierto en otra pestaña");
  } else {
    toast("Mensaje enviado");
  }
}

function onTemplatesChanged() {
  // Las plantillas se recargan dentro de cada dialog que las consume.
}

// Backfill
async function onBackfill() {
  busyBackfill.value = true;
  try {
    const { data } = await backfillCustomers({ dryRun: false });
    toast(data?.message || "Backfill completado");
    await reload();
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "No se pudo backfill");
  } finally {
    busyBackfill.value = false;
  }
}

onMounted(reload);
</script>

<style scoped>
/* ============================================================
   LIST PAGE — patrón estandarizado (lp-*)
   Compartido con Productos / Ventas / Categorías. Sincronizar.
   ============================================================ */

.lp {
  --lp-gap: 14px;
  --lp-radius: 14px;
  --lp-radius-sm: 12px;
  --lp-card-bg: rgb(var(--v-theme-surface));
  --lp-card-border: rgba(var(--v-border-color), var(--v-border-opacity));
  --lp-muted: rgba(var(--v-theme-on-surface), 0.55);
  --lp-strong: rgba(var(--v-theme-on-surface), 0.9);

  display: flex;
  flex-direction: column;
  gap: var(--lp-gap);
  min-width: 0;
}

/* HEADER */
.lp-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 4px 2px 0;
}
.lp-header__left  { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.lp-header__right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.lp-title {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
}
.lp-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--lp-muted);
  flex-wrap: wrap;
}
.lp-meta__strong {
  font-weight: 800;
  color: var(--lp-strong);
  font-feature-settings: "tnum";
}
.lp-meta__sep { opacity: 0.4; }

/* STATS KPI (4 únicos, sin method-cards) */
.lp-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.lp-kpi {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--lp-radius);
  background: var(--lp-card-bg);
  border: 1px solid var(--lp-card-border);
}
.lp-kpi__badge {
  width: 36px; height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
  display: grid; place-items: center;
  margin-top: 2px;
}
.lp-kpi__badge--primary { background: rgb(var(--v-theme-primary)); }
.lp-kpi__badge--green   { background: rgb(var(--v-theme-success)); }
.lp-kpi__badge--orange  { background: var(--pos-kpi-color-1, #f57c00); }
.lp-kpi__badge--indigo  { background: var(--pos-kpi-color-2, #5c6bc0); }
.lp-kpi__body  { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.lp-kpi__lbl   {
  font-size: 11px; font-weight: 700;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.lp-kpi__val   {
  font-size: 20px; font-weight: 900;
  line-height: 1.2;
  margin-top: 4px;
  font-feature-settings: "tnum";
}
.lp-kpi__sub   { font-size: 11px; opacity: 0.4; margin-top: 3px; }
.lp-kpi__skel  {
  height: 22px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  margin-top: 4px;
  animation: lp-pulse 1.4s ease infinite;
}
@keyframes lp-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* ALERT */
.lp-alert { margin-bottom: 0 !important; }

/* FILTER BAR */
.lp-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--lp-radius);
  background: var(--lp-card-bg);
  border: 1px solid var(--lp-card-border);
}
.lp-filters__primary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.lp-filters__search { flex: 1 1 280px; min-width: 220px; }
.lp-filters__search :deep(.v-field) { border-radius: 10px; }
.lp-filters__primary-field { flex: 0 0 200px; min-width: 160px; }
.lp-filters__check { flex-shrink: 0; }

/* BULK BAR */
.lp-bulk {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: var(--lp-radius);
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid var(--lp-card-border);
  flex-wrap: wrap;
  transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
}
.lp-bulk--active {
  background: rgba(var(--v-theme-primary), 0.08);
  border-color: rgba(var(--v-theme-primary), 0.36);
  box-shadow: 0 4px 14px rgba(var(--v-theme-primary), 0.14);
}
.lp-bulk--cap {
  background: rgba(var(--v-theme-warning), 0.10);
  border-color: rgba(var(--v-theme-warning), 0.5);
}
.lp-bulk__select {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  font-size: 13px; font-weight: 600;
}
.lp-bulk__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.cad-bulk__counter {
  display: flex; flex-direction: column; gap: 4px;
  min-width: 110px;
}
.cad-bulk__counter-num {
  display: inline-flex; align-items: baseline; gap: 4px;
  font-size: 14px;
  color: rgb(var(--v-theme-primary));
}
.cad-bulk__counter-num b {
  font-size: 19px; font-weight: 900;
  letter-spacing: -0.02em;
}
.cad-bulk__counter-max {
  font-size: 12px; opacity: 0.55; font-weight: 700;
  margin-left: 1px;
}
.cad-bulk__counter--cap .cad-bulk__counter-num,
.cad-bulk__counter--cap .cad-bulk__counter-max {
  color: rgb(var(--v-theme-warning));
}
.cad-bulk__counter-bar {
  width: 100%;
  height: 4px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 999px;
  overflow: hidden;
}
.cad-bulk__counter-bar-fill {
  height: 100%;
  background: linear-gradient(90deg,
    rgba(var(--v-theme-primary), 0.85),
    rgba(var(--v-theme-primary), 1));
  border-radius: 999px;
  transition: width 0.2s ease, background 0.18s;
}
.cad-bulk__counter--cap .cad-bulk__counter-bar-fill {
  background: linear-gradient(90deg,
    rgba(var(--v-theme-warning), 0.85),
    rgba(var(--v-theme-warning), 1));
}
.cad-bulk__hint {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11.5px; font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.65);
  letter-spacing: 0.01em;
}
.lp-bulk--cap .cad-bulk__hint {
  color: rgb(var(--v-theme-warning));
}
.cad-bulk__clear {
  background: transparent; border: none; cursor: pointer;
  font-size: 11px; font-weight: 700;
  color: rgb(var(--v-theme-primary));
  padding: 4px 9px; border-radius: 6px;
  text-transform: uppercase; letter-spacing: 0.06em;
  transition: background 0.1s;
}
.cad-bulk__clear:hover { background: rgba(var(--v-theme-primary), 0.12); }

/* CONTENT WRAPPER */
.lp-content {
  border-radius: var(--lp-radius);
  background: var(--lp-card-bg);
  border: 1px solid var(--lp-card-border);
  overflow: hidden;
}
.lp-content__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--lp-card-border);
  background: rgba(var(--v-theme-on-surface), 0.015);
}
.lp-content__head-left { display: flex; align-items: center; gap: 8px; }
.lp-content__title { font-size: 13px; font-weight: 800; letter-spacing: 0.01em; }
.lp-content__body { padding: 12px; transition: opacity 0.2s; }
.lp-content__body--flush { padding: 0; }
.lp-content__body--loading { opacity: 0.7; pointer-events: none; }

/* PAGINATION */
.lp-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 6px 8px;
}
.lp-pagination__info {
  font-size: 12px;
  font-weight: 600;
  color: var(--lp-muted);
  font-feature-settings: "tnum";
}

/* ============================================================
   CLIENTES — específico (tabla, avatares, chips)
   ============================================================ */

.cad-table {
  width: 100%;
  border-collapse: collapse;
}
.cad-table thead th {
  text-align: left;
  font-size: 10.5px;
  font-weight: 800;
  opacity: 0.55;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.cad-table th.num, .cad-table td.num { text-align: right; }
.col-check { width: 44px; padding-left: 12px !important; padding-right: 0 !important; }
.cad-action { width: 60px; text-align: right; }
.cad-row td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.5));
  font-size: 13px;
  vertical-align: middle;
}
.cad-row { cursor: pointer; transition: background 0.12s; }
.cad-row:hover { background: rgba(var(--v-theme-primary), 0.04); }
.cad-row.is-selected { background: rgba(var(--v-theme-primary), 0.08); }
.cad-row.is-inactive { opacity: 0.55; }
.cad-row:last-child td { border-bottom: none; }
.cad-check { padding-left: 12px !important; padding-right: 0 !important; }
.cad-loading, .cad-empty {
  text-align: center; padding: 40px 20px; opacity: 0.65;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.cad-empty { font-size: 13px; font-weight: 600; }

.cad-name { display: flex; align-items: center; gap: 10px; }
.cad-name__avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: grid; place-items: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 11px; font-weight: 800;
}
.cad-name__main { font-weight: 700; font-size: 13px; }
.cad-name__tags { font-size: 10.5px; opacity: 0.6; margin-top: 1px; }

.cad-doc__type {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; opacity: 0.55; margin-right: 4px;
}
.cad-doc__num { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
.cad-dim { opacity: 0.45; font-size: 11.5px; }

.cad-contact {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; opacity: 0.85;
  margin-right: 8px;
}

.cad-type-chip {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.cad-type-chip--consumidor_final  { background: rgba(99, 102, 241, 0.14); color: #6366f1; }
.cad-type-chip--responsable_inscripto { background: rgba(16, 185, 129, 0.14); color: #10b981; }
.cad-type-chip--monotributo       { background: rgba(245, 158, 11, 0.14); color: #d97706; }
.cad-type-chip--exento            { background: rgba(139, 92, 246, 0.14); color: #8b5cf6; }
.cad-type-chip--otro              { background: rgba(var(--v-theme-on-surface), 0.08); color: rgba(var(--v-theme-on-surface), 0.7); }

.cad-check__disabled {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  border-radius: 6px;
  cursor: not-allowed;
  opacity: 0.55;
}
.is-uncontactable .cad-name__main { opacity: 0.78; }

/* Edit dialog (sin tocar lógica) */
.cad-edit__head {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--lp-card-border);
}
.cad-edit__eyebrow {
  margin: 0; font-size: 11px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  opacity: 0.6;
}
.cad-edit__title { margin: 2px 0 0; font-size: 18px; font-weight: 800; line-height: 1.1; }
.cad-edit__body { padding: 16px 20px; }
.cad-edit__grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.cad-edit__full { grid-column: 1 / span 2; }
.cad-edit__switches {
  display: flex; gap: 18px; flex-wrap: wrap; margin-top: 14px;
}
.cad-edit__stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
  margin-top: 16px;
}
.cad-edit__stat {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid var(--lp-card-border);
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cad-edit__stat-k {
  font-size: 9.5px; font-weight: 800;
  letter-spacing: 0.06em; text-transform: uppercase;
  opacity: 0.55;
}
.cad-edit__stat-v {
  font-size: 14px; font-weight: 800; margin-top: 2px;
}
.cad-edit__actions {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 18px 16px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.cad-help { font-size: 12.5px; opacity: 0.85; line-height: 1.5; margin-bottom: 8px; }

/* RESPONSIVE */
@media (max-width: 1200px) {
  .lp-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 960px) {
  .lp { gap: 12px; }
  .lp-filters { padding: 10px 12px; }
}
@media (max-width: 720px) {
  .cad-edit__grid { grid-template-columns: 1fr; }
  .cad-edit__full { grid-column: 1; }
  .cad-edit__stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .lp-title { font-size: 18px; }
  .lp-stats { grid-template-columns: 1fr 1fr; gap: 8px; }
  .lp-kpi__val { font-size: 16px; }
  .lp-kpi__badge { width: 30px; height: 30px; }
  .lp-filters__primary-field { flex: 0 0 100%; }
  .lp-filters__check { width: 100%; }
}
</style>
