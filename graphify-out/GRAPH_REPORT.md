# Graph Report - tc-auto-website  (2026-10-02)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1680 nodes · 3437 edges · 143 communities (94 shown, 22 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: 101,546 input · 1,989 output

## Graph Freshness
- Built from commit: `fecab779`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Background Image Reconstruction
- Card & Catalogue Components
- Lead Capture API
- Build Script Registry
- Dev Dependencies
- Admin Auth & Layout
- Admin Content Pages
- Carousel & Pagination
- Root Layout & Site Metadata
- Design Specification Doc
- Main Site Pages
- Dynamic Subpage Routing
- Project README
- Product Data Extraction
- Page Shell & Lift Cards
- Admin Leads Management
- Site Layout & Product Specs
- Pixel Fidelity Comparison
- Post Editor & Preview
- PPF Carousel
- Runtime Dependencies
- Admin Dashboard Charts
- Sitemap & Canonical URLs
- Admin Form Components
- Canvas Item Rendering
- App Cards & Photo Sliders
- CTA Text Matching
- Dealer Search
- Authored Page Rendering
- Read More & CTA Links
- Site Header & Navigation
- Supabase Admin Actions
- Mobile Tile Extraction
- Prototype HTML Parser
- Subpage Registry
- Canvas Slices & Srcset
- Hero Slider
- Style Quiz
- Playwright E2E Specs
- Mobile Subpage Blocks
- Subpage Tile Extraction
- Initial Database Schema
- Button Detection
- Media Upload Management
- Mobile Page Composition
- Project Coverflow
- Subpage Build Pipeline
- TypeScript Compiler Options
- Mobile Sections & Link Map
- Mobile Navigation Tree
- Mobile Screen Tabs & Headings
- Asset Source Resolution
- Hero Image Cleanup
- App Icon Generation
- Solution Card Reordering
- Asset Upload Script
- Swift OCR Tool
- TypeScript Include Paths
- Page Registry & Not Found
- Article Shot Extraction
- Photo Slider Extraction
- Retina Image Patching
- Logo Generation
- Retina Parity Check
- Admin Content Editor
- Blog Post Page
- Autoplay Timing Tests
- Light Band Darkening
- Link Reachability Check
- Slice Region Scrubbing
- Asset Cache Stamping
- Subpage Spec Schema
- Page Spec Schema
- Project Image Extraction
- Catalogue Image Fetching
- Arrow Detection
- Image Sharpness Check
- Page Data Cleanup
- Next Config & Security Headers
- Posts Table Migration
- Slider Detection
- CTA Background Sampling
- Vercel Deploy Config
- Mobile Footer
- Asset URL Helper
- Site URL Resolution
- Post Seeding Script
- Spot Article Builder
- Bravo Image Fetching
- App Download Linking
- Asset Stamp Verification
- Metadata Check
- Live Verification Gates
- Brand Identity Guide
- TypeScript Lib Targets
- Pagination Detection
- Zoom Behavior Check
- Dashboard Stats
- Admin Root Layout
- Proxy Configuration
- Product Catalogue E2E Tests
- Hero Control Checks
- Read-More Link Checks
- Page Item Patch Script
- Next.js Agent Instructions
- ESLint Configuration
- PostCSS Configuration
- App Downloads Page Tests
- Authored Navigation Tests
- Back-To-Top Button Tests
- Contact Form Tests
- Static Page Rendering Tests
- Spot Article Tests
- Page Markup Cleanup Script
- Lazy Loading Checks
- Dev Server Error Probe

## God Nodes (most connected - your core abstractions)
1. `scripts` - 49 edges
2. `getSupabaseAdminClient()` - 28 edges
3. `getPageSpec()` - 27 edges
4. `TC Auto Solutions — Website + Trang quản trị` - 21 edges
5. `PageSlug` - 18 edges
6. `rebuild_background()` - 18 edges
7. `buttonClass()` - 18 edges
8. `assetUrl()` - 18 edges
9. `getPageContent()` - 17 edges
10. `PageShell()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `main()` --references--> `target`  [EXTRACTED]
  tools/match-cta.py → tsconfig.json
- `main()` --references--> `target`  [EXTRACTED]
  tools/ocr/clean.py → tsconfig.json
- `main()` --references--> `target`  [EXTRACTED]
  tools/detect-sliders.py → tsconfig.json
- `main()` --references--> `target`  [EXTRACTED]
  tools/stamp-assets.py → tsconfig.json
- `main()` --references--> `target`  [EXTRACTED]
  tools/detect-pagination.py → tsconfig.json

## Import Cycles
- None detected.

## Communities (143 total, 22 thin omitted)

### Community 0 - "Background Image Reconstruction"
Cohesion: 0.06
Nodes (55): _blur_columns(), feathered(), Image, ndarray, Trung binh truot theo truc x tren mot dai mot hang (x, kenh mau)., Dung lai nen trong `box` bang cach noi suy doc tung cot. Vi sao khong lat lap…, Lam mo dan vien anh ve trong suot tren be day `pad` (tinh bang pixel anh). Phan…, Dung lai nen trong `box` bang cach noi suy NGANG tung hang. Dung khi vung can… (+47 more)

### Community 1 - "Card & Catalogue Components"
Cohesion: 0.07
Nodes (45): Card, OverlapCards(), RelatedStrip(), Card(), ScreenCatalogue(), Toggle, CARDS, ScreenTabs() (+37 more)

### Community 2 - "Lead Capture API"
Cohesion: 0.07
Nodes (40): dynamic, POST(), dynamic, GET(), ContactForm(), ContactFormProps, ToastState, Tone (+32 more)

### Community 3 - "Build Script Registry"
Cohesion: 0.04
Nodes (49): scripts, assets:upload, brand:hero, brand:logos, build, cards:extract, cards:lift, cards:ppf (+41 more)

### Community 4 - "Dev Dependencies"
Cohesion: 0.05
Nodes (39): eslint, eslint-config-next, jsdom, devDependencies, eslint, eslint-config-next, jsdom, pixelmatch (+31 more)

### Community 5 - "Admin Auth & Layout"
Cohesion: 0.13
Nodes (23): DashLayout(), LoginPage(), AdminNav(), LINKS, SetupNotice(), signOutAction(), ActivityEntry, AdminGate (+15 more)

### Community 6 - "Admin Content Pages"
Cohesion: 0.10
Nodes (28): ACTION_LABEL, ACTION_TONE, ActivityPage(), dynamic, ENTITY_LABEL, ContentIndexPage(), dynamic, AdminError() (+20 more)

### Community 7 - "Carousel & Pagination"
Cohesion: 0.11
Nodes (28): Pagination(), CARDS, SolutionCarousel(), State, getCtaStats(), BOXES, buildPageList(), getPagination() (+20 more)

### Community 8 - "Root Layout & Site Metadata"
Cohesion: 0.12
Nodes (16): metadata, viewport, dynamic, GET(), metadata, FAQ_ROUTE, FAQ_SLUG, FaqPage() (+8 more)

### Community 9 - "Design Specification Doc"
Cohesion: 0.06
Nodes (30): 10. Bài viết (CMS), 11. Supabase, 1. Nguyên tắc gốc, 2. Bố cục thư mục, 3. Quy trình dựng ảnh, 4.1 Trang chủ (`home`), 4.2 Trang Công nghệ (`cong-nghe`), 4.3 Trang Đại lý (`dai-ly`) (+22 more)

### Community 10 - "Main Site Pages"
Cohesion: 0.11
Nodes (24): metadata, Page(), revalidate, metadata, Page(), revalidate, metadata, Page() (+16 more)

### Community 11 - "Dynamic Subpage Routing"
Cohesion: 0.12
Nodes (27): dynamicParams, generateMetadata(), generateStaticParams(), readSlug(), revalidate, SubPage(), CATALOGUE_SLUG, getAuthoredSlugs() (+19 more)

### Community 12 - "Project README"
Cohesion: 0.07
Nodes (29): 31 trang con, Băng hero trang chủ, Bảo mật, Bắt đầu, Bộ nhận diện, Co giãn responsive, Cạm bẫy đã xử lý: `clip-path` phá IntersectionObserver, Cấu hình Supabase (+21 more)

### Community 13 - "Product Data Extraction"
Cohesion: 0.14
Nodes (27): clean(), is_placeholder(), lines_in(), main(), The thiet ke con de trong: ten chi la ten hang kem dau ba cham., row_buttons(), slugify(), crop_card() (+19 more)

### Community 14 - "Page Shell & Lift Cards"
Cohesion: 0.15
Nodes (22): LiftCards(), PageShell(), PageShellProps, getLiftCards(), getLiftGroups(), LiftCard, liftSizes(), liftSrcSet() (+14 more)

### Community 15 - "Admin Leads Management"
Cohesion: 0.17
Nodes (21): dynamic, LeadsPage(), pageHref(), readStatus(), csvCell(), dynamic, GET(), safeCell() (+13 more)

### Community 16 - "Site Layout & Product Specs"
Cohesion: 0.14
Nodes (17): SiteLayout(), CanvasZoom(), MotionLayer(), prefersReducedMotion(), countProductSpecs(), getProductSpecs(), ProductSpecs, Spec (+9 more)

### Community 17 - "Pixel Fidelity Comparison"
Cohesion: 0.11
Nodes (22): DESIGN_DEVIATIONS, Deviation, deviationsFor(), BUDGET, compare(), HERE, main(), maskOut() (+14 more)

### Community 18 - "Post Editor & Preview"
Cohesion: 0.13
Nodes (18): dynamic, PostEditorPage(), dynamic, metadata, PostPreviewPage(), ArticleView, PostArticle(), getPost() (+10 more)

### Community 19 - "PPF Carousel"
Cohesion: 0.17
Nodes (21): CARDS, ORIGIN_X, PpfCarousel(), State, Box, DATA, Layout, offsetAt() (+13 more)

### Community 20 - "Runtime Dependencies"
Cohesion: 0.09
Nodes (22): clsx, lucide-react, motion, next, dependencies, clsx, lucide-react, motion (+14 more)

### Community 21 - "Admin Dashboard Charts"
Cohesion: 0.20
Nodes (16): dynamic, DailyLeadsChart(), DailyPoint, HeroFigure(), StatTile(), StatusBreakdown(), CHART_SURFACE, compactNumber() (+8 more)

### Community 22 - "Sitemap & Canonical URLs"
Cohesion: 0.14
Nodes (17): sitemap(), CATALOGUE_ROUTE, AuthoredBlock, AuthoredPage, AuthoredProduct, AuthoredProducts, getAuthoredPage(), getAuthoredPages() (+9 more)

### Community 23 - "Admin Form Components"
Cohesion: 0.25
Nodes (14): FormBanner(), KIND_LABEL, LoginForm(), PostEditor(), SubmitButton(), buttonClass(), Field(), Select() (+6 more)

### Community 24 - "Canvas Item Rendering"
Cohesion: 0.17
Nodes (19): ItemEditorProps, boxStyle(), CanvasItem(), CanvasItemProps, HEADING_CLASSES, HeadingLines(), revealDirection(), cssToStyle() (+11 more)

### Community 25 - "App Cards & Photo Sliders"
Cohesion: 0.12
Nodes (16): AppCards(), Deck(), PhotoSliders(), Autoplay, useAutoplay(), AppCard, Box, getAppCards() (+8 more)

### Community 26 - "CTA Text Matching"
Cohesion: 0.16
Nodes (21): best_page(), has_lowercase(), is_section_header(), key_of(), main(), nearest_title(), overlaps_red_button(), paragraphs_between() (+13 more)

### Community 27 - "Dealer Search"
Cohesion: 0.16
Nodes (18): BUTTON, DealerSearch(), submit(), FIELD, PANEL, BRANDS, countByProvince(), DATA (+10 more)

### Community 28 - "Authored Page Rendering"
Cohesion: 0.28
Nodes (14): MobileNav(), AuthoredPage(), BackToTop(), glideToTop(), CataloguePage(), JsonLd(), PENDING, PENDING_NO_SPECS (+6 more)

### Community 29 - "Read More & CTA Links"
Cohesion: 0.19
Nodes (15): Expanded(), key(), ReadMore(), CtaSpot, CtaStats, getCtaSpots(), hasSomethingToShow(), readMorePanel (+7 more)

### Community 30 - "Site Header & Navigation"
Cohesion: 0.16
Nodes (15): SiteHeader(), SiteHeaderProps, PillBox, recallPill(), rememberPill(), SiteNav(), SiteNavProps, SearchResult (+7 more)

### Community 31 - "Supabase Admin Actions"
Cohesion: 0.46
Nodes (18): failure(), fromError(), success(), deleteLead(), deleteMedia(), deletePost(), registerMedia(), resetPageItem() (+10 more)

### Community 32 - "Mobile Tile Extraction"
Cohesion: 0.16
Nodes (19): classes(), dedupe_repeats(), is_usable(), _largest_segment(), main(), Image, ndarray, Chia danh sach item thanh cac muc, moi muc bat dau o mot nhan `lbl`. (+11 more)

### Community 33 - "Prototype HTML Parser"
Cohesion: 0.18
Nodes (19): drop_repeat(), main(), parse(), parse_items(), parse_nav(), parse_style(), ParseError, px() (+11 more)

### Community 34 - "Subpage Registry"
Cohesion: 0.22
Nodes (15): dynamic, SubPagesPage(), formatBytes(), SUBPAGE_MODULES, SUBPAGE_SLUGS, countDetected(), parseSubPageSpec(), getPageText() (+7 more)

### Community 35 - "Canvas Slices & Srcset"
Cohesion: 0.19
Nodes (14): CanvasSlices(), CanvasSlicesProps, SliceImage(), SliceImageProps, CANVAS_WIDTH, sliceSizes(), sliceSrcSet(), ContactFormSpec (+6 more)

### Community 36 - "Hero Slider"
Cohesion: 0.18
Nodes (15): advance(), AUTOPLAY_MS, HeroSlider(), State, Box, DATA, getHeroSlides(), HERO_CONTROLS (+7 more)

### Community 37 - "Style Quiz"
Cohesion: 0.19
Nodes (15): EMPTY, State, StyleQuiz(), DATA, Layout, OTHER, Profile, ProfileResult (+7 more)

### Community 38 - "Playwright E2E Specs"
Cohesion: 0.11
Nodes (4): ROUTES, ROUTES, DECKS, PAGES

### Community 39 - "Mobile Subpage Blocks"
Cohesion: 0.20
Nodes (15): BUTTON_WORDS, DETECTED, DetectedRect, fold(), getMobileBlocks(), getMobileHero(), insideButton(), isButtonLabel() (+7 more)

### Community 40 - "Subpage Tile Extraction"
Cohesion: 0.20
Nodes (16): bands(), centre_crop(), gaps(), is_photographic(), largest_opaque(), main(), Image, O chu nhat DAC lon nhat trong mot buc anh co mat na. Vai anh trong bo tai… (+8 more)

### Community 41 - "Initial Database Schema"
Cohesion: 0.21
Nodes (13): admin_profiles_touch, leads_touch, page_items_touch, public.activity_log, public.admin_profiles, public.is_admin(), public.leads, public.media (+5 more)

### Community 42 - "Button Detection"
Cohesion: 0.22
Nodes (14): close_text_gaps(), detect(), emit(), find_rects(), Image, ndarray, Path, Toa do sau khi doi thu tu -> toa do trong anh thiet ke goc. (+6 more)

### Community 43 - "Media Upload Management"
Cohesion: 0.21
Nodes (11): dynamic, MediaPage(), submit(), MediaUploader(), upload(), readImageSize(), Status, hasAtLeast() (+3 more)

### Community 44 - "Mobile Page Composition"
Cohesion: 0.25
Nodes (9): MobileCarousel(), MobileSlide, MobilePage(), renderSection(), MobileStrip(), MobileBlock, mergeByY(), Placed (+1 more)

### Community 45 - "Project Coverflow"
Cohesion: 0.31
Nodes (9): Coverflow(), CoverflowProps, ProjectCoverflow(), Box, CoverPhoto, offsetFrom(), PROJECT_CENTRE, ProjectPhoto (+1 more)

### Community 46 - "Subpage Build Pipeline"
Cohesion: 0.25
Nodes (13): breadcrumb(), build_nav(), BuildError, cut_slices(), main(), Path, RuntimeError, Sinh registry.ts voi import tinh cho tung file JSON. Dung import tinh chu khong… (+5 more)

### Community 47 - "TypeScript Compiler Options"
Cohesion: 0.14
Nodes (14): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, module, moduleResolution (+6 more)

### Community 48 - "Mobile Sections & Link Map"
Cohesion: 0.22
Nodes (10): CTA_INTENTIONALLY_UNLINKED, CTA_LINK_MAP, ctaHref(), getMobileHero(), getMobileHeroSlides(), getMobileSections(), headingLines(), MobileHero (+2 more)

### Community 49 - "Mobile Navigation Tree"
Cohesion: 0.30
Nodes (5): TREES, MobileTree(), buildTree(), countNodes(), TreeNode

### Community 50 - "Mobile Screen Tabs & Headings"
Cohesion: 0.29
Nodes (8): MobileScreenItem, MobileScreenTabs(), MobileSubPage(), renderText(), headingAlreadyShown(), normalise(), MobileBlock, PpfCard

### Community 51 - "Asset Source Resolution"
Cohesion: 0.33
Nodes (9): _area(), _candidates(), find(), Path, So diem anh. Doc mot lan roi nho, vi ham nay bi goi nhieu lan., Duong dan toi ban TO NHAT cua anh nay, hoac None neu khong bo nao co., export_cards(), main() (+1 more)

### Community 52 - "Hero Image Cleanup"
Cohesion: 0.31
Nodes (10): build(), chrome(), fit(), main(), place(), Image, Dat tam anh vao khung. `exact` = dat 1:1 tu goc trai tren, phan thieu o DAY lay…, Tach rieng LOGO va COT BIEU TUONG ra khoi nen, kem do trong suot. Khong the cat… (+2 more)

### Community 53 - "App Icon Generation"
Cohesion: 0.31
Nodes (10): build_master(), load_mark(), main(), on_navy(), Image, Ban nen navy bo goc — dung cho apple-icon va icon PWA. iOS khong ho tro nen…, Cat dung emblem, tach nen navy thanh alpha., Ep ve dung hai mau thuong hieu. Phong to lam mau bi lem; ep lai giu logo dung… (+2 more)

### Community 54 - "Solution Card Reordering"
Cohesion: 0.29
Nodes (10): main(), Image, Path, Toa do cu -> toa do moi. Xem phep doi o dau tep., Hoan vi hai khoi lien nhau tren MOT tam anh da ghep lien., rebuild_image(), rebuild_slices(), remap() (+2 more)

### Community 55 - "Asset Upload Script"
Cohesion: 0.24
Nodes (9): args, DIRS, DRY, loadEnv(), main(), MIME, PUBLIC, ROOT (+1 more)

### Community 56 - "Swift OCR Tool"
Cohesion: 0.22
Nodes (9): AppKit, Codable, Double, Foundation, Never, String, Block, fail() (+1 more)

### Community 57 - "TypeScript Include Paths"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 58 - "Page Registry & Not Found"
Cohesion: 0.36
Nodes (6): metadata, NotFound(), getAllPageSpecs(), getPageIndex(), REGISTRY, slugFromRoute()

### Community 59 - "Article Shot Extraction"
Cohesion: 0.29
Nodes (9): background(), find_shot(), main(), page_image(), Image, ndarray, Ghep ca trang lai thanh mot anh, tra ve kem ti le., Mau nen cua trang, lay trung vi cua bon goc. (+1 more)

### Community 60 - "Photo Slider Extraction"
Cohesion: 0.31
Nodes (9): ASSET(), main(), match_exposure(), Image, ndarray, Keo sang/mau cua mot slide ve ngang voi slide dau. Vi sao can: may tam phia sau…, Ban to nhat cua anh nay trong cac bo tai nguyen., Trung binh va do lech tung kenh mau, chi tinh tren phan DAC cua anh. (+1 more)

### Community 61 - "Retina Image Patching"
Cohesion: 0.29
Nodes (9): build_mask(), header_forced(), main(), pairs(), Image, Path, Mat na ep buoc cho dai header, hoac None neu anh nay khong chua header. Chi ap…, MOI cap @2x/@3x duoi public/ — quet theo TEP chu khong theo page spec. Ban dau… (+1 more)

### Community 62 - "Logo Generation"
Cohesion: 0.33
Nodes (8): background_colour(), extract(), longest_band(), main(), Image, ndarray, Mau nen = mau xuat hien nhieu nhat tren vien cua vung cat. Lay tu vien chu…, Dai hang lien nhau DAI NHAT trong mask. Trong ban Design System co mot vach…

### Community 63 - "Retina Parity Check"
Cohesion: 0.33
Nodes (8): header_gap(), main(), pairs(), Image, MOI cap @2x/@3x o bat cu dau duoi public/. Quet theo TEP chu khong theo page…, Lech lon nhat tung diem anh trong dai header. 0 neu anh khong chua no., Do lech cua o te nhat, va toa do y cua o do (theo he toa do canvas)., worst_block()

### Community 64 - "Admin Content Editor"
Cohesion: 0.32
Nodes (6): ContentEditorPage(), dynamic, ItemEditor(), kindOf(), PreviewPane(), listOverrides()

### Community 65 - "Blog Post Page"
Cohesion: 0.36
Nodes (7): dynamic, generateMetadata(), PostPage(), DEFAULT_OG_IMAGE, getPublishedPost(), toPost(), articleLd()

### Community 67 - "Light Band Darkening"
Cohesion: 0.36
Nodes (7): main(), Image, Doi mau chu cua cac phan tu nam trong dai da to toi., Doi mau mot dai trong MOT lat nen. `top` la y cua lat tren canvas., recolour(), repaint_items(), run()

### Community 68 - "Link Reachability Check"
Cohesion: 0.25
Nodes (7): all, linksFrom, orphan, page, queue, reachable, seen

### Community 69 - "Slice Region Scrubbing"
Cohesion: 0.39
Nodes (7): flattest_neighbour(), main(), Image, Dai nen de chep de len, chon giua dai NGAY TREN va dai NGAY DUOI. Truoc day…, Xoa mot hop khoi cac lat chua no. Tra ve so lat da sua., scrub_region(), slice_key()

### Community 70 - "Asset Cache Stamping"
Cohesion: 0.36
Nodes (7): is_asset(), main(), Tra ve url kem ?v=<hash>. Bo dau cu neu co., Chuoi nay co tro toi mot tep co that trong /public khong?, Dong dau moi duong dan tro toi mot tep co that trong /public., stamp(), walk()

### Community 71 - "Subpage Spec Schema"
Cohesion: 0.29
Nodes (6): SubPageShellProps, crumbSchema, navSchema, sliceSchema, SubPageSpec, subPageSpecSchema

### Community 72 - "Page Spec Schema"
Cohesion: 0.29
Nodes (6): itemSchema, navSchema, pageSpecSchema, parsePageSpec(), sliceSchema, ValidatedPageSpec

### Community 73 - "Project Image Extraction"
Cohesion: 0.43
Nodes (6): Nhu `find` nhung nem loi neu thieu — dung khi anh do bat buoc phai co., require(), export(), main(), To trang de xoa dai ve chet khoi lat nen — o CA HAI ti le., scrub()

### Community 74 - "Catalogue Image Fetching"
Cohesion: 0.43
Nodes (6): best_image(), fetch(), main(), Image, Cat bot le trang, lay mau nen tu bon goc chu khong gia dinh la trang., trim()

### Community 75 - "Arrow Detection"
Cohesion: 0.43
Nodes (6): components(), main(), ndarray, Path, Cac mang sang lien thong, tra ve (x0, y0, x1, y1) theo he toa do goc. Gom theo…, scan()

### Community 76 - "Image Sharpness Check"
Cohesion: 0.38
Nodes (5): found, fresh, known, soft, SOURCE_LIMITED

### Community 77 - "Page Data Cleanup"
Cohesion: 0.48
Nodes (6): clean_page(), drop_ghosts(), kind_of(), main(), normalise(), Bo cac dong bi doc HAI LAN o cung mot cho. Ban thiet ke lam mo dan chu o cuoi…

### Community 78 - "Next Config & Security Headers"
Cohesion: 0.33
Nodes (4): ASSET_DIRS, IMMUTABLE, nextConfig, SECURITY_HEADERS

### Community 79 - "Posts Table Migration"
Cohesion: 0.33
Nodes (4): posts_touch_updated_at, public.posts, auth.users, public.touch_updated_at

### Community 80 - "Slider Detection"
Cohesion: 0.67
Nodes (5): bright_runs(), find_bars(), main(), ndarray, row_matches()

### Community 81 - "CTA Background Sampling"
Cohesion: 0.40
Nodes (4): index_sources(), main(), main(), target

### Community 82 - "Vercel Deploy Config"
Cohesion: 0.40
Nodes (4): sin1, framework, regions, $schema

### Community 83 - "Mobile Footer"
Cohesion: 0.40
Nodes (3): MobileFooter(), PATHS, PHONE_HREF

### Community 84 - "Asset URL Helper"
Cohesion: 0.50
Nodes (3): ASSET_DIRS, BASE, isRemoteAssets()

### Community 85 - "Site URL Resolution"
Cohesion: 0.70
Nodes (3): resolveSiteUrl(), siteUrl(), SOURCES

### Community 86 - "Post Seeding Script"
Cohesion: 0.40
Nodes (4): env, POSTS, rows, supabase

### Community 87 - "Spot Article Builder"
Cohesion: 0.80
Nodes (4): main(), plain(), route_of(), slugify()

### Community 88 - "Bravo Image Fetching"
Cohesion: 0.50
Nodes (4): main(), Image, Cat bot le trang quanh anh. Lay mau nen tu bon goc chu khong gia dinh la mau…, trim()

### Community 89 - "App Download Linking"
Cohesion: 0.60
Nodes (4): fuzzy_key(), main(), plain(), Bo dau, bo tien/hau to trang thai, thuong hoa — de so ten cho chac.

### Community 90 - "Asset Stamp Verification"
Cohesion: 0.60
Nodes (4): digest(), main(), Path, walk()

### Community 93 - "Brand Identity Guide"
Cohesion: 0.50
Nodes (3): Bộ nhận diện TC Auto Solutions, Màu chuẩn, Quy tắc (theo bộ nhận diện)

### Community 94 - "TypeScript Lib Targets"
Cohesion: 0.50
Nodes (4): dom, dom.iterable, esnext, lib

### Community 95 - "Pagination Detection"
Cohesion: 0.67
Nodes (3): find_box(), main(), ndarray

### Community 97 - "Dashboard Stats"
Cohesion: 0.67
Nodes (3): DashboardPage(), getDashboardStats(), isoDate()

## Knowledge Gaps
- **406 isolated node(s):** `Card`, `Toggle`, `Hotspot`, `MobileLink`, `Box` (+401 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 621 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PageSlug` connect `Sitemap & Canonical URLs` to `Subpage Registry`, `Canvas Slices & Srcset`, `Root Layout & Site Metadata`, `Main Site Pages`, `Page Shell & Lift Cards`, `Admin Leads Management`, `Mobile Sections & Link Map`, `Admin Form Components`, `Canvas Item Rendering`, `Page Registry & Not Found`, `Authored Page Rendering`, `Supabase Admin Actions`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `getPageSpec()` connect `Authored Page Rendering` to `Admin Content Editor`, `Subpage Registry`, `Root Layout & Site Metadata`, `Main Site Pages`, `Mobile Sections & Link Map`, `Page Registry & Not Found`, `Supabase Admin Actions`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `deviationsFor()` connect `Pixel Fidelity Comparison` to `Carousel & Pagination`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `Card`, `Toggle`, `Hotspot` to the rest of the system?**
  _406 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Background Image Reconstruction` be split into smaller, more focused modules?**
  _Cohesion score 0.058173076923076925 - nodes in this community are weakly interconnected._
- **Should `Card & Catalogue Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07377049180327869 - nodes in this community are weakly interconnected._
- **Should `Lead Capture API` be split into smaller, more focused modules?**
  _Cohesion score 0.06588235294117648 - nodes in this community are weakly interconnected._