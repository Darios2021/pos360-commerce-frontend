import { computed } from "vue";
import { useDisplay } from "vuetify";
import { posLayoutConfig } from "../config/posLayout.config";

export function usePosLayoutConfig() {
  const { mdAndDown, smAndDown } = useDisplay();

  const currentConfig = computed(() => {
    if (smAndDown.value) return posLayoutConfig.mobile;
    if (mdAndDown.value) return posLayoutConfig.tablet;
    return posLayoutConfig.desktop;
  });

  const rootStyle = computed(() => {
    const cfg = currentConfig.value;

    return {
      "--pos-root-gap": cfg.root.gap,
      "--pos-root-padding": cfg.root.padding,
      "--pos-header-height": cfg.root.headerHeight,
      "--pos-grid-left": cfg.grid.leftWidth,
      "--pos-grid-right": cfg.grid.rightWidth,
      "--pos-grid-gap": cfg.grid.gap,
    };
  });

  const topbarMeta = computed(() => currentConfig.value.sections.topbar);
  const leftMeta = computed(() => currentConfig.value.sections.left);
  const rightMeta = computed(() => currentConfig.value.sections.right);

  const topbarStyle = computed(() => ({
    order: String(topbarMeta.value.order ?? 1),
    minHeight: topbarMeta.value.minHeight ?? "auto",
  }));

  const leftStyle = computed(() => ({
    order: String(leftMeta.value.order ?? 2),
    minHeight: leftMeta.value.minHeight ?? "0",
  }));

  const rightStyle = computed(() => ({
    order: String(rightMeta.value.order ?? 3),
    minHeight: rightMeta.value.minHeight ?? "0",
  }));

  return {
    currentConfig,
    rootStyle,
    topbarMeta,
    leftMeta,
    rightMeta,
    topbarStyle,
    leftStyle,
    rightStyle,
  };
}