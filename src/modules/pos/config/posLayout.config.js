export const posLayoutConfig = {
  desktop: {
    root: {
      gap: "10px",
      padding: "8px",
      headerHeight: "auto",
    },

    grid: {
      leftWidth: "minmax(0, 1.45fr)",
      rightWidth: "minmax(320px, 0.95fr)",
      gap: "10px",
    },

    sections: {
      topbar: {
        visible: true,
        order: 1,
        minHeight: "auto",
      },

      left: {
        visible: true,
        order: 2,
        minHeight: "0",
      },

      right: {
        visible: true,
        order: 3,
        minHeight: "0",
      },
    },
  },

  tablet: {
    root: {
      gap: "10px",
      padding: "8px",
      headerHeight: "auto",
    },

    grid: {
      leftWidth: "minmax(0, 1.2fr)",
      rightWidth: "minmax(300px, 0.9fr)",
      gap: "10px",
    },

    sections: {
      topbar: {
        visible: true,
        order: 1,
        minHeight: "auto",
      },

      left: {
        visible: true,
        order: 2,
        minHeight: "0",
      },

      right: {
        visible: true,
        order: 3,
        minHeight: "0",
      },
    },
  },

  mobile: {
    root: {
      gap: "10px",
      padding: "8px",
      headerHeight: "auto",
    },

    grid: {
      leftWidth: "1fr",
      rightWidth: "1fr",
      gap: "10px",
    },

    sections: {
      topbar: {
        visible: true,
        order: 1,
        minHeight: "auto",
      },

      left: {
        visible: true,
        order: 2,
        minHeight: "0",
      },

      right: {
        visible: true,
        order: 3,
        minHeight: "0",
      },
    },
  },
};