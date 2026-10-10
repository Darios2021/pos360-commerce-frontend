<template>
  <div class="pfp-root pfx">
    <!-- Encabezado -->
    <div class="pfx-cab">
      <router-link :to="isEdit && draft?.id ? { name: 'productView', params: { id: draft.id } } : { name: 'products' }" class="pfx-volver">
        <v-icon size="18">mdi-chevron-left</v-icon>{{ isEdit ? "Volver al producto" : "Productos" }}
      </router-link>
      <h1 class="pfx-titulo">{{ isEdit ? (draft?.name || "Editar producto") : "Nuevo producto" }}</h1>
      <span v-if="isEdit && draft?.sku" class="pfx-sub num">SKU {{ draft.sku }}<template v-if="draft?.code"> · Código {{ draft.code }}</template></span>
    </div>

    <!-- Pasos -->
    <nav class="pfx-pasos" aria-label="Pasos">
      <template v-for="(p, i) in STEPS" :key="p.value">
        <button type="button" class="pfx-paso" :class="{ 'is-hecho': step > p.value, 'is-actual': step === p.value }"
          :disabled="!canGoTo(p.value)" @click="goToStep(p.value)">
          <span class="pfx-paso__n num"><v-icon v-if="step > p.value" size="18">mdi-check</v-icon><template v-else>{{ p.value }}</template></span>
          <span class="pfx-paso__txt"><span class="pfx-paso__tit">{{ p.title }}</span><span class="pfx-paso__sub">{{ p.sub }}</span></span>
        </button>
        <span v-if="i < STEPS.length - 1" class="pfx-paso__linea" :class="{ 'is-hecho': step > p.value }"></span>
      </template>
    </nav>

    <div v-if="initialLoading" class="pfx-cargando"><v-progress-circular indeterminate size="40" color="primary" /></div>

    <div v-else class="pfx-cuerpo" ref="mainRef">
      <section class="pfx-tarjeta">
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



        <!-- 1. Lo básico -->
        <div v-show="step === 1" class="pfx-paso-cont">
          <section class="pfx-seg"><div class="pfx-banda"><span>Qué es</span></div><div class="pfx-seg__in">
          <div class="pfx-g">
            <div class="pfx-c"><label>Descripción</label>
              <v-text-field v-model="draft.name" :disabled="busy" density="comfortable" variant="outlined" hide-details="auto"
                :error-messages="!draft.name && step1Touched ? ['Falta la descripción'] : []" />
            </div>
          </div>
          <div class="pfx-g pfx-g--3">
            <div class="pfx-c"><label>Rubro</label>
              <v-select v-model="draftCategoryId" :items="categoriesList" item-title="name" item-value="id" :disabled="busy"
                density="comfortable" variant="outlined" hide-details="auto" clearable :menu-props="{ maxHeight: 360 }"
                :error-messages="!draftCategoryId && step1Touched ? ['Falta el rubro'] : []" />
            </div>
            <div class="pfx-c"><label>Subrubro</label>
              <v-select v-model="draftSubcategoryId" :items="filteredSubcategories" item-title="name" item-value="id"
                :disabled="busy || !draftCategoryId" density="comfortable" variant="outlined" hide-details="auto" clearable
                :menu-props="{ maxHeight: 360 }" :error-messages="!draftSubcategoryId && step1Touched ? ['Falta el subrubro'] : []" />
            </div>
            <div class="pfx-c"><label>Marca <i>· opcional</i></label>
              <v-text-field v-model="draft.brand" :disabled="busy" density="comfortable" variant="outlined" hide-details />
            </div>
          </div>
          <div class="pfx-g pfx-g--2">
            <div class="pfx-c"><label>Código de barras</label>
              <div class="pfx-barras">
                <v-text-field v-model="draft.barcode" :disabled="busy" density="comfortable" variant="outlined" hide-details class="num"
                  :placeholder="!isEdit && barcodePreview ? `${barcodePreview} · automático` : 'Escanear o escribir'" />
                <BarcodeScanButton v-if="!isEdit" mode="emit-product" label="" title="Escanear código" icon="mdi-barcode-scan"
                  color="primary" variant="text" size="small" density="compact" class="pfx-barras__btn"
                  @product="onScannedProduct" @scanned="onScannedCode" />
              </div>
            </div>
            <div class="pfx-c"><label>Código</label>
              <div class="pfx-fijo num">{{ draft.code || nextCodePreview || "—" }}<span v-if="!isEdit"> · automático</span></div>
            </div>
          </div>
          </div></section>
          <section class="pfx-seg"><div class="pfx-banda"><span>Costo y precios</span></div><div class="pfx-seg__in">
          <div class="pfx-g pfx-g--precio">
            <div class="pfx-c"><label>Costo en</label>
              <div class="pfn-seg" role="group" aria-label="Moneda del costo">
                <button type="button" :class="{ 'is-on': !costoEnDolares }" :disabled="busy" @click="setMoneda(null)">$</button>
                <button type="button" :class="{ 'is-on': costoEnDolares }" :disabled="busy" @click="setMoneda('USD')">US$</button>
              </div>
            </div>
            <div class="pfx-c"><label>Costo</label>
              <CampoPlata v-model="draft.cost" :moneda="costoEnDolares ? 'USD' : 'ARS'" :disabled="busy" hide-details />
            </div>
            <div class="pfx-c"><label>% de ganancia</label>
              <v-text-field v-model="draft.markup_pct" :disabled="busy" density="comfortable" variant="outlined" type="number" min="0" suffix="%" hide-details />
            </div>
            <div class="pfx-c"><label>IVA</label>
              <v-select v-model="draft.tax_rate" :items="IVAS" item-title="t" item-value="v" :disabled="busy" density="comfortable" variant="outlined" hide-details />
            </div>
          </div>
          <div v-if="costoEnDolares || cuentaLista" class="pfx-nota num">
            <template v-if="costoEnDolares">
              <template v-if="fxCargando">Buscando la cotización…</template>
              <template v-else-if="num(draft.fx_rate, 0) > 0">Dólar $ {{ fmtCot(draft.fx_rate) }}</template>
              <template v-else>Sin cotización</template>
              · <a href="#" class="pfn-link" @click.prevent="traerCotizacion">Usar la de hoy</a>
              <span v-if="fxError" class="pfn-error"> · {{ fxError }}</span>
              <template v-if="cuentaLista"><br /></template>
            </template>
            <span v-if="cuentaLista">{{ cuentaLista }}</span>
          </div>

          <!-- Los tres precios de venta, lo que más importa de la tarjeta -->
          <div class="pfx-tres">
            <div class="pfx-precio">
              <div class="pfx-precio__cab"><label>Precio contado</label><i>opcional</i></div>
              <CampoPlata v-model="draft.price_discount" :disabled="busy" :error-messages="fieldErr('price_discount')" />
            </div>
            <div class="pfx-precio pfx-precio--lista" :class="{ 'pfx-calculado': listaCalculada }">
              <div class="pfx-precio__cab"><label>Precio lista</label>
                <label class="pfx-sw pfx-sw--chico"><v-switch v-model="listaCalculada" inset density="compact" hide-details color="primary" :disabled="busy" />Calculada</label>
              </div>
              <CampoPlata :model-value="draft.price_list" :disabled="busy" :error-messages="fieldErr('price_list')" @update:model-value="onListaAMano" />
            </div>
            <div class="pfx-precio">
              <div class="pfx-precio__cab"><label>Precio revendedor</label><i>opcional</i></div>
              <CampoPlata v-model="draft.price_reseller" :disabled="busy" :error-messages="fieldErr('price_reseller')" />
            </div>
          </div>
          </div></section>
        </div>

        <!-- 2. Stock -->
        <div v-show="step === 2" class="pfx-paso-cont">
          <section class="pfx-seg"><div class="pfx-banda"><span>Stock por sucursal</span></div><div class="pfx-seg__in">
          <div class="pfx-stock">
            <ProductStockPanel :product-id="draft?.id || null" v-model="stockMatrix" :disabled="busy" />
          </div>
          </div></section>
          <section class="pfx-seg"><div class="pfx-banda"><span>Control de stock</span></div><div class="pfx-seg__in">
          <div class="pfx-g pfx-g--abajo" style="grid-template-columns: 200px 1fr">
            <div class="pfx-c"><label>Stock mínimo <i>· opcional</i></label>
              <v-text-field v-model="draft.min_stock" :disabled="busy" density="comfortable" variant="outlined" type="number" min="0" hide-details />
            </div>
            <div class="pfx-toggles">
              <label class="pfx-sw"><v-switch v-model="draft.is_active" inset density="compact" hide-details color="primary" :disabled="busy" />Activo</label>
              <label class="pfx-sw"><v-switch v-model="draft.track_stock" inset density="compact" hide-details color="primary" :disabled="busy" />Controla stock</label>
            </div>
          </div>
          </div></section>
        </div>

        <!-- 3. Fotos -->
        <div v-show="step === 3" class="pfx-paso-cont">
          <section class="pfx-seg"><div class="pfx-banda"><span>Fotos</span></div><div class="pfx-seg__in">
          <div class="pfx-fotos">
            <ProductImagesPanel :product-id="draft?.id || null" v-model="queuedImages" @changed="onQueuedChanged" />
          </div>
          </div></section>
        </div>

        <!-- 4. Más datos -->
        <div v-show="step === 4" class="pfx-paso-cont">
          <section class="pfx-seg"><div class="pfx-banda"><span>Compra y ficha</span></div><div class="pfx-seg__in">
          <div class="pfx-g pfx-g--3">
            <div class="pfx-c"><label>Proveedor</label>
              <v-autocomplete v-model="draft.supplier_id" :items="proveedores" item-title="name" item-value="id"
                :loading="proveedoresCargando" :disabled="busy" density="comfortable" variant="outlined"
                clearable hide-details no-filter placeholder="Elegir o agregar" @update:search="buscarProveedores">
                <template #no-data>
                  <div class="pa-2">
                    <v-btn v-if="proveedorBuscado" size="small" variant="tonal" color="primary" :loading="creandoProveedor" @click="crearProveedor">
                      Agregar «{{ proveedorBuscado }}»
                    </v-btn>
                    <span v-else class="text-caption text-medium-emphasis">Escribí el nombre</span>
                  </div>
                </template>
              </v-autocomplete>
            </div>
            <div class="pfx-c"><label>Código del proveedor</label>
              <v-text-field v-model="draft.supplier_code" :disabled="busy" density="comfortable" variant="outlined" hide-details />
            </div>
            <div class="pfx-c"><label>Fecha de compra</label>
              <v-text-field v-model="draft.purchase_date" :disabled="busy" density="comfortable" variant="outlined" type="date" hide-details />
            </div>
            <div class="pfx-c"><label>Modelo</label>
              <v-text-field v-model="draft.model" :disabled="busy" density="comfortable" variant="outlined" hide-details />
            </div>
            <div class="pfx-c"><label>Unidad</label>
              <v-select v-model="draft.unit" :items="UNIDADES" :disabled="busy" density="comfortable" variant="outlined" hide-details />
            </div>
            <div class="pfx-c"><label>Garantía</label>
              <v-select v-model="draft.warranty_months" :items="GARANTIAS" item-title="t" item-value="v" :disabled="busy" density="comfortable" variant="outlined" hide-details />
            </div>
            <div class="pfx-c"><label>Ubicación</label>
              <v-text-field v-model="draft.location" :disabled="busy" density="comfortable" variant="outlined" hide-details placeholder="Ej.: estante B3" />
            </div>
            <div class="pfx-c"><label>Precio instalador</label>
              <CampoPlata v-model="draft.price_installer" :disabled="busy" hide-details />
            </div>
          </div>

          <div class="pfx-fila">
            <v-icon size="22">mdi-text-long</v-icon>
            <span class="pfx-fila__txt"><b>Detalle para la tienda</b><small>características, medidas, qué incluye</small></span>
            <a href="#" class="pfn-link" @click.prevent="verDetalle = !verDetalle">{{ verDetalle ? "Cerrar" : (draft.description ? "Editar" : "Escribir") }}</a>
          </div>
          <v-textarea v-if="verDetalle" v-model="draft.description" :disabled="busy" density="comfortable" variant="outlined" auto-grow rows="3" hide-details class="pfx-detalle" />

          </div></section>

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

                        <CampoPlata
                          v-model="draft.promo_price"
                          label="Precio en promoción *"
                          :disabled="busy"
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


          <div class="pfp-section pfp-step2-videos mt-4">
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
      </section>

      <!-- Así se ve en el POS -->
      <aside class="pfx-aside">
        <span class="pfx-aside__tit">Así se ve en el POS</span>
        <div class="pfx-vista">
          <div class="pfx-vista__foto">
            <img v-if="fotoVista" :src="fotoVista" alt="" />
            <v-icon v-else size="40">mdi-image-outline</v-icon>
          </div>
          <div class="pfx-vista__info">
            <span v-if="rubroVista" class="pfn-vista__rubro">{{ rubroVista }}</span>
            <span class="pfn-vista__nombre">{{ draft.name || "Descripción del producto" }}</span>
            <span class="pfn-vista__s num">{{ [draft.brand, draft.code || nextCodePreview].filter(Boolean).join(" · ") }}</span>
            <span class="pfn-vista__stock num" :class="stockTotalForm > 3 ? 'is-bien' : stockTotalForm > 0 ? 'is-bajo' : 'is-sin'"><i></i>{{ stockTotalForm > 0 ? `${stockTotalForm} en stock` : "sin stock" }}</span>
            <span class="pfx-vista__precio num">$ {{ fmtPeso(num(draft.price_discount, 0) || num(draft.price_list, 0)) }}
              <small v-if="num(draft.price_discount, 0) && num(draft.price_list, 0) > num(draft.price_discount, 0)">lista $ {{ fmtPeso(draft.price_list) }}</small>
            </span>
          </div>
        </div>
        <dl v-if="gananciaLista" class="pfx-ganancia num">
          <dt>Ganancia en lista</dt><dd>$ {{ fmtPeso(gananciaLista.pesos) }} · {{ gananciaLista.pct }} %</dd>
          <dt>IVA incluido</dt><dd>$ {{ fmtPeso(gananciaLista.iva) }}</dd>
        </dl>
      </aside>
    </div>

    <!-- Pie fijo: un solo botón -->
    <div class="pfx-pie">
      <div class="pfx-pie__in">
        <a v-if="step > 1" href="#" class="pfx-ant" @click.prevent="prevStep"><v-icon size="20">mdi-chevron-left</v-icon>Anterior</a>
        <a v-else href="#" class="pfx-ant" @click.prevent="onCancel">Cancelar</a>
        <span class="pfx-esp"></span>
        <a v-if="step < 4 && (isEdit || step >= 2)" href="#" class="pfn-link" @click.prevent="guardar">{{ isEdit ? "Guardar ya" : "Guardar ya" }}</a>
        <span class="pfx-pie__n num">Paso {{ step }} de 4</span>
        <v-btn color="primary" variant="flat" class="pfx-sig" :loading="busy" :disabled="busy" @click="step < 4 ? nextStep() : guardar()">
          {{ step < 4 ? "Siguiente" : (isEdit ? "Guardar cambios" : "Guardar producto") }}
          <v-icon v-if="step < 4" end size="20">mdi-chevron-right</v-icon>
        </v-btn>
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
import CampoPlata from "@/app/components/CampoPlata.vue";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import http from "../../../app/api/http";
import { fetchOfficialUsdRate } from "@/modules/budgets/services/fx.service";
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
  { value: 1, title: "Lo básico", sub: "obligatorio" },
  { value: 2, title: "Stock", sub: "opcional" },
  { value: 3, title: "Fotos", sub: "opcional" },
  { value: 4, title: "Más datos", sub: "opcional" },
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
    cost: null, tax_rate: 21, markup_pct: null,
    supplier_id: null, supplier_code: "", unit: "unidad", location: "", purchase_date: null, min_stock: null,
    cost_currency: null, fx_rate: null, price_installer: null,
    warranty_months: 0,
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

/* ── Costo en dólares: cotización oficial (la misma fuente que presupuestos) ── */
const costoEnDolares = computed(() => draft.value?.cost_currency === "USD");
const fxCargando = ref(false);
const fxError = ref("");
function fmtCot(v) { return num(v, 0).toLocaleString("es-AR", { maximumFractionDigits: 2 }); }
async function traerCotizacion() {
  fxCargando.value = true; fxError.value = "";
  try {
    const fx = await fetchOfficialUsdRate();
    draft.value.fx_rate = fx.rate;
  } catch (e) {
    fxError.value = e?.message || "No se pudo traer la cotización";
  } finally { fxCargando.value = false; }
}
function setMoneda(m) {
  draft.value.cost_currency = m;
  if (m === "USD" && !(num(draft.value?.fx_rate, 0) > 0)) traerCotizacion();
}

/* ── Pasos: guardar desde cualquier paso y detalle plegable ── */
const verDetalle = ref(false);
function guardar() { return isEdit.value ? saveAll() : createAll(); }
const fotoVista = computed(() => {
  const q = arr(queuedImages.value)[0];
  if (q) return q.url || q.preview || (q instanceof File ? URL.createObjectURL(q) : "");
  const imgs = arr(draft.value?.images);
  const f = imgs[0];
  return f ? (typeof f === "string" ? f : f.url || f.image_url || "") : "";
});

/* ── Vista previa de la derecha ── */
const GARANTIAS = [
  { t: "Sin garantía", v: 0 }, { t: "3 meses", v: 3 }, { t: "6 meses", v: 6 },
  { t: "12 meses", v: 12 }, { t: "24 meses", v: 24 },
];
const rubroVista = computed(() => {
  const c = categoriesList.value?.find?.((x) => Number(x.id) === Number(draftCategoryId.value))?.name;
  const sc = filteredSubcategories.value?.find?.((x) => Number(x.id) === Number(draftSubcategoryId.value))?.name;
  return [c, sc].filter(Boolean).join(" › ");
});
const stockTotalForm = computed(() => arr(stockMatrix.value).reduce((a, r) => a + Math.max(0, num(r.qty, 0)), 0));
function fmtPeso(v) { return Math.round(num(v, 0)).toLocaleString("es-AR"); }
const gananciaLista = computed(() => {
  const lista = num(draft.value?.price_list, 0), costo = costoEnPesos();
  if (!(lista > 0) || !(costo > 0)) return null;
  const iva = num(draft.value?.tax_rate, 0);
  const sinIva = lista / (1 + iva / 100);
  return { pesos: sinIva - costo, pct: Math.round(((sinIva - costo) / costo) * 100), iva: lista - sinIva };
});

/* ── Compra: proveedores y unidades ── */
const UNIDADES = [
  { title: "Unidad", value: "unidad" }, { title: "Metro", value: "metro" }, { title: "Caja", value: "caja" },
  { title: "Par", value: "par" }, { title: "Kilo", value: "kg" }, { title: "Litro", value: "litro" },
];
const proveedores = ref([]);
const proveedoresCargando = ref(false);
const proveedorBuscado = ref("");
const creandoProveedor = ref(false);
let tProv = null;
async function cargarProveedores(q = "") {
  proveedoresCargando.value = true;
  try {
    const { data } = await http.get("/products/suppliers", { params: { q } });
    const lista = Array.isArray(data?.data) ? data.data : [];
    // El elegido siempre queda en la lista, aunque no coincida con la búsqueda
    const actual = proveedores.value.find((p) => Number(p.id) === Number(draft.value?.supplier_id));
    proveedores.value = actual && !lista.some((p) => p.id === actual.id) ? [actual, ...lista] : lista;
  } catch { /* sin proveedores el campo queda vacío */ } finally { proveedoresCargando.value = false; }
}
function buscarProveedores(q) {
  proveedorBuscado.value = String(q || "").trim();
  clearTimeout(tProv);
  tProv = setTimeout(() => cargarProveedores(proveedorBuscado.value), 250);
}
async function crearProveedor() {
  const name = proveedorBuscado.value;
  if (!name) return;
  creandoProveedor.value = true;
  try {
    const { data } = await http.post("/products/suppliers", { name });
    const p = data?.data;
    if (p?.id) {
      proveedores.value = [p, ...proveedores.value.filter((x) => x.id !== p.id)];
      draft.value.supplier_id = p.id;
    }
  } catch (e) {
    toast(e?.response?.data?.message || "No se pudo agregar el proveedor");
  } finally { creandoProveedor.value = false; }
}
onMounted(() => cargarProveedores(""));

/* ── Lista calculada: costo + % de ganancia + IVA ── */
const IVAS = [{ t: "21 %", v: 21 }, { t: "10,5 %", v: 10.5 }, { t: "27 %", v: 27 }, { t: "Exento", v: 0 }];
const listaCalculada = ref(true);
// Costo en pesos: el costo tal cual. En dólares: costo × cotización guardada.
function costoEnPesos() {
  const c = num(draft.value?.cost, 0);
  if (draft.value?.cost_currency !== "USD") return c;
  const r = num(draft.value?.fx_rate, 0);
  return r > 0 ? c * r : 0;
}
function listaDesdeCosto() {
  const c = costoEnPesos(), g = draft.value?.markup_pct;
  if (!(c > 0) || g === "" || g == null) return null;
  return Math.round(c * (1 + num(g, 0) / 100) * (1 + num(draft.value?.tax_rate, 0) / 100));
}
const cuentaLista = computed(() => {
  const c = costoEnPesos(), g = draft.value?.markup_pct;
  if (!(c > 0) || g === "" || g == null) return "";
  const conGanancia = c * (1 + num(g, 0) / 100);
  const iva = num(draft.value?.tax_rate, 0);
  const conIva = conGanancia * (1 + iva / 100);
  const f = (n) => "$ " + n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
  const enDolares = draft.value?.cost_currency === "USD"
    ? `US$ ${num(draft.value?.cost, 0).toLocaleString("es-AR")} × ${f(num(draft.value?.fx_rate, 0))} = ` : "";
  return `${enDolares}${f(c)} de costo + ${num(g, 0)} % = ${f(conGanancia)}` + (iva ? ` · + IVA ${iva} % = ${f(conIva)}` : "") + ` → lista ${f(Math.round(conIva))}`;
});
watch(() => [draft.value?.cost, draft.value?.markup_pct, draft.value?.tax_rate, draft.value?.cost_currency, draft.value?.fx_rate, listaCalculada.value], () => {
  if (!listaCalculada.value) return;
  const l = listaDesdeCosto();
  if (l != null && num(draft.value?.price_list, 0) !== l) draft.value.price_list = l;
});
function onListaAMano(v) {
  draft.value.price_list = v;
  const l = listaDesdeCosto();
  if (listaCalculada.value && l != null && num(v, 0) !== l) listaCalculada.value = false;
}
// Al abrir un producto existente: calculada solo si se guardó con % de ganancia
watch(() => draft.value?.id, (id, viejo) => {
  if (!id || id === viejo) return;
  // La API devuelve los decimales como texto ("21.00"): el selector de IVA compara números
  if (draft.value.tax_rate != null) draft.value.tax_rate = num(draft.value.tax_rate, 21);
  if (draft.value.min_stock != null) draft.value.min_stock = num(draft.value.min_stock, 0);
  if (draft.value.fx_rate != null) draft.value.fx_rate = num(draft.value.fx_rate, 0) || null;
  if (draft.value.price_installer != null) draft.value.price_installer = num(draft.value.price_installer, 0);
  if (draft.value.purchase_date) draft.value.purchase_date = String(draft.value.purchase_date).slice(0, 10);
  if (!draft.value.unit) draft.value.unit = "unidad";
  draft.value.warranty_months = num(draft.value.warranty_months, 0);
  listaCalculada.value = draft.value?.markup_pct != null && draft.value?.markup_pct !== "";
});

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
// Los pasos se navegan libres desde el indicador; lo obligatorio del paso 1
// lo exige el guardado (y queda marcado en rojo al volver).
function canGoTo() { return true; }

function goToStep(target) {
  const t = toInt(target, 1);
  if (step.value === 1 && t !== 1) step1Touched.value = true;
  step.value = Math.min(4, Math.max(1, t));
  if (mainRef.value) mainRef.value.scrollTop = 0;
}
function prevStep() { step.value = Math.max(1, step.value - 1); if (mainRef.value) mainRef.value.scrollTop = 0; }
function nextStep() {
  if (step.value === 1) {
    step1Touched.value = true;
    const errs = validateDatos();
    if (errs) return showValidation(errs, "Completá estos campos antes de continuar:");
  }
  step.value = Math.min(4, step.value + 1);
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
// El código de barras que la API genera si queda vacío: EAN-13 interno
// (prefijo 2) con el número del producto, el mismo del código P000000876.
const barcodePreview = computed(() => {
  const n = toInt(String(nextCodePreview.value || "").replace(/\D/g, ""), 0);
  if (!n) return "";
  const base = `2${String(n).padStart(11, "0")}`;
  let suma = 0;
  for (let i = 0; i < 12; i++) suma += Number(base[i]) * (i % 2 ? 3 : 1);
  return base + String((10 - (suma % 10)) % 10);
});
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
  const payload = { ...draft.value, name: String(draft.value?.name || "").trim(), description: String(draft.value?.description || "").trim(), brand: String(draft.value?.brand || "").trim(), model: String(draft.value?.model || "").trim(), category_id: toInt(getCategoryIdFromDraft(draft.value), 0) || null, subcategory_id: toInt(getSubcategoryIdFromDraft(draft.value), 0) || null, price_list: num(draft.value?.price_list, 0), price_discount: num(draft.value?.price_discount, 0), price_reseller: num(draft.value?.price_reseller, 0), cost: num(draft.value?.cost, 0), tax_rate: num(draft.value?.tax_rate, 21), markup_pct: draft.value?.markup_pct === "" || draft.value?.markup_pct == null ? null : num(draft.value.markup_pct, 0) };
  // Compra: vacíos → null
  for (const k of ["supplier_code", "unit", "location"]) payload[k] = String(draft.value?.[k] ?? "").trim() || null;
  payload.purchase_date = String(draft.value?.purchase_date || "").slice(0, 10) || null;
  payload.min_stock = draft.value?.min_stock === "" || draft.value?.min_stock == null ? null : num(draft.value.min_stock, 0);
  payload.supplier_id = toInt(draft.value?.supplier_id, 0) || null;
  payload.cost_currency = draft.value?.cost_currency === "USD" ? "USD" : null;
  payload.fx_rate = payload.cost_currency ? (num(draft.value?.fx_rate, 0) || null) : null;
  payload.price_installer = draft.value?.price_installer === "" || draft.value?.price_installer == null ? null : num(draft.value.price_installer, 0);
  // Lista a mano: no queda guardado un % que no la explica
  if (!listaCalculada.value) payload.markup_pct = null;
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

/* Mobile steps — minimal: progress segmentado + texto inline */
.pfp-steps-mobile {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1;
  padding: 0;
  background: transparent;
  border: none;
}
.v-theme--adminDark .pfp-steps-mobile,
.v-theme--shopDark .pfp-steps-mobile,
.v-theme--dark .pfp-steps-mobile {
  background: transparent;
  border: none;
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
/* Track segmentado tipo Apple/Linear */
.pfp-step-mobile-track {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}
.pfp-step-mobile-seg {
  height: 3px;
  border-radius: 999px;
  background: rgba(20, 136, 209, 0.18);
  transition: background 0.25s;
}
.pfp-step-mobile-seg.done {
  background: rgba(20, 136, 209, 0.85);
}
.pfp-step-mobile-seg.active {
  background: #1488d1;
  box-shadow: 0 0 8px rgba(20, 136, 209, 0.5);
}

/* Texto inline */
.pfp-step-mobile-text {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  line-height: 1.2;
  letter-spacing: -0.005em;
  padding-left: 1px;
}
.pfp-step-mobile-counter {
  font-weight: 600;
  color: #1488d1;
  font-variant-numeric: tabular-nums;
}
.pfp-step-mobile-dot {
  color: rgba(var(--v-theme-on-surface), 0.3);
}
.pfp-step-mobile-name {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

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

/* ══ Escaneo (mobile, solo creación) — link inline minimal ══ */
.pfp-scan-row {
  display: flex;
  justify-content: flex-start;
  margin: -2px 0 8px;
  padding: 0;
  background: transparent;
  border: none;
}
.pfp-scan-btn {
  /* link-style, sin card alrededor */
}
.pfp-scan-btn :deep(.v-btn__content) {
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  gap: 6px;
}
.pfp-scan-btn :deep(.v-icon) {
  font-size: 16px !important;
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

<style>
/* Encabezado y piezas del alta rediseñada (sin scoped, prefijo pfn) */
.pfn-cab { display: flex; flex-direction: column; gap: 3px; padding: 18px 24px 4px; }
.pfn-volver { display: inline-flex; align-items: center; font-size: 14px; font-weight: 700; color: #0f6fae; text-decoration: none; margin-left: -4px; }
.v-theme--dark .pfn-volver { color: #5aaee0; }
.pfn-volver:hover { text-decoration: underline; }
.pfn-titulo { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; }
.pfn-sub { font-size: 14px; font-weight: 600; opacity: .7; font-variant-numeric: tabular-nums; }
.pfn-cuenta { margin: 10px 0 4px; padding: 10px 12px; border-radius: 8px; background: rgba(15, 111, 174, 0.07); font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
.pfn-calculado .v-field { background: rgba(15, 111, 174, 0.07); font-weight: 800; }
.pfn-check { display: flex; align-items: center; gap: 4px; margin-top: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
.pfn-cancelar { font-size: 14px; font-weight: 700; color: inherit; opacity: .7; text-decoration: none; margin-right: 16px; }
.pfn-cancelar:hover { text-decoration: underline; }
.pfn-moneda { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.pfn-moneda__tit { font-size: 13px; font-weight: 700; opacity: .75; }
.pfn-seg { display: flex; gap: 2px; padding: 3px; border-radius: 8px; border: 1px solid rgba(var(--v-border-color), 0.25); }
.pfn-seg button { height: 30px; padding: 0 12px; border: 0; border-radius: 6px; background: transparent; font-family: inherit; font-size: 13px; font-weight: 700; color: inherit; cursor: pointer; }
.pfn-seg button.is-on { background: #0f6fae; color: #ffffff; }
.pfn-moneda__fx { display: inline-flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
.pfn-link { color: #0f6fae; font-weight: 800; text-decoration: none; }
.v-theme--dark .pfn-link { color: #5aaee0; }
.pfn-link:hover { text-decoration: underline; }
.pfn-error { font-size: 13px; font-weight: 700; color: #b23b35; }

/* ── Alta rediseñada (maqueta ProductoNuevo) ── */
.pos-container:has(.pfp-root) { max-width: none !important; padding: 0 !important; margin: 0 !important; }
.pfp-root { --pfn-fondo: #d6e6f3; --pfn-caja: #ffffff; --pfn-borde: #d3dde7; --pfn-linea: #eef2f6; --pfn-suave: #5a6678; background: var(--pfn-fondo) !important; }
.v-theme--dark .pfp-root { --pfn-fondo: #0b0f14; --pfn-caja: #151c25; --pfn-borde: #253141; --pfn-linea: #222c39; --pfn-suave: #9aa8b8; }
.pfp-root .pfp-content { max-width: 1340px; margin: 0 auto; padding-top: 4px; }
.pfn-cab { max-width: 1340px; margin: 0 auto; box-sizing: border-box; width: 100%; }
.pfn-grilla { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: start; }
.pfn-main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.pfn-caja { border-radius: 12px; overflow: hidden; background: var(--pfn-caja); border: 1px solid var(--pfn-borde); }
.pfn-banda { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #0f6fae; color: #ffffff; font-size: 15px; font-weight: 800; }
.v-theme--dark .pfn-banda { background: #0f5f96; }
.pfn-banda small { font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, 0.85); }
.pfn-cuerpo { padding: 14px 16px; }
.pfn-campos { display: grid; gap: 12px; padding: 14px 16px; }
.pfn-campos--tres { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.pfn-ancho { grid-column: 1 / -1; }
.pfn-ancho2 { grid-column: span 2; }
.pfn-barras { position: relative; }
.pfn-barras__btn { position: absolute !important; right: 4px; top: 50%; transform: translateY(-50%); min-width: 0 !important; }
.pfn-pie { padding: 0 16px 12px; font-size: 13px; font-weight: 600; color: var(--pfn-suave); }
.pfn-stock { border-top: 1px solid var(--pfn-linea); }
.pfn-toggles { display: flex; gap: 26px; padding: 6px 16px 10px; border-top: 1px solid var(--pfn-linea); }
.pfn-aside { position: sticky; top: 8px; display: flex; flex-direction: column; gap: 10px; }
.pfn-aside__tit { font-size: 13px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; color: var(--pfn-suave); margin-top: 4px; }
.pfn-vista { display: flex; flex-direction: column; gap: 3px; padding: 12px 14px; }
.pfn-vista__rubro { font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #3f8fc6; }
.pfn-vista__nombre { font-size: 15px; font-weight: 800; line-height: 1.2; }
.pfn-vista__s { font-size: 12px; color: var(--pfn-suave); }
.pfn-vista__stock { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--pfn-suave); }
.pfn-vista__stock i { width: 8px; height: 8px; border-radius: 9999px; display: block; background: #C3C9D6; }
.pfn-vista__stock.is-bien { color: #1f7a5f; } .pfn-vista__stock.is-bien i { background: #2E9E7B; }
.pfn-vista__stock.is-bajo i { background: #8cc0e3; }
.pfn-vista__precio { margin-top: 6px; font-size: 20px; font-weight: 800; }
.pfn-ganancia { display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; padding: 12px 14px; font-size: 14px; }
.pfn-ganancia dt { color: var(--pfn-suave); font-weight: 600; }
.pfn-ganancia dd { margin: 0; text-align: right; font-weight: 800; }
/* Panel de fotos dentro de la columna derecha: sin título repetido, zona blanca */
.pfn-aside .pi-root { padding: 12px; }
.pfn-aside .pi-root > div:first-of-type > div:first-child { display: none !important; }
.pfn-aside .pi-root > div:first-of-type { justify-content: flex-end !important; }
.pfn-aside .pi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
.pfn-aside .pi-card { min-width: 0 !important; width: auto !important; }
.pfn-aside .pi-dropzone { background: var(--pfn-caja) !important; border: 2px dashed #8cc0e3 !important; border-radius: 10px !important; }
/* Promoción y kit apagados: fila blanca con su interruptor, como en la maqueta */
.pfp-root .pfp-promo-section:not(.pfp-promo-on) .pfp-section-head,
.pfp-root .pfp-kit-section:not(.pfp-kit-on) .pfp-section-head { background: var(--pfn-caja) !important; }
.pfp-root .pfp-promo-section:not(.pfp-promo-on) .pfp-section-title,
.pfp-root .pfp-kit-section:not(.pfp-kit-on) .pfp-section-title { color: rgb(var(--v-theme-on-surface)) !important; font-weight: 700 !important; }
/* Bloques que se conservan (promoción, kit, videos): sin subtítulos que explican */
.pfp-root .pfp-section-sub { display: none !important; }
.pfp-root .pfp-section.mt-4 { margin-top: 0 !important; }
.pfp-root .pfn-main .pfp-section { background: var(--pfn-caja) !important; }
@media (max-width: 1100px) {
  .pfn-grilla { grid-template-columns: minmax(0, 1fr); }
  .pfn-aside { position: static; }
}
@media (max-width: 700px) {
  .pfn-campos--tres { grid-template-columns: minmax(0, 1fr); }
  .pfn-ancho2 { grid-column: auto; }
}
/* Secciones con la banda azul del rediseño */
.pfp-root .pfp-section { border-radius: 12px !important; border: 1px solid rgba(var(--v-border-color), 0.16) !important; overflow: hidden; box-shadow: none !important; }
.pfp-root .pfp-section-head { background: #0f6fae !important; color: #ffffff !important; border: 0 !important; padding: 12px 16px !important; }
.v-theme--dark .pfp-root .pfp-section-head { background: #0f5f96 !important; }
.pfp-root .pfp-section-head::before { display: none !important; }
.pfp-root .pfp-section-icon { display: none !important; }
.pfp-root .pfp-section-title { color: #ffffff !important; font-size: 15px !important; font-weight: 800 !important; }
.pfp-root .pfp-section-sub { color: rgba(255, 255, 255, 0.8) !important; }
.pfp-root .pfp-section-head .v-btn { color: #ffffff !important; }
</style>

<style>
/* ══ Alta y edición en 4 pasos (maqueta ProductoPaso1-4). Prefijo pfx, sin scoped ══ */
.pos-container:has(.pfx) { max-width: none !important; padding: 0 !important; margin: 0 !important; }
.pfx {
  --x-fondo: #d6e6f3; --x-caja: #ffffff; --x-borde: #d3dde7; --x-campo: #c9d5e1; --x-linea: #eef2f6;
  --x-texto: #0f172a; --x-suave: #5a6678; --x-tenue: #94a3b8; --x-acento: #0f6fae;
  min-height: calc(100vh - 56px); background: var(--x-fondo) !important; color: var(--x-texto);
  display: flex; flex-direction: column; box-sizing: border-box;
}
.v-theme--dark .pfx {
  --x-fondo: #0b0f14; --x-caja: #151c25; --x-borde: #253141; --x-campo: #33425a; --x-linea: #222c39;
  --x-texto: #e5edf5; --x-suave: #9aa8b8; --x-tenue: #64748b; --x-acento: #5aaee0;
}
.pfx > .pfx-cab, .pfx > .pfx-pasos, .pfx > .pfx-cuerpo, .pfx > .pfx-cargando { max-width: 1240px; width: calc(100% - 56px); margin-left: auto; margin-right: auto; box-sizing: border-box; }
.pfx .num { font-variant-numeric: tabular-nums; }

.pfx-cab { display: flex; flex-direction: column; gap: 2px; padding: 20px 0 14px; }
.pfx-volver { display: inline-flex; align-items: center; font-size: 14px; font-weight: 700; color: var(--x-acento); text-decoration: none; margin-left: -4px; }
.pfx-volver:hover { text-decoration: underline; }
.pfx-titulo { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; }
.pfx-sub { font-size: 14px; font-weight: 600; color: var(--x-suave); }

/* barra de pasos */
.pfx-pasos { display: flex; align-items: center; padding: 14px 20px; border-radius: 12px; background: var(--x-caja); border: 1px solid var(--x-borde); margin-bottom: 18px !important; }
.pfx-paso { display: flex; align-items: center; gap: 10px; flex-shrink: 0; border: 0; background: transparent; padding: 0; font-family: inherit; color: inherit; cursor: pointer; text-align: left; }
.pfx-paso:disabled { cursor: default; }
.pfx-paso__n { width: 34px; height: 34px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; box-sizing: border-box; background: var(--x-caja); color: var(--x-tenue); border: 2px solid var(--x-campo); }
.pfx-paso.is-actual .pfx-paso__n { background: #0f6fae; color: #ffffff; border-color: #0f6fae; box-shadow: 0 0 0 4px rgba(15, 111, 174, 0.18); }
.pfx-paso.is-hecho .pfx-paso__n { background: #2E9E7B; color: #ffffff; border-color: #2E9E7B; }
.pfx-paso__txt { display: flex; flex-direction: column; }
.pfx-paso__tit { font-size: 15px; font-weight: 800; color: var(--x-tenue); }
.pfx-paso.is-actual .pfx-paso__tit { color: var(--x-texto); }
.pfx-paso.is-hecho .pfx-paso__tit { color: #1f7a5f; }
.pfx-paso__sub { font-size: 12px; color: var(--x-tenue); }
.pfx-paso__linea { flex: 1; height: 2px; margin: 0 16px; background: var(--x-borde); min-width: 16px; }
.pfx-paso__linea.is-hecho { background: #2E9E7B; }

/* cuerpo */
.pfx-cargando { display: flex; justify-content: center; padding: 60px 0; }
.pfx-cuerpo { display: flex; gap: 24px; align-items: flex-start; padding-bottom: 24px; }
.pfx-tarjeta { flex: 1; min-width: 0; box-sizing: border-box; }
.pfx-paso-cont { display: flex; flex-direction: column; gap: 18px; }
/* Cada grupo del paso es su propia tarjeta con la banda azul del sistema. */
.pfx-seg { border-radius: 12px; overflow: hidden; background: var(--x-caja); border: 1px solid var(--x-borde); }
.pfx-banda { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: #0f6fae; color: #ffffff; font-size: 15px; font-weight: 800; }
.v-theme--dark .pfx-banda { background: #0f5f96; }
.pfx-seg__in { display: flex; flex-direction: column; gap: 16px; padding: 18px 20px 20px; }
.pfx-enc h2 { margin: 0; font-size: 20px; font-weight: 800; }
.pfx-enc p { margin: 2px 0 0; font-size: 14px; color: var(--x-suave); }
.pfx-g { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); }
.pfx-g--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.pfx-g--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.pfx-g--precio { grid-template-columns: 130px minmax(0, 1fr) minmax(0, 1fr) 120px; }
/* Los tres precios: tarjetas con el importe grande. */
.pfx-tres { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.pfx-precio { display: flex; flex-direction: column; gap: 8px; padding: 14px 14px 16px; border-radius: 12px; background: var(--x-fondo); border: 1px solid var(--x-borde); min-width: 0; }
.pfx-precio--lista { background: #eef7fd; border: 2px solid #0f6fae; }
.v-theme--dark .pfx-precio--lista { background: #12324b; border-color: #5aaee0; }
.pfx-precio__cab { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 28px; }
.pfx-precio__cab > label:first-child { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #0a466e; }
.v-theme--dark .pfx-precio__cab > label:first-child { color: #9cc9ea; }
.pfx-precio__cab i { font-style: normal; font-size: 12px; font-weight: 600; color: var(--x-tenue); }
.pfx-precio .v-field { background: var(--x-caja); }
.pfx-precio .v-field__input, .pfx-precio .v-text-field__prefix { min-height: 60px; font-size: 26px !important; font-weight: 800; letter-spacing: -0.02em; }
.pfx-precio .v-text-field__prefix { font-size: 20px !important; opacity: .6; }
.pfx-sw--chico { font-size: 13px !important; font-weight: 700 !important; color: #0a466e !important; }
.pfx-sw--chico .v-switch { transform: scale(.85); transform-origin: right center; }
@media (max-width: 1100px) { .pfx-tres { grid-template-columns: 1fr; } }
.pfx-g--abajo { align-items: end; }
.pfx-c { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.pfx-c > label { font-size: 13px; font-weight: 700; color: var(--x-texto); opacity: .85; }
.pfx-c > label i { font-style: normal; font-weight: 600; color: var(--x-tenue); }
.pfx-sep { height: 1px; background: var(--x-linea); }
.pfx .pfn-seg { height: 48px; box-sizing: border-box; border-radius: 10px; border-color: rgba(var(--v-border-color), 0.28); }
.pfx .pfn-seg button { flex: 1; height: 100%; font-size: 15px; border-radius: 8px; }
.pfx-fijo { height: 46px; display: flex; align-items: center; padding: 0 14px; border-radius: 10px; background: var(--x-fondo); font-size: 15px; font-weight: 700; color: var(--x-suave); }
.pfx-barras { position: relative; }
.pfx-barras__btn { position: absolute !important; right: 6px; top: 50%; transform: translateY(-50%); min-width: 0 !important; }
.pfx-nota { font-size: 13px; font-weight: 700; color: var(--x-suave); margin-top: -6px; }
.pfx-cuenta { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; color: var(--x-suave); padding-bottom: 4px; }
.pfx-sw { display: inline-flex; align-items: center; gap: 4px; font-size: 15px; font-weight: 600; color: var(--x-texto); cursor: pointer; }
.pfx-toggles { display: flex; gap: 26px; padding-bottom: 6px; }
.pfx-stock { border: 1px solid var(--x-borde); border-radius: 10px; overflow: hidden; }
.pfx-fotos .pi-root { gap: 14px !important; }
.pfx-fotos .pi-root > div:first-of-type > div:first-child { display: none !important; }
.pfx-fotos .pi-dropzone { background: var(--x-caja) !important; border: 2px dashed #8cc0e3 !important; border-radius: 12px !important; min-height: 180px; }
.pfx-fila { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--x-linea); }
.pfx-fila > .v-icon { color: var(--x-tenue); }
.pfx-fila__txt { flex: 1; display: flex; flex-direction: column; }
.pfx-fila__txt b { font-size: 15px; }
.pfx-fila__txt small { font-size: 13px; color: var(--x-suave); }
.pfx-detalle { margin-top: -6px; }
.pfx .pfp-section { border: 0 !important; border-bottom: 1px solid var(--x-linea) !important; border-radius: 0 !important; background: transparent !important; margin: 0 !important; }
.pfx .pfp-section .pfp-section-head { background: transparent !important; padding: 12px 0 !important; }
.pfx .pfp-section .pfp-section-title { color: var(--x-texto) !important; font-weight: 700 !important; font-size: 15px !important; }
.pfx .pfp-section .pfp-section-head .v-btn { color: var(--x-acento) !important; }
.pfx .pfp-section .pfp-section-body { padding: 4px 0 14px !important; }

/* campos de Vuetify con la medida de la maqueta */
.pfx .v-field { border-radius: 10px !important; font-size: 16px; }
.pfx .v-field--variant-outlined .v-field__outline { --v-field-border-opacity: .28; }
.pfx .v-field--focused .v-field__outline { --v-field-border-width: 2px; }
.pfx .pfx-calculado .v-field { background: rgba(15, 111, 174, 0.07); }
.pfx .pfx-calculado input { font-weight: 800; color: #0a466e; }
.v-theme--dark .pfx .pfx-calculado input { color: #9cc9ea; }

/* vista previa */
.pfx-aside { width: 300px; flex-shrink: 0; position: sticky; top: 8px; display: flex; flex-direction: column; gap: 10px; }
.pfx-aside__tit { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--x-suave); }
.pfx-vista { border-radius: 12px; overflow: hidden; background: var(--x-caja); border: 1px solid var(--x-borde); }
.pfx-vista__foto { height: 170px; display: flex; align-items: center; justify-content: center; background: #ffffff; border-bottom: 1px solid var(--x-linea); color: #b7c4d3; }
.pfx-vista__foto img { max-width: 100%; height: 160px; object-fit: contain; }
.pfx-vista__info { padding: 12px 14px; display: flex; flex-direction: column; gap: 3px; }
.pfx-vista__precio { margin-top: 6px; font-size: 22px; font-weight: 800; display: flex; align-items: baseline; gap: 8px; }
.pfx-vista__precio small { font-size: 12px; font-weight: 600; color: var(--x-suave); }
.pfx-ganancia { display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; padding: 12px 14px; border-radius: 12px; background: var(--x-caja); border: 1px solid var(--x-borde); font-size: 14px; }
.pfx-ganancia dt { color: var(--x-suave); font-weight: 600; }
.pfx-ganancia dd { margin: 0; text-align: right; font-weight: 800; }

/* pie fijo */
.pfx-pie { position: sticky; bottom: 0; margin-top: auto; z-index: 5; background: var(--x-caja); border-top: 1px solid var(--x-borde); }
.pfx-pie__in { max-width: 1240px; width: calc(100% - 56px); margin: 0 auto; display: flex; align-items: center; gap: 18px; padding: 14px 0; }
.pfx-ant { display: inline-flex; align-items: center; gap: 2px; font-size: 15px; font-weight: 700; color: var(--x-suave); text-decoration: none; }
.pfx-ant:hover { color: var(--x-texto); }
.pfx-esp { flex: 1; }
.pfx-pie__n { font-size: 13px; font-weight: 700; color: var(--x-tenue); }
.pfx-sig { height: 46px !important; padding: 0 26px !important; border-radius: 10px !important; font-size: 15px !important; font-weight: 800 !important; text-transform: none !important; letter-spacing: 0 !important; }

@media (max-width: 1100px) {
  .pfx-cuerpo { flex-direction: column; }
  .pfx-aside { width: 100%; position: static; }
  .pfx-g--precio { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .pfx > .pfx-cab, .pfx > .pfx-pasos, .pfx > .pfx-cuerpo, .pfx-pie__in { width: calc(100% - 24px); }
  .pfx-tarjeta { padding: 18px 14px; }
  .pfx-g--2, .pfx-g--3, .pfx-g--precio { grid-template-columns: minmax(0, 1fr); }
  .pfx-paso__txt { display: none; }
  .pfx-paso.is-actual .pfx-paso__txt { display: flex; }
  .pfx-pie__n { display: none; }
  .pfx-pie { bottom: 64px; }
}
</style>
