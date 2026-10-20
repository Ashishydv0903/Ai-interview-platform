// Rich question bank spanning technical domains, non-technical exams, business, aptitude, and communication skills.
// Each question includes topic, difficulty, hints, expectedConcepts, and an idealAnswer for model answer comparison.

const QUESTION_BANK = [
  // ==========================================
  // --- FRONTEND DEVELOPER (10+ Questions) ---
  // ==========================================
  {
    id: "fe_01",
    domain: "Frontend",
    role: "Frontend Engineer",
    topic: "React & Virtual DOM",
    difficulty: "Easy",
    question: "Explain the Virtual DOM in React and how reconciliation works when state updates occur.",
    hints: ["Mention shadow copy of DOM, diffing algorithm, and batch updates."],
    expectedConcepts: ["Virtual DOM", "Reconciliation", "Diffing Algorithm", "State", "DOM Manipulation", "Batching"],
    idealAnswer: "The Virtual DOM (VDOM) is an in-memory, lightweight JavaScript representation of the actual DOM. When component state changes, React creates a new VDOM tree and compares it to the previous tree using an O(n) heuristic diffing algorithm (Reconciliation). React computes the minimal set of changes (diffs) and batches updates to the real DOM, avoiding expensive layout reflows and browser repaints."
  },
  {
    id: "fe_02",
    domain: "Frontend",
    role: "Frontend Engineer",
    topic: "JavaScript Async & Event Loop",
    difficulty: "Medium",
    question: "What is the JavaScript Event Loop? Differentiate between Call Stack, Task Queue (Macrotasks), and Microtask Queue.",
    hints: ["Mention Promises vs setTimeout priority."],
    expectedConcepts: ["Event Loop", "Call Stack", "Microtask Queue", "Macrotask Queue", "Promises", "Non-blocking"],
    idealAnswer: "JavaScript is single-threaded. Synchronous code executes immediately on the Call Stack. Asynchronous callbacks are delegated to the browser runtime/Web APIs. Once complete, microtasks (Promise.then, queueMicrotask, MutationObserver) are placed in the Microtask Queue, while macrotasks (setTimeout, setInterval, I/O) go to the Task Queue. After the Call Stack empties, the Event Loop executes ALL pending microtasks before processing the next macrotask."
  },
  {
    id: "fe_03",
    domain: "Frontend",
    role: "Frontend Engineer",
    topic: "Web Performance & Core Vitals",
    difficulty: "Hard",
    question: "How would you optimize a large-scale Web application suffering from slow initial render and high Cumulative Layout Shift (CLS)?",
    hints: ["Think about Code Splitting, Lazy Loading, Asset Preloading, and Web Vitals."],
    expectedConcepts: ["Code Splitting", "Lazy Loading", "CLS", "Core Web Vitals", "Memoization", "Virtualization"],
    idealAnswer: "To fix slow initial render: implement route-level and component-level code splitting using React.lazy and dynamic imports, enable Server-Side Rendering (SSR) or Static Site Generation (SSG), minify bundles with modern tree-shaking, and compress images with WebP/AVIF. To eliminate CLS: reserve explicit width and height aspect ratios for all images and ad containers, preload critical web fonts with font-display: swap, and avoid inserting dynamic banners above existing rendered content."
  },
  {
    id: "fe_04",
    domain: "Frontend",
    role: "Frontend Engineer",
    topic: "React Hooks & Lifecycle",
    difficulty: "Easy",
    question: "Explain the purpose of useEffect, useMemo, and useCallback. When should you use or avoid them?",
    hints: ["Talk about side effects, expensive computations, and function reference stability."],
    expectedConcepts: ["useEffect", "useMemo", "useCallback", "Referential Equality", "Re-render", "Side Effects"],
    idealAnswer: "useEffect manages side effects (API calls, subscriptions, DOM mutations) after render. useMemo caches the result of an expensive calculation between re-renders based on dependencies. useCallback caches a function definition itself to prevent unnecessary child re-renders when passing callbacks to memoized children (React.memo). They should not be overused prematurely for cheap operations, as memoization overhead can outweigh benefits."
  },
  {
    id: "fe_05",
    domain: "Frontend",
    role: "Frontend Engineer",
    topic: "CSS Architecture & Responsive Design",
    difficulty: "Medium",
    question: "Compare CSS Grid and Flexbox. In what scenarios would you choose Grid over Flexbox?",
    hints: ["One-dimensional vs two-dimensional layouts."],
    expectedConcepts: ["Flexbox", "Grid", "One-dimensional", "Two-dimensional", "Responsive", "Alignment"],
    idealAnswer: "Flexbox is designed for 1-dimensional layouts (either row OR column), making it ideal for aligning items inside navbars, lists, and button groups. CSS Grid is 2-dimensional (both rows AND columns simultaneously), making it ideal for overall page scaffolding, complex dashboard widgets, and magazine-style tile arrangements where elements align across both axes."
  },
  {
    id: "fe_06",
    domain: "Frontend",
    role: "Frontend Engineer",
    topic: "State Management & Redux",
    difficulty: "Hard",
    question: "How does global state management differ between React Context and dedicated libraries like Redux Toolkit or Zustand?",
    hints: ["Mention re-render cascading, selectors, and scalability."],
    expectedConcepts: ["Context API", "Redux Toolkit", "Zustand", "Selectors", "Unnecessary Re-renders", "Immutability"],
    idealAnswer: "React Context is suitable for low-velocity global state (themes, authenticated user profile) because any change in Context value forces all consuming components to re-render unless partitioned. Redux Toolkit and Zustand use fine-grained selectors and external subscriptions, allowing components to re-render only when their specific slice of state changes, making them superior for high-frequency or complex enterprise applications."
  },
  {
    id: "fe_07",
    domain: "Frontend",
    role: "Frontend Engineer",
    topic: "JavaScript Closures & Scope",
    difficulty: "Medium",
    question: "What is a closure in JavaScript, and what are practical everyday use cases for closures?",
    hints: ["Lexical scoping, private variables, currying."],
    expectedConcepts: ["Closure", "Lexical Scope", "Encapsulation", "Private Variables", "Functions", "Memory"],
    idealAnswer: "A closure is a function bundled together with references to its surrounding lexical environment. Closures allow an inner function to retain access to outer scope variables even after the outer function has returned. Common use cases include data privacy/encapsulation (creating private counters or factories), function currying, debouncing/throttling event handlers, and maintaining state in custom React hooks."
  },
  {
    id: "fe_08",
    domain: "Frontend",
    role: "Frontend Engineer",
    topic: "Web Security (XSS & CSRF)",
    difficulty: "Hard",
    question: "What is Cross-Site Scripting (XSS), and how do modern frontend frameworks like React protect against it?",
    hints: ["Talk about string escaping, dangerouslySetInnerHTML, and Content Security Policy."],
    expectedConcepts: ["XSS", "Escaping", "Sanitization", "dangerouslySetInnerHTML", "CSP", "Cookies"],
    idealAnswer: "XSS occurs when malicious scripts are injected into trusted websites. React mitigates XSS by automatically escaping all string values embedded in JSX before rendering them to the DOM, rendering code as plain text. Developers must be cautious with dangerouslySetInnerHTML, javascript: URL protocols in hrefs, and should always implement a strict Content Security Policy (CSP) header and sanitize inputs with DOMPurify."
  },

  // =========================================
  // --- BACKEND DEVELOPER (10+ Questions) ---
  // =========================================
  {
    id: "be_01",
    domain: "Backend",
    role: "Backend Engineer",
    topic: "REST vs GraphQL",
    difficulty: "Easy",
    question: "Explain the main differences between RESTful APIs and GraphQL. What problem does GraphQL solve?",
    hints: ["Talk about over-fetching, under-fetching, single endpoint vs multiple endpoints."],
    expectedConcepts: ["REST", "GraphQL", "Over-fetching", "Under-fetching", "Endpoints", "Schema"],
    idealAnswer: "REST relies on standard HTTP methods across multiple resource-oriented endpoints (e.g. GET /users, GET /posts). This often causes over-fetching (retrieving unneeded fields) or under-fetching (requiring multiple round trips). GraphQL exposes a single endpoint where clients request exactly the fields they need using a strongly-typed schema, eliminating over/under-fetching at the cost of server-side caching complexity."
  },
  {
    id: "be_02",
    domain: "Backend",
    role: "Backend Engineer",
    topic: "Database Indexing & Performance",
    difficulty: "Medium",
    question: "How do database indexes (e.g., B-Trees) speed up read queries? What are the trade-offs on WRITE operations?",
    hints: ["Discuss B-Tree structures and index maintenance during INSERT/UPDATE."],
    expectedConcepts: ["Index", "B-Tree", "Write Overhead", "Lookup Speed", "Disk I/O", "Query Plan"],
    idealAnswer: "Database indexes organize column values into balanced search trees (typically B-Trees or B+ Trees) that allow O(log n) lookups instead of full sequential table scans (O(n)). The trade-off is that every INSERT, UPDATE, or DELETE operation requires updating both the raw table and the corresponding index trees, increasing write latency and storage overhead."
  },
  {
    id: "be_03",
    domain: "Backend",
    role: "Backend Engineer",
    topic: "Authentication & JWT Architecture",
    difficulty: "Medium",
    question: "Explain how JSON Web Token (JWT) based authentication works. Where should JWTs be stored in the client, and why?",
    hints: ["Stateless tokens, signature verification, HttpOnly cookies vs localStorage."],
    expectedConcepts: ["JWT", "Signature", "HttpOnly Cookie", "localStorage", "XSS", "Stateless"],
    idealAnswer: "A JWT consists of Header, Payload, and cryptographic Signature. The server issues a signed token upon valid login; subsequent client requests present this token in headers or cookies for stateless verification. Storing tokens in localStorage leaves them vulnerable to XSS attacks. The industry best practice is storing the token in an HttpOnly, Secure, SameSite cookie, which JavaScript cannot read, neutralizing XSS token theft."
  },
  {
    id: "be_04",
    domain: "Backend",
    role: "Backend Engineer",
    topic: "Caching Strategies & Redis",
    difficulty: "Hard",
    question: "Describe Cache-Aside, Write-Through, and Write-Back caching strategies. How do you prevent cache stampedes?",
    hints: ["Discuss read patterns, write latency, TTLs, and mutex locks."],
    expectedConcepts: ["Cache-Aside", "Write-Through", "Write-Back", "TTL", "Cache Stampede", "Redis"],
    idealAnswer: "In Cache-Aside, the application first checks the cache; if a miss occurs, it loads data from DB and writes to cache. In Write-Through, data is written to cache and DB synchronously. In Write-Back, data is written to cache first and asynchronously flushed to DB. Cache stampedes (thundering herd) occur when a popular key expires simultaneously for many concurrent requests; they can be prevented using mutual exclusion locks (mutex), jittered TTLs, or background probabilistic early refreshing."
  },
  {
    id: "be_05",
    domain: "Backend",
    role: "Backend Engineer",
    topic: "Relational vs NoSQL Databases",
    difficulty: "Easy",
    question: "When would you choose a Relational DB (PostgreSQL/MySQL) versus a Document NoSQL DB (MongoDB)?",
    hints: ["ACID transactions, structured vs flexible schemas, joins."],
    expectedConcepts: ["ACID", "Relational", "NoSQL", "MongoDB", "PostgreSQL", "Schema", "Joins"],
    idealAnswer: "Choose Relational (PostgreSQL) when data requires strict relational integrity, complex multi-table joins, and strong ACID transaction guarantees (e.g. banking, commerce orders). Choose Document NoSQL (MongoDB) when data is hierarchical, schemas evolve rapidly, documents are self-contained without heavy join requirements, or when horizontal scaling/sharding is a priority."
  },
  {
    id: "be_06",
    domain: "Backend",
    role: "Backend Engineer",
    topic: "Microservices & Message Queues",
    difficulty: "Hard",
    question: "Why do distributed architectures use message brokers (RabbitMQ/Kafka)? What is the difference between synchronous and asynchronous inter-service communication?",
    hints: ["Decoupling, traffic buffering, event-driven, eventual consistency."],
    expectedConcepts: ["Message Queue", "Kafka", "RabbitMQ", "Decoupling", "Eventual Consistency", "Asynchronous"],
    idealAnswer: "Synchronous communication (REST/gRPC) creates tight coupling and cascading failures: if downstream service B is down, service A fails. Message brokers enable asynchronous, event-driven architectures by decoupling producers and consumers. Messages are queued reliably, buffering traffic spikes, allowing services to process at their own pace, and ensuring high system resilience with eventual consistency."
  },

  // ============================================
  // --- FULL STACK DEVELOPER (8+ Questions) ---
  // ============================================
  {
    id: "fs_01",
    domain: "FullStack",
    role: "Full Stack Engineer",
    topic: "End-to-End System Design",
    difficulty: "Medium",
    question: "Walk through what happens from the moment a user types a URL and presses Enter until a full-stack web application renders.",
    hints: ["DNS lookup, TCP/TLS handshake, HTTP request, server routing, DOM rendering."],
    expectedConcepts: ["DNS", "TCP Handshake", "TLS", "HTTP", "Server", "DOM", "Rendering Engine"],
    idealAnswer: "1. The browser resolves the domain to an IP address via DNS cache/resolvers. 2. A TCP 3-way handshake and TLS negotiation establish an encrypted connection. 3. The browser sends an HTTP GET request. 4. The backend server routes the request, queries the database if needed, and returns an HTML payload. 5. The browser engine parses HTML to build the DOM, parses CSS for CSSOM, constructs the Render Tree, performs layout calculations, and paints pixels."
  },
  {
    id: "fs_02",
    domain: "FullStack",
    role: "Full Stack Engineer",
    topic: "API Design & Error Handling",
    difficulty: "Easy",
    question: "What are best practices for designing clear, predictable REST API response contracts and error payloads?",
    hints: ["HTTP status codes, unified JSON error shape, idempotency."],
    expectedConcepts: ["Status Codes", "Uniform Response", "Error Handling", "Idempotency", "Validation"],
    idealAnswer: "Use standard HTTP status codes (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Error). Maintain a uniform response envelope containing success, data, and error fields. Error payloads should include an intelligible message, error code, and field-level validation details without leaking sensitive internal stack traces."
  },
  {
    id: "fs_03",
    domain: "FullStack",
    role: "Full Stack Engineer",
    topic: "WebSockets vs Polling",
    difficulty: "Medium",
    question: "How do WebSockets differ from HTTP Short Polling and Long Polling for real-time features like chat or live dashboards?",
    hints: ["Full-duplex, persistent connection, HTTP overhead."],
    expectedConcepts: ["WebSockets", "Polling", "Full-duplex", "Latency", "Persistent Connection"],
    idealAnswer: "Short polling sends periodic HTTP requests, generating heavy overhead and latency. Long polling holds the connection open until data is ready, reducing empty responses but still requiring a new connection per message. WebSockets upgrade an HTTP connection into a persistent, bidirectional, full-duplex TCP socket, allowing server and client to push messages instantly with minimal frame overhead."
  },

  // ============================================
  // --- DATA SCIENCE & AI (8+ Questions) ---
  // ============================================
  {
    id: "ds_01",
    domain: "DataScience",
    role: "Data Scientist / AI Engineer",
    topic: "Model Evaluation & Bias-Variance Tradeoff",
    difficulty: "Easy",
    question: "Explain the Bias-Variance tradeoff in machine learning and how it relates to underfitting and overfitting.",
    hints: ["High bias means underfitting, high variance means overfitting."],
    expectedConcepts: ["Bias", "Variance", "Overfitting", "Underfitting", "Generalization", "Regularization"],
    idealAnswer: "Bias represents errors from overly simplistic model assumptions (underfitting, failing to capture underlying patterns). Variance represents sensitivity to random fluctuations/noise in training data (overfitting, high training accuracy but poor generalization). The goal is finding the optimal model complexity that minimizes Total Error = Bias² + Variance + Irreducible Error via regularization and cross-validation."
  },
  {
    id: "ds_02",
    domain: "DataScience",
    role: "Data Scientist / AI Engineer",
    topic: "Classification Metrics",
    difficulty: "Medium",
    question: "When would you prioritize Precision over Recall, and vice versa? Give real-world examples.",
    hints: ["Spam detection vs cancer diagnosis."],
    expectedConcepts: ["Precision", "Recall", "F1 Score", "False Positives", "False Negatives"],
    idealAnswer: "Prioritize Precision (True Positives / All Predicted Positives) when False Positives are costly—e.g. email spam filters (you don't want vital client emails sent to spam). Prioritize Recall (True Positives / All Actual Positives) when False Negatives are dangerous—e.g. medical diagnosis or fraud alerts (missing a malignant tumor or fraudulent transaction has severe consequences)."
  },
  {
    id: "ds_03",
    domain: "DataScience",
    role: "Data Scientist / AI Engineer",
    topic: "NLP & Transformers Architecture",
    difficulty: "Hard",
    question: "Explain the Self-Attention mechanism in Transformer architectures and why it outperforms traditional RNNs/LSTMs.",
    hints: ["Query, Key, Value vectors, parallelization, long-range dependencies."],
    expectedConcepts: ["Self-Attention", "Transformers", "Query Key Value", "Parallelization", "Vanishing Gradient"],
    idealAnswer: "RNNs process tokens sequentially, causing severe bottlenecks and vanishing gradients over long sequences. The Self-Attention mechanism computes Query, Key, and Value matrices for each token simultaneously, calculating attention weights as Softmax((Q*K^T)/sqrt(d_k))*V. This enables full parallelization across GPUs and captures direct relationships between distant words regardless of positional distance."
  },

  // ====================================================
  // --- NON-TECHNICAL: APTITUDE & REASONING (8+ Qs) ---
  // ====================================================
  {
    id: "apt_01",
    domain: "Aptitude & Reasoning",
    role: "Aptitude & Analytical Candidate",
    topic: "Logical Deduction & Syllogisms",
    difficulty: "Easy",
    question: "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies? Explain your logical deduction step-by-step.",
    hints: ["Apply categorical syllogism principles."],
    expectedConcepts: ["Syllogism", "Deductive Reasoning", "Transitive Relation", "Logical Certainty", "Premise"],
    idealAnswer: "Yes, all Bloops are definitely Lazzies. By transitive relation in categorical logic: Set A (Bloops) is a subset of Set B (Razzies), and Set B (Razzies) is a subset of Set C (Lazzies). Therefore, any element in Set A must also be contained within Set C (A ⊆ B ⊆ C implies A ⊆ C)."
  },
  {
    id: "apt_02",
    domain: "Aptitude & Reasoning",
    role: "Aptitude & Analytical Candidate",
    topic: "Speed, Distance & Time",
    difficulty: "Medium",
    question: "A train running at 72 km/h passes a pole in 9 seconds. What is the length of the train in meters? Show your step-by-step calculation.",
    hints: ["Convert km/h to m/s by multiplying by 5/18."],
    expectedConcepts: ["Speed Conversion", "Distance Formula", "20 m/s", "180 Meters", "Time and Distance"],
    idealAnswer: "Step 1: Convert speed from km/h to m/s: 72 * (5/18) = 20 m/s. Step 2: Use Distance = Speed * Time. To pass a stationary pole, the train must cover its entire length. Distance = 20 m/s * 9 seconds = 180 meters. Therefore, the length of the train is 180 meters."
  },
  {
    id: "apt_03",
    domain: "Aptitude & Reasoning",
    role: "Aptitude & Analytical Candidate",
    topic: "Probability & Combinatorics",
    difficulty: "Hard",
    question: "What is the probability of drawing either an Ace or a King from a standard deck of 52 playing cards in a single draw?",
    hints: ["Calculate total favorable outcomes divided by total sample space."],
    expectedConcepts: ["Probability", "Favorable Outcomes", "Sample Space", "8/52", "2/13", "Mutually Exclusive"],
    idealAnswer: "A standard deck has 52 cards. There are 4 Aces and 4 Kings. Since drawing an Ace and drawing a King are mutually exclusive events, total favorable outcomes = 4 + 4 = 8. Probability = Favorable Outcomes / Total Sample Space = 8 / 52. Simplifying by dividing numerator and denominator by 4 yields 2/13 (approx 15.38%)."
  },
  {
    id: "apt_04",
    domain: "Aptitude & Reasoning",
    role: "Aptitude & Analytical Candidate",
    topic: "Work & Time Calculation",
    difficulty: "Medium",
    question: "Person A can finish a job in 12 days, and Person B can finish the same job in 6 days. Working together, how many days will they take to complete the job?",
    hints: ["Add their daily work rates: 1/12 + 1/6."],
    expectedConcepts: ["Work Rate", "LCM", "4 Days", "Combined Efficiency"],
    idealAnswer: "In 1 day, Person A completes 1/12 of the work. Person B completes 1/6 of the work. Together in 1 day: (1/12) + (1/6) = (1/12) + (2/12) = 3/12 = 1/4 of the job. Since they finish 1/4 of the job each day, the entire job will take 1 / (1/4) = 4 days."
  },
  {
    id: "apt_05",
    domain: "Aptitude & Reasoning",
    role: "Aptitude & Analytical Candidate",
    topic: "Percentages & Profit-Loss",
    difficulty: "Easy",
    question: "An item originally priced at $200 is discounted by 20%, and then an additional 10% discount is applied to the sale price. What is the final price?",
    hints: ["Apply successive percentage discounts: $200 * 0.8 * 0.9."],
    expectedConcepts: ["Successive Discounts", "$144", "Percentage Calculation", "Net Price"],
    idealAnswer: "Step 1: First discount is 20% off $200. Discount = $40; new price = $160. Step 2: Second discount is 10% off the new price ($160). Discount = $16; final price = $160 - $16 = $144. (Note: Successive discounts of 20% and 10% equal an overall discount of 28%, not 30%)."
  },

  // ====================================================
  // --- NON-TECHNICAL: BUSINESS & MANAGEMENT (8+ Qs) ---
  // ====================================================
  {
    id: "biz_01",
    domain: "Business & Management",
    role: "Product & Business Specialist",
    topic: "Product Metrics & Unit Economics",
    difficulty: "Easy",
    question: "What are the primary differences between Customer Acquisition Cost (CAC) and Lifetime Value (LTV)? Why is the LTV:CAC ratio crucial?",
    hints: ["Discuss payback period, sustainable margins, and ratio benchmarks."],
    expectedConcepts: ["CAC", "LTV", "Unit Economics", "Payback Period", "Retention", "LTV:CAC Ratio"],
    idealAnswer: "CAC measures the total sales and marketing spend required to acquire a single paying customer. LTV estimates the total net revenue a customer generates throughout their entire relationship. An LTV:CAC ratio of 3:1 is standard for healthy SaaS businesses. Below 1:1 means the company loses money on every acquisition; excessively high ratios (e.g. 7:1) indicate underinvestment in growth."
  },
  {
    id: "biz_02",
    domain: "Business & Management",
    role: "Product & Business Specialist",
    topic: "Strategic Frameworks & SWOT Analysis",
    difficulty: "Medium",
    question: "How would you structure a SWOT Analysis for launching a new product in a competitive market?",
    hints: ["Internal factors vs external factors."],
    expectedConcepts: ["Strengths", "Weaknesses", "Opportunities", "Threats", "Internal", "External", "Actionable"],
    idealAnswer: "Divide the analysis into internal factors (Strengths & Weaknesses) and external factors (Opportunities & Threats). Identify core internal strengths (proprietary tech, brand loyalty) and weaknesses (limited budget, lack of sales reach). Then evaluate external market opportunities (unserved user niches, regulatory shifts) and threats (dominant incumbents, price wars). Conclude with strategic pairings: using strengths to capture opportunities and addressing weaknesses to neutralize threats."
  },
  {
    id: "biz_03",
    domain: "Business & Management",
    role: "Product & Business Specialist",
    topic: "Stakeholder Prioritization (RICE Framework)",
    difficulty: "Hard",
    question: "Explain the RICE prioritization framework and how product managers use it to resolve conflicting feature requests.",
    hints: ["Reach, Impact, Confidence, Effort formula."],
    expectedConcepts: ["Reach", "Impact", "Confidence", "Effort", "Prioritization", "ROI"],
    idealAnswer: "RICE calculates a feature priority score via: Score = (Reach * Impact * Confidence) / Effort. Reach estimates number of users impacted over a timeframe. Impact measures user experience boost (e.g. 0.25 to 3). Confidence reflects certainty in estimates (e.g. 50% to 100%). Effort is measured in person-months. Dividing by Effort highlights high-ROI features and removes subjective bias from product roadmaps."
  },

  // =======================================================
  // --- NON-TECHNICAL: ENGLISH & COMMUNICATION (8+ Qs) ---
  // =======================================================
  {
    id: "eng_01",
    domain: "English Communication",
    role: "Communication Specialist",
    topic: "Professional Conflict & De-escalation",
    difficulty: "Easy",
    question: "How would you professionally communicate with a key stakeholder when a project deadline is unexpectedly delayed?",
    hints: ["Emphasize empathy, proactive notice, root cause, and concrete recovery plan."],
    expectedConcepts: ["Empathy", "Transparency", "Action Plan", "Professional Tone", "De-escalation", "Accountability"],
    idealAnswer: "Communicate early rather than at the deadline. 1. Acknowledge the delay clearly with sincere accountability without passing blame. 2. Explain the root cause concisely. 3. Present a concrete revised timeline and recovery plan detailing current mitigations. 4. Offer options to deliver high-priority core modules first, and invite a brief sync to align on expectations."
  },
  {
    id: "eng_02",
    domain: "English Communication",
    role: "Communication Specialist",
    topic: "Structured Storytelling (STAR Method)",
    difficulty: "Medium",
    question: "Explain the STAR method for behavioral interview responses. Why is the 'Result' component the most vital?",
    hints: ["Situation, Task, Action, Result."],
    expectedConcepts: ["STAR Method", "Situation", "Task", "Action", "Result", "Quantifiable Impact"],
    idealAnswer: "STAR stands for Situation (context), Task (goal/challenge), Action (specific steps you personally executed), and Result (quantifiable outcome). The Result is most crucial because it proves tangible business impact—e.g. 'reduced latency by 35%' or 'saved $50k annually'. Grounding the answer in measurable results transforms a subjective story into proof of competency."
  },

  // ====================================================
  // --- NON-TECHNICAL: FINANCE & ACCOUNTING (6+ Qs) ---
  // ====================================================
  {
    id: "fin_01",
    domain: "Finance & Accounting",
    role: "Finance Analyst",
    topic: "Three Financial Statements Integration",
    difficulty: "Medium",
    question: "Explain how the Income Statement, Balance Sheet, and Cash Flow Statement link together.",
    hints: ["Net income flows into Retained Earnings and Cash Flow operating activities."],
    expectedConcepts: ["Net Income", "Cash Flow", "Balance Sheet", "Retained Earnings", "Working Capital"],
    idealAnswer: "Net Income from the bottom of the Income Statement flows into: 1. The top line of Cash Flow from Operations (adjusted for non-cash expenses like depreciation), and 2. Retained Earnings on the Balance Sheet (after dividends). The ending Cash balance on the Cash Flow Statement becomes the Cash line item under Current Assets on the Balance Sheet."
  },
  {
    id: "fin_02",
    domain: "Finance & Accounting",
    role: "Finance Analyst",
    topic: "Working Capital Management",
    difficulty: "Easy",
    question: "What is Net Working Capital, and why does negative working capital not always indicate financial distress?",
    hints: ["Current Assets minus Current Liabilities; business model efficiency."],
    expectedConcepts: ["Working Capital", "Current Assets", "Current Liabilities", "Cash Conversion Cycle", "Operating Efficiency"],
    idealAnswer: "Net Working Capital = Current Assets - Current Liabilities. It measures short-term liquidity. While negative working capital often indicates liquidity stress, efficient inventory models (like Amazon, Dell, or grocery chains) operate with negative working capital beneficially: they collect cash from customers immediately but pay suppliers on 60-day terms, generating free operating float."
  }
];

module.exports = { QUESTION_BANK };
