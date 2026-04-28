<!-- src/modules/products/pages/ProductsListPage.vue -->

<template>
  <div class="lp">

    <!-- ── HEADER ───────────────────────────────────────── -->
    <header class="lp-header">
      <div class="lp-header__left">
        <h1 class="lp-title">Productos</h1>
        <div class="lp-meta">
          <span class="lp-meta__strong">{{ meta.total.toLocaleString('es') }}</span>
          <span class="lp-meta__sep">·</span>
          <span>Página {{ meta.page }} de {{ meta.pages || 1 }}</span>
        </div>
      </div>
      <div class="lp-header__right">
        <v-btn-toggle
          v-if="smAndUp"
          v-model="viewMode"
          mandatory
          density="compact"
          rounded="lg"
          class="lp-view-toggle"
        >
          <v-btn value="grid" size="small" title="Vista en tarjetas">
            <v-icon size="18">mdi-view-grid-outline</v-icon>
          </v-btn>
          <v-btn value="list" size="small" title="Vista en lista">
            <v-icon size="18">mdi-format-list-bulleted</v-icon>
          </v-btn>
        </v-btn-toggle>

        <!-- Acción masiva sobre promociones -->
        <v-menu offset-y>
          <template #activator="{ props: btnProps }">
            <v-btn
              v-bind="btnProps"
              variant="tonal"
              rounded="lg"
              size="small"
              prepend-icon="mdi-tag-heart-outline"
              append-icon="mdi-menu-down"
              class="lp-cta"
              :loading="bulkPromoBusy"
              :disabled="bulkPromoBusy"
            >
              Promos
            </v-btn>
          </template>
          <v-list density="compact" class="lp-promo-menu">
            <v-list-item
              prepend-icon="mdi-pause-circle-outline"
              title="Pausar todas las promos"
              subtitle="Apaga is_promo en todos los productos activos"
              @click="onPauseAllPromos"
            />
            <v-list-item
              prepend-icon="mdi-play-circle-outline"
              title="Reactivar promos configuradas"
              subtitle="Solo los que tienen precio o reglas configuradas"
              @click="onResumeAllPromos"
            />
          </v-list>
        </v-menu>

        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          rounded="lg"
          size="small"
          class="lp-cta"
          @click="openCreate"
        >
          Nuevo
        </v-btn>
      </div>
    </header>

    <!-- Confirmación de acción masiva sobre promos -->
    <v-dialog v-model="bulkPromoDialog.open" max-width="440" persistent>
      <v-card rounded="xl" class="pa-2">
        <v-card-title class="d-flex align-center ga-2 pt-4 px-4">
          <v-icon :color="bulkPromoDialog.action === 'pause' ? 'warning' : 'success'">
            {{ bulkPromoDialog.action === 'pause' ? 'mdi-pause-circle' : 'mdi-play-circle' }}
          </v-icon>
          <span class="font-weight-black">{{ bulkPromoDialog.title }}</span>
        </v-card-title>
        <v-card-text class="px-4 pb-2 text-body-2">
          {{ bulkPromoDialog.message }}
          <div v-if="bulkPromoDialog.action === 'pause'" class="mt-2 text-caption text-medium-emphasis">
            Esto NO borra los datos de configuración (precio, fechas, reglas). Solo apaga el flag.
            Podés volver a activar después con "Reactivar promos configuradas".
          </div>
        </v-card-text>
        <v-card-actions class="justify-end px-4 pb-4">
          <v-btn variant="text" @click="bulkPromoDialog.open = false">Cancelar</v-btn>
          <v-btn
            :color="bulkPromoDialog.action === 'pause' ? 'warning' : 'success'"
            variant="flat"
            rounded="lg"
            :loading="bulkPromoBusy"
            @click="confirmBulkPromo"
          >
            {{ bulkPromoDialog.action === 'pause' ? 'Sí, pausar' : 'Sí, reactivar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── STATS KPI ────────────────────────────────────── -->
    <section class="lp-stats">
      <div class="lp-kpi">
        <div class="lp-kpi__badge lp-kpi__badge--primary">
          <v-icon size="16" color="white">mdi-package-variant-closed</v-icon>
        </div>
        <div class="lp-kpi__body">
          <div class="lp-kpi__lbl">Total</div>
          <div v-if="!statsLoading" class="lp-kpi__val">{{ stats.ready ? fmtInt(stats.total) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
          <div class="lp-kpi__sub">Productos en filtro actual</div>
        </div>
      </div>

      <div class="lp-kpi">
        <div class="lp-kpi__badge lp-kpi__badge--green">
          <v-icon size="16" color="white">mdi-check-circle-outline</v-icon>
        </div>
        <div class="lp-kpi__body">
          <div class="lp-kpi__lbl">Activos</div>
          <div v-if="!statsLoading" class="lp-kpi__val">{{ stats.ready ? fmtInt(stats.active) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
          <div class="lp-kpi__sub">{{ stats.ready ? `${pct(stats.active, stats.total)} del total` : '' }}</div>
        </div>
      </div>

      <div class="lp-kpi">
        <div class="lp-kpi__badge lp-kpi__badge--orange">
          <v-icon size="16" color="white">mdi-alert-circle-outline</v-icon>
        </div>
        <div class="lp-kpi__body">
          <div class="lp-kpi__lbl">Sin stock</div>
          <div v-if="!statsLoading" class="lp-kpi__val">{{ stats.ready ? fmtInt(stats.without_stock) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
          <div class="lp-kpi__sub">{{ stats.ready ? `${pct(stats.without_stock, stats.total)} del total` : '' }}</div>
        </div>
      </div>

      <div class="lp-kpi">
        <div class="lp-kpi__badge lp-kpi__badge--indigo">
          <v-icon size="16" color="white">mdi-currency-usd-off</v-icon>
        </div>
        <div class="lp-kpi__body">
          <div class="lp-kpi__lbl">Sin precio</div>
          <div v-if="!statsLoading" class="lp-kpi__val">{{ stats.ready ? fmtInt(stats.without_price) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
          <div class="lp-kpi__sub">{{ stats.ready ? `${pct(stats.without_price, stats.total)} del total` : '' }}</div>
        </div>
      </div>
    </section>

    <!-- ── METHOD-LIKE CARDS (cobertura) ────────────────── -->
    <section class="lp-methods">
      <div class="lp-mc">
        <div class="lp-mc__badge lp-mc__badge--cash"><v-icon size="14" color="white">mdi-package-variant</v-icon></div>
        <div class="lp-mc__body">
          <div class="lp-mc__lbl">Con stock</div>
          <div v-if="!statsLoading" class="lp-mc__val">{{ stats.ready ? fmtInt(stats.with_stock) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
        </div>
      </div>
      <div class="lp-mc">
        <div class="lp-mc__badge lp-mc__badge--card"><v-icon size="14" color="white">mdi-cash-multiple</v-icon></div>
        <div class="lp-mc__body">
          <div class="lp-mc__lbl">Con precio</div>
          <div v-if="!statsLoading" class="lp-mc__val">{{ stats.ready ? fmtInt(stats.with_price) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
        </div>
      </div>
      <div class="lp-mc">
        <div class="lp-mc__badge lp-mc__badge--mp"><v-icon size="14" color="white">mdi-image-multiple-outline</v-icon></div>
        <div class="lp-mc__body">
          <div class="lp-mc__lbl">Con imágenes</div>
          <div v-if="!statsLoading" class="lp-mc__val">{{ stats.ready ? fmtInt(stats.with_images) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
        </div>
      </div>
      <div class="lp-mc">
        <div class="lp-mc__badge lp-mc__badge--transfer"><v-icon size="14" color="white">mdi-image-off-outline</v-icon></div>
        <div class="lp-mc__body">
          <div class="lp-mc__lbl">Sin imágenes</div>
          <div v-if="!statsLoading" class="lp-mc__val">{{ stats.ready ? fmtInt(stats.without_images) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
        </div>
      </div>
      <button
        type="button"
        class="lp-mc lp-mc--clickable"
        :class="{ 'is-active': f.promo === 'active' }"
        title="Filtrar por promociones vigentes"
        @click="onPromoActiveKpiClick"
      >
        <div class="lp-mc__badge lp-mc__badge--promo"><v-icon size="14" color="white">mdi-tag-heart</v-icon></div>
        <div class="lp-mc__body">
          <div class="lp-mc__lbl">Promos activas</div>
          <div v-if="!statsLoading" class="lp-mc__val">{{ stats.ready ? fmtInt(stats.promo_active) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
        </div>
      </button>
    </section>

    <!-- ── FILTER BAR ───────────────────────────────────── -->
    <section class="lp-filters">
      <!-- Fila primaria: search + status + toggle más filtros -->
      <div class="lp-filters__primary">
        <v-text-field
          v-model="f.q"
          placeholder="Buscar por nombre, SKU, marca, modelo..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="lp-filters__search"
          @input="debouncedSearch"
          @click:clear="clearSearch"
          @keyup.enter="applyFilters"
        />
        <v-select
          v-model="f.status"
          :items="statusItems"
          item-title="title"
          item-value="value"
          label="Estado"
          variant="outlined"
          density="compact"
          hide-details
          class="lp-filters__primary-field"
          @update:modelValue="applyFilters"
        />
        <button
          type="button"
          class="lp-filters__more"
          :class="{ 'lp-filters__more--open': advancedOpen }"
          @click="toggleAdvanced"
        >
          <v-icon size="15">mdi-tune-variant</v-icon>
          <span>Más filtros</span>
          <span v-if="activeAdvancedCount > 0" class="lp-filters__more-count">{{ activeAdvancedCount }}</span>
          <v-icon size="14" class="lp-filters__more-chev">mdi-chevron-down</v-icon>
        </button>
      </div>

      <!-- Filtros avanzados colapsables -->
      <v-expand-transition>
        <div v-show="advancedOpen" class="lp-filters__advanced">
          <div class="lp-filters__grid">
            <div v-if="isAdmin" class="lp-filters__cell">
              <v-select
                v-model="f.branch_id"
                :items="branchItems"
                item-title="title"
                item-value="value"
                label="Sucursal"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                @update:modelValue="applyFilters"
              />
            </div>
            <div class="lp-filters__cell">
              <v-select
                v-model="f.category_id"
                :items="categoryItems"
                item-title="title"
                item-value="value"
                label="Rubro"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                @update:modelValue="onCategoryChange"
              />
            </div>
            <div class="lp-filters__cell">
              <v-select
                v-model="f.subcategory_id"
                :items="subcategoryItems"
                item-title="title"
                item-value="value"
                label="Subrubro"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                :disabled="!f.category_id"
                @update:modelValue="applyFilters"
              />
            </div>
            <div class="lp-filters__cell">
              <v-select
                v-model="f.stock"
                :items="stockItems"
                item-title="title"
                item-value="value"
                label="Stock"
                variant="outlined"
                density="compact"
                hide-details
                @update:modelValue="applyFilters"
              />
            </div>
            <div class="lp-filters__cell">
              <v-select
                v-model="f.price_presence"
                :items="pricePresenceItems"
                item-title="title"
                item-value="value"
                label="Precio"
                variant="outlined"
                density="compact"
                hide-details
                @update:modelValue="applyFilters"
              />
            </div>
            <div class="lp-filters__cell">
              <v-select
                v-model="f.images"
                :items="imagesItems"
                item-title="title"
                item-value="value"
                label="Imágenes"
                variant="outlined"
                density="compact"
                hide-details
                @update:modelValue="applyFilters"
              />
            </div>
            <div class="lp-filters__cell">
              <v-select
                v-model="f.promo"
                :items="promoItems"
                item-title="title"
                item-value="value"
                label="Promoción"
                prepend-inner-icon="mdi-tag-heart"
                variant="outlined"
                density="compact"
                hide-details
                @update:modelValue="applyFilters"
              />
            </div>
            <div class="lp-filters__cell lp-filters__cell--range">
              <v-text-field
                v-model="f.price_min"
                label="Mín $"
                type="number"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                @keyup.enter="applyFilters"
                @blur="applyFilters"
              />
              <span class="lp-filters__range-sep">—</span>
              <v-text-field
                v-model="f.price_max"
                label="Máx $"
                type="number"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                @keyup.enter="applyFilters"
                @blur="applyFilters"
              />
            </div>
            <div class="lp-filters__cell lp-filters__cell--per-page">
              <v-select
                v-model="limit"
                :items="[12, 24, 48, 96]"
                label="Por página"
                variant="outlined"
                density="compact"
                hide-details
                @update:modelValue="onLimitChange"
              />
            </div>
          </div>
        </div>
      </v-expand-transition>

      <!-- Chips activos -->
      <div v-if="activeFilterChips.length" class="lp-filters__chips">
        <v-chip
          v-for="chip in activeFilterChips"
          :key="chip.key"
          size="small"
          variant="tonal"
          color="primary"
          closable
          class="lp-filters__chip"
          @click:close="removeFilter(chip.key)"
        >
          {{ chip.label }}
        </v-chip>
        <button
          v-if="activeFilterChips.length > 1"
          type="button"
          class="lp-filters__chips-clear"
          @click="clearFilters"
        >
          Limpiar todo
        </button>
      </div>
    </section>

    <!-- ── BULK ACTION BAR ──────────────────────────────── -->
    <div v-if="items.length" class="lp-bulk" :class="{ 'lp-bulk--active': selectedIds.length }">
      <label class="lp-bulk__select" @click.stop>
        <v-checkbox-btn
          :model-value="allSelected"
          :indeterminate="someSelected"
          density="compact"
          hide-details
          @update:modelValue="toggleSelectAll"
        />
        <span class="lp-bulk__label">
          <template v-if="selectedIds.length">
            <strong>{{ selectedIds.length }}</strong> seleccionado{{ selectedIds.length === 1 ? '' : 's' }}
          </template>
          <template v-else>
            Seleccionar todos de la página
          </template>
        </span>
      </label>

      <div v-if="selectedIds.length" class="lp-bulk__actions">
        <v-btn variant="text" size="small" rounded="lg" @click="selectedIds = []">
          <v-icon size="16" start>mdi-close</v-icon>
          Cancelar
        </v-btn>
        <v-btn
          :color="isAdmin ? 'error' : 'warning'"
          variant="flat"
          size="small"
          rounded="lg"
          :prepend-icon="isAdmin ? 'mdi-delete-outline' : 'mdi-eye-off-outline'"
          @click="bulkDisableOrDelete"
        >
          {{ isAdmin ? 'Eliminar' : 'Inactivar' }} {{ selectedIds.length }}
        </v-btn>
      </div>
    </div>

    <!-- ── ERROR ────────────────────────────────────────── -->
    <v-alert v-if="products.error" type="error" variant="tonal" density="compact" class="lp-alert">
      {{ products.error }}
    </v-alert>

    <!-- ── CONTENT ──────────────────────────────────────── -->
    <section class="lp-content">
      <div class="lp-content__head">
        <div class="lp-content__head-left">
          <span class="lp-content__title">Resultados</span>
          <v-chip size="x-small" variant="tonal">{{ items.length }} de {{ meta.total }}</v-chip>
        </div>
      </div>

      <div class="lp-content__body" :class="{ 'lp-content__body--loading': loading }">
        <!-- SKELETON -->
        <div v-if="loading && !items.length" class="lp-skeleton-grid">
          <div v-for="n in 8" :key="n" class="lp-skeleton-card" />
        </div>

        <!-- EMPTY -->
        <div v-else-if="!loading && !items.length" class="lp-empty">
          <v-icon size="52" color="medium-emphasis">mdi-package-variant-closed</v-icon>
          <div class="lp-empty__title">Sin resultados</div>
          <div class="lp-empty__sub">Probá con otros filtros o creá un nuevo producto</div>
          <div class="d-flex ga-2 mt-4">
            <v-btn variant="tonal" rounded="lg" @click="clearFilters">Limpiar filtros</v-btn>
            <v-btn color="primary" variant="flat" rounded="lg" @click="openCreate">Nuevo producto</v-btn>
          </div>
        </div>

        <!-- GRID -->
        <div
          v-else-if="viewMode === 'grid' || !smAndUp"
          class="plp-grid"
        >
          <div
            v-for="item in items"
            :key="item.id"
            class="plp-card"
            :class="{ 'plp-card--inactive': isInactive(item) }"
            @click="openView(item.id)"
          >
            <div class="plp-card-media">
              <img v-if="getProductImage(item)" :src="getProductImage(item)" :alt="item.name" class="plp-card-img" />
              <div v-else class="plp-card-noimg">
                <v-icon size="38">mdi-package-variant-closed</v-icon>
              </div>

              <span
                class="plp-stock-badge"
                :class="stockLevelClass(item)"
                :title="getStockLabel(item)"
              >
                <v-icon size="12">
                  {{ getStockQty(item) > 0 ? 'mdi-package-variant-closed' : 'mdi-close-circle' }}
                </v-icon>
                {{ getStockQty(item) }}
              </span>

              <div class="plp-card-check" @click.stop>
                <v-checkbox-btn
                  :model-value="selectedIds.includes(item.id)"
                  density="compact"
                  hide-details
                  @update:modelValue="toggleSelect(item.id)"
                />
              </div>

              <span v-if="isInactive(item)" class="plp-inactive-badge">Inactivo</span>
              <span v-if="Number(item.is_kit) === 1 || item.is_kit === true" class="plp-kit-badge" title="Es un kit / combo">
                <v-icon size="11">mdi-package-variant</v-icon>
                KIT
              </span>
            </div>

            <div class="plp-card-info">
              <div class="plp-card-name" :title="item.name">{{ item.name }}</div>

              <div v-if="item.sku || item.code" class="plp-card-sku">
                <v-icon size="11">mdi-barcode</v-icon>
                <span>{{ item.sku || item.code }}</span>
              </div>

              <div v-if="item.brand || item.model || item.category?.name || item.rubro" class="plp-card-meta">
                <span v-if="item.brand" class="meta-chip meta-chip--brand">{{ item.brand }}</span>
                <span v-if="item.model" class="meta-chip meta-chip--muted">{{ item.model }}</span>
                <span v-if="item.category?.name || item.rubro" class="meta-chip meta-chip--cat">
                  {{ item.category?.name || item.rubro }}
                </span>
              </div>

              <div v-if="enabledBranches(item).length || Number(item.branch_id || 0) > 0" class="plp-card-branches">
                <template v-if="enabledBranches(item).length">
                  <span
                    v-for="(b, i) in visibleBranches(enabledBranches(item))"
                    :key="`${item.id}-b${b.id}-${i}`"
                    class="plp-br-pill"
                    :style="{ '--br-color': branchCssColor(b.id) }"
                  >
                    <v-icon size="10">mdi-store-outline</v-icon>
                    {{ branchInitials(b.name) }}
                  </span>
                  <span v-if="hiddenBranchesCount(enabledBranches(item)) > 0" class="plp-br-pill plp-br-pill--more">
                    +{{ hiddenBranchesCount(enabledBranches(item)) }}
                  </span>
                </template>
                <span v-else class="plp-br-pill" :style="{ '--br-color': branchCssColor(item.branch_id) }">
                  <v-icon size="10">mdi-store-outline</v-icon>
                  {{ branchInitials(branchName(item.branch_id)) }}
                </span>
              </div>

              <div class="plp-card-footer">
                <div v-if="Number(item.price_list) > 0" class="plp-card-price">
                  {{ fmtPrice(item.price_list) }}
                </div>
                <div v-else class="plp-card-price plp-card-price--none">
                  Sin precio
                </div>

                <div class="plp-card-actions" @click.stop>
                  <v-btn icon size="x-small" variant="text" title="Ver" @click.stop="openView(item.id)">
                    <v-icon size="16">mdi-eye-outline</v-icon>
                  </v-btn>
                  <v-btn icon size="x-small" variant="text" title="Editar" @click.stop="openEdit(item.id)">
                    <v-icon size="16">mdi-pencil-outline</v-icon>
                  </v-btn>
                  <v-menu location="bottom end" :close-on-content-click="true">
                    <template #activator="{ props }">
                      <v-btn v-bind="props" icon size="x-small" variant="text" @click.stop>
                        <v-icon size="16">mdi-dots-vertical</v-icon>
                      </v-btn>
                    </template>
                    <v-list density="compact" min-width="160">
                      <v-list-item @click="openEdit(item.id)">
                        <template #prepend><v-icon size="16">mdi-pencil-outline</v-icon></template>
                        <v-list-item-title>Editar</v-list-item-title>
                      </v-list-item>
                      <v-divider />
                      <v-list-item v-if="!isAdmin" @click="askDisable(item)">
                        <template #prepend><v-icon size="16">mdi-eye-off-outline</v-icon></template>
                        <v-list-item-title>Inactivar</v-list-item-title>
                      </v-list-item>
                      <v-list-item v-else @click="askDelete(item)">
                        <template #prepend><v-icon size="16" color="error">mdi-delete-outline</v-icon></template>
                        <v-list-item-title class="text-error">Eliminar</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- LIST -->
        <div v-else class="plp-list-wrap">
          <div class="plp-list-head">
            <div class="plp-lh-check">
              <v-checkbox-btn
                :model-value="allSelected"
                density="compact"
                hide-details
                @update:modelValue="toggleSelectAll"
              />
            </div>
            <div class="plp-lh-name">Nombre</div>
            <div class="plp-lh-cat">Rubro · Subrubro</div>
            <div class="plp-lh-branches">Sucursales</div>
            <div class="plp-lh-price">Precio</div>
            <div class="plp-lh-stock">Stock</div>
            <div class="plp-lh-actions"></div>
          </div>
          <div
            v-for="item in items"
            :key="item.id"
            class="plp-list-row"
            :class="{ 'plp-list-row--inactive': isInactive(item) }"
            @click="openView(item.id)"
          >
            <div class="plp-lh-check" @click.stop>
              <v-checkbox-btn
                :model-value="selectedIds.includes(item.id)"
                density="compact"
                hide-details
                @update:modelValue="toggleSelect(item.id)"
              />
            </div>
            <div class="plp-row-name">
              <div class="plp-row-name-text">
                <span v-if="Number(item.is_kit) === 1 || item.is_kit === true" class="plp-kit-pill" title="Kit / combo">
                  <v-icon size="11">mdi-package-variant</v-icon>KIT
                </span>
                {{ item.name }}
              </div>
              <div v-if="item.sku || item.brand" class="plp-row-sku">
                {{ item.sku || '' }}{{ item.sku && item.brand ? ' · ' : '' }}{{ item.brand || '' }}
              </div>
            </div>
            <div class="plp-row-cat">
              <span v-if="item.category?.name || item.rubro" class="plp-tag plp-tag--cat">
                {{ item.category?.name || item.rubro }}
              </span>
              <span v-if="item.subcategory?.name || item.subrubro" class="plp-tag plp-tag--sub">
                {{ item.subcategory?.name || item.subrubro }}
              </span>
            </div>
            <div class="plp-row-branches">
              <template v-if="enabledBranches(item).length">
                <v-chip
                  v-for="(b, i) in visibleBranches(enabledBranches(item))"
                  :key="`${item.id}-r${b.id}-${i}`"
                  size="x-small"
                  variant="tonal"
                  :color="branchColor(b.id)"
                  label
                  class="plp-br-chip"
                >
                  {{ branchInitials(b.name) }}
                </v-chip>
                <span v-if="hiddenBranchesCount(enabledBranches(item)) > 0" class="plp-more">
                  +{{ hiddenBranchesCount(enabledBranches(item)) }}
                </span>
              </template>
              <template v-else-if="Number(item.branch_id || 0) > 0">
                <v-chip size="x-small" variant="tonal" :color="branchColor(item.branch_id)" label class="plp-br-chip">
                  {{ branchInitials(branchName(item.branch_id)) }}
                </v-chip>
              </template>
              <span v-else class="text-medium-emphasis text-caption">—</span>
            </div>
            <div class="plp-row-price">
              <span v-if="Number(item.price_list) > 0" class="plp-price-val">${{ fmtPrice(item.price_list) }}</span>
              <span v-else class="text-medium-emphasis text-caption">—</span>
            </div>
            <div class="plp-row-stock" :class="getStockClass(item)">
              <span class="st-dot" /><span>{{ getStockLabel(item) }}</span>
            </div>
            <div class="plp-row-actions" @click.stop>
              <v-btn icon size="x-small" variant="text" @click.stop="openView(item.id)">
                <v-icon size="16">mdi-eye-outline</v-icon>
              </v-btn>
              <v-menu location="bottom end" :close-on-content-click="true">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon size="x-small" variant="text" @click.stop>
                    <v-icon size="16">mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact" min-width="160">
                  <v-list-item @click="openEdit(item.id)">
                    <template #prepend><v-icon size="16">mdi-pencil-outline</v-icon></template>
                    <v-list-item-title>Editar</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item v-if="!isAdmin" @click="askDisable(item)">
                    <template #prepend><v-icon size="16">mdi-eye-off-outline</v-icon></template>
                    <v-list-item-title>Inactivar</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-else @click="askDelete(item)">
                    <template #prepend><v-icon size="16" color="error">mdi-delete-outline</v-icon></template>
                    <v-list-item-title class="text-error">Eliminar</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── PAGINATION ───────────────────────────────────── -->
    <footer v-if="meta.total > 0" class="lp-pagination">
      <span class="lp-pagination__info">{{ items.length }} de {{ meta.total }}</span>
      <v-pagination
        v-model="page"
        :length="meta.pages || 1"
        :total-visible="smAndUp ? 7 : 4"
        rounded="lg"
        size="small"
        @update:modelValue="fetchNow"
      />
    </footer>

    <!-- ── DIALOGS ──────────────────────────────────────── -->
    <v-dialog v-model="disableOpen" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold pt-5 px-5">Inactivar producto</v-card-title>
        <v-card-text class="px-5">
          ¿Inactivar <b>{{ disableItem?.name }}</b>?
          <div class="text-caption text-medium-emphasis mt-1">Se oculta del catálogo y del POS. No se borra.</div>
        </v-card-text>
        <v-card-actions class="justify-end px-5 pb-5">
          <v-btn variant="tonal" :disabled="products.loading" @click="disableOpen = false">Cancelar</v-btn>
          <v-btn color="warning" variant="flat" rounded="lg" :loading="products.loading" @click="doDisable">
            Inactivar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteOpen" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold pt-5 px-5">Eliminar producto</v-card-title>
        <v-card-text class="px-5">
          ¿Eliminar <b>{{ deleteItem?.name }}</b>?
          <div class="text-caption text-medium-emphasis mt-1">Si tiene ventas relacionadas, se inactiva automáticamente.</div>
        </v-card-text>
        <v-card-actions class="justify-end px-5 pb-5">
          <v-btn variant="tonal" :disabled="products.loading" @click="deleteOpen = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" :loading="products.loading" @click="doDelete">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3500" location="bottom right" rounded="lg">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useProductsStore } from "@/app/store/products.store";
import { useAuthStore } from "@/app/store/auth.store";
import { useCategoriesStore } from "@/app/store/categories.store";

const router = useRouter();
const products = useProductsStore();
const auth = useAuthStore();
const categories = useCategoriesStore();
const { smAndUp } = useDisplay();

const isAdmin = computed(() => {
  const r = auth.roles || [];
  return r.includes("admin") || r.includes("super_admin");
});

const loading = ref(false);
const items = computed(() => (Array.isArray(products.items) ? products.items : []));

/* Stats agregadas */
const statsLoading = ref(false);
const stats = ref({
  ready: false,
  total: 0,
  active: 0,
  inactive: 0,
  with_stock: 0,
  without_stock: 0,
  with_price: 0,
  without_price: 0,
  with_images: 0,
  without_images: 0,
  promo_active: 0,
});
function fmtInt(n) {
  return Number(n || 0).toLocaleString('es');
}
function pct(part, whole) {
  const w = Number(whole || 0);
  if (!w) return '0%';
  const p = Math.round((Number(part || 0) / w) * 100);
  return `${p}%`;
}

const meta = ref({ page: 1, limit: 24, total: 0, pages: 1 });
const page = ref(1);
const limit = ref(24);
const selectedIds = ref([]);

const deleteOpen = ref(false);
const deleteItem = ref(null);
const disableOpen = ref(false);
const disableItem = ref(null);

const snack = ref({ show: false, text: "" });
function toast(text) {
  snack.value = { show: true, text: String(text || "") };
}

function rowRaw(slotItem) {
  return slotItem?.raw ?? slotItem ?? {};
}
function isInactive(it) {
  return it?.is_active === false || Number(it?.is_active) === 0;
}

/* Branches */
const branches = ref([]);
async function loadBranchesSafe() {
  if (typeof products.fetchBranches !== "function") return;
  try {
    const arr = await products.fetchBranches();
    branches.value = Array.isArray(arr) ? arr : [];
  } catch {}
}
function branchName(id) {
  const bid = Number(id || 0);
  if (!bid) return "—";
  const found = branches.value.find((b) => Number(b?.id) === bid);
  return found?.name || `Sucursal #${bid}`;
}
function branchColor(id) {
  const bid = Number(id || 0);
  if (!bid) return "grey";
  if (bid === 1) return "primary";
  if (bid === 2) return "green";
  if (bid === 3) return "deep-purple";
  return "blue-grey";
}
const branchItems = computed(() => {
  const out = [{ title: "Todas", value: null }];
  (branches.value || [])
    .map((b) => ({ title: b?.name || `Sucursal #${b?.id}`, value: Number(b?.id) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => a.value - b.value)
    .forEach((x) => out.push(x));
  return out;
});

/* Multi-sucursal chips */
function branchInitials(name) {
  const s = String(name || "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || s.slice(0, 2).toUpperCase();
}
function enabledBranches(it) {
  const gc = String(it?.branches_gc || "").trim();
  if (!gc) return [];
  return gc
    .split("|")
    .map((pair) => {
      const idx = pair.indexOf(":");
      if (idx <= 0) return null;
      const id = Number(pair.slice(0, idx));
      const name = String(pair.slice(idx + 1) || "").trim();
      if (!id) return null;
      return { id, name: name || branchName(id) };
    })
    .filter(Boolean)
    .sort((a, b) => a.id - b.id);
}
function visibleBranches(list) {
  return (list || []).slice(0, 4);
}
function hiddenBranchesCount(list) {
  const n = (list || []).length;
  return n > 4 ? n - 4 : 0;
}
function hiddenBranchesText(list) {
  const rest = (list || []).slice(4).map((b) => b.name).filter(Boolean);
  return rest.length ? rest.join(" · ") : "—";
}

/* Categories */
async function loadCategoriesSafe() {
  try {
    if (typeof categories.fetchAll === "function") await categories.fetchAll(true);
  } catch {}
}
const parentList = computed(() => (Array.isArray(categories.parents) ? categories.parents : []));
const categoryItems = computed(() => {
  const out = [{ title: "Todos", value: null }];
  parentList.value
    .map((c) => ({ id: Number(c?.id || 0), name: String(c?.name || "").trim() }))
    .filter((x) => x.id > 0 && x.name)
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .forEach((x) => out.push({ title: x.name, value: x.id }));
  return out;
});
const subcategoryItems = computed(() => {
  const out = [{ title: "Todos", value: null }];
  const pid = Number(f.value.category_id || 0);
  if (!pid) return out;

  const kids = Array.isArray(categories.children) ? categories.children : [];
  kids
    .filter((x) => Number(x?.category_id || x?.parent_id || 0) === pid || Number(x?.parent_id || 0) === pid)
    .map((x) => ({ id: Number(x?.id || 0), name: String(x?.name || "").trim() }))
    .filter((x) => x.id > 0 && x.name)
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .forEach((x) => out.push({ title: x.name, value: x.id }));

  return out;
});

/* Filtros */
const f = ref({
  q: "",
  branch_id: null,
  category_id: null,
  subcategory_id: null,
  stock: "all",
  price_presence: "all",
  status: isAdmin.value ? "all" : "active",
  price_min: null,
  price_max: null,
  images: "all",
  promo: "all",
});

const stockItems = [
  { title: "Todos", value: "all" },
  { title: "Con stock", value: "with" },
  { title: "Sin stock", value: "without" },
];
const pricePresenceItems = [
  { title: "Todos", value: "all" },
  { title: "Con precio", value: "with" },
  { title: "Sin precio (0)", value: "without" },
];
const imagesItems = [
  { title: "Todas", value: "all" },
  { title: "Con imágenes", value: "with" },
  { title: "Sin imágenes", value: "without" },
];
const promoItems = [
  { title: "Todos",          value: "all" },
  { title: "En promo (vigente)", value: "active" },
  { title: "En promo (todas)",   value: "any" },
  { title: "Sin promo",      value: "none" },
  { title: "Promo programada", value: "scheduled" },
  { title: "Promo vencida",  value: "expired" },
];
const statusItems = computed(() => {
  if (!isAdmin.value) {
    return [
      { title: "Activos", value: "active" },
      { title: "Inactivos", value: "inactive" },
    ];
  }
  return [
    { title: "Todos (activos + inactivos)", value: "all" },
    { title: "Activos", value: "active" },
    { title: "Inactivos", value: "inactive" },
  ];
});

function onCategoryChange() {
  f.value.subcategory_id = null;
  applyFilters();
}
function onLimitChange() {
  page.value = 1;
  fetchNow();
}
async function applyFilters() {
  page.value = 1;
  selectedIds.value = [];
  await fetchNow();
}
async function clearFilters() {
  f.value = {
    q: "",
    branch_id: null,
    category_id: null,
    subcategory_id: null,
    stock: "all",
    price_presence: "all",
    status: isAdmin.value ? "all" : "active",
    price_min: null,
    price_max: null,
    images: "all",
    promo: "all",
  };
  page.value = 1;
  selectedIds.value = [];
  await fetchNow();
}

/* Fetch stats (mismos filtros base que el listado) */
async function fetchStats() {
  if (!auth.isAuthed) return;
  statsLoading.value = true;
  try {
    const params = {
      q: String(f.value.q || "").trim(),
      branch_id: isAdmin.value ? (f.value.branch_id ? Number(f.value.branch_id) : null) : null,
      category_id: f.value.category_id ? Number(f.value.category_id) : null,
      subcategory_id: f.value.subcategory_id ? Number(f.value.subcategory_id) : null,
    };
    if (String(f.value.status) === "all") {
      params.include_inactive = 1;
    } else if (String(f.value.status) === "inactive") {
      params.is_active = 0;
    }

    const data = await products.fetchStats(params);
    if (data) {
      stats.value = {
        ready: true,
        total: Number(data.total || 0),
        active: Number(data.active || 0),
        inactive: Number(data.inactive || 0),
        with_stock: Number(data.with_stock || 0),
        without_stock: Number(data.without_stock || 0),
        with_price: Number(data.with_price || 0),
        without_price: Number(data.without_price || 0),
        with_images: Number(data.with_images || 0),
        without_images: Number(data.without_images || 0),
        promo_active: Number(data.promo_active || 0),
      };
    } else {
      stats.value.ready = false;
    }
  } finally {
    statsLoading.value = false;
  }
}

/* Fetch */
async function fetchNow() {
  if (!auth.isAuthed) return;
  if (loading.value) return;

  loading.value = true;
  try {
    const params = {
      page: Number(page.value || 1),
      limit: Number(limit.value || 24),
      q: String(f.value.q || "").trim(),

      branch_id: isAdmin.value ? (f.value.branch_id ? Number(f.value.branch_id) : null) : null,

      category_id: f.value.category_id ? Number(f.value.category_id) : null,
      subcategory_id: f.value.subcategory_id ? Number(f.value.subcategory_id) : null,

      stock: f.value.stock,
      price_presence: f.value.price_presence,
      price_min: f.value.price_min !== "" && f.value.price_min != null ? Number(f.value.price_min) : null,
      price_max: f.value.price_max !== "" && f.value.price_max != null ? Number(f.value.price_max) : null,
      images: f.value.images,
      promo: f.value.promo && f.value.promo !== "all" ? f.value.promo : null,
    };

    if (String(f.value.status) === "all") {
      params.include_inactive = 1;
    } else if (String(f.value.status) === "inactive") {
      params.is_active = 0;
    } else if (String(f.value.status) === "active") {
      // backend default
    }

    const r = await products.fetchList(params);

    const m =
      (r && r.meta) ||
      (r && r.data && r.meta) ||
      products.meta ||
      {
        page: params.page,
        limit: params.limit,
        total: Array.isArray(products.items) ? products.items.length : 0,
        pages: products.pages || 1,
      };

    meta.value = {
      page: Number(m.page || params.page),
      limit: Number(m.limit || params.limit),
      total: Number(m.total || 0),
      pages: Number(m.pages || 1) || 1,
    };

    if (page.value > meta.value.pages) page.value = meta.value.pages;
  } finally {
    loading.value = false;
  }
  // refresh stats agregadas en paralelo (no bloquea UI)
  fetchStats();
}

function onRowClick(e, row) {
  const item = row?.item?.raw ?? row?.item ?? row;
  const t = e?.target;
  if (t?.closest?.("button, a, input, label, textarea, select, .v-btn, .v-selection-control, .v-menu")) return;
  openView(item?.id);
}

const headers = computed(() => {
  const base = [
    { title: "Nombre", key: "name", sortable: false, width: 520 },
    { title: "Rubro", key: "rubro", sortable: false, width: 260 },
    { title: "Subrubro", key: "subrubro", sortable: false, width: 260 },
    { title: "", key: "actions", sortable: false, align: "end", width: 96 },
  ];
  if (!isAdmin.value) return base;

  const out = [...base];
  out.splice(1, 0, { title: "Sucursal dueña", key: "branch", sortable: false, width: 220 });
  out.splice(2, 0, { title: "Sucursales", key: "branches", sortable: false, width: 190 });
  return out;
});

function openView(id) {
  const pid = Number(id || 0);
  if (!pid) return;
  router.push({ name: "productView", params: { id: pid } });
}
function openEdit(id) {
  const pid = Number(id || 0);
  if (!pid || !auth.isAuthed) return;
  router.push({ name: "productEdit", params: { id: pid } });
}
function openCreate() {
  router.push({ name: "productNew" });
}

/* Click en KPI "Promos activas" → toggle filtro promo=active */
function onPromoActiveKpiClick() {
  if (f.value.promo === "active") {
    f.value.promo = "all";
  } else {
    f.value.promo = "active";
  }
  applyFilters();
}

/* ── Bulk promo (pausar / reactivar todas) ── */
const bulkPromoBusy = ref(false);
const bulkPromoDialog = ref({
  open: false,
  action: "",       // 'pause' | 'resume'
  title: "",
  message: "",
});

function onPauseAllPromos() {
  bulkPromoDialog.value = {
    open: true,
    action: "pause",
    title: "Pausar todas las promociones",
    message: "Vas a apagar el flag de promoción en TODOS los productos que lo tengan activo. La configuración (precio promo, fechas, reglas) se mantiene — solo se apaga la visualización en la tienda.",
  };
}

function onResumeAllPromos() {
  bulkPromoDialog.value = {
    open: true,
    action: "resume",
    title: "Reactivar promos configuradas",
    message: "Se va a prender el flag de promoción en los productos que tengan precio promo, ventana o regla por cantidad configurada y no estén activas hoy. No se afectan productos sin configuración previa.",
  };
}

async function confirmBulkPromo() {
  const action = bulkPromoDialog.value.action;
  if (!action) return;
  bulkPromoBusy.value = true;
  try {
    const res = action === "pause"
      ? await products.pauseAllPromos()
      : await products.resumeAllPromos();

    if (!res) {
      toast(`⚠️ ${products.error || "No se pudo completar la acción"}`);
      return;
    }

    const n = action === "pause" ? Number(res.paused || 0) : Number(res.resumed || 0);
    if (action === "pause") {
      toast(n > 0 ? `⏸️ ${n} promoción${n === 1 ? "" : "es"} pausada${n === 1 ? "" : "s"}` : "No había promos activas para pausar");
    } else {
      toast(n > 0 ? `▶️ ${n} promoción${n === 1 ? "" : "es"} reactivada${n === 1 ? "" : "s"}` : "No se encontraron promos configuradas para reactivar");
    }

    bulkPromoDialog.value.open = false;
    // Refrescar listado y stats para reflejar el cambio
    await Promise.all([fetchNow(), fetchStats()]);
  } finally {
    bulkPromoBusy.value = false;
  }
}
function askDelete(item) {
  deleteItem.value = item;
  deleteOpen.value = true;
}
function askDisable(item) {
  disableItem.value = item;
  disableOpen.value = true;
}

function normalizeRemoveResult(r) {
  if (typeof r === "boolean") return { ok: r, code: r ? null : "DELETE_FAILED", message: r ? null : "No se pudo eliminar" };
  if (r && typeof r === "object") return { ok: !!r.ok, code: r.code || null, message: r.message || null };
  return { ok: false, code: "DELETE_FAILED", message: "No se pudo eliminar" };
}
async function callRemoveProduct(id) {
  const fn =
    (products && typeof products.remove === "function" && products.remove) ||
    (products && typeof products.delete === "function" && products.delete) ||
    (products && typeof products.destroy === "function" && products.destroy) ||
    null;

  if (!fn) return { ok: false, code: "CLIENT_NO_METHOD", message: "Store: falta método remove/delete/destroy" };

  try {
    const out = await fn(id);
    return normalizeRemoveResult(out);
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || "No se pudo eliminar";
    const code = e?.response?.data?.code || e?.code || "DELETE_FAILED";
    return { ok: false, code, message: msg };
  }
}

async function doDisable() {
  if (!disableItem.value?.id) return;
  try {
    const updated = await products.update(disableItem.value.id, { is_active: false });
    if (!updated?.id) throw new Error(products.error || "No se pudo inactivar");
    toast("Producto inactivado");
  } catch (e) {
    toast(e?.message || "No se pudo inactivar");
  } finally {
    disableOpen.value = false;
    disableItem.value = null;
    await fetchNow();
  }
}
async function doDelete() {
  if (!deleteItem.value?.id) return;
  const id = Number(deleteItem.value.id);
  let needRefetch = false;
  try {
    const r = await callRemoveProduct(id);
    if (r.ok) {
      toast("Producto eliminado");
      return;
    }
    if (String(r.code || "").toUpperCase() === "FK_CONSTRAINT") {
      const updated = await products.update(id, { is_active: false });
      if (!updated?.id) throw new Error(products.error || "No se pudo inactivar (fallback FK)");
      toast("No se pudo borrar (FK). Se inactivó.");
      needRefetch = true;
      return;
    }
    throw new Error(r.message || products.error || "No se pudo eliminar");
  } catch (e) {
    toast(e?.message || "No se pudo eliminar");
    needRefetch = true;
  } finally {
    deleteOpen.value = false;
    deleteItem.value = null;
    if (needRefetch) await fetchNow();
  }
}

async function bulkDisableOrDelete() {
  if (!selectedIds.value?.length) return;

  const ids = [...selectedIds.value].map((x) => Number(x)).filter((x) => x > 0);

  let deleted = 0;
  let inactivated = 0;
  let failed = 0;

  for (const id of ids) {
    try {
      if (isAdmin.value) {
        const r = await callRemoveProduct(id);
        if (r.ok) deleted++;
        else if (String(r.code || "").toUpperCase() === "FK_CONSTRAINT") {
          const updated = await products.update(id, { is_active: false });
          if (updated?.id) inactivated++;
          else failed++;
        } else failed++;
      } else {
        const updated = await products.update(id, { is_active: false });
        if (updated?.id) inactivated++;
        else failed++;
      }
    } catch {
      failed++;
    }
  }

  selectedIds.value = [];
  toast(isAdmin.value ? `Eliminados: ${deleted} · Inactivados(FK): ${inactivated} · Fallidos: ${failed}` : `Inactivados: ${inactivated} · Fallidos: ${failed}`);
  await fetchNow();
}

async function reload() {
  if (!auth.isAuthed) return;
  await loadCategoriesSafe();
  await loadBranchesSafe();
  await fetchNow();
}

onMounted(reload);

watch(
  () => auth.isAuthed,
  (v) => {
    if (v) reload();
  },
  { immediate: true }
);

watch(
  () => [page.value],
  () => {
    selectedIds.value = [];
  }
);

/* ── UI HELPERS ── */
const viewMode = ref('grid');
let _searchTimer = null;
function debouncedSearch() { clearTimeout(_searchTimer); _searchTimer = setTimeout(() => applyFilters(), 400); }
function clearSearch() { f.value.q = ''; applyFilters(); }

/* Filtros avanzados (colapsable + persistencia) */
const ADV_KEY = "lp.products.advancedOpen.v2";
const advancedOpen = ref(false);
try {
  const saved = localStorage.getItem(ADV_KEY);
  if (saved !== null) advancedOpen.value = saved === "1";
} catch {}
function toggleAdvanced() {
  advancedOpen.value = !advancedOpen.value;
  try { localStorage.setItem(ADV_KEY, advancedOpen.value ? "1" : "0"); } catch {}
}

const activeFiltersCount = computed(() => {
  let n = 0;
  if (f.value.branch_id) n++;
  if (f.value.category_id) n++;
  if (f.value.subcategory_id) n++;
  if (f.value.stock !== 'all') n++;
  if (f.value.price_presence !== 'all') n++;
  if (f.value.images !== 'all') n++;
  if (f.value.price_min) n++;
  if (f.value.price_max) n++;
  const defStatus = isAdmin.value ? 'all' : 'active';
  if (f.value.status !== defStatus) n++;
  return n;
});

// Cuenta solo filtros que viven dentro del bloque "Más filtros"
const activeAdvancedCount = computed(() => {
  let n = 0;
  if (f.value.branch_id) n++;
  if (f.value.category_id) n++;
  if (f.value.subcategory_id) n++;
  if (f.value.stock !== 'all') n++;
  if (f.value.price_presence !== 'all') n++;
  if (f.value.images !== 'all') n++;
  if (f.value.promo !== 'all') n++;
  if (f.value.price_min) n++;
  if (f.value.price_max) n++;
  return n;
});

const activeFilterChips = computed(() => {
  const chips = [];
  if (f.value.branch_id) { const b = branchItems.value.find(x => x.value === f.value.branch_id); chips.push({ key: 'branch_id', label: `Sucursal: ${b?.title || f.value.branch_id}` }); }
  if (f.value.category_id) { const c = categoryItems.value.find(x => x.value === f.value.category_id); chips.push({ key: 'category_id', label: `Rubro: ${c?.title || f.value.category_id}` }); }
  if (f.value.subcategory_id) { const s = subcategoryItems.value.find(x => x.value === f.value.subcategory_id); chips.push({ key: 'subcategory_id', label: `Subrubro: ${s?.title || f.value.subcategory_id}` }); }
  if (f.value.stock !== 'all') chips.push({ key: 'stock', label: stockItems.find(x => x.value === f.value.stock)?.title });
  if (f.value.price_presence !== 'all') chips.push({ key: 'price_presence', label: pricePresenceItems.find(x => x.value === f.value.price_presence)?.title });
  if (f.value.images !== 'all') chips.push({ key: 'images', label: imagesItems.find(x => x.value === f.value.images)?.title });
  if (f.value.promo !== 'all') chips.push({ key: 'promo', label: `Promo: ${promoItems.find(x => x.value === f.value.promo)?.title}` });
  if (f.value.price_min) chips.push({ key: 'price_min', label: `Mín $${f.value.price_min}` });
  if (f.value.price_max) chips.push({ key: 'price_max', label: `Máx $${f.value.price_max}` });
  const defStatus = isAdmin.value ? 'all' : 'active';
  if (f.value.status !== defStatus) { const s = statusItems.value.find(x => x.value === f.value.status); chips.push({ key: 'status', label: s?.title }); }
  return chips.filter(c => c.label);
});

function removeFilter(key) {
  const defaults = { branch_id: null, category_id: null, subcategory_id: null, stock: 'all', price_presence: 'all', images: 'all', promo: 'all', price_min: null, price_max: null, status: isAdmin.value ? 'all' : 'active' };
  f.value[key] = defaults[key];
  if (key === 'category_id') f.value.subcategory_id = null;
  applyFilters();
}

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) selectedIds.value.splice(idx, 1);
  else selectedIds.value.push(id);
}

const allSelected = computed(() => items.value.length > 0 && items.value.every(it => selectedIds.value.includes(it.id)));
const someSelected = computed(() => selectedIds.value.length > 0 && !allSelected.value);
function toggleSelectAll(val) { selectedIds.value = val ? items.value.map(it => it.id) : []; }

const CAT_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4'];
function getCategoryColor(item) { const id = Number(item?.category_id || 0); return id ? CAT_COLORS[id % CAT_COLORS.length] : '#6b7280'; }

function getProductImage(item) {
  const imgs = item?.images;
  if (Array.isArray(imgs) && imgs.length) { const f = imgs[0]; return typeof f === 'string' ? f : f?.url || f?.thumbnail || null; }
  return item?.thumbnail || item?.image_url || item?.image || null;
}

function fmtPrice(v) { const n = Number(v||0); if(!n) return '—'; return new Intl.NumberFormat('es-AR').format(Math.round(n)); }

function getStockClass(item) {
  const qty = Number(item?.stock_total ?? item?.stock_qty ?? item?.stock ?? item?.qty ?? -1);
  if (qty < 0) return 'st-unknown'; if (qty === 0) return 'st-zero'; return 'st-ok';
}
function getStockLabel(item) {
  const qty = Number(item?.stock_total ?? item?.stock_qty ?? item?.stock ?? item?.qty ?? -1);
  if (qty < 0) return '—'; if (qty === 0) return 'Sin stock'; return `${qty} uds`;
}
function getStockQty(item) {
  const qty = Number(item?.stock_total ?? item?.stock_qty ?? item?.stock ?? item?.qty ?? 0);
  return Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;
}
function stockLevelClass(item) {
  const n = getStockQty(item);
  if (n <= 0) return 'level-out';
  if (n < 5) return 'level-low';
  if (n <= 10) return 'level-mid';
  return 'level-high';
}
function branchCssColor(id) {
  const bid = Number(id || 0);
  if (bid === 1) return 'rgb(var(--v-theme-primary))';
  if (bid === 2) return '#16a34a';
  if (bid === 3) return '#7c3aed';
  return '#6b7280';
}
</script>

<style scoped>
/* ============================================================
   LIST PAGE — patrón estandarizado (lp-*)
   Compartido con PosSalesPage. Mantener sincronizado.
   ============================================================ */

.lp {
  --lp-gap: 14px;
  --lp-radius: 14px;
  --lp-radius-sm: 12px;
  --lp-card-pad: 16px;
  --lp-card-bg: rgb(var(--v-theme-surface));
  --lp-card-border: rgba(var(--v-border-color), var(--v-border-opacity));
  --lp-muted: rgba(var(--v-theme-on-surface), 0.55);
  --lp-strong: rgba(var(--v-theme-on-surface), 0.9);

  display: flex;
  flex-direction: column;
  gap: var(--lp-gap);
  min-width: 0;
}

/* ── HEADER ─────────────────────────────────────────────── */
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
  font-weight: 500;
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
}
.lp-meta__strong {
  font-weight: 500;
  color: var(--lp-strong);
  font-feature-settings: "tnum";
}
.lp-meta__sep { opacity: 0.4; }

.lp-view-toggle { border: 1px solid var(--lp-card-border); }

/* ── STATS KPI ──────────────────────────────────────────── */
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
  font-size: 11px; font-weight: 400;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.lp-kpi__val   {
  font-size: 20px; font-weight: 500;
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

/* ── METHOD CARDS ──────────────────────────────────────── */
.lp-methods {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.lp-mc {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: var(--lp-radius-sm);
  background: var(--lp-card-bg);
  border: 1px solid var(--lp-card-border);
}
.lp-mc__badge {
  width: 30px; height: 30px;
  border-radius: 8px;
  flex-shrink: 0;
  display: grid; place-items: center;
}
.lp-mc__badge--cash     { background: rgb(var(--v-theme-success)); }
.lp-mc__badge--transfer { background: var(--pos-kpi-color-3, #9c27b0); }
.lp-mc__badge--card     { background: rgb(var(--v-theme-info)); }
.lp-mc__badge--mp       { background: var(--pos-kpi-color-1, #f57c00); }
.lp-mc__badge--sjt      { background: var(--pos-kpi-color-4, #009688); }
.lp-mc__badge--promo    {
  background: linear-gradient(135deg, #ff5722 0%, #ff9100 100%);
  box-shadow: 0 2px 6px rgba(255, 87, 34, 0.35);
}
.lp-mc__badge--other    { background: rgba(var(--v-theme-on-surface), 0.35); }

/* KPI clickeable (filtra) */
.lp-mc--clickable {
  cursor: pointer;
  border: 1px solid var(--lp-card-border);
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  text-align: left;
  font-family: inherit;
}
.lp-mc--clickable:hover {
  border-color: rgba(255, 87, 34, 0.45);
  box-shadow: 0 2px 10px rgba(255, 87, 34, 0.12);
}
.lp-mc--clickable.is-active {
  border-color: rgb(255, 87, 34);
  background: rgba(255, 87, 34, 0.06);
  box-shadow: 0 0 0 1px rgba(255, 87, 34, 0.30);
}
.lp-mc__body { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.lp-mc__lbl  {
  font-size: 10px; font-weight: 400;
  opacity: 0.45;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.lp-mc__val  {
  font-size: 14px; font-weight: 500;
  margin-top: 2px;
  font-feature-settings: "tnum";
}

/* ── FILTER BAR ─────────────────────────────────────────── */
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
.lp-filters__primary-field { flex: 0 0 160px; min-width: 140px; }

.lp-filters__more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  height: 38px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid var(--lp-card-border);
  color: rgba(var(--v-theme-on-surface), 0.78);
  font-size: 12.5px;
  font-weight: 400;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background 0.14s, border-color 0.14s, color 0.14s;
  user-select: none;
}
.lp-filters__more:hover {
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: var(--lp-strong);
}
.lp-filters__more--open {
  background: rgba(var(--v-theme-primary), 0.1);
  border-color: rgba(var(--v-theme-primary), 0.4);
  color: rgb(var(--v-theme-primary));
}
.lp-filters__more-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 10.5px;
  font-weight: 500;
  line-height: 1;
  font-feature-settings: "tnum";
}
.lp-filters__more-chev {
  transition: transform 0.18s ease;
  opacity: 0.7;
}
.lp-filters__more--open .lp-filters__more-chev { transform: rotate(180deg); }

/* Grid filtros avanzados */
.lp-filters__advanced {
  padding-top: 4px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.08);
}
.lp-filters__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px 12px;
  align-items: start;
  padding-top: 12px;
}
.lp-filters__cell { min-width: 0; }
.lp-filters__cell--range {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 6px;
  align-items: center;
  grid-column: span 2;
}
.lp-filters__range-sep {
  font-size: 12px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.35);
  line-height: 1;
}
.lp-filters__cell--per-page { max-width: 160px; }

/* Chips activos */
.lp-filters__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding-top: 8px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.08);
}
.lp-filters__chip { font-size: 11px !important; }
.lp-filters__chips-clear {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  color: rgba(var(--v-theme-on-surface), 0.65);
  font-size: 11px;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.14s, color 0.14s, border-color 0.14s;
}
.lp-filters__chips-clear:hover {
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-error));
  border-color: rgba(var(--v-theme-error), 0.3);
}

/* ── BULK BAR ───────────────────────────────────────────── */
.lp-bulk {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  border-radius: var(--lp-radius-sm);
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid var(--lp-card-border);
  min-height: 52px;
  transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
}
.lp-bulk--active {
  background: rgba(var(--v-theme-primary), 0.08);
  border-color: rgba(var(--v-theme-primary), 0.36);
  box-shadow: 0 4px 14px rgba(var(--v-theme-primary), 0.14);
}
.lp-bulk__select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  min-width: 0;
}
.lp-bulk__label {
  font-size: 13px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.75);
}
.lp-bulk__label strong {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  font-feature-settings: "tnum";
}
.lp-bulk__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* ── ALERT ──────────────────────────────────────────────── */
.lp-alert { margin-bottom: 0 !important; }

/* ── CONTENT WRAPPER ───────────────────────────────────── */
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
.lp-content__title { font-size: 13px; font-weight: 500; letter-spacing: 0.01em; }
.lp-content__body { padding: 12px; transition: opacity 0.2s; }
.lp-content__body--loading { opacity: 0.5; pointer-events: none; }

/* ── PAGINATION ─────────────────────────────────────────── */
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
  font-weight: 400;
  color: var(--lp-muted);
  font-feature-settings: "tnum";
}

/* ── EMPTY / SKELETON ──────────────────────────────────── */
.lp-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.lp-skeleton-card {
  height: 240px;
  border-radius: var(--lp-radius-sm);
  background: rgba(var(--v-theme-on-surface), 0.06);
  animation: lp-pulse 1.4s ease infinite;
}
@keyframes lp-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

.lp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  gap: 8px;
  text-align: center;
}
.lp-empty__title { font-size: 16px; font-weight: 500; }
.lp-empty__sub { font-size: 13px; opacity: 0.55; }

/* ============================================================
   PRODUCTOS — específico (grid de tarjetas + lista)
   ============================================================ */

/* GRID */
.plp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.plp-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: var(--lp-radius-sm);
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: border-color 0.14s, box-shadow 0.14s, transform 0.14s;
}
.plp-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.45);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}
.plp-card--inactive { opacity: 0.6; }

.plp-card-media {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  overflow: hidden;
}
.plp-card-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.plp-card-noimg {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.3);
}

.plp-stock-badge {
  position: absolute;
  top: 6px; left: 6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 8px;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  font-feature-settings: "tnum";
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.22);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  z-index: 2;
}
.plp-stock-badge.level-high { background: rgb(var(--v-theme-success)); }
.plp-stock-badge.level-mid  { background: rgb(var(--v-theme-warning)); }
.plp-stock-badge.level-low,
.plp-stock-badge.level-out  { background: rgb(var(--v-theme-error)); }

.plp-card-check {
  position: absolute;
  top: 4px; right: 4px;
  z-index: 2;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  backdrop-filter: blur(4px);
  padding: 2px;
}

.plp-inactive-badge {
  position: absolute;
  bottom: 6px; left: 6px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(var(--v-theme-error), 0.9);
  color: #fff;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.24);
  z-index: 2;
}

.plp-card-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px 10px 10px;
  flex: 1 1 auto;
  min-height: 0;
}

.plp-card-name {
  font-size: 12.5px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.005em;
  color: rgb(var(--v-theme-on-surface));
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  min-height: 2.4em;
}

.plp-card-sku {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.16);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.75);
  letter-spacing: 0.02em;
  width: fit-content;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.plp-card-sku :deep(.v-icon) {
  color: rgb(var(--v-theme-primary));
  opacity: 0.8;
  flex-shrink: 0;
}

.plp-card-meta { display: flex; flex-wrap: wrap; gap: 4px; }

.meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  line-height: 1.4;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta-chip--brand {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}
.meta-chip--muted {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.72);
  text-transform: none;
}
.meta-chip--cat {
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgba(var(--v-theme-on-surface), 0.62);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  text-transform: none;
}

.plp-card-branches { display: flex; flex-wrap: wrap; gap: 3px; }

.plp-br-pill {
  --br-color: rgb(var(--v-theme-primary));
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 5px 1px 4px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--br-color) 14%, transparent);
  color: var(--br-color);
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.4;
  white-space: nowrap;
}
.plp-br-pill :deep(.v-icon) { opacity: 0.72; }
.plp-br-pill--more {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.plp-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: auto;
  padding-top: 4px;
}

.plp-card-price {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: rgb(var(--v-theme-success));
  font-feature-settings: "tnum";
}
.plp-card-price::before { content: "$ "; opacity: 0.72; font-weight: 400; }
.plp-card-price--none {
  font-size: 11px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-style: italic;
}
.plp-card-price--none::before { content: ""; }

.plp-card-actions { display: flex; align-items: center; gap: 0; flex-shrink: 0; }
.plp-card-actions :deep(.v-btn) {
  width: 26px !important;
  height: 26px !important;
  min-width: 26px !important;
}

/* STOCK DOT */
.st-dot { width: 7px; height: 7px; border-radius: 999px; flex-shrink: 0; }
.st-ok .st-dot { background: rgb(var(--v-theme-success)); }
.st-zero .st-dot { background: rgba(var(--v-theme-on-surface), 0.25); }
.st-unknown .st-dot { background: rgba(var(--v-theme-on-surface), 0.15); }
.st-ok { color: rgb(var(--v-theme-success)); }
.st-zero { opacity: 0.5; }
.st-unknown { opacity: 0.35; }

/* LIST */
.plp-list-wrap {
  border-radius: var(--lp-radius-sm);
  overflow: hidden;
  border: 1px solid var(--lp-card-border);
  background: rgb(var(--v-theme-surface));
}
.plp-list-head, .plp-list-row { display: grid; align-items: center; gap: 8px; padding: 10px 14px; }
.plp-list-head {
  grid-template-columns: 32px 1fr 180px 140px 90px 80px 64px;
  background: rgba(var(--v-theme-surface-variant), 0.4);
  border-bottom: 1px solid var(--lp-card-border);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
}
.plp-list-row {
  grid-template-columns: 32px 1fr 180px 140px 90px 80px 64px;
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
  transition: background 0.12s;
}
.plp-list-row:last-child { border-bottom: none; }
.plp-list-row:hover { background: rgba(var(--v-theme-on-surface), 0.035); }
.plp-list-row--inactive { opacity: 0.5; }

.plp-lh-check { display: flex; align-items: center; justify-content: center; }
.plp-lh-name, .plp-row-name { min-width: 0; }
.plp-row-name-text {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.plp-row-sku { font-size: 10px; opacity: 0.45; font-family: monospace; }
.plp-row-cat { display: flex; flex-wrap: wrap; gap: 3px; min-width: 0; }
.plp-row-branches { display: flex; flex-wrap: wrap; gap: 3px; }
.plp-row-price .plp-price-val { font-size: 13px; font-weight: 500; color: rgb(var(--v-theme-success)); }
.plp-row-stock { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 400; }
.plp-row-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0; }

.plp-tag {
  display: inline-flex;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 400;
  line-height: 1.4;
}
.plp-tag--cat {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
.plp-tag--sub {
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.65);
}
.plp-more { font-size: 10px; opacity: 0.5; font-weight: 400; }

/* List sin sucursales (cuando no es admin) */
.plp-list-head:not(:has(.plp-lh-branches)),
.plp-list-row:not(:has(.plp-row-branches)) {
  grid-template-columns: 32px 1fr 200px 100px 90px 64px;
}

/* ── RESPONSIVE ─────────────────────────────────────────── */
@media (max-width: 1200px) {
  .lp-methods { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 960px) {
  .lp { gap: 12px; }
  .lp-filters { padding: 10px 12px; }
  .lp-filters__cell--range { grid-column: auto; }
  .lp-stats   { grid-template-columns: repeat(2, 1fr); }
  .lp-methods { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 600px) {
  .lp-stats   { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .lp-methods { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .lp-kpi__val { font-size: 16px; }
  .lp-kpi__badge { width: 30px; height: 30px; }
  .lp-mc__val  { font-size: 13px; }
}

@media (max-width: 768px) {
  .plp-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
  .plp-list-head, .plp-list-row { grid-template-columns: 32px 1fr 120px 70px 64px; }
  .plp-lh-cat, .plp-row-cat { display: none; }
  .lp-bulk { padding: 8px 12px; min-height: 48px; }
  .lp-bulk__label { font-size: 12.5px; }
  .lp-filters__primary-field { flex: 0 0 100%; }
}

@media (max-width: 480px) {
  .lp-title { font-size: 18px; }
  .plp-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .plp-card-name { font-size: 12px; }
  .plp-card-price { font-size: 14px; }
  .lp-pagination { flex-direction: column; align-items: center; }
  .lp-content__body { padding: 10px; }
}

@media (max-width: 360px) {
  .plp-grid { grid-template-columns: 1fr; }
}

/* ── KIT badges ── */
.plp-kit-badge {
  position: absolute;
  bottom: 8px; left: 8px;
  display: inline-flex; align-items: center; gap: 3px;
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: #fff;
  font-size: 9.5px; font-weight: 600; letter-spacing: 0.5px;
  padding: 3px 7px; border-radius: 4px;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.45);
  text-transform: uppercase;
}
.plp-kit-pill {
  display: inline-flex; align-items: center; gap: 2px;
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: #fff;
  font-size: 9px; font-weight: 600; letter-spacing: 0.4px;
  padding: 2px 6px; border-radius: 4px;
  text-transform: uppercase;
  margin-right: 6px;
  vertical-align: 1px;
}
</style>
