<!-- src/modules/products/components/ProductFormDialog.vue -->
<template>
  <v-dialog
    v-model="openLocal"
    persistent
    content-class="pf-overlay"
    transition="dialog-bottom-transition"
  >
    <div class="pf-root">

      <!-- ══ TOP BAR ══ -->
      <div class="pf-topbar">
        <div class="pf-topbar-inner">
          <!-- Title -->
          <div class="pf-title-block">
            <div class="pf-badge">
              <v-icon size="16" color="white">{{ isEdit ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
            </div>
            <div>
              <div class="pf-title">{{ isEdit ? 'Editar producto' : 'Nuevo producto' }}</div>
              <div class="pf-title-sub" v-if="draft?.id">#{{ draft.id }}</div>
            </div>
          </div>

          <!-- Steps (desktop) -->
          <div class="pf-steps-row" v-if="mdAndUp">
            <button
              v-for="s in STEPS"
              :key="s.value"
              class="pf-step-btn"
              :class="{ active: step === s.value, done: step > s.value, disabled: !canGoTo(s.value) }"
              :disabled="!canGoTo(s.value)"
              @click="goToStep(s.value)"
              type="button"
            >
              <span class="pf-step-num">
                <v-icon v-if="step > s.value" size="13" color="white">mdi-check</v-icon>
                <span v-else>{{ s.value }}</span>
              </span>
              <span class="pf-step-label">{{ s.title }}</span>
            </button>
          </div>

          <!-- Mobile steps -->
          <div class="pf-steps-mobile" v-else>
            <div class="pf-step-mobile-info">
              <span class="pf-step-mobile-count">{{ step }}/{{ STEPS.length }}</span>
              <v-icon size="12" :color="canGoAfterStep1 ? 'success' : 'medium-emphasis'" class="mx-1">
                {{ canGoAfterStep1 ? 'mdi-check-circle' : 'mdi-circle-outline' }}
              </v-icon>
              <span class="pf-step-mobile-name">{{ STEPS[step - 1].title }}</span>
            </div>
            <div class="pf-dots-row">
              <span v-for="s in STEPS" :key="s.value"
                class="pf-dot"
                :class="{ active: step === s.value, done: step > s.value }"
              />
            </div>
          </div>

          <!-- Close -->
          <v-btn icon variant="text" size="small" @click="onCancel" :disabled="busy" class="pf-close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Progress line -->
        <div class="pf-prog-wrap">
          <div class="pf-prog-bar" :style="{ width: `${(step / 3) * 100}%` }" />
        </div>
      </div>

      <!-- ══ LAYOUT ══ -->
      <div class="pf-layout">

        <!-- SIDEBAR (desktop only) -->
        <aside class="pf-sidebar" v-if="lgAndUp">
          <div class="pf-sidebar-inner">
            <!-- Steps list -->
            <nav class="pf-sidenav">
              <button
                v-for="s in STEPS"
                :key="s.value"
                class="pf-sidenav-item"
                :class="{ active: step === s.value, done: step > s.value, disabled: !canGoTo(s.value) }"
                :disabled="!canGoTo(s.value)"
                @click="goToStep(s.value)"
                type="button"
              >
                <span class="pf-sidenav-icon">
                  <v-icon v-if="step > s.value" size="14" color="white">mdi-check</v-icon>
                  <v-icon v-else size="14" :color="step === s.value ? 'white' : 'inherit'">{{ s.icon }}</v-icon>
                </span>
                <div class="pf-sidenav-text">
                  <div class="pf-sidenav-title">{{ s.title }}</div>
                  <div class="pf-sidenav-sub">{{ s.sub }}</div>
                </div>
              </button>
            </nav>

            <!-- Product quick info -->
            <div class="pf-side-info" v-if="draft?.name">
              <div class="pf-side-info-label">Producto</div>
              <div class="pf-side-info-name">{{ draft.name }}</div>
              <div class="pf-side-info-row" v-if="getCategoryNameById(getCategoryIdFromDraft(draft))">
                <v-icon size="12">mdi-tag-outline</v-icon>
                {{ getCategoryNameById(getCategoryIdFromDraft(draft)) }}
              </div>
              <div class="pf-side-info-row" v-if="skuPreview">
                <v-icon size="12">mdi-barcode</v-icon>
                {{ skuPreview }}
              </div>
              <div class="pf-side-info-chips">
                <span class="pf-side-chip" :class="draft.is_active ? 'green' : 'grey'">
                  {{ draft.is_active ? 'Activo' : 'Inactivo' }}
                </span>
                <span class="pf-side-chip blue" v-if="queuedImages.length">
                  {{ queuedImages.length }} imgs
                </span>
                <span class="pf-side-chip amber" v-if="stockPreviewList.length">
                  Stock ✓
                </span>
              </div>
            </div>
          </div>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="pf-main" ref="mainRef">
          <div class="pf-content">

            <!-- ══ STEP 1: PRODUCTO ══ -->
            <div v-show="step === 1">
              <!-- Error alert -->
              <div v-if="products.error" class="pf-alert-error mb-4">
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

              <!-- Card: Información básica -->
              <div class="pf-section">
                <div class="pf-section-head" style="--accent: #3b82f6">
                  <div class="pf-section-icon"><v-icon size="16" color="white">mdi-information-outline</v-icon></div>
                  <div>
                    <div class="pf-section-title">Información básica</div>
                    <div class="pf-section-sub">Nombre, marca y descripción del producto</div>
                  </div>
                </div>
                <div class="pf-section-body">
                  <v-row dense>
                    <v-col cols="12">
                      <v-text-field
                        v-model="draft.name"
                        :disabled="busy"
                        density="comfortable"
                        variant="outlined"
                        label="Nombre del producto *"
                        placeholder="Ej: Auriculares Bluetooth Sony WH-1000XM5"
                        :error="!draft.name && step1Touched"
                        :error-messages="!draft.name && step1Touched ? ['El nombre es obligatorio'] : []"
                        prepend-inner-icon="mdi-package-variant"
                        hide-details="auto"
                      />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="draft.brand"
                        :disabled="busy"
                        density="comfortable"
                        variant="outlined"
                        label="Marca"
                        prepend-inner-icon="mdi-tag"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="draft.model"
                        :disabled="busy"
                        density="comfortable"
                        variant="outlined"
                        label="Modelo"
                        prepend-inner-icon="mdi-identifier"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                        v-model="draft.description"
                        :disabled="busy"
                        density="comfortable"
                        variant="outlined"
                        label="Descripción"
                        placeholder="Describí el producto, características, especificaciones..."
                        auto-grow
                        rows="3"
                        prepend-inner-icon="mdi-text-box-outline"
                        hide-details
                      />
                    </v-col>
                  </v-row>
                </div>
              </div>

              <!-- Card: Clasificación -->
              <div class="pf-section mt-4">
                <div class="pf-section-head" style="--accent: #8b5cf6">
                  <div class="pf-section-icon"><v-icon size="16" color="white">mdi-folder-tree-outline</v-icon></div>
                  <div>
                    <div class="pf-section-title">Clasificación</div>
                    <div class="pf-section-sub">Rubro, subrubro e identificadores</div>
                  </div>
                  <v-btn
                    size="x-small"
                    variant="text"
                    class="ml-auto pf-reload-btn"
                    @click="ensureTaxonomies"
                    :disabled="busy"
                    title="Recargar categorías"
                  >
                    <v-icon size="14">mdi-refresh</v-icon>
                  </v-btn>
                </div>
                <div class="pf-section-body">
                  <v-row dense>
                    <v-col cols="12" sm="6">
                      <v-select
                        v-model="draftCategoryId"
                        :items="categoriesList"
                        item-title="name"
                        item-value="id"
                        :disabled="busy"
                        density="comfortable"
                        variant="outlined"
                        label="Rubro *"
                        prepend-inner-icon="mdi-shape-outline"
                        hide-details="auto"
                        clearable
                        :error="!draftCategoryId && step1Touched"
                        :error-messages="!draftCategoryId && step1Touched ? ['El rubro es obligatorio'] : []"
                        :menu-props="{ maxHeight: 380 }"
                      />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-select
                        v-model="draftSubcategoryId"
                        :items="filteredSubcategories"
                        item-title="name"
                        item-value="id"
                        :disabled="busy || !draftCategoryId"
                        density="comfortable"
                        variant="outlined"
                        label="Subrubro *"
                        prepend-inner-icon="mdi-shape-plus-outline"
                        hide-details="auto"
                        clearable
                        :error="!draftSubcategoryId && step1Touched"
                        :error-messages="!draftSubcategoryId && step1Touched ? ['El subrubro es obligatorio'] : []"
                        :menu-props="{ maxHeight: 380 }"
                      >
                        <template #no-data>
                          <div class="pa-3 text-caption text-medium-emphasis">
                            {{ draftCategoryId ? 'Sin subrubros para este rubro.' : 'Seleccioná un rubro primero.' }}
                          </div>
                        </template>
                      </v-select>
                    </v-col>
                    <v-col cols="12" sm="8">
                      <v-text-field
                        :model-value="skuPreview || draft.sku || ''"
                        density="comfortable"
                        variant="outlined"
                        label="SKU (generado automáticamente)"
                        prepend-inner-icon="mdi-barcode-scan"
                        hide-details
                        readonly
                        :placeholder="draftCategoryId && draftSubcategoryId ? 'Calculando...' : 'Seleccioná rubro y subrubro'"
                      />
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        :model-value="draft.code || nextCodePreview || ''"
                        density="comfortable"
                        variant="outlined"
                        label="Código interno"
                        prepend-inner-icon="mdi-pound"
                        hide-details
                        readonly
                        :hint="!draft.id && nextCodePreview ? '(preview)' : ''"
                      />
                    </v-col>
                  </v-row>
                </div>
              </div>

              <!-- Card: Precios -->
              <div class="pf-section mt-4">
                <div class="pf-section-head" style="--accent: #10b981">
                  <div class="pf-section-icon"><v-icon size="16" color="white">mdi-cash-multiple</v-icon></div>
                  <div>
                    <div class="pf-section-title">Precios</div>
                    <div class="pf-section-sub">Precios de venta — todos opcionales</div>
                  </div>
                </div>
                <div class="pf-section-body">
                  <v-row dense>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model="draft.price_list"
                        :disabled="busy"
                        density="comfortable"
                        variant="outlined"
                        label="Precio lista"
                        type="number"
                        min="0"
                        prepend-inner-icon="mdi-currency-usd"
                        :error-messages="fieldErr('price_list')"
                        hide-details="auto"
                      />
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model="draft.price_discount"
                        :disabled="busy"
                        density="comfortable"
                        variant="outlined"
                        label="Precio descuento"
                        type="number"
                        min="0"
                        prepend-inner-icon="mdi-tag-minus"
                        :error-messages="fieldErr('price_discount')"
                        hide-details="auto"
                      />
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model="draft.price_reseller"
                        :disabled="busy"
                        density="comfortable"
                        variant="outlined"
                        label="Precio revendedor"
                        type="number"
                        min="0"
                        prepend-inner-icon="mdi-store-outline"
                        :error-messages="fieldErr('price_reseller')"
                        hide-details="auto"
                      />
                    </v-col>
                  </v-row>
                  <div class="pf-price-hint mt-2">
                    <v-icon size="13">mdi-information-outline</v-icon>
                    Podés ingresar <code>1200000</code> y se convierte a <code>1.200.000</code> automáticamente
                  </div>
                </div>
              </div>

              <!-- Card: Estado -->
              <div class="pf-section mt-4">
                <div class="pf-section-head" style="--accent: #f59e0b">
                  <div class="pf-section-icon"><v-icon size="16" color="white">mdi-tune-variant</v-icon></div>
                  <div>
                    <div class="pf-section-title">Estado y configuración</div>
                    <div class="pf-section-sub">Visibilidad y control de inventario</div>
                  </div>
                </div>
                <div class="pf-section-body">
                  <div class="pf-toggle-row">
                    <div
                      class="pf-toggle-card"
                      :class="{ on: draft.is_active }"
                      @click="draft.is_active = !draft.is_active"
                    >
                      <div class="pf-toggle-icon">
                        <v-icon size="22" :color="draft.is_active ? 'success' : undefined">
                          {{ draft.is_active ? 'mdi-eye' : 'mdi-eye-off' }}
                        </v-icon>
                      </div>
                      <div class="pf-toggle-text">
                        <div class="pf-toggle-label">Activo</div>
                        <div class="pf-toggle-sub">{{ draft.is_active ? 'Visible en catálogo' : 'Oculto' }}</div>
                      </div>
                      <v-switch
                        v-model="draft.is_active"
                        inset
                        density="compact"
                        hide-details
                        :disabled="busy"
                        color="success"
                        @click.stop
                      />
                    </div>

                    <div
                      class="pf-toggle-card"
                      :class="{ on: draft.track_stock }"
                      @click="draft.track_stock = !draft.track_stock"
                    >
                      <div class="pf-toggle-icon">
                        <v-icon size="22" :color="draft.track_stock ? 'primary' : undefined">
                          mdi-package-check
                        </v-icon>
                      </div>
                      <div class="pf-toggle-text">
                        <div class="pf-toggle-label">Gestionar stock</div>
                        <div class="pf-toggle-sub">{{ draft.track_stock ? 'Controla inventario' : 'Sin control' }}</div>
                      </div>
                      <v-switch
                        v-model="draft.track_stock"
                        inset
                        density="compact"
                        hide-details
                        :disabled="busy"
                        color="primary"
                        @click.stop
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ══ STEP 2: STOCK & MEDIA ══ -->
            <div v-show="step === 2">

              <!-- Card: Stock -->
              <div class="pf-section">
                <div class="pf-section-head" style="--accent: #06b6d4">
                  <div class="pf-section-icon"><v-icon size="16" color="white">mdi-warehouse</v-icon></div>
                  <div>
                    <div class="pf-section-title">Stock por sucursal</div>
                    <div class="pf-section-sub">Se aplica al {{ isEdit ? 'guardar' : 'crear' }}</div>
                  </div>
                </div>
                <div class="pf-section-body pa-0">
                  <ProductStockPanel :product-id="draft?.id || null" v-model="stockMatrix" :disabled="busy" />
                </div>
              </div>

              <!-- Card: Imágenes -->
              <div class="pf-section mt-4">
                <div class="pf-section-head" style="--accent: #ec4899">
                  <div class="pf-section-icon"><v-icon size="16" color="white">mdi-image-multiple</v-icon></div>
                  <div>
                    <div class="pf-section-title">Imágenes</div>
                    <div class="pf-section-sub">
                      {{ queuedImages.length ? `${queuedImages.length} en cola` : 'Arrastrá o seleccioná fotos' }}
                    </div>
                  </div>
                </div>
                <div class="pf-section-body pa-0">
                  <ProductImagesPanel
                    :product-id="draft?.id || null"
                    v-model="queuedImages"
                    @changed="onQueuedChanged"
                  />
                </div>
              </div>

              <!-- Card: Videos -->
              <div class="pf-section mt-4">
                <div class="pf-section-head" style="--accent: #ef4444">
                  <div class="pf-section-icon"><v-icon size="16" color="white">mdi-youtube</v-icon></div>
                  <div>
                    <div class="pf-section-title">Videos</div>
                    <div class="pf-section-sub">YouTube/Shorts o archivos de video</div>
                  </div>
                  <div class="ml-auto d-flex ga-1">
                    <v-chip v-if="queuedYoutubeVideos.length || queuedVideoFiles.length"
                      size="x-small" color="primary" variant="tonal">
                      {{ queuedYoutubeVideos.length + queuedVideoFiles.length }} en cola
                    </v-chip>
                    <v-btn size="x-small" variant="text" @click="clearVideosQueue" :disabled="busy">
                      Limpiar
                    </v-btn>
                  </div>
                </div>
                <div class="pf-section-body">
                  <div class="pf-video-grid">
                    <!-- YouTube -->
                    <div>
                      <div class="pf-video-label">
                        <v-icon size="16" color="#FF0000">mdi-youtube</v-icon>
                        YouTube / Shorts
                      </div>
                      <div class="d-flex ga-2 mt-2">
                        <v-text-field
                          v-model="ytUrl"
                          :disabled="busy"
                          density="comfortable"
                          label="URL de YouTube"
                          prepend-inner-icon="mdi-link"
                          variant="outlined"
                          hide-details
                          class="flex-1"
                          @keyup.enter="addYoutubeUrl"
                        />
                        <v-btn color="primary" variant="flat" rounded="lg" @click="addYoutubeUrl" :disabled="busy">
                          <v-icon>mdi-plus</v-icon>
                        </v-btn>
                      </div>
                      <v-alert v-if="ytError" type="error" variant="tonal" density="compact" class="mt-2">
                        {{ ytError }}
                      </v-alert>
                      <div v-if="queuedYoutubeVideos.length" class="pf-queue-list mt-2">
                        <div v-for="(v, idx) in queuedYoutubeVideos" :key="v.key" class="pf-queue-item">
                          <v-icon size="16" color="#FF0000" class="flex-shrink-0">mdi-youtube</v-icon>
                          <div class="pf-queue-url text-truncate">{{ v.url }}</div>
                          <v-btn size="x-small" icon variant="text" @click="removeYoutubeAt(idx)" :disabled="busy">
                            <v-icon size="14">mdi-close</v-icon>
                          </v-btn>
                        </div>
                      </div>
                      <div v-else class="pf-queue-empty">Sin videos en cola</div>
                    </div>

                    <!-- Files -->
                    <div>
                      <div class="pf-video-label">
                        <v-icon size="16">mdi-upload</v-icon>
                        Archivo de video
                      </div>
                      <div class="mt-2">
                        <v-file-input
                          v-model="queuedVideoFiles"
                          :disabled="busy"
                          density="comfortable"
                          variant="outlined"
                          prepend-icon=""
                          prepend-inner-icon="mdi-video-plus"
                          label="Elegí archivos de video"
                          multiple
                          accept="video/*"
                          show-size
                          chips
                          hide-details
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Existing videos (edit) -->
                  <ProductVideosPanel
                    v-if="isEdit"
                    class="mt-3"
                    :product-id="draft?.id || null"
                    :mode="'edit'"
                    :youtube-queue="queuedYoutubeVideos"
                    :files-queue="queuedVideoFiles"
                    @update:youtubeQueue="queuedYoutubeVideos = normalizeYoutubeQueue($event)"
                    @update:filesQueue="queuedVideoFiles = normalizeFilesQueue($event)"
                    @changed="onVideosChanged"
                  />
                </div>
              </div>
            </div>

            <!-- ══ STEP 3: CONFIRMAR ══ -->
            <div v-show="step === 3">
              <!-- Status chip -->
              <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
                <div>
                  <div class="text-h6 font-weight-black">Resumen final</div>
                  <div class="text-caption text-medium-emphasis">
                    Revisá todo antes de {{ isEdit ? 'guardar' : 'crear' }}
                  </div>
                </div>
                <v-chip :color="isReadyToCreate ? 'success' : 'warning'" variant="flat" size="small">
                  <v-icon start size="13">{{ isReadyToCreate ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
                  {{ isReadyToCreate ? 'Listo para ' + (isEdit ? 'guardar' : 'crear') : 'Faltan datos obligatorios' }}
                </v-chip>
              </div>

              <v-alert v-if="products.error" type="error" variant="tonal" density="comfortable" class="mb-4">
                {{ products.error }}
              </v-alert>

              <div class="pf-summary-grid">
                <!-- Left: Product details -->
                <div class="d-flex flex-column ga-4">
                  <!-- Basic info -->
                  <div class="pf-sum-card">
                    <div class="pf-sum-card-head">
                      <v-icon size="16" color="primary">mdi-package-variant</v-icon>
                      Producto
                    </div>
                    <div class="pf-kv">
                      <span class="k">Nombre</span><span class="v">{{ safe(draft.name) }}</span>
                      <span class="k">SKU</span><span class="v pf-mono">{{ safe(finalSku) }}</span>
                      <span class="k">Código</span><span class="v pf-mono">{{ safe(draft.code || nextCodePreview) }}</span>
                      <span class="k">Rubro</span><span class="v">{{ safe(getCategoryNameById(getCategoryIdFromDraft(draft))) }}</span>
                      <span class="k">Subrubro</span><span class="v">{{ safe(getSubcategoryNameById(getSubcategoryIdFromDraft(draft))) }}</span>
                      <span class="k">Marca</span><span class="v">{{ safe(draft.brand) }}</span>
                      <span class="k">Modelo</span><span class="v">{{ safe(draft.model) }}</span>
                      <span class="k">Estado</span>
                      <span class="v">
                        <v-chip :color="draft.is_active ? 'success' : 'warning'" size="x-small" variant="tonal">
                          {{ draft.is_active ? 'Activo' : 'Inactivo' }}
                        </v-chip>
                      </span>
                    </div>
                    <div class="pf-sum-desc" v-if="draft.description">
                      {{ draft.description }}
                    </div>
                  </div>

                  <!-- Prices -->
                  <div class="pf-sum-card">
                    <div class="pf-sum-card-head">
                      <v-icon size="16" color="success">mdi-cash-multiple</v-icon>
                      Precios
                    </div>
                    <div class="pf-price-row-grid">
                      <div class="pf-price-item" v-for="p in priceItems" :key="p.label">
                        <div class="pf-price-label">{{ p.label }}</div>
                        <div class="pf-price-val" :class="{ muted: !p.val }">
                          {{ p.val ? `$ ${fmtNum(p.val)}` : '—' }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Media queue -->
                  <div class="pf-sum-card">
                    <div class="pf-sum-card-head">
                      <v-icon size="16" color="pink">mdi-image-multiple</v-icon>
                      Media en cola
                    </div>
                    <div class="pf-media-badges">
                      <span class="pf-media-badge" :class="{ active: queuedImages.length }">
                        <v-icon size="14">mdi-image</v-icon>
                        {{ queuedImages.length }} imágenes
                      </span>
                      <span class="pf-media-badge" :class="{ active: queuedYoutubeVideos.length }">
                        <v-icon size="14">mdi-youtube</v-icon>
                        {{ queuedYoutubeVideos.length }} YouTube
                      </span>
                      <span class="pf-media-badge" :class="{ active: queuedVideoFiles.length }">
                        <v-icon size="14">mdi-file-video</v-icon>
                        {{ queuedVideoFiles.length }} archivos
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Right: Barcode + Stock -->
                <div class="d-flex flex-column ga-4">
                  <!-- Barcode -->
                  <div class="pf-sum-card">
                    <div class="pf-sum-card-head">
                      <v-icon size="16">mdi-barcode</v-icon>
                      Código de barras
                    </div>
                    <ProductBarcodeCard
                      :value="draft?.code || ''"
                      :preview="nextCodePreview || ''"
                      :label="draft?.id ? 'REAL' : 'PREVIEW'"
                    />
                  </div>

                  <!-- Stock preview -->
                  <div class="pf-sum-card" v-if="stockPreviewList.length">
                    <div class="pf-sum-card-head">
                      <v-icon size="16" color="cyan">mdi-warehouse</v-icon>
                      Stock cargado
                    </div>
                    <div class="pf-stock-list">
                      <div v-for="r in stockPreviewList" :key="r.branch_id" class="pf-stock-item">
                        <span>{{ r.branch_name }}</span>
                        <span class="font-weight-bold">{{ r.qty }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div><!-- /pf-content -->
        </main>
      </div><!-- /pf-layout -->

      <!-- ══ FOOTER ══ -->
      <div class="pf-footer">
        <div class="pf-footer-inner">
          <!-- Left info -->
          <div class="pf-footer-info">
            <span class="pf-footer-step">Paso {{ step }}/3</span>
            <span class="pf-footer-dot">·</span>
            <span>{{ STEPS[step - 1].title }}</span>
            <span v-if="draft?.id" class="pf-footer-dot">· #{{ draft.id }}</span>
          </div>

          <!-- Buttons -->
          <div class="pf-footer-btns">
            <v-btn
              variant="tonal"
              rounded="lg"
              @click="prevStep"
              :disabled="busy || step === 1"
              class="pf-btn-nav"
            >
              <v-icon start size="16">mdi-chevron-left</v-icon>
              Anterior
            </v-btn>

            <v-btn
              v-if="step < 3"
              color="primary"
              variant="flat"
              rounded="lg"
              @click="nextStep"
              :disabled="busy"
              class="pf-btn-nav"
            >
              Siguiente
              <v-icon end size="16">mdi-chevron-right</v-icon>
            </v-btn>

            <v-btn
              v-else
              :color="isReadyToCreate ? 'success' : 'grey'"
              variant="flat"
              rounded="lg"
              @click="isEdit ? saveAll() : createAll()"
              :loading="busy"
              :disabled="busy"
              class="pf-btn-save"
            >
              <v-icon start size="16">{{ isEdit ? 'mdi-content-save' : 'mdi-plus-circle' }}</v-icon>
              {{ isEdit ? 'Guardar cambios' : 'Crear producto' }}
            </v-btn>
          </div>
        </div>
      </div>

      <!-- ══ SNACK ══ -->
      <v-snackbar v-model="snack.open" :timeout="2600" location="bottom right" rounded="lg">
        {{ snack.text }}
        <template #actions>
          <v-btn variant="text" size="small" @click="snack.open = false">OK</v-btn>
        </template>
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
            <div class="pf-validation-list">
              <div v-for="(m, i) in vModal.items" :key="i" class="pf-validation-item">
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
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import http from "../../../app/api/http";
import { useProductsStore } from "../../../app/store/products.store";
import { CategoriesService } from "../../../app/services/categories.service";

import ProductDataPanel from "./form/ProductDataPanel.vue";
import ProductStockPanel from "./panels/ProductStockPanel.vue";
import ProductImagesPanel from "./panels/ProductImagesPanel.vue";
import ProductVideosPanel from "./panels/ProductVideosPanel.vue";
import ProductBarcodeCard from "./form/ProductBarcodeCard.vue";

/* ===================== Steps ===================== */
const STEPS = [
  { value: 1, title: "Producto",    sub: "Datos, precios y estado",  icon: "mdi-package-variant" },
  { value: 2, title: "Stock & Media", sub: "Inventario e imágenes", icon: "mdi-image-multiple" },
  { value: 3, title: "Confirmar",   sub: "Resumen y guardar",        icon: "mdi-check-circle" },
];

/* ===================== Props/Emit ===================== */
const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: "create" },
  item: { type: Object, default: null },
});

const emit = defineEmits(["update:open", "saved", "cancel"]);

const products = useProductsStore();
const busy = ref(false);
const isEdit = computed(() => props.mode === "edit");

const openLocal = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const { mdAndUp, lgAndUp } = useDisplay();

/* ===================== UI state ===================== */
const step = ref(1);
const step1Touched = ref(false);
const nextCodePreview = ref(null);
const mainRef = ref(null);

// taxonomies
const categoriesList = ref([]);
const subcategoriesList = ref([]);

// stock + media queues
const stockMatrix = ref([]);
const queuedImages = ref([]);
const queuedYoutubeVideos = ref([]);
const queuedVideoFiles = ref([]);

// YouTube input
const ytUrl = ref("");
const ytError = ref("");

// toast
const snack = ref({ open: false, text: "" });
function toast(t) { snack.value = { open: true, text: String(t || "") }; }

// validation modal
const vModal = ref({ open: false, message: "", items: [] });
function showValidation(items = [], message = "") {
  vModal.value = { open: true, message: message || "", items: (Array.isArray(items) ? items : []).filter(Boolean) };
}

/* ===================== Utils ===================== */
function arr(v) { return Array.isArray(v) ? v : []; }

const imagesCount = computed(() => arr(queuedImages.value).length);
const youtubeCount = computed(() => arr(queuedYoutubeVideos.value).length);
const videoFilesCount = computed(() => arr(queuedVideoFiles.value).length);

function toInt(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  if (typeof v === "object") {
    const cand = v?.id ?? v?.value ?? v?.category_id ?? v?.subcategory_id ?? v?.rubro_id ?? v?.subrubro_id ?? v?.categoryId ?? v?.subcategoryId ?? null;
    if (cand !== null && cand !== undefined && cand !== "") {
      const n2 = parseInt(String(cand), 10);
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

function fmtNum(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(num(v)));
}

function safe(v) {
  const s = String(v ?? "").trim();
  return s ? s : "—";
}

function toBool(v, d = false) {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;
  return d;
}

function deepClone(obj) {
  try { return JSON.parse(JSON.stringify(obj || {})); }
  catch { return { ...(obj || {}) }; }
}

function fieldErr(key) {
  const map = products.lastFieldErrors || null;
  if (!map) return [];
  const v = map[key];
  return v ? [String(v)] : [];
}

/* ===================== Taxonomies ===================== */
function normalizeTaxo(raw, kind = "category") {
  return arr(raw).map((x) => {
    let id = 0;
    if (kind === "subcategory") {
      id = toInt(x?.subcategory_id, 0) || toInt(x?.subrubro_id, 0) || toInt(x?.id, 0) || toInt(x?.value, 0);
    } else {
      id = toInt(x?.category_id, 0) || toInt(x?.rubro_id, 0) || toInt(x?.id, 0) || toInt(x?.value, 0);
    }
    const name = String(x?.name ?? x?.nombre ?? x?.title ?? x?.label ?? x?.text ?? x?.category_name ?? x?.subcategory_name ?? x?.rubro ?? x?.subrubro ?? "").trim();
    const category_id = kind === "subcategory"
      ? (toInt(x?.category_id, 0) || toInt(x?.categoryId, 0) || toInt(x?.rubro_id, 0) || 0)
      : 0;
    const parent_id = toInt(x?.parent_id, 0) || null;
    return { id, name, category_id, parent_id };
  }).filter((x) => x.id > 0 && x.name);
}

async function loadCategories() {
  const data = await CategoriesService.list({ root_only: 1 });
  const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.rows) ? data.rows : [];
  return normalizeTaxo(list, "category");
}

async function loadSubcategories() {
  const { data } = await http.get("/subcategories");
  const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.rows) ? data.rows : [];
  return normalizeTaxo(list, "subcategory");
}

async function ensureTaxonomies() {
  try {
    const [cats, subs] = await Promise.all([loadCategories(), loadSubcategories()]);
    categoriesList.value = cats;
    subcategoriesList.value = subs;
    if (!cats.length) toast("⚠️ Sin rubros (API /categories vacío).");
    if (!subs.length) toast("⚠️ Sin subrubros (API /subcategories vacío).");
  } catch (e) {
    console.error("[taxo] ERROR:", e);
    toast("❌ Error cargando taxonomías");
    categoriesList.value = [];
    subcategoriesList.value = [];
  }
}

/* ===================== Draft ===================== */
function pickId(maybe) { return toInt(maybe, 0); }

function getSubcategoryIdFromDraft(d) {
  return pickId(d?.subcategory_id) || pickId(d?.subcategoryId) || pickId(d?.sub_category_id) || pickId(d?.subrubro_id) || pickId(d?.subrubroId) || pickId(d?.subcategory) || pickId(d?.subCategory) || pickId(d?.subrubro) || null;
}

function getCategoryIdFromDraft(d) {
  return pickId(d?.category_id) || pickId(d?.categoryId) || pickId(d?.rubro_id) || pickId(d?.rubroId) || pickId(d?.category) || null;
}

function setSubcategoryIdOnDraft(id) {
  const v = toInt(id, 0) || null;
  draft.value = { ...draft.value, subcategory_id: v, subcategoryId: v, sub_category_id: v, subrubro_id: v, subrubroId: v };
}

function defaultDraft() {
  return { id: null, name: "", sku: "", code: null, barcode: null, branch_id: null, description: "", category_id: null, subcategory_id: null, is_active: true, track_stock: true, brand: "", model: "", price_list: 0, price_discount: 0, price_reseller: 0 };
}

const draft = ref(defaultDraft());

/* ===================== Category/Subcategory computed v-model ===================== */
const draftCategoryId = computed({
  get: () => {
    const n = toInt(getCategoryIdFromDraft(draft.value), 0);
    return n > 0 ? n : null;
  },
  set: (val) => {
    const v = val ? toInt(val, 0) : null;
    draft.value = { ...draft.value, category_id: v, subcategory_id: null };
  },
});

const draftSubcategoryId = computed({
  get: () => {
    const n = toInt(getSubcategoryIdFromDraft(draft.value), 0);
    return n > 0 ? n : null;
  },
  set: (val) => {
    const v = val ? toInt(val, 0) : null;
    draft.value = { ...draft.value, subcategory_id: v };
  },
});

/* ===================== Taxonomy watchers ===================== */
const selectedCategoryId = computed(() => toInt(getCategoryIdFromDraft(draft.value), 0) || null);
const selectedSubcategoryId = computed(() => toInt(getSubcategoryIdFromDraft(draft.value), 0) || null);

const filteredSubcategories = computed(() => {
  const cid = toInt(selectedCategoryId.value, 0);
  if (!cid) return [];
  return arr(subcategoriesList.value).filter((x) => toInt(x?.category_id, 0) === cid);
});

function subcategoryBelongsToCategory(subId, catId) {
  const sid = toInt(subId, 0);
  const cid = toInt(catId, 0);
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
watch(selectedSubcategoryId, (sid) => {
  const cid = selectedCategoryId.value;
  if (!sid) return;
  if (!cid || !subcategoryBelongsToCategory(sid, cid)) setSubcategoryIdOnDraft(null);
});
watch(() => subcategoriesList.value, () => normalizeDraftTaxonomy(), { deep: true });

/* ===================== SKU ===================== */
const skuPreviewHint = ref("");

function getCategoryNameById(id) {
  const iid = toInt(id, 0);
  if (!iid) return "";
  const hit = arr(categoriesList.value).find((x) => toInt(x?.id, 0) === iid);
  return String(hit?.name || "").trim();
}

function getSubcategoryNameById(id) {
  const iid = toInt(id, 0);
  if (!iid) return "";
  const hit = arr(subcategoriesList.value).find((x) => toInt(x?.id, 0) === iid);
  return String(hit?.name || "").trim();
}

function lettersOnly(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, " ").trim();
}

function makeInitials(label, take = 2) {
  const clean = lettersOnly(label);
  if (!clean) return "";
  const stop = new Set(["DE", "DEL", "LA", "LAS", "EL", "LOS", "Y", "EN", "POR", "PARA"]);
  const parts = clean.split(/\s+/).map((x) => x.toUpperCase()).filter((x) => x && !stop.has(x));
  let out = "";
  for (const p of parts) { out += p[0] || ""; if (out.length >= take) break; }
  if (out.length < take) out += parts.join("").slice(out.length, take);
  return out.slice(0, take).toUpperCase();
}

function buildSku(d, forceId = null) {
  const cid = getCategoryIdFromDraft(d);
  const sid = getSubcategoryIdFromDraft(d);
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

const finalSku = computed(() => {
  const s = String(draft.value?.sku || "").trim();
  return s || skuPreview.value;
});

/* ===================== Validation ===================== */
function validateDatos() {
  const errs = [];
  if (!String(draft.value?.name || "").trim()) errs.push("Falta el nombre del producto.");
  if (!toInt(getCategoryIdFromDraft(draft.value), 0)) errs.push("Falta seleccionar el rubro.");
  if (!toInt(getSubcategoryIdFromDraft(draft.value), 0)) errs.push("Falta seleccionar el subrubro.");
  const cat = toInt(getCategoryIdFromDraft(draft.value), 0);
  const sub = toInt(getSubcategoryIdFromDraft(draft.value), 0);
  if (cat && sub && !subcategoryBelongsToCategory(sub, cat)) errs.push("El subrubro no corresponde al rubro seleccionado.");
  return errs.length ? errs : null;
}

const canGoAfterStep1 = computed(() => !validateDatos());
const isReadyToCreate = computed(() => !validateDatos());

/* ===================== Prices summary ===================== */
const priceItems = computed(() => [
  { label: "Lista",      val: num(draft.value?.price_list) },
  { label: "Descuento",  val: num(draft.value?.price_discount) },
  { label: "Revendedor", val: num(draft.value?.price_reseller) },
]);

/* ===================== Stock preview ===================== */
const stockPreviewList = computed(() =>
  arr(stockMatrix.value)
    .map((r) => ({ branch_id: toInt(r.branch_id, 0), branch_name: String(r.branch_name || "").trim(), qty: num(r.qty, 0), enabled: toBool(r.enabled, false) }))
    .filter((x) => x.branch_id > 0 && x.branch_name && Number.isFinite(x.qty) && x.qty !== 0)
);

/* ===================== Navigation ===================== */
function canGoTo(target) {
  const t = toInt(target, 1);
  if (t <= 1) return true;
  return !!canGoAfterStep1.value;
}

function goToStep(target) {
  const t = toInt(target, 1);
  if (!canGoTo(t)) return;
  step.value = Math.min(3, Math.max(1, t));
  if (mainRef.value) mainRef.value.scrollTop = 0;
}

function prevStep() {
  step.value = Math.max(1, step.value - 1);
  if (mainRef.value) mainRef.value.scrollTop = 0;
}

function nextStep() {
  if (step.value === 1) {
    step1Touched.value = true;
    const errs = validateDatos();
    if (errs) return showValidation(errs, "Completá estos campos antes de continuar:");
  }
  step.value = Math.min(3, step.value + 1);
  if (mainRef.value) mainRef.value.scrollTop = 0;
}

/* ===================== Next code ===================== */
async function reloadNextCode() {
  if (isEdit.value) return;
  const code = await products.fetchNextCode();
  nextCodePreview.value = code || null;
}

/* ===================== Hydrate ===================== */
async function hydrateDraft() {
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

  await ensureTaxonomies();

  if (isEdit.value && props.item && typeof props.item === "object") {
    draft.value = { ...defaultDraft(), ...deepClone(props.item) };
    normalizeDraftTaxonomy();
    step.value = 1;
  } else {
    draft.value = defaultDraft();
    step.value = 1;
    await reloadNextCode();
  }

  if (Array.isArray(draft.value?.stock_matrix)) stockMatrix.value = deepClone(draft.value.stock_matrix);
}

watch(() => props.open, (v) => { if (!v) return; hydrateDraft(); }, { immediate: true });
watch(() => props.item, () => { if (!props.open) return; if (isEdit.value) hydrateDraft(); }, { deep: true });

/* ===================== Cancel ===================== */
function onCancel() { emit("cancel"); openLocal.value = false; }

/* ===================== Images queue ===================== */
function onQueuedChanged(files) { queuedImages.value = arr(files); }

/* ===================== Videos queue ===================== */
function normalizeYoutubeQueue(a) {
  return arr(a).map((x) => ({ key: String(x?.key || `${Date.now()}-${Math.random()}`), url: String(x?.url || "").trim(), title: x?.title ? String(x.title).trim() : "" })).filter((x) => !!x.url);
}
function normalizeFilesQueue(a) { return arr(a).filter(Boolean); }
function parseYoutubeUrl(raw) {
  const url = String(raw || "").trim();
  if (!url) return { ok: false, url: "", reason: "Pegá una URL." };
  const low = url.toLowerCase();
  if (!low.includes("youtube.com/") && !low.includes("youtu.be/") && !low.includes("m.youtube.com/")) return { ok: false, url: "", reason: "La URL no parece de YouTube." };
  return { ok: true, url, reason: "" };
}
function addYoutubeUrl() {
  ytError.value = "";
  const p = parseYoutubeUrl(ytUrl.value);
  if (!p.ok) return (ytError.value = p.reason || "URL inválida.");
  if (normalizeYoutubeQueue(queuedYoutubeVideos.value).some((x) => x.url === p.url)) return (ytError.value = "Esa URL ya está en la cola.");
  queuedYoutubeVideos.value = normalizeYoutubeQueue([...normalizeYoutubeQueue(queuedYoutubeVideos.value), { key: `${Date.now()}-${Math.random().toString(16).slice(2)}`, url: p.url, title: "" }]);
  ytUrl.value = "";
  toast("✅ YouTube agregado a la cola");
}
function removeYoutubeAt(idx) {
  const a = normalizeYoutubeQueue(queuedYoutubeVideos.value);
  a.splice(idx, 1);
  queuedYoutubeVideos.value = a;
}
function clearVideosQueue() { queuedYoutubeVideos.value = []; queuedVideoFiles.value = []; ytUrl.value = ""; ytError.value = ""; toast("✅ Cola de videos limpia"); }
function onVideosChanged() {}

/* ===================== Commit videos ===================== */
async function commitVideos(productId) {
  const pid = toInt(productId, 0);
  if (!pid) return;
  const yq = normalizeYoutubeQueue(queuedYoutubeVideos.value);
  const fq = normalizeFilesQueue(queuedVideoFiles.value);
  for (const it of yq) {
    try { await http.post(`/admin/products/${pid}/videos/youtube`, { url: it.url, title: it?.title || null }); }
    catch (e) { toast("⚠️ Video YouTube: " + (e?.friendlyMessage || e?.message || "Falló")); }
  }
  for (const f of fq) {
    try { const fd = new FormData(); fd.append("file", f); await http.post(`/admin/products/${pid}/videos/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } }); }
    catch (e) { toast("⚠️ Video upload: " + (e?.friendlyMessage || e?.message || "Falló")); }
  }
  if (yq.length || fq.length) { queuedYoutubeVideos.value = []; queuedVideoFiles.value = []; toast("✅ Videos procesados"); }
}

/* ===================== Payload ===================== */
function buildPayload() {
  const payload = { ...draft.value, name: String(draft.value?.name || "").trim(), description: String(draft.value?.description || "").trim(), brand: String(draft.value?.brand || "").trim(), model: String(draft.value?.model || "").trim(), category_id: toInt(getCategoryIdFromDraft(draft.value), 0) || null, subcategory_id: toInt(getSubcategoryIdFromDraft(draft.value), 0) || null, price_list: num(draft.value?.price_list, 0), price_discount: num(draft.value?.price_discount, 0), price_reseller: num(draft.value?.price_reseller, 0) };
  delete payload.sku;
  if (payload.barcode === "") payload.barcode = null;
  if (payload.branch_id === "" || payload.branch_id === 0) payload.branch_id = null;
  return payload;
}

function buildBranchIdsFromStockMatrix() {
  const rows = arr(stockMatrix.value);
  const bids = [];
  for (const r of rows) {
    const bid = toInt(r.branch_id, 0);
    if (!bid) continue;
    if (toBool(r.enabled, false) || num(r.qty, 0) !== 0) bids.push(bid);
  }
  const owner = toInt(draft.value?.branch_id, 0);
  if (owner) bids.push(owner);
  return Array.from(new Set(bids));
}

/* ===================== Create ===================== */
async function createAll() {
  if (isEdit.value) return;
  step1Touched.value = true;
  const errs = validateDatos();
  if (errs) { step.value = 1; showValidation(errs, "No se puede crear el producto todavía."); return; }
  busy.value = true;
  products.error = null;
  products.lastFieldErrors = null;
  try {
    const payload = buildPayload();
    payload.branch_ids = buildBranchIdsFromStockMatrix();
    const ok = await products.create(payload);
    if (!ok) { showValidation(["Hay errores de validación del servidor."], "No se pudo crear."); return; }
    const created = products.current;
    const pid = toInt(created?.id, 0);
    if (!pid) { showValidation(["La API no devolvió un ID válido del producto."], "No se pudo crear."); return; }
    const skuReal = buildSku({ ...draft.value, ...created }, pid);
    try { await products.update(pid, { sku: skuReal }); draft.value = { ...draft.value, ...deepClone(created), sku: skuReal }; }
    catch (e) { toast("⚠️ No se pudo fijar SKU: " + (e?.friendlyMessage || e?.message || "Falló")); draft.value = { ...draft.value, ...deepClone(created) }; }
    const rows = arr(stockMatrix.value);
    for (const r of rows) {
      const bid = toInt(r.branch_id, 0);
      const wid = toInt(r.warehouse_id, 0);
      const enabled = toBool(r.enabled, false);
      const qty = num(r.qty, NaN);
      if (!Number.isFinite(qty)) continue;
      if (!enabled && qty === 0) continue;
      const ok2 = await products.initStock({ product_id: pid, branch_id: bid || null, warehouse_id: wid || null, qty });
      if (!ok2) toast("⚠️ Stock: " + (products.error || `Falló sucursal ${bid || "—"}`));
    }
    if (imagesCount.value) {
      const up = await products.uploadImages(pid, arr(queuedImages.value));
      if (!up) toast("⚠️ Imágenes: " + (products.error || "No se pudieron subir"));
      else toast("✅ Imágenes subidas");
    }
    await commitVideos(pid);
    emit("saved");
    toast("✅ Producto creado");
    openLocal.value = false;
  } finally { busy.value = false; }
}

/* ===================== Save ===================== */
async function saveAll() {
  if (!isEdit.value) return;
  const pid = toInt(draft.value?.id, 0);
  if (!pid) { showValidation(["No hay ID de producto para editar."], "No se pudo guardar."); return; }
  step1Touched.value = true;
  const errs = validateDatos();
  if (errs) { step.value = 1; showValidation(errs, "No se puede guardar todavía."); return; }
  busy.value = true;
  products.error = null;
  products.lastFieldErrors = null;
  try {
    const payload = buildPayload();
    payload.branch_ids = buildBranchIdsFromStockMatrix();
    const ok = await products.update(pid, payload);
    if (!ok) { showValidation(["Hay errores de validación del servidor."], "No se pudo guardar."); return; }
    if (!String(draft.value?.sku || "").trim()) {
      const skuReal = buildSku(draft.value, pid);
      try { await products.update(pid, { sku: skuReal }); draft.value.sku = skuReal; } catch {}
    }
    const rows = arr(stockMatrix.value);
    for (const r of rows) {
      const bid = toInt(r.branch_id, 0);
      const wid = toInt(r.warehouse_id, 0);
      const enabled = toBool(r.enabled, false);
      const desiredQty = enabled ? num(r.qty, NaN) : 0;
      if (enabled && !Number.isFinite(desiredQty)) continue;
      const cur = num(r.current_qty, NaN);
      if (Number.isFinite(cur) && desiredQty === cur) continue;
      const ok2 = await products.initStock({ product_id: pid, branch_id: bid || null, warehouse_id: wid || null, qty: desiredQty });
      if (!ok2) toast("⚠️ Stock: " + (products.error || `Falló sucursal ${bid || "—"}`));
    }
    if (imagesCount.value) {
      const up = await products.uploadImages(pid, arr(queuedImages.value));
      if (!up) toast("⚠️ Imágenes: " + (products.error || "No se pudieron subir"));
      else toast("✅ Imágenes subidas");
      queuedImages.value = [];
    }
    await commitVideos(pid);
    emit("saved");
    toast("✅ Cambios guardados");
    openLocal.value = false;
  } finally { busy.value = false; }
}
</script>

<style scoped>
/* ══════════════════════════════
   ROOT
══════════════════════════════ */
:deep(.pf-overlay) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.pf-overlay .v-overlay__content) {
  width: min(1600px, 97vw) !important;
  height: 92dvh !important;
  max-width: none !important;
  max-height: 92dvh !important;
  margin: 0 !important;
  border-radius: 20px !important;
  overflow: hidden !important;
  box-shadow: 0 24px 80px rgba(0,0,0,0.35) !important;
}

.pf-root {
  width: 100%;
  height: 92dvh;
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

/* Mobile: usar casi toda la pantalla */
@media (max-width: 599px) {
  :deep(.pf-overlay .v-overlay__content) {
    width: 100vw !important;
    height: 96dvh !important;
    max-height: 96dvh !important;
    border-radius: 16px 16px 0 0 !important;
    margin-top: auto !important;
    align-self: flex-end;
  }
  .pf-root {
    height: 96dvh;
    max-height: 96dvh;
    border-radius: 16px 16px 0 0;
  }
}

/* ══════════════════════════════
   TOP BAR
══════════════════════════════ */
.pf-topbar {
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  z-index: 10;
}

.pf-topbar-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
}

.pf-title-block {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-shrink: 0;
}

.pf-badge {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgb(var(--v-theme-primary));
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.pf-title {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
}

.pf-title-sub {
  font-size: 11px;
  opacity: 0.6;
  line-height: 1;
}

/* Steps row (desktop) */
.pf-steps-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.pf-step-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-size: 13px;
  font-weight: 400;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.pf-step-btn:hover:not(.disabled):not(.active) {
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgba(var(--v-theme-on-surface), 0.85);
}

.pf-step-btn.active {
  background: rgba(var(--v-theme-primary), 0.15);
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.pf-step-btn.done {
  color: rgb(var(--v-theme-success));
}

.pf-step-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pf-step-num {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 500;
  background: currentColor;
  color: rgb(var(--v-theme-surface));
  flex-shrink: 0;
}

.pf-step-btn.active .pf-step-num { background: rgb(var(--v-theme-primary)); color: white; }
.pf-step-btn.done .pf-step-num { background: rgb(var(--v-theme-success)); color: white; }

/* Mobile dots */
.pf-steps-mobile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.pf-step-mobile-info {
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 1;
}
.pf-step-mobile-count { font-size: 11px; opacity: 0.45; font-weight: 400; }
.pf-step-mobile-name  { font-size: 13px; font-weight: 500; }

.pf-dots-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.pf-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.2);
  transition: all 0.2s;
}
.pf-dot.active { width: 20px; background: rgb(var(--v-theme-primary)); }
.pf-dot.done { background: rgb(var(--v-theme-success)); }

.pf-close-btn { flex-shrink: 0; }

/* Progress line */
.pf-prog-wrap {
  height: 3px;
  background: rgba(var(--v-theme-on-surface), 0.08);
}
.pf-prog-bar {
  height: 100%;
  background: rgb(var(--v-theme-primary));
  transition: width 0.3s ease;
}

/* ══════════════════════════════
   LAYOUT
══════════════════════════════ */
.pf-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ══════════════════════════════
   SIDEBAR
══════════════════════════════ */
.pf-sidebar {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow-y: auto;
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.pf-sidebar-inner {
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pf-sidenav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pf-sidenav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: transparent;
  text-align: left;
  color: rgba(var(--v-theme-on-surface), 0.6);
  transition: all 0.15s ease;
  width: 100%;
}

.pf-sidenav-item:hover:not(.disabled):not(.active) {
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.pf-sidenav-item.active {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.pf-sidenav-item.done { color: rgb(var(--v-theme-success)); }
.pf-sidenav-item.disabled { opacity: 0.4; cursor: not-allowed; }

.pf-sidenav-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: currentColor;
  color: inherit;
}

.pf-sidenav-item.active .pf-sidenav-icon { background: rgb(var(--v-theme-primary)); }
.pf-sidenav-item.done .pf-sidenav-icon { background: rgb(var(--v-theme-success)); }

.pf-sidenav-title { font-size: 13px; font-weight: 400; line-height: 1.2; }
.pf-sidenav-sub { font-size: 11px; opacity: 0.7; line-height: 1.2; }

/* Sidebar quick info */
.pf-side-info {
  padding: 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.pf-side-info-label { font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; margin-bottom: 4px; }
.pf-side-info-name { font-size: 13px; font-weight: 500; line-height: 1.3; margin-bottom: 6px; word-break: break-word; }
.pf-side-info-row { display: flex; align-items: center; gap: 4px; font-size: 11px; opacity: 0.7; margin-bottom: 2px; }
.pf-side-info-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
.pf-side-chip { font-size: 10px; font-weight: 400; padding: 2px 7px; border-radius: 999px; }
.pf-side-chip.green { background: rgba(76,175,80,0.15); color: #4caf50; }
.pf-side-chip.grey { background: rgba(158,158,158,0.15); color: #9e9e9e; }
.pf-side-chip.blue { background: rgba(var(--v-theme-primary), 0.15); color: rgb(var(--v-theme-primary)); }
.pf-side-chip.amber { background: rgba(255,193,7,0.15); color: #ffc107; }

/* ══════════════════════════════
   MAIN
══════════════════════════════ */
.pf-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

.pf-content {
  max-width: 100%;
  padding: 24px 32px 120px;
}

/* ══════════════════════════════
   SECTION CARDS
══════════════════════════════ */
.pf-section {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 1.2));
  background: rgb(var(--v-theme-surface));
}

.pf-section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(var(--v-theme-surface-variant), 0.4);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.pf-section-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: var(--accent, rgb(var(--v-theme-primary)));
}

.pf-section-title { font-size: 14px; font-weight: 500; line-height: 1.2; }
.pf-section-sub { font-size: 11px; opacity: 0.6; }

.pf-reload-btn { opacity: 0.6; }
.pf-reload-btn:hover { opacity: 1; }

.pf-section-body {
  padding: 16px;
}

.pf-section-body.pa-0 { padding: 0; }

/* Price hint */
.pf-price-hint {
  font-size: 11.5px;
  opacity: 0.6;
  display: flex;
  align-items: center;
  gap: 4px;
}
.pf-price-hint code { font-family: monospace; background: rgba(var(--v-theme-on-surface),0.08); padding: 1px 4px; border-radius: 4px; }

/* Toggle cards */
.pf-toggle-row { display: flex; gap: 12px; flex-wrap: wrap; }
.pf-toggle-card {
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.pf-toggle-card:hover { border-color: rgba(var(--v-theme-primary), 0.4); }
.pf-toggle-card.on { border-color: rgba(var(--v-theme-primary), 0.35); background: rgba(var(--v-theme-primary), 0.04); }
.pf-toggle-icon { flex-shrink: 0; }
.pf-toggle-text { flex: 1; }
.pf-toggle-label { font-size: 13px; font-weight: 400; }
.pf-toggle-sub { font-size: 11px; opacity: 0.6; }

/* Alert error */
.pf-alert-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-error), 0.1);
  border: 1px solid rgba(var(--v-theme-error), 0.3);
}

/* Videos */
.pf-video-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 700px) { .pf-video-grid { grid-template-columns: 1fr; } }
.pf-video-label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 400; }
.pf-queue-list { display: flex; flex-direction: column; gap: 6px; }
.pf-queue-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(var(--v-theme-surface-variant), 0.5); }
.pf-queue-url { flex: 1; font-size: 11px; opacity: 0.8; min-width: 0; }
.pf-queue-empty { font-size: 11px; opacity: 0.5; padding: 8px 0; }

/* ══════════════════════════════
   SUMMARY (Step 3)
══════════════════════════════ */
.pf-summary-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; }
@media (max-width: 900px) { .pf-summary-grid { grid-template-columns: 1fr; } }

.pf-sum-card {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}

.pf-sum-card-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
  margin-bottom: 12px;
}

.pf-kv { display: grid; grid-template-columns: 110px 1fr; gap: 6px 10px; align-items: baseline; }
.pf-kv .k { font-size: 11px; opacity: 0.55; }
.pf-kv .v { font-size: 13px; font-weight: 400; word-break: break-word; }
.pf-mono { font-family: monospace; font-size: 12px; }

.pf-sum-desc {
  margin-top: 10px;
  font-size: 12px;
  opacity: 0.7;
  padding: 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  white-space: pre-wrap;
  max-height: 100px;
  overflow-y: auto;
}

.pf-price-row-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.pf-price-item { text-align: center; }
.pf-price-label { font-size: 10px; opacity: 0.55; margin-bottom: 2px; }
.pf-price-val { font-size: 15px; font-weight: 500; color: rgb(var(--v-theme-success)); }
.pf-price-val.muted { color: rgba(var(--v-theme-on-surface), 0.35); font-size: 13px; }

.pf-media-badges { display: flex; flex-wrap: wrap; gap: 8px; }
.pf-media-badge { display: flex; align-items: center; gap: 4px; font-size: 11px; padding: 4px 10px; border-radius: 999px; background: rgba(var(--v-theme-surface-variant), 0.6); opacity: 0.5; }
.pf-media-badge.active { opacity: 1; background: rgba(var(--v-theme-primary), 0.12); color: rgb(var(--v-theme-primary)); }

.pf-stock-list { display: flex; flex-direction: column; gap: 4px; }
.pf-stock-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-radius: 8px; background: rgba(var(--v-theme-surface-variant), 0.5); font-size: 12px; }

/* ══════════════════════════════
   FOOTER
══════════════════════════════ */
.pf-footer {
  flex-shrink: 0;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(10px);
}

.pf-footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  flex-wrap: wrap;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
}

.pf-footer-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.6;
  flex-wrap: wrap;
}
.pf-footer-step { font-weight: 500; }
.pf-footer-dot { opacity: 0.4; }

.pf-footer-btns { display: flex; gap: 8px; flex-wrap: wrap; }

.pf-btn-nav { min-width: 110px; }
.pf-btn-save { min-width: 160px; font-weight: 500; }

/* ══════════════════════════════
   VALIDATION MODAL
══════════════════════════════ */
.pf-validation-list { display: flex; flex-direction: column; gap: 8px; }
.pf-validation-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }

/* ══════════════════════════════
   VUETIFY FIELD OVERRIDES
══════════════════════════════ */
.pf-section :deep(.v-field) {
  border-radius: 10px;
}

.pf-section :deep(.v-card),
.pf-section :deep(.v-sheet),
.pf-section :deep(.v-alert),
.pf-section :deep(.v-table),
.pf-section :deep(.v-list) {
  background: rgb(var(--v-theme-surface)) !important;
}

/* ══════════════════════════════
   TABLET (600-959px)
══════════════════════════════ */
@media (max-width: 959px) {
  .pf-content { padding: 20px 20px 110px; }
  .pf-summary-grid { grid-template-columns: 1fr; }
}

/* ══════════════════════════════
   MOBILE (< 600px)
══════════════════════════════ */
@media (max-width: 599px) {
  .pf-content { padding: 12px 12px 96px; }
  .pf-topbar-inner { padding: 10px 12px; gap: 8px; }
  .pf-title { font-size: 14px; }
  .pf-section-head { padding: 12px 14px; gap: 10px; }
  .pf-section-body { padding: 12px; }
  .pf-section-icon { width: 26px; height: 26px; border-radius: 7px; }
  .pf-section-title { font-size: 13px; }
  .pf-kv { grid-template-columns: 80px 1fr; }
  .pf-price-row-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
  .pf-footer-inner { flex-direction: column; align-items: stretch; gap: 8px; }
  .pf-footer-btns { gap: 8px; }
  .pf-btn-nav, .pf-btn-save { flex: 1; min-width: 0; }
  .pf-toggle-row { flex-direction: column; gap: 8px; }
  .pf-toggle-card { padding: 12px; min-width: 0; }
  .pf-video-grid { grid-template-columns: 1fr; gap: 12px; }
  .pf-sidenav-item { padding: 8px 10px; }
}
</style>
