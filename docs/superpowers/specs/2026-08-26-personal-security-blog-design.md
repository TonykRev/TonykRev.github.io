# Personal Security Research Blog — Design Specification

Ngày chốt thiết kế: 2026-08-26  
Trạng thái: Approved design; implementation chưa bắt đầu

## 1. Mục tiêu

Xây blog cá nhân tại `username.github.io` để xuất bản research bằng tiếng Anh về:

- Malware & DFIR
- Cloud Security
- Security Engineering

Blog mang vai trò hybrid: research archive là trung tâm, portfolio nghề nghiệp là phần hỗ trợ nhẹ. Trải nghiệm phải khác theme blog truyền thống, đọc tốt với bài dài, tải nhanh, không cần backend, database, CMS hoặc dịch vụ trả phí.

## 2. Phạm vi phiên bản đầu

### Bao gồm

- Homepage theo scroll narrative.
- Topic Hub với ba research domain.
- Research index, domain pages, format filters và tags phụ.
- Ba format nội dung: Deep Research, Case Study / Write-up và Guide.
- Trang đọc bài dài có table of contents, evidence block, code block và references.
- About, selected projects, achievements / certifications và contact links.
- Static search, RSS, sitemap và custom 404.
- Responsive design, accessibility, reduced-motion support và performance checks.
- GitHub Actions build/deploy lên GitHub Pages.
- Bộ custom Codex subagents chạy theo yêu cầu để hỗ trợ editorial workflow.

### Không bao gồm

- CMS, database, user accounts hoặc comment system.
- Newsletter backend, analytics có tracking hoặc dịch vụ SaaS trả phí.
- Scheduled autonomous AI publishing.
- OpenAI API integration trong phiên bản đầu.
- Tự động publish nội dung chưa qua human review.
- Hosting hoặc phân phối live malware samples.

## 3. Định vị và ngôn ngữ

- Identity: hybrid personal security lab, trình bày theo chuẩn security researcher.
- Ngôn ngữ UI và nội dung: English.
- Visual direction: `Editorial Signal`.
- Tone: precise, evidence-first, calm, technical, không dùng cyber cliché quá mức.
- Portfolio nhẹ: About, selected projects, achievements / certifications và contact; không biến homepage thành résumé.

## 4. Information architecture

### Primary navigation

- Index
- Notes
- Projects
- About

### Content axes

Domain và format là hai trục riêng:

| Axis | Values |
|---|---|
| Domain | Malware & DFIR; Cloud Security; Security Engineering |
| Format | Deep Research; Case Study; Guide |

Tags chỉ dùng để mô tả công nghệ hoặc kỹ thuật, ví dụ `YARA`, `Volatility`, `Azure`, `Sigma`, `IAM`, `Windows`. Tags không thay thế domain.

### Reader journey

1. Reader vào homepage và thấy một featured research duy nhất.
2. Scroll xuống `Explore the Domains`.
3. Chọn domain, sau đó lọc theo format hoặc tag.
4. Scan title, published date, summary và evidence-oriented metadata tại index.
5. Đọc bài với table of contents, evidence, code và references.
6. Tiếp tục tới related research hoặc recent work.

## 5. Homepage design

Homepage dùng progressive disclosure; không đặt hero và Topic Hub cạnh nhau trong first viewport.

### Section 1 — Featured research hero

- Gần full viewport.
- Chỉ tập trung vào featured article.
- Oversized editorial typography.
- Signal-ring graphic ở nền phải.
- Navigation tối giản và trạng thái online nhỏ.
- CTA: `Read featured research`.
- Scroll cue dẫn xuống research index.

### Section 2 — Explore the Domains

- Tiêu đề lớn `Explore the domains.`
- Ba domain hiển thị dạng horizontal index rows, không dùng grid card kiểu dashboard.
- Có dòng `FILTER RESEARCH` với blinking block cursor.
- Domain row dịch ngang nhẹ khi hover.
- Format filter xuất hiện sau khi reader chọn domain hoặc mở research index.

### Section 3 trở đi

- Recent Work.
- Selected Projects.
- Short profile / About teaser.
- Footer gồm RSS, GitHub và contact links.

## 6. Visual system

### Composition

- Nền gần đen, xanh lạnh làm accent.
- Asymmetric editorial layout.
- Thin technical grid lines thay cho card-heavy UI.
- Spacing rộng; mỗi viewport có một thông điệp chính.
- Monospace chỉ dùng cho labels, status và technical metadata.
- Sans-serif display dùng cho title; body font ưu tiên readability.

### Signature elements

- Signal ring: visual signature chính, dùng có chọn lọc ở hero hoặc section transition.
- Blinking block cursor: dùng tại filter/search affordance, không rải khắp site.
- Small online/status pulse: decorative accent, không mang critical information.

### Motion rules

- Chỉ animate `transform` và `opacity` trong các micro-interaction chính.
- Cursor blink khoảng 1.15 giây mỗi chu kỳ.
- Signal ring dùng slow scale/opacity breathing effect.
- Domain hover dịch 4–7 px.
- Không dùng particles, WebGL, video background hoặc animation library nếu CSS đủ dùng.
- `prefers-reduced-motion: reduce` tắt animation không thiết yếu.
- Reading page gần như không có decorative motion.

## 7. Research article design

### Header

- Breadcrumb: domain / format / entry number.
- Title lớn.
- Chỉ hiển thị `Published <date>`.
- Không hiển thị description/dek, updated date, reading time hoặc difficulty trong header.

### Body

- Main reading column giới hạn chiều rộng để đọc dài.
- Sticky table of contents trên desktop; chuyển thành static block trên mobile.
- Optional executive summary.
- Evidence blocks có identifier và verification state.
- Syntax-highlighted code blocks có filename label và copy action.
- IOC tables, diagrams và screenshots dùng caption rõ ràng.
- Conclusion tách riêng.
- References đặt cuối bài.
- Related research xuất hiện sau nội dung, không xen giữa bài.

### Safety presentation

- Không phân phối live malware.
- IOC và URL nguy hiểm được defang khi phù hợp.
- Sample identifiers có thể gồm hash và nguồn hợp pháp, nhưng không có direct executable download.
- Tách rõ observed evidence, inference và external claims.
- Không công bố secret, tenant identifier, personal data hoặc artifact nhạy cảm.

## 8. Content model

Mỗi content entry được validate bằng Astro Content Collections. Trường bắt buộc:

```yaml
title: "Dissecting an information stealer"
published: 2026-08-25
domain: "malware-dfir"
format: "case-study"
summary: "Short index summary"
tags:
  - yara
  - windows
draft: false
featured: true
```

Quy tắc:

- `domain` chỉ nhận một trong ba domain đã chốt.
- `format` chỉ nhận `deep-research`, `case-study` hoặc `guide`.
- Chỉ một bài được featured trên homepage tại một thời điểm.
- `draft: true` ngăn render nhưng không làm file bí mật trong public repository.
- Draft nhạy cảm phải để local/untracked hoặc trong repository private riêng.
- Slug ổn định sau khi publish; đổi slug phải có redirect map hoặc giữ URL cũ.

## 9. Technical architecture

### Stack

- Astro static site generator.
- Markdown cho nội dung thường; MDX chỉ khi bài cần reusable interactive component.
- Custom CSS và TypeScript nhỏ, không dùng full client-side framework nếu không cần.
- Static search index được tạo lúc build.
- GitHub Actions build và deploy GitHub Pages.
- Public repository để dùng GitHub Pages trên GitHub Free.

### Build data flow

1. Author viết Markdown / MDX và preview bằng Astro local server.
2. Schema validation kiểm tra frontmatter, domain và format.
3. CI chạy type check, Astro build, link check và content-safety checks có thể tự động hóa.
4. Astro tạo static HTML, optimized assets, search index, RSS và sitemap.
5. GitHub Actions upload Pages artifact và deploy.
6. Nếu validation hoặc build thất bại, deploy dừng; phiên bản đang live không bị thay thế.

### Runtime

- Reader tải static HTML, CSS và JavaScript module nhỏ.
- Search chạy phía client từ static index.
- Không có database, API server hoặc authentication.
- Không gửi visitor data tới backend do project vận hành.

## 10. Component boundaries

- `SiteShell`: global navigation, footer, theme foundation và accessibility skip link.
- `FeaturedHero`: featured entry và signal-ring treatment.
- `DomainIndex`: ba domain rows và filter affordance.
- `ResearchIndex`: query/filter content collection và render result list.
- `ArticleHeader`: breadcrumb, title và published date duy nhất.
- `ArticleBody`: prose styling, code, table, figure và callout primitives.
- `TableOfContents`: heading navigation độc lập với article rendering.
- `EvidenceBlock`: evidence identifier, status và content.
- `ProjectPreview`: selected project summary.
- `SearchOverlay`: static client-side search UI, lazy-loaded khi mở.

Mỗi component có một trách nhiệm; content query nằm trong page/data layer, không nhúng rải rác trong visual primitives.

## 11. Error handling

- Invalid frontmatter: build fail với file path và field lỗi.
- Duplicate slug: build fail.
- Nhiều featured entries: build fail.
- Broken internal link: CI fail trước deploy.
- Missing optional image: component dùng text-first layout, không làm vỡ trang.
- Search index unavailable: research index và domain navigation vẫn hoạt động.
- JavaScript disabled: navigation, articles và domain pages vẫn đọc được; chỉ mất search overlay và decorative interactions.
- Unknown route: custom 404 có link về Index và domain pages.

## 12. Subagent-assisted editorial pipeline

Phiên bản đầu dùng custom Codex subagents chạy on demand. Root editorial orchestrator điều phối năm role:

1. `research-planner`: tạo scope, research questions, source plan và evidence checklist.
2. `evidence-verifier`: kiểm tra source authority, dates, citations, claims và uncertainty.
3. `technical-writer`: tạo English Markdown / MDX từ approved brief và evidence ledger.
4. `security-reviewer`: kiểm tra secrets, sensitive artifacts, unsafe links, sample handling, IOC defanging và overclaims.
5. `site-qa`: chạy build/schema/link checks và review responsive, accessibility, performance, rendered pages.

Workflow:

```text
Topic
  -> Research brief
  -> Evidence ledger
  -> Draft article
  -> Security review + Site QA in parallel
  -> Release candidate
  -> Human approval
  -> Merge/push
  -> GitHub Actions deploy
```

Ràng buộc:

- Subagent không tự publish.
- Reviewer không sửa claim âm thầm; phải report evidence và đề xuất thay đổi.
- Các phase ghi cùng file chạy tuần tự; chỉ các review độc lập mới chạy song song.
- Root agent tổng hợp kết quả và dừng trước external publish action.
- Không dùng API-backed hoặc scheduled autonomous agent trong phiên bản đầu.
- Subagent workflows có thể dùng nhiều model tokens hơn single-agent workflows.

## 13. Validation và acceptance criteria

### Automated

- Clean install thành công.
- Type/schema checks pass.
- Production Astro build pass.
- Không có duplicate slug hoặc multiple featured entries.
- Internal links pass.
- Generated RSS và sitemap tồn tại.
- Reduced-motion media query được kiểm tra.
- Static output không phụ thuộc runtime server.

### Visual QA

- Render và kiểm tra homepage, domain index, article, About và 404 ở desktop/mobile.
- First viewport chỉ có featured research, không nhồi Topic Hub cạnh hero.
- Index section xuất hiện sau scroll.
- Blinking cursor nằm ở filter affordance.
- Article header chỉ có breadcrumb, title và published date.
- Không overflow code block, table, long URL hoặc navigation.

### Performance và accessibility

- Không có render-blocking animation library.
- Decorative motion tắt bằng reduced motion.
- Keyboard navigation dùng được cho menu, filters, search và table of contents.
- Focus state nhìn thấy rõ.
- Contrast đủ cho body text, metadata và interactive states.
- Images có dimensions và alternative text phù hợp.

## 14. Cost boundary

- GitHub Pages dùng public repository trên GitHub Free.
- Standard GitHub-hosted Actions cho public repository được dùng cho build/deploy.
- Không thêm paid CMS, database, analytics hoặc search service.
- Codex subagents chạy theo yêu cầu trong môi trường Codex của người dùng; usage vẫn phụ thuộc giới hạn tài khoản hiện hành.
- Bất kỳ OpenAI API, scheduled autonomous agent hoặc third-party paid service nào là scope mới và cần phê duyệt riêng.

## 15. Implementation sequencing

1. Scaffold Astro và CI foundation.
2. Content schema, fixtures và validation tests.
3. Design tokens, SiteShell và responsive navigation.
4. Homepage scroll narrative và motion primitives.
5. Domain / research index và static search.
6. Article system và content components.
7. About, Projects, RSS, sitemap và 404.
8. Custom Codex subagent role definitions và editorial instructions.
9. Full automated, visual, performance và accessibility QA.
10. User review, repository naming check và GitHub Pages deployment.

