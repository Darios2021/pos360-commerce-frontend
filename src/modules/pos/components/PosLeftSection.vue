<style scoped>
.pos-left-section {
  display: flex;
  flex-direction: column;
  gap: var(--pos-gap, 8px);
  min-height: 0;
  height: 100%;
}

.pos-left-section__search {
  flex: 0 0 auto;
  padding: var(--pos-search-shell-padding, 10px);
  border-radius: var(--pos-shell-radius, 14px);
}

.pos-left-section__products {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  border-radius: var(--pos-shell-radius, 14px);
}
</style>