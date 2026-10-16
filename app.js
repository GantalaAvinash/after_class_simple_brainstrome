import { createApp } from './vendor/vue.esm-browser.prod.js';
import { createApi, resolveApiBase } from './api.mjs';
import { sortLessons, formatPrice, changeCart, cartLines } from './state.mjs';

createApp({
  data() {
    return {
      lessons: {}, resultIds: [], cart: {}, loading: true, error: '', api: null, apiBase: '',
      sortField: 'topic', sortDirection: 'asc', announcement: '',
      view: 'catalogue', busy: false,
    };
  },
  computed: {
    visibleLessons() {
      return sortLessons(this.resultIds.map((id) => this.lessons[id]).filter(Boolean), this.cart, this.sortField, this.sortDirection);
    },
    cartItems() { return cartLines(this.lessons, this.cart); },
    cartCount() { return this.cartItems.reduce((sum, item) => sum + item.quantity, 0); },
    cartTotal() { return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0); },
    cartConflict() { return this.cartItems.some((item) => item.missing || item.quantity > item.space); },
  },
  methods: {
    formatPrice,
    imageUrl(path) { return this.apiBase + path; },
    addPlace(id) {
      if (this.busy) return;
      const before = this.cart[id] || 0;
      this.cart = changeCart(this.lessons, this.cart, id, 1);
      if (this.cart[id] !== before) this.announcement = 'One place for ' + this.lessons[id].topic + ' added to your basket.';
    },
    removePlace(id) {
      if (this.busy) return;
      this.cart = changeCart(this.lessons, this.cart, id, -1);
      this.announcement = 'One place removed from your basket.';
      if (!this.cartCount) { this.view = 'catalogue'; this.focusView(); }
    },
    focusView() {
      this.$nextTick(() => document.getElementById(this.view === 'cart' ? 'cart' : 'catalogue')?.focus());
    },
    toggleCart() {
      if (!this.cartCount && this.view !== 'cart') return;
      this.view = this.view === 'cart' ? 'catalogue' : 'cart';
      this.focusView();
    },
    async loadLessons() {
      this.loading = true;
      this.error = '';
      try {
        this.apiBase = resolveApiBase(window.AFTERCLASS_CONFIG?.apiBaseUrl, window.location);
        this.api ||= createApi(this.apiBase);
        const lessons = await this.api('/lessons');
        if (!Array.isArray(lessons)) throw new Error('The lesson service returned an unexpected response.');
        for (const lesson of lessons) this.lessons[lesson._id] = lesson;
        this.resultIds = lessons.map((lesson) => lesson._id);
      } catch (error) { this.error = error.message; }
      finally { this.loading = false; }
    },
  },
  mounted() { this.loadLessons(); },
}).mount('#app');
