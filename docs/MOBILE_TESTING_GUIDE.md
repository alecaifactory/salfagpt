# Mobile Testing Guide

Quick guide for testing the mobile responsive interface.

---

## 🧪 Quick Test in Browser

### Method 1: Chrome DevTools

```bash
# 1. Start dev server
npm run dev

# 2. Open in Chrome
open http://localhost:3000/chat

# 3. Open DevTools (Cmd+Option+I)
# 4. Click "Toggle Device Toolbar" (Cmd+Shift+M)
# 5. Select device:
#    - iPhone 14 Pro Max
#    - iPhone SE
#    - Galaxy S20
#    - Pixel 5
```

### What You Should See

**Mobile View (< 768px):**
- ✅ Single column layout
- ✅ Large SALFAGPT header
- ✅ List of agent cards
- ✅ No sidebars

**Desktop View (≥ 768px):**
- ✅ Three-panel layout
- ✅ Left sidebar with agents
- ✅ Center chat area
- ✅ All features visible

---

## 📱 Test on Real Device

### Same Network Method

**Requirements:**
- Mobile device and laptop on same WiFi

**Steps:**
```bash
# 1. Start server
npm run dev

# 2. Find your laptop's local IP
# macOS:
ipconfig getifaddr en0

# 3. On mobile browser, visit:
http://<your-ip>:3000/chat

# Example:
# http://192.168.1.100:3000/chat
```

### Test Checklist

**Agents View:**
- [ ] Header displays correctly
- [ ] Agent cards are large and tappable
- [ ] Loading spinner shows when fetching
- [ ] Tap agent → Opens chat ✅

**Chat View:**
- [ ] Back button works → Returns to agents
- [ ] Agent name in header
- [ ] Messages display (yours blue, AI white)
- [ ] Input field at bottom (fixed)
- [ ] Send button is large and visible
- [ ] Keyboard doesn't hide input (iOS)

**Sending Message:**
- [ ] Type message in input
- [ ] Tap send button
- [ ] Message appears instantly (blue bubble)
- [ ] AI response appears (white bubble)
- [ ] Auto-scrolls to latest message

**Feedback:**
- [ ] AI messages show 👍/👎 buttons
- [ ] Buttons are large (easy to tap)
- [ ] Tap 👍 → Feedback submitted
- [ ] Tap 👎 → Screenshot modal opens
- [ ] Take photo → Feedback with image submitted

---

## 🔍 What to Look For

### ✅ Good Signs

- Layout is single-column
- Buttons are large (easy to tap with thumb)
- No horizontal scrolling
- Text is readable (14px+)
- Smooth scrolling
- Fast loading

### 🚩 Issues to Report

- Horizontal scroll appears
- Buttons too small (< 44px)
- Text too small (< 12px)
- Slow loading (> 2s)
- Keyboard covers input
- Layout breaks on orientation change

---

## 📐 Device Breakpoints

**How detection works:**

```
Screen Width < 768px    → Mobile UI
Screen Width ≥ 768px    → Desktop UI

User Agent contains:
- "iPhone"              → Mobile
- "Android.*mobile"     → Mobile  
- "iPad"                → Desktop (tablet = desktop)
- "Android tablet"      → Desktop
```

---

## 🎯 Key Test Scenarios

### Scenario 1: New User (First Time)

1. Open site on mobile
2. Login (OAuth)
3. See agents list
4. Tap first agent
5. See welcome message
6. Send first message
7. Receive response
8. Tap 👍 Útil

**Expected:** Smooth, intuitive flow

---

### Scenario 2: Returning User

1. Open site (already logged in)
2. See agents list immediately
3. Tap recent agent
4. See message history
5. Continue conversation
6. Provide feedback on response

**Expected:** Fast, no re-authentication

---

### Scenario 3: Feedback with Screenshot

1. Receive AI response
2. Tap 👎 Mejorar
3. Modal opens
4. Tap "Tomar Foto"
5. Camera opens (native)
6. Take screenshot
7. Review and submit

**Expected:** Native camera integration works

---

### Scenario 4: Switch Agents

1. In chat with Agent A
2. Tap back button (←)
3. See agents list
4. Tap Agent B
5. Messages clear
6. Agent B messages load
7. Continue in Agent B

**Expected:** Clean switch, no Agent A messages

---

## 🐛 Troubleshooting

### Issue: Mobile UI not showing

**Check:**
```javascript
// Open browser console
console.log(window.innerWidth); // Should be < 768
```

**Solution:** Clear cache, hard reload (Cmd+Shift+R)

---

### Issue: Keyboard covers input (iOS)

**Expected:** Input scrolls up when keyboard opens

**If broken:** iOS safe area CSS may need adjustment

---

### Issue: Desktop showing on tablet

**Expected:** iPad shows desktop UI (screen ≥ 768px)

**This is correct:** Tablets have enough space for desktop UI

---

### Issue: Can't tap buttons

**Check:** Buttons should be ≥ 48px

**Fix:** Increase padding in MobileChatInterface.tsx

---

## 📱 Device Matrix

| Device | Screen | Expected UI |
|---|---|---|
| iPhone 14 Pro Max | 430x932 | Mobile ✅ |
| iPhone SE | 375x667 | Mobile ✅ |
| Galaxy S20 | 360x800 | Mobile ✅ |
| Pixel 5 | 393x851 | Mobile ✅ |
| iPad Pro 11" | 834x1194 | Desktop ✅ |
| iPad Mini | 744x1133 | Desktop ✅ |
| MacBook Pro | 1440x900 | Desktop ✅ |
| Desktop Monitor | 1920x1080 | Desktop ✅ |

---

## ✅ Acceptance Criteria

**Mobile view must:**
- [ ] Show agents list on load
- [ ] Allow agent selection
- [ ] Display messages correctly
- [ ] Send messages successfully
- [ ] Show feedback buttons
- [ ] Capture screenshots
- [ ] Navigate back to agents

**Desktop view must:**
- [ ] Remain completely unchanged
- [ ] All features still work
- [ ] No regressions

---

**Ready to test!** 🚀

Open `http://localhost:3000/chat` and resize browser to < 768px width to see mobile UI.



