# Understand: Confirm Understanding Before Building

A lightweight confirmation checkpoint that reads back Claude's interpretation of a coding request before implementation begins. Teaches technical terminology along the way and asks clarifying questions when confidence is below 80%.

## Auto-Trigger Behavior

This skill should be **automatically invoked** (without explicit `/understand` command) when a coding request meets ANY of these criteria:

### Trigger Conditions

1. **Ambiguous Scope**
   - "Add [feature]" without specifics (where? how?)
   - "Fix the [thing]" without pointing to specific code
   - "Improve" or "optimize" without metrics
   - "Refactor" without clear target state

2. **Multiple Valid Approaches**
   - Authentication (JWT vs sessions vs OAuth)
   - State management (context vs redux vs zustand)
   - Styling (CSS modules vs Tailwind vs styled-components)
   - API design (REST vs GraphQL vs tRPC)

3. **Broad Impact**
   - Will likely touch 4+ files
   - Affects core architecture
   - Changes user-facing behavior

4. **Missing Specifics**
   - No file paths mentioned
   - No function/component names
   - No acceptance criteria
   - No error messages (for bug fixes)

### Skip Conditions (Don't Trigger)

- Specific file + specific change: "Change the button color in Header.tsx to blue"
- Explicit instructions: "Use JWT, store in httpOnly cookie, add /api/auth/login endpoint"
- Tiny scope: "Fix the typo in README"
- User already provided detailed specs
- User says "just do it" or "skip confirmation"

---

## THE PROCESS

### Step 1: Calculate Confidence

Before responding, assess confidence (0-100%) based on:

| Factor | Weight | High Confidence | Low Confidence |
|--------|--------|-----------------|----------------|
| Specificity | 30% | Exact files, functions named | "the API", "the frontend" |
| Approach clarity | 25% | One obvious way | Multiple valid approaches |
| Scope definition | 20% | Clear boundaries | "and anything related" |
| Success criteria | 15% | Measurable outcome | "should work better" |
| Prior context | 10% | Discussed before | First mention |

---

### Step 2: Read Back Interpretation

Present your understanding in this format:

```
=== UNDERSTANDING CHECK ===

**What I heard:** [Their words, summarized]

**What I think you want:**
[1-3 sentences in plain English describing the goal]

**In technical terms:**
[Map their request to technical concepts, explaining each]

| Your Words | Technical Meaning |
|------------|-------------------|
| "add login" | **Authentication** - verifying user identity |
| "remember them" | **Session management** - keeping users logged in across visits |
| "secure" | **Authorization** - controlling what authenticated users can access |

**My planned approach:**
1. [Step 1] - [brief explanation of why]
2. [Step 2] - [brief explanation of why]
3. [Step 3] - [brief explanation of why]

**Files I'd touch:**
- `[file1]` - [what changes]
- `[file2]` - [what changes]

**Assumptions I'm making:**
- [Assumption 1] (if wrong, this changes things)
- [Assumption 2] (if wrong, this changes things)
```

---

### Step 3: Confidence-Based Response

#### If Confidence >= 80%

```
**Confidence: [X]%** - I'm clear on what you want.

Does this match your intent?
- **Yes, build it** - I'll proceed with implementation
- **Close, but...** - Tell me what I missed
- **No, let me explain** - I'll listen and re-interpret
```

#### If Confidence 50-79%

```
**Confidence: [X]%** - I have a reasonable picture but some gaps.

Quick clarifications needed:

1. **[Specific question]**
   Options: [A] [B] [C]

2. **[Specific question]**
   Options: [A] [B] [C]

Once you answer these, I'll be ready to build.
```

#### If Confidence < 50%

```
**Confidence: [X]%** - I need more context before I can plan this well.

Help me understand:

1. **[Fundamental question about goal]**
   What problem are we solving?

2. **[Question about scope]**
   Where does this live in the codebase?

3. **[Question about constraints]**
   Any requirements I should know about?

4. **[Question about success]**
   How will we know it's working?

Take your time - getting this right upfront saves hours of rework.
```

---

## TERMINOLOGY TEACHING

When interpreting requests, actively teach technical vocabulary:

### Common Mappings

| User Says | Technical Term | Quick Explanation |
|-----------|----------------|-------------------|
| "login/signup" | Authentication | Verifying who someone is |
| "who can see what" | Authorization | Controlling access based on roles |
| "remember the user" | Session/State Management | Persisting data across page loads |
| "talk to the database" | Query/ORM | Reading or writing data |
| "send data to server" | API Call | Frontend requesting something from backend |
| "show/hide based on screen" | Responsive Design | Adapting layout to viewport size |
| "make it faster" | Performance Optimization | Reducing load time, bundle size, or render time |
| "keep code organized" | Refactoring | Restructuring without changing behavior |
| "handle errors" | Error Handling/Boundaries | Graceful failure and user feedback |
| "test it works" | Unit/Integration/E2E Tests | Automated verification of behavior |
| "deploy it" | CI/CD Pipeline | Automated build and release process |
| "store in browser" | LocalStorage/Cookies/IndexedDB | Client-side persistence |
| "real-time updates" | WebSockets/SSE/Polling | Live data without page refresh |
| "lazy load" | Code Splitting | Loading code only when needed |
| "cache it" | Memoization/HTTP Caching | Avoiding redundant work or requests |

### Architecture Patterns

| User Says | Pattern | Quick Explanation |
|-----------|---------|-------------------|
| "separate concerns" | MVC/MVVM | Dividing code by responsibility |
| "reusable piece" | Component | Self-contained UI building block |
| "shared state" | Context/Store | Data accessible across components |
| "wrapper component" | HOC/Provider | Component that adds behavior to children |
| "custom logic" | Hook (React) | Reusable stateful logic |
| "background task" | Worker/Queue | Work that happens outside main thread |
| "webhook" | Event-driven | External trigger calling your code |
| "middleware" | Interceptor | Code that runs between request and response |

---

## EXAMPLE CONVERSATIONS

### Example 1: Ambiguous Feature Request

**User:** "Add user authentication to the app"

**Claude:**
```
=== UNDERSTANDING CHECK ===

**What I heard:** Add user authentication to the app

**What I think you want:**
Let users create accounts and log in, so you can identify who's using your app and personalize their experience.

**In technical terms:**

| Your Words | Technical Meaning |
|------------|-------------------|
| "user authentication" | **Authentication** - the process of verifying "you are who you say you are" (typically email + password, or OAuth via Google/GitHub) |
| "the app" | Likely your Next.js frontend + API routes |

**My planned approach:**
1. Add login/signup pages with forms
2. Create API routes for auth (`/api/auth/login`, `/api/auth/register`)
3. Store user sessions (need to decide: JWT tokens vs server sessions)
4. Protect routes that require login

**Files I'd touch:**
- `pages/login.tsx` - new login page
- `pages/signup.tsx` - new signup page
- `pages/api/auth/[...].ts` - auth API routes
- `lib/auth.ts` - auth utility functions
- `middleware.ts` - route protection

**Assumptions I'm making:**
- Email/password auth (not OAuth/social login)
- Users table doesn't exist yet
- You want both login and signup

**Confidence: 55%** - I have a reasonable picture but some gaps.

Quick clarifications needed:

1. **How should sessions work?**
   - [A] JWT in httpOnly cookie (stateless, simpler)
   - [B] Server sessions in database (more control, can revoke)

2. **What about password reset?**
   - [A] Yes, add forgot password flow
   - [B] Not needed for now

3. **Social login (Google/GitHub)?**
   - [A] Yes, add OAuth
   - [B] Just email/password

Once you answer these, I'll be ready to build.
```

---

### Example 2: Vague Fix Request

**User:** "The checkout is broken, can you fix it?"

**Claude:**
```
=== UNDERSTANDING CHECK ===

**What I heard:** The checkout is broken

**What I think you want:**
Something in the checkout flow isn't working correctly, and you need it fixed.

**In technical terms:**

| Your Words | Technical Meaning |
|------------|-------------------|
| "checkout" | Could mean: payment flow, cart summary, order submission, or confirmation page |
| "broken" | Could mean: error thrown, wrong behavior, visual bug, or data not saving |

**Confidence: 25%** - I need more context before I can plan this well.

Help me understand:

1. **What's the symptom?**
   - Error message? (what does it say?)
   - Wrong behavior? (what happens vs what should happen?)
   - Page won't load?
   - Something else?

2. **Where in checkout?**
   - Cart page
   - Payment form
   - After clicking "Submit Order"
   - Confirmation page

3. **When did it break?**
   - After a recent change? (which one?)
   - Randomly?
   - Only for certain users/products?

4. **Can you reproduce it?**
   - Steps to trigger the bug

If you have an error message or console output, paste it here - that's usually the fastest path to a fix.
```

---

### Example 3: Clear Request (No Confirmation Needed)

**User:** "Change the primary button color in components/Button.tsx from blue-500 to indigo-600"

**Claude:** *(Does not trigger /understand - request is specific)*

"I'll update the button color now."
[Proceeds directly to implementation]

---

## RESPONSE STYLE

- **Conversational, not robotic** - Write like you're explaining to a colleague
- **Teach without condescending** - Assume they're smart but may not know jargon
- **Be concrete** - Use their actual file names and terms when possible
- **Keep it scannable** - Tables and bullets over paragraphs
- **Admit uncertainty** - "I'm guessing you want X, but you might mean Y"

---

## EXPLICIT INVOCATION

Users can also explicitly invoke:

```
/understand add a notification system
/understand [paste complex requirement]
```

When explicitly invoked, always run the full process regardless of apparent clarity.

---

## AFTER CONFIRMATION

Once the user confirms understanding:

1. If using TodoWrite for complex tasks, create the task list
2. Begin implementation
3. Reference back to the confirmed understanding if questions arise during build

---

## RELATED

- `/deep-plan` - Full multi-round planning for complex frontend work
- `EnterPlanMode` - Formal planning with file output and approval flow
