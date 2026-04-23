import { computed } from "vue";
import { useDisplay } from "vuetify";
import { posUiConfig, posUiTokens } from "../config/posUi.config";

export function usePosUiConfig() {
  const { mdAndDown, smAndDown } = useDisplay();

  const cfg = computed(() => {
    if (smAndDown.value) return posUiConfig.mobile;
    if (mdAndDown.value) return posUiConfig.tablet;
    return posUiConfig.desktop;
  });

  const cssVars = computed(() => ({
    // Tokens globales del módulo POS (radius, bordes, shadows, focus ring)
    ...posUiTokens,

    "--pos-root-padding": cfg.value.layout.rootPadding,
    "--pos-gap": cfg.value.layout.gap,
    "--pos-topbar-height": cfg.value.layout.topbarHeight,
    "--pos-left-column": cfg.value.layout.leftColumn,
    "--pos-right-column": cfg.value.layout.rightColumn,
    "--pos-right-min-width": cfg.value.layout.rightMinWidth,
    "--pos-right-stack-gap": cfg.value.layout.rightStackGap,
    "--pos-caja-height": cfg.value.layout.cajaHeight,
    "--pos-cart-min-height": cfg.value.layout.cartMinHeight,

    "--pos-shell-radius": cfg.value.shell.radius,
    "--pos-shell-topbar-padding": cfg.value.shell.topbarPadding,
    "--pos-shell-search-padding": cfg.value.shell.searchPadding,
    "--pos-shell-caja-padding": cfg.value.shell.cajaPadding,
    "--pos-shell-cart-padding": cfg.value.shell.cartPadding,

    "--pos-search-input-height": cfg.value.search.inputMinHeight,
    "--pos-search-input-font": cfg.value.search.inputFontSize,
    "--pos-search-input-radius": cfg.value.search.inputRadius,
    "--pos-search-toggle-height": cfg.value.search.toggleHeight,
    "--pos-search-toggle-min-width": cfg.value.search.toggleMinWidth,
    "--pos-search-shell-padding": cfg.value.search.shellPadding,

    "--pos-product-row-min-height": cfg.value.product.rowMinHeight,
    "--pos-product-row-padding": cfg.value.product.rowPadding,
    "--pos-product-image-size": cfg.value.product.imageSize,
    "--pos-product-title-size": cfg.value.product.titleSize,
    "--pos-product-meta-size": cfg.value.product.metaSize,
    "--pos-product-price-size": cfg.value.product.priceSize,
    "--pos-product-action-size": cfg.value.product.actionButtonSize,
    "--pos-product-chip-height": cfg.value.product.chipHeight,
    "--pos-product-chip-radius": cfg.value.product.chipRadius,

    "--pos-caja-shell-padding": cfg.value.caja.shellPadding,
    "--pos-caja-title-size": cfg.value.caja.titleSize,
    "--pos-caja-meta-size": cfg.value.caja.metaSize,
    "--pos-caja-badge-height": cfg.value.caja.badgeHeight,
    "--pos-caja-button-height": cfg.value.caja.buttonHeight,
    "--pos-caja-card-min-height": cfg.value.caja.cardMinHeight,

    "--pos-cart-shell-padding": cfg.value.cart.shellPadding,
    "--pos-cart-title-size": cfg.value.cart.titleSize,
    "--pos-cart-item-size": cfg.value.cart.itemSize,
    "--pos-cart-total-size": cfg.value.cart.totalSize,
    "--pos-cart-button-height": cfg.value.cart.buttonHeight,
    "--pos-cart-panel-min-height": cfg.value.cart.panelMinHeight,

    "--pos-topbar-button-height": cfg.value.topbar.buttonHeight,
    "--pos-topbar-key-size": cfg.value.topbar.keySize,
    "--pos-topbar-icon-size": cfg.value.topbar.iconSize,
    "--pos-topbar-shell-padding": cfg.value.topbar.shellPadding,
  }));

  return {
    cfg,
    cssVars,
  };
}