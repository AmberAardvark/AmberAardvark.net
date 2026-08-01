## Plan: Amber Aardvark Website Overhaul

The overhaul transitions the website from a specific focus on "Microsoft Data Platform Analytics" to a broader range of "Affordable Business Process Automation, Data Solutions, & App Development" services.

**Steps**

1. **Brand & Messaging Update**
   - ~~Decide on a new name suffix to replace "Analytics" (e.g., _Solutions_, _Innovations_, _Automations_, or simply _Amber Aardvark_).~~ [Decision: "Amber Aardvark" without suffix]
   - Update all site copy to reflect the new focus on affordable, niche business solutions rather than just analytics. This includes the homepage hero, service descriptions, and about page.
   - Update site-wide tagline and hero messaging on the index page to highlight process automation, agentic workflows, and affordable custom business applications for niche use cases.

2. **Data & Config Updates**
   - Update `src/data_files/features.json` to feature new service categories: Data Analytics, Process Automation, Agentic Workflows, and Custom App Development.
   - Update `src/data_files/pricing.json`: Change "Data Assessment" and "Managed Analytics" to more general tiers (e.g., "Project-based" and "Retainer-based") that encompass all services. Maintain the current non-numerical pricing structure ("Custom", "Retainer").
   - Update `src/data_files/faqs.json` to address concerns of budget-constrained businesses and niche use cases ignored by Big Tech.
   - Update `src/data_files/constants.ts` to adjust SEO metadata and the site title.

3. **Pages Update**
   - Overhaul `src/pages/index.astro` to reflect expanded services in Hero, Features, and Services highlights.
   - Overhaul `src/pages/services.astro` to list the 4 new categories in detail.
   - Update `src/pages/about.astro` to reflect the expanded mission, affordability aspect, and broader target audience.

4. **Imagery & Assets Revamp**
   - Replace or add new relevant hero images and feature images for automation and agentic workflows in `src/images/`.

**Relevant files**

- `src/pages/index.astro` — Main messaging and Hero text to replace the Microsoft-specific verbiage.
- `src/data_files/features.json` — New features and service offerings array.
- `src/data_files/faqs.json` — Addressing niche and budget constraints.
- `src/data_files/pricing.json` — Generalize pricing tiers.
- `src/data_files/constants.ts` — Site title and generic metadata changes.
- `src/pages/services.astro` — Service detail descriptions.

**Verification**

1. Build the Astro project locally (`npm run build`) to ensure changes to `.json` files don't break strict TS types in Astro components.
2. Search the codebase for occurrences of "Analytics" and "Microsoft" to ensure no outdated text is left.
3. Check mobile view (responsive layout) of the altered components to ensure content fits cleanly.

**Decisions**

- Four core service categories established: Data Analytics, Process Automation, Agentic Workflows, Custom App Development.
- Pricing structure will remain mathematically consistent (Retainer / Custom) and will be generalized across all offerings.
- The tone will focus on affordability and niche solutions often overlooked by big tech.

**Further Considerations**

1. Review the branding suffix options: Please decide if you prefer "Solutions", "Systems", "Innovations", or just "Amber Aardvark" so we can globally replace "Amber Aardvark Analytics".
2. Image assets: Will you be providing new images for process automation and app development, or should we source placeholders for now?
