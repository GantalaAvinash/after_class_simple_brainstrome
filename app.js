/* global Vue */
Vue.createApp({
  data() {
    return { lessons: [], loading: true, error: '' };
  },
  methods: {
    apiBaseUrl() {
      const configured = window.AFTERCLASS_CONFIG?.apiBaseUrl?.trim();
      const local = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (!configured && !local) {
        throw new Error('The hosted API address must be configured before this site can load lessons.');
      }
      const url = new URL(configured || 'http://localhost:3000');
      if (!['https:', 'http:'].includes(url.protocol) || (!local && url.protocol !== 'https:')) {
        throw new Error('The hosted API address must use HTTPS.');
      }
      return url.href.replace(/\/$/, '');
    },
    async loadLessons() {
      this.loading = true;
      this.error = '';
      try {
        const response = await fetch(`${this.apiBaseUrl()}/lessons`);
        if (!response.ok) throw new Error(`The lesson request failed (${response.status}). Please try again.`);
        const lessons = await response.json();
        if (!Array.isArray(lessons)) throw new Error('The API returned an unexpected lesson response.');
        this.lessons = lessons;
      } catch (error) {
        this.error = error instanceof TypeError
          ? 'Lessons are temporarily unavailable. Please check your connection and try again.'
          : error.message;
      } finally {
        this.loading = false;
      }
    },
    formatPrice(price) {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(price);
    },
  },
  mounted() {
    this.loadLessons();
  },
}).mount('#app');
