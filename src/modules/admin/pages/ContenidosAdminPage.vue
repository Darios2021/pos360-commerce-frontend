<!-- /admin/contenidos — Gestión de contenidos: reels 9:16 hechos por el servicio
     de contenidos con el catálogo de la tienda (maqueta aprobada 10/10).
     Nuevo reel: catálogo con categorías, guion escena por escena (portada,
     productos, cierre) con la voz de cada una, vista previa y sonido.
     Videos: lo generado, con su avance. Vista completa, sin modales; la clave
     del servicio la pone la API. -->
<template>
  <div class="sp ct">
    <div class="sp-cab ct-cab">
      <div class="sp-cab__txt">
        <h1 class="sp-cab__titulo">Gestión de contenidos</h1>
        <span class="sp-cab__sub">{{ vista === "videos" ? `${piezas.length} ${piezas.length === 1 ? "video" : "videos"}` : "Reel 9:16 para Instagram, Facebook y WhatsApp" }}<template v-if="textoCupo"> · {{ textoCupo }}</template></span>
      </div>
      <div class="ct-tabs" role="tablist">
        <button type="button" role="tab" :class="{ 'is-on': vista === 'nuevo' }" @click="irA('nuevo')">Nuevo reel</button>
        <button type="button" role="tab" :class="{ 'is-on': vista === 'videos' || vista === 'publicar' }" @click="irA('videos')">Videos <span v-if="piezas.length" class="num">{{ piezas.length }}</span></button>
        <button type="button" role="tab" :class="{ 'is-on': vista === 'redes' }" @click="irA('redes')">Redes</button>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" closable @click:close="error = ''">{{ error }}</v-alert>

    <!-- NUEVO REEL: tres pasos navegables -->
    <template v-if="vista === 'nuevo'">
      <div class="ct-pasos">
        <button v-for="(s, i) in PASOS" :key="i" type="button" class="ct-paso" :class="{ 'is-on': paso === i + 1, 'is-ok': paso > i + 1 && (i === 0 || seleccion.length) }" :disabled="i > 1 && !seleccion.length" @click="paso = i + 1">
          <b><v-icon v-if="paso > i + 1 && (i === 0 || seleccion.length)" size="20">mdi-check</v-icon><template v-else>{{ i + 1 }}</template></b>
          <span><strong>{{ s.t }}</strong><small>{{ i === 0 ? formatoActual.t : i === 1 ? `${seleccion.length} ${seleccion.length === 1 ? "elegido" : "elegidos"}` : s.s }}</small></span>
        </button>
      </div>

      <!-- 1. Formato -->
      <template v-if="paso === 1">
      <div class="ct-formatos">
        <button v-for="f in FORMATOS" :key="f.v" type="button" class="ct-fmt" :class="{ 'is-on': formato === f.v }" @click="elegirFormato(f.v)">
          <span v-if="formato === f.v" class="ct-fmt__ok"><v-icon size="18">mdi-check</v-icon></span>
          <EscenaReel v-if="f.v === 'estrella'" tipo="item" :item="muestraEstrella" :fuente="fuente" :ancho="150" />
          <EscenaReel v-else tipo="intro" :apertura="formato === f.v ? aperturaVista : f.muestra ? { titular: f.muestra } : null" :fuente="fuente" :ancho="150" />
          <b>{{ f.t }}</b>
          <span>{{ f.s }}</span>
        </button>
      </div>

      <div class="sp-caja ct-pregunta">
        <div class="se-banda"><span>{{ formato === "problema" ? "La pregunta" : "Apertura del video" }}</span></div>
        <div class="ct-pregunta__cuerpo">
          <div class="ct-campo"><label>{{ formato === "problema" ? "Pregunta" : "Titular" }}</label><input v-model="apertura.titular" class="ct-titular" :maxlength="TOPE_TITULAR" @input="editarApertura" /></div>
          <div class="ct-campo"><label>Bajada</label><input v-model="apertura.bajada" maxlength="80" @input="editarApertura" /></div>
          <div v-if="opciones.voz" class="ct-campo"><label><v-icon size="15">mdi-account-voice</v-icon> Voz · apertura</label><textarea v-model="guion.intro" rows="2" maxlength="300" @input="guion.introEditada = true"></textarea></div>
        </div>
      </div>
      </template>

      <!-- 2. Productos -->
      <div v-else-if="paso === 2" class="ct-p1">
        <section class="ct-col">
          <div v-if="formato === 'ofertas'" class="sp-caja ct-desde">
            <b>Armar desde</b>
            <button type="button" class="ct-chip" :class="{ 'is-on': origen === 'promo' }" @click="armarDesde('promo')">Marcados como promo<b class="num">{{ enPromo.length }}</b></button>
            <button type="button" class="ct-chip" :class="{ 'is-on': origen === 'descuento' }" @click="armarDesde('descuento')">{{ DESCUENTO_MIN }} % de descuento o más<b class="num">{{ conDescuento.length }}</b></button>
            <button type="button" class="ct-chip" :class="{ 'is-on': origen === 'mano' }" @click="origen = 'mano'">Elegir a mano</button>
            <span v-if="origen !== 'mano'" class="ct-desde__orden">Ordenado por descuento</span>
          </div>
          <label class="sp-busca__campo">
            <v-icon size="20" class="sp-busca__ic">mdi-magnify</v-icon>
            <input v-model="buscar" class="sp-busca__input" type="search" placeholder="Buscar por nombre, marca o código" />
          </label>
          <div class="ct-chips">
            <button type="button" class="ct-chip" :class="{ 'is-on': !categoria }" @click="categoria = null">Todas<b class="num">{{ base.length }}</b></button>
            <button v-for="c in categoriasVisibles" :key="c.nombre" type="button" class="ct-chip" :class="{ 'is-on': categoria === c.nombre }" @click="categoria = c.nombre">{{ c.texto }}<b class="num">{{ c.cantidad }}</b></button>
            <v-menu v-if="categoriasResto.length" location="bottom start">
              <template #activator="{ props: p }">
                <button type="button" class="ct-chip" :class="{ 'is-on': categoriaEnResto }" v-bind="p">{{ categoriaEnResto ? textoCategoria(categoria) : "Más categorías" }}<v-icon size="18">mdi-chevron-down</v-icon></button>
              </template>
              <v-list density="compact" max-height="360">
                <v-list-item v-for="c in categoriasResto" :key="c.nombre" @click="categoria = c.nombre">
                  <v-list-item-title>{{ c.texto }} <span class="ct-menu-n num">{{ c.cantidad }}</span></v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
          <div class="ct-cuenta"><span class="num">{{ cargandoCatalogo ? "Cargando productos…" : `${filtrados.length} con stock` }}</span></div>
          <div class="ct-grilla">
            <button
              v-for="p in visibles"
              :key="p.id"
              type="button"
              class="ct-prod"
              :class="{ 'is-on': ordenDe(p.id), 'is-lleno': !ordenDe(p.id) && seleccion.length >= TOPE }"
              :title="p.nombre"
              @click="alternar(p)"
            >
              <span v-if="ordenDe(p.id)" class="ct-prod__n">{{ ordenDe(p.id) }}</span>
              <span v-else class="ct-prod__mas"><v-icon size="20">mdi-plus</v-icon></span>
              <span v-if="formato === 'ofertas' && descuentoDe(p)" class="ct-prod__off num">-{{ descuentoDe(p) }}%</span>
              <img :src="p.imagen" alt="" loading="lazy" />
              <span class="ct-prod__t">{{ p.titulo }}</span>
              <span class="ct-prod__p num">{{ pesos(p.precio) }}</span>
              <span class="ct-prod__s num">{{ p.cuotas ? `${p.cuotas.cantidad} cuotas de ${pesos(p.cuotas.valor)} · ` : "" }}stock {{ p.stock }}</span>
            </button>
            <div v-if="visibles.length < filtrados.length" v-intersect="masProductos" class="ct-sentinela"></div>
            <div v-if="!cargandoCatalogo && !filtrados.length" class="ct-vacio">Sin productos</div>
          </div>
        </section>
        <aside class="ct-col ct-enreel">
          <div class="sp-caja">
            <div class="se-banda"><span>En el reel</span><small class="num">{{ seleccion.length }} de {{ TOPE }}</small></div>
            <div
              v-for="(p, i) in seleccion"
              :key="p.id"
              class="ct-sel"
              :class="{ 'is-arrastrando': arrastrando === i, 'is-destino': destino === i && arrastrando !== i }"
              draggable="true"
              @dragstart="arrastrando = i"
              @dragover.prevent="destino = i"
              @drop.prevent="soltar(i)"
              @dragend="arrastrando = null; destino = null"
            >
              <span class="ct-sel__n">{{ i + 1 }}</span>
              <img :src="p.imagen" alt="" />
              <div class="ct-sel__t"><b>{{ p.titulo }}</b><span class="num">{{ pesos(p.precio) }}</span></div>
              <v-icon size="20" class="ct-es__drag">mdi-drag</v-icon>
              <button type="button" title="Quitar" @click="quitar(p.id)"><v-icon size="20">mdi-close</v-icon></button>
            </div>
            <div v-if="!seleccion.length" class="ct-vacio">Sin productos</div>
          </div>
        </aside>
      </div>

      <!-- 3. Escenas -->
      <div v-else-if="paso === 3" class="ct-p2">
        <div class="ct-tira">
          <button type="button" class="ct-ti" :class="{ 'is-on': activa === 'intro' }" @click="activa = 'intro'">
            <EscenaReel tipo="intro" :apertura="aperturaVista" :fuente="fuente" :ancho="46" />
            <span><small>Portada · {{ fmtSeg(T.intro) }} s</small><b>{{ apertura.titular || "Logo de la marca" }}</b></span>
          </button>
          <button v-for="(p, i) in seleccion" :key="p.id" type="button" class="ct-ti" :class="{ 'is-on': activa === p.id }" @click="activa = p.id">
            <EscenaReel tipo="item" :item="encargoItem(p)" :fuente="fuente" :ancho="46" :con-cuotas="opciones.cuotas" />
            <span><small>Escena {{ i + 1 }} · {{ fmtSeg(T.item) }} s</small><b>{{ p.titulo }}</b></span>
          </button>
          <button type="button" class="ct-ti" :class="{ 'is-on': activa === 'cierre' }" @click="activa = 'cierre'">
            <EscenaReel tipo="cierre" :cierre="cierreOpc" :fuente="fuente" :ancho="46" />
            <span><small>Cierre · {{ fmtSeg(T.cierre) }} s</small><b>{{ fuente?.textos?.llamado || "Cierre" }}</b></span>
          </button>
        </div>

        <div class="sp-caja ct-editor-caja">
          <div class="se-banda"><span>{{ tituloActiva }}</span><small class="num">{{ fmtSeg(tipoActiva === "intro" ? T.intro : tipoActiva === "cierre" ? T.cierre : T.item) }} s</small></div>
          <div class="ct-editor">
            <template v-if="productoActivo">
              <div class="ct-campo"><label>Título</label><input v-model="productoActivo.titulo" maxlength="90" /></div>
              <div class="ct-campo"><label>Marca y modelo</label><input v-model="productoActivo.etiqueta" maxlength="80" /></div>
              <div class="ct-campo">
                <label>Precio</label>
                <div class="ct-precio">
                  <b class="num">{{ pesos(productoActivo.precio) }}</b>
                  <s v-if="productoActivo.precioAnterior > productoActivo.precio" class="num">{{ pesos(productoActivo.precioAnterior) }}</s>
                  <span v-if="productoActivo.precioAnterior > productoActivo.precio" class="num">{{ Math.round((1 - productoActivo.precio / productoActivo.precioAnterior) * 100) }} % OFF</span>
                </div>
              </div>
              <div class="ct-campo"><label>Características, una por renglón</label><textarea v-model="productoActivo.caracteristicas" rows="3" @input="limitarCaracteristicas(productoActivo)"></textarea></div>
              <div v-if="opciones.voz" class="ct-campo"><label><v-icon size="15">mdi-account-voice</v-icon> Voz</label><textarea v-model="productoActivo.voz" rows="3" maxlength="400" @input="productoActivo.vozEditada = true"></textarea></div>
            </template>
            <template v-else-if="activa === 'intro'">
              <div class="ct-campo"><label>{{ formato === "problema" ? "Pregunta" : "Titular" }}</label><input v-model="apertura.titular" class="ct-titular" :maxlength="TOPE_TITULAR" @input="editarApertura" /></div>
              <div class="ct-campo"><label>Bajada</label><input v-model="apertura.bajada" maxlength="80" @input="editarApertura" /></div>
              <div v-if="opciones.voz" class="ct-campo"><label><v-icon size="15">mdi-account-voice</v-icon> Voz · apertura</label><textarea v-model="guion.intro" rows="3" maxlength="300" @input="guion.introEditada = true"></textarea></div>
            </template>
            <template v-else>
              <div class="ct-cierre-opc">
                <label v-for="o in CIERRE_OPC" :key="o.k" class="ct-sw"><span>{{ o.t }}</span><input v-model="cierreOpc[o.k]" type="checkbox" /><i></i></label>
              </div>
              <div v-if="opciones.voz" class="ct-campo"><label><v-icon size="15">mdi-account-voice</v-icon> Voz</label><textarea v-model="guion.cierre" rows="5" maxlength="600" @input="guion.cierreEditada = true"></textarea></div>
            </template>
          </div>
        </div>

        <div class="ct-prev__tel">
          <EscenaReel :tipo="tipoActiva" :item="itemActivo" :apertura="aperturaVista" :cierre="cierreOpc" :fuente="fuente" :ancho="300" :con-cuotas="opciones.cuotas" />
        </div>
      </div>

      <!-- 4. Sonido y video: estilo prearmado (efectos y animación incluidos), música y voz -->
      <div v-else class="ct-p3">
        <div class="sp-caja">
          <div class="se-banda">
            <span>Sonido</span>
            <small class="num">{{ fmtSeg(total) }} s</small>
          </div>
          <div class="ct-son">
            <!-- Estilos prearmados: cada uno trae su animación y sus efectos -->
            <template v-if="fichasPaquete.length">
              <span class="ct-rot">Estilo</span>
              <div class="ct-paqs" role="radiogroup" aria-label="Estilo del video">
                <div v-for="p in fichasPaquete" :key="p.id" class="ct-paq" :class="{ 'is-on': p.on }" role="radio" tabindex="0" :aria-checked="p.on" @click="p.elegir()" @keydown.enter.prevent="p.elegir()" @keydown.space.prevent="p.elegir()">
                  <button type="button" class="ct-oir" :class="{ 'is-sonando': sonando === `paq:${p.id}` }" :aria-label="`${sonando === `paq:${p.id}` ? 'Detener' : 'Escuchar'} ${p.nombre}`" @click.stop="escucharEstilo(p)"><v-icon size="18">{{ sonando === `paq:${p.id}` ? "mdi-stop" : "mdi-play" }}</v-icon></button>
                  <span class="ct-paq__t"><strong>{{ p.nombre }}</strong><small>{{ p.sub }}</small></span>
                  <v-icon v-if="p.on" size="20" class="ct-paq__ok">mdi-check-circle</v-icon>
                </div>
              </div>
            </template>
            <span class="ct-rot">Música</span>
            <div class="ct-ops" role="radiogroup" aria-label="Música">
              <div v-for="o in opsMusica" :key="o.key" class="ct-op" :class="{ 'is-on': o.on }" role="radio" tabindex="0" :aria-checked="o.on" @click="o.elegir()" @keydown.enter.prevent="o.elegir()" @keydown.space.prevent="o.elegir()">
                <button v-if="o.muestra" type="button" class="ct-oir" :class="{ 'is-sonando': sonando === o.oir }" :aria-label="`${sonando === o.oir ? 'Detener' : 'Escuchar'} ${o.nombre}`" @click.stop="escucharUno(o.oir, o.muestra)"><v-icon size="18">{{ sonando === o.oir ? "mdi-stop" : "mdi-play" }}</v-icon></button>
                <span v-else class="ct-op__hueco"><v-icon size="18">mdi-volume-off</v-icon></span>
                <span class="ct-op__t"><strong>{{ o.nombre }}</strong><small v-if="o.sub">{{ o.sub }}</small></span>
                <v-icon size="19" class="ct-op__rd">{{ o.on ? "mdi-radiobox-marked" : "mdi-radiobox-blank" }}</v-icon>
              </div>
            </div>
            <div class="ct-fila"><span class="ct-rot">Voz</span><span class="ct-mini-sw" role="switch" tabindex="0" :aria-checked="opciones.voz" @click="alternarVoz" @keydown.enter.prevent="alternarVoz" @keydown.space.prevent="alternarVoz"><i></i>Voz en off</span></div>
            <template v-if="opciones.voz">
              <div class="ct-voces2">
                <div v-for="g in gruposVoz" :key="g.t" class="ct-voces2__col">
                  <span class="ct-rot">{{ g.t }}</span>
                  <div class="ct-ops ct-ops--col" role="radiogroup" :aria-label="g.t">
                    <div v-for="o in g.ops" :key="o.key" class="ct-op" :class="{ 'is-on': o.on }" role="radio" tabindex="0" :aria-checked="o.on" @click="o.elegir()" @keydown.enter.prevent="o.elegir()" @keydown.space.prevent="o.elegir()">
                      <button v-if="o.muestra" type="button" class="ct-oir" :class="{ 'is-sonando': sonando === o.oir }" :aria-label="`${sonando === o.oir ? 'Detener' : 'Escuchar'} ${o.nombre}`" @click.stop="escucharUno(o.oir, o.muestra)"><v-icon size="18">{{ sonando === o.oir ? "mdi-stop" : "mdi-play" }}</v-icon></button>
                      <span v-else class="ct-op__hueco"><v-icon size="18">mdi-volume-off</v-icon></span>
                      <span class="ct-op__t"><strong>{{ o.nombre }}</strong><small v-if="o.sub">{{ o.sub }}</small></span>
                      <v-icon size="19" class="ct-op__rd">{{ o.on ? "mdi-radiobox-marked" : "mdi-radiobox-blank" }}</v-icon>
                    </div>
                  </div>
                </div>
              </div>
              <div class="ct-fila"><span class="ct-rot">Ritmo</span><span class="ct-seg ct-seg--chico"><button v-for="r in RITMOS" :key="r.v" type="button" :class="{ 'is-on': opciones.ritmo === r.v }" @click="elegirRitmo(r.v)">{{ r.t }}</button></span></div>
            </template>
          </div>
        </div>
        <div class="sp-caja">
          <div class="se-banda"><span>Datos del video</span></div>
          <div class="ct-datos">
            <div class="ct-campo"><label>Título</label><input v-model="datos.titulo" maxlength="80" /></div>
            <div class="ct-campo"><label>Descripción</label><input v-model="datos.descripcion" maxlength="200" /></div>
            <label class="ct-sw ct-sw--ultimo ct-datos__cuotas"><span>Cuotas y medios de pago</span><input v-model="opciones.cuotas" type="checkbox" @change="sugerir" /><i></i></label>
          </div>
        </div>
      </div>

      <div class="ct-pie">
        <button v-if="paso > 1" type="button" class="ct-atras" @click="paso--"><v-icon size="20">mdi-arrow-left</v-icon>Atrás</button>
        <span v-else></span>
        <button v-if="paso < 4" type="button" class="ct-generar" :disabled="paso >= 2 && !seleccion.length" @click="paso++">Siguiente<v-icon size="22">mdi-arrow-right</v-icon></button>
        <div v-else class="ct-pie__fin">
          <span v-if="sinCupo" class="ct-cupo-agotado">Límite de {{ cupo.nombreMes }} alcanzado</span>
          <button type="button" class="ct-generar" :disabled="sinCupo || !seleccion.length || !fuente || creando || (formato === 'problema' && !apertura.titular.trim())" @click="generar">
            <v-progress-circular v-if="creando" indeterminate size="22" width="3" />
            <v-icon v-else size="24">mdi-movie-open-outline</v-icon>Generar video
          </button>
        </div>
      </div>
    </template>

    <!-- REDES: credenciales de Meta (van cifradas al servicio; nunca vuelven) -->
    <div v-else-if="vista === 'redes'" class="ct-redes">
      <section class="ct-col">
        <div v-for="r in REDES" :key="r.k" class="sp-caja">
          <div class="ct-red">
            <span class="ct-red__ic" :class="`is-${r.k}`">{{ r.sigla }}</span>
            <b>{{ r.t }}</b>
            <span :class="redes[r.k] ? 'ct-ok' : 'ct-no'"><v-icon v-if="redes[r.k]" size="16">mdi-check-circle-outline</v-icon>{{ redes[r.k] ? "Conectado" : "Sin conectar" }}</span>
            <button v-if="esSuper" type="button" class="ct-lnk" @click="redAbierta = redAbierta === r.k ? null : r.k">{{ redAbierta === r.k ? "Cerrar" : redes[r.k] ? "Cambiar" : "Conectar" }}</button>
          </div>
          <div v-if="redAbierta === r.k" class="ct-red__form">
            <div class="ct-campo"><label>{{ r.idT }}</label><input v-model="cred.id" autocomplete="off" inputmode="numeric" /></div>
            <div class="ct-campo"><label>Token de acceso</label><input v-model="cred.token" type="password" autocomplete="new-password" /></div>
            <div class="ct-red__acc"><button type="button" class="ct-generar" :disabled="!cred.id.trim() || !cred.token.trim() || guardandoRed" @click="conectar(r)">Guardar conexión</button></div>
          </div>
        </div>
      </section>
      <section class="ct-col">
        <div class="sp-caja">
          <div class="se-banda"><span>Modo de publicación</span></div>
          <div class="ct-sonido">
            <label class="ct-sw ct-sw--ultimo" :class="{ 'is-bloq': !esSuper }"><span>Ensayo: armar sin publicar</span><input :checked="redes.ensayo !== false" type="checkbox" :disabled="!esSuper || guardandoRed" @change="cambiarEnsayo($event)" /><i></i></label>
          </div>
        </div>
      </section>
    </div>

    <!-- PUBLICAR: vista completa de un video listo -->
    <div v-else-if="vista === 'publicar'" class="ct-pub">
      <a href="#" class="se-volver ct-volver" @click.prevent="irA('videos')"><v-icon size="18">mdi-arrow-left</v-icon>Videos</a>
      <div v-if="!piezaPub" class="sp-caja ct-vacio">{{ cargandoPub ? "Cargando…" : "El video no está disponible" }}</div>
      <template v-else>
        <div class="ct-pub__cab"><h2>Publicar video</h2><span>{{ piezaPub.titulo || piezaPub.items?.map((x) => x.titulo).join(", ") || "Sin título" }}</span></div>
        <div v-if="redes.ensayo !== false" class="ct-ensayo"><v-icon size="20">mdi-flask-outline</v-icon>Modo ensayo: no se publica</div>
        <div class="ct-pub__grilla">
          <div class="ct-pub__video"><video :src="piezaPub.video" :poster="piezaPub.portada" controls playsinline preload="metadata"></video></div>
          <div class="sp-caja">
            <div class="se-banda"><span>Texto de la publicación</span><small class="num">{{ fmtEntero(textoPub.length) }} de 2.200</small></div>
            <div class="ct-pub__texto">
              <textarea v-model="textoPub" rows="14" maxlength="2200"></textarea>
              <div class="ct-chips"><button v-for="h in hashtags" :key="h" type="button" class="ct-chip" :class="{ 'is-on': textoPub.includes(h) }" @click="alternarHashtag(h)">{{ h }}</button></div>
            </div>
          </div>
          <div class="ct-col">
            <div class="sp-caja">
              <div class="se-banda"><span>Dónde se publica</span></div>
              <label v-for="r in REDES.filter((x) => x.k !== 'whatsapp')" :key="r.k" class="ct-dest" :class="{ 'is-off': !redes[r.k] }">
                <input v-model="destinos" type="checkbox" :value="r.k" :disabled="!redes[r.k]" />
                <span class="ct-red__ic" :class="`is-${r.k}`">{{ r.sigla }}</span>
                <span class="ct-dest__t"><b>{{ r.pub }}</b><small>{{ redes[r.k] ? r.sub : "sin conectar" }}</small></span>
                <span :class="redes[r.k] ? 'ct-ok' : 'ct-no'">{{ redes[r.k] ? "Conectado" : "Sin conectar" }}</span>
              </label>
              <button v-if="!redes.instagram && !redes.facebook" type="button" class="ct-lnk ct-dest__ir" @click="irA('redes')">Conectar redes</button>
            </div>
            <div class="sp-caja">
              <div class="se-banda"><span>Publicaciones</span><small class="num">{{ (piezaPub.publicaciones || []).length }}</small></div>
              <div v-if="!(piezaPub.publicaciones || []).length" class="ct-vacio">Todavía no se publicó</div>
              <div v-for="(p, k) in [...(piezaPub.publicaciones || [])].reverse()" :key="k" class="ct-hist">
                <span class="num">{{ fecha(p.fecha) }}</span>
                <span v-for="(r, d) in p.resultados" :key="d" class="ct-hist__r" :class="r.ok ? (r.ensayo ? 'is-ens' : 'is-ok') : 'is-err'">
                  {{ nombreRed(d) }} · {{ r.ok ? (r.ensayo ? "ensayo" : "publicado") : "falló" }}
                  <a v-if="r.enlace" :href="r.enlace" target="_blank" rel="noopener">ver</a>
                  <small v-if="!r.ok">{{ r.error }}</small>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="ct-pie">
          <span></span>
          <button type="button" class="ct-generar" :class="{ 'is-confirmar': confirmarPub }" :disabled="!destinos.length || !textoPub.trim() || publicando" @click="publicar">
            <v-progress-circular v-if="publicando" indeterminate size="22" width="3" />
            <v-icon v-else size="22">mdi-send-outline</v-icon>{{ confirmarPub ? "Confirmar publicación" : `Publicar en ${destinos.map(nombreRed).join(" y ") || "redes"}` }}
          </button>
        </div>
      </template>
    </div>

    <!-- VIDEOS -->
    <div v-else class="ct-videos">
      <div v-if="!piezas.length" class="sp-caja ct-vacio">Sin videos</div>
      <div v-for="v in piezas" :key="v.id" class="sp-caja ct-video">
        <div class="ct-video__cab">
          <span class="num">{{ fecha(v.creada) }}</span>
          <b :class="`is-${v.estado}`">{{ estadoTexto(v) }}</b>
        </div>
        <div v-if="enProceso(v)" class="ct-video__barra"><span :style="{ width: `${v.progreso || 0}%` }"></span></div>
        <div class="ct-video__vis">
          <video v-if="v.estado === 'lista'" :src="v.video" :poster="v.portada" controls playsinline preload="none"></video>
          <div v-else-if="enProceso(v)" class="ct-video__armando">
            <img v-if="v.vistaPrevia" :src="v.vistaPrevia" alt="" class="ct-video__cuadro" />
            <div v-else class="ct-video__onda"><span v-for="k in 5" :key="k" :style="{ animationDelay: `${k * 0.12}s` }"></span></div>
            <div class="ct-video__etapa">
              <b>{{ v.etapa || "Preparando" }}</b>
              <span v-if="v.cuadros" class="num">Cuadro {{ fmtEntero(v.cuadro) }} de {{ fmtEntero(v.cuadros) }}</span>
              <span class="num">{{ v.progreso || 0 }} %</span>
            </div>
          </div>
          <div v-else class="ct-video__vacio" :class="{ 'is-error': v.estado === 'error' }">
            <v-icon size="44">{{ v.estado === "cancelada" ? "mdi-cancel" : "mdi-movie-off-outline" }}</v-icon>
            <b>{{ v.estado === "cancelada" ? "Cancelado" : "Sin video" }}</b>
          </div>
        </div>
        <div v-if="editando === v.id" class="ct-video__datos">
          <input v-model="borrador.titulo" class="ct-video__in" maxlength="80" placeholder="Título" />
          <textarea v-model="borrador.descripcion" class="ct-video__in" rows="2" maxlength="200" placeholder="Descripción"></textarea>
          <div class="ct-video__acc">
            <button type="button" class="ct-video__cancelar" @click="editando = null">Cancelar</button>
            <button type="button" class="ct-bajar" :disabled="guardando" @click="guardarDatos(v)">Guardar</button>
          </div>
        </div>
        <div v-else class="ct-video__datos">
          <div class="ct-video__titulo">
            <b :class="{ 'is-tenue': !v.titulo }">{{ v.titulo || "Sin título" }}</b>
            <button type="button" title="Editar título y descripción" @click="editar(v)"><v-icon size="18">mdi-pencil-outline</v-icon></button>
          </div>
          <p v-if="v.descripcion" class="ct-video__desc">{{ v.descripcion }}</p>
          <p v-if="v.items?.length" class="ct-video__items">{{ v.items.map((x) => x.titulo).join(" · ") }}</p>
          <p v-if="v.voz?.usada" class="ct-video__items"><v-icon size="14">mdi-account-voice</v-icon> {{ nombreVoz(v.voz.usada) }}<template v-if="v.voz.respaldo"> · respaldo de {{ nombreVoz(v.voz.pedida) }}</template></p>
        </div>
        <div v-if="enProceso(v)" class="ct-video__pie">
          <span class="ct-video__esp"></span>
          <button type="button" class="ct-borrar" :class="{ 'is-confirmar': confirmar === v.id }" @click="cancelar(v)">
            <v-icon size="20">mdi-close-circle-outline</v-icon><span>{{ confirmar === v.id ? "Confirmar" : "Cancelar" }}</span>
          </button>
        </div>
        <div v-if="v.estado === 'lista' || v.estado === 'error' || v.estado === 'cancelada'" class="ct-video__pie">
          <button v-if="v.estado === 'lista'" type="button" class="ct-bajar" @click="abrirPublicar(v)"><v-icon size="20">mdi-send-outline</v-icon>Publicar</button>
          <button v-if="v.estado === 'lista'" type="button" class="ct-icono" title="Bajar MP4" :disabled="bajando === v.id" @click="bajar(v)">
            <v-progress-circular v-if="bajando === v.id" indeterminate size="18" width="2" />
            <v-icon v-else size="20">mdi-download</v-icon>
          </button>
          <span v-else class="ct-video__esp"></span>
          <button type="button" class="ct-borrar" :class="{ 'is-confirmar': confirmar === v.id }" :title="confirmar === v.id ? 'Confirmar' : 'Eliminar'" @click="borrar(v)">
            <v-icon size="20">mdi-delete-outline</v-icon><span v-if="confirmar === v.id">Confirmar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";
import EscenaReel from "@/modules/admin/components/contenidos/EscenaReel.vue";
import { borrarPieza, buscarProductos, cancelarPieza, crearPieza, getCupo, getRecursos, getRedes, guardarRedes, publicarPieza, editarPieza, getFuente, listarPiezas, listarSonidos, listarVoces, sugerirGuion, verPieza } from "@/modules/admin/services/contenidos.service";
import "@/modules/products/styles/proveedores.css";

const DESCUENTO_MIN = 25;
const CAMPO_FORMATO = "tipo";
const TOPE_TITULAR = 90;
// Formatos del video (los arma el servicio de contenidos; POS elige y ordena los productos).
const FORMATOS = [
  { v: "destacados", t: "Destacados", s: "1 a 6 productos", tope: 6, muestra: "" },
  { v: "estrella", t: "Producto estrella", s: "1 producto", tope: 1 },
  { v: "ofertas", t: "Ofertas", s: "mayor descuento primero", tope: 6, muestra: "Ofertas de la semana" },
  { v: "categoria", t: "Categoría", s: "de una categoría", tope: 6, muestra: "Cámaras de seguridad" },
  { v: "problema", t: "Problema y solución", s: "pregunta y respuesta", tope: 3, muestra: "¿Querés ver tu casa desde el celular?" },
];
const CIERRE_OPC = [
  { k: "sucursales", t: "Sucursales" },
  { k: "redes", t: "Redes y web" },
  { k: "cuotas", t: "Cuotas y medios de pago" },
  { k: "llamado", t: "Llamado" },
];
const POR_TANDA = 48;
// Momentos del sonido, en el orden en que suenan (encargo.sonidos del servicio).
const MOMENTOS = ["apertura", "producto", "precio", "oferta", "transicion", "subida", "cierre", "remate"];
const T_REMATE = 2;
// Valor de cada momento: "o" = Original (el sonido de siempre), null = Sin sonido, id = ese efecto.
const efOriginal = () => Object.fromEntries(MOMENTOS.map((m) => [m, m === "remate" ? null : "o"]));
const PASOS = [
  { t: "Formato", s: "" },
  { t: "Productos", s: "" },
  { t: "Escenas", s: "texto y voz" },
  { t: "Sonido y video", s: "sonido y datos" },
];
// Ritmo de la voz: el servicio lo recibe como velocidad.
const RITMOS = [
  { v: "pausada", t: "Pausada", velocidad: 0.9 },
  { v: "normal", t: "Normal", velocidad: 1 },
  { v: "agil", t: "Ágil", velocidad: 1.12 },
];

const REDES = [
  { k: "instagram", t: "Instagram", sigla: "IG", idT: "ID de la cuenta de Instagram", idK: "ig_usuario_id", pub: "Instagram · reel", sub: "también en el feed" },
  { k: "facebook", t: "Facebook · página", sigla: "f", idT: "ID de la página de Facebook", idK: "pagina_id", pub: "Facebook · reel de la página", sub: "página del comercio" },
  { k: "whatsapp", t: "WhatsApp Business", sigla: "WA", idT: "ID del número de WhatsApp", idK: "numero_id" },
];
const route = useRoute();
const router = useRouter();
const vista = computed(() => (["videos", "redes", "publicar"].includes(route.query.vista) ? route.query.vista : "nuevo"));
function irA(v, extra = {}) { router.replace({ query: { vista: v === "nuevo" ? undefined : v, ...extra } }); }

const fuente = ref(null);
const catalogo = ref([]);
const cargandoCatalogo = ref(true);
const buscar = ref("");
const categoria = ref(null);
const cuantos = ref(POR_TANDA);
const seleccion = ref([]);
const activa = ref("intro");
const paso = ref(1);
const formato = ref("destacados");
const formatoActual = computed(() => FORMATOS.find((f) => f.v === formato.value) || FORMATOS[0]);
const TOPE = computed(() => formatoActual.value.tope);
const origen = ref("mano");
const promoIds = ref(new Set());
const apertura = reactive({ titular: "", bajada: "", editada: false });
const cierreOpc = reactive({ sucursales: true, redes: true, cuotas: true, llamado: true });
const datos = reactive({ titulo: "", descripcion: "" });
const editando = ref(null);
const borrador = reactive({ titulo: "", descripcion: "" });
const guardando = ref(false);
const guion = reactive({ intro: "", introEditada: false, cierre: "", cierreEditada: false });
const opciones = reactive({ musica: "pulso", voz: true, locutor: null, ritmo: "normal", cuotas: true, oscuro: false, ef: efOriginal() });
const voces = ref([]);
const sonidos = ref({ sonidos: [], viral: {} });
// Lo habilitado para el comercio (GET /recursos). null: el servicio no lo publica o no respondió.
const recursos = ref(null);
const piezas = ref([]);
const auth = useAuthStore();
const esSuper = computed(() => Boolean(auth.isSuperAdmin));
const redes = ref({});
const redAbierta = ref(null);
const cred = reactive({ id: "", token: "" });
const guardandoRed = ref(false);
const piezaPub = ref(null);
const cargandoPub = ref(false);
const textoPub = ref("");
const destinos = ref([]);
const publicando = ref(false);
const confirmarPub = ref(false);
const textoDe = ref(null);
const error = ref("");
const creando = ref(false);
const confirmar = ref(null);
const arrastrando = ref(null);
const destino = ref(null);

const pesos = (n) => (n == null ? "" : `$ ${Math.round(Number(n) || 0).toLocaleString("es-AR")}`);
const fmtSeg = (s) => Number(s).toLocaleString("es-AR", { maximumFractionDigits: 1 });
const fecha = (iso) => {
  const d = new Date(iso);
  const hoy = new Date();
  const hora = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === hoy.toDateString() ? `Hoy ${hora}` : `${d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })} ${hora}`;
};
const estadoTexto = (v) => ({ lista: "Listo", error: "No se pudo generar", en_cola: "En cola", cancelada: "Cancelado" }[v.estado] || `Generando ${v.progreso || 0} %`);
/* SONIDO del reel: tres estilos prearmados (los paquetes del servicio), música y voz.
   Decisión del usuario (11/10): el comercio no arma el video detalle por detalle; cada estilo
   trae sus efectos puestos (no se muestran ni se eligen), Viral por defecto, y se puede lanzar
   sin tocar nada. Lo que se puede elegir sale de GET /recursos (o de GET /sonidos); sin
   estilos quedan sólo música y voz y suena el clásico. */
const fuenteSonido = computed(() => {
  const r = recursos.value;
  if (r?.activo) {
    return {
      voces: r.voces || [], musicas: r.musicas || [], efectos: r.efectos || [],
      paquetes: r.paquetes || [], clasico: r.clasico || null,
      // El servicio ya entiende musica: null y la clave oferta.
      nuevo: Boolean(r.paquetes || r.clasico),
    };
  }
  const s = sonidos.value;
  if (!s.paquetes && !s.clasico) return null;
  return {
    voces: voces.value, musicas: s.sonidos.filter((x) => x.tipo === "musica"), efectos: s.sonidos.filter((x) => x.tipo === "efecto"),
    paquetes: s.paquetes || [], clasico: s.clasico || null, nuevo: true,
  };
});
const paquetes = computed(() => fuenteSonido.value?.paquetes || []);
const listaVoces = computed(() => fuenteSonido.value?.voces || voces.value);
const listaMusicas = computed(() => fuenteSonido.value?.musicas || sonidos.value.sonidos.filter((x) => x.tipo === "musica"));
const musicaDe = (id) => listaMusicas.value.find((x) => x.id === id);
const efectoDe = (id) => (fuenteSonido.value?.efectos || []).find((x) => x.id === id);
const nombreMusica = (id) => (id ? musicaDe(id)?.nombre || String(id).replace(/^./, (c) => c.toUpperCase()) : "Sin música");
const nombreLocutor = (id) => listaVoces.value.find((x) => x.id === id)?.nombre || nombreVoz(id);

// Cada estilo fija también la animación (decisión del usuario, 11/10): Viral en Cartel con la
// variante automática, Clásico y Tranquilo en Revista. Se manda sólo si está habilitada.
const ANIMACION_ESTILO = { viral: "cartel", clasico: "revista", tranquilo: "revista" };
const animacion = computed(() => {
  const c = ANIMACION_ESTILO[paquete.value];
  const habilitadas = recursos.value?.plantillas?.map((p) => p.id);
  return c && (!habilitadas || habilitadas.includes(c)) ? c : undefined;
});

// El sonido de siempre de un momento en la animación del video (para escuchar un estilo).
const tieneLogo = computed(() => Boolean(fuente.value?.marca?.logo));
function original(m, cinematica = animacion.value) {
  const fs = fuenteSonido.value;
  if (m === "remate" || !fs?.clasico) return null;
  const cin = cinematica || (recursos.value?.plantillas || []).find((p) => p.porDefecto)?.id || "revista";
  const c = fs.clasico[cin]?.[m];
  if (!c) return null;
  return m === "apertura" && !tieneLogo.value && c.sinLogo !== undefined ? c.sinLogo : c;
}
const callado = (m, v) => v === null || (v === "o" && !original(m));

/* Escenas: mismas cuentas que la duración del video. */
const enOferta = (p) => Number(p.precioAnterior) > Number(p.precio);
function escenasDe(st) {
  const out = [{ tipo: "intro", d: T.value.intro, ef: ["apertura"] }];
  seleccion.value.forEach((p, i) => out.push({ tipo: "item", d: T.value.item, p, i, ef: [i === 0 ? "producto" : "transicion", enOferta(p) ? "oferta" : "precio"] }));
  out.push({ tipo: "cierre", d: T.value.cierre, ef: ["subida", "cierre"] });
  if (st.ef.remate) out.push({ tipo: "remate", d: T_REMATE, ef: ["remate"] });
  let t = 0;
  for (const e of out) { e.t0 = t; t += e.d; }
  return out;
}
const total = computed(() => escenasDe(opciones).reduce((a, e) => a + e.d, 0));

/* Estilos. Elegir uno pone su música, su voz y sus efectos; después música y voz se cambian
   libres y los efectos siguen siendo los del estilo. */
function estadoDe(p) {
  const s = p.sonidos || {};
  const conVoz = p.voz != null && p.voz !== false;
  return {
    musica: p.musica ?? null, voz: conVoz,
    locutor: conVoz ? p.voz.locutor || opciones.locutor : opciones.locutor,
    ritmo: conVoz ? p.voz.ritmo || "normal" : opciones.ritmo,
    oscuro: Boolean(s.oscuro),
    ef: Object.fromEntries(MOMENTOS.map((m) => [m, m in s ? s[m] : m === "remate" ? null : "o"])),
  };
}
const paquete = ref(null);
function elegirPaquete(p) {
  const st = estadoDe(p);
  const antes = opciones.voz;
  Object.assign(opciones, { ...st, ef: { ...st.ef } });
  paquete.value = p.id;
  if (opciones.voz && !antes) sugerir();
  if (!opciones.voz && sonando.value?.startsWith("voz:")) cortarMuestra();
}
const fichasPaquete = computed(() => paquetes.value.map((p) => {
  const st = estadoDe(p);
  return { id: p.id, nombre: p.nombre, on: paquete.value === p.id, estado: st, elegir: () => elegirPaquete(p),
    sub: [nombreMusica(st.musica), st.voz ? nombreLocutor(st.locutor) : "Sin voz", p.resumen].filter(Boolean).join(" · ") };
}));
// Al cargar: el estilo por defecto, o el primero. Sin estilos: la voz y la música por defecto, efectos de siempre.
function sonidoInicial() {
  const fs = fuenteSonido.value;
  if (!fs) return;
  const p = fs.paquetes.find((x) => x.porDefecto) || fs.paquetes[0];
  if (p) return elegirPaquete(p);
  const voz = fs.voces.find((v) => v.porDefecto) || fs.voces[0];
  Object.assign(opciones, { musica: fs.musicas.find((m) => m.porDefecto)?.id ?? null, voz: Boolean(voz), locutor: voz?.id || null, ritmo: "normal", oscuro: false, ef: efOriginal() });
  paquete.value = null;
}
async function cargarRecursos() {
  try {
    const r = await getRecursos();
    recursos.value = r?.videos || null;
  } catch { recursos.value = null; }
}

/* Música y voz */
function elegirMusica(id) { opciones.musica = id; }
function elegirLocutor(id) { opciones.locutor = id; }
function elegirRitmo(v) { opciones.ritmo = v; }
function alternarVoz() {
  opciones.voz = !opciones.voz;
  if (!opciones.voz && sonando.value?.startsWith("voz:")) cortarMuestra();
  sugerir();
}
const opsMusica = computed(() => [
  ...listaMusicas.value.map((x) => ({ key: x.id, nombre: x.nombre, sub: x.estilo, on: opciones.musica === x.id, muestra: x.muestra, oir: `mus:${x.id}`, elegir: () => elegirMusica(x.id) })),
  { key: "sin", nombre: "Sin música", on: !opciones.musica, elegir: () => elegirMusica(null) },
]);
const gruposVoz = computed(() => {
  const op = (v) => ({ key: v.id, nombre: v.nombre, sub: [v.tono, v.edad].filter(Boolean).join(" · "), on: opciones.locutor === v.id, muestra: v.muestra, oir: `voz:${v.id}`, elegir: () => elegirLocutor(v.id) });
  return [
    { t: "Femeninas", ops: [...listaVoces.value.filter((v) => v.genero === "femenino"), ...listaVoces.value.filter((v) => v.genero !== "femenino" && v.genero !== "masculino")].map(op) },
    { t: "Masculinas", ops: listaVoces.value.filter((v) => v.genero === "masculino").map(op) },
  ].filter((g) => g.ops.length);
});

/* Lo que viaja en el encargo: los efectos del estilo, momento por momento (el servicio los
   aplica); sólo los que no son los de siempre y sólo los que suenan en este video. */
function sonidoDelEncargo() {
  const fs = fuenteSonido.value;
  if (!fs) return { musica: opciones.musica || undefined };
  const presentes = new Set(escenasDe(opciones).flatMap((e) => e.ef));
  const s = {};
  for (const m of MOMENTOS) if (presentes.has(m) && opciones.ef[m] !== "o") s[m] = opciones.ef[m];
  if (opciones.oscuro) s.oscuro = true;
  const mudo = [...presentes].every((m) => callado(m, opciones.ef[m]));
  return {
    ...(animacion.value ? { cinematica: animacion.value } : {}),
    // musica: null (Sin música explícito) sólo si el servicio ya lo entiende; si no, omitida como siempre.
    musica: fs.nuevo ? opciones.musica ?? null : opciones.musica || undefined,
    efectos: !mudo,
    sonidos: !mudo && Object.keys(s).length ? s : undefined,
  };
}

/* Un solo reproductor para todo: muestras sueltas con <audio> y la escucha de un estilo con
   Web Audio (música, voz y sus efectos en su instante). Tocar cualquier ▶ corta lo que suene. */
const sonando = ref(null);
let reproductor = null;
let ctx = null;
let nodos = [];
let elementos = [];
let tiempos = [];
let turno = 0;
const buffers = new Map();
function cortarMuestra() {
  turno++;
  if (reproductor) { reproductor.pause(); reproductor.removeAttribute("src"); reproductor.load(); }
  nodos.forEach((n) => { try { n.stop(); } catch { /* ya terminó */ } });
  elementos.forEach((a) => { a.pause(); a.removeAttribute("src"); a.load(); });
  tiempos.forEach(clearTimeout);
  nodos = []; elementos = []; tiempos = [];
  sonando.value = null;
}
function contexto() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function buffer(url) {
  if (!buffers.has(url)) {
    const p = fetch(url).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
      .then((b) => new Promise((ok, ko) => contexto().decodeAudioData(b, ok, ko)));
    p.catch(() => buffers.delete(url));
    buffers.set(url, p);
  }
  return buffers.get(url);
}
// Aproximación del filtro oscuro del render: más lento y con eco.
function sonarBuffer(b, cuando, { vol = 0.9, oscuro = false, dur = null, fade = 0 } = {}) {
  const c = contexto();
  const s = c.createBufferSource();
  s.buffer = b;
  if (oscuro) s.playbackRate.value = 0.82;
  const g = c.createGain();
  g.gain.value = vol;
  s.connect(g);
  g.connect(c.destination);
  if (oscuro) {
    const d = c.createDelay(1); d.delayTime.value = 0.14;
    const fb = c.createGain(); fb.gain.value = 0.35;
    const mezcla = c.createGain(); mezcla.gain.value = 0.5;
    g.connect(d); d.connect(fb); fb.connect(d); d.connect(mezcla); mezcla.connect(c.destination);
  }
  s.start(cuando);
  if (dur) {
    if (fade) { g.gain.setValueAtTime(vol, cuando + dur - fade); g.gain.linearRampToValueAtTime(0, cuando + dur); }
    s.stop(cuando + dur);
  }
  nodos.push(s);
  return s;
}
function escucharUno(clave, url) {
  if (sonando.value === clave) return cortarMuestra();
  cortarMuestra();
  if (!reproductor) {
    reproductor = new Audio();
    reproductor.preload = "none";
    reproductor.addEventListener("ended", () => { sonando.value = null; });
    reproductor.addEventListener("error", () => { if (reproductor.getAttribute("src")) sonando.value = null; });
  }
  reproductor.src = url;
  sonando.value = clave;
  reproductor.play().catch(() => { if (sonando.value === clave) sonando.value = null; });
}
// Instantes de cada efecto, aproximados a la plantilla vertical.
function eventosDe(st, es, cinematica) {
  const out = [];
  const add = (m, t) => {
    const v = st.ef[m];
    const url = v === "o" ? original(m, cinematica)?.muestra : v ? efectoDe(v)?.muestra : null;
    if (url) out.push({ url, t: Math.max(0, t), vol: 0.75, oscuro: st.oscuro });
  };
  for (const e of es) {
    if (e.tipo === "intro") add("apertura", 0.15);
    else if (e.tipo === "cierre") { add("subida", e.t0 - 1.1); add("cierre", e.t0 - 0.08); }
    else if (e.tipo === "remate") add("remate", e.t0 + 0.05);
    else {
      if (e.i === 0) add("producto", e.t0 + 0.3); else add("transicion", e.t0 - 0.08);
      add(enOferta(e.p) ? "oferta" : "precio", e.t0 + 1.25);
    }
  }
  return out;
}
// Escuchar un estilo con la música y la voz elegidas (la del estilo si es otro), en el largo de este video.
async function escucharEstilo(f) {
  const clave = `paq:${f.id}`;
  if (sonando.value === clave) return cortarMuestra();
  cortarMuestra();
  sonando.value = clave;
  const yo = turno;
  const st = f.on ? { ...opciones } : f.estado;
  const es = escenasDe(st);
  const dur = es.reduce((a, e) => a + e.d, 0);
  const voz = st.voz ? listaVoces.value.find((v) => v.id === st.locutor)?.muestra : null;
  const pistas = [
    st.musica && musicaDe(st.musica)?.muestra ? { url: musicaDe(st.musica).muestra, t: 0, vol: voz ? 0.32 : 0.55, dur, fade: 1.2 } : null,
    voz ? { url: voz, t: 0.5, vol: 1, dur: dur - 0.6 } : null,
    ...eventosDe(st, es, ANIMACION_ESTILO[f.id]),
  ].filter(Boolean);
  const res = await Promise.allSettled(pistas.map((p) => buffer(p.url)));
  if (yo !== turno) return;
  // Una muestra que no se pudo bajar por red (sin CORS) pasa todo a <audio>; una que no existe se saltea.
  if (res.some((r) => r.status === "rejected" && r.reason instanceof TypeError)) {
    for (const p of pistas) {
      const a = new Audio(p.url);
      a.volume = Math.min(1, p.vol);
      if (p.oscuro) { a.preservesPitch = false; a.playbackRate = 0.82; }
      elementos.push(a);
      tiempos.push(setTimeout(() => a.play().catch(() => {}), 150 + p.t * 1000));
      if (p.dur) tiempos.push(setTimeout(() => a.pause(), 150 + (p.t + p.dur) * 1000));
    }
  } else {
    const inicio = contexto().currentTime + 0.12;
    pistas.forEach((p, i) => { if (res[i].status === "fulfilled") sonarBuffer(res[i].value, inicio + p.t, p); });
  }
  tiempos.push(setTimeout(() => { if (yo === turno) cortarMuestra(); }, 200 + dur * 1000));
}
function alOcultar() { if (document.hidden) cortarMuestra(); }
watch(paso, cortarMuestra);
watch(vista, cortarMuestra);
const nombreVoz = (id) => voces.value.find((x) => x.id === id)?.nombre || String(id || "").replace(/^./, (c) => c.toUpperCase());
const enProceso = (v) => v.estado === "en_cola" || v.estado === "renderizando";
const fmtEntero = (n) => Number(n || 0).toLocaleString("es-AR");
const mensaje = (e) => e?.response?.data?.error || e?.response?.data?.message || "No se pudo completar la operación.";

/* Catálogo: se baja entero (todas las páginas) para filtrar por categoría al instante. */
const normalizar = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const textoCategoria = (c) => { const s = String(c || "").toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); };
const categorias = computed(() => {
  const m = new Map();
  for (const p of base.value) if (p.categoria) m.set(p.categoria, (m.get(p.categoria) || 0) + 1);
  return [...m.entries()].map(([nombre, cantidad]) => ({ nombre, cantidad, texto: textoCategoria(nombre) })).sort((a, b) => b.cantidad - a.cantidad);
});
const categoriasVisibles = computed(() => categorias.value.slice(0, 5));
const categoriasResto = computed(() => categorias.value.slice(5).sort((a, b) => a.texto.localeCompare(b.texto)));
const categoriaEnResto = computed(() => categoriasResto.value.some((c) => c.nombre === categoria.value));
const descuentoDe = (p) => (Number(p.precioAnterior) > Number(p.precio) && Number(p.precio) > 0 ? Math.round((1 - p.precio / p.precioAnterior) * 100) : 0);
const porDescuento = (l) => l.slice().sort((a, b) => descuentoDe(b) - descuentoDe(a));
const enPromo = computed(() => porDescuento(catalogo.value.filter((p) => promoIds.value.has(String(p.id)))));
const conDescuento = computed(() => porDescuento(catalogo.value.filter((p) => descuentoDe(p) >= DESCUENTO_MIN)));
// El grupo de productos sobre el que se busca: todo el catálogo o el de "armar desde".
const base = computed(() => (formato.value === "ofertas" && origen.value === "promo" ? enPromo.value : formato.value === "ofertas" && origen.value === "descuento" ? conDescuento.value : catalogo.value));
const filtrados = computed(() => {
  const q = normalizar(buscar.value).trim();
  return base.value.filter((p) => (!categoria.value || p.categoria === categoria.value) && (!q || normalizar(`${p.titulo} ${p.nombre} ${p.etiqueta}`).includes(q)));
});
const visibles = computed(() => filtrados.value.slice(0, cuantos.value));
function masProductos(visible) { if (visible) cuantos.value += POR_TANDA; }
watch([buscar, categoria], () => { cuantos.value = POR_TANDA; });

async function cargarCatalogo() {
  cargandoCatalogo.value = true;
  try {
    const r = await buscarProductos("");
    const resto = await Promise.all(Array.from({ length: Math.max(0, (r.paginas || 1) - 1) }, (_, i) => buscarProductos("", i + 2)));
    catalogo.value = [r, ...resto].flatMap((x) => x.items || []);
  } catch (e) { error.value = mensaje(e); } finally { cargandoCatalogo.value = false; }
}

/* Formato y "armar desde" */
function nuevoItem(p) {
  const caracteristicas = String(p.descripcion || "").split(/\s*·\s*|\.\s+/).map((x) => x.trim()).filter(Boolean).slice(0, 3).join("\n");
  return { ...p, caracteristicas, voz: "", vozEditada: false };
}
function elegirFormato(v) {
  formato.value = v;
  origen.value = v === "ofertas" ? "promo" : "mano";
  if (seleccion.value.length > TOPE.value) seleccion.value = seleccion.value.slice(0, TOPE.value);
  if (v === "ofertas") armarDesde(enPromo.value.length ? "promo" : "descuento");
  aperturaPorDefecto();
  sugerir();
}
function armarDesde(o) {
  origen.value = o;
  const l = o === "promo" ? enPromo.value : o === "descuento" ? conDescuento.value : [];
  if (o !== "mano") {
    seleccion.value = l.slice(0, TOPE.value).map(nuevoItem);
    activa.value = "intro";
    aperturaPorDefecto();
    sugerir();
  }
}
// Titular sugerido según el formato, sin pisar lo que se escribió a mano.
function aperturaPorDefecto() {
  if (apertura.editada) return;
  const f = formato.value;
  if (f === "ofertas") {
    const max = Math.max(0, ...seleccion.value.map(descuentoDe));
    apertura.titular = "Ofertas de la semana";
    apertura.bajada = max ? `Hasta ${max} % OFF` : "";
  } else if (f === "categoria") {
    const c = categoria.value || seleccion.value[0]?.categoria;
    apertura.titular = c ? textoCategoria(c).slice(0, 40) : "";
    apertura.bajada = c ? `${catalogo.value.filter((p) => p.categoria === c).length} modelos` : "";
  } else {
    apertura.titular = "";
    apertura.bajada = "";
  }
  sincronizarVoz();
}
watch(categoria, () => { if (formato.value === "categoria") aperturaPorDefecto(); });
// La bajada sugerida ("Hasta N % OFF") sigue a los productos elegidos.
watch(() => seleccion.value.map((p) => p.id).join(","), () => { if (formato.value === "ofertas" || formato.value === "categoria") aperturaPorDefecto(); });
// Lo que dice el titular lo lee también la voz, salvo que la voz se haya escrito a mano.
function sincronizarVoz() {
  if (!guion.introEditada) sugerir();
}
function editarApertura() {
  apertura.editada = true;
  sincronizarVoz();
}
const aperturaVista = computed(() => (apertura.titular.trim() ? { titular: apertura.titular.trim(), bajada: apertura.bajada.trim() } : null));
const muestraEstrella = computed(() => {
  const p = seleccion.value[0] || catalogo.value[0];
  return p ? encargoItem(p) : null;
});
async function cargarPromos() {
  try {
    const { default: http } = await import("@/app/api/http");
    const ids = new Set();
    for (let page = 1; page < 20; page++) {
      const { data } = await http.get("/products", { params: { limit: 100, page } });
      const l = data?.data || [];
      l.filter((p) => p.is_promo === true || p.is_promo === 1).forEach((p) => ids.add(String(p.id)));
      if (l.length < 100) break;
    }
    promoIds.value = ids;
  } catch { promoIds.value = new Set(); }
}

/* Selección y guion */
const ordenDe = (id) => { const i = seleccion.value.findIndex((p) => p.id === id); return i >= 0 ? i + 1 : 0; };
function alternar(p) {
  if (ordenDe(p.id)) return quitar(p.id);
  if (seleccion.value.length >= TOPE.value) return;
  seleccion.value.push(nuevoItem(p));
  if (activa.value === "intro" && seleccion.value.length === 1) activa.value = p.id;
  sugerir();
}
function quitar(id) {
  seleccion.value = seleccion.value.filter((p) => p.id !== id);
  if (activa.value === id) activa.value = "intro";
  if (!seleccion.value.length && paso.value > 2) paso.value = 2;
  sugerir();
}
function soltar(i) {
  const desde = arrastrando.value;
  arrastrando.value = null;
  destino.value = null;
  if (desde == null || desde === i) return;
  const l = seleccion.value.slice();
  const [x] = l.splice(desde, 1);
  l.splice(i, 0, x);
  seleccion.value = l;
  sugerir();
}
function limitarCaracteristicas(p) {
  const r = String(p.caracteristicas || "").split("\n");
  if (r.length > 3) p.caracteristicas = r.slice(0, 3).join("\n");
}
// Las características viajan como la descripción que el servicio parte en renglones.
const descripcionDe = (p) => String(p.caracteristicas || "").split("\n").map((x) => x.trim().replace(/[.·]+$/, "")).filter(Boolean).join(" · ").slice(0, 300);
const encargoItem = (p) => ({
  titulo: String(p.titulo || "").trim() || p.nombre,
  descripcion: descripcionDe(p) || undefined,
  etiqueta: p.etiqueta || undefined,
  precio: p.precio,
  precioAnterior: p.precioAnterior,
  imagen: p.imagen,
  cuotas: opciones.cuotas ? p.cuotas : undefined,
  stock: Number.isFinite(Number(p.stock)) ? Number(p.stock) : undefined,
});
const productoActivo = computed(() => seleccion.value.find((x) => x.id === activa.value) || null);
const tituloActiva = computed(() => {
  if (activa.value === "intro") return aperturaVista.value ? "Apertura" : "Portada · logo de la marca";
  if (activa.value === "cierre") return `Cierre · ${fuente.value?.textos?.llamado || "cierre"}`;
  const i = seleccion.value.findIndex((x) => x.id === activa.value);
  return i >= 0 ? `Escena ${i + 1} · ${seleccion.value[i].titulo}` : "";
});
function verEscena(id) { activa.value = id; paso.value = 3; }
const tipoActiva = computed(() => (activa.value === "intro" || activa.value === "cierre" ? activa.value : "item"));
const itemActivo = computed(() => { const p = seleccion.value.find((x) => x.id === activa.value); return p ? encargoItem(p) : null; });

// Duraciones de la plantilla (sin voz): portada 2,6 s, 3 s por producto (7 s si es uno solo), cierre 3,4 s.
const T = computed(() => ({ intro: 2.6, item: seleccion.value.length === 1 ? 7 : 3, cierre: 3.4 }));
const duracion = computed(() => T.value.intro + T.value.item * seleccion.value.length + T.value.cierre);

function armarEncargo() {
  const f = fuente.value;
  const items = seleccion.value.map(encargoItem);
  const conApertura = aperturaVista.value;
  // El formato de video viaja en "tipo" ("formato" es la medida, reel_9x16).
  // Si el servicio todavía no conoce un campo, lo descarta sin error.
  return {
    ...(CAMPO_FORMATO ? { [CAMPO_FORMATO]: formato.value } : {}),
    ...(conApertura ? { apertura: conApertura } : {}),
    cierre: { ...cierreOpc },
    titulo: datos.titulo.trim() || seleccion.value.map((p) => p.titulo).join(", ").slice(0, 80),
    descripcion: datos.descripcion.trim() || undefined,
    cuenta: f.cuenta,
    plantilla: items.length === 1 ? "producto" : "destacados",
    ajuste: f.ajuste,
    marca: f.marca,
    estilo: f.estilo,
    sellos: f.sellos,
    textos: f.textos,
    mediosDePago: opciones.cuotas ? f.mediosDePago || [] : [],
    sucursales: f.sucursales || [],
    redes: f.redes || [],
    ...sonidoDelEncargo(),
    items,
    voz: {
      activa: opciones.voz,
      locutor: opciones.locutor || undefined,
      velocidad: RITMOS.find((r) => r.v === opciones.ritmo)?.velocidad ?? 1,
      guion: {
        intro: guion.intro.trim() || undefined,
        items: seleccion.value.map((p) => (p.voz || "").trim()),
        cierre: guion.cierre.trim() || undefined,
      },
    },
  };
}

// La voz sugerida por el servicio, sin pisar lo que se escribió a mano.
let demoraGuion;
function sugerir() {
  clearTimeout(demoraGuion);
  demoraGuion = setTimeout(async () => {
    if (!fuente.value || !seleccion.value.length || !opciones.voz) {
      if (!guion.introEditada && apertura.titular.trim()) guion.intro = [apertura.titular.trim(), apertura.bajada.trim()].filter(Boolean).join(" ");
      return;
    }
    try {
      const e = armarEncargo();
      delete e.voz;
      delete e.musica;
      delete e.sonidos;
      delete e.titulo;
      delete e.descripcion;
      const g = await sugerirGuion(e);
      if (!guion.introEditada) guion.intro = g.intro || "";
      if (!guion.cierreEditada) guion.cierre = g.cierre || "";
      seleccion.value.forEach((p, i) => { if (!p.vozEditada) p.voz = g.items?.[i] || ""; });
    } catch { /* la sugerencia es opcional */ }
  }, 250);
}

/* Cupo mensual de videos (limite null = sin tope). Cuentan en cola, renderizando y
   listos; fallidos y cancelados no. Se relee cuando un video entra, falla o se cancela. */
const cupo = ref(null);
const sinCupo = computed(() => cupo.value?.limite != null && cupo.value.quedan <= 0);
const textoCupo = computed(() => (cupo.value?.limite != null ? `${cupo.value.usados} de ${cupo.value.limite} videos de ${cupo.value.nombreMes}` : ""));
async function cargarCupo() {
  try { cupo.value = await getCupo(); } catch { /* sin dato de cupo no se bloquea nada */ }
}

async function generar() {
  creando.value = true;
  error.value = "";
  try {
    const p = await crearPieza(armarEncargo());
    piezas.value = [p, ...piezas.value];
    seguir();
    datos.titulo = "";
    datos.descripcion = "";
    irA("videos");
  } catch (e) {
    if (e?.response?.data?.cupo) cupo.value = e.response.data.cupo;
    // El operador cambió lo habilitado con la pantalla abierta: se recarga y vuelve al paquete por defecto.
    if (e?.response?.status === 403 && e.response.data?.codigo === "recurso_no_habilitado") {
      await cargarRecursos();
      sonidoInicial();
      error.value = "Esa opción ya no está disponible.";
    } else error.value = mensaje(e);
  } finally { creando.value = false; cargarCupo(); }
}

/* Redes y publicación */
const nombreRed = (k) => ({ instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp" }[k] || k);
async function cargarRedes() {
  try { redes.value = (await getRedes()) || {}; } catch { redes.value = {}; }
}
async function conectar(r) {
  guardandoRed.value = true;
  try {
    await guardarRedes({ [r.k]: { [r.idK]: cred.id.trim(), token: cred.token.trim() } });
    cred.id = ""; cred.token = "";
    redAbierta.value = null;
    await cargarRedes();
  } catch (e) { error.value = mensaje(e); } finally { guardandoRed.value = false; }
}
async function cambiarEnsayo(ev) {
  const ensayo = ev.target.checked;
  guardandoRed.value = true;
  try { await guardarRedes({ ensayo }); await cargarRedes(); } catch (e) { error.value = mensaje(e); ev.target.checked = !ensayo; } finally { guardandoRed.value = false; }
}
const hashtags = computed(() => {
  const marca = String(fuente.value?.marca?.nombre || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, " ").trim();
  const camel = marca ? `#${marca.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}` : "";
  return ["#SanJuan", camel, "#Tecnologia", "#Ofertas", "#Cuotas"].filter(Boolean);
});
function alternarHashtag(h) {
  const t = textoPub.value;
  textoPub.value = t.includes(h) ? t.replace(new RegExp(`\\s*${h}\\b`), "") : `${t.trimEnd()}${/#\w+$/.test(t.trimEnd()) ? " " : "\n\n"}${h}`;
}
// Texto sugerido con lo que ya se sabe del video y de la tienda (se edita libre).
function textoSugerido(p) {
  const f = fuente.value || {};
  const items = (p.items || []).map((x) => x.titulo).filter(Boolean);
  const lineas = [];
  lineas.push(p.descripcion || p.titulo || (items.length === 1 ? items[0] : "Mirá lo que tenemos"));
  if (items.length > 1) lineas.push("", ...items.map((x) => `• ${x}`));
  const extra = [];
  if (f.sellos?.length) extra.push(...f.sellos);
  if (f.sucursales?.length) extra.push(`📍 ${f.sucursales.map((x) => x.nombre).join(" · ")}`);
  if (f.textos?.contacto) extra.push(`💬 ${f.textos.contacto}`);
  if (f.textos?.enlace) extra.push(`🌐 ${f.textos.enlace}`);
  if (extra.length) lineas.push("", ...extra);
  lineas.push("", hashtags.value.slice(0, 2).join(" "));
  return lineas.join("\n").slice(0, 2200);
}
async function abrirPublicar(v) {
  irA("publicar", { pieza: v.id });
}
async function cargarPublicar() {
  const id = route.query.pieza;
  if (vista.value !== "publicar" || !id) return;
  cargandoPub.value = true;
  confirmarPub.value = false;
  try {
    const [p] = await Promise.all([verPieza(String(id)), cargarRedes()]);
    piezaPub.value = p;
    if (textoDe.value !== p.id) { textoPub.value = textoSugerido(p); textoDe.value = p.id; }
    destinos.value = ["instagram", "facebook"].filter((k) => redes.value[k]).slice(0, 1);
  } catch { piezaPub.value = null; } finally { cargandoPub.value = false; }
}
watch(() => [vista.value, route.query.pieza], cargarPublicar);
watch(vista, (v) => { if (v === "redes") cargarRedes(); });
async function publicar() {
  if (redes.value.ensayo === false && !confirmarPub.value) {
    confirmarPub.value = true;
    setTimeout(() => { confirmarPub.value = false; }, 5000);
    return;
  }
  confirmarPub.value = false;
  publicando.value = true;
  try {
    await publicarPieza(piezaPub.value.id, { destinos: destinos.value, texto: textoPub.value.trim() });
    piezaPub.value = await verPieza(piezaPub.value.id);
  } catch (e) { error.value = mensaje(e); } finally { publicando.value = false; }
}

/* Videos */
async function cancelar(v) {
  if (confirmar.value !== v.id) {
    confirmar.value = v.id;
    setTimeout(() => { if (confirmar.value === v.id) confirmar.value = null; }, 4000);
    return;
  }
  confirmar.value = null;
  try {
    const n = await cancelarPieza(v.id);
    const i = piezas.value.findIndex((x) => x.id === v.id);
    if (i >= 0) piezas.value[i] = { ...piezas.value[i], ...n };
    cargarCupo();
  } catch (e) {
    if (e?.response?.status === 404) piezas.value = piezas.value.filter((x) => x.id !== v.id);
    else error.value = mensaje(e);
  }
}
// El enlace firmado vence a la hora: se pide la pieza de nuevo y se abre con
// descargar=1, que el servicio responde como descarga (Content-Disposition).
const bajando = ref(null);
async function bajar(v) {
  bajando.value = v.id;
  try {
    const n = await verPieza(v.id);
    const i = piezas.value.findIndex((x) => x.id === v.id);
    if (i >= 0) piezas.value[i] = n;
    if (!n.video) throw new Error("El video ya no está disponible.");
    const a = document.createElement("a");
    a.href = `${n.video}${n.video.includes("?") ? "&" : "?"}descargar=1`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    if (e?.response?.status === 404) piezas.value = piezas.value.filter((x) => x.id !== v.id);
    error.value = e?.message && !e?.response ? e.message : mensaje(e);
  } finally {
    bajando.value = null;
  }
}
function editar(v) {
  borrador.titulo = v.titulo || "";
  borrador.descripcion = v.descripcion || "";
  editando.value = v.id;
}
async function guardarDatos(v) {
  guardando.value = true;
  try {
    const n = await editarPieza(v.id, { titulo: borrador.titulo.trim() || null, descripcion: borrador.descripcion.trim() || null });
    const i = piezas.value.findIndex((x) => x.id === v.id);
    if (i >= 0) piezas.value[i] = { ...piezas.value[i], titulo: n.titulo, descripcion: n.descripcion };
    editando.value = null;
  } catch (e) { error.value = mensaje(e); } finally { guardando.value = false; }
}
async function borrar(v) {
  if (confirmar.value !== v.id) {
    confirmar.value = v.id;
    setTimeout(() => { if (confirmar.value === v.id) confirmar.value = null; }, 4000);
    return;
  }
  confirmar.value = null;
  try {
    try {
      await borrarPieza(v.id);
    } catch (e) {
      if (e?.response?.status !== 409 || v.estado !== "cancelada") throw e;
      await new Promise((r) => setTimeout(r, 1000));
      await borrarPieza(v.id);
    }
    piezas.value = piezas.value.filter((x) => x.id !== v.id);
  } catch (e) {
    if (e?.response?.status === 404) piezas.value = piezas.value.filter((x) => x.id !== v.id);
    else error.value = mensaje(e);
  }
}

// Mientras haya videos generándose, se consultan cada 3 segundos.
let reloj;
function seguir() {
  clearTimeout(reloj);
  const pendientes = piezas.value.filter((v) => v.estado === "en_cola" || v.estado === "renderizando");
  if (!pendientes.length) return;
  reloj = setTimeout(async () => {
    for (const v of pendientes) {
      try {
        const n = await verPieza(v.id);
        const i = piezas.value.findIndex((x) => x.id === v.id);
        if (i >= 0) {
          // El avance no retrocede mientras no vuelva a la cola (un reinicio del servicio).
          const antes = piezas.value[i];
          const volvioACola = n.estado === "en_cola" || /^en cola/i.test(n.etapa || "");
          if (n.estado === "renderizando" && !volvioACola && Number(n.progreso) < Number(antes.progreso)) n.progreso = antes.progreso;
          if (n.estado !== antes.estado && (n.estado === "error" || n.estado === "cancelada")) cargarCupo();
          piezas.value[i] = n;
        }
      } catch (e) {
        // Un video que ya no existe sale de la lista; otro error se reintenta.
        if (e?.response?.status === 404) piezas.value = piezas.value.filter((x) => x.id !== v.id);
      }
    }
    seguir();
  }, 3000);
}

onMounted(async () => {
  try {
    fuente.value = await getFuente();
  } catch (e) { error.value = mensaje(e); }
  cargarCatalogo();
  cargarRedes();
  cargarPublicar();
  cargarPromos();
  cargarCupo();
  listarVoces().then((l) => {
    voces.value = l;
    if (!opciones.locutor) opciones.locutor = (l.find((v) => v.porDefecto) || l[0])?.id || null;
  }).catch(() => { voces.value = []; });
  // El sonido arranca cuando se sabe qué hay: recursos del comercio o, si no, el catálogo.
  Promise.allSettled([cargarRecursos(), listarSonidos().then((c) => { sonidos.value = c; })]).then(sonidoInicial);
  try {
    piezas.value = await listarPiezas(30);
    seguir();
  } catch (e) { error.value = mensaje(e); }
});
document.addEventListener("visibilitychange", alOcultar);
onBeforeUnmount(() => { clearTimeout(reloj); clearTimeout(demoraGuion); cortarMuestra(); document.removeEventListener("visibilitychange", alOcultar); });
</script>

<style>
.sp.ct > * { max-width: 1440px; }
.ct-cab { align-items: center; flex-wrap: wrap; }
.ct-tabs { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--sp-caja); border: 1px solid var(--sp-borde); }
.ct-tabs button { height: 40px; padding: 0 18px; border: 0; border-radius: 10px; background: transparent; font: 800 15px Inter, sans-serif; color: var(--sp-texto); cursor: pointer; }
.ct-tabs button:hover:not(.is-on) { background: #cfe5f5; }
:is(.v-theme--dark, .v-theme--adminDark) .ct-tabs button:hover:not(.is-on) { background: #1a2a3a; }
.ct-tabs button.is-on { background: #0f6fae; color: #fff; }
.ct-tabs button span { margin-left: 4px; opacity: .8; }

.ct-col { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.ct-col > .sp-busca__campo { flex: 0 0 auto; }
.ct-pasos { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.ct-paso { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; background: var(--sp-caja); border: 1px solid var(--sp-borde); text-align: left; cursor: pointer; color: var(--sp-texto); font-family: Inter, sans-serif; }
.ct-paso:hover:not(:disabled):not(.is-on) { background: #cfe5f5; border-color: #3f8fc6; }
:is(.v-theme--dark, .v-theme--adminDark) .ct-paso:hover:not(:disabled):not(.is-on) { background: #1a2a3a; }
.ct-paso:disabled { cursor: default; opacity: .6; }
.ct-paso b { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--sp-linea); color: var(--sp-suave); font-size: 16px; font-weight: 900; flex-shrink: 0; }
.ct-paso span { display: flex; flex-direction: column; min-width: 0; }
.ct-paso strong { font-size: 16px; font-weight: 800; }
.ct-paso small { font-size: 13px; color: var(--sp-suave); }
.ct-paso.is-on { border: 2px solid #0f6fae; padding: 11px 15px; background: var(--sp-hover); }
.ct-paso.is-on b { background: #0f6fae; color: #fff; }
.ct-paso.is-ok b { background: #2E9E7B; color: #fff; }
.ct-paso.is-ok b .v-icon { color: #fff; }
.ct-formatos { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }
.ct-fmt { position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 12px; border-radius: 14px; background: var(--sp-caja); border: 1px solid var(--sp-borde); cursor: pointer; color: var(--sp-texto); font-family: Inter, sans-serif; }
.ct-fmt > b { font-size: 15px; font-weight: 800; }
.ct-fmt > span:last-child { font-size: 13px; color: var(--sp-suave); margin-top: -6px; }
.ct-fmt:hover:not(.is-on) { background: #cfe5f5; border-color: #3f8fc6; }
:is(.v-theme--dark, .v-theme--adminDark) .ct-fmt:hover:not(.is-on) { background: #1a2a3a; }
.ct-fmt.is-on { border: 2px solid #0f6fae; padding: 13px 11px; background: var(--sp-hover); }
.ct-fmt__ok { position: absolute; top: 8px; right: 8px; z-index: 1; width: 26px; height: 26px; border-radius: 50%; background: #0f6fae; display: flex; align-items: center; justify-content: center; }
.ct-fmt__ok .v-icon { color: #fff; }
.ct-desde { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 14px; flex: 0 0 auto; }
.ct-desde > b { font-size: 14px; }
.ct-desde__orden { margin-left: auto; font-size: 13px; font-weight: 700; color: var(--sp-suave); }
.ct-titular { font-size: 18px !important; font-weight: 800 !important; }
.ct-pregunta { flex: 0 0 auto; }
.ct-pregunta__cuerpo { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 4px 16px; padding: 8px 16px 16px; }
.ct-pregunta__cuerpo .ct-campo:last-child:nth-child(3) { grid-column: 1 / -1; }
.ct-cierre-opc { margin-bottom: 6px; }
.ct-p1 { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 16px; align-items: start; }
.ct-enreel .sp-caja { max-height: calc(100vh - 420px); overflow-y: auto; }
.ct-sel { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-bottom: 1px solid var(--sp-linea); background: var(--sp-caja); }
.ct-sel:last-child { border-bottom: 0; }
.ct-sel.is-arrastrando { opacity: .4; }
.ct-sel.is-destino { box-shadow: inset 0 3px 0 #0f6fae; }
.ct-sel__n { width: 28px; height: 28px; border-radius: 50%; background: #0f6fae; color: #fff; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ct-sel img { width: 52px; height: 52px; object-fit: contain; border-radius: 8px; border: 1px solid var(--sp-linea); background: #fff; flex-shrink: 0; }
.ct-sel__t { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ct-sel__t b { font-size: 14px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-sel__t span { font-size: 14px; font-weight: 700; color: var(--sp-suave); }
.ct-sel button { border: 0; background: transparent; color: var(--sp-suave); cursor: pointer; padding: 2px; border-radius: 6px; display: inline-flex; }
.ct-sel button:hover { color: #c2413a; background: rgba(194, 65, 58, .1); }
.ct-p2 { display: grid; grid-template-columns: 250px minmax(0, 1fr) 320px; gap: 18px; align-items: start; }
.ct-tira { display: flex; flex-direction: column; gap: 8px; }
.ct-ti { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 12px; background: var(--sp-caja); border: 1px solid var(--sp-borde); text-align: left; cursor: pointer; color: var(--sp-texto); font-family: Inter, sans-serif; }
.ct-ti .er { border-radius: 6px; box-shadow: none; border: 1px solid var(--sp-borde); }
.ct-ti > span { display: flex; flex-direction: column; min-width: 0; }
.ct-ti > span > small { font-size: 11px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; color: var(--sp-suave); }
.ct-ti > span > b { font-size: 14px; font-weight: 800; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ct-ti:hover:not(.is-on) { background: #cfe5f5; border-color: #3f8fc6; }
:is(.v-theme--dark, .v-theme--adminDark) .ct-ti:hover:not(.is-on) { background: #1a2a3a; }
.ct-ti.is-on { border: 2px solid #0f6fae; padding: 7px; background: var(--sp-hover); }
.ct-editor-caja .ct-editor { padding: 6px 18px 18px; }
.ct-p3 { display: flex; flex-direction: column; gap: 16px; }
.ct-pie__fin { display: flex; align-items: center; gap: 14px; }
.ct-cupo-agotado { font: 800 14px Inter, sans-serif; color: #c2413a; }
.ct-pie { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-radius: 12px; background: var(--sp-caja); border: 1px solid var(--sp-borde); }
.ct-atras { height: 50px; display: inline-flex; align-items: center; gap: 8px; padding: 0 22px; border-radius: 12px; background: var(--sp-caja); border: 1px solid var(--sp-borde); font: 800 16px Inter, sans-serif; color: var(--sp-texto); cursor: pointer; }
.ct-atras:hover { background: #cfe5f5; border-color: #3f8fc6; }
:is(.v-theme--dark, .v-theme--adminDark) .ct-atras:hover { background: #1a2a3a; }
.ct-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ct-chip { display: inline-flex; align-items: center; gap: 4px; padding: 7px 12px; border-radius: 9999px; background: var(--sp-caja); border: 1px solid var(--sp-borde); font: 700 13px Inter, sans-serif; color: var(--sp-texto); cursor: pointer; white-space: nowrap; }
.ct-chip b { font-weight: 700; color: var(--sp-suave); }
.ct-chip:hover:not(.is-on) { background: #cfe5f5; border-color: #3f8fc6; }
:is(.v-theme--dark, .v-theme--adminDark) .ct-chip:hover:not(.is-on) { background: #1a2a3a; }
.ct-chip.is-on { background: #0f6fae; border-color: #0f6fae; color: #fff; }
.ct-chip.is-on b { color: rgba(255, 255, 255, .85); }
.ct-menu-n { color: #64748b; margin-left: 6px; font-size: 13px; }
.ct-cuenta { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: var(--sp-suave); }
.ct-grilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
.ct-prod { position: relative; text-align: left; background: var(--sp-caja); border: 1px solid var(--sp-borde); border-radius: 12px; padding: 8px; display: flex; flex-direction: column; gap: 3px; cursor: pointer; color: var(--sp-texto); font-family: Inter, sans-serif; transition: background .12s, border-color .12s; }
.ct-prod img { width: 100%; aspect-ratio: 1; object-fit: contain; border-radius: 8px; background: #fff; }
.ct-prod__t { font-size: 13px; font-weight: 700; line-height: 1.25; height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.ct-prod__p { font-size: 16px; font-weight: 800; }
.ct-prod__s { font-size: 12px; color: var(--sp-suave); }
.ct-prod__n, .ct-prod__mas { position: absolute; top: 8px; z-index: 1; width: 30px; height: 30px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; background: #0f6fae; color: #fff; }
.ct-prod__n { left: 8px; font-size: 15px; font-weight: 900; box-shadow: 0 2px 6px rgba(0, 0, 0, .25); }
.ct-prod__off { position: absolute; top: 44px; right: 8px; z-index: 1; padding: 3px 7px; border-radius: 6px; background: #c2413a; color: #fff; font-size: 13px; font-weight: 900; }
.ct-prod__mas { right: 8px; opacity: 0; transition: opacity .12s; }
.ct-prod__mas .v-icon { color: #fff; }
.ct-prod:hover:not(.is-lleno) { background: #cfe5f5; border-color: #3f8fc6; }
:is(.v-theme--dark, .v-theme--adminDark) .ct-prod:hover:not(.is-lleno) { background: #1a2a3a; }
.ct-prod:hover:not(.is-on):not(.is-lleno) .ct-prod__mas { opacity: 1; }
.ct-prod.is-on { border: 2px solid #0f6fae; box-shadow: 0 0 0 3px #cfe5f5; padding: 7px; }
:is(.v-theme--dark, .v-theme--adminDark) .ct-prod.is-on { box-shadow: 0 0 0 3px #12304a; }
.ct-prod.is-lleno { opacity: .5; cursor: default; }
.ct-sentinela { height: 1px; grid-column: 1 / -1; }
.ct-grilla > .ct-vacio { grid-column: 1 / -1; }
/* El catálogo y la tira de escenas tienen su propio scroll: el layout de la app corta el sticky. */
.ct-p1 .ct-grilla { max-height: calc(100vh - 490px); min-height: 320px; overflow-y: auto; padding: 2px 4px 2px 2px; align-content: start; }
.ct-p2 .ct-tira { max-height: calc(100vh - 420px); overflow-y: auto; }
.ct-vacio { padding: 36px 16px; text-align: center; font-size: 15px; font-weight: 600; color: var(--sp-suave); }

.ct-es { display: flex; gap: 12px; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--sp-linea); background: var(--sp-caja); cursor: pointer; }
.ct-es:last-child { border-bottom: 0; }
.ct-es:hover:not(.is-on) { background: var(--sp-hover); }
.ct-es.is-on { background: var(--sp-hover); box-shadow: inset 4px 0 0 #0f6fae; align-items: flex-start; cursor: default; }
.ct-es.is-arrastrando { opacity: .4; }
.ct-es.is-destino { box-shadow: inset 0 3px 0 #0f6fae; }
.ct-es__th { width: 54px; flex-shrink: 0; }
.ct-es__th .er { border-radius: 6px; box-shadow: none; border: 1px solid var(--sp-borde); }
.ct-es__th--vacia { height: 96px; border-radius: 6px; border: 2px dashed var(--sp-borde); display: flex; align-items: center; justify-content: center; color: var(--sp-suave); }
.ct-es--vacia { cursor: default; font-size: 15px; font-weight: 700; color: var(--sp-suave); }
.ct-es__cuerpo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.ct-es__k { font-size: 12px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; color: var(--sp-suave); }
.ct-es__h { font-size: 16px; font-weight: 800; }
.ct-es__v { font-size: 13px; font-style: italic; color: var(--sp-suave); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-es__ctl { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--sp-suave); }
.ct-es__drag { cursor: grab; }
.ct-es__ctl button { border: 0; background: transparent; color: var(--sp-suave); cursor: pointer; padding: 2px; border-radius: 6px; display: inline-flex; }
.ct-es__ctl button:hover { color: #c2413a; background: rgba(194, 65, 58, .1); }
.ct-editor { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
.ct-campo { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
.ct-campo label { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 800; color: var(--sp-suave); }
.ct-campo input, .ct-campo textarea { width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); font: 500 14px/1.4 Inter, sans-serif; outline: 0; resize: vertical; }
.ct-campo input:focus, .ct-campo textarea:focus { border-color: #3f8fc6; box-shadow: 0 0 0 3px rgba(63, 143, 198, .18); }
.ct-precio { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; padding: 2px; }
.ct-precio b { font-size: 22px; font-weight: 800; }
.ct-precio s { font-size: 14px; color: var(--sp-suave); }
.ct-precio span { font-size: 13px; font-weight: 800; color: var(--sp-acento); }

.ct-prev__tel { display: flex; justify-content: center; }
.ct-sonido { padding: 4px 14px 6px; }
.ct-seg { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--sp-caja); border: 1px solid var(--sp-borde); margin: 6px 0; }
.ct-seg button { flex: 1; padding: 8px 4px; border: 0; border-radius: 9px; background: transparent; font: 700 13px Inter, sans-serif; color: var(--sp-texto); cursor: pointer; white-space: nowrap; }
.ct-seg button:hover:not(.is-on) { background: var(--sp-hover); }
.ct-seg button.is-on { background: #0f6fae; color: #fff; }
.ct-voz__oir { flex: none; width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid #0f6fae; border-radius: 50%; background: transparent; color: #0f6fae; cursor: pointer; }
.ct-voz__oir:hover, .ct-voz__oir.is-sonando { background: #0f6fae; color: #fff; }
.ct-voz__elegir { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; padding: 0; border: 0; background: transparent; text-align: left; color: var(--sp-texto); cursor: pointer; font-family: Inter, sans-serif; }
.ct-voz__elegir strong { font-size: 14px; font-weight: 800; }
.ct-voz__elegir--fijo { cursor: default; }
.ct-voz__oir--nada { border-color: var(--sp-borde); color: var(--sp-suave); cursor: default; }
.ct-voz__oir--nada:hover { background: transparent; color: var(--sp-suave); }
.ct-voz__elegir--fijo .ct-voz__rasgos { text-transform: none; }
.ct-voz__rasgos { font-size: 12px; font-weight: 700; text-transform: capitalize; opacity: .75; }
.ct-voz__elegir small { font-size: 12px; line-height: 1.35; opacity: .7; }
.ct-sw { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--sp-linea); font-size: 15px; font-weight: 700; cursor: pointer; }
.ct-sw--ultimo { border-bottom: 0; }
.ct-sw input { display: none; }
.ct-sw i { width: 40px; height: 22px; border-radius: 9999px; background: #c9d5e1; position: relative; transition: background .15s; flex-shrink: 0; }
.ct-sw i::after { content: ""; position: absolute; left: 3px; top: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: left .15s; }
.ct-sw input:checked + i { background: #0f6fae; }
.ct-sw input:checked + i::after { left: 21px; }
.ct-generar { height: 52px; padding: 0 26px; display: flex; align-items: center; justify-content: center; gap: 10px; border: 0; border-radius: 12px; background: #0f6fae; color: #fff !important; font: 800 17px Inter, sans-serif; cursor: pointer; }
.ct-generar .v-icon { color: #fff !important; }
.ct-generar:hover:not(:disabled) { background: #0a5a90; }
.ct-generar:disabled { opacity: .5; cursor: default; }

.ct-icono { width: 42px; height: 42px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-acento); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.ct-icono .v-icon { color: var(--sp-acento); }
.ct-icono:hover { background: #cfe5f5; border-color: #3f8fc6; }
.ct-redes { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 16px; align-items: start; }
.ct-red { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
.ct-red > b { flex: 1; font-size: 15px; }
.ct-red__ic { width: 40px; height: 40px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; color: #fff; font: 900 13px Inter, sans-serif; flex-shrink: 0; }
.ct-red__ic.is-instagram { background: linear-gradient(45deg, #f09433, #dc2743, #bc1888); }
.ct-red__ic.is-facebook { background: #1877f2; font-size: 18px; }
.ct-red__ic.is-whatsapp { background: #25d366; }
.ct-red__form { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr); gap: 4px 12px; padding: 0 16px 16px; border-top: 1px solid var(--sp-linea); }
.ct-red__acc { grid-column: 1 / -1; display: flex; justify-content: flex-end; margin-top: 8px; }
.ct-ok, .ct-no { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 9999px; font-size: 13px; font-weight: 800; white-space: nowrap; }
.ct-ok { background: #e3f4ee; color: #1f7a5c; }
.ct-ok .v-icon { color: #1f7a5c; }
.ct-no { background: var(--sp-linea); color: var(--sp-suave); }
.ct-lnk { border: 0; background: transparent; font: 800 15px Inter, sans-serif; color: var(--sp-acento); cursor: pointer; padding: 4px 6px; }
.ct-lnk:hover { text-decoration: underline; }
.ct-sw.is-bloq { opacity: .6; cursor: default; }
.ct-pub { display: flex; flex-direction: column; gap: 14px; }
.ct-volver { align-self: flex-start; }
.ct-pub__cab h2 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
.ct-pub__cab span { font-size: 14px; font-weight: 600; color: var(--sp-suave); }
.ct-ensayo { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; background: #fff4e5; color: #8a4b0f; font-size: 14px; font-weight: 700; }
.ct-ensayo .v-icon { color: #8a4b0f; }
:is(.v-theme--dark, .v-theme--adminDark) .ct-ensayo { background: #3a2a12; color: #f5c98a; }
:is(.v-theme--dark, .v-theme--adminDark) .ct-ensayo .v-icon { color: #f5c98a; }
.ct-pub__grilla { display: grid; grid-template-columns: 300px minmax(0, 1fr) 380px; gap: 18px; align-items: start; }
.ct-pub__video video { width: 300px; aspect-ratio: 9 / 16; border-radius: 16px; background: #000; display: block; box-shadow: 0 10px 30px rgba(7, 28, 47, .25); }
.ct-pub__texto { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.ct-pub__texto textarea { width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); font: 500 14px/1.5 Inter, sans-serif; outline: 0; resize: vertical; }
.ct-pub__texto textarea:focus { border-color: #3f8fc6; box-shadow: 0 0 0 3px rgba(63, 143, 198, .18); }
.ct-dest { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--sp-linea); cursor: pointer; }
.ct-dest input { width: 20px; height: 20px; accent-color: #0f6fae; }
.ct-dest.is-off { opacity: .55; cursor: default; }
.ct-dest__t { flex: 1; display: flex; flex-direction: column; }
.ct-dest__t b { font-size: 15px; }
.ct-dest__t small { font-size: 13px; color: var(--sp-suave); }
.ct-dest__ir { margin: 8px 12px 12px; }
.ct-hist { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--sp-linea); font-size: 13px; }
.ct-hist > span:first-child { color: var(--sp-suave); font-weight: 700; }
.ct-hist__r { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 3px 9px; border-radius: 9999px; font-weight: 800; }
.ct-hist__r.is-ok { background: #e3f4ee; color: #1f7a5c; }
.ct-hist__r.is-ens { background: #fff4e5; color: #8a4b0f; }
.ct-hist__r.is-err { background: #fdecea; color: #c2413a; }
.ct-hist__r a { color: inherit; }
.ct-hist__r small { font-weight: 600; }
.ct-generar.is-confirmar { background: #c2413a; }
.ct-videos { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; }
.ct-videos > .ct-vacio { grid-column: 1 / -1; }
.ct-video { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.ct-video__cab { display: flex; justify-content: space-between; gap: 8px; font-size: 14px; font-weight: 800; color: var(--sp-suave); }
.ct-video__cab b { color: #0f6fae; }
.ct-video__cab b.is-lista { color: #2E9E7B; }
.ct-video__cab b.is-error { color: #c2413a; }
.ct-video__barra { height: 6px; border-radius: 9999px; background: var(--sp-linea); overflow: hidden; }
.ct-video__barra span { display: block; height: 100%; background: #0f6fae; transition: width .4s; }
.ct-video__vis { aspect-ratio: 9 / 16; border-radius: 10px; overflow: hidden; background: #071c2f; }
.ct-video__vis video { width: 100%; height: 100%; display: block; background: #000; }
.ct-video__vacio { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #fff; }
.ct-video__vacio .v-icon { color: #fff; }
.ct-video__vacio.is-error { background: #2a1416; }
.ct-video__pie { display: flex; gap: 8px; }
.ct-video__armando { position: relative; height: 100%; }
.ct-video__cuadro { width: 100%; height: 100%; object-fit: cover; display: block; animation: ct-respira 2.4s ease-in-out infinite; }
@keyframes ct-respira { 0%, 100% { filter: brightness(.82); } 50% { filter: brightness(1); } }
.ct-video__onda { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 6px; background: radial-gradient(ellipse 85% 60% at 50% 40%, #2f7fd0 0%, #02498b 38%, #071c2f 100%); }
.ct-video__onda span { width: 8px; height: 60px; border-radius: 9999px; background: rgba(255, 255, 255, .85); animation: ct-onda 1s ease-in-out infinite; }
@keyframes ct-onda { 0%, 100% { transform: scaleY(.3); } 50% { transform: scaleY(1); } }
.ct-video__etapa { position: absolute; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; gap: 2px; padding: 26px 14px 12px; background: linear-gradient(transparent, rgba(7, 28, 47, .92)); color: #fff; }
.ct-video__etapa b { font-size: 16px; font-weight: 800; }
.ct-video__etapa span { font-size: 13px; font-weight: 600; opacity: .9; }
.ct-video__datos { display: flex; flex-direction: column; gap: 6px; }
.ct-video__titulo { display: flex; align-items: flex-start; gap: 6px; }
.ct-video__titulo b { flex: 1; font-size: 15px; font-weight: 800; line-height: 1.3; }
.ct-video__titulo b.is-tenue { color: var(--sp-tenue); }
.ct-video__titulo button { border: 0; background: transparent; color: var(--sp-suave); cursor: pointer; padding: 2px; border-radius: 6px; display: inline-flex; }
.ct-video__titulo button:hover { color: var(--sp-acento); background: var(--sp-hover); }
.ct-video__desc { margin: 0; font-size: 13px; line-height: 1.35; }
.ct-video__items { margin: 0; font-size: 12px; color: var(--sp-suave); line-height: 1.35; }
.ct-video__in { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 9px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); font: 500 14px/1.35 Inter, sans-serif; outline: 0; resize: vertical; }
.ct-video__in:focus { border-color: #3f8fc6; box-shadow: 0 0 0 3px rgba(63, 143, 198, .18); }
.ct-video__acc { display: flex; gap: 8px; align-items: center; }
.ct-video__cancelar { border: 0; background: transparent; font: 700 14px Inter, sans-serif; color: var(--sp-suave); cursor: pointer; padding: 0 6px; }
.ct-datos { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 14px; padding: 10px 16px 16px; }
.ct-video__esp { flex: 1; }
.ct-bajar { flex: 1; border: 0; cursor: pointer; height: 42px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 10px; background: #0f6fae; color: #fff !important; font: 800 15px Inter, sans-serif; text-decoration: none; white-space: nowrap; }
.ct-bajar .v-icon { color: #fff !important; }
.ct-bajar:hover { background: #0a5a90; }
.ct-borrar { height: 42px; min-width: 42px; padding: 0 10px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: #c2413a; font: 800 14px Inter, sans-serif; cursor: pointer; }
.ct-borrar .v-icon { color: #c2413a; }
.ct-borrar.is-confirmar { background: #c2413a; border-color: #c2413a; color: #fff; }
.ct-borrar.is-confirmar .v-icon { color: #fff; }

/* Sonido del reel: estilos prearmados, música y voz. */
.ct-son { padding: 14px 16px; display: grid; gap: 12px; min-width: 0; }
.ct-rot { font-size: 11px; font-weight: 900; letter-spacing: .05em; text-transform: uppercase; color: var(--sp-tenue); }
.ct-oir { flex: none; width: 30px; height: 30px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; border: 1.5px solid #0f6fae; background: var(--sp-caja); color: #0f6fae; cursor: pointer; }
.ct-oir .v-icon { color: inherit; }
.ct-oir:hover, .ct-oir.is-sonando { background: #0f6fae; color: #fff; }
.ct-paqs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.ct-paq { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; border: 1.5px solid var(--sp-borde); background: var(--sp-caja); cursor: pointer; color: var(--sp-texto); min-width: 0; }
.ct-paq:hover { border-color: rgba(15, 111, 174, .45); }
.ct-paq.is-on { border: 2px solid #0f6fae; padding: 9.5px 11.5px; background: rgba(15, 111, 174, .05); }
.ct-paq__t { min-width: 0; }
.ct-paq__t strong { display: block; font-size: 14.5px; font-weight: 900; }
.ct-paq.is-on .ct-paq__t strong { color: #0f6fae; }
.ct-paq__t small { display: block; font-size: 11.5px; font-weight: 600; color: var(--sp-suave); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-paq__ok { color: #0f6fae !important; }
.ct-mini-sw { display: inline-flex; align-items: center; gap: 7px; font-size: 11.5px; font-weight: 800; color: var(--sp-suave); cursor: pointer; user-select: none; }
.ct-mini-sw i { position: relative; flex-shrink: 0; width: 28px; height: 16px; border-radius: 8px; background: var(--sp-tenue); transition: background .15s; }
.ct-mini-sw i::after { content: ""; position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; transition: transform .15s; }
.ct-mini-sw[aria-checked="true"] i { background: #0f6fae; }
.ct-mini-sw[aria-checked="true"] i::after { transform: translateX(12px); }
.ct-ops { display: grid; grid-template-columns: repeat(auto-fill, minmax(178px, 1fr)); gap: 6px; }
.ct-ops--col { grid-template-columns: minmax(0, 1fr); }
.ct-op { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 9px; min-width: 0; padding: 7px 10px 7px 7px; border-radius: 11px; border: 1.5px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); cursor: pointer; }
.ct-op:hover { border-color: rgba(15, 111, 174, .45); }
.ct-op.is-on { border-color: #0f6fae; background: rgba(15, 111, 174, .06); }
.ct-op__t { min-width: 0; }
.ct-op__t strong { display: block; font-size: 13.5px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-op.is-on .ct-op__t strong { color: #0f6fae; }
.ct-op__t small { display: block; font-size: 11.5px; font-weight: 600; color: var(--sp-suave); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-op__rd { color: var(--sp-tenue) !important; }
.ct-op.is-on .ct-op__rd { color: #0f6fae !important; }
.ct-op__hueco { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; color: var(--sp-tenue); }
.ct-voces2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.ct-voces2__col { display: grid; gap: 6px; align-content: start; }
.ct-fila { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.ct-seg--chico { margin: 0; }
.ct-seg--chico button { flex: none; padding: 5px 12px; }
.ct-datos__cuotas { grid-column: 1 / -1; }
:is(.v-theme--dark, .v-theme--adminDark) :is(.ct-oir, .ct-ops .ct-op__rd) { border-color: var(--sp-acento); }

@media (max-width: 1100px) {
  .ct-pub__grilla { grid-template-columns: 260px minmax(0, 1fr); }
  .ct-pub__grilla > .ct-col { grid-column: 1 / -1; }
  .ct-pub__video video { width: 260px; }
  .ct-redes { grid-template-columns: minmax(0, 1fr); }
  .ct-p2 { grid-template-columns: 220px minmax(0, 1fr); }
  .ct-p2 .ct-prev__tel { grid-column: 1 / -1; }
}
@media (max-width: 900px) {
  .ct-p1, .ct-p2 { grid-template-columns: minmax(0, 1fr); }
  .ct-enreel { order: -1; }
  .ct-p1 .ct-grilla { max-height: 60vh; }
  .ct-tira { flex-direction: row; overflow-x: auto; }
  .ct-ti { flex-direction: column; min-width: 110px; }
  .ct-datos { grid-template-columns: minmax(0, 1fr); }
  .ct-paqs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ct-voces2 { grid-template-columns: minmax(0, 1fr); }
  .ct-paso small { display: none; }
  .ct-pasos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ct-grilla { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
