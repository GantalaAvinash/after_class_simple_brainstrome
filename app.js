import { createApp } from './vendor/vue.esm-browser.prod.js';
import { createApi, resolveApiBase } from './api.mjs';
import { sortLessons, formatPrice } from './state.mjs';

createApp({
  data() {
    return {
      lessons: {}, resultIds: [], cart: {}, loading: true, error: '', api: null, apiBase: '',
      sortField: 'topic', sortDirection: 'asc', announcement: '',
    };
  },
  computed: {
    visibleLessons() {
      return sortLessons(this.resultIds.map((id) => this.lessons[id]).filter(Boolean), this.cart, this.sortField, this.sortDirection);
    },
  },
  methods: {
    formatPrice,
    imageUrl(path) { return this.apiBase + path; },
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
