<!-- src/modules/products/pages/ProductFormPage.vue -->
<template>
  <div class="pfp-root">

    <!-- ══ TOP BAR ══ -->
    <div class="pfp-topbar">
      <div class="pfp-topbar-inner">

        <!-- Back + Title -->
        <div class="pfp-title-block">
          <AppBackButton
            label="Productos"
            :to="{ name: 'products' }"
            :disabled="busy"
            emit-only
            @back="onCancel"
          />
          <div class="pfp-badge">
            <v-icon size="16" color="white">{{ isEdit ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
          </div>
          <div>
            <div class="pfp-title">{{ isEdit ? 'Editar producto' : 'Nuevo producto' }}</div>
            <div class="pfp-title-sub" v-if="draft?.id">#{{ draft.id }}</div>
            <div class="pfp-title-sub" v-else>Productos / Nuevo</div>
          </div>
        </div>

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

        <!-- Loading indicator -->
        <v-progress-circular v-if="busy" indeterminate size="20" width="2" color="primary" class="mr-2" />
      </div>

      <!-- Progress bar -->
      <div class="pfp-prog-wrap">
        <div class="pfp-prog-bar" :style="{ width: `${(step / 3) * 100}%` }" />
      </div>
    </div>

    <!-- ══ LAYOUT ══ -->
    <div class="pfp-layout">

      <!-- SIDEBAR (large screens) -->
      <aside class="pfp-sidebar" v-if="lgAndUp">
        <div class="pfp-sidebar-inner">
          <nav class="pfp-sidenav">
            <button
              v-for="s in STEPS"
              :key="s.value"
              class="pfp-sidenav-item"
              :class="{ active: step === s.value, done: step > s.value, disabled: !canGoTo(s.value) }"
              :disabled="!canGoTo(s.value)"
              @click="goToStep(s.value)"
              type="button"
            >
              <span class="pfp-sidenav-icon">
                <v-icon v-if="step > s.value" size="14" color="white">mdi-check</v-icon>
                <v-icon v-else size="14" :color="step === s.value ? 'white' : 'inherit'">{{ s.icon }}</v-icon>
              </span>
              <div class="pfp-sidenav-text">
                <div class="pfp-sidenav-title">{{ s.title }}</div>
                <div class="pfp-sidenav-sub">{{ s.sub }}</div>
              </div>
            </button>
          </nav>

          <!-- Quick info -->
          <div class="pfp-side-info" v-if="draft?.name">
            <div class="pfp-side-info-label">Producto</div>
            <div class="pfp-side-info-name">{{ draft.name }}</div>
            <div class="pfp-side-info-row" v-if="getCategoryNameById(getCategoryIdFromDraft(draft))">
              <v-icon size="12">mdi-tag-outline</v-icon>
              {{ getCategoryNameById(getCategoryIdFromDraft(draft)) }}
            </div>
            <div class="pfp-side-info-row" v-if="skuPreview">
              <v-icon size="12">mdi-barcode</v-icon>
              {{ skuPreview }}
            </div>
            <div class="pfp-side-info-chips">
              <span class="pfp-side-chip" :class="draft.is_active ? 'green' : 'grey'">
                {{ draft.is_active ? 'Activo' : 'Inactivo' }}
              </span>
              <span class="pfp-side-chip blue" v-if="queuedImages.length">
                {{ queuedImages.length }} imgs
              </span>
              <span class="pfp-side-chip amber" v-if="stockPreviewList.length">
                Stock ✓
              </span>
            </div>
          </div>
        </div>
      </aside>

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

              <div class="pfp-summary-grid">
                <div class="d-flex flex-column ga-4">
                  <div class="pfp-sum-card">
                    <div class="pfp-sum-card-head"><v-icon size="16" color="primary">mdi-package-variant</v-icon> Producto</div>
                    <div class="pfp-kv">
                      <span class="k">Nombre</span><span class="v">{{ safe(draft.name) }}</span>
                      <span class="k">SKU</span><span class="v pfp-mono">{{ safe(finalSku) }}</span>
                      <span class="k">Código</span><span class="v pfp-mono">{{ safe(draft.code || nextCodePreview) }}</span>
                      <span class="k">Rubro</span><span class="v">{{ safe(getCategoryNameById(getCategoryIdFromDraft(draft))) }}</span>
                      <span class="k">Subrubro</span><span class="v">{{ safe(getSubcategoryNameById(getSubcategoryIdFromDraft(draft))) }}</span>
                      <span class="k">Marca</span><span class="v">{{ safe(draft.brand) }}</span>
                      <span class="k">Estado</span>
                      <span class="v"><v-chip :color="draft.is_active ? 'success' : 'warning'" size="x-small" variant="tonal">{{ draft.is_active ? 'Activo' : 'Inactivo' }}</v-chip></span>
                    </div>
                    <div class="pfp-sum-desc" v-if="draft.description">{{ draft.description }}</div>
                  </div>
                  <div class="pfp-sum-card">
                    <div class="pfp-sum-card-head"><v-icon size="16" color="success">mdi-cash-multiple</v-icon> Precios</div>
                    <div class="pfp-price-row-grid">
                      <div class="pfp-price-item" v-for="p in priceItems" :key="p.label">
                        <div class="pfp-price-label">{{ p.label }}</div>
                        <div class="pfp-price-val" :class="{ muted: !p.val }">{{ p.val ? `$ ${fmtNum(p.val)}` : '—' }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="pfp-sum-card">
                    <div class="pfp-sum-card-head"><v-icon size="16" color="pink">mdi-image-multiple</v-icon> Media en cola</div>
                    <div class="pfp-media-badges">
                      <span class="pfp-media-badge" :class="{ active: queuedImages.length }"><v-icon size="14">mdi-image</v-icon> {{ queuedImages.length }} imágenes</span>
                      <span class="pfp-media-badge" :class="{ active: queuedYoutubeVideos.length }"><v-icon size="14">mdi-youtube</v-icon> {{ queuedYoutubeVideos.length }} YouTube</span>
                      <span class="pfp-media-badge" :class="{ active: queuedVideoFiles.length }"><v-icon size="14">mdi-file-video</v-icon> {{ queuedVideoFiles.length }} archivos</span>
                    </div>
                  </div>
                </div>
                <div class="d-flex flex-column ga-4">
                  <div class="pfp-sum-card">
                    <div class="pfp-sum-card-head"><v-icon size="16">mdi-barcode</v-icon> Código de barras</div>
                    <ProductBarcodeCard :value="draft?.code || ''" :preview="nextCodePreview || ''" :label="draft?.id ? 'REAL' : 'PREVIEW'" />
                  </div>
                  <div class="pfp-sum-card" v-if="stockPreviewList.length">
                    <div class="pfp-sum-card-head"><v-icon size="16" color="cyan">mdi-warehouse</v-icon> Stock cargado</div>
                    <div class="pfp-stock-list">
                      <div v-for="r in stockPreviewList" :key="r.branch_id" class="pfp-stock-item">
                        <span>{{ r.branch_name }}</span>
                        <span class="font-weight-bold">{{ r.qty }}</span>
                      </div>
                    </div>
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
import AppBackButton from "@/app/components/AppBackButton.vue";

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
function defaultDraft() {
  return { id: null, name: "", sku: "", code: null, barcode: null, branch_id: null, description: "",
    category_id: null, subcategory_id: null, is_active: true, track_stock: true,
    brand: "", model: "", price_list: 0, price_discount: 0, price_reseller: 0 };
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

const stockPreviewList = computed(() =>
  arr(stockMatrix.value)
    .map((r) => ({ branch_id: toInt(r.branch_id, 0), branch_name: String(r.branch_name || "").trim(), qty: num(r.qty, 0), enabled: toBool(r.enabled, false) }))
    .filter((x) => x.branch_id > 0 && x.branch_name && Number.isFinite(x.qty) && x.qty !== 0)
);

const imagesCount = computed(() => arr(queuedImages.value).length);

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
.pfp-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
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
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
}
.pfp-back-btn { margin-left: -6px; }

.pfp-title-block {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  min-width: 0;
}
.pfp-badge {
  width: 30px; height: 30px; border-radius: 8px;
  background: rgb(var(--v-theme-primary));
  display: grid; place-items: center; flex-shrink: 0;
}
.pfp-title      { font-size: 15px; font-weight: 800; line-height: 1.2; }
.pfp-title-sub  { font-size: 11px; opacity: 0.5; line-height: 1; }

/* Steps row */
.pfp-steps-row {
  display: flex; align-items: center; gap: 4px;
  flex: 1; justify-content: center; flex-wrap: wrap;
}
.pfp-step-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 14px; border-radius: 999px; border: none;
  background: transparent; cursor: pointer;
  color: inherit; opacity: 0.45;
  transition: all 0.15s;
}
.pfp-step-btn:hover:not(:disabled) { opacity: 0.75; background: rgba(var(--v-theme-on-surface), 0.06); }
.pfp-step-btn.active   { opacity: 1; font-weight: 700; color: rgb(var(--v-theme-primary)); }
.pfp-step-btn.done     { opacity: 0.8; }
.pfp-step-btn.disabled { cursor: not-allowed; opacity: 0.3; }
.pfp-step-num {
  width: 22px; height: 22px; border-radius: 999px; display: grid; place-items: center;
  font-size: 11px; font-weight: 800; flex-shrink: 0;
  background: rgba(var(--v-theme-on-surface), 0.12);
  transition: background 0.15s;
}
.pfp-step-btn.active .pfp-step-num { background: rgb(var(--v-theme-primary)); color: #fff; }
.pfp-step-btn.done   .pfp-step-num { background: rgb(var(--v-theme-success));  color: #fff; }
.pfp-step-label { font-size: 13px; }

/* Mobile steps */
.pfp-steps-mobile { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }
.pfp-step-mobile-info { display: flex; align-items: center; gap: 5px; }
.pfp-step-mobile-count { font-size: 11px; opacity: 0.4; font-weight: 600; }
.pfp-step-mobile-name  { font-size: 13px; font-weight: 800; }
.pfp-dots-row { display: flex; align-items: center; gap: 5px; }
.pfp-dot { width: 7px; height: 7px; border-radius: 999px; background: rgba(var(--v-theme-on-surface), 0.2); transition: all 0.2s; }
.pfp-dot.active { width: 20px; background: rgb(var(--v-theme-primary)); }
.pfp-dot.done   { background: rgb(var(--v-theme-success)); }

/* Progress bar */
.pfp-prog-wrap { height: 3px; background: rgba(var(--v-theme-on-surface), 0.08); }
.pfp-prog-bar  { height: 100%; background: rgb(var(--v-theme-primary)); transition: width 0.3s ease; }

/* ══ LAYOUT ══ */
.pfp-layout { flex: 1; display: flex; overflow: hidden; min-height: 0; }

/* ══ SIDEBAR ══ */
.pfp-sidebar {
  width: 220px; flex-shrink: 0;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow-y: auto; overflow-x: hidden;
  background: rgba(var(--v-theme-surface-variant), 0.25);
  scrollbar-width: none;
}
.pfp-sidebar::-webkit-scrollbar { display: none; }
.pfp-sidebar-inner { padding: 14px 10px; display: flex; flex-direction: column; gap: 20px; }

.pfp-sidenav { display: flex; flex-direction: column; gap: 4px; }
.pfp-sidenav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 10px; border: none;
  background: transparent; cursor: pointer; color: inherit; width: 100%;
  text-align: left; transition: background 0.15s; opacity: 0.55;
}
.pfp-sidenav-item:hover:not(:disabled) { background: rgba(var(--v-theme-on-surface), 0.06); opacity: 0.85; }
.pfp-sidenav-item.active  { background: rgba(var(--v-theme-primary), 0.15); opacity: 1; }
.pfp-sidenav-item.done    { opacity: 0.8; }
.pfp-sidenav-item.disabled{ cursor: not-allowed; opacity: 0.3; }
.pfp-sidenav-icon {
  width: 26px; height: 26px; border-radius: 7px; display: grid; place-items: center; flex-shrink: 0;
  background: rgba(var(--v-theme-on-surface), 0.1);
}
.pfp-sidenav-item.active .pfp-sidenav-icon { background: rgb(var(--v-theme-primary)); }
.pfp-sidenav-item.done   .pfp-sidenav-icon { background: rgb(var(--v-theme-success));  }
.pfp-sidenav-title { font-size: 13px; font-weight: 700; line-height: 1.2; }
.pfp-sidenav-sub   { font-size: 11px; opacity: 0.6; line-height: 1.2; }

.pfp-side-info {
  padding: 10px; border-radius: 10px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.pfp-side-info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.45; margin-bottom: 4px; }
.pfp-side-info-name  { font-size: 12px; font-weight: 800; line-height: 1.3; margin-bottom: 5px; word-break: break-word; }
.pfp-side-info-row   { display: flex; align-items: center; gap: 4px; font-size: 11px; opacity: 0.65; margin-bottom: 2px; }
.pfp-side-info-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 7px; }
.pfp-side-chip       { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; background: rgba(var(--v-theme-on-surface), 0.12); }
.pfp-side-chip.green { background: rgba(var(--v-theme-success), 0.15); color: rgb(var(--v-theme-success)); }
.pfp-side-chip.grey  { background: rgba(var(--v-theme-on-surface), 0.08); }
.pfp-side-chip.blue  { background: rgba(var(--v-theme-primary), 0.15); color: rgb(var(--v-theme-primary)); }
.pfp-side-chip.amber { background: rgba(255,193,7, 0.15); color: #f59e0b; }

/* ══ MAIN ══ */
.pfp-main {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
}
.pfp-main::-webkit-scrollbar { display: none; }

.pfp-content { padding: 18px 24px 24px; }

.pfp-init-loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 20px;
}

/* ══ STEP 1 — 2-col grid on lg ══ */
.pfp-step1-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 860px) { .pfp-step1-grid { grid-template-columns: 1fr; } }

/* ══ STEP 2 — 2-col: stock + images, videos full width ══ */
.pfp-step2-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.pfp-step2-videos { grid-column: 1 / -1; }
@media (max-width: 780px) { .pfp-step2-grid { grid-template-columns: 1fr; } .pfp-step2-videos { grid-column: auto; } }

/* ══ SECTION CARDS ══ */
.pfp-section {
  border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 1.2));
  background: rgb(var(--v-theme-surface));
}
.pfp-section-head {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px;
  background: rgba(var(--v-theme-surface-variant), 0.35);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.pfp-section-icon { width: 26px; height: 26px; border-radius: 7px; display: grid; place-items: center; flex-shrink: 0; background: var(--accent, rgb(var(--v-theme-primary))); }
.pfp-section-title { font-size: 13px; font-weight: 800; line-height: 1.2; }
.pfp-section-sub   { font-size: 11px; opacity: 0.55; }
.pfp-section-body  { padding: 10px 12px; }
.pfp-section-body.pa-0 { padding: 0; }
.pfp-section :deep(.v-field) { border-radius: 9px; }

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
.pfp-toggle-label { font-size: 13px; font-weight: 700; }
.pfp-toggle-sub   { font-size: 11px; opacity: 0.6; }

/* ══ VIDEOS ══ */
.pfp-video-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.pfp-video-label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; }
.pfp-queue-list  { display: flex; flex-direction: column; gap: 5px; }
.pfp-queue-item  { display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-radius: 7px; background: rgba(var(--v-theme-surface-variant), 0.5); }
.pfp-queue-url   { flex: 1; font-size: 11px; opacity: 0.8; min-width: 0; }
.pfp-queue-empty { font-size: 11px; opacity: 0.45; padding: 6px 0; }
@media (max-width: 700px) { .pfp-video-grid { grid-template-columns: 1fr; } }

/* ══ SUMMARY ══ */
.pfp-summary-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; }
@media (max-width: 860px) { .pfp-summary-grid { grid-template-columns: 1fr; } }

.pfp-sum-card { padding: 13px 14px; border-radius: 12px; border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); background: rgb(var(--v-theme-surface)); }
.pfp-sum-card-head { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.65; margin-bottom: 10px; }
.pfp-kv { display: grid; grid-template-columns: 100px 1fr; gap: 5px 10px; align-items: baseline; }
.pfp-kv .k { font-size: 11px; opacity: 0.5; }
.pfp-kv .v { font-size: 13px; font-weight: 700; word-break: break-word; }
.pfp-mono { font-family: monospace; font-size: 12px; }
.pfp-sum-desc { margin-top: 9px; font-size: 12px; opacity: 0.7; padding: 9px; border-radius: 7px; background: rgba(var(--v-theme-surface-variant), 0.5); white-space: pre-wrap; max-height: 90px; overflow-y: auto; }
.pfp-price-row-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
.pfp-price-item { text-align: center; }
.pfp-price-label { font-size: 10px; opacity: 0.5; margin-bottom: 2px; }
.pfp-price-val  { font-size: 15px; font-weight: 900; color: rgb(var(--v-theme-success)); }
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
.pfp-footer-step  { font-weight: 800; }
.pfp-footer-dot   { opacity: 0.4; }
.pfp-footer-btns  { display: flex; gap: 8px; }
.pfp-btn-nav  { min-width: 110px; }
.pfp-btn-save { min-width: 160px; font-weight: 800; }

/* ══ VALIDATION ══ */
.pfp-validation-list { display: flex; flex-direction: column; gap: 8px; }
.pfp-validation-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }

/* ══ TABLET ══ */
@media (max-width: 959px) {
  .pfp-content { padding: 14px 16px 20px; }
  .pfp-summary-grid { grid-template-columns: 1fr; }
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
  .pfp-footer-inner { flex-direction: column; align-items: stretch; gap: 8px; padding: 8px 14px; }
  .pfp-footer-btns  { gap: 8px; }
  .pfp-btn-nav, .pfp-btn-save { flex: 1; min-width: 0; }
  .pfp-price-row-grid { grid-template-columns: 1fr 1fr; }
  .pfp-kv { grid-template-columns: 80px 1fr; }
}

/* ══ LAPTOP / NOTEBOOK HEIGHT (≤ 820px viewport height) ══ */
@media (max-height: 820px) {
  .pfp-content       { padding: 12px 20px 16px; }
  .pfp-step1-grid    { gap: 10px; }
  .pfp-step2-grid    { gap: 10px; }
  .pfp-section-head  { padding: 7px 11px; }
  .pfp-section-body  { padding: 8px 11px; }
  .pfp-topbar-inner  { padding: 7px 14px; }
}

/* ══ VERY SHORT SCREENS (≤ 700px height, phones landscape) ══ */
@media (max-height: 700px) {
  .pfp-content      { padding: 8px 14px 12px; }
  .pfp-section-head { padding: 6px 10px; }
  .pfp-section-body { padding: 7px 10px; }
  .pfp-step1-grid   { gap: 8px; }
  .pfp-footer-inner { padding: 7px 14px; }
}
</style>
