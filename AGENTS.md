## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Projektnoter (Nordic Stone)

- Al tekst på siden er på dansk. Brug ægte æ, ø og å, og aldrig lang tankestreg (brug alm. `-`).
- Telefon og mail står flere steder (`Base.astro` og de enkelte sider). Ret alle steder ved ændringer.
- Formularerne bruger `src/scripts/contact-form.ts` + nøglen i `src/config.ts` (Web3Forms).
- Kør `npm run build` før en ændring merges, så byggefejl fanges før Vercel.
