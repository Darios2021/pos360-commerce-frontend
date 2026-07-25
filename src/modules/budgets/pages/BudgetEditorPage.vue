<!-- src/modules/budgets/pages/BudgetEditorPage.vue
     Editor de presupuesto: hoja tipo documento, edicion inline y guardado
     automatico. El costo y el margen son informacion interna: el ojito los
     oculta para poder girar la pantalla y mostrarle el presupuesto al cliente
     sin exponer la rentabilidad. -->
<template>
  <div class="budget-editor">
    <!-- Barra de acciones. Tres zonas: volver | agregar renglones | ajustes del
         documento y salida. Antes estaba todo en una fila con el mismo peso. -->
    <div class="toolbar d-flex align-center flex-wrap ga-2 pa-3">
      <v-btn variant="text" size="small" prepend-icon="mdi-arrow-left" :to="{ name: 'budgets' }">
        Presupuestos
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-plus" @click="openProductDialog">
        Agregar producto
      </v-btn>
      <v-btn size="small" variant="text" prepend-icon="mdi-text-box-plus-outline" @click="addFreeLine">
        Renglón libre
      </v-btn>

      <v-spacer />

      <span class="text-caption text-medium-emphasis mr-1">{{ saveState }}</span>

      <v-btn size="small" variant="tonal" prepend-icon="mdi-download-outline" @click="exportPdf">
        Descargar PDF
      </v-btn>
      <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-email-outline" @click="openMailDialog">
        Enviar por mail
      </v-btn>
    </div>

    <!-- Ajustes del documento, inline: menús cortos pegados a su propio control
         para no tapar la hoja. -->
    <div v-if="budget" class="statusbar d-flex align-center flex-wrap ga-3 px-3 py-2">
      <v-menu location="bottom start">
        <template #activator="{ props }">
          <button v-bind="props" type="button" class="inline-control">
            <v-icon :color="statusColorOf(header.status)" size="10" class="status-dot">mdi-circle</v-icon>
            <span>{{ statusTitleOf(header.status) }}</span>
            <v-icon size="16">mdi-menu-down</v-icon>
          </button>
        </template>
        <v-list density="compact" min-width="200">
          <v-list-item
            v-for="st in statusItems"
            :key="st.value"
            :active="header.status === st.value"
            @click="setStatus(st.value)"
          >
            <template #prepend>
              <v-icon :color="st.color" size="10" class="mr-2">mdi-circle</v-icon>
            </template>
            <v-list-item-title>{{ st.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu location="bottom start">
        <template #activator="{ props }">
          <button v-bind="props" type="button" class="inline-control">
            <span>{{ header.currency === "USD" ? "Dólares USD" : "Pesos ARS" }}</span>
            <v-icon size="16">mdi-menu-down</v-icon>
          </button>
        </template>
        <v-list density="compact" min-width="180">
          <v-list-item
            :active="header.currency === 'ARS'"
            title="Pesos ARS"
            @click="setCurrency('ARS')"
          />
          <v-list-item
            :active="header.currency === 'USD'"
            title="Dólares USD"
            @click="setCurrency('USD')"
          />
        </v-list>
      </v-menu>

      <button type="button" class="inline-control" @click="toggleShowCost">
        <v-icon size="16">{{ header.show_cost ? "mdi-eye-outline" : "mdi-eye-off-outline" }}</v-icon>
        <span>{{ header.show_cost ? "Costo visible" : "Costo oculto" }}</span>
        <v-tooltip activator="parent" location="bottom" max-width="260">
          Muestra u oculta las columnas Costo y Margen en pantalla. No afecta precios
          ni totales, y nunca sale en el PDF.
        </v-tooltip>
      </button>

      <span v-if="header.currency === 'USD'" class="text-caption text-medium-emphasis">
        {{ fxCaption }}
      </span>

      <v-spacer />

      <span class="text-caption text-medium-emphasis d-none d-md-inline">
        {{ statusHintOf(header.status) }}
      </span>
    </div>

    <v-progress-linear v-if="loading" indeterminate />

    <!-- Hoja -->
    <div v-if="budget" class="sheet-wrap pa-4">
      <div class="sheet">
        <!-- Encabezado -->
        <div class="doc-head">
          <div class="d-flex ga-4 align-start">
            <img v-if="companyMark" :src="companyMark" class="company-mark" alt="" />
            <div class="company-info">
              <div class="company-name">{{ companyName }}</div>
              <div v-if="companyBranchName">{{ companyBranchName }}</div>
              <div v-if="companyAddress">{{ companyAddress }}</div>
              <div v-if="companyPhone">{{ companyPhone }}</div>
            </div>
          </div>

          <div class="doc-meta">
            <div class="doc-kind">PRESUPUESTO</div>
            <div class="doc-number">#{{ budget.number }}</div>
            <dl class="doc-dates">
              <dt>Fecha</dt>
              <dd>{{ fmtDate(budget.created_at) }}</dd>
              <dt>Vence</dt>
              <dd>{{ fmtDate(budget.valid_until) }}</dd>
            </dl>
          </div>
        </div>

        <!-- Cliente -->
        <div class="doc-section">
          <div class="section-label">Cliente</div>
          <div class="d-flex align-start ga-3">
            <div class="flex-grow-1">
              <div class="customer-name">{{ header.customer_name || "Consumidor Final" }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ customerLine || "Sin datos de contacto" }}
              </div>
            </div>
            <v-btn size="small" variant="text" prepend-icon="mdi-account-search-outline" @click="openCustomerDialog">
              Cambiar
            </v-btn>
          </div>
        </div>

        <!-- Renglones -->
        <table class="items-table">
          <thead>
            <tr>
              <th class="col-qty">Cant.</th>
              <th class="col-detail">Detalle</th>
              <th v-if="header.show_cost" class="col-num col-private">Costo</th>
              <th v-if="header.show_cost" class="col-num col-private">Margen</th>
              <th class="col-num">IVA</th>
              <th class="col-num">P. unitario</th>
              <th class="col-num">Importe</th>
              <th class="col-act"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="item in items" :key="item.id">
              <tr class="item-row">
                <td class="col-qty">
                  <input
                    v-model="item.qty"
                    class="cell-input text-center"
                    inputmode="decimal"
                    @change="saveItem(item)"
                  />
                </td>

                <td class="col-detail">
                  <div class="d-flex align-start ga-3">
                    <img v-if="item.image_url" :src="item.image_url" class="item-thumb" alt="" />
                    <div class="flex-grow-1 min-w-0">
                      <input
                        v-model="item.description"
                        class="cell-input cell-input--title"
                        @change="saveItem(item)"
                      />
                      <div class="d-flex align-center ga-2 flex-wrap">
                        <span v-if="item.sku" class="item-sku">{{ item.sku }}</span>
                        <button class="specs-toggle" type="button" @click="toggleSpecs(item)">
                          {{ specsOpen[item.id] ? "Ocultar especificaciones" : specsButtonLabel(item) }}
                        </button>
                      </div>
                    </div>
                  </div>
                </td>

                <td v-if="header.show_cost" class="col-num col-private">
                  <input
                    v-model="item.cost"
                    class="cell-input text-right"
                    inputmode="decimal"
                    @change="saveItem(item)"
                  />
                </td>

                <td v-if="header.show_cost" class="col-num col-private">
                  <input
                    v-model="item.margin_pct"
                    class="cell-input text-right"
                    inputmode="decimal"
                    @change="saveItem(item)"
                  />
                </td>

                <td class="col-num">
                  <select v-model="item.vat_rate" class="cell-input text-center" @change="saveItem(item)">
                    <option value="21">21%</option>
                    <option value="10.5">10.5%</option>
                    <option value="0">0%</option>
                  </select>
                </td>

                <!-- El precio unitario sale de la lista elegida + margen. Se
                     puede cambiar la lista renglón por renglón. -->
                <td class="col-num">
                  <div>{{ money(item.unit_price) }}</div>
                  <v-menu v-if="item.product_id" location="bottom end">
                    <template #activator="{ props }">
                      <button v-bind="props" type="button" class="price-source">
                        {{ priceSourceLabel(item.price_source) }}
                        <v-icon size="12">mdi-menu-down</v-icon>
                      </button>
                    </template>
                    <v-list density="compact" min-width="190">
                      <v-list-subheader>Lista de precios</v-list-subheader>
                      <v-list-item
                        v-for="ps in rowPriceSources"
                        :key="ps.value"
                        :active="(item.price_source || 'sale') === ps.value"
                        :title="ps.title"
                        @click="setItemPriceSource(item, ps.value)"
                      />
                    </v-list>
                  </v-menu>
                </td>
                <td class="col-num amount">{{ money(item.line_total) }}</td>

                <td class="col-act">
                  <v-btn size="x-small" variant="text" color="error" @click="removeItem(item)">
                    <v-icon size="16">mdi-close</v-icon>
                    <v-tooltip activator="parent" location="top">Quitar renglón</v-tooltip>
                  </v-btn>
                </td>
              </tr>

              <!-- Especificaciones del renglón: van a un apartado propio del
                   documento, acá solo se editan. -->
              <tr v-if="specsOpen[item.id]" :key="`specs-${item.id}`" class="specs-row">
                <td></td>
                <td :colspan="header.show_cost ? 6 : 4">
                  <v-textarea
                    v-model="item.specs"
                    variant="outlined"
                    density="compact"
                    rows="3"
                    auto-grow
                    hide-details
                    label="Especificaciones técnicas"
                    placeholder="Ej: Resolución 4MP, lente 2.8mm, IR 30m, IP67, alimentación PoE."
                    @blur="saveItemSpecs(item)"
                  />
                  <div class="text-caption text-medium-emphasis mt-1">
                    Salen en el apartado Especificaciones al final del presupuesto.
                  </div>
                </td>
                <td></td>
              </tr>
            </template>

            <tr v-if="!items.length">
              <td :colspan="header.show_cost ? 8 : 6" class="text-center pa-8 text-medium-emphasis">
                Sin renglones. Agregá un producto del catálogo o un renglón libre.
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Totales -->
        <div class="totals-wrap">
          <dl class="totals">
            <dt>SubTotal</dt>
            <dd>{{ money(totals.subtotal) }}</dd>
            <dt>IVA 21%</dt>
            <dd>{{ money(totals.vat_21) }}</dd>
            <dt>IVA 10.5%</dt>
            <dd>{{ money(totals.vat_105) }}</dd>
            <dt class="grand">TOTAL</dt>
            <dd class="grand">{{ money(totals.total) }}</dd>
          </dl>
        </div>

        <div v-if="header.currency === 'USD'" class="fx-note">
          {{ fxCaption }}
        </div>

        <!-- Especificaciones -->
        <div v-if="itemsWithSpecs.length" class="doc-section">
          <div class="section-label">Especificaciones</div>
          <div v-for="it in itemsWithSpecs" :key="`spec-${it.id}`" class="spec-block">
            <img v-if="it.image_url" :src="it.image_url" class="spec-thumb" alt="" />
            <div>
              <div class="spec-title">
                {{ it.description }}
                <span v-if="it.sku" class="item-sku">{{ it.sku }}</span>
              </div>
              <div class="spec-text">{{ it.specs }}</div>
            </div>
          </div>
        </div>

        <!-- Observaciones -->
        <div class="doc-section">
          <div class="section-label">Observaciones</div>
          <v-textarea
            v-model="header.notes"
            variant="outlined"
            density="compact"
            rows="3"
            auto-grow
            hide-details
            placeholder="Condiciones de pago, plazos de entrega, garantía o cualquier aclaración para el cliente."
            @blur="saveHeader"
          />
          <div class="text-caption text-medium-emphasis mt-1">
            Este texto sale al pie del PDF. Si lo dejás vacío, no aparece.
          </div>
        </div>
      </div>
    </div>

    <!-- Buscador de productos -->
    <v-dialog v-model="productDialog" max-width="900">
      <v-card>
        <v-card-title class="text-subtitle-1">Agregar producto al presupuesto</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="productQuery"
            density="compact"
            variant="outlined"
            hide-details
            autofocus
            clearable
            placeholder="Buscar por nombre o código"
            prepend-inner-icon="mdi-magnify"
            class="mb-4"
            @update:model-value="debouncedProductSearch"
            @keyup.enter="addFirstResult"
          />

          <!-- Estos tres valores no son filtros de la búsqueda: son con qué
               entra cada producto que agregues. Se aclara explícitamente porque
               puestos sueltos arriba parecían parte del buscador. -->
          <div class="defaults-box mb-4">
            <div class="defaults-head">Con qué se agrega cada producto</div>
            <div class="d-flex ga-3 flex-wrap align-center">
              <v-select
                v-model="priceSource"
                :items="priceSourceItems"
                density="compact"
                variant="outlined"
                hide-details
                label="Precio de partida"
                style="max-width: 200px"
                @update:model-value="onPriceSourceChange"
              />
              <v-text-field
                v-model="addQty"
                density="compact"
                variant="outlined"
                hide-details
                label="Cantidad"
                type="number"
                min="1"
                style="max-width: 110px"
              />
              <v-text-field
                v-model="addMargin"
                density="compact"
                variant="outlined"
                hide-details
                label="Margen"
                type="number"
                suffix="%"
                style="max-width: 120px"
              />
            </div>
            <div class="text-caption text-medium-emphasis mt-2">
              {{ defaultsExplain }}
            </div>
          </div>

          <v-data-table
            :headers="productHeaders"
            :items="productResults"
            :loading="productLoading"
            density="compact"
            item-value="id"
            :items-per-page="10"
            no-data-text="No hay productos para mostrar. Probá con otro nombre o codigo."
            loading-text="Buscando productos..."
            items-per-page-text="Productos por pagina"
            @click:row="(e, { item }) => (pickedQty(item) ? stepProduct(item, 1) : addProduct(item))"
          >
            <template #item.thumb="{ item }">
              <img v-if="productImage(item)" :src="productImage(item)" class="picker-thumb" alt="" />
              <div v-else class="picker-thumb picker-thumb--empty">
                <v-icon size="16" color="grey">mdi-image-off-outline</v-icon>
              </div>
            </template>

            <template #item.name="{ item }">
              <div class="d-flex align-center ga-2">
                <span class="text-body-2">{{ item.name }}</span>
                <v-chip v-if="pickedQty(item)" size="x-small" color="primary" variant="tonal">
                  en el presupuesto
                </v-chip>
              </div>
              <div v-if="item.sku" class="text-caption text-medium-emphasis">Cod: {{ item.sku }}</div>
            </template>

            <template #item.base="{ item }">
              <span :class="{ 'text-error': !basePriceOf(item) }">{{ money(basePriceOf(item)) }}</span>
            </template>

            <template #item.preview="{ item }">
              <span class="font-weight-medium">{{ money(previewPrice(item)) }}</span>
            </template>

            <!-- Si el producto ya está en el presupuesto, en vez de "Agregar"
                 se muestra cuánto lleva y se puede subir o bajar desde acá. -->
            <template #item.actions="{ item }">
              <div v-if="pickedQty(item)" class="d-flex align-center justify-end ga-1">
                <v-btn
                  size="x-small"
                  variant="text"
                  icon="mdi-minus"
                  :loading="stepping === item.id"
                  @click.stop="stepProduct(item, -1)"
                />
                <span class="picked-qty">{{ pickedQty(item) }}</span>
                <v-btn
                  size="x-small"
                  variant="text"
                  icon="mdi-plus"
                  :loading="stepping === item.id"
                  @click.stop="stepProduct(item, 1)"
                />
              </div>
              <v-btn
                v-else
                size="small"
                variant="tonal"
                color="primary"
                :loading="stepping === item.id"
                @click.stop="addProduct(item)"
              >
                Agregar
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="productDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Selector de cliente -->
    <v-dialog v-model="customerDialog" max-width="760">
      <v-card>
        <v-card-title class="text-subtitle-1">Cliente del presupuesto</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="customerQuery"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-3"
            placeholder="Buscar cliente existente"
            prepend-inner-icon="mdi-magnify"
            @update:model-value="debouncedCustomerSearch"
          />

          <v-list density="compact" class="mb-4" max-height="240" style="overflow-y: auto">
            <v-list-item
              v-for="c in customerResults"
              :key="c.id"
              :title="c.display_name"
              :subtitle="[c.phone, c.email, c.doc_number].filter(Boolean).join(' / ')"
              @click="pickCustomer(c)"
            />
            <v-list-item v-if="!customerResults.length" class="text-medium-emphasis">
              Sin resultados. Podes cargar los datos a mano abajo.
            </v-list-item>
          </v-list>

          <v-divider class="mb-4" />

          <div class="text-caption text-medium-emphasis mb-2">Datos a mano (sin ficha de cliente)</div>
          <div class="d-flex flex-wrap ga-3">
            <v-text-field v-model="header.customer_name" label="Nombre" density="compact" variant="outlined" hide-details style="min-width: 220px" />
            <v-text-field v-model="header.customer_phone" label="Telefono" density="compact" variant="outlined" hide-details style="min-width: 160px" />
            <v-text-field v-model="header.customer_email" label="Email" density="compact" variant="outlined" hide-details style="min-width: 200px" />
            <v-text-field v-model="header.customer_cuit" label="CUIT / DNI" density="compact" variant="outlined" hide-details style="min-width: 160px" />
            <v-text-field v-model="header.customer_address" label="Direccion" density="compact" variant="outlined" hide-details style="min-width: 260px" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="customerDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" @click="saveCustomer">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Envío por mail -->
    <v-dialog v-model="mailDialog" max-width="560">
      <v-card>
        <v-card-title class="text-subtitle-1">Enviar presupuesto por mail</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="mailTo"
            label="Para"
            type="email"
            density="compact"
            variant="outlined"
            hide-details="auto"
            class="mb-3"
            :error-messages="mailToError"
            placeholder="cliente@ejemplo.com"
          />
          <v-text-field
            v-model="mailSubject"
            label="Asunto"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-3"
          />
          <v-textarea
            v-model="mailMessage"
            label="Mensaje"
            density="compact"
            variant="outlined"
            rows="5"
            auto-grow
            hide-details
          />
          <div class="text-caption text-medium-emphasis mt-3">
            <v-icon size="14" class="mr-1">mdi-paperclip</v-icon>
            Se adjunta {{ mailFilename }}, el mismo PDF que descargás desde acá.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="mailSending" @click="mailDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="mailSending" @click="sendMail">
            Enviar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Cotización al pasar a USD -->
    <v-dialog v-model="fxDialog" max-width="480" persistent>
      <v-card>
        <v-card-title class="text-subtitle-1">Presupuestar en dólares</v-card-title>
        <v-card-text>
          <div v-if="fxLoading" class="d-flex align-center ga-3 py-4">
            <v-progress-circular indeterminate size="20" width="2" />
            <span class="text-body-2">Consultando la cotización oficial...</span>
          </div>

          <template v-else>
            <v-alert v-if="fxError" type="warning" variant="tonal" density="compact" class="mb-4">
              {{ fxError }} Podés cargar la cotización a mano.
            </v-alert>

            <div v-else class="text-body-2 mb-4">
              {{ fxQuote?.source }}<br />
              <span class="text-medium-emphasis">
                Actualizada al {{ fmtDateTime(fxQuote?.date) }}
              </span>
            </div>

            <v-text-field
              v-model="fxRateInput"
              label="Cotización a aplicar (1 USD en pesos)"
              type="number"
              density="compact"
              variant="outlined"
              hide-details="auto"
              prefix="$"
              :hint="fxQuote ? `Oficial venta $ ${fxQuote.venta}. Podés cambiarla si usás otra.` : 'Ingresá la cotización que quieras usar.'"
              persistent-hint
            />

            <div class="text-body-2 mt-4">
              El total pasa de <strong>{{ moneyArs(totals.total) }}</strong> a
              <strong>{{ previewUsdTotal }}</strong>.
            </div>
            <div class="text-caption text-medium-emphasis mt-2">
              La cotización queda guardada en el presupuesto: si mañana cambia el dólar,
              este documento sigue mostrando los mismos importes.
            </div>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelFx">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!validFxRate" @click="confirmFx">
            Aplicar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import http from "@/app/api/http";
import { useProductsStore } from "@/app/store/products.store";
import { useAuthStore } from "@/app/store/auth.store";
import { listCustomers } from "@/modules/admin/services/customers.service";
import {
  getBudget,
  updateBudget,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  emailBudget,
  BUDGET_STATUS,
} from "../services/budgets.service";
import { fetchOfficialUsdRate } from "../services/fx.service";
import { exportBudgetPdf } from "../utils/budgetPdf";

const route = useRoute();
const id = route.params.id;

const budget = ref(null);
const items = ref([]);
const loading = ref(false);
const saveState = ref("");

const header = ref({
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  customer_address: "",
  customer_cuit: "",
  customer_id: null,
  status: "generado",
  currency: "ARS",
  // 1 USD = exchange_rate pesos. Siempre 1 cuando el presupuesto es en pesos.
  exchange_rate: 1,
  fx_source: "",
  fx_date: "",
  notes: "",
  show_cost: true,
});

const totals = ref({ subtotal: 0, vat_21: 0, vat_105: 0, total: 0 });

const snack = ref({ show: false, text: "", color: "success" });

// Encabezado del documento: identidad visual del shop (Ajustes > Identidad
// visual) + datos de la sucursal asignada al usuario. Nada hardcodeado.
const branding = ref({});
const branch = ref(null);

const companyName = computed(() => branding.value?.name || "");
// El isotipo (el simbolo solo), NO el logo apaisado con el texto: es lo que va
// tanto en la hoja como en el PDF.
const companyMark = computed(
  () => branding.value?.favicon_url || branding.value?.og_image_url || ""
);
const companyPhone = computed(
  () => branch.value?.phone || branding.value?.phone_display || branding.value?.whatsapp_display || ""
);
const companyAddress = computed(() => {
  const parts = branch.value
    ? [branch.value.address, branch.value.city, branch.value.province]
    : [branding.value?.address];
  return parts.filter(Boolean).join(", ");
});
const companyBranchName = computed(() => branch.value?.name || "");

async function loadIdentity() {
  // Identidad visual del shop. El endpoint admin trae ademas direccion y
  // telefonos; si el usuario no tiene permiso de admin caemos al publico,
  // que al menos da nombre y logo.
  try {
    const { data } = await http.get("/admin/shop/branding");
    branding.value = data?.item || data?.data || {};
  } catch {
    try {
      const { data } = await http.get("/public/shop/branding");
      branding.value = data?.item || {};
    } catch {
      branding.value = {};
    }
  }

  // Sucursal del usuario logueado
  try {
    const auth = useAuthStore();
    const myBranchId = Number(auth.branchId || auth.user?.branch_id || 0) || null;
    const { data } = await http.get("/branches");
    const list = data?.data || data?.items || [];
    branch.value = list.find((b) => Number(b.id) === myBranchId) || list[0] || null;
  } catch {
    branch.value = null;
  }
}

// Cada estado con una explicacion de cuando corresponde: los nombres solos no
// dicen en que momento del circuito comercial esta el presupuesto.
const STATUS_HINTS = {
  generado: "Recién armado, todavía no se le mostró al cliente.",
  en_proceso: "Se está preparando o esperando datos para cerrarlo.",
  entregado: "Ya se le pasó al cliente y está esperando respuesta.",
  vendido: "El cliente aceptó. Cerrado con venta.",
  no_venta: "El cliente no lo tomó. Cerrado sin venta.",
};

const statusItems = BUDGET_STATUS.map((s) => ({
  title: s.label,
  value: s.value,
  color: s.color,
  hint: STATUS_HINTS[s.value] || "",
}));

function statusTitleOf(v) {
  return statusItems.find((s) => s.value === v)?.title || v || "";
}
function statusColorOf(v) {
  return statusItems.find((s) => s.value === v)?.color || "default";
}
function statusHintOf(v) {
  return statusItems.find((s) => s.value === v)?.hint || "";
}

const customerLine = computed(() =>
  [header.value.customer_phone, header.value.customer_email, header.value.customer_cuit]
    .filter(Boolean)
    .join(" / ")
);

// Los importes se guardan SIEMPRE en pesos. Presupuestar en USD no reescribe
// nada: divide por la cotizacion guardada al momento de mostrar.
const fxRate = computed(() => {
  const r = Number(header.value.exchange_rate || 1);
  return Number.isFinite(r) && r > 0 ? r : 1;
});

function toDisplay(v) {
  const n = Number(v || 0);
  return header.value.currency === "USD" ? n / fxRate.value : n;
}

function fmtAmount(n, symbol) {
  return `${symbol} ${Number(n || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function money(v) {
  const symbol = header.value.currency === "USD" ? "US$" : "$";
  return fmtAmount(toDisplay(v), symbol);
}

// Importe en pesos sin convertir, para comparar en el dialogo de cotizacion.
function moneyArs(v) {
  return fmtAmount(v, "$");
}

const fxCaption = computed(() => {
  if (header.value.currency !== "USD") return "";
  const parts = [`US$ 1 = ${fmtAmount(fxRate.value, "$")}`];
  if (header.value.fx_source) parts.push(header.value.fx_source);
  if (header.value.fx_date) parts.push(fmtDateTime(header.value.fx_date));
  return parts.join(" · ");
});

function fmtDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDateTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function notify(text, color = "success") {
  snack.value = { show: true, text, color };
}

function applyBudget(data) {
  budget.value = data;
  items.value = (data.items || []).map((i) => ({ ...i }));
  header.value = {
    customer_name: data.customer_name || "",
    customer_email: data.customer_email || "",
    customer_phone: data.customer_phone || "",
    customer_address: data.customer_address || "",
    customer_cuit: data.customer_cuit || "",
    customer_id: data.customer_id || null,
    status: data.status,
    currency: data.currency,
    exchange_rate: Number(data.exchange_rate) || 1,
    fx_source: data.fx_source || "",
    fx_date: data.fx_date || "",
    notes: data.notes || "",
    show_cost: !!data.show_cost,
  };
  totals.value = {
    subtotal: data.subtotal,
    vat_21: data.vat_21,
    vat_105: data.vat_105,
    total: data.total,
  };
}

async function load() {
  loading.value = true;
  try {
    const { data } = await getBudget(id);
    applyBudget(data.data);
  } catch (e) {
    notify(e?.response?.data?.message || "No se pudo cargar el presupuesto.", "error");
  } finally {
    loading.value = false;
  }
}

async function saveHeader() {
  saveState.value = "Guardando...";
  try {
    const { data } = await updateBudget(id, { ...header.value });
    budget.value = data.data;
    saveState.value = "Guardado";
    setTimeout(() => (saveState.value = ""), 1500);
  } catch (e) {
    saveState.value = "";
    notify(e?.response?.data?.message || "No se pudo guardar.", "error");
  }
}

function toggleShowCost() {
  header.value.show_cost = !header.value.show_cost;
  saveHeader();
}

function setStatus(v) {
  if (header.value.status === v) return;
  header.value.status = v;
  saveHeader();
}

// ── Moneda ────────────────────────────────────────────────────────────────
// Pasar a USD no es cambiar el simbolo: se pide la cotizacion oficial, se le
// muestra al usuario cual es y de cuando, y recien ahi se aplica y se guarda.
const fxDialog = ref(false);
const fxLoading = ref(false);
const fxError = ref("");
const fxQuote = ref(null);
const fxRateInput = ref("");

const validFxRate = computed(() => {
  const n = Number(fxRateInput.value);
  return Number.isFinite(n) && n > 0;
});

const previewUsdTotal = computed(() => {
  const n = Number(fxRateInput.value);
  if (!Number.isFinite(n) || n <= 0) return "US$ 0,00";
  return fmtAmount(Number(totals.value.total || 0) / n, "US$");
});

async function setCurrency(v) {
  if (header.value.currency === v) return;

  if (v === "ARS") {
    header.value.currency = "ARS";
    header.value.exchange_rate = 1;
    header.value.fx_source = "";
    header.value.fx_date = "";
    await saveHeader();
    return;
  }

  fxDialog.value = true;
  fxLoading.value = true;
  fxError.value = "";
  fxQuote.value = null;
  fxRateInput.value = "";
  try {
    const q = await fetchOfficialUsdRate();
    fxQuote.value = q;
    fxRateInput.value = String(q.rate);
  } catch (e) {
    fxError.value = e?.message || "No se pudo obtener la cotización oficial.";
    // Si ya habia una cotizacion guardada la ofrecemos como punto de partida.
    fxRateInput.value = header.value.exchange_rate > 1 ? String(header.value.exchange_rate) : "";
  } finally {
    fxLoading.value = false;
  }
}

function cancelFx() {
  fxDialog.value = false;
}

async function confirmFx() {
  if (!validFxRate.value) return;
  header.value.currency = "USD";
  header.value.exchange_rate = Number(fxRateInput.value);
  header.value.fx_source = fxQuote.value?.source || "Cotización cargada a mano";
  header.value.fx_date = fxQuote.value?.date || new Date().toISOString();
  fxDialog.value = false;
  await saveHeader();
  notify("Cotización aplicada al presupuesto.");
}

// ── Envío por mail ────────────────────────────────────────────────────────
const mailDialog = ref(false);
const mailTo = ref("");
const mailSubject = ref("");
const mailMessage = ref("");
const mailSending = ref(false);
const mailToError = ref("");

const mailFilename = computed(() => `presupuesto-${budget.value?.number ?? ""}.pdf`);

function openMailDialog() {
  mailTo.value = header.value.customer_email || "";
  mailSubject.value = `Presupuesto #${budget.value?.number ?? ""} - ${companyName.value}`.trim();
  const cliente = header.value.customer_name && header.value.customer_name !== "Consumidor Final"
    ? header.value.customer_name
    : "";
  mailMessage.value = [
    cliente ? `Hola ${cliente},` : "Hola,",
    "",
    `Te enviamos el presupuesto #${budget.value?.number ?? ""} en el archivo adjunto.`,
    budget.value?.valid_until ? `Tiene validez hasta el ${fmtDate(budget.value.valid_until)}.` : "",
    "",
    "Quedamos a disposición por cualquier consulta.",
  ]
    .filter((l) => l !== null)
    .join("\n");
  mailToError.value = "";
  mailDialog.value = true;
}

async function sendMail() {
  const to = String(mailTo.value || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    mailToError.value = "Escribí un email válido.";
    return;
  }
  mailToError.value = "";
  mailSending.value = true;
  try {
    // El mismo generador que usa la descarga, pero sin bajar el archivo.
    const { base64, filename } = await exportBudgetPdf({
      budget: { ...budget.value, ...header.value },
      items: items.value,
      totals: totals.value,
      identity: { branding: branding.value, branch: branch.value },
      fxCaption: fxCaption.value,
      output: "base64",
    });

    await emailBudget(id, {
      to,
      subject: mailSubject.value,
      message: mailMessage.value,
      pdf_base64: base64,
      filename,
    });

    mailDialog.value = false;
    notify(`Presupuesto enviado a ${to}.`);
    // El backend puede haber movido el estado a "entregado".
    load();
  } catch (e) {
    console.error("[budgets] sendMail:", e);
    notify(e?.response?.data?.message || "No se pudo enviar el correo.", "error");
  } finally {
    mailSending.value = false;
  }
}

// ── Lista de precios por renglón ──────────────────────────────────────────
// Las tres listas que maneja el catálogo. El costo queda afuera: es interno y
// se edita a mano en su propia columna.
const rowPriceSources = [
  { title: "Precio de venta", value: "sale" },
  { title: "Precio de lista", value: "list" },
  { title: "Precio revendedor", value: "reseller" },
];

function priceSourceLabel(v) {
  return rowPriceSources.find((s) => s.value === v)?.title || "Precio de venta";
}

// El backend vuelve a tomar el precio de la ficha del producto: desde acá solo
// se manda cuál lista usar.
async function setItemPriceSource(item, source) {
  if ((item.price_source || "sale") === source) return;
  saveState.value = "Guardando...";
  try {
    const { data } = await updateBudgetItem(id, item.id, { price_source: source });
    Object.assign(item, data.data);
    totals.value = data.totals;
    saveState.value = "Guardado";
    setTimeout(() => (saveState.value = ""), 1500);
  } catch (e) {
    saveState.value = "";
    notify(e?.response?.data?.message || "No se pudo cambiar la lista de precios.", "error");
  }
}

// ── Especificaciones ──────────────────────────────────────────────────────
const specsOpen = ref({});

function toggleSpecs(item) {
  specsOpen.value = { ...specsOpen.value, [item.id]: !specsOpen.value[item.id] };
}

function specsButtonLabel(item) {
  return item.specs ? "Editar especificaciones" : "Agregar especificaciones";
}

const itemsWithSpecs = computed(() => items.value.filter((i) => String(i.specs || "").trim()));

async function saveItemSpecs(item) {
  saveState.value = "Guardando...";
  try {
    const { data } = await updateBudgetItem(id, item.id, { specs: item.specs ?? "" });
    Object.assign(item, data.data);
    saveState.value = "Guardado";
    setTimeout(() => (saveState.value = ""), 1500);
  } catch (e) {
    saveState.value = "";
    notify(e?.response?.data?.message || "No se pudieron guardar las especificaciones.", "error");
  }
}

async function saveItem(item) {
  saveState.value = "Guardando...";
  try {
    const { data } = await updateBudgetItem(id, item.id, {
      qty: item.qty,
      cost: item.cost,
      margin_pct: item.margin_pct,
      vat_rate: item.vat_rate,
      description: item.description,
    });
    Object.assign(item, data.data);
    totals.value = data.totals;
    saveState.value = "Guardado";
    setTimeout(() => (saveState.value = ""), 1500);
  } catch (e) {
    saveState.value = "";
    notify(e?.response?.data?.message || "No se pudo guardar el renglon.", "error");
  }
}

async function removeItem(item) {
  try {
    const { data } = await deleteBudgetItem(id, item.id);
    items.value = items.value.filter((i) => i.id !== item.id);
    totals.value = data.totals;
  } catch (e) {
    notify(e?.response?.data?.message || "No se pudo eliminar el renglon.", "error");
  }
}

async function addFreeLine() {
  try {
    const { data } = await addBudgetItem(id, { description: "Modifique este texto.", vat_rate: 0 });
    items.value.push(data.data);
    totals.value = data.totals;
  } catch (e) {
    notify(e?.response?.data?.message || "No se pudo agregar el renglon.", "error");
  }
}

// ── Productos ─────────────────────────────────────────────────────────────
const productDialog = ref(false);
const productQuery = ref("");
const productResults = ref([]);
const productLoading = ref(false);
const addQty = ref(1);
const addMargin = ref(20);
const stepping = ref(null);

// Renglones ya cargados, por producto: sirve para mostrar en el buscador que
// el producto ya esta en el presupuesto y con cuanta cantidad.
const itemsByProduct = computed(() => {
  const map = new Map();
  for (const it of items.value) {
    if (!it.product_id) continue;
    const key = Number(it.product_id);
    const prev = map.get(key);
    // Si el mismo producto quedo en dos renglones, movemos el primero.
    if (!prev) map.set(key, { item: it, qty: Number(it.qty) || 0 });
    else prev.qty += Number(it.qty) || 0;
  }
  return map;
});

function pickedQty(product) {
  const e = itemsByProduct.value.get(Number(product?.id));
  if (!e) return 0;
  // Se muestra sin decimales cuando es entero, que es el caso normal.
  return Number.isInteger(e.qty) ? e.qty : Number(e.qty.toFixed(3));
}

// Sube o baja la cantidad del renglon existente. Al llegar a cero se elimina.
async function stepProduct(product, delta) {
  const entry = itemsByProduct.value.get(Number(product?.id));
  if (!entry) return addProduct(product);

  const target = Number(entry.item.qty || 0) + delta;
  stepping.value = product.id;
  try {
    if (target <= 0) {
      await removeItem(entry.item);
    } else {
      entry.item.qty = target;
      await saveItem(entry.item);
    }
  } finally {
    stepping.value = null;
  }
}

const defaultsExplain = computed(() => {
  const src = priceSourceItems.find((s) => s.value === priceSource.value)?.title || "";
  const margin = Number(addMargin.value) || 0;
  const qty = Number(addQty.value) || 1;
  const base = src.toLowerCase();
  return margin > 0
    ? `Entra con cantidad ${qty}, tomando ${base} y sumándole ${margin}% de margen. Podés cambiarlo renglón por renglón después.`
    : `Entra con cantidad ${qty}, tomando ${base} sin margen extra. Podés cambiarlo renglón por renglón después.`;
});

const productHeaders = [
  { title: "", key: "thumb", sortable: false, width: 60 },
  { title: "Producto", key: "name" },
  { title: "Base", key: "base", align: "end", width: 120 },
  { title: "Precio con margen", key: "preview", align: "end", width: 160 },
  { title: "", key: "actions", align: "end", sortable: false, width: 110 },
];

const productsStore = useProductsStore();

// Miniatura: el listado devuelve la imagen con distintos nombres segun de
// donde venga el producto, asi que probamos todas.
function productImage(p) {
  return (
    p?.image_url ||
    p?.main_image_url ||
    p?.thumbnail_url ||
    p?.cover_url ||
    (Array.isArray(p?.images) ? p.images[0]?.url || p.images[0]?.image_url : null) ||
    null
  );
}

// De donde sale el valor base del renglon. El catalogo no tiene costo
// cargado, asi que por defecto usamos el precio de venta vigente (misma
// cascada que el POS) con margen 0.
const priceSource = ref("sale");

const priceSourceItems = [
  { title: "Precio de venta", value: "sale" },
  { title: "Precio de lista", value: "list" },
  { title: "Precio revendedor", value: "reseller" },
  { title: "Costo", value: "cost" },
];

function firstPositive(...vals) {
  for (const v of vals) {
    const n = Number(v || 0);
    if (n > 0) return n;
  }
  return 0;
}

function basePriceOf(p) {
  const sale = firstPositive(p?.price_discount, p?.price_list, p?.price_reseller, p?.price);
  if (priceSource.value === "cost") return Number(p?.cost || 0);
  if (priceSource.value === "list") return firstPositive(p?.price_list, sale);
  if (priceSource.value === "reseller") return firstPositive(p?.price_reseller, sale);
  return sale;
}

// Al cambiar la base, el margen razonable cambia: sobre un precio de venta ya
// terminado no se vuelve a marcar, sobre costo o revendedor si.
function onPriceSourceChange() {
  addMargin.value = ["cost", "reseller"].includes(priceSource.value) ? 20 : 0;
}

// Lo que va a salir en el presupuesto con el margen actual: evita tener que
// agregarlo para recien ahi ver el precio.
function previewPrice(p) {
  return basePriceOf(p) * (1 + Number(addMargin.value || 0) / 100);
}

let productDebounce = null;
function debouncedProductSearch() {
  clearTimeout(productDebounce);
  productDebounce = setTimeout(searchProducts, 350);
}

// Se llama tambien al abrir el dialogo: sin texto trae los ultimos cargados,
// asi la tabla nunca arranca vacia.
async function searchProducts() {
  productLoading.value = true;
  try {
    await productsStore.fetchList({
      q: productQuery.value || undefined,
      limit: 25,
      page: 1,
    });
    productResults.value = productsStore.items || [];
    if (productsStore.error) {
      notify(productsStore.error?.message || "No se pudieron traer los productos.", "error");
    }
  } catch (e) {
    productResults.value = [];
    notify("No se pudo buscar productos.", "error");
  } finally {
    productLoading.value = false;
  }
}

function openProductDialog() {
  productDialog.value = true;
  searchProducts();
}

// Enter en el buscador agrega el primer resultado: para cargar rapido varios
// productos seguidos sin tocar el mouse.
function addFirstResult() {
  if (productResults.value.length) addProduct(productResults.value[0]);
}

async function addProduct(product) {
  try {
    const { data } = await addBudgetItem(id, {
      product_id: product.id,
      qty: addQty.value,
      margin_pct: addMargin.value,
      price_source: priceSource.value,
      image_url: productImage(product),
    });
    items.value.push(data.data);
    totals.value = data.totals;
    notify(`${product.name} agregado.`);
  } catch (e) {
    notify(e?.response?.data?.message || "No se pudo agregar el producto.", "error");
  }
}

// ── Clientes ──────────────────────────────────────────────────────────────
const customerDialog = ref(false);
const customerQuery = ref("");
const customerResults = ref([]);

function openCustomerDialog() {
  customerDialog.value = true;
  searchCustomers();
}

let customerDebounce = null;
function debouncedCustomerSearch() {
  clearTimeout(customerDebounce);
  customerDebounce = setTimeout(searchCustomers, 350);
}

async function searchCustomers() {
  try {
    const { data } = await listCustomers({ q: customerQuery.value, limit: 20 });
    customerResults.value = data?.data || [];
  } catch (e) {
    customerResults.value = [];
  }
}

function pickCustomer(c) {
  header.value.customer_id = c.id;
  header.value.customer_name = c.display_name || "";
  header.value.customer_phone = c.phone || "";
  header.value.customer_email = c.email || "";
  header.value.customer_cuit = c.doc_number || "";
  header.value.customer_address = c.address || "";
}

async function saveCustomer() {
  await saveHeader();
  customerDialog.value = false;
}

// ── PDF ───────────────────────────────────────────────────────────────────
// La generación vive en utils/budgetPdf.js porque el listado también exporta.
async function exportPdf() {
  try {
    await exportBudgetPdf({
      budget: { ...budget.value, ...header.value },
      items: items.value,
      totals: totals.value,
      identity: { branding: branding.value, branch: branch.value },
      fxCaption: fxCaption.value,
    });
  } catch (e) {
    console.error("[budgets] exportPdf:", e);
    notify(`No se pudo generar el PDF: ${e?.message || e}`, "error");
  }
}


onMounted(() => {
  load();
  loadIdentity();
});
</script>


<style scoped>
.toolbar {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  position: sticky;
  top: 0;
  z-index: 3;
  background: rgb(var(--v-theme-surface));
}

.statusbar {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  background: rgb(var(--v-theme-surface));
  min-height: 44px;
}

/* Controles inline de la franja: chips discretos, no botones del navegador. */
.inline-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(var(--v-border-color), 0.22);
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  transition: background-color 0.12s ease, border-color 0.12s ease;
}
.inline-control:hover {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-color: rgba(var(--v-border-color), 0.4);
}
/* Sin el recuadro negro del navegador: solo se marca con teclado. */
.inline-control:focus {
  outline: none;
}
.inline-control:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 1px;
}
.inline-control .v-icon {
  opacity: 0.55;
}
.inline-control .status-dot {
  opacity: 1;
}

.sheet-wrap {
  display: flex;
  justify-content: center;
}

/* Hoja: documento sobrio, sin marcos. La jerarquia la dan el espacio y la
   tipografia, no los bordes. */
.sheet {
  width: 100%;
  max-width: 940px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.1);
  border-radius: 4px;
  padding: 48px 52px 56px;
}

/* ── Encabezado ────────────────────────────────────────────────────────── */
.doc-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
  flex-wrap: wrap;
  padding-bottom: 28px;
  border-bottom: 2px solid rgba(var(--v-theme-on-surface), 0.85);
}

.company-mark {
  width: 52px;
  height: 52px;
  object-fit: contain;
  flex: none;
}

.company-info {
  font-size: 12px;
  line-height: 1.6;
  opacity: 0.75;
}

.company-name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
  opacity: 1;
  margin-bottom: 2px;
}

.doc-meta {
  text-align: right;
  min-width: 200px;
}

.doc-kind {
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  opacity: 0.55;
}

.doc-number {
  font-size: 30px;
  font-weight: 600;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  margin-bottom: 10px;
}

.doc-dates {
  display: grid;
  grid-template-columns: auto auto;
  gap: 2px 14px;
  justify-content: end;
  font-size: 12px;
  margin: 0;
}
.doc-dates dt {
  opacity: 0.55;
  text-align: left;
}
.doc-dates dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

/* ── Secciones ─────────────────────────────────────────────────────────── */
.doc-section {
  margin-top: 36px;
}

.section-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.5;
  margin-bottom: 10px;
}

.customer-name {
  font-size: 15px;
  font-weight: 600;
}

/* ── Renglones ─────────────────────────────────────────────────────────── */
.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 36px;
  font-size: 13px;
}

.items-table thead th {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.5;
  text-align: left;
  padding: 0 8px 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.35);
}

.items-table tbody td {
  padding: 12px 8px;
  vertical-align: top;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.14);
}

.item-row:hover td {
  background: rgba(var(--v-theme-on-surface), 0.015);
}

.col-qty {
  width: 68px;
  text-align: center;
}
.col-num {
  width: 108px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.items-table thead th.col-num,
.items-table thead th.col-qty {
  text-align: right;
}
.items-table thead th.col-qty {
  text-align: center;
}
.col-act {
  width: 40px;
  text-align: center;
}

.amount {
  font-weight: 600;
}

/* Costo y margen son informacion interna: se marcan al ojo para no confundirlos
   con lo que ve el cliente. */
.col-private {
  background: rgba(33, 150, 243, 0.05);
}

.item-sku {
  font-size: 11px;
  letter-spacing: 0.04em;
  opacity: 0.55;
}

.price-source {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  margin-top: 2px;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-size: 10.5px;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
}
.price-source:hover {
  text-decoration: underline;
}

.specs-toggle {
  font-size: 11px;
  color: rgb(var(--v-theme-primary));
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
.specs-toggle:hover {
  text-decoration: underline;
}

.specs-row td {
  padding-top: 0;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.14);
}

.cell-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  color: inherit;
  padding: 2px 0;
}
.cell-input:focus {
  background: rgba(var(--v-theme-primary), 0.06);
}
.cell-input--title {
  font-weight: 500;
}

.min-w-0 {
  min-width: 0;
}

.item-thumb {
  width: 44px;
  height: 44px;
  object-fit: contain;
  flex: none;
  border-radius: 3px;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

/* ── Totales ───────────────────────────────────────────────────────────── */
.totals-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.totals {
  display: grid;
  grid-template-columns: auto minmax(150px, auto);
  gap: 8px 32px;
  font-size: 13px;
  margin: 0;
  min-width: 320px;
}
.totals dt {
  opacity: 0.6;
}
.totals dd {
  margin: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.totals dt.grand,
.totals dd.grand {
  padding-top: 12px;
  margin-top: 4px;
  border-top: 2px solid rgba(var(--v-theme-on-surface), 0.85);
  font-size: 17px;
  font-weight: 700;
  opacity: 1;
}

.fx-note {
  text-align: right;
  font-size: 11px;
  opacity: 0.6;
  margin-top: 8px;
}

/* ── Especificaciones ──────────────────────────────────────────────────── */
.spec-block {
  display: flex;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}
.spec-block:last-child {
  border-bottom: none;
}

.spec-thumb {
  width: 52px;
  height: 52px;
  object-fit: contain;
  flex: none;
  border-radius: 3px;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.spec-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}

.spec-text {
  font-size: 12px;
  line-height: 1.6;
  opacity: 0.75;
  white-space: pre-wrap;
}

/* ── Selector de productos ─────────────────────────────────────────────── */
/* Los valores por defecto van en una caja propia para que no se lean como
   filtros del buscador. */
.defaults-box {
  border: 1px solid rgba(var(--v-border-color), 0.2);
  border-radius: 6px;
  padding: 14px 16px 12px;
  background: rgba(var(--v-theme-on-surface), 0.015);
}

.defaults-head {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.55;
  margin-bottom: 12px;
}

.picked-qty {
  min-width: 26px;
  text-align: center;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.picker-thumb {
  width: 36px;
  height: 36px;
  object-fit: contain;
  border: 1px solid rgba(var(--v-border-color), 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.picker-thumb--empty {
  background: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
