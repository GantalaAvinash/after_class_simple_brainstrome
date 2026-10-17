# AfterClass visual system

An editorial education brand: forest green anchors, warm paper surfaces, sage and clay activity art, expressive serif headings and practical sans-serif controls. The landing composition uses real catalogue data, locally served attributed icons and CSS geometry. There are no fabricated ratings, customer testimonials, credentials, awards or payment claims.

`styles.css` holds shared foundational controls, cart and accessibility rules. `experience.css` supplies discovery-page styling; `admin.css` supplies Studio. Keeping page-specific layers separate avoids accidental changes to checkout or admin controls. CSS comments and formatted source explain the intent rather than narrating obvious declarations.

The discovery page offers a strong hero, featured-activity composition, category tabs, labelled search/teacher controls, three/two/one-column lesson cards and a three-step booking explanation. Card art colours depend on lesson ID, so sorting does not reshuffle colours. Topic-keyword categories are a convenience filter; unknown topics use More to discover. Required four-field search still happens on the backend.

Studio uses a persistent desktop sidebar, compact mobile navigation, four numeric summaries, a searchable lesson library, inline editor, native delete-confirmation dialog, confirmed-place indicators and audit history. Dark navigation/large typography/soft panels provide hierarchy without hiding the actual controls. The metric named booking value explicitly refers to fictitious orders, not collected revenue.

Controls retain 44px targets, visible keyboard focus, labels and inline errors; disabled actions stay visible. Native dialogs support Escape/focus containment. Reduced-motion preferences disable transitions and smooth scrolling. The app keeps functionality available when storage or images fail, with explicit recovery instructions.

Native Chrome visual review for this extension covered desktop, iPhone SE 375×667 and iPad Mini 768×1024. The verification log distinguishes this from earlier checks and from unrun hosted/Atlas tests.
