// Tokens globales compartidos por todo el módulo POS.
// Se inyectan como CSS variables a nivel del contenedor raíz del POS
// (ver usePosUiConfig + PosPage.vue) para que queden disponibles en
// cualquier componente hijo y puedan usarse también desde <style scoped>.
export const posUiTokens = {
  // Escala de radius
  "--pos-radius-sm": "8px",
  "--pos-radius-md": "12px",
  "--pos-radius-lg": "16px",
  "--pos-radius-xl": "20px",

  // Superficie card
  "--pos-card-border": "rgba(var(--v-theme-on-surface), 0.1)",
  "--pos-card-shadow": "0 8px 24px rgba(0, 0, 0, 0.06)",

  // Focus ring
  "--pos-focus-ring": "2px solid rgb(var(--v-theme-primary))",
  "--pos-focus-offset": "2px",

  // Escala tipográfica
  "--pos-text-xs": "11px",
  "--pos-text-sm": "12px",
  "--pos-text-base": "13px",
  "--pos-text-md": "14px",
  "--pos-text-lg": "16px",
  "--pos-text-xl": "20px",

  // Pesos tipográficos
  "--pos-font-regular": "500",
  "--pos-font-semibold": "700",
  "--pos-font-bold": "900",

  // KPI colors (usados por badges en PosSalesPage). Valores claros;
  // el dark mode se maneja vía rgba/opacidad a nivel consumidor.
  "--pos-kpi-color-1": "#f57c00", // warning-ish / naranja
  "--pos-kpi-color-2": "#5c6bc0", // indigo / info alternativo
  "--pos-kpi-color-3": "#9c27b0", // morado / secundario
  "--pos-kpi-color-4": "#009688", // teal / alternativo
};

export const posUiConfig = {
  desktop: {
    layout: {
      rootPadding: "6px",
      gap: "6px",
      topbarHeight: "88px",

      leftColumn: "1.46fr",
      rightColumn: "1.04fr",
      rightMinWidth: "430px",

      rightStackGap: "6px",

      cajaHeight: "68px",
      cartMinHeight: "220px",
    },

    shell: {
      radius: "14px",
      topbarPadding: "6px 8px",
      searchPadding: "0px",
      cajaPadding: "0px",
      cartPadding: "0px",
    },

    search: {
      inputMinHeight: "50px",
      inputFontSize: "15px",
      inputRadius: "14px",
      toggleHeight: "50px",
      toggleMinWidth: "116px",
      shellPadding: "8px",
    },

    product: {
      rowMinHeight: "118px",
      rowPadding: "9px",
      imageSize: "76px",
      titleSize: "15px",
      metaSize: "10px",
      priceSize: "16px",
      actionButtonSize: "42px",
      chipHeight: "40px",
      chipRadius: "12px",
    },

    caja: {
      shellPadding: "8px",
      titleSize: "14px",
      metaSize: "12px",
      badgeHeight: "32px",
      buttonHeight: "32px",
      cardMinHeight: "68px",
    },

    cart: {
      shellPadding: "8px",
      titleSize: "14px",
      itemSize: "12px",
      totalSize: "18px",
      buttonHeight: "38px",
      panelMinHeight: "220px",
    },

    topbar: {
      buttonHeight: "52px",
      keySize: "16px",
      iconSize: "20px",
      shellPadding: "6px 10px",
    },
  },

  tablet: {
    layout: {
      rootPadding: "6px",
      gap: "6px",
      topbarHeight: "82px",

      leftColumn: "1.32fr",
      rightColumn: "1.04fr",
      rightMinWidth: "380px",

      rightStackGap: "6px",

      cajaHeight: "64px",
      cartMinHeight: "210px",
    },

    shell: {
      radius: "13px",
      topbarPadding: "6px 8px",
      searchPadding: "0px",
      cajaPadding: "0px",
      cartPadding: "0px",
    },

    search: {
      inputMinHeight: "48px",
      inputFontSize: "14px",
      inputRadius: "14px",
      toggleHeight: "48px",
      toggleMinWidth: "108px",
      shellPadding: "8px",
    },

    product: {
      rowMinHeight: "110px",
      rowPadding: "8px",
      imageSize: "70px",
      titleSize: "14px",
      metaSize: "10px",
      priceSize: "15px",
      actionButtonSize: "40px",
      chipHeight: "38px",
      chipRadius: "12px",
    },

    caja: {
      shellPadding: "8px",
      titleSize: "13px",
      metaSize: "11.5px",
      badgeHeight: "30px",
      buttonHeight: "30px",
      cardMinHeight: "64px",
    },

    cart: {
      shellPadding: "8px",
      titleSize: "13px",
      itemSize: "11.5px",
      totalSize: "17px",
      buttonHeight: "36px",
      panelMinHeight: "210px",
    },

    topbar: {
      buttonHeight: "48px",
      keySize: "15px",
      iconSize: "18px",
      shellPadding: "6px 8px",
    },
  },

  mobile: {
    layout: {
      rootPadding: "6px",
      gap: "6px",
      topbarHeight: "auto",

      leftColumn: "1fr",
      rightColumn: "1fr",
      rightMinWidth: "100%",

      rightStackGap: "6px",

      cajaHeight: "auto",
      cartMinHeight: "200px",
    },

    shell: {
      radius: "12px",
      topbarPadding: "4px 6px",
      searchPadding: "0px",
      cajaPadding: "0px",
      cartPadding: "0px",
    },

    search: {
      inputMinHeight: "46px",
      inputFontSize: "14px",
      inputRadius: "13px",
      toggleHeight: "46px",
      toggleMinWidth: "100px",
      shellPadding: "7px",
    },

    product: {
      rowMinHeight: "104px",
      rowPadding: "8px",
      imageSize: "66px",
      titleSize: "13.5px",
      metaSize: "9.5px",
      priceSize: "14px",
      actionButtonSize: "36px",
      chipHeight: "36px",
      chipRadius: "11px",
    },

    caja: {
      shellPadding: "7px",
      titleSize: "12.5px",
      metaSize: "11px",
      badgeHeight: "30px",
      buttonHeight: "30px",
      cardMinHeight: "auto",
    },

    cart: {
      shellPadding: "7px",
      titleSize: "12.5px",
      itemSize: "11px",
      totalSize: "16px",
      buttonHeight: "34px",
      panelMinHeight: "200px",
    },

    topbar: {
      buttonHeight: "44px",
      keySize: "13px",
      iconSize: "17px",
      shellPadding: "6px",
    },
  },
};