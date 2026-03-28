import { computed } from "vue";
import { useDisplay } from "vuetify";
import { posScreenConfig } from "../config/posScreen.config";

export function usePosScreenConfig() {
  const { mdAndDown, smAndDown } = useDisplay();

  const cfg = computed(() => {
    if (smAndDown.value) return posScreenConfig.mobile;
    if (mdAndDown.value) return posScreenConfig.tablet;
    return posScreenConfig.desktop;
  });

  const rootStyle = computed(() => ({
    "--pos-root-padding": cfg.value.root.padding,
    "--pos-root-gap": cfg.value.root.gap,

    "--pos-row-topbar": cfg.value.rows.topbar,
    "--pos-row-middle": cfg.value.rows.middle,
    "--pos-row-bottom": cfg.value.rows.bottom,

    "--pos-middle-left": cfg.value.middle.left,
    "--pos-middle-right": cfg.value.middle.right,
    "--pos-middle-gap": cfg.value.middle.gap,

    "--pos-bottom-left": cfg.value.bottom.left,
    "--pos-bottom-right": cfg.value.bottom.right,
    "--pos-bottom-gap": cfg.value.bottom.gap,

    "--pos-shell-radius": cfg.value.shells.radius,
    "--pos-shell-topbar-padding": cfg.value.shells.topbarPadding,
    "--pos-shell-search-padding": cfg.value.shells.searchPadding,
    "--pos-shell-caja-padding": cfg.value.shells.cajaPadding,
    "--pos-shell-cart-padding": cfg.value.shells.cartPadding,
    "--pos-shell-customer-padding": cfg.value.shells.customerPadding,
  }));

  return {
    cfg,
    rootStyle,
  };
}