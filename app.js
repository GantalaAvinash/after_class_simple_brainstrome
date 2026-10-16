import { createApp } from './vendor/vue.esm-browser.prod.js';
import { createApi, resolveApiBase } from './api.mjs';
import { sortLessons, formatPrice, changeCart, cartLines, contactErrors } from './state.mjs';
import { createAttempt, restoreAttempt, saveAttempt, submitAttempt, STORAGE_KEY } from './checkout.mjs';

createApp({
  data() {
    return {
      lessons: {}, resultIds: [], cart: {}, loading: true, error: '', api: null, apiBase: '',
      sortField: 'topic', sortDirection: 'asc', announcement: '',
      view: 'catalogue', busy: false,
      name: '', phone: '', touched: false, checkoutError: '', confirmation: '',
      attempt: null, storage: null,
      searchTerm: '', teacherId: '', teachers: [], teacherError: '',
      searchTimer: null, searchController: null, requestVersion: 0,
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
    contactError() { return contactErrors(this.name, this.phone); },
    cartLocked() { return this.busy || Boolean(this.attempt); },
    canCheckout() {
      return this.cartCount > 0 && !this.busy && !this.contactError.name && !this.contactError.phone && (Boolean(this.attempt) || !this.cartConflict);
    },
  },
  watch: {
    searchTerm() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.loadLessons(), 300);
    },
    teacherId() { this.loadLessons(); },
  },
  methods: {
    formatPrice,
    imageUrl(path) { return this.apiBase + path; },
    addPlace(id) {
      if (this.cartLocked) return;
      const before = this.cart[id] || 0;
      this.cart = changeCart(this.lessons, this.cart, id, 1);
      if (this.cart[id] !== before) this.announcement = 'One place for ' + this.lessons[id].topic + ' added to your basket.';
    },
    removePlace(id) {
      if (this.cartLocked) return;
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
    mergeLessons(lessons) {
      if (!Array.isArray(lessons)) throw new Error('The lesson service returned an unexpected response.');
      for (const lesson of lessons) this.lessons[lesson._id] = lesson;
    },
    async refreshAll() { this.mergeLessons(await this.api('/lessons')); },
    async loadTeachers() {
      try {
        const teachers = await this.api('/teachers');
        if (!Array.isArray(teachers)) throw new Error();
        this.teachers = teachers;
        this.teacherError = '';
      } catch { this.teacherError = 'Teachers could not be loaded. You can still browse all activities.'; }
    },
    clearFilters() { this.searchTerm = ''; this.teacherId = ''; },
    forgetAttempt() {
      this.attempt = null;
      try { this.storage?.removeItem(STORAGE_KEY); } catch { this.announcement = 'Your browser could not clear the saved checkout.'; }
    },
    async checkout() {
      this.touched = true;
      if (!this.canCheckout) return;
      this.busy = true;
      this.checkoutError = '';
      try {
        if (!this.attempt) {
          const attempt = createAttempt(this.name, this.phone, this.cartItems);
          saveAttempt(this.storage, attempt);
          this.attempt = attempt;
        }
        const result = await submitAttempt(this.api, this.attempt, (attempt) => saveAttempt(this.storage, attempt));
        if (result.lessons) this.mergeLessons(result.lessons);
        this.forgetAttempt();
        this.cart = {};
        this.name = ''; this.phone = ''; this.touched = false;
        this.confirmation = 'Your order has been submitted. Reference: ' + result.orderId;
        this.announcement = this.confirmation;
        this.view = 'catalogue';
        this.focusView();
        try { await this.refreshAll(); await this.loadLessons(); }
        catch { this.error = 'Your order is confirmed, but activities could not be refreshed. Please try again.'; }
      } catch (error) {
        this.checkoutError = error.message;
        if ([400, 404, 409].includes(error.status)) {
          this.forgetAttempt();
          try { await this.refreshAll(); } catch { /* Preserve the checkout error and basket. */ }
        }
      } finally { this.busy = false; }
    },
    async loadLessons() {
      clearTimeout(this.searchTimer);
      this.searchController?.abort();
      const controller = new AbortController();
      this.searchController = controller;
      const version = ++this.requestVersion;
      this.loading = true;
      this.error = '';
      try {
        this.apiBase = resolveApiBase(window.AFTERCLASS_CONFIG?.apiBaseUrl, window.location);
        this.api ||= createApi(this.apiBase);
        const params = new URLSearchParams();
        if (this.searchTerm.trim()) params.set('q', this.searchTerm.trim());
        if (this.teacherId) params.set('teacherId', this.teacherId);
        const lessons = await this.api('/lessons' + (params.size ? '?' + params : ''), { signal: controller.signal });
        if (version !== this.requestVersion) return;
        this.mergeLessons(lessons);
        this.resultIds = lessons.map((lesson) => lesson._id);
      } catch (error) {
        if (!controller.signal.aborted && version === this.requestVersion) this.error = error.message;
      } finally { if (version === this.requestVersion) this.loading = false; }
    },
  },
  mounted() {
    try { this.storage = window.sessionStorage; } catch { /* Checkout reports unavailable storage on submit. */ }
    if (this.storage) this.attempt = restoreAttempt(this.storage);
    if (this.attempt) {
      this.name = this.attempt.payload.name;
      this.phone = this.attempt.payload.phone;
      this.cart = Object.fromEntries(this.attempt.payload.items.map((item) => [item.lessonId, item.quantity]));
      this.view = 'cart';
    }
    this.loadLessons();
    if (this.api) this.loadTeachers();
  },
  beforeUnmount() { clearTimeout(this.searchTimer); this.searchController?.abort(); },
}).mount('#app');
