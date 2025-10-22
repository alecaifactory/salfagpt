# Landing Page Design - SalfaGPT

## 🎯 Purpose

This document describes the design and content of the SalfaGPT landing page (`src/pages/index.astro`), which serves as the entry point for users to authenticate and access the platform.

---

## 🌟 Overview

**Page Type:** Authentication entry point with hero section  
**Language:** Spanish (Español)  
**Auth Method:** Google OAuth  
**Last Updated:** 2025-10-22  

---

## 🎨 Layout Structure

### Two-Column Split Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    LANDING PAGE                              │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│   LEFT SIDE              │   RIGHT SIDE                     │
│   Hero Content           │   Login Card                     │
│   (Information)          │   (Authentication)               │
│                          │                                  │
│   • Salfacorp Logo       │   • Welcome Header               │
│   • Hero Title           │   • Login Description            │
│   • Value Proposition    │   • Google OAuth Button          │
│   • AI Disclaimer        │   • Terms/Privacy Notice         │
│   • Call to Action       │   • Error/Success Messages       │
│                          │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

**Responsive Behavior:**
- **Desktop (≥768px):** Two columns side-by-side
- **Mobile (<768px):** Stacked vertically (hero on top, login below)

---

## 📝 Content Structure

### Left Side: Hero Section

#### 1. Salfacorp Logo

**Location:** Top of left column  
**Asset:** `/images/Logo Salfacorp.png`  
**Size:** 128x128px (md: 160x160px)  
**Alignment:** Center (mobile), Left (desktop)

```html
<img 
  src="/images/Logo Salfacorp.png" 
  alt="Salfacorp" 
  class="w-32 h-32 md:w-40 md:h-40 object-contain"
/>
```

---

#### 2. Hero Title

**Text:** "¡Hola! Soy tu agente SalfaCorp"

**Styling:**
- Font size: 2.5rem (mobile), 3rem (desktop)
- Font weight: Bold
- Gradient: Blue-400 → Purple-400
- Effect: Text gradient with `bg-clip-text`

```html
<h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
  ¡Hola! Soy tu agente SalfaCorp
</h1>
```

**Purpose:** Friendly, personal greeting that establishes the AI agent identity

---

#### 3. Value Proposition (Paragraph 1)

**Text:**
> En SalfaCorp estamos comprometidos con la innovación y la transformación digital, integrando herramientas de inteligencia artificial para elevar tu eficiencia y productividad. Estos agentes están diseñados para ser tus aliados en procesos y para responder todas tus consultas a cualquier hora y desde cualquier dispositivo.

**Styling:**
- Color: `slate-200`
- Font size: 1rem (mobile), 1.125rem (desktop)
- Line height: Relaxed (`leading-relaxed`)
- Spacing: Bottom margin

**Purpose:** Explains SalfaCorp's commitment to digital transformation and AI integration

---

#### 4. AI Disclaimer (Paragraph 2)

**Text:**
> Ten en cuenta que este agente se basa en inteligencia artificial, por lo que sus respuestas se generan en función de probabilidades. Si no estás de acuerdo con las respuestas puedes escribirnos a soporteia@salfagestion.cl

**Styling:**
- Color: `slate-300`
- Font size: 0.875rem (mobile), 1rem (desktop)
- Email link: Blue-400 with hover effect and underline

```html
<p class="text-slate-300 text-sm md:text-base">
  Ten en cuenta que este agente se basa en inteligencia artificial, por lo que sus respuestas se generan en función de probabilidades. Si no estás de acuerdo con las respuestas puedes escribirnos a 
  <a href="mailto:soporteia@salfagestion.cl" class="text-blue-400 hover:text-blue-300 underline">
    soporteia@salfagestion.cl
  </a>
</p>
```

**Purpose:** Transparency about AI limitations and support contact

**Email:** `soporteia@salfagestion.cl` (clickable mailto link)

---

#### 5. Call to Action (Paragraph 3)

**Text:**
> Inicia sesión con tu correo corporativo y transforma tu día a día. Únete ahora y haz que cada momento cuente, mientras evolucionamos juntos el futuro con soluciones inteligentes.

**Styling:**
- Color: `slate-100` (brightest, most prominent)
- Font weight: Medium
- Font size: 1rem (mobile), 1.125rem (desktop)

**Purpose:** Motivational call to action encouraging corporate email login

---

### Right Side: Login Card

#### Card Container

**Styling:**
- Background: Semi-transparent white with blur (`bg-white/10 backdrop-blur-lg`)
- Border: White with 20% opacity
- Shadow: Extra large (`shadow-2xl`)
- Border radius: Large (`rounded-2xl`)
- Padding: 2rem (mobile), 3rem (desktop)

**Responsive:**
- Width: 100% (mobile), max-width 28rem (desktop)
- Centered alignment

---

#### Welcome Section

**Header:** "Bienvenido"
- Font size: 1.875rem
- Font weight: Bold
- Color: White

**Subtitle:** "Inicia sesión para continuar"
- Font size: Default
- Color: `slate-300`

---

#### Success/Error Messages

**Logout Success Message:**
```html
<div class="bg-green-500/20 border border-green-500/40 rounded-lg p-4">
  <h3>Sesión Cerrada</h3>
  <p>Has cerrado sesión exitosamente.</p>
</div>
```

**Error Messages:**
- `auth_failed`: "Error de Autenticación - No se pudo completar el inicio de sesión"
- `no_code`: "Error de Autorización - No se recibió el código de Google"
- `auth_processing_failed`: "Error al Procesar - Ocurrió un error al procesar tu inicio de sesión"

**Styling:**
- Background: Red-500 with 20% opacity
- Border: Red-500 with 40% opacity
- Icon: Alert circle (red)
- Text: Red-300 (title), Red-200 (message)

---

#### Google OAuth Button

**Text:** "Continuar con Google"

**Styling:**
- Background: White
- Hover: Gray-50
- Text: Gray-900 (dark)
- Font weight: Semibold
- Padding: 1rem (vertical), 1.5rem (horizontal)
- Border radius: Extra large
- Shadow: Large with hover lift effect
- Transition: 200ms smooth

**Icon:** Google logo (multi-color SVG)

**Behavior:**
- Hover: Slight lift animation (`transform hover:-translate-y-0.5`)
- Hover: Enhanced shadow
- Click: Redirects to `/auth/login-redirect`

---

#### Terms & Privacy Notice

**Text:** "Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad"

**Styling:**
- Font size: Small (0.875rem)
- Color: `slate-400`
- Alignment: Center

---

## 🎨 Visual Design

### Color Palette

**Background:**
- Gradient: `from-slate-50 via-blue-50 to-slate-50` (light, subtle)
- Effect: Diagonal gradient (bottom-right)
- Overall feel: Clean, professional white background

**Text Colors (High Contrast for Accessibility):**
- Hero title: Gradient `blue-600 → purple-600` (dark on light)
- Primary text: `slate-700` (WCAG AAA compliant)
- Secondary text: `slate-600` (WCAG AA compliant)
- Call to action: `slate-800` with `font-semibold` (highest emphasis)
- Muted text: `slate-500`

**Interactive Elements:**
- Primary button: White background (unchanged)
- Links: `blue-600` with `blue-700` hover (high contrast)
- Success messages: `green-50` bg with `green-600/700/800` text
- Error messages: `red-50` bg with `red-600/700/800` text

**Login Card:**
- Background: Solid white (`bg-white`)
- Border: `slate-200` (subtle outline)
- Shadow: Extra large for depth
- No backdrop blur (clean, solid design)

---

### Typography

**Font Sizes:**
- H1 (Hero): 2.5rem → 3rem (responsive)
- H2 (Welcome): 1.875rem
- Body: 1rem → 1.125rem (responsive)
- Small: 0.875rem → 1rem (responsive)
- Footer: 0.875rem

**Font Weights:**
- Title: Bold (700)
- Button: Semibold (600)
- Call to action: Medium (500)
- Body: Normal (400)

**Line Heights:**
- Body text: `leading-relaxed`
- Default spacing preserved for other elements

---

### Spacing

**Sections:**
- Vertical spacing between paragraphs: 1rem (`space-y-4`)
- Card internal spacing: 1.5rem (`space-y-6`)

**Padding:**
- Page container: 1rem (mobile), 3rem (desktop)
- Card: 2rem (mobile), 3rem (desktop)

**Gaps:**
- Grid columns: 3rem (`gap-12`)

---

## 🌍 Internationalization

### Current Language: Spanish

**All user-facing text is in Spanish:**
- ✅ Hero title and content
- ✅ Welcome header
- ✅ Button text
- ✅ Terms notice
- ✅ Error messages
- ✅ Success messages

**Future Enhancement:**
Consider implementing translation context (see `.cursor/rules` for translation patterns) if multi-language support is needed.

---

## 🔐 Authentication Flow

### OAuth Flow

```
1. User lands on landing page (/)
   ↓
2. If already logged in → Redirect to /chat
   ↓
3. User clicks "Continuar con Google"
   ↓
4. Redirect to /auth/login-redirect
   ↓
5. Google OAuth consent screen
   ↓
6. Callback to /auth/callback with code
   ↓
7. JWT token created and stored in cookie
   ↓
8. Redirect to /chat
```

### Error Handling

**Query Parameters:**
- `?error=auth_failed` - Shows authentication error
- `?error=no_code` - Shows authorization error
- `?error=auth_processing_failed` - Shows processing error
- `?logout=success` - Shows logout success message

**Display:**
- Errors shown at top of login card
- Red theme with alert icon
- Clear error title and message
- User-friendly Spanish text

---

## 📱 Responsive Design

### Breakpoints

**Mobile (<768px):**
- Single column stacked layout
- Logo centered
- Text centered
- Full-width login card
- Font sizes: Smaller scale

**Desktop (≥768px):**
- Two-column grid layout
- Logo left-aligned
- Text left-aligned
- Login card on right
- Font sizes: Larger scale

### Grid Configuration

```css
grid md:grid-cols-2 gap-12 items-center
```

- Mobile: 1 column
- Desktop: 2 equal columns
- Gap: 3rem between columns
- Vertical alignment: Centered

---

## ✨ Interactive Elements

### Google OAuth Button

**States:**
- **Default:** White background, gray-900 text
- **Hover:** Gray-50 background, enhanced shadow, lift animation
- **Active:** Standard button press

**Transition:** 200ms all properties

**Accessibility:**
- Semantic `<a>` tag (not button, since it navigates)
- Clear visual focus state
- High contrast text
- Large touch target (≥44px height)

---

## 🔍 SEO & Meta

**Title:** "SalfaGPT - AI-Powered Conversations"

**Language:** `lang="en"` (should be updated to "es")

**Future Enhancements:**
- Add meta description
- Add Open Graph tags
- Add favicon
- Update lang attribute to "es"

---

## 🎯 Key Messages

### Primary Message (Hero)
"¡Hola! Soy tu agente SalfaCorp" - Friendly, personal introduction

### Core Values (Paragraph 1)
- Innovación (Innovation)
- Transformación digital (Digital transformation)
- Eficiencia y productividad (Efficiency and productivity)
- 24/7 availability
- Multi-device access

### Transparency (Paragraph 2)
- AI-based responses
- Probabilistic nature
- Support channel for disagreements

### Call to Action (Paragraph 3)
- Corporate email login
- Daily transformation
- Future evolution together
- Intelligent solutions

---

## 🔐 Security & Privacy

### User Agreement Notice

**Text:** "Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad"

**Future:** Link to actual Terms and Privacy Policy pages

### OAuth Security

- ✅ Secure Google OAuth flow
- ✅ HTTPS required in production
- ✅ JWT session management
- ✅ HTTP-only cookies

---

## 🚀 Technical Implementation

### File Location
`src/pages/index.astro`

### Dependencies
- Astro 5.1.x
- Tailwind CSS 3.4.x
- Google OAuth (via `/auth/login-redirect`)
- Session management (via `src/lib/auth.ts`)

### Server-Side Logic
```typescript
// Redirect if already authenticated
const session = getSession(Astro);
if (session) {
  return Astro.redirect('/chat');
}

// Handle OAuth errors
const errorParam = Astro.url.searchParams.get('error');
const logoutParam = Astro.url.searchParams.get('logout');
```

---

## ✅ Quality Checklist

### Content
- [x] All text in Spanish
- [x] Clear value proposition
- [x] AI transparency disclaimer
- [x] Support email provided
- [x] Motivational call to action

### Design
- [x] Responsive layout
- [x] Professional appearance
- [x] Brand colors (blue gradient)
- [x] Salfacorp logo visible
- [x] High contrast for readability

### Functionality
- [x] OAuth button functional
- [x] Error messages display correctly
- [x] Success messages display correctly
- [x] Session redirect works
- [x] No linting errors

### Accessibility
- [x] Semantic HTML
- [x] Alt text for logo
- [x] Clear visual hierarchy
- [x] Sufficient color contrast
- [x] Large touch targets

---

## 🔄 Change History

### 2025-10-22: White Background Theme Update

**Changed:**
- Background: Dark gradient → Light gradient (`slate-50` via `blue-50`)
- Hero title gradient: `blue-400/purple-400` → `blue-600/purple-600`
- Primary text: `slate-200` → `slate-700`
- Secondary text: `slate-300/200` → `slate-600`
- Call to action: `slate-100` → `slate-800` with semibold
- Login card: Semi-transparent blur → Solid white
- Success messages: Dark theme → Light theme (green-50 bg)
- Error messages: Dark theme → Light theme (red-50 bg)
- All links: `blue-400` → `blue-600`

**Rationale:** Improve readability and accessibility with high-contrast design on white background

**Impact:**
- WCAG AAA compliance for primary text
- WCAG AA compliance for all text
- Cleaner, more professional appearance
- Better printability
- Reduced eye strain
- Maintains all functionality

### 2025-10-22: Spanish Content Update

**Changed:**
- Hero title: "SalfaGPT" → "¡Hola! Soy tu agente SalfaCorp"
- Hero content: English bullets → Spanish paragraphs
- Welcome: "Welcome" → "Bienvenido"
- Subtitle: "Sign in to continue your AI journey" → "Inicia sesión para continuar"
- Button: "Continue with Google" → "Continuar con Google"
- Terms: English → Spanish

**Rationale:** Align with SalfaCorp's Spanish-speaking audience and corporate identity

**Impact:**
- More personal, welcoming tone
- Clear explanation of AI capabilities and limitations
- Direct support channel for user feedback
- Maintains all functionality

---

## 📋 Future Enhancements

### Content
- [ ] Add Terms of Service page
- [ ] Add Privacy Policy page
- [ ] Create FAQ section
- [ ] Add product demo video

### Design
- [ ] Animation on page load
- [ ] Animated gradient background
- [ ] Testimonials section
- [ ] Feature highlights carousel

### Technical
- [ ] Update lang attribute to "es"
- [ ] Add meta description
- [ ] Add Open Graph tags
- [ ] Add structured data (schema.org)
- [ ] Implement analytics tracking

### Internationalization
- [ ] Support for English/Spanish toggle
- [ ] Use translation context pattern
- [ ] Auto-detect browser language

---

## 🎓 Design Principles Applied

### 1. Progressive Disclosure
- Essential information first (who, what, why)
- Support details in disclaimer
- Login action prominent

### 2. Feedback & Visibility
- Clear error messages with recovery
- Success confirmation on logout
- OAuth flow transparency

### 3. Security by Default
- OAuth-only authentication
- Terms agreement notice
- Secure session handling

### 4. User-Centric
- Spanish language for target audience
- Transparent about AI limitations
- Clear support channel
- Motivational messaging

---

## 📚 Related Documentation

### Internal Docs
- `.cursor/rules/alignment.mdc` - Design principles
- `.cursor/rules/ui.mdc` - UI components and patterns
- `.cursor/rules/frontend.mdc` - Frontend architecture
- `src/lib/auth.ts` - Authentication implementation

### Assets
- `/images/Logo Salfacorp.png` - Company logo
- `/styles/global.css` - Global styles

### API Routes
- `/auth/login-redirect` - Initiates OAuth flow
- `/auth/callback` - OAuth callback handler
- `/chat` - Main application (post-login)

---

## 🔧 Maintenance

### Regular Updates
- Review text quarterly for clarity
- Update support email if changed
- Refresh error messages based on user feedback
- Monitor OAuth success rate

### Testing
- Test OAuth flow monthly
- Verify responsive design on all devices
- Check error states display correctly
- Validate all links work

### Analytics
- Track login conversion rate
- Monitor OAuth error frequency
- Measure time on page
- Track bounce rate

---

## ✨ Key Features

1. **Personal Greeting:** "¡Hola!" creates immediate connection
2. **Clear Identity:** "Soy tu agente SalfaCorp" establishes AI agent role
3. **Value Prop:** Innovation, efficiency, productivity, 24/7 support
4. **Transparency:** Honest about AI probabilistic nature
5. **Support:** Direct email contact for issues
6. **Motivation:** Transform daily work with intelligent solutions
7. **Professional:** Corporate branding with modern design
8. **Secure:** Google OAuth with clear terms agreement

---

**Last Updated:** 2025-10-22  
**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Language:** Spanish (Español)  
**Author:** Alec

---

**Remember:** This landing page is the first impression users have of SalfaGPT. It must be welcoming, transparent, and professional while clearly communicating the value of AI-powered assistance.

