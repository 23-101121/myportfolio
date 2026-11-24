# Adding a project

Every project on the site comes from the **`projects`** table in Supabase. One row = one project. There is no per-project code: add a row (and its images), and the project appears everywhere automatically:

- its own page at `/project/<slug>`
- the Work page stack, filter pills and fan-out images
- the Home hero collage, "A few things I've made" list and Discover marquee
- the About "Ideas → Experiences" loop
- search (Ctrl + K)
- the Previous / Next links on other project pages

> First time only: run [`supabase/projects_template.sql`](supabase/projects_template.sql) in **Supabase → SQL Editor**. It adds the columns below, the security rules and the `projects` image bucket, and seeds 5 example projects.
>
> **Until you run it**, the site uses the same 5 projects from [`src/data/localProjects.js`](src/data/localProjects.js), with placeholder images. As soon as the SQL has run, the site switches to Supabase by itself. You can then delete that file and its import in `src/lib/supabase.js`.

## Steps

1. **Pick a slug.** It goes in the URL, so use lowercase letters, numbers and dashes only, for example `real-estate-app`. It must be unique.
2. **Upload the images.** Go to **Supabase → Storage → `projects`**, create a folder named exactly like the slug, and upload into it, for example:
   ```
   projects/real-estate-app/cover.jpg
   projects/real-estate-app/hero.jpg
   projects/real-estate-app/gallery-1.jpg
   ```
3. **Add the row.** Go to **Table Editor → `projects` → Insert row** (or use SQL, see the example below). Image fields hold the path *inside* the bucket: `real-estate-app/cover.jpg`.
4. **Publish.** Set `published` to `true`. Unpublished rows are invisible to the public: the site can't read them, and their URL shows "Project not found".
5. **Refresh the site.** That's it.

To hide a project, set `published = false`. To change the order, change `sort_order`.

## Fields

| Field | Type | Required | What it does |
|---|---|---|---|
| `slug` | text, unique | **yes** | URL of the project page: `/project/<slug>`. Also the image folder name. |
| `title` | text | **yes** | Big heading everywhere. |
| `title_accent_word` | text | no | The word in the title shown in pink italic, e.g. `Dashboard`. If empty, the last word is used. |
| `published` | boolean | **yes** | `true` = visible on the site. |
| `sort_order` | integer | no (default 100) | Lower numbers come first everywhere (Home, Work, search, Next/Previous). |
| `category` | text | no | Drives the filter pills on the Work and Projects List pages, e.g. `Mobile Apps`. Projects with the same category text are grouped. |
| `tags` | text[] | no | Small pills, e.g. `{UI,Automotive}`. Also searchable. |
| `type` | text | no | e.g. `Concept`, `Mobile app`, `Website`. Shown in the facts row. |
| `year` | integer | no | e.g. `2026`. |
| `role` | text | no | e.g. `UI/UX Designer`. |
| `timeline` | text | no | e.g. `4 weeks`. |
| `tools` | text[] | no | e.g. `{Figma,"After Effects"}`. Searchable. |
| `accent_color` | text | no | `#RRGGBB`. Tints the page details (stats, tags, glow) and placeholder art. |
| `cover_image` | text | no* | Main image (cards, Work stack, collage). Path in the bucket or a full `https://` URL. |
| `hero_image` | text | no | Big image at the top of the project page (falls back to `cover_image`). |
| `hero_video` | text | no | Short looping video for the top of the page (mp4/webm). Replaces the hero image when set. |
| `overview` | text | no | Short intro paragraph ("(Overview)"). |
| `statement` | text | no | One bold sentence. Also used as the page's meta description and on cards. |
| `challenge` | text | no | "The challenge" block. |
| `solution` | text | no | "The solution" block. |
| `result` | text | no | "The result" block. |
| `stats` | jsonb | no | Key numbers: `[{"value":"<3s","label":"Average glance time"}]` |
| `gallery` | jsonb | no | Screens: `[{"image":"slug/gallery-1.jpg","caption":"Driving mode","size":"full"}]`. `size` is `full`, `half` or `third`; `caption` is optional. The first 4 also fan out on the Work page. |
| `process_words` | text[] | no | Words in the scrolling strip, e.g. `{Research,Wireframes,Prototype}`. |
| `case_study_slug` | text | no | When set, shows "Want the whole story?" linking to `/case-study/<case_study_slug>` (the case study content lives in the `case_studies` table). |

\* Without images the site shows tinted placeholder art, so nothing looks broken while you're still uploading.

Every optional section on the project page only appears when its field has content.

## Example row (SQL)

```sql
insert into public.projects (
  admin_id, status, slug, title, title_accent_word, published, sort_order,
  category, tags, type, year, role, timeline, tools, accent_color,
  cover_image, hero_image, overview, statement, challenge, solution, result,
  stats, gallery, process_words
) values (
  (select admin_id from public.admin limit 1), 'published',
  'real-estate-app', 'Real Estate App', 'App', true, 6,
  'Mobile Apps', array['UI', 'Mobile', 'Property'], 'Mobile app', 2026, 'UI/UX Designer', '5 weeks',
  array['Figma', 'Photoshop'], '#e2457c',
  'real-estate-app/cover.jpg', 'real-estate-app/hero.jpg',
  'A calm way to browse, compare and book property viewings.',
  'Finding a home, without the noise.',
  'Listings were cluttered and hard to compare.',
  'Clean cards, side-by-side comparison and one-tap viewing requests.',
  'Users found a shortlist twice as fast in testing.',
  '[{"value":"2×","label":"Faster shortlisting"}]'::jsonb,
  '[{"image":"real-estate-app/gallery-1.jpg","caption":"Search","size":"half"},
    {"image":"real-estate-app/gallery-2.jpg","caption":"Compare","size":"half"}]'::jsonb,
  array['Research', 'Wireframes', 'Visual design']
);
```

(`admin_id` and `status` are older columns on your table and are kept for compatibility.)

## Security

- The public (anon) key can only **read** rows where `published = true`. It can't insert, edit or delete.
- Images in the `projects` bucket are public by URL. Only you can upload them, through the dashboard.
- The site only ever uses the public key. Never put the `service_role` key in the code.
