# Design Guidelines: Onebox Email Aggregator

## Design Approach

**Selected Approach:** Design System with Email Client References
- **Primary Inspiration:** Linear's typography + Superhuman's email UX + Gmail's information hierarchy
- **Design System Foundation:** Material Design for content-rich applications with custom email-specific patterns
- **Key Principles:** Information clarity, scan-ability, rapid task completion, distraction-free reading

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 220 70% 50% (Professional blue for actions, links, selected states)
- Background: 0 0% 100% (Pure white for email content area)
- Surface: 220 14% 96% (Light gray for sidebar, secondary surfaces)
- Border: 220 13% 91% (Subtle borders for separation)
- Text Primary: 220 9% 15% (Near-black for email content)
- Text Secondary: 220 9% 46% (Gray for metadata, timestamps)

**Dark Mode:**
- Primary: 220 70% 60% (Brighter blue for dark background)
- Background: 220 13% 10% (Deep charcoal for email content)
- Surface: 220 13% 15% (Slightly lighter for sidebar, cards)
- Border: 220 13% 20% (Subtle borders)
- Text Primary: 0 0% 95% (Off-white for readability)
- Text Secondary: 220 9% 65% (Muted for metadata)

**Category Colors (Works in both modes):**
- Interested: 142 76% 36% (Green - high priority)
- Meeting Booked: 221 83% 53% (Blue - confirmed action)
- Not Interested: 0 0% 60% (Gray - neutral/archived)
- Spam: 0 84% 60% (Red - warning)
- Out of Office: 45 93% 47% (Amber - informational)

### B. Typography

**Font Families:**
- Primary: 'Inter' (UI elements, email lists, metadata)
- Reading: 'System UI' stack (email body content for native feel)
- Monospace: 'JetBrains Mono' (email headers, technical details)

**Type Scale:**
- Email Subject: text-base (16px) font-medium
- Email Preview: text-sm (14px) font-normal
- Sender Name: text-sm (14px) font-semibold
- Timestamp/Meta: text-xs (12px) font-normal
- Body Text: text-base (16px) leading-relaxed
- Section Headers: text-lg (18px) font-semibold
- Page Titles: text-2xl (24px) font-bold

### C. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Consistent padding: p-4 for cards, p-6 for containers, p-8 for main content
- Margins: m-2 for tight spacing, m-4 for standard, m-6 for section breaks
- Gaps: gap-2 for icon+text, gap-4 for list items, gap-6 for sections

**Layout Structure:**
- Three-column layout: Sidebar (240px) → Email List (360px) → Email Detail (flex-1)
- Responsive breakpoints: Stack to single column on mobile, two-column on tablet
- Fixed sidebar and email list, scrollable detail pane

### D. Component Library

**Navigation & Sidebar:**
- Account switcher at top with avatar + dropdown
- Folder tree with expandable categories
- AI category filters with count badges
- Search bar with live filter chips
- Settings/profile at bottom

**Email List (Center Column):**
- Compact card design with hover state
- Left border accent indicating AI category
- Row structure: Sender (bold) → Subject → Preview (truncated)
- Right-aligned metadata: Timestamp, attachment icon, category badge
- Multi-select checkboxes on hover
- Unread indicator (blue dot + bold text)
- Infinite scroll with 50-item batches

**Email Detail (Right Pane):**
- Full email header (expandable for technical details)
- From/To/CC lines with avatars
- Subject line as h1 with category badge
- Timestamp and folder breadcrumb
- Action toolbar: Reply, Forward, Archive, Delete, Categorize
- Email body with preserved formatting
- Attachment preview cards at bottom
- AI Suggested Reply section (collapsible, bottom of email)

**Search Interface:**
- Global search bar in top navigation
- Advanced filter panel (slide-in from right)
- Filter chips: Account, Folder, Category, Date range, Has attachments
- Real-time results with highlighted search terms
- Saved search queries

**Forms & Inputs:**
- Account setup modal with IMAP configuration fields
- Inline editing for email categories (dropdown)
- Search input with autocomplete suggestions
- Toggle switches for notification preferences

**Data Display:**
- Category badges: Pill-shaped with category color + icon
- Avatar circles for senders (with fallback initials)
- Attachment cards with file type icons
- Email metadata table (expandable headers)
- Account status indicators (connected/syncing/error)

**Modals & Overlays:**
- Account management modal (add/edit IMAP accounts)
- Email compose overlay (slide from bottom on mobile, modal on desktop)
- Categorization dropdown menu
- Confirmation dialogs for delete/archive actions
- Settings panel (slide from right)

**Notifications:**
- Toast notifications for sync status (bottom-right)
- Inline banner for Slack integration confirmation
- Badge counts on category filters and folders

### E. Animations

**Minimal, Performance-First:**
- Email list item hover: subtle background color transition (150ms)
- Category badge changes: smooth color transition (200ms)
- Modal/drawer entrance: slide + fade (250ms ease-out)
- Search results: staggered fade-in (avoid layout shift)
- Loading states: skeleton screens (no spinners)

**Avoid:** Elaborate scroll animations, parallax, complex transitions

## Email-Specific UX Patterns

**Reading Experience:**
- Maximum content width: 720px (optimal reading)
- Generous line-height: 1.6 for body text
- Clear visual hierarchy for quoted replies
- Syntax highlighting for code blocks in emails
- Collapsible quoted text with "Show more" toggle

**Category Visualization:**
- Left border on email cards (4px solid in category color)
- Small badge in email header
- Filter sidebar shows counts per category
- Color-coded dots in email list view

**Multi-Account Management:**
- Account selector with visual distinction (different accent colors)
- Unified inbox view as default
- Quick account switching without page reload
- Per-account folder trees

**AI Suggested Replies:**
- Card layout with preview of suggestion
- Edit button to modify before sending
- Confidence score indicator (subtle)
- Copy to compose action
- Light background to distinguish from email content

## Images

This is a productivity application focused on information density and functionality. Images are NOT used in the core interface. The design relies on typography, color-coding, and data visualization instead of imagery.

**No Hero Section:** This is not a marketing site - users land directly in their inbox view.

**Icons Only:** Use Heroicons throughout for consistency (outline style for navigation, solid for actions).