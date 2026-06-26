# Complete Peer Review Report
**Reviewed By:** Prabhat Singh Rajput
**Date:** 10 April 2026
**Total Files Reviewed:** 3
**Total Issues Found:** 41

---

## Table of Contents

1. [CustomerRequest.java](#1-customerrequestjava) — 15 Issues
2. [PaymentGatewayService.java](#2-paymentgatewayservicejava) — 14 Issues
3. [InventoryAlertService.java](#3-inventoryalertservicejava) — 12 Issues
4. [Overall Summary](#4-overall-summary)

---

# 1. CustomerRequest.java
**Package:** com.jpmc.payments  
**Total Issues:** 15

---

### Issue 1 — Thread Safety: `issued++` is Not Atomic
**Line:** 18, 48
**Severity:** CRITICAL

**Problem:**
`volatile` only guarantees visibility across threads but does NOT make the `++` operation atomic.
`issued++` is a read-modify-write operation — in a multi-threaded environment, two threads can read the same value simultaneously, both increment, and write back the same result, causing a lost update (race condition).

**Problematic Code (Line 18):**
```
static protected volatile int issued = 0;
```
**And Line 48:**
```
issued++;
```

**Fix:**
```java
import java.util.concurrent.atomic.AtomicInteger;
static protected AtomicInteger issued = new AtomicInteger(0);
// Then use:
issued.incrementAndGet();
```

---

### Issue 2 — Thread Safety: `ArrayList` is Not Thread-Safe
**Line:** 17
**Severity:** CRITICAL

**Problem:**
`ArrayList` is not synchronized. Concurrent additions or iterations from multiple threads can cause `ConcurrentModificationException` or data corruption.

**Problematic Code (Line 17):**
```
static private ArrayList<CustomerRequest> allRequests = new ArrayList<>();
```

**Fix:**
```java
static private List<CustomerRequest> allRequests = Collections.synchronizedList(new ArrayList<>());
// OR use:
static private List<CustomerRequest> allRequests = new CopyOnWriteArrayList<>();
```

---

### Issue 3 — Invalid Requests Still Added to List and Counted
**Lines:** 47–49
**Severity:** HIGH

**Problem:**
`validate()` is called and result stored in `is_valid`, but regardless of the result, `issued` is incremented and the request is added to `allRequests`. This means invalid/corrupt requests pollute the list and inflate the counter.

**Problematic Code (Lines 47–49):**
```
this.is_valid = validate();
issued++;
allRequests.add(this);
```

**Fix:**
```java
this.is_valid = validate();
if (this.is_valid) {
    issued++;
    allRequests.add(this);
}
```

---

### Issue 4 — `urgentOnly` Filter Applied AFTER HTTP Call (Logic Bug)
**Lines:** 86–88
**Severity:** HIGH

**Problem:**
The `urgentOnly` check is placed AFTER an expensive HTTP API call is already made. Non-urgent requests are fetched and then skipped — wasting network calls and time. The filter must be applied BEFORE the API call.

**Problematic Code (Lines 86–88):**
```
if (urgentOnly && !req.expedited) {
    continue;
}
```
(This appears after the HTTP connection on Lines 80–84)

**Fix:** Move the filter check BEFORE the HTTP call:
```java
for (CustomerRequest req : allRequests) {
    if (urgentOnly && !req.expedited) {
        continue;  // skip BEFORE making the HTTP call
    }
    // ... now make API call
}
```

---

### Issue 5 — `totalValue()` Makes N API Calls in a Loop (Performance Issue)
**Lines:** 77–93
**Severity:** HIGH

**Problem:**
For every request in `allRequests`, a separate HTTP call is made to fetch the product price. This results in N network calls for N requests — extremely inefficient and slow, especially under load.

**Problematic Code (Lines 77–81):**
```
for (CustomerRequest req : allRequests) {
    HttpURLConnection conn = (HttpURLConnection)
        new java.net.URL(url + "/api/v1/products/" + req.prod_key).openConnection();
```

**Fix:**
Collect all unique `prod_key` values first, fetch prices in batch (or cache them), then calculate values:
```java
Map<String, Double> priceCache = new HashMap<>();
for (CustomerRequest req : allRequests) {
    priceCache.computeIfAbsent(req.prod_key, key -> fetchPrice(key));
}
```

---

### Issue 6 — HTTP Connection Never Closed (Resource Leak)
**Lines:** 63–69 and 80–84
**Severity:** HIGH

**Problem:**
`HttpURLConnection` is opened but `conn.disconnect()` is never called in either `submitRequest()` or `totalValue()`. This causes connection/resource leaks over time.

**Problematic Code (Lines 63–69):**
```
HttpURLConnection conn = (HttpURLConnection)
    new java.net.URL(endpoint).openConnection();
conn.setRequestMethod("POST");
conn.setDoOutput(true);
int responseCode = conn.getResponseCode();
return responseCode >= 200 && responseCode < 300;
// conn never closed!
```

**Fix:**
```java
HttpURLConnection conn = null;
try {
    conn = (HttpURLConnection) new java.net.URL(endpoint).openConnection();
    // ... use connection
} finally {
    if (conn != null) conn.disconnect();
}
```

---

### Issue 7 — `submitRequest()` Sends Empty POST Body
**Lines:** 65–66
**Severity:** HIGH

**Problem:**
`conn.setDoOutput(true)` signals that data will be written to the connection, but no data is ever actually written to the output stream. The POST body is completely empty. Also, no `Content-Type` header is set.

**Problematic Code (Lines 65–66):**
```
conn.setRequestMethod("POST");
conn.setDoOutput(true);
// Missing: writing to conn.getOutputStream()
```

**Fix:**
```java
conn.setRequestMethod("POST");
conn.setDoOutput(true);
conn.setRequestProperty("Content-Type", "application/json");
String body = buildRequestBody();
try (OutputStream os = conn.getOutputStream()) {
    os.write(body.getBytes(StandardCharsets.UTF_8));
}
```

---

### Issue 8 — No Null Check for `environment` Parameter
**Lines:** 60–61
**Severity:** HIGH

**Problem:**
`API_SERVERS.get(environment)` returns `null` if the environment key is not found in the map. The next line immediately uses `url` to build the endpoint — causing a `NullPointerException`.

**Problematic Code (Lines 60–61):**
```
String url = API_SERVERS.get(environment);
String endpoint = url + "/api/v1/requests/" + cust_key;  // NullPointerException if url=null
```

**Fix:**
```java
String url = API_SERVERS.get(environment);
if (url == null) {
    throw new IllegalArgumentException("Unknown environment: " + environment);
}
```

---

### Issue 9 — `API_SERVERS` is Public and Mutable
**Lines:** 10–15
**Severity:** MEDIUM

**Problem:**
The `API_SERVERS` map is `public static` and backed by a `HashMap`, meaning any external class can modify it (e.g., override PROD URL). This is a serious security and stability concern.

**Problematic Code (Lines 10–15):**
```
public static Map<String, String> API_SERVERS = new HashMap<>()
{{
    put("LOCAL", "http://127.0.0.1");
    ...
}};
```

**Fix:**
```java
private static final Map<String, String> API_SERVERS = Map.of(
    "LOCAL", "http://127.0.0.1",
    "DEV",   "http://cust-api-dev.internal.myorg.com",
    "PROD",  "http://cust-api.internal.myorg.com"
);
```

---

### Issue 10 — `req_key` Not Guaranteed Unique
**Line:** 46
**Severity:** MEDIUM

**Problem:**
`req_key` is built using `System.currentTimeMillis()`. Two requests created within the same millisecond for the same product and customer will get identical `req_key` values — causing key collision.

**Problematic Code (Line 46):**
```
this.req_key = prod_key + "-" + cust_key + "-" + created;
```

**Fix:**
```java
import java.util.UUID;
this.req_key = UUID.randomUUID().toString();
```

---

### Issue 11 — `totalValue()` Hardcodes "PROD" Environment
**Line:** 79
**Severity:** MEDIUM

**Problem:**
The environment is hardcoded as `"PROD"` inside `totalValue()`. This makes the method untestable in non-production environments (DEV, LOCAL, QAT) and violates the open/closed principle.

**Problematic Code (Line 79):**
```
String url = API_SERVERS.get("PROD");
```

**Fix:**
```java
public static double totalValue(boolean urgentOnly, String environment) {
    String url = API_SERVERS.get(environment);
    ...
}
```

---

### Issue 12 — `price` is Always 0.0 (Incomplete Implementation)
**Lines:** 83–84
**Severity:** MEDIUM

**Problem:**
`price` is declared as `0.0` with a comment saying it's a placeholder. The XML/JSON parsing from the API response is never implemented, meaning `totalValue()` will always return `0.0` regardless of actual data.

**Problematic Code (Lines 83–84):**
```
double price = 0.0; // placeholder - parsed from response
double value = price * req.qty;  // always 0!
```

**Fix:**
Implement the actual response parsing logic using the already-imported `DocumentBuilderFactory` and `Document` (or use a JSON parser if response is JSON).

---

### Issue 13 — Unused Imports
**Lines:** 5–6
**Severity:** LOW

**Problem:**
`DocumentBuilderFactory` and `Document` are imported but never used anywhere in the code. This adds unnecessary clutter and confusion.

**Problematic Code (Lines 5–6):**
```
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
```

**Fix:** Remove both unused imports, or implement the XML parsing logic they were intended for (see Issue 12).

---

### Issue 14 — Non-Standard Field Naming (Java Convention Violation)
**Lines:** 20–21, 25–26
**Severity:** LOW

**Problem:**
Java naming conventions require `camelCase` for field names. Using `snake_case` (underscores) is a violation of standard Java coding style and reduces readability.

**Problematic Code (Lines 20–21, 25–26):**
```
private String prod_key;
private String cust_key;
private String req_key;
private boolean is_valid;
```

**Fix:**
```java
private String prodKey;
private String custKey;
private String reqKey;
private boolean isValid;
```

---

### Issue 15 — Static List Grows Forever (Memory Leak)
**Line:** 17
**Severity:** MEDIUM

**Problem:**
`allRequests` is a static `ArrayList` with no mechanism to remove old or processed entries. It accumulates every request created for the entire lifetime of the application — this is a memory leak that worsens over time in long-running applications.

**Problematic Code (Line 17):**
```
static private ArrayList<CustomerRequest> allRequests = new ArrayList<>();
```

**Fix:**
```java
public static void removeRequest(CustomerRequest req) {
    allRequests.remove(req);
}
// OR use WeakReferences so GC can reclaim objects when needed
```

---

### CustomerRequest.java — Summary Table

| # | Line(s) | Issue | Severity |
|---|---------|-------|----------|
| 1 | 18, 48 | `issued++` not atomic (race condition) | CRITICAL |
| 2 | 17 | `ArrayList` not thread-safe | CRITICAL |
| 3 | 47–49 | Invalid requests added to list and counted | HIGH |
| 4 | 86–88 | `urgentOnly` filter after API call | HIGH |
| 5 | 77–81 | N API calls in loop — performance issue | HIGH |
| 6 | 63–69, 80–84 | HTTP connection never closed — resource leak | HIGH |
| 7 | 65–66 | Empty POST body sent | HIGH |
| 8 | 60–61 | No null check for environment — NullPointerException | HIGH |
| 9 | 10–15 | `API_SERVERS` public and mutable | MEDIUM |
| 10 | 46 | `req_key` not unique | MEDIUM |
| 11 | 79 | `totalValue()` hardcodes "PROD" | MEDIUM |
| 12 | 83–84 | `price` always 0.0 — incomplete implementation | MEDIUM |
| 13 | 5–6 | Unused imports | LOW |
| 14 | 20–21, 25–26 | snake_case field names — Java convention violation | LOW |
| 15 | 17 | Static list grows forever — memory leak | MEDIUM |

---
---

# 2. PaymentGatewayService.java
**Package:** com.jpmc.payments.gateway
**Total Issues:** 14

---

### Issue 1 — CRITICAL SECURITY: Hardcoded Encryption Key in Source Code
**Line:** 12
**Severity:** CRITICAL

**Problem:**
The encryption key (which appears to be a live production API/secret key) is hardcoded directly in the source code. Anyone with access to the repository, build artifacts, or decompiled JAR can see this key. This is an immediate security breach.

**Problematic Code (Line 12):**
```
private String encryptionKey = "REDACTED_USE_ENV_VAR_OR_SECRETS_MANAGER";
```

**Fix:**
```java
// Use environment variable or secrets manager (AWS Secrets Manager / Vault)
@Value("${payment.encryption.key}")
private String encryptionKey;
```

---

### Issue 2 — CRITICAL SECURITY / PCI DSS VIOLATION: Logging Card Number and CVV
**Lines:** 17–18
**Severity:** CRITICAL

**Problem:**
Card number and CVV are being printed in plain text to the application log. This is a direct PCI DSS (Payment Card Industry Data Security Standard) violation. CVV must NEVER be logged, stored, or transmitted after the authorization step. Exposing card numbers in logs is also strictly prohibited.

**Problematic Code (Lines 17–18):**
```
log.info("Processing payment: card=" + cardNumber + " cvv=" + cvv
        + " amount=" + amount + " currency=" + currency);
```

**Fix:**
```java
// Mask card number, NEVER log CVV
log.info("Processing payment: card=****" + cardNumber.substring(cardNumber.length() - 4)
        + " amount=" + amount + " currency=" + currency);
// CVV must never appear in logs under any circumstances
```

---

### Issue 3 — CRITICAL SECURITY: Hardcoded Database Credentials
**Lines:** 27–29
**Severity:** CRITICAL

**Problem:**
Database URL, username, and password are hardcoded in plain text in the source code. This exposes production credentials to anyone who can read the code, making the database vulnerable to unauthorized access.

**Problematic Code (Lines 27–29):**
```
conn = DriverManager.getConnection(
    "jdbc:mysql://payments-db:3306/transactions",
    "payment_svc", "Paym3nt$2024!");
```

**Fix:**
```java
@Autowired
private DataSource dataSource;

conn = dataSource.getConnection();
```

---

### Issue 4 — CRITICAL SECURITY / PCI DSS: Storing CVV in Database
**Lines:** 30–32
**Severity:** CRITICAL

**Problem:**
PCI DSS (Requirement 3.2) explicitly prohibits storing CVV/CVC/CAV2 data after authorization — even in encrypted form. The code inserts CVV directly into the `payment_tokens` table, which is a severe compliance violation that can result in loss of payment processing ability and heavy fines.

**Problematic Code (Lines 30–32):**
```
String tokenQuery = "INSERT INTO payment_tokens (card_number, cvv, expiry)
    VALUES ('" + cardNumber + "', '" + cvv + "', '" + expiry + "')";
```

**Fix:**
```java
// Remove CVV from storage entirely — never persist CVV
String tokenQuery = "INSERT INTO payment_tokens (card_token, expiry) VALUES (?, ?)";
```

---

### Issue 5 — CRITICAL SECURITY: SQL Injection in All Queries
**Lines:** 30–36, 51–52
**Severity:** CRITICAL

**Problem:**
All SQL queries are built by directly concatenating user-supplied input (cardNumber, cvv, expiry, amount, currency, transactionId). This is a classic SQL Injection vulnerability — an attacker can input values like `' OR '1'='1` to manipulate or destroy the database.

**Problematic Code (Lines 30–32):**
```
String tokenQuery = "INSERT INTO payment_tokens (card_number, cvv, expiry)
    VALUES ('" + cardNumber + "', '" + cvv + "', '" + expiry + "')";
```

**Fix — Use PreparedStatement for ALL queries:**
```java
String tokenQuery = "INSERT INTO payment_tokens (card_token, expiry) VALUES (?, ?)";
PreparedStatement pstmt = conn.prepareStatement(tokenQuery);
pstmt.setString(1, tokenizeCard(cardNumber));
pstmt.setString(2, expiry);
pstmt.executeUpdate();
```

---

### Issue 6 — No Transaction Management (Data Integrity Risk)
**Lines:** 30–37
**Severity:** HIGH

**Problem:**
Two INSERT statements are executed separately with no transaction wrapping. If the first INSERT (payment_tokens) succeeds but the second INSERT (charges) fails, you end up with an orphaned token record and no charge record. The database is left in an inconsistent state.

**Problematic Code (Lines 30–37):**
```
stmt.executeUpdate(tokenQuery);   // Insert 1 — committed immediately
stmt.executeUpdate(chargeQuery);  // Insert 2 — if this fails, Insert 1 is already committed
```

**Fix:**
```java
conn.setAutoCommit(false);
try {
    // ... execute both statements
    conn.commit();
} catch (Exception e) {
    conn.rollback();
    throw e;
}
```

---

### Issue 7 — Database Connection Never Closed (Resource Leak)
**Lines:** 22, 26–29
**Severity:** HIGH

**Problem:**
`conn` is declared outside the try block but is never closed in a `finally` block or try-with-resources. If an exception occurs, the connection leaks, eventually exhausting the database connection pool and crashing the service.

**Problematic Code (Lines 22, 26–29):**
```
Connection conn = null;
try {
    conn = DriverManager.getConnection(...);
} catch (Exception e) {
    // conn never closed here either!
}
// no finally block to close conn
```

**Fix:**
```java
try (Connection conn = dataSource.getConnection()) {
    // conn is auto-closed when block exits
}
```

---

### Issue 8 — `processRefund()` Connection Also Never Closed
**Lines:** 55–59
**Severity:** HIGH

**Problem:**
Same resource leak issue in `processRefund()`. A new connection is opened inside the try block but never closed. Also repeats the hardcoded credentials problem (Issue 3).

**Problematic Code (Lines 55–57):**
```
Connection c = DriverManager.getConnection(
    "jdbc:mysql://payments-db:3306/transactions",
    "payment_svc", "Paym3nt$2024!");
c.createStatement().executeUpdate(query);
// c is never closed
```

**Fix:**
```java
try (Connection c = dataSource.getConnection();
     PreparedStatement pstmt = c.prepareStatement(query)) {
    // auto-closed
}
```

---

### Issue 9 — `token_id` Exposes Actual Card Data
**Line:** 40
**Severity:** HIGH

**Problem:**
`cardNumber.substring(12)` returns the last 4 digits of the card number and returns it as `token_id`. This is NOT a token — it's actual card data. A real tokenization system should generate an opaque random ID that has no mathematical relationship to the original card number.

**Problematic Code (Line 40):**
```
result.put("token_id", cardNumber.substring(12));  // Returns last 4 digits - not a real token!
```

**Fix:**
```java
String token = UUID.randomUUID().toString();  // Real opaque token
result.put("token_id", token);
```

---

### Issue 10 — Using `double` for Monetary Values
**Line:** 14 (method signature), 35, 51
**Severity:** HIGH

**Problem:**
`double` uses floating-point arithmetic which cannot precisely represent many decimal values (e.g., `0.1 + 0.2 = 0.30000000000000004`). For financial calculations, this can result in incorrect amounts — overcharging or undercharging customers.

**Problematic Code (Line 14):**
```
public Map<String, Object> processPayment(..., double amount, ...)
```

**Fix:**
```java
public Map<String, Object> processPayment(..., BigDecimal amount, ...)
// Use BigDecimal for all monetary operations
```

---

### Issue 11 — Deprecated `Class.forName()` for JDBC Driver
**Line:** 25
**Severity:** MEDIUM

**Problem:**
`Class.forName("com.mysql.cj.jdbc.Driver")` is a legacy approach from JDBC 3.0. Since JDBC 4.0 (Java 6+), drivers are automatically discovered via the Service Provider Interface (SPI). This call is unnecessary and adds confusion.

**Problematic Code (Line 25):**
```
Class.forName("com.mysql.cj.jdbc.Driver");
```

**Fix:** Remove this line entirely. Spring Boot's auto-configuration handles driver registration automatically.

---

### Issue 12 — Inconsistent Error Handling Between Methods
**Lines:** 42–44 vs 62
**Severity:** MEDIUM

**Problem:**
`processPayment()` uses the proper `Logger` to log errors (Line 43), but `processRefund()` uses `System.out.println` (Line 62). This is inconsistent and means refund errors won't appear in application logs or monitoring systems.

**Problematic Code (Line 62):**
```
System.out.println("Refund failed: " + e);
```

**Fix:**
```java
log.severe("Refund failed for transactionId=" + transactionId + ": " + e.getMessage());
```

---

### Issue 13 — `processRefund()` Has No Return Value or Status
**Lines:** 50–64
**Severity:** MEDIUM

**Problem:**
`processRefund()` returns `void`, so the caller has no way to know whether the refund succeeded or failed. All failures are silently swallowed. This means the system could tell a customer their refund was processed when it actually failed.

**Problematic Code (Line 50):**
```
public void processRefund(String transactionId, double amount) {
```

**Fix:**
```java
public Map<String, Object> processRefund(String transactionId, BigDecimal amount) {
    Map<String, Object> result = new HashMap<>();
    // ... set result.put("status", "SUCCESS") or "FAILED"
    return result;
}
```

---

### Issue 14 — Logger Not Declared as `static final`
**Line:** 11
**Severity:** LOW

**Problem:**
The Logger is declared as an instance variable (`Logger log = ...`) instead of a `static final` class-level constant. This creates a new Logger reference per instance. Java best practice is to use `private static final Logger`.

**Problematic Code (Line 11):**
```
Logger log = Logger.getLogger("PaymentGateway");
```

**Fix:**
```java
private static final Logger log = Logger.getLogger(PaymentGatewayService.class.getName());
```

---

### PaymentGatewayService.java — Summary Table

| # | Line(s) | Issue | Severity |
|---|---------|-------|----------|
| 1 | 12 | Hardcoded encryption/API key in source | CRITICAL |
| 2 | 17–18 | Logging card number and CVV — PCI DSS violation | CRITICAL |
| 3 | 27–29 | Hardcoded database credentials | CRITICAL |
| 4 | 30–32 | Storing CVV in database — PCI DSS violation | CRITICAL |
| 5 | 30–36, 51–52 | SQL Injection in all queries | CRITICAL |
| 6 | 30–37 | No transaction management — data inconsistency risk | HIGH |
| 7 | 22, 26–29 | DB connection never closed — resource leak | HIGH |
| 8 | 55–59 | processRefund() connection never closed | HIGH |
| 9 | 40 | `token_id` exposes actual card digits — not a real token | HIGH |
| 10 | 14, 35, 51 | Using `double` for monetary values | HIGH |
| 11 | 25 | Deprecated `Class.forName()` for JDBC driver | MEDIUM |
| 12 | 43 vs 62 | Inconsistent error handling (Logger vs System.out) | MEDIUM |
| 13 | 50 | `processRefund()` returns void — no status reported | MEDIUM |
| 14 | 11 | Logger not declared as `static final` | LOW |

---
---

# 3. InventoryAlertService.java
**Package:** com.jpmc.inventory
**Total Issues:** 12

---

### Issue 1 — CRITICAL SECURITY: Hardcoded Slack Webhook URL
**Line:** 14
**Severity:** CRITICAL

**Problem:**
The Slack webhook URL is hardcoded directly in source code. This is a live credential — anyone with access to the repository can use it to send arbitrary messages to your Slack channel or abuse the webhook. Webhook URLs must never be committed to source control.

**Problematic Code (Line 14):**
```
private String SLACK_WEBHOOK = "https://hooks.slack.com/services/T024/B037/xYzAbCdEfGh";
```

**Fix:**
```java
@Value("${slack.webhook.url}")
private String slackWebhook;
```
And in `application.properties` (loaded from environment/secrets manager):
```
slack.webhook.url=${SLACK_WEBHOOK_URL}
```

---

### Issue 2 — Non-Constant Fields Named as Constants (Naming Convention Violation)
**Lines:** 12–14
**Severity:** MEDIUM

**Problem:**
`ALERT_THRESHOLD`, `API_URL`, and `SLACK_WEBHOOK` use UPPER_SNAKE_CASE which is the Java convention for `static final` constants. However, these fields are neither `static` nor `final` — they are mutable instance variables. This misleads developers into thinking these values cannot change.

**Problematic Code (Lines 12–14):**
```
private int ALERT_THRESHOLD = 10;
private String API_URL = "http://inventory-svc:8080/api/stock";
private String SLACK_WEBHOOK = "https://hooks.slack.com/...";
```

**Fix — Either make them true constants:**
```java
private static final int ALERT_THRESHOLD = 10;
```
**Or rename them to camelCase if they need to be configurable:**
```java
@Value("${inventory.alert.threshold:10}")
private int alertThreshold;
```

---

### Issue 3 — Insecure HTTP Instead of HTTPS for Internal API
**Line:** 13
**Severity:** HIGH

**Problem:**
`API_URL` uses `http://` (unencrypted) to communicate with the inventory service. In a financial/enterprise environment, all internal service communication should use HTTPS/TLS to prevent man-in-the-middle attacks and eavesdropping, even within an internal network.

**Problematic Code (Line 13):**
```
private String API_URL = "http://inventory-svc:8080/api/stock";
```

**Fix:**
```java
private String API_URL = "https://inventory-svc:8443/api/stock";
```

---

### Issue 4 — Manual JSON Parsing is Extremely Fragile
**Lines:** 29–34
**Severity:** HIGH

**Problem:**
The code manually parses JSON by removing brackets and braces with `replace()` and splitting on commas. This is extremely brittle and will break for:
- Values containing commas (e.g., `"New York, USA"`)
- Nested JSON objects
- Arrays within the response
- Different key ordering
- Extra whitespace
- Any valid JSON the parser doesn't anticipate

**Problematic Code (Lines 29–34):**
```
String[] items = body.replace("[", "").replace("]", "")
    .replace("{", "").replace("}", "").split(",");

String product = items[i].split(":")[1].replace(""", "").trim();
int quantity = Integer.parseInt(
    items[i + 1].split(":")[1].replace(""", "").trim());
```

**Fix — Use a proper JSON library:**
```java
ObjectMapper mapper = new ObjectMapper();
List<Map<String, Object>> items = mapper.readValue(body,
    new TypeReference<List<Map<String, Object>>>(){});

for (Map<String, Object> item : items) {
    String product = (String) item.get("product");
    int quantity = (Integer) item.get("quantity");
    if (quantity < alertThreshold) {
        sendSlackAlert(product, quantity);
    }
}
```

---

### Issue 5 — Silent Exception Swallowing (Both Catch Blocks are Empty)
**Lines:** 38–39, 52–53
**Severity:** HIGH

**Problem:**
Both `catch` blocks are completely empty with only a comment. If the inventory API is down, if the response cannot be parsed, or if Slack fails, the error is completely hidden — no logging, no alerting, no monitoring. This makes debugging impossible and means failures go undetected silently.

**Problematic Code (Lines 38–39):**
```
} catch (Exception e) {
    // will retry next cycle
}
```

**And Lines 52–53:**
```
} catch (Exception e) {
    // Slack is down, nothing we can do
}
```

**Fix:**
```java
} catch (Exception e) {
    log.error("Failed to check inventory levels: " + e.getMessage(), e);
}
```
```java
} catch (Exception e) {
    log.error("Failed to send Slack alert for product=" + product + ": " + e.getMessage(), e);
}
```

---

### Issue 6 — No HTTP Response Status Code Check
**Lines:** 23–27
**Severity:** HIGH

**Problem:**
The code calls the inventory API and directly processes the response body without ever checking if the HTTP status code indicates success (2xx). If the server returns a 404, 500, or 503, the body might contain an error message which the parser will attempt to process and either silently fail or throw an exception.

**Problematic Code (Lines 23–27):**
```
HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());

// Response status is never checked!
String body = response.body();
```

**Fix:**
```java
if (response.statusCode() != 200) {
    log.warning("Inventory API returned status: " + response.statusCode());
    return;
}
String body = response.body();
```

---

### Issue 7 — Unlimited Slack Alerts — No Deduplication or Throttling
**Lines:** 35–37
**Severity:** HIGH

**Problem:**
Every time the scheduler runs (every 5 minutes), a Slack alert is sent for EVERY low-stock item. If a product stays low-stock for hours, the Slack channel will be flooded with hundreds of duplicate alerts. There is no tracking of which alerts have already been sent.

**Problematic Code (Lines 35–37):**
```
if (quantity < ALERT_THRESHOLD) {
    sendSlackAlert(product, quantity);  // Sent every 5 minutes forever!
}
```

**Fix — Track already-alerted products:**
```java
private final Set<String> alertedProducts = Collections.synchronizedSet(new HashSet<>());

if (quantity < alertThreshold && !alertedProducts.contains(product)) {
    sendSlackAlert(product, quantity);
    alertedProducts.add(product);
} else if (quantity >= alertThreshold) {
    alertedProducts.remove(product); // Reset when stock recovers
}
```

---

### Issue 8 — ArrayIndexOutOfBoundsException Risk
**Line:** 33
**Severity:** HIGH

**Problem:**
`items[i + 1]` is accessed assuming items always come in pairs. If the parsed array has an odd number of elements (malformed response, trailing comma, etc.), `items[i + 1]` will throw `ArrayIndexOutOfBoundsException`. Since the catch block is empty (Issue 5), this failure will be completely silent.

**Problematic Code (Line 33):**
```
int quantity = Integer.parseInt(
    items[i + 1].split(":")[1].replace(""", "").trim());
```

**Fix:** Use a proper JSON parser (see Issue 4 fix) which eliminates this risk entirely.

---

### Issue 9 — JSON Payload Built by String Concatenation (Injection Risk)
**Lines:** 44–45
**Severity:** MEDIUM

**Problem:**
The Slack message payload is built by string concatenation. If `product` contains double quotes, backslashes, or special JSON characters, the resulting JSON will be malformed and the Slack API will reject it.

**Problematic Code (Lines 44–45):**
```
String payload = "{"text": "LOW STOCK: " + product
    + " has only " + quantity + " units remaining"}";
```

**Fix — Use ObjectMapper to build JSON safely:**
```java
Map<String, String> payloadMap = new HashMap<>();
payloadMap.put("text", "LOW STOCK: " + product + " has only " + quantity + " units remaining");
String payload = new ObjectMapper().writeValueAsString(payloadMap);
```

---

### Issue 10 — No Null or Empty Check on Response Body
**Line:** 28
**Severity:** MEDIUM

**Problem:**
`response.body()` could return `null` or an empty string. Calling `.replace()` on a null body throws `NullPointerException`. Neither case is handled.

**Problematic Code (Line 28):**
```
String body = response.body();
String[] items = body.replace("[", "")...  // NullPointerException if body=null
```

**Fix:**
```java
String body = response.body();
if (body == null || body.isBlank()) {
    log.warning("Empty response from inventory API");
    return;
}
```

---

### Issue 11 — `HttpClient` Field Not Declared as `final`
**Line:** 16
**Severity:** LOW

**Problem:**
`client` is initialized once and never reassigned, but it is not declared `final`. Making it `final` communicates intent clearly, prevents accidental reassignment, and is a Java best practice.

**Problematic Code (Line 16):**
```
private HttpClient client = HttpClient.newHttpClient();
```

**Fix:**
```java
private final HttpClient client = HttpClient.newHttpClient();
```

---

### Issue 12 — No Logger Defined — Zero Observability
**Entire Class**
**Severity:** HIGH

**Problem:**
The entire class has no logger defined. Combined with empty catch blocks (Issue 5), there is absolutely no visibility into what this service is doing — no record of when inventory checks ran, how many items were checked, which alerts were sent, or any errors. In production, this service is essentially a black box.

**Fix — Add a logger:**
```java
private static final Logger log = Logger.getLogger(InventoryAlertService.class.getName());

log.info("Inventory check started.");
log.warning("Low stock detected: " + product + " = " + quantity + " units");
```

---

### InventoryAlertService.java — Summary Table

| # | Line(s) | Issue | Severity |
|---|---------|-------|----------|
| 1 | 14 | Hardcoded Slack webhook URL — live credential in source | CRITICAL |
| 2 | 12–14 | Non-constant fields named as constants — misleading | MEDIUM |
| 3 | 13 | HTTP instead of HTTPS for internal API | HIGH |
| 4 | 29–34 | Manual JSON parsing — extremely fragile | HIGH |
| 5 | 38–39, 52–53 | Both catch blocks empty — silent failure | HIGH |
| 6 | 23–27 | HTTP response status never checked | HIGH |
| 7 | 35–37 | Unlimited Slack alerts — no deduplication | HIGH |
| 8 | 33 | ArrayIndexOutOfBoundsException risk | HIGH |
| 9 | 44–45 | JSON payload built by string concatenation | MEDIUM |
| 10 | 28 | No null/empty check on response body | MEDIUM |
| 11 | 16 | `HttpClient` not declared as `final` | LOW |
| 12 | Entire class | No logger defined — zero observability | HIGH |

---
---

# 4. Overall Summary

## Issues by File

| File | CRITICAL | HIGH | MEDIUM | LOW | TOTAL |
|------|----------|------|--------|-----|-------|
| CustomerRequest.java | 2 | 6 | 5 | 2 | **15** |
| PaymentGatewayService.java | 5 | 5 | 3 | 1 | **14** |
| InventoryAlertService.java | 1 | 7 | 3 | 1 | **12** |
| **TOTAL** | **8** | **18** | **11** | **4** | **41** |

---

## Issues by Severity (All Files)

### CRITICAL (8 Issues — Fix Immediately)
| File | Line(s) | Issue |
|------|---------|-------|
| CustomerRequest.java | 18, 48 | `issued++` not atomic — race condition |
| CustomerRequest.java | 17 | `ArrayList` not thread-safe |
| PaymentGatewayService.java | 12 | Hardcoded encryption/API key in source code |
| PaymentGatewayService.java | 17–18 | Logging card number and CVV — PCI DSS violation |
| PaymentGatewayService.java | 27–29 | Hardcoded database credentials |
| PaymentGatewayService.java | 30–32 | Storing CVV in database — PCI DSS violation |
| PaymentGatewayService.java | 30–52 | SQL Injection in all queries |
| InventoryAlertService.java | 14 | Hardcoded Slack webhook URL — live credential |

### HIGH (18 Issues)
| File | Line(s) | Issue |
|------|---------|-------|
| CustomerRequest.java | 47–49 | Invalid requests added to list and counted |
| CustomerRequest.java | 86–88 | `urgentOnly` filter applied after API call |
| CustomerRequest.java | 77–81 | N API calls in loop — performance |
| CustomerRequest.java | 63–84 | HTTP connection never closed |
| CustomerRequest.java | 65–66 | Empty POST body sent |
| CustomerRequest.java | 60–61 | No null check for environment — NPE |
| PaymentGatewayService.java | 30–37 | No transaction management |
| PaymentGatewayService.java | 22–29 | DB connection never closed |
| PaymentGatewayService.java | 55–59 | processRefund() connection never closed |
| PaymentGatewayService.java | 40 | `token_id` exposes actual card digits |
| PaymentGatewayService.java | 14, 35 | Using `double` for monetary values |
| InventoryAlertService.java | 13 | HTTP instead of HTTPS |
| InventoryAlertService.java | 29–34 | Manual JSON parsing — fragile |
| InventoryAlertService.java | 38–53 | Both catch blocks empty — silent failure |
| InventoryAlertService.java | 23–27 | HTTP response status never checked |
| InventoryAlertService.java | 35–37 | Unlimited Slack alerts — no deduplication |
| InventoryAlertService.java | 33 | ArrayIndexOutOfBoundsException risk |
| InventoryAlertService.java | Whole class | No logger — zero observability |

### MEDIUM (11 Issues)
| File | Line(s) | Issue |
|------|---------|-------|
| CustomerRequest.java | 10–15 | `API_SERVERS` public and mutable |
| CustomerRequest.java | 46 | `req_key` not unique |
| CustomerRequest.java | 79 | `totalValue()` hardcodes "PROD" |
| CustomerRequest.java | 83–84 | `price` always 0.0 — incomplete |
| CustomerRequest.java | 17 | Static list grows forever — memory leak |
| PaymentGatewayService.java | 25 | Deprecated `Class.forName()` |
| PaymentGatewayService.java | 42–62 | Inconsistent error handling |
| PaymentGatewayService.java | 50 | `processRefund()` returns void |
| InventoryAlertService.java | 12–14 | Non-constant fields named as constants |
| InventoryAlertService.java | 44–45 | JSON payload by string concatenation |
| InventoryAlertService.java | 28 | No null/empty check on response body |

### LOW (4 Issues)
| File | Line(s) | Issue |
|------|---------|-------|
| CustomerRequest.java | 5–6 | Unused imports |
| CustomerRequest.java | 20–26 | snake_case field names |
| PaymentGatewayService.java | 11 | Logger not `static final` |
| InventoryAlertService.java | 16 | `HttpClient` not declared `final` |

---

## Top Recommendations

1. **Immediately revoke and rotate** all hardcoded credentials and API keys found in source code
2. **Replace all SQL string concatenation** with `PreparedStatement` to eliminate SQL Injection
3. **Never log or store CVV** — this is a PCI DSS violation with severe legal consequences
4. **Use `BigDecimal`** for all monetary calculations — never `double`
5. **Externalize all configuration** (DB credentials, API keys, URLs) to environment variables or a secrets manager
6. **Add proper logging** to all services and handle all exceptions — never swallow silently
7. **Use thread-safe collections** and atomic operations wherever shared state is accessed concurrently
