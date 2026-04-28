<!-- src/modules/products/pages/ProductFormPage.vue -->
<template>
  <div class="pfp-root">

    <!-- ══ HEADER ══ -->
    <AppPageHeader
      :icon="isEdit ? 'mdi-pencil-outline' : 'mdi-plus-circle-outline'"
      :title="isEdit ? 'Editar producto' : 'Nuevo producto'"
      :subtitle="isEdit && draft?.sku ? `SKU ${draft.sku}` : ''"
      class="px-4 pt-3"
    />

    <!-- ══ TOP BAR (steps) ══ -->
    <div class="pfp-topbar">
      <div class="pfp-topbar-inner">

        <!-- Steps (desktop) -->
        <div class="pfp-steps-row" v-if="mdAndUp">
          <button
            v-for="s in STEPS"
            :key="s.value"
            class="pfp-step-btn"
            :class="{ active: step === s.value, done: step > s.value, disabled: !canGoTo(s.value) }"
            :disabled="!canGoTo(s.value)"
            @click="goToStep(s.value)"
            type="button"
          >
            <span class="pfp-step-num">
              <v-icon v-if="step > s.value" size="13" color="white">mdi-check</v-icon>
              <span v-else>{{ s.value }}</span>
            </span>
            <span class="pfp-step-label">{{ s.title }}</span>
          </button>
        </div>

        <!-- Mobile step info -->
        <div class="pfp-steps-mobile" v-else>
          <div class="pfp-step-mobile-info">
            <span class="pfp-step-mobile-count">{{ step }}/{{ STEPS.length }}</span>
            <span class="pfp-step-mobile-name">{{ STEPS[step - 1].title }}</span>
          </div>
          <div class="pfp-dots-row">
            <span v-for="s in STEPS" :key="s.value" class="pfp-dot"
              :class="{ active: step === s.value, done: step > s.value }" />
          </div>
        </div>

        <!-- Slot derecho: solo loader y chip de contexto en edición.
             En creación NO mostramos un chip "Nuevo" porque ya quedó claro
             desde el AppPageHeader ("Nuevo producto") arriba. -->
        <div class="pfp-topbar-right">
          <v-progress-circular v-if="busy" indeterminate size="20" width="2" color="primary" />
          <div v-if="isEdit && draft?.id" class="pfp-ctx-chip" :title="draft?.sku || ''">
            <v-icon size="13">mdi-pound</v-icon>
            <span class="pfp-ctx-id">{{ draft.id }}</span>
            <span v-if="draft?.sku" class="pfp-ctx-sku">{{ draft.sku }}</span>
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="pfp-prog-wrap">
        <div class="pfp-prog-bar" :style="{ width: `${(step / 3) * 100}%` }" />
      </div>
    </div>

    <!-- ══ LAYOUT ══ -->
    <div class="pfp-layout">

      <!-- ══ MAIN ══ -->
      <main class="pfp-main" ref="mainRef">
        <div class="pfp-content">

          <!-- ── LOADING ── -->
          <div v-if="initialLoading" class="pfp-init-loading">
            <v-progress-circular indeterminate size="48" color="primary" />
            <div class="mt-4 text-caption text-medium-emphasis">Cargando producto…</div>
          </div>

          <template v-else>

            <!-- ══ STEP 1 ══ -->
            <div v-show="step === 1">
              <div v-if="products.error" class="pfp-alert-error mb-4">
                <v-icon size="18" color="error" class="mr-2">mdi-alert-circle</v-icon>
                <div>
                  <div class="font-weight-bold text-body-2">{{ products.error }}</div>
                  <div v-if="products.lastFieldErrors" class="mt-1">
                    <div v-for="(msg, field) in products.lastFieldErrors" :key="field" class="text-caption">
                      • <b>{{ field }}</b>: {{ msg }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── ESCANEAR para autocompletar (solo mobile, solo en creación) ── -->
              <div v-if="!isEdit" class="pfp-scan-row">
                <BarcodeScanButton
                  mode="emit-product"
                  label="Escanear código de barras"
                  title="Escanear producto"
                  icon="mdi-barcode-scan"
                  color="primary"
                  variant="flat"
                  size="large"
                  block
                  @product="onScannedProduct"
                  @scanned="onScannedCode"
                />
                <div class="pfp-scan-hint">
                  Si el código ya existe en tu catálogo, completa los datos automáticamente. Si no, lo guarda como código del nuevo producto.
                </div>
              </div>

              <!-- 2-col layout on lg+ -->
              <div class="pfp-step1-grid">

                <!-- LEFT COL -->
                <div class="d-flex flex-column ga-4">

                  <!-- Información básica -->
                  <div class="pfp-section">
                    <div class="pfp-section-head" style="--accent:#3b82f6">
                      <div class="pfp-section-icon"><v-icon size="16" color="white">mdi-information-outline</v-icon></div>
                      <div>
                        <div class="pfp-section-title">Información básica</div>
                        <div class="pfp-section-sub">Nombre, marca y descripción</div>
                      </div>
                    </div>
                    <div class="pfp-section-body">
                      <v-row dense>
                        <v-col cols="12">
                          <v-text-field v-model="draft.name" :disabled="busy" density="compact" variant="outlined"
                            label="Nombre del producto *" placeholder="Ej: Auriculares Bluetooth Sony WH-1000XM5"
                            :error="!draft.name && step1Touched"
                            :error-messages="!draft.name && step1Touched ? ['Obligatorio'] : []"
                            prepend-inner-icon="mdi-package-variant" hide-details="auto" />
                        </v-col>
                        <v-col cols="6">
                          <v-text-field v-model="draft.brand" :disabled="busy" density="compact" variant="outlined"
                            label="Marca" prepend-inner-icon="mdi-tag" hide-details />
                        </v-col>
                        <v-col cols="6">
                          <v-text-field v-model="draft.model" :disabled="busy" density="compact" variant="outlined"
                            label="Modelo" prepend-inner-icon="mdi-identifier" hide-details />
                        </v-col>
                        <v-col cols="12">
                          <v-textarea v-model="draft.description" :disabled="busy" density="compact"
                            variant="outlined" label="Descripción"
                            placeholder="Características, especificaciones, usos…"
                            auto-grow rows="2" prepend-inner-icon="mdi-text-box-outline" hide-details />
                        </v-col>
                      </v-row>
                    </div>
                  </div>

                  <!-- Precios -->
                  <div class="pfp-section">
                    <div class="pfp-section-head" style="--accent:#10b981">
                      <div class="pfp-section-icon"><v-icon size="16" color="white">mdi-cash-multiple</v-icon></div>
                      <div>
                        <div class="pfp-section-title">Precios</div>
                        <div class="pfp-section-sub">Todos opcionales</div>
                      </div>
                    </div>
                    <div class="pfp-section-body">
                      <v-row dense>
                        <v-col cols="12" sm="4">
                          <v-text-field v-model="draft.price_list" :disabled="busy" density="compact"
                            variant="outlined" label="Lista" type="number" min="0"
                            prepend-inner-icon="mdi-currency-usd" :error-messages="fieldErr('price_list')" hide-details="auto" />
                        </v-col>
                        <v-col cols="12" sm="4">
                          <v-text-field v-model="draft.price_discount" :disabled="busy" density="compact"
                            variant="outlined" label="Descuento" type="number" min="0"
                            prepend-inner-icon="mdi-tag-minus" :error-messages="fieldErr('price_discount')" hide-details="auto" />
                        </v-col>
                        <v-col cols="12" sm="4">
                          <v-text-field v-model="draft.price_reseller" :disabled="busy" density="compact"
                            variant="outlined" label="Revendedor" type="number" min="0"
                            prepend-inner-icon="mdi-store-outline" :error-messages="fieldErr('price_reseller')" hide-details="auto" />
                        </v-col>
                      </v-row>
                    </div>
                  </div>

                </div><!-- /left col -->

                <!-- RIGHT COL -->
                <div class="d-flex flex-column ga-4">

                  <!-- Clasificación -->
                  <div class="pfp-section">
                    <div class="pfp-section-head" style="--accent:#8b5cf6">
                      <div class="pfp-section-icon"><v-icon size="16" color="white">mdi-folder-tree-outline</v-icon></div>
                      <div>
                        <div class="pfp-section-title">Clasificación</div>
                        <div class="pfp-section-sub">Rubro, subrubro, SKU</div>
                      </div>
                      <v-btn size="x-small" variant="text" class="ml-auto" @click="ensureTaxonomies" :disabled="busy">
                        <v-icon size="14">mdi-refresh</v-icon>
                      </v-btn>
                    </div>
                    <div class="pfp-section-body">
                      <v-row dense>
                        <v-col cols="12" sm="6">
                          <v-select v-model="draftCategoryId" :items="categoriesList" item-title="name" item-value="id"
                            :disabled="busy" density="compact" variant="outlined" label="Rubro *"
                            prepend-inner-icon="mdi-shape-outline" hide-details="auto" clearable
                            :error="!draftCategoryId && step1Touched"
                            :error-messages="!draftCategoryId && step1Touched ? ['Obligatorio'] : []"
                            :menu-props="{ maxHeight: 360 }" />
                        </v-col>
                        <v-col cols="12" sm="6">
                          <v-select v-model="draftSubcategoryId" :items="filteredSubcategories" item-title="name"
                            item-value="id" :disabled="busy || !draftCategoryId" density="compact"
                            variant="outlined" label="Subrubro *" prepend-inner-icon="mdi-shape-plus-outline"
                            hide-details="auto" clearable
                            :error="!draftSubcategoryId && step1Touched"
                            :error-messages="!draftSubcategoryId && step1Touched ? ['Obligatorio'] : []"
                            :menu-props="{ maxHeight: 360 }">
                            <template #no-data>
                              <div class="pa-3 text-caption text-medium-emphasis">
                                {{ draftCategoryId ? 'Sin subrubros.' : 'Seleccioná un rubro primero.' }}
                              </div>
                            </template>
                          </v-select>
                        </v-col>
                        <v-col cols="12" sm="8">
                          <v-text-field :model-value="skuPreview || draft.sku || ''" density="compact"
                            variant="outlined" label="SKU (auto)" prepend-inner-icon="mdi-barcode-scan"
                            hide-details readonly
                            :placeholder="draftCategoryId && draftSubcategoryId ? 'Calculando…' : 'Seleccioná rubro y subrubro'" />
                        </v-col>
                        <v-col cols="12" sm="4">
                          <v-text-field :model-value="draft.code || nextCodePreview || ''" density="compact"
                            variant="outlined" label="Código interno" prepend-inner-icon="mdi-pound"
                            hide-details readonly />
                        </v-col>
                      </v-row>
                    </div>
                  </div>

                  <!-- Estado -->
                  <div class="pfp-section">
                    <div class="pfp-section-head" style="--accent:#f59e0b">
                      <div class="pfp-section-icon"><v-icon size="16" color="white">mdi-tune-variant</v-icon></div>
                      <div>
                        <div class="pfp-section-title">Estado y stock</div>
                        <div class="pfp-section-sub">Visibilidad e inventario</div>
                      </div>
                    </div>
                    <div class="pfp-section-body">
                      <div class="pfp-toggle-row">
                        <div class="pfp-toggle-card" :class="{ on: draft.is_active }" @click="draft.is_active = !draft.is_active">
                          <v-icon size="22" :color="draft.is_active ? 'success' : undefined">
                            {{ draft.is_active ? 'mdi-eye' : 'mdi-eye-off' }}
                          </v-icon>
                          <div class="pfp-toggle-text">
                            <div class="pfp-toggle-label">Activo</div>
                            <div class="pfp-toggle-sub">{{ draft.is_active ? 'Visible en catálogo' : 'Oculto' }}</div>
                          </div>
                          <v-switch v-model="draft.is_active" inset density="compact" hide-details :disabled="busy" color="success" @click.stop />
                        </div>
                        <div class="pfp-toggle-card" :class="{ on: draft.track_stock }" @click="draft.track_stock = !draft.track_stock">
                          <v-icon size="22" :color="draft.track_stock ? 'primary' : undefined">mdi-package-check</v-icon>
                          <div class="pfp-toggle-text">
                            <div class="pfp-toggle-label">Gestionar stock</div>
                            <div class="pfp-toggle-sub">{{ draft.track_stock ? 'Con control' : 'Sin control' }}</div>
                          </div>
                          <v-switch v-model="draft.track_stock" inset density="compact" hide-details :disabled="busy" color="primary" @click.stop />
                        </div>
                      </div>
                    </div>
                  </div>

                </div><!-- /right col -->
              </div><!-- /step1-grid -->

              <!-- ══ PROMOCIÓN (ancho completo) ══ -->
              <div class="pfp-section pfp-promo-section mt-4" :class="{ 'pfp-promo-on': draft.is_promo }">
                <div class="pfp-section-head" style="--accent:#02498b">
                  <div class="pfp-section-icon"><v-icon size="16" color="white">mdi-tag-heart</v-icon></div>
                  <div>
                    <div class="pfp-section-title">Promoción</div>
                    <div class="pfp-section-sub">
                      {{ draft.is_promo
                        ? 'Mostrá el producto como promoción en la tienda'
                        : 'Activá para configurar precio especial o descuento por cantidad' }}
                    </div>
                  </div>
                  <v-switch
                    v-model="draft.is_promo"
                    inset density="compact" hide-details
                    :disabled="busy"
                    color="primary"
                    class="ml-auto"
                  />
                </div>

                <div v-if="draft.is_promo" class="pfp-section-body">
                  <!-- Hint general -->
                  <div class="pfp-promo-hint">
                    <v-icon size="14" color="primary">mdi-information-outline</v-icon>
                    <span>Podés activar las dos modalidades a la vez. La etiqueta <b>"PROMO"</b> se mostrará en la tienda virtual mientras el producto esté en promoción.</span>
                  </div>

                  <div class="pfp-promo-grid">

                    <!-- ── Promo por TIEMPO ── -->
                    <div class="pfp-promo-card" :class="{ on: promoTimeOn }">
                      <div class="pfp-promo-card-head">
                        <div class="pfp-promo-card-title">
                          <v-icon size="18" color="primary">mdi-clock-outline</v-icon>
                          <span>Precio promocional por tiempo</span>
                        </div>
                        <v-switch
                          :model-value="promoTimeOn"
                          @update:model-value="togglePromoTime"
                          inset density="compact" hide-details
                          color="primary"
                          :disabled="busy"
                        />
                      </div>

                      <div v-if="promoTimeOn" class="pfp-promo-card-body">
                        <div class="text-caption text-medium-emphasis mb-2">
                          Mientras dure la ventana, el producto se vende a este precio.
                        </div>

                        <v-text-field
                          v-model="draft.promo_price"
                          label="Precio en promoción *"
                          prepend-inner-icon="mdi-currency-usd"
                          variant="outlined" density="comfortable" hide-details="auto"
                          type="number" min="0" :disabled="busy"
                          class="mb-3"
                        />

                        <div class="pfp-promo-dates">
                          <v-text-field
                            v-model="draft.promo_starts_at"
                            label="Desde"
                            prepend-inner-icon="mdi-calendar-start"
                            type="datetime-local"
                            variant="outlined" density="comfortable" hide-details="auto"
                            :disabled="busy"
                          />
                          <v-text-field
                            v-model="draft.promo_ends_at"
                            label="Hasta"
                            prepend-inner-icon="mdi-calendar-end"
                            type="datetime-local"
                            variant="outlined" density="comfortable" hide-details="auto"
                            :disabled="busy"
                            :error-messages="promoDatesError"
                          />
                        </div>

                        <div v-if="promoTimeSavings" class="pfp-promo-savings">
                          <v-icon size="14" color="success">mdi-trending-down</v-icon>
                          Ahorro vs lista: <b>$ {{ fmtNum(promoTimeSavings) }}</b>
                          <span class="ml-1 text-medium-emphasis">({{ promoTimeSavingsPct }}%)</span>
                        </div>
                      </div>

                      <div v-else class="pfp-promo-card-empty">
                        Activá para definir precio y vigencia.
                      </div>
                    </div>

                    <!-- ── Promo por CANTIDAD ── -->
                    <div class="pfp-promo-card" :class="{ on: promoQtyOn }">
                      <div class="pfp-promo-card-head">
                        <div class="pfp-promo-card-title">
                          <v-icon size="18" color="primary">mdi-package-variant-closed</v-icon>
                          <span>Descuento por cantidad</span>
                        </div>
                        <v-switch
                          :model-value="promoQtyOn"
                          @update:model-value="togglePromoQty"
                          inset density="compact" hide-details
                          color="primary"
                          :disabled="busy"
                        />
                      </div>

                      <div v-if="promoQtyOn" class="pfp-promo-card-body">
                        <div class="text-caption text-medium-emphasis mb-2">
                          A partir de N unidades en una misma venta, se aplica el descuento a todas las unidades.
                        </div>

                        <div class="pfp-promo-qty-row">
                          <v-text-field
                            v-model="draft.promo_qty_threshold"
                            label="Desde N unidades *"
                            prepend-inner-icon="mdi-counter"
                            type="number" min="2" step="1"
                            variant="outlined" density="comfortable" hide-details="auto"
                            :disabled="busy"
                          />

                          <v-btn-toggle
                            v-model="draft.promo_qty_mode"
                            mandatory density="comfortable"
                            color="primary" variant="outlined" rounded="lg"
                            class="pfp-promo-mode"
                          >
                            <v-btn value="amount" :disabled="busy">$ Monto</v-btn>
                            <v-btn value="percent" :disabled="busy">% Porcentaje</v-btn>
                          </v-btn-toggle>
                        </div>

                        <v-text-field
                          v-model="draft.promo_qty_discount"
                          :label="draft.promo_qty_mode === 'percent' ? 'Porcentaje de descuento *' : 'Monto de descuento *'"
                          :prepend-inner-icon="draft.promo_qty_mode === 'percent' ? 'mdi-percent' : 'mdi-currency-usd'"
                          :suffix="draft.promo_qty_mode === 'percent' ? '%' : ''"
                          type="number" min="0" :max="draft.promo_qty_mode === 'percent' ? 100 : undefined"
                          variant="outlined" density="comfortable" hide-details="auto"
                          :disabled="busy"
                          class="mt-3"
                        />

                        <div v-if="promoQtyExample" class="pfp-promo-savings">
                          <v-icon size="14" color="success">mdi-tag-multiple</v-icon>
                          Ej: comprando <b>{{ draft.promo_qty_threshold }}</b>, c/u sale
                          <b>$ {{ fmtNum(promoQtyExample.unitPrice) }}</b>
                          <span class="ml-1 text-medium-emphasis">(ahorro $ {{ fmtNum(promoQtyExample.totalSaving) }})</span>
                        </div>
                      </div>

                      <div v-else class="pfp-promo-card-empty">
                        Activá para configurar volumen.
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <!-- ══ KIT / COMBO (ancho completo) ══ -->
              <div class="pfp-section pfp-kit-section mt-4" :class="{ 'pfp-kit-on': draft.is_kit }">
                <div class="pfp-section-head" style="--accent:#7c3aed">
                  <div class="pfp-section-icon"><v-icon size="16" color="white">mdi-package-variant</v-icon></div>
                  <div>
                    <div class="pfp-section-title">Kit / Combo</div>
                    <div class="pfp-section-sub">
                      {{ draft.is_kit
                        ? 'Este producto agrupa otros que se descuentan al vender'
                        : 'Activá para vender varios productos como un solo paquete' }}
                    </div>
                  </div>
                  <v-switch
                    v-model="draft.is_kit"
                    inset density="compact" hide-details
                    :disabled="busy"
                    color="primary"
                    class="ml-auto"
                  />
                </div>

                <div v-if="draft.is_kit" class="pfp-section-body">
                  <div class="pfp-kit-hint">
                    <v-icon size="14" color="primary">mdi-information-outline</v-icon>
                    <span>El kit se vende a un <b>precio único</b> (configurado arriba). Al confirmar la venta, se descuenta stock de cada componente individualmente.</span>
                  </div>

                  <!-- Buscador de productos -->
                  <v-autocomplete
                    v-model="kitProductPicker"
                    :items="kitSearchItems"
                    :loading="kitSearchLoading"
                    :search-input.sync="kitSearchTerm"
                    @update:search="onKitSearch"
                    item-title="label"
                    item-value="id"
                    label="Buscar producto para agregar al kit"
                    prepend-inner-icon="mdi-magnify"
                    placeholder="Nombre, SKU, código..."
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    no-data-text="Escribí al menos 2 caracteres"
                    :disabled="busy"
                    return-object
                    @update:model-value="addKitComponent"
                    class="mb-3"
                  >
                    <template #item="{ props, item }">
                      <v-list-item v-bind="props" :title="item.raw.name" :subtitle="`SKU ${item.raw.sku || '—'} · $ ${fmtNum(item.raw.price_list)}`">
                        <template #prepend>
                          <v-avatar size="36" rounded="lg">
                            <v-img v-if="item.raw.image_url" :src="item.raw.image_url" cover />
                            <v-icon v-else size="20">mdi-package-variant-closed</v-icon>
                          </v-avatar>
                        </template>
                      </v-list-item>
                    </template>
                  </v-autocomplete>

                  <!-- Lista de componentes -->
                  <div v-if="!arr(draft.kit_items).length" class="pfp-kit-empty">
                    <v-icon size="32" color="primary" class="mb-2">mdi-package-variant-closed</v-icon>
                    <div class="text-body-2">Sin componentes aún</div>
                    <div class="text-caption text-medium-emphasis">Buscá productos arriba para agregarlos al kit</div>
                  </div>

                  <div v-else class="pfp-kit-list">
                    <div v-for="(it, idx) in draft.kit_items" :key="it.component_id" class="pfp-kit-row">
                      <v-avatar size="44" rounded="lg" class="pfp-kit-thumb">
                        <v-img v-if="it.image_url" :src="it.image_url" cover />
                        <v-icon v-else size="22">mdi-package-variant-closed</v-icon>
                      </v-avatar>
                      <div class="pfp-kit-info">
                        <div class="pfp-kit-name">{{ it.name }}</div>
                        <div class="pfp-kit-meta">
                          <span>SKU {{ it.sku || '—' }}</span>
                          <span class="pfp-kit-dot">·</span>
                          <span>$ {{ fmtNum(it.price_list) }} c/u</span>
                        </div>
                      </div>
                      <v-text-field
                        v-model.number="it.qty"
                        type="number" min="1" step="1"
                        label="Cantidad"
                        density="compact"
                        variant="outlined"
                        hide-details
                        class="pfp-kit-qty"
                        :disabled="busy"
                      />
                      <v-btn
                        icon="mdi-trash-can-outline"
                        variant="text"
                        size="small"
                        color="error"
                        :disabled="busy"
                        @click="removeKitComponent(idx)"
                      />
                    </div>
                  </div>

                  <!-- Resumen ahorro -->
                  <div v-if="kitSavings" class="pfp-kit-savings">
                    <div class="pfp-kit-savings-row">
                      <span>Suma componentes (suelto):</span>
                      <b>$ {{ fmtNum(kitSavings.componentsTotal) }}</b>
                    </div>
                    <div class="pfp-kit-savings-row">
                      <span>Precio del kit:</span>
                      <b>$ {{ fmtNum(kitSavings.kitPrice) }}</b>
                    </div>
                    <div class="pfp-kit-savings-row pfp-kit-savings-final" v-if="kitSavings.savings > 0">
                      <span><v-icon size="14" color="success">mdi-trending-down</v-icon> Ahorro vs suelto:</span>
                      <b class="text-success">$ {{ fmtNum(kitSavings.savings) }} ({{ kitSavings.savingsPct }}%)</b>
                    </div>
                    <div class="pfp-kit-savings-row pfp-kit-savings-warn" v-else-if="kitSavings.savings < 0">
                      <span><v-icon size="14" color="warning">mdi-alert</v-icon> El kit cuesta más que la suma:</span>
                      <b class="text-warning">+$ {{ fmtNum(-kitSavings.savings) }}</b>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- ══ STEP 2 ══ -->
            <div v-show="step === 2">
              <div class="pfp-step2-grid">

                <!-- Stock -->
                <div class="pfp-section">
                  <div class="pfp-section-head" style="--accent:#06b6d4">
                    <div class="pfp-section-icon"><v-icon size="16" color="white">mdi-warehouse</v-icon></div>
                    <div>
                      <div class="pfp-section-title">Stock por sucursal</div>
                      <div class="pfp-section-sub">Se aplica al {{ isEdit ? 'guardar' : 'crear' }}</div>
                    </div>
                  </div>
                  <div class="pfp-section-body pa-0">
                    <ProductStockPanel :product-id="draft?.id || null" v-model="stockMatrix" :disabled="busy" />
                  </div>
                </div>

                <!-- Imágenes -->
                <div class="pfp-section">
                  <div class="pfp-section-head" style="--accent:#ec4899">
                    <div class="pfp-section-icon"><v-icon size="16" color="white">mdi-image-multiple</v-icon></div>
                    <div>
                      <div class="pfp-section-title">Imágenes</div>
                      <div class="pfp-section-sub">{{ queuedImages.length ? `${queuedImages.length} en cola` : 'Fotos del producto' }}</div>
                    </div>
                  </div>
                  <div class="pfp-section-body pa-0">
                    <ProductImagesPanel :product-id="draft?.id || null" v-model="queuedImages" @changed="onQueuedChanged" />
                  </div>
                </div>

                <!-- Videos -->
                <div class="pfp-section pfp-step2-videos">
                  <div class="pfp-section-head" style="--accent:#ef4444">
                    <div class="pfp-section-icon"><v-icon size="16" color="white">mdi-youtube</v-icon></div>
                    <div>
                      <div class="pfp-section-title">Videos</div>
                      <div class="pfp-section-sub">YouTube o archivos</div>
                    </div>
                    <div class="ml-auto d-flex ga-1 align-center">
                      <v-chip v-if="queuedYoutubeVideos.length || queuedVideoFiles.length" size="x-small" color="primary" variant="tonal">
                        {{ queuedYoutubeVideos.length + queuedVideoFiles.length }} en cola
                      </v-chip>
                      <v-btn size="x-small" variant="text" @click="clearVideosQueue" :disabled="busy">Limpiar</v-btn>
                    </div>
                  </div>
                  <div class="pfp-section-body">
                    <div class="pfp-video-grid">
                      <div>
                        <div class="pfp-video-label"><v-icon size="16" color="#FF0000">mdi-youtube</v-icon> YouTube / Shorts</div>
                        <div class="d-flex ga-2 mt-2">
                          <v-text-field v-model="ytUrl" :disabled="busy" density="compact" label="URL YouTube"
                            prepend-inner-icon="mdi-link" variant="outlined" hide-details class="flex-1"
                            @keyup.enter="addYoutubeUrl" />
                          <v-btn color="primary" variant="flat" rounded="lg" @click="addYoutubeUrl" :disabled="busy">
                            <v-icon>mdi-plus</v-icon>
                          </v-btn>
                        </div>
                        <v-alert v-if="ytError" type="error" variant="tonal" density="compact" class="mt-2">{{ ytError }}</v-alert>
                        <div v-if="queuedYoutubeVideos.length" class="pfp-queue-list mt-2">
                          <div v-for="(v, idx) in queuedYoutubeVideos" :key="v.key" class="pfp-queue-item">
                            <v-icon size="16" color="#FF0000" class="flex-shrink-0">mdi-youtube</v-icon>
                            <div class="pfp-queue-url text-truncate">{{ v.url }}</div>
                            <v-btn size="x-small" icon variant="text" @click="removeYoutubeAt(idx)" :disabled="busy">
                              <v-icon size="14">mdi-close</v-icon>
                            </v-btn>
                          </div>
                        </div>
                        <div v-else class="pfp-queue-empty">Sin videos</div>
                      </div>
                      <div>
                        <div class="pfp-video-label"><v-icon size="16">mdi-upload</v-icon> Archivo de video</div>
                        <div class="mt-2">
                          <v-file-input v-model="queuedVideoFiles" :disabled="busy" density="compact"
                            variant="outlined" prepend-icon="" prepend-inner-icon="mdi-video-plus"
                            label="Elegí archivos de video" multiple accept="video/*" show-size chips hide-details />
                        </div>
                      </div>
                    </div>
                    <ProductVideosPanel v-if="isEdit" class="mt-3" :product-id="draft?.id || null" mode="edit"
                      :youtube-queue="queuedYoutubeVideos" :files-queue="queuedVideoFiles"
                      @update:youtubeQueue="queuedYoutubeVideos = normalizeYoutubeQueue($event)"
                      @update:filesQueue="queuedVideoFiles = normalizeFilesQueue($event)"
                      @changed="onVideosChanged" />
                  </div>
                </div>

              </div>
            </div>

            <!-- ══ STEP 3 ══ -->
            <div v-show="step === 3">
              <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
                <div>
                  <div class="text-h6 font-weight-black">Resumen final</div>
                  <div class="text-caption text-medium-emphasis">Revisá todo antes de {{ isEdit ? 'guardar' : 'crear' }}</div>
                </div>
                <v-chip :color="isReadyToCreate ? 'success' : 'warning'" variant="flat" size="small">
                  <v-icon start size="13">{{ isReadyToCreate ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
                  {{ isReadyToCreate ? 'Listo para ' + (isEdit ? 'guardar' : 'crear') : 'Faltan datos' }}
                </v-chip>
              </div>

              <v-alert v-if="products.error" type="error" variant="tonal" density="compact" class="mb-4">
                {{ products.error }}
              </v-alert>

              <!-- ════ HERO PREVIEW ════ -->
              <div class="pfp-hero">
                <!-- Galería: foto principal + miniaturas -->
                <div class="pfp-hero-gallery">
                  <div class="pfp-hero-main">
                    <img v-if="summaryHero" :src="summaryHero.url" alt="" />
                    <div v-else class="pfp-hero-empty">
                      <v-icon size="48">mdi-image-off-outline</v-icon>
                      <span>Sin imagen</span>
                    </div>
                    <div class="pfp-hero-badges">
                      <span v-if="draft.is_kit" class="pfp-hero-kit-badge">
                        <v-icon size="13" color="white">mdi-package-variant</v-icon>
                        KIT · {{ arr(draft.kit_items).length }} productos
                      </span>
                      <span v-if="draft.is_promo" class="pfp-hero-promo-badge">PROMO</span>
                    </div>
                  </div>
                  <div v-if="summaryImages.length > 1" class="pfp-hero-thumbs">
                    <div
                      v-for="(im, i) in summaryImages.slice(0, 6)"
                      :key="i"
                      class="pfp-hero-thumb"
                      :class="{ 'is-primary': im === summaryHero }"
                    >
                      <img :src="im.url" alt="" />
                    </div>
                    <div v-if="summaryImages.length > 6" class="pfp-hero-thumb pfp-hero-thumb--more">
                      +{{ summaryImages.length - 6 }}
                    </div>
                  </div>
                </div>

                <!-- Info principal -->
                <div class="pfp-hero-info">
                  <div class="pfp-hero-cat" v-if="getCategoryNameById(getCategoryIdFromDraft(draft))">
                    {{ getCategoryNameById(getCategoryIdFromDraft(draft)) }}
                    <span v-if="getSubcategoryNameById(getSubcategoryIdFromDraft(draft))">
                      · {{ getSubcategoryNameById(getSubcategoryIdFromDraft(draft)) }}
                    </span>
                  </div>
                  <div class="pfp-hero-name">{{ safe(draft.name) || "Producto sin nombre" }}</div>
                  <div class="pfp-hero-brand" v-if="draft.brand || draft.model">
                    <span v-if="draft.brand">{{ draft.brand }}</span>
                    <span v-if="draft.brand && draft.model"> · </span>
                    <span v-if="draft.model">{{ draft.model }}</span>
                  </div>

                  <!-- Precio destacado -->
                  <div class="pfp-hero-price-block">
                    <div v-if="num(draft.price_list) > num(draft.price_discount) && num(draft.price_discount) > 0" class="pfp-hero-price-old">
                      $ {{ fmtNum(draft.price_list) }}
                    </div>
                    <div class="pfp-hero-price-row">
                      <div class="pfp-hero-price-main">$ {{ fmtNum(num(draft.price_discount) || num(draft.price_list)) }}</div>
                      <div v-if="num(draft.price_list) > num(draft.price_discount) && num(draft.price_discount) > 0" class="pfp-hero-price-off">
                        {{ Math.round(((num(draft.price_list) - num(draft.price_discount)) / num(draft.price_list)) * 100) }}% OFF
                      </div>
                    </div>
                    <div v-if="num(draft.price_reseller) > 0" class="pfp-hero-price-reseller">
                      Revendedor: <b>$ {{ fmtNum(draft.price_reseller) }}</b>
                    </div>
                  </div>

                  <!-- Chips de estado -->
                  <div class="pfp-hero-chips">
                    <v-chip :color="draft.is_active ? 'success' : 'warning'" size="small" variant="flat">
                      <v-icon start size="14">{{ draft.is_active ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                      {{ draft.is_active ? 'Activo' : 'Inactivo' }}
                    </v-chip>
                    <v-chip v-if="draft.is_kit" color="#7c3aed" size="small" variant="flat">
                      <v-icon start size="14">mdi-package-variant</v-icon>
                      Kit · {{ arr(draft.kit_items).length }} productos
                    </v-chip>
                    <v-chip v-if="draft.is_promo" color="warning" size="small" variant="flat">
                      <v-icon start size="14">mdi-tag-heart</v-icon>
                      En promoción
                    </v-chip>
                    <v-chip v-if="draft.track_stock" size="small" variant="tonal">
                      <v-icon start size="14">mdi-package-check</v-icon>
                      Controla stock
                    </v-chip>
                    <v-chip v-if="stockPreviewList.length" size="small" variant="tonal" color="cyan">
                      <v-icon start size="14">mdi-warehouse</v-icon>
                      {{ totalStockSummary }} unidades
                    </v-chip>
                  </div>

                  <!-- Identificadores -->
                  <div class="pfp-hero-ids">
                    <span class="pfp-hero-id"><b>SKU:</b> {{ safe(finalSku) }}</span>
                    <span class="pfp-hero-id"><b>Código:</b> {{ safe(draft.code || nextCodePreview) }}</span>
                  </div>
                </div>
              </div>

              <!-- ════ DETALLES ════ -->
              <div class="pfp-summary-grid">
                <div class="d-flex flex-column ga-4">
                  <!-- Descripción -->
                  <div v-if="draft.description" class="pfp-sum-card">
                    <div class="pfp-sum-card-head"><v-icon size="16">mdi-text-long</v-icon> Descripción</div>
                    <div class="pfp-sum-desc-block">{{ draft.description }}</div>
                  </div>

                  <!-- Precios desglosados -->
                  <div class="pfp-sum-card">
                    <div class="pfp-sum-card-head"><v-icon size="16" color="success">mdi-cash-multiple</v-icon> Precios</div>
                    <div class="pfp-price-row-grid">
                      <div class="pfp-price-item" v-for="p in priceItems" :key="p.label">
                        <div class="pfp-price-label">{{ p.label }}</div>
                        <div class="pfp-price-val" :class="{ muted: !p.val }">{{ p.val ? `$ ${fmtNum(p.val)}` : '—' }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Promoción -->
                  <div class="pfp-sum-card" v-if="draft.is_promo">
                    <div class="pfp-sum-card-head"><v-icon size="16" color="warning">mdi-tag-heart</v-icon> Promoción</div>
                    <div class="pfp-promo-summary">
                      <div v-if="promoTimeOn" class="pfp-promo-summary-row">
                        <v-icon size="14" color="warning">mdi-clock-outline</v-icon>
                        <span>
                          Por tiempo:
                          <b v-if="num(draft.promo_price)">$ {{ fmtNum(draft.promo_price) }}</b>
                          <span v-else class="text-medium-emphasis">precio sin definir</span>
                          <span v-if="draft.promo_starts_at || draft.promo_ends_at" class="text-medium-emphasis">
                            ({{ fmtPromoRange }})
                          </span>
                        </span>
                      </div>
                      <div v-if="promoQtyOn" class="pfp-promo-summary-row">
                        <v-icon size="14" color="warning">mdi-package-variant-closed</v-icon>
                        <span>
                          Por cantidad: desde <b>{{ draft.promo_qty_threshold || '?' }}</b> u.
                          <span v-if="draft.promo_qty_discount">
                            – descuento
                            <b v-if="draft.promo_qty_mode === 'percent'">{{ draft.promo_qty_discount }}%</b>
                            <b v-else>$ {{ fmtNum(draft.promo_qty_discount) }}</b>
                          </span>
                        </span>
                      </div>
                      <div v-if="!promoTimeOn && !promoQtyOn" class="text-caption text-medium-emphasis">
                        Marcado en promoción pero sin reglas configuradas — sólo se mostrará la etiqueta.
                      </div>
                    </div>
                  </div>

                  <!-- Media -->
                  <div class="pfp-sum-card">
                    <div class="pfp-sum-card-head"><v-icon size="16" color="pink">mdi-image-multiple</v-icon> Media</div>
                    <div class="pfp-media-badges">
                      <span class="pfp-media-badge" :class="{ active: summaryImages.length }"><v-icon size="14">mdi-image</v-icon> {{ summaryImages.length }} imágenes</span>
                      <span class="pfp-media-badge" :class="{ active: queuedYoutubeVideos.length }"><v-icon size="14">mdi-youtube</v-icon> {{ queuedYoutubeVideos.length }} YouTube</span>
                      <span class="pfp-media-badge" :class="{ active: queuedVideoFiles.length }"><v-icon size="14">mdi-file-video</v-icon> {{ queuedVideoFiles.length }} archivos</span>
                    </div>
                  </div>

                  <!-- Kit / combo -->
                  <div class="pfp-sum-card pfp-sum-kit" v-if="draft.is_kit">
                    <div class="pfp-sum-card-head">
                      <v-icon size="16" color="#7c3aed">mdi-package-variant</v-icon>
                      Kit / Combo
                      <v-chip size="x-small" color="#7c3aed" variant="flat" class="ml-auto">
                        {{ arr(draft.kit_items).length }} {{ arr(draft.kit_items).length === 1 ? 'producto' : 'productos' }}
                      </v-chip>
                    </div>

                    <div v-if="!arr(draft.kit_items).length" class="pfp-sum-kit-empty">
                      <v-icon size="14" color="warning">mdi-alert</v-icon>
                      El kit no tiene componentes definidos.
                    </div>

                    <div v-else class="pfp-sum-kit-list">
                      <div v-for="it in draft.kit_items" :key="it.component_id" class="pfp-sum-kit-row">
                        <v-avatar size="32" rounded="lg" class="pfp-sum-kit-thumb">
                          <v-img v-if="it.image_url" :src="it.image_url" cover />
                          <v-icon v-else size="16">mdi-package-variant-closed</v-icon>
                        </v-avatar>
                        <div class="pfp-sum-kit-info">
                          <div class="pfp-sum-kit-name">{{ it.name }}</div>
                          <div class="pfp-sum-kit-meta">SKU {{ it.sku || '—' }} · $ {{ fmtNum(it.price_list) }} c/u</div>
                        </div>
                        <span class="pfp-sum-kit-qty">×{{ it.qty || 1 }}</span>
                      </div>
                    </div>

                    <div v-if="kitSavings" class="pfp-sum-kit-savings">
                      <div class="pfp-sum-kit-savings-row">
                        <span class="text-medium-emphasis">Suelto:</span>
                        <b class="text-decoration-line-through text-medium-emphasis">$ {{ fmtNum(kitSavings.componentsTotal) }}</b>
                      </div>
                      <div class="pfp-sum-kit-savings-row">
                        <span class="text-medium-emphasis">Kit:</span>
                        <b>$ {{ fmtNum(kitSavings.kitPrice) }}</b>
                      </div>
                      <div v-if="kitSavings.savings > 0" class="pfp-sum-kit-savings-final">
                        <v-icon size="14" color="success">mdi-trending-down</v-icon>
                        Ahorro: <b class="text-success">$ {{ fmtNum(kitSavings.savings) }} ({{ kitSavings.savingsPct }}%)</b>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="d-flex flex-column ga-4">
                  <!-- Stock por sucursal -->
                  <div v-if="stockPreviewList.length" class="pfp-sum-card">
                    <div class="pfp-sum-card-head"><v-icon size="16" color="cyan">mdi-warehouse</v-icon> Stock por sucursal</div>
                    <div class="pfp-stock-list">
                      <div v-for="r in stockPreviewList" :key="r.branch_id" class="pfp-stock-item">
                        <span><v-icon size="13" class="mr-1">mdi-store-outline</v-icon>{{ r.branch_name }}</span>
                        <span class="font-weight-bold">{{ r.qty }} u.</span>
                      </div>
                    </div>
                  </div>

                  <!-- Código de barras -->
                  <div class="pfp-sum-card">
                    <div class="pfp-sum-card-head"><v-icon size="16">mdi-barcode</v-icon> Código de barras</div>
                    <ProductBarcodeCard :value="draft?.code || ''" :preview="nextCodePreview || ''" :label="draft?.id ? 'REAL' : 'PREVIEW'" />
                  </div>
                </div>
              </div>
            </div>

          </template>
        </div><!-- /pfp-content -->
      </main>
    </div><!-- /pfp-layout -->

    <!-- ══ FOOTER ══ -->
    <div class="pfp-footer">
      <div class="pfp-footer-inner">
        <div class="pfp-footer-info">
          <span class="pfp-footer-step">Paso {{ step }}/3</span>
          <span class="pfp-footer-dot">·</span>
          <span>{{ STEPS[step - 1].title }}</span>
          <span v-if="draft?.id" class="pfp-footer-dot"> · #{{ draft.id }}</span>
        </div>
        <div class="pfp-footer-btns">
          <v-btn v-if="step > 1" variant="tonal" rounded="lg" @click="prevStep" :disabled="busy" class="pfp-btn-nav">
            <v-icon start size="16">mdi-chevron-left</v-icon>Anterior
          </v-btn>
          <v-btn v-if="step < 3" color="primary" variant="flat" rounded="lg" @click="nextStep" :disabled="busy" class="pfp-btn-nav">
            Siguiente<v-icon end size="16">mdi-chevron-right</v-icon>
          </v-btn>
          <v-btn v-else :color="isReadyToCreate ? 'success' : 'grey'" variant="flat" rounded="lg"
            @click="isEdit ? saveAll() : createAll()" :loading="busy" :disabled="busy" class="pfp-btn-save">
            <v-icon start size="16">{{ isEdit ? 'mdi-content-save' : 'mdi-plus-circle' }}</v-icon>
            {{ isEdit ? 'Guardar cambios' : 'Crear producto' }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- ══ SNACK ══ -->
    <v-snackbar v-model="snack.open" :timeout="2600" location="bottom right" rounded="lg">
      {{ snack.text }}
      <template #actions><v-btn variant="text" size="small" @click="snack.open = false">OK</v-btn></template>
    </v-snackbar>

    <!-- ══ VALIDATION MODAL ══ -->
    <v-dialog v-model="vModal.open" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center ga-2 pt-5 px-5">
          <v-icon color="warning" size="22">mdi-alert-circle</v-icon>
          <span class="font-weight-black">Faltan datos</span>
        </v-card-title>
        <v-card-text class="px-5">
          <p v-if="vModal.message" class="mb-3 text-body-2">{{ vModal.message }}</p>
          <div class="pfp-validation-list">
            <div v-for="(m, i) in vModal.items" :key="i" class="pfp-validation-item">
              <v-icon size="14" color="error">mdi-close-circle</v-icon>
              {{ m.replace(/^[•\-\s]+/, '') }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="justify-end px-5 pb-5">
          <v-btn variant="flat" color="primary" rounded="lg" @click="vModal.open = false">Entendido</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import http from "../../../app/api/http";
import { useProductsStore } from "../../../app/store/products.store";
import { useAuthStore } from "../../../app/store/auth.store";
import { CategoriesService } from "../../../app/services/categories.service";
import AppPageHeader from "@/app/components/AppPageHeader.vue";
import BarcodeScanButton from "@/app/components/BarcodeScanButton.vue";

import ProductStockPanel from "../components/panels/ProductStockPanel.vue";
import ProductImagesPanel from "../components/panels/ProductImagesPanel.vue";
import ProductVideosPanel from "../components/panels/ProductVideosPanel.vue";
import ProductBarcodeCard from "../components/form/ProductBarcodeCard.vue";

const route = useRoute();
const router = useRouter();
const products = useProductsStore();
const auth = useAuthStore();
const { mdAndUp, lgAndUp } = useDisplay();

/* ── Steps ── */
const STEPS = [
  { value: 1, title: "Producto",      sub: "Datos, precios y estado",  icon: "mdi-package-variant" },
  { value: 2, title: "Stock & Media", sub: "Inventario e imágenes",    icon: "mdi-image-multiple"  },
  { value: 3, title: "Confirmar",     sub: "Resumen y guardar",        icon: "mdi-check-circle"    },
];

/* ── Mode ── */
const isEdit = computed(() => !!route.params.id);
const productId = computed(() => {
  const n = parseInt(String(route.params.id || ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
});

/* ── UI state ── */
const busy = ref(false);
const initialLoading = ref(false);
const step = ref(1);
const step1Touched = ref(false);
const nextCodePreview = ref(null);
const mainRef = ref(null);

const categoriesList = ref([]);
const subcategoriesList = ref([]);
const stockMatrix = ref([]);
const queuedImages = ref([]);
const queuedYoutubeVideos = ref([]);
const queuedVideoFiles = ref([]);
const ytUrl = ref("");
const ytError = ref("");
const snack = ref({ open: false, text: "" });
const vModal = ref({ open: false, message: "", items: [] });

function toast(t) { snack.value = { open: true, text: String(t || "") }; }
function showValidation(items = [], message = "") {
  vModal.value = { open: true, message: message || "", items: (Array.isArray(items) ? items : []).filter(Boolean) };
}

/* ── Utils ── */
function arr(v) { return Array.isArray(v) ? v : []; }

function toInt(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  if (typeof v === "object") {
    const c = v?.id ?? v?.value ?? v?.category_id ?? v?.subcategory_id ?? null;
    if (c !== null && c !== undefined && c !== "") {
      const n2 = parseInt(String(c), 10);
      return Number.isFinite(n2) ? n2 : d;
    }
    return d;
  }
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function num(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function fmtNum(v) { return new Intl.NumberFormat("es-AR").format(Math.round(num(v))); }
function safe(v) { const s = String(v ?? "").trim(); return s || "—"; }
function toBool(v, d = false) {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;
  return d;
}
function deepClone(obj) { try { return JSON.parse(JSON.stringify(obj || {})); } catch { return { ...(obj || {}) }; } }
function fieldErr(key) {
  const map = products.lastFieldErrors || null;
  if (!map) return [];
  const v = map[key];
  return v ? [String(v)] : [];
}

/* ── Taxonomies ── */
function normalizeTaxo(raw, kind = "category") {
  return arr(raw).map((x) => {
    let id = 0;
    if (kind === "subcategory") {
      id = toInt(x?.subcategory_id, 0) || toInt(x?.subrubro_id, 0) || toInt(x?.id, 0);
    } else {
      id = toInt(x?.category_id, 0) || toInt(x?.rubro_id, 0) || toInt(x?.id, 0);
    }
    const name = String(x?.name ?? x?.nombre ?? x?.title ?? x?.label ?? "").trim();
    const category_id = kind === "subcategory"
      ? (toInt(x?.category_id, 0) || toInt(x?.categoryId, 0) || toInt(x?.rubro_id, 0) || 0)
      : 0;
    const parent_id = toInt(x?.parent_id, 0) || null;
    return { id, name, category_id, parent_id };
  }).filter((x) => x.id > 0 && x.name);
}

async function loadCategories() {
  const data = await CategoriesService.list({ root_only: 1 });
  const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  return normalizeTaxo(list, "category");
}

async function loadSubcategories() {
  const { data } = await http.get("/subcategories");
  const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  return normalizeTaxo(list, "subcategory");
}

async function ensureTaxonomies() {
  try {
    const [cats, subs] = await Promise.all([loadCategories(), loadSubcategories()]);
    categoriesList.value = cats;
    subcategoriesList.value = subs;
    if (!cats.length) toast("⚠️ Sin rubros (API /categories vacío).");
    if (!subs.length) toast("⚠️ Sin subrubros.");
  } catch (e) {
    toast("❌ Error cargando taxonomías");
    categoriesList.value = [];
    subcategoriesList.value = [];
  }
}

/* ── Draft ── */
function pickId(maybe) { return toInt(maybe, 0); }
function getSubcategoryIdFromDraft(d) {
  return pickId(d?.subcategory_id) || pickId(d?.subcategoryId) || pickId(d?.sub_category_id) || pickId(d?.subrubro_id) || null;
}
function getCategoryIdFromDraft(d) {
  return pickId(d?.category_id) || pickId(d?.categoryId) || pickId(d?.rubro_id) || null;
}
function setSubcategoryIdOnDraft(id) {
  const v = toInt(id, 0) || null;
  draft.value = { ...draft.value, subcategory_id: v, subcategoryId: v, sub_category_id: v, subrubro_id: v };
}
/* ────────────────────────────────────────────────────────────────────────
   KIT / COMBO — búsqueda + componentes + ahorro
──────────────────────────────────────────────────────────────────────── */
const kitSearchTerm = ref("");
const kitSearchLoading = ref(false);
const kitSearchItems = ref([]);
const kitProductPicker = ref(null);
let kitSearchAbort = null;
let kitSearchTimer = null;

function onKitSearch(term) {
  kitSearchTerm.value = String(term || "").trim();
  if (kitSearchTimer) clearTimeout(kitSearchTimer);
  kitSearchTimer = setTimeout(runKitSearch, 220);
}

async function runKitSearch() {
  const q = String(kitSearchTerm.value || "").trim();
  if (q.length < 2) { kitSearchItems.value = []; return; }
  if (kitSearchAbort) { try { kitSearchAbort.abort(); } catch {} }
  kitSearchAbort = new AbortController();
  kitSearchLoading.value = true;
  try {
    // Reusamos el mismo endpoint que ya consume el listado de productos
    const r = await http.get("/products", {
      params: { q, limit: 20, page: 1 },
      signal: kitSearchAbort.signal,
    });
    const items = arr(r?.data?.items || r?.data?.data || r?.data);
    // Excluimos el propio producto que estamos editando (no auto-referenciar)
    const myId = toInt(draft.value?.id, 0);
    // Excluimos los que ya están agregados
    const existing = new Set(arr(draft.value?.kit_items).map((x) => toInt(x?.component_id, 0)));
    kitSearchItems.value = items
      .map((p) => {
        const id = toInt(p?.id, 0);
        const firstImg = Array.isArray(p?.images)
          ? (p.images[0]?.url || p.images[0]?.image_url || null)
          : (p?.image_url || null);
        return {
          id,
          name: String(p?.name || ""),
          sku: String(p?.sku || ""),
          price_list: num(p?.price_list || p?.price, 0),
          image_url: firstImg,
          label: `${p?.name || "—"} · SKU ${p?.sku || "—"}`,
        };
      })
      .filter((x) => x.id > 0 && x.id !== myId && !existing.has(x.id));
  } catch (e) {
    if (e?.name !== "CanceledError" && e?.name !== "AbortError") {
      kitSearchItems.value = [];
    }
  } finally {
    kitSearchLoading.value = false;
  }
}

function addKitComponent(item) {
  const c = item && typeof item === "object" ? item : null;
  if (!c) return;
  const cid = toInt(c.id, 0);
  if (!cid) return;
  if (toInt(draft.value?.id, 0) === cid) {
    toast("⚠️ Un kit no puede contenerse a sí mismo");
    kitProductPicker.value = null;
    return;
  }
  const list = arr(draft.value?.kit_items);
  if (list.some((x) => toInt(x?.component_id, 0) === cid)) {
    toast("⚠️ Ya está agregado");
    kitProductPicker.value = null;
    return;
  }
  draft.value = {
    ...draft.value,
    kit_items: [
      ...list,
      {
        component_id: cid,
        name: c.name,
        sku: c.sku,
        image_url: c.image_url,
        price_list: c.price_list,
        qty: 1,
      },
    ],
  };
  // Limpiar picker
  kitProductPicker.value = null;
  kitSearchTerm.value = "";
  kitSearchItems.value = [];
}

function removeKitComponent(idx) {
  const list = arr(draft.value?.kit_items).slice();
  list.splice(idx, 1);
  draft.value = { ...draft.value, kit_items: list };
}

const kitSavings = computed(() => {
  if (!draft.value?.is_kit) return null;
  const items = arr(draft.value?.kit_items);
  if (!items.length) return null;
  const componentsTotal = items.reduce((acc, it) => acc + num(it?.price_list, 0) * num(it?.qty, 1), 0);
  // Precio del kit: usamos price_discount si está definido, sino price_list
  const kitPrice = num(draft.value?.price_discount, 0) > 0
    ? num(draft.value?.price_discount, 0)
    : num(draft.value?.price_list, 0);
  if (!componentsTotal && !kitPrice) return null;
  const savings = componentsTotal - kitPrice;
  const savingsPct = componentsTotal > 0 ? Math.round((savings / componentsTotal) * 100) : 0;
  return { componentsTotal, kitPrice, savings, savingsPct };
});

function defaultDraft() {
  return {
    id: null, name: "", sku: "", code: null, barcode: null, branch_id: null, description: "",
    category_id: null, subcategory_id: null, is_active: true, track_stock: true,
    brand: "", model: "", price_list: 0, price_discount: 0, price_reseller: 0,
    // Promoción
    is_promo: false,
    promo_price: null,
    promo_starts_at: null,
    promo_ends_at: null,
    promo_qty_threshold: null,
    promo_qty_discount: null,
    promo_qty_mode: "amount",
    // Kit / combo
    is_kit: false,
    kit_items: [], // [{ component_id, name, sku, image_url, qty, price_list }]
  };
}
const draft = ref(defaultDraft());

const draftCategoryId = computed({
  get: () => { const n = toInt(getCategoryIdFromDraft(draft.value), 0); return n > 0 ? n : null; },
  set: (val) => { const v = val ? toInt(val, 0) : null; draft.value = { ...draft.value, category_id: v, subcategory_id: null }; },
});
const draftSubcategoryId = computed({
  get: () => { const n = toInt(getSubcategoryIdFromDraft(draft.value), 0); return n > 0 ? n : null; },
  set: (val) => { const v = val ? toInt(val, 0) : null; draft.value = { ...draft.value, subcategory_id: v }; },
});

const selectedCategoryId = computed(() => toInt(getCategoryIdFromDraft(draft.value), 0) || null);
const selectedSubcategoryId = computed(() => toInt(getSubcategoryIdFromDraft(draft.value), 0) || null);

const filteredSubcategories = computed(() => {
  const cid = toInt(selectedCategoryId.value, 0);
  if (!cid) return [];
  return arr(subcategoriesList.value).filter((x) => toInt(x?.category_id, 0) === cid);
});

function subcategoryBelongsToCategory(subId, catId) {
  const sid = toInt(subId, 0); const cid = toInt(catId, 0);
  if (!sid || !cid) return false;
  const hit = arr(subcategoriesList.value).find((x) => toInt(x?.id, 0) === sid);
  return hit ? toInt(hit?.category_id, 0) === cid : false;
}

function normalizeDraftTaxonomy() {
  const cid = selectedCategoryId.value;
  const sid = selectedSubcategoryId.value;
  if (!cid) { if (sid) setSubcategoryIdOnDraft(null); return; }
  if (sid && !subcategoryBelongsToCategory(sid, cid)) setSubcategoryIdOnDraft(null);
}

watch(() => draft.value?.category_id, (v) => { if (v && typeof v === "object") draft.value = { ...draft.value, category_id: toInt(v, 0) || null }; });
watch(() => draft.value?.subcategory_id, (v) => { if (v && typeof v === "object") setSubcategoryIdOnDraft(toInt(v, 0) || null); });
watch(selectedCategoryId, (newCid) => {
  const sid = selectedSubcategoryId.value;
  if (!newCid) { if (sid) setSubcategoryIdOnDraft(null); return; }
  if (sid && !subcategoryBelongsToCategory(sid, newCid)) setSubcategoryIdOnDraft(null);
});
watch(() => subcategoriesList.value, () => normalizeDraftTaxonomy(), { deep: true });

/* ── SKU ── */
const skuPreviewHint = ref("");
function getCategoryNameById(id) {
  const iid = toInt(id, 0); if (!iid) return "";
  const hit = arr(categoriesList.value).find((x) => toInt(x?.id, 0) === iid);
  return String(hit?.name || "").trim();
}
function getSubcategoryNameById(id) {
  const iid = toInt(id, 0); if (!iid) return "";
  const hit = arr(subcategoriesList.value).find((x) => toInt(x?.id, 0) === iid);
  return String(hit?.name || "").trim();
}
function lettersOnly(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, " ").trim(); }
function makeInitials(label, take = 2) {
  const clean = lettersOnly(label); if (!clean) return "";
  const stop = new Set(["DE","DEL","LA","LAS","EL","LOS","Y","EN","POR","PARA"]);
  const parts = clean.split(/\s+/).map((x) => x.toUpperCase()).filter((x) => x && !stop.has(x));
  let out = "";
  for (const p of parts) { out += p[0] || ""; if (out.length >= take) break; }
  if (out.length < take) out += parts.join("").slice(out.length, take);
  return out.slice(0, take).toUpperCase();
}
function buildSku(d, forceId = null) {
  const cid = getCategoryIdFromDraft(d); const sid = getSubcategoryIdFromDraft(d);
  const cat2 = makeInitials(getCategoryNameById(cid), 2) || "XX";
  const sub2 = makeInitials(getSubcategoryNameById(sid), 2) || "XX";
  const idReal = toInt(forceId ?? d?.id, 0);
  if (idReal) { skuPreviewHint.value = ""; return `${cat2}${sub2}${String(idReal).padStart(6, "0")}`; }
  const prev = toInt(nextCodePreview.value, 0);
  skuPreviewHint.value = "preview";
  return `${cat2}${sub2}${String(prev || 0).padStart(6, "0")}`;
}
const skuPreview = computed(() => {
  const cid = toInt(getCategoryIdFromDraft(draft.value), 0);
  const sid = toInt(getSubcategoryIdFromDraft(draft.value), 0);
  if (!cid || !sid) return "";
  return buildSku(draft.value, null);
});
const finalSku = computed(() => String(draft.value?.sku || "").trim() || skuPreview.value);

/* ── Validation ── */
function validateDatos() {
  const errs = [];
  if (!String(draft.value?.name || "").trim()) errs.push("Falta el nombre del producto.");
  if (!toInt(getCategoryIdFromDraft(draft.value), 0)) errs.push("Falta seleccionar el rubro.");
  if (!toInt(getSubcategoryIdFromDraft(draft.value), 0)) errs.push("Falta seleccionar el subrubro.");
  const cat = toInt(getCategoryIdFromDraft(draft.value), 0);
  const sub = toInt(getSubcategoryIdFromDraft(draft.value), 0);
  if (cat && sub && !subcategoryBelongsToCategory(sub, cat)) errs.push("El subrubro no corresponde al rubro.");
  return errs.length ? errs : null;
}
const canGoAfterStep1 = computed(() => !validateDatos());
const isReadyToCreate = computed(() => !validateDatos());

const priceItems = computed(() => [
  { label: "Lista",      val: num(draft.value?.price_list) },
  { label: "Descuento",  val: num(draft.value?.price_discount) },
  { label: "Revendedor", val: num(draft.value?.price_reseller) },
]);

/* ── Promo: helpers ── */
const promoTimeOn = computed(() =>
  num(draft.value?.promo_price) > 0 ||
  !!draft.value?.promo_starts_at ||
  !!draft.value?.promo_ends_at
);
const promoQtyOn = computed(() =>
  num(draft.value?.promo_qty_threshold) > 0 ||
  num(draft.value?.promo_qty_discount) > 0
);

function togglePromoTime(on) {
  if (on) {
    if (!draft.value.promo_price) draft.value.promo_price = num(draft.value.price_list) || 0;
  } else {
    draft.value.promo_price = null;
    draft.value.promo_starts_at = null;
    draft.value.promo_ends_at = null;
  }
}
function togglePromoQty(on) {
  if (on) {
    if (!draft.value.promo_qty_threshold) draft.value.promo_qty_threshold = 2;
    if (!draft.value.promo_qty_mode) draft.value.promo_qty_mode = "amount";
  } else {
    draft.value.promo_qty_threshold = null;
    draft.value.promo_qty_discount = null;
  }
}

const promoDatesError = computed(() => {
  const s = draft.value?.promo_starts_at;
  const e = draft.value?.promo_ends_at;
  if (!s || !e) return "";
  const sd = new Date(s); const ed = new Date(e);
  if (Number.isFinite(sd.getTime()) && Number.isFinite(ed.getTime()) && ed <= sd) {
    return "Debe ser posterior al inicio.";
  }
  return "";
});

const promoTimeSavings = computed(() => {
  const list = num(draft.value?.price_list);
  const promo = num(draft.value?.promo_price);
  if (list <= 0 || promo <= 0 || promo >= list) return 0;
  return list - promo;
});
const promoTimeSavingsPct = computed(() => {
  const list = num(draft.value?.price_list);
  const save = promoTimeSavings.value;
  if (list <= 0 || save <= 0) return 0;
  return Math.round((save / list) * 100);
});

const promoQtyExample = computed(() => {
  const thr = toInt(draft.value?.promo_qty_threshold, 0);
  const disc = num(draft.value?.promo_qty_discount);
  const list = num(draft.value?.price_list);
  if (thr < 2 || disc <= 0 || list <= 0) return null;

  let unitPrice;
  if (draft.value?.promo_qty_mode === "percent") {
    unitPrice = list * (1 - Math.min(100, disc) / 100);
  } else {
    unitPrice = Math.max(0, list - disc);
  }
  const totalSaving = (list - unitPrice) * thr;
  return { unitPrice, totalSaving };
});

function fmtDateShort(v) {
  if (!v) return "";
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return String(v);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fmtPromoRange = computed(() => {
  const s = fmtDateShort(draft.value?.promo_starts_at);
  const e = fmtDateShort(draft.value?.promo_ends_at);
  if (s && e) return `${s} → ${e}`;
  if (s) return `desde ${s}`;
  if (e) return `hasta ${e}`;
  return "";
});

// Si toggle is_promo se apaga, limpiamos todo
watch(() => draft.value?.is_promo, (v) => {
  if (!v) {
    draft.value.promo_price = null;
    draft.value.promo_starts_at = null;
    draft.value.promo_ends_at = null;
    draft.value.promo_qty_threshold = null;
    draft.value.promo_qty_discount = null;
  }
});

const stockPreviewList = computed(() =>
  arr(stockMatrix.value)
    .map((r) => ({ branch_id: toInt(r.branch_id, 0), branch_name: String(r.branch_name || "").trim(), qty: num(r.qty, 0), enabled: toBool(r.enabled, false) }))
    .filter((x) => x.branch_id > 0 && x.branch_name && Number.isFinite(x.qty) && x.qty !== 0)
);

const imagesCount = computed(() => arr(queuedImages.value).length);

/* Cache de blob URLs para los archivos en cola (no recrear en cada render) */
const queuedBlobMap = new Map();
function blobUrlForFile(f) {
  if (!f) return "";
  const key = `${f.name}__${f.size}__${f.lastModified}`;
  let u = queuedBlobMap.get(key);
  if (!u) {
    u = URL.createObjectURL(f);
    queuedBlobMap.set(key, u);
  }
  return u;
}

/* Imágenes para mostrar en el resumen final (existentes + queued) */
const summaryImages = computed(() => {
  const out = [];
  // 1) Imágenes ya guardadas en el producto (modo edit)
  const existing = Array.isArray(draft.value?.images) ? draft.value.images : [];
  for (const x of existing) {
    const url = String(x?.url ?? x?.image_url ?? x?.path ?? "").trim();
    if (url) out.push({ url, primary: !!x?.is_primary, source: "existing" });
  }
  // 2) Imágenes nuevas en cola (no subidas aún)
  const queued = arr(queuedImages.value);
  for (const f of queued) {
    if (!f || typeof f !== "object") continue;
    const url = blobUrlForFile(f);
    if (url) out.push({ url, primary: false, source: "queued" });
  }
  return out;
});

const summaryHero = computed(() => {
  const list = summaryImages.value;
  if (!list.length) return null;
  return list.find((x) => x.primary) || list[0];
});

const totalStockSummary = computed(() =>
  stockPreviewList.value.reduce((acc, r) => acc + (Number(r.qty) || 0), 0)
);

/* ── Navigation ── */
function canGoTo(target) { const t = toInt(target, 1); if (t <= 1) return true; return !!canGoAfterStep1.value; }

function goToStep(target) {
  const t = toInt(target, 1);
  if (!canGoTo(t)) return;
  step.value = Math.min(3, Math.max(1, t));
  if (mainRef.value) mainRef.value.scrollTop = 0;
}
function prevStep() { step.value = Math.max(1, step.value - 1); if (mainRef.value) mainRef.value.scrollTop = 0; }
function nextStep() {
  if (step.value === 1) {
    step1Touched.value = true;
    const errs = validateDatos();
    if (errs) return showValidation(errs, "Completá estos campos antes de continuar:");
  }
  step.value = Math.min(3, step.value + 1);
  if (mainRef.value) mainRef.value.scrollTop = 0;
}

/* ── Cancel / back ── */
function onCancel() { router.push({ name: "products" }); }

/* ── Escaneo de código de barras (mobile) ──────────────────────────
   - emit-product: si el código ya existe en el catálogo, recibimos el
     producto. Si no, recibimos null pero igual guardamos el código.
   - El barcode se carga en draft.barcode para que quede asociado al
     nuevo producto. Si encontró un producto existente, completamos
     los campos básicos en el draft (no edita el existente).
*/
function onScannedCode(code) {
  if (!code) return;
  // Setea siempre el código escaneado al barcode del draft
  if (draft.value) draft.value.barcode = String(code);
  snack.value = { open: true, text: `Código ${code} cargado en el formulario` };
}
function onScannedProduct(product) {
  if (!product) return;
  // Pre-llena el form con los datos del producto encontrado para acelerar
  // la carga (el usuario puede ajustar lo que quiera antes de guardar).
  if (!draft.value) return;
  if (product.name && !draft.value.name)        draft.value.name = product.name;
  if (product.brand && !draft.value.brand)      draft.value.brand = product.brand;
  if (product.model && !draft.value.model)      draft.value.model = product.model;
  if (product.description && !draft.value.description) draft.value.description = product.description;
  if (product.barcode && !draft.value.barcode)  draft.value.barcode = product.barcode;
  // Precio sugerido
  if (product.price_list && !draft.value.price_list) draft.value.price_list = product.price_list;
  snack.value = { open: true, text: `Datos cargados desde "${product.name}"` };
}

/* ── Next code ── */
async function reloadNextCode() {
  if (isEdit.value) return;
  const code = await products.fetchNextCode();
  nextCodePreview.value = code || null;
}

/* ── Init ── */
async function init() {
  products.error = null;
  products.lastFieldErrors = null;
  nextCodePreview.value = null;
  queuedImages.value = [];
  queuedYoutubeVideos.value = [];
  queuedVideoFiles.value = [];
  stockMatrix.value = [];
  ytUrl.value = "";
  ytError.value = "";
  skuPreviewHint.value = "";
  step1Touched.value = false;
  step.value = 1;

  initialLoading.value = true;
  try {
    await ensureTaxonomies();

    if (isEdit.value && productId.value) {
      const bid = auth.isAdmin ? null : null;
      const full = await products.fetchOne(productId.value, { force: true, branch_id: bid });
      if (!full) { toast("❌ No se encontró el producto"); router.push({ name: "products" }); return; }
      draft.value = { ...defaultDraft(), ...deepClone(full) };

      // Mapear kitItems → kit_items con shape uniforme para la UI.
      const rawKit = arr(full?.kitItems || full?.kit_items);
      draft.value.kit_items = rawKit
        .map((ki) => {
          const c = ki?.component || ki?.product || ki;
          const cid = toInt(ki?.component_id ?? c?.id ?? ki?.id, 0);
          if (!cid) return null;
          const firstImg = Array.isArray(c?.images)
            ? (c.images[0]?.url || c.images[0]?.image_url || null)
            : (c?.image_url || null);
          return {
            component_id: cid,
            name: String(c?.name || "—"),
            sku: String(c?.sku || ""),
            image_url: firstImg,
            qty: num(ki?.qty, 1),
            price_list: num(c?.price_list || c?.price, 0),
          };
        })
        .filter(Boolean);

      normalizeDraftTaxonomy();
      if (Array.isArray(draft.value?.stock_matrix)) stockMatrix.value = deepClone(draft.value.stock_matrix);
    } else {
      draft.value = defaultDraft();
      await reloadNextCode();
    }
  } finally {
    initialLoading.value = false;
  }
}

onMounted(init);

/* ── Images ── */
function onQueuedChanged(files) { queuedImages.value = arr(files); }

/* ── Videos ── */
function normalizeYoutubeQueue(a) {
  return arr(a).map((x) => ({ key: String(x?.key || `${Date.now()}-${Math.random()}`), url: String(x?.url || "").trim(), title: x?.title ? String(x.title).trim() : "" })).filter((x) => !!x.url);
}
function normalizeFilesQueue(a) { return arr(a).filter(Boolean); }
function parseYoutubeUrl(raw) {
  const url = String(raw || "").trim(); if (!url) return { ok: false, url: "", reason: "Pegá una URL." };
  const low = url.toLowerCase();
  if (!low.includes("youtube.com/") && !low.includes("youtu.be/") && !low.includes("m.youtube.com/")) return { ok: false, url: "", reason: "No parece URL de YouTube." };
  return { ok: true, url, reason: "" };
}
function addYoutubeUrl() {
  ytError.value = "";
  const p = parseYoutubeUrl(ytUrl.value);
  if (!p.ok) return (ytError.value = p.reason || "URL inválida.");
  if (normalizeYoutubeQueue(queuedYoutubeVideos.value).some((x) => x.url === p.url)) return (ytError.value = "Ya está en cola.");
  queuedYoutubeVideos.value = normalizeYoutubeQueue([...normalizeYoutubeQueue(queuedYoutubeVideos.value), { key: `${Date.now()}`, url: p.url, title: "" }]);
  ytUrl.value = "";
  toast("✅ YouTube agregado");
}
function removeYoutubeAt(idx) { const a = normalizeYoutubeQueue(queuedYoutubeVideos.value); a.splice(idx, 1); queuedYoutubeVideos.value = a; }
function clearVideosQueue() { queuedYoutubeVideos.value = []; queuedVideoFiles.value = []; ytUrl.value = ""; ytError.value = ""; toast("✅ Cola limpia"); }
function onVideosChanged() {}

async function commitVideos(productId) {
  const pid = toInt(productId, 0); if (!pid) return;
  const yq = normalizeYoutubeQueue(queuedYoutubeVideos.value);
  const fq = normalizeFilesQueue(queuedVideoFiles.value);
  for (const it of yq) {
    try { await http.post(`/admin/products/${pid}/videos/youtube`, { url: it.url, title: it?.title || null }); }
    catch (e) { toast("⚠️ Video YouTube: " + (e?.message || "Falló")); }
  }
  for (const f of fq) {
    try { const fd = new FormData(); fd.append("file", f); await http.post(`/admin/products/${pid}/videos/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } }); }
    catch (e) { toast("⚠️ Video upload: " + (e?.message || "Falló")); }
  }
  if (yq.length || fq.length) { queuedYoutubeVideos.value = []; queuedVideoFiles.value = []; }
}

/* ── Payload ── */
function buildPayload() {
  const payload = { ...draft.value, name: String(draft.value?.name || "").trim(), description: String(draft.value?.description || "").trim(), brand: String(draft.value?.brand || "").trim(), model: String(draft.value?.model || "").trim(), category_id: toInt(getCategoryIdFromDraft(draft.value), 0) || null, subcategory_id: toInt(getSubcategoryIdFromDraft(draft.value), 0) || null, price_list: num(draft.value?.price_list, 0), price_discount: num(draft.value?.price_discount, 0), price_reseller: num(draft.value?.price_reseller, 0) };
  delete payload.sku;
  if (payload.barcode === "") payload.barcode = null;
  if (payload.branch_id === "" || payload.branch_id === 0) payload.branch_id = null;

  // ── Promo: blindaje al guardar ─────────────────────────────────────────
  // Si is_promo está OFF, limpiamos absolutamente todo lo de promo.
  if (!payload.is_promo) {
    payload.promo_price = null;
    payload.promo_starts_at = null;
    payload.promo_ends_at = null;
    payload.promo_qty_threshold = null;
    payload.promo_qty_discount = null;
    payload.promo_qty_mode = null;
  } else {
    // Si la submodalidad "Por tiempo" no está activa, sus campos van null.
    if (!promoTimeOn.value) {
      payload.promo_price = null;
      payload.promo_starts_at = null;
      payload.promo_ends_at = null;
    }
    // Si la submodalidad "Por cantidad" no está activa, sus campos van null.
    if (!promoQtyOn.value) {
      payload.promo_qty_threshold = null;
      payload.promo_qty_discount = null;
      payload.promo_qty_mode = null;
    }
  }

  // ── Kit / combo: enviar solo los datos mínimos al backend ──────────────
  // Si is_kit=true, mandamos kit_items normalizado.
  // Si is_kit=false, vaciamos kit_items para que el backend borre componentes.
  if (payload.is_kit) {
    payload.kit_items = arr(draft.value?.kit_items)
      .map((it, idx) => ({
        component_id: toInt(it?.component_id ?? it?.id, 0),
        qty: num(it?.qty, 1),
        sort_order: idx,
      }))
      .filter((it) => it.component_id > 0 && it.qty > 0);
  } else {
    payload.kit_items = [];
  }

  return payload;
}
function buildBranchIdsFromStockMatrix() {
  const bids = [];
  for (const r of arr(stockMatrix.value)) {
    const bid = toInt(r.branch_id, 0); if (!bid) continue;
    if (toBool(r.enabled, false) || num(r.qty, 0) !== 0) bids.push(bid);
  }
  const owner = toInt(draft.value?.branch_id, 0); if (owner) bids.push(owner);
  return Array.from(new Set(bids));
}

/* ── Create ── */
async function createAll() {
  step1Touched.value = true;
  const errs = validateDatos();
  if (errs) { step.value = 1; showValidation(errs, "No se puede crear todavía."); return; }
  busy.value = true;
  products.error = null; products.lastFieldErrors = null;
  try {
    const payload = buildPayload();
    payload.branch_ids = buildBranchIdsFromStockMatrix();
    const ok = await products.create(payload);
    if (!ok) { showValidation(["Errores de validación del servidor."], "No se pudo crear."); return; }
    const created = products.current;
    const pid = toInt(created?.id, 0);
    if (!pid) { showValidation(["La API no devolvió un ID válido."], "No se pudo crear."); return; }
    const skuReal = buildSku({ ...draft.value, ...created }, pid);
    try { await products.update(pid, { sku: skuReal }); draft.value = { ...draft.value, ...deepClone(created), sku: skuReal }; }
    catch { draft.value = { ...draft.value, ...deepClone(created) }; }
    for (const r of arr(stockMatrix.value)) {
      const bid = toInt(r.branch_id, 0); const wid = toInt(r.warehouse_id, 0);
      const qty = num(r.qty, NaN); if (!Number.isFinite(qty)) continue;
      if (!toBool(r.enabled, false) && qty === 0) continue;
      const ok2 = await products.initStock({ product_id: pid, branch_id: bid || null, warehouse_id: wid || null, qty });
      if (!ok2) toast("⚠️ Stock: " + (products.error || `Falló sucursal ${bid || "—"}`));
    }
    if (imagesCount.value) {
      const up = await products.uploadImages(pid, arr(queuedImages.value));
      if (!up) toast("⚠️ Imágenes: " + (products.error || "No se pudieron subir"));
    }
    await commitVideos(pid);
    toast("✅ Producto creado");
    router.push({ name: "products" });
  } finally { busy.value = false; }
}

/* ── Save ── */
async function saveAll() {
  const pid = toInt(draft.value?.id, 0);
  if (!pid) { showValidation(["No hay ID de producto para editar."], "Error."); return; }
  step1Touched.value = true;
  const errs = validateDatos();
  if (errs) { step.value = 1; showValidation(errs, "No se puede guardar todavía."); return; }
  busy.value = true;
  products.error = null; products.lastFieldErrors = null;
  try {
    const payload = buildPayload();
    payload.branch_ids = buildBranchIdsFromStockMatrix();
    const ok = await products.update(pid, payload);
    if (!ok) { showValidation(["Errores de validación del servidor."], "No se pudo guardar."); return; }
    if (!String(draft.value?.sku || "").trim()) {
      const skuReal = buildSku(draft.value, pid);
      try { await products.update(pid, { sku: skuReal }); draft.value.sku = skuReal; } catch {}
    }
    for (const r of arr(stockMatrix.value)) {
      const bid = toInt(r.branch_id, 0); const wid = toInt(r.warehouse_id, 0);
      const enabled = toBool(r.enabled, false);
      const desiredQty = enabled ? num(r.qty, NaN) : 0;
      if (enabled && !Number.isFinite(desiredQty)) continue;
      const cur = num(r.current_qty, NaN);
      if (Number.isFinite(cur) && desiredQty === cur) continue;
      const ok2 = await products.initStock({ product_id: pid, branch_id: bid || null, warehouse_id: wid || null, qty: desiredQty });
      if (!ok2) toast("⚠️ Stock: " + (products.error || `Falló ${bid || "—"}`));
    }
    if (imagesCount.value) {
      const up = await products.uploadImages(pid, arr(queuedImages.value));
      if (!up) toast("⚠️ Imágenes: " + (products.error || "No se pudieron subir"));
      else queuedImages.value = [];
    }
    await commitVideos(pid);
    toast("✅ Cambios guardados");
    router.push({ name: "products" });
  } finally { busy.value = false; }
}
</script>

<style scoped>
/* ══ ROOT — ocupa todo el v-main ══ */
/* El root usa "background" (más oscuro/claro que surface) para que las
   cards de surface se vean como bloques sólidos elevados sobre él. */
.pfp-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-surface));
}

/* ══ TOP BAR ══ */
.pfp-topbar {
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  z-index: 5;
}
.pfp-topbar-inner {
  /* 3 columnas: título (izq) — pasos (centro real) — slot derecho.
     Con minmax(0,1fr) en los costados, los pasos quedan exactamente
     centrados al ancho del topbar, sin importar el largo del título. */
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
}
.pfp-back-btn { margin-left: -6px; }

.pfp-title-block {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  min-width: 0;
}

/* Steps row — col centro del grid del topbar */
.pfp-steps-row {
  display: flex; align-items: center; gap: 6px;
  justify-content: center; flex-wrap: wrap;
  min-width: 0;
}
.pfp-step-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 14px; border-radius: 999px; border: none;
  background: transparent; cursor: pointer;
  color: inherit; opacity: 0.45;
  transition: all 0.15s;
}
.pfp-step-btn:hover:not(:disabled) { opacity: 0.75; background: rgba(var(--v-theme-on-surface), 0.06); }
.pfp-step-btn.active   { opacity: 1; font-weight: 400; color: rgb(var(--v-theme-primary)); }
.pfp-step-btn.done     { opacity: 0.8; }
.pfp-step-btn.disabled { cursor: not-allowed; opacity: 0.3; }
.pfp-step-num {
  width: 22px; height: 22px; border-radius: 999px; display: grid; place-items: center;
  font-size: 11px; font-weight: 500; flex-shrink: 0;
  background: rgba(var(--v-theme-on-surface), 0.12);
  transition: background 0.15s;
}
.pfp-step-btn.active .pfp-step-num { background: rgb(var(--v-theme-primary)); color: #fff; }
.pfp-step-btn.done   .pfp-step-num { background: rgb(var(--v-theme-success));  color: #fff; }
.pfp-step-label { font-size: 13px; }

/* Mobile steps — sigue en columna central del grid */
.pfp-steps-mobile {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(20, 136, 209, 0.10);
}
.v-theme--adminDark .pfp-steps-mobile,
.v-theme--shopDark .pfp-steps-mobile,
.v-theme--dark .pfp-steps-mobile {
  background: rgba(20, 136, 209, 0.16);
}

/* Slot derecho del topbar — balancea el grid y aloja contexto + spinner */
.pfp-topbar-right {
  display: flex; align-items: center; justify-content: flex-end;
  gap: 8px;
  min-height: 30px;
}
.pfp-ctx-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-size: 11.5px;
  font-weight: 400;
  white-space: nowrap;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pfp-ctx-id { font-weight: 500; }
.pfp-ctx-sku {
  font-family: monospace;
  font-size: 11px;
  opacity: 0.65;
  margin-left: 4px;
  padding-left: 6px;
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.pfp-ctx-chip--new {
  background: rgba(var(--v-theme-primary), 0.10);
  color: rgb(var(--v-theme-primary));
  border-color: rgba(var(--v-theme-primary), 0.25);
}
.pfp-step-mobile-info { display: inline-flex; align-items: baseline; gap: 6px; }
.pfp-step-mobile-count {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #1488d1;
  font-variant-numeric: tabular-nums;
}
.pfp-step-mobile-name {
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: rgb(var(--v-theme-on-surface));
}
.pfp-dots-row { display: inline-flex; align-items: center; gap: 4px; }
.pfp-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(20, 136, 209, 0.30);
  transition: all 0.2s;
}
.pfp-dot.active { width: 18px; background: #1488d1; }
.pfp-dot.done   { background: rgba(20, 136, 209, 0.65); }

/* Progress bar */
.pfp-prog-wrap { height: 3px; background: rgba(var(--v-theme-on-surface), 0.08); }
.pfp-prog-bar  { height: 100%; background: rgb(var(--v-theme-primary)); transition: width 0.3s ease; }

/* ══ LAYOUT ══ */
.pfp-layout { flex: 1; display: flex; overflow: hidden; min-height: 0; }

/* ══ MAIN ══ */
.pfp-main {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
}
.pfp-main::-webkit-scrollbar { display: none; }

.pfp-content {
  padding: 24px 28px 28px;
  max-width: 1280px;
  margin: 0 auto;
}

.pfp-init-loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 20px;
}

/* ══ STEP 1 — 2-col grid on lg ══ */
.pfp-step1-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
}
@media (max-width: 860px) { .pfp-step1-grid { grid-template-columns: 1fr; gap: 18px; } }

/* ══ STEP 2 — 2-col: stock + images, videos full width ══ */
.pfp-step2-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
}
.pfp-step2-videos { grid-column: 1 / -1; }
@media (max-width: 780px) { .pfp-step2-grid { grid-template-columns: 1fr; gap: 18px; } .pfp-step2-videos { grid-column: auto; } }

/* ══ SECTION CARDS ══ */
/* Cards sólidas con elevación: surface + borde sutil + sombra suave para
   que se lean como bloques únicos sobre el background del root. */
.pfp-section {
  border-radius: 14px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.9));
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 4px 16px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.18s, border-color 0.18s;
}
.pfp-section:hover {
  border-color: rgba(var(--v-theme-primary), 0.15);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.07),
    0 6px 22px rgba(0, 0, 0, 0.08);
}
.pfp-section-head {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  background:
    linear-gradient(90deg,
      rgba(var(--v-theme-primary), 0.05) 0%,
      rgba(var(--v-theme-on-surface), 0.02) 100%);
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.7));
  position: relative;
}
.pfp-section-head::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: var(--accent, rgb(var(--v-theme-primary)));
  opacity: 0.9;
}
.pfp-section-icon { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; flex-shrink: 0; background: var(--accent, rgb(var(--v-theme-primary))); box-shadow: 0 2px 6px rgba(0,0,0,0.10); }
.pfp-section-title { font-size: 13.5px; font-weight: 500; line-height: 1.2; letter-spacing: 0.1px; }
.pfp-section-sub   { font-size: 11px; opacity: 0.55; }
.pfp-section-body  { padding: 14px; }
.pfp-section-body.pa-0 { padding: 0; }
.pfp-section :deep(.v-field) { border-radius: 9px; }

/* ══ PROMO ══ */
.pfp-promo-section {
  /* Hereda los estilos de .pfp-section (borde + shadow + bg sólido).
     Sólo overrideamos el efecto activo para destacar cuando is_promo=true. */
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pfp-promo-section.pfp-promo-on {
  border-color: rgba(var(--v-theme-primary), 0.45);
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-primary), 0.10),
    0 2px 4px rgba(0, 0, 0, 0.06),
    0 8px 22px rgba(2, 73, 139, 0.10);
}
.pfp-promo-hint {
  display: flex; align-items: flex-start; gap: 6px;
  padding: 9px 11px; border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  font-size: 12px; line-height: 1.4;
  margin-bottom: 12px;
}
.pfp-promo-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
@media (max-width: 860px) {
  .pfp-promo-grid { grid-template-columns: 1fr; }
}
.pfp-promo-card {
  border: 1.5px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  background: rgba(var(--v-theme-surface-variant), 0.15);
  transition: border-color 0.15s, background 0.15s;
}
.pfp-promo-card.on {
  border-style: solid;
  border-color: rgba(var(--v-theme-primary), 0.45);
  background: rgba(var(--v-theme-primary), 0.04);
}
.pfp-promo-card-head {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.pfp-promo-card.on .pfp-promo-card-head {
  border-bottom-color: rgba(var(--v-theme-primary), 0.25);
}
.pfp-promo-card-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 400;
}
.pfp-promo-card-body {
  padding: 12px;
}
.pfp-promo-card-empty {
  padding: 18px 12px; text-align: center;
  font-size: 12px; opacity: 0.55;
}
.pfp-promo-dates {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
@media (max-width: 520px) {
  .pfp-promo-dates { grid-template-columns: 1fr; }
}
.pfp-promo-qty-row {
  display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: stretch;
}
@media (max-width: 520px) {
  .pfp-promo-qty-row { grid-template-columns: 1fr; }
}
.pfp-promo-mode :deep(.v-btn) { font-size: 11px; font-weight: 400; }
.pfp-promo-savings {
  display: flex; align-items: center; gap: 5px;
  margin-top: 10px; padding: 7px 9px;
  border-radius: 7px;
  background: rgba(var(--v-theme-success), 0.08);
  border: 1px solid rgba(var(--v-theme-success), 0.2);
  font-size: 12px;
}
.pfp-promo-summary {
  display: flex; flex-direction: column; gap: 6px;
}
.pfp-promo-summary-row {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px;
  padding: 7px 9px; border-radius: 7px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
}

/* ══ TOGGLES ══ */
.pfp-toggle-row { display: flex; gap: 10px; flex-wrap: wrap; }
.pfp-toggle-card {
  flex: 1; min-width: 180px;
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px;
  border: 1.5px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer; transition: all 0.15s; user-select: none;
}
.pfp-toggle-card:hover { border-color: rgba(var(--v-theme-primary), 0.4); }
.pfp-toggle-card.on { border-color: rgba(var(--v-theme-primary), 0.35); background: rgba(var(--v-theme-primary), 0.04); }
.pfp-toggle-text  { flex: 1; }
.pfp-toggle-label { font-size: 13px; font-weight: 400; }
.pfp-toggle-sub   { font-size: 11px; opacity: 0.6; }

/* ══ VIDEOS ══ */
.pfp-video-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.pfp-video-label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 400; }
.pfp-queue-list  { display: flex; flex-direction: column; gap: 5px; }
.pfp-queue-item  { display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-radius: 7px; background: rgba(var(--v-theme-surface-variant), 0.5); }
.pfp-queue-url   { flex: 1; font-size: 11px; opacity: 0.8; min-width: 0; }
.pfp-queue-empty { font-size: 11px; opacity: 0.45; padding: 6px 0; }
@media (max-width: 700px) { .pfp-video-grid { grid-template-columns: 1fr; } }

/* ══ SUMMARY ══ */
/* HERO estilo ecommerce: galería + info principal */
.pfp-hero {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) 1fr;
  gap: 24px;
  padding: 20px;
  margin-bottom: 22px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.9));
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 8px 28px rgba(0, 0, 0, 0.06);
}
@media (max-width: 860px) {
  .pfp-hero { grid-template-columns: 1fr; gap: 16px; padding: 14px; }
}

.pfp-hero-gallery { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.pfp-hero-main {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.pfp-hero-main img { width: 100%; height: 100%; object-fit: contain; display: block; }
.pfp-hero-empty {
  width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; opacity: 0.4; font-size: 12px;
}
.pfp-hero-badges {
  position: absolute;
  top: 10px; left: 10px;
  display: flex; flex-direction: column; gap: 6px;
  align-items: flex-start;
}
.pfp-hero-promo-badge {
  background: linear-gradient(135deg, #ff5722, #ff9100);
  color: #fff;
  font-size: 11px; font-weight: 500; letter-spacing: 0.7px;
  padding: 4px 10px; border-radius: 4px;
  box-shadow: 0 3px 10px rgba(255, 87, 34, 0.40);
}
.pfp-hero-kit-badge {
  display: inline-flex; align-items: center; gap: 5px;
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: #fff;
  font-size: 11px; font-weight: 500; letter-spacing: 0.5px;
  padding: 4px 10px; border-radius: 4px;
  box-shadow: 0 3px 10px rgba(124, 58, 237, 0.40);
}

.pfp-hero-thumbs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 6px;
}
.pfp-hero-thumb {
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1.5px solid transparent;
  transition: border-color 0.15s;
}
.pfp-hero-thumb:hover { border-color: rgba(var(--v-theme-primary), 0.4); }
.pfp-hero-thumb.is-primary { border-color: rgb(var(--v-theme-primary)); }
.pfp-hero-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pfp-hero-thumb--more {
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 500; opacity: 0.6;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.pfp-hero-info { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.pfp-hero-cat {
  font-size: 11px; font-weight: 400; text-transform: uppercase;
  letter-spacing: 0.5px; opacity: 0.6;
  color: rgb(var(--v-theme-primary));
}
.pfp-hero-name {
  font-size: 22px; font-weight: 500; line-height: 1.2;
  word-break: break-word;
}
.pfp-hero-brand { font-size: 13px; font-weight: 400; opacity: 0.7; }
.pfp-hero-price-block {
  margin-top: 8px; padding: 12px 14px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
}
.pfp-hero-price-old { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); text-decoration: line-through; }
.pfp-hero-price-row { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.pfp-hero-price-main { font-size: 32px; font-weight: 500; line-height: 1.1; letter-spacing: -0.5px; }
.pfp-hero-price-off {
  font-size: 13px; font-weight: 500; color: #00a650;
}
.pfp-hero-price-reseller { font-size: 12px; opacity: 0.7; margin-top: 4px; }

.pfp-hero-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.pfp-hero-ids {
  display: flex; flex-wrap: wrap; gap: 12px;
  font-size: 12px; opacity: 0.7;
  margin-top: 6px;
  padding-top: 12px;
  border-top: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
}
.pfp-hero-id b { font-weight: 400; opacity: 0.85; }

.pfp-summary-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 22px; }
@media (max-width: 860px) { .pfp-summary-grid { grid-template-columns: 1fr; } }

.pfp-sum-desc-block {
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.85;
  white-space: pre-wrap;
}

.pfp-sum-card {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.9));
  background: rgb(var(--v-theme-surface));
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 4px 16px rgba(0, 0, 0, 0.05);
}
.pfp-sum-card-head { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.65; margin-bottom: 10px; }
.pfp-kv { display: grid; grid-template-columns: 100px 1fr; gap: 5px 10px; align-items: baseline; }
.pfp-kv .k { font-size: 11px; opacity: 0.5; }
.pfp-kv .v { font-size: 13px; font-weight: 400; word-break: break-word; }
.pfp-mono { font-family: monospace; font-size: 12px; }
.pfp-sum-desc { margin-top: 9px; font-size: 12px; opacity: 0.7; padding: 9px; border-radius: 7px; background: rgba(var(--v-theme-surface-variant), 0.5); white-space: pre-wrap; max-height: 90px; overflow-y: auto; }
.pfp-price-row-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
.pfp-price-item { text-align: center; }
.pfp-price-label { font-size: 10px; opacity: 0.5; margin-bottom: 2px; }
.pfp-price-val  { font-size: 15px; font-weight: 500; color: rgb(var(--v-theme-success)); }
.pfp-price-val.muted { color: rgba(var(--v-theme-on-surface), 0.3); font-size: 13px; }
.pfp-media-badges { display: flex; flex-wrap: wrap; gap: 7px; }
.pfp-media-badge { display: flex; align-items: center; gap: 4px; font-size: 11px; padding: 3px 9px; border-radius: 999px; background: rgba(var(--v-theme-surface-variant), 0.6); opacity: 0.45; }
.pfp-media-badge.active { opacity: 1; background: rgba(var(--v-theme-primary), 0.12); color: rgb(var(--v-theme-primary)); }
.pfp-stock-list { display: flex; flex-direction: column; gap: 4px; }
.pfp-stock-item { display: flex; justify-content: space-between; align-items: center; padding: 5px 9px; border-radius: 7px; background: rgba(var(--v-theme-surface-variant), 0.5); font-size: 12px; }

/* ══ ERROR ══ */
.pfp-alert-error { display: flex; align-items: flex-start; gap: 8px; padding: 11px 13px; border-radius: 10px; background: rgba(var(--v-theme-error), 0.1); border: 1px solid rgba(var(--v-theme-error), 0.3); }

/* ══ FOOTER ══ */
.pfp-footer {
  flex-shrink: 0;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}
.pfp-footer-inner {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 9px 20px; flex-wrap: wrap;
  padding-bottom: calc(9px + env(safe-area-inset-bottom, 0px));
}
.pfp-footer-info  { display: flex; align-items: center; gap: 5px; font-size: 12px; opacity: 0.55; }
.pfp-footer-step  { font-weight: 500; }
.pfp-footer-dot   { opacity: 0.4; }
.pfp-footer-btns  { display: flex; gap: 8px; }
.pfp-btn-nav  { min-width: 110px; }
.pfp-btn-save { min-width: 160px; font-weight: 500; }

/* ══ VALIDATION ══ */
.pfp-validation-list { display: flex; flex-direction: column; gap: 8px; }
.pfp-validation-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }

/* ══ TABLET ══ */
@media (max-width: 959px) {
  .pfp-content { padding: 14px 16px 20px; }
  .pfp-summary-grid { grid-template-columns: 1fr; }
}

/* ══ Escaneo (solo mobile) ══ */
.pfp-scan-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  margin-bottom: 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(20, 136, 209, 0.10), rgba(20, 136, 209, 0.04));
  border: 1px dashed rgba(20, 136, 209, 0.30);
}
.v-theme--adminDark .pfp-scan-row,
.v-theme--shopDark .pfp-scan-row,
.v-theme--dark .pfp-scan-row {
  background: linear-gradient(135deg, rgba(20, 136, 209, 0.16), rgba(20, 136, 209, 0.06));
  border-color: rgba(20, 136, 209, 0.40);
}
.pfp-scan-hint {
  font-size: 11.5px;
  line-height: 1.4;
  color: rgba(var(--v-theme-on-surface), 0.62);
  text-align: center;
  padding: 0 6px;
}

/* ══ MOBILE ══ */
@media (max-width: 599px) {
  .pfp-content { padding: 10px 10px 16px; }
  .pfp-topbar-inner { padding: 7px 10px; gap: 6px; }
  .pfp-title { font-size: 13px; }
  .pfp-section-head { padding: 8px 10px; }
  .pfp-section-body { padding: 8px 10px; }
  .pfp-toggle-row { flex-direction: column; }
  .pfp-toggle-card { min-width: 0; }
  .pfp-footer-inner { flex-direction: row; align-items: center; gap: 6px; padding: 8px 12px; flex-wrap: nowrap; }
  .pfp-footer-info { display: none; }
  .pfp-footer-btns  { gap: 6px; flex: 1; justify-content: flex-end; }
  .pfp-btn-nav, .pfp-btn-save { flex: 1; min-width: 0; }
  .pfp-price-row-grid { grid-template-columns: 1fr 1fr; }
  .pfp-kv { grid-template-columns: 80px 1fr; }
  /* AppPageHeader interno reducido */
  .pfp-root .app-page-header { padding-left: 12px !important; padding-right: 12px !important; }
}

/* ══ LAPTOP / NOTEBOOK HEIGHT (≤ 820px viewport height) ══ */
@media (max-height: 820px) {
  .pfp-content       { padding: 18px 24px 20px; }
  .pfp-step1-grid    { gap: 16px; }
  .pfp-step2-grid    { gap: 16px; }
  .pfp-section-head  { padding: 8px 12px; }
  .pfp-section-body  { padding: 9px 12px; }
  .pfp-topbar-inner  { padding: 7px 14px; }
}

/* ══ VERY SHORT SCREENS (≤ 700px height, phones landscape) ══ */
@media (max-height: 700px) {
  .pfp-content      { padding: 12px 18px 14px; }
  .pfp-section-head { padding: 7px 11px; }
  .pfp-section-body { padding: 8px 11px; }
  .pfp-step1-grid   { gap: 12px; }
  .pfp-step2-grid   { gap: 12px; }
  .pfp-footer-inner { padding: 7px 14px; }
}

/* ══ KIT / COMBO ══ */
.pfp-kit-section {
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pfp-kit-section.pfp-kit-on {
  border-color: rgba(124, 58, 237, 0.45);
  box-shadow:
    0 0 0 1px rgba(124, 58, 237, 0.10),
    0 2px 4px rgba(0, 0, 0, 0.06),
    0 8px 22px rgba(124, 58, 237, 0.10);
}
.pfp-kit-hint {
  display: flex; align-items: flex-start; gap: 6px;
  padding: 9px 11px; border-radius: 8px;
  background: rgba(124, 58, 237, 0.06);
  border: 1px solid rgba(124, 58, 237, 0.18);
  font-size: 12px; line-height: 1.4;
  margin-bottom: 12px;
}
.pfp-kit-empty {
  text-align: center;
  padding: 24px 16px;
  border: 1px dashed rgba(var(--v-border-color), 0.3);
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.pfp-kit-list {
  display: flex; flex-direction: column; gap: 8px;
}
.pfp-kit-row {
  display: grid;
  grid-template-columns: auto 1fr 110px auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.pfp-kit-thumb {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.pfp-kit-info { min-width: 0; }
.pfp-kit-name {
  font-size: 13px; font-weight: 500; line-height: 1.25;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pfp-kit-meta {
  font-size: 11px; opacity: 0.65; margin-top: 2px;
  display: flex; align-items: center; gap: 4px;
}
.pfp-kit-dot { opacity: 0.5; }
.pfp-kit-qty :deep(.v-field) { border-radius: 8px; }

.pfp-kit-savings {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(124, 58, 237, 0.05);
  border: 1px solid rgba(124, 58, 237, 0.18);
  font-size: 12.5px;
}
.pfp-kit-savings-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 3px 0;
}
.pfp-kit-savings-final {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed rgba(124, 58, 237, 0.25);
  font-size: 13px;
}
.pfp-kit-savings-warn {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed rgba(245, 158, 11, 0.4);
}

@media (max-width: 720px) {
  .pfp-kit-row {
    grid-template-columns: auto 1fr;
    grid-template-areas:
      "thumb info"
      "qty   actions";
  }
  .pfp-kit-thumb { grid-area: thumb; }
  .pfp-kit-info  { grid-area: info; }
  .pfp-kit-qty   { grid-area: qty; }
  .pfp-kit-row > .v-btn { grid-area: actions; }
}

/* ══ KIT en RESUMEN (step 3) ══ */
.pfp-sum-kit {
  border-color: rgba(124, 58, 237, 0.30) !important;
  background: linear-gradient(180deg,
    rgba(124, 58, 237, 0.04),
    rgba(124, 58, 237, 0.01)
  );
}
.pfp-sum-kit-empty {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px;
  border: 1px dashed rgba(245, 158, 11, 0.4);
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.05);
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.85);
}
.pfp-sum-kit-list {
  display: flex; flex-direction: column; gap: 6px;
}
.pfp-sum-kit-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.025);
}
.pfp-sum-kit-thumb {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.pfp-sum-kit-info { min-width: 0; }
.pfp-sum-kit-name {
  font-size: 12.5px; font-weight: 500; line-height: 1.2;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pfp-sum-kit-meta {
  font-size: 10.5px; opacity: 0.6; margin-top: 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pfp-sum-kit-qty {
  font-size: 13px; font-weight: 600;
  color: rgb(124, 58, 237);
  white-space: nowrap;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(124, 58, 237, 0.08);
}
.pfp-sum-kit-savings {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(124, 58, 237, 0.20);
  font-size: 12px;
  display: flex; flex-direction: column; gap: 3px;
}
.pfp-sum-kit-savings-row {
  display: flex; justify-content: space-between; align-items: center;
}
.pfp-sum-kit-savings-final {
  display: flex; align-items: center; gap: 4px;
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed rgba(124, 58, 237, 0.20);
  font-size: 12.5px;
}
</style>
