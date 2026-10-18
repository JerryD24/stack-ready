# System Design — Low Level Design (LLD)
### SOLID Principles + Design Patterns + Real-World Problems

---

## TABLE OF CONTENTS
1. [SOLID Principles](#1-solid-principles)
2. [Other Design Principles](#2-other-design-principles)
3. [Design Patterns — All 23 GoF](#3-design-patterns)
4. [LLD Problems with Solutions](#4-lld-problems-with-solutions)
5. [How to Approach LLD Interviews](#5-how-to-approach-lld-interviews)
6. [DEEP DIVE: Booking System LLD](#6-deep-dive-booking-system-lld)
7. [Tough Interview Q&A Bank](#7-tough-interview-qa-bank)
8. [Order Management System LLD](#8-order-management-system-lld)

---

## 1. SOLID Principles

**Theory.** SOLID is five object-oriented design principles (popularized by Robert C. Martin) that together produce code which is easy to change, test, and extend — the foundation of good Low-Level Design. Most design-pattern choices and "is this a good design?" judgments trace back to one of these principles, so treat them as a review checklist: a violation almost always shows up as code that's hard to modify without breaking something elsewhere. The mnemonic spells **SOLID** — **S**ingle Responsibility (a class has one reason to change), **O**pen/Closed (extend without modifying), **L**iskov Substitution (subtypes are drop-in replacements), **I**nterface Segregation (many small interfaces over one fat one), and **D**ependency Inversion (depend on abstractions, not concretions).

### S — Single Responsibility Principle
> A class should have only ONE reason to change.

```java
// BAD: One class does too much
class UserService {
    public User getUserFromDB(int id) { ... }
    public void sendWelcomeEmail(User user) { ... }  // email concern
    public void generateUserReport(User user) { ... } // report concern
    public void saveUserToFile(User user) { ... }     // file concern
}

// GOOD: Each class has one job
class UserRepository { public User findById(int id) { ... } }
class EmailService { public void sendWelcomeEmail(User user) { ... } }
class ReportGenerator { public void generate(User user) { ... } }
class UserFileExporter { public void save(User user) { ... } }

// Easy to identify SRP violation: "This class is responsible for X AND Y"
```

### O — Open/Closed Principle
> Open for extension, Closed for modification.

```java
// BAD: Must modify existing code to add new shapes
class AreaCalculator {
    double calculate(Object shape) {
        if (shape instanceof Circle) return Math.PI * ((Circle) shape).r * ((Circle) shape).r;
        if (shape instanceof Rectangle) return ((Rectangle) shape).w * ((Rectangle) shape).h;
        // Adding Triangle requires modifying this class!
    }
}

// GOOD: Extend without modification
interface Shape { double area(); }
class Circle implements Shape { public double area() { return Math.PI * r * r; } }
class Rectangle implements Shape { public double area() { return w * h; } }
class Triangle implements Shape { public double area() { return 0.5 * b * h; } }  // new shape, no modification

class AreaCalculator {
    double calculate(Shape shape) { return shape.area(); }  // never changes
}
```

### L — Liskov Substitution Principle
> Subtypes must be substitutable for their base types without breaking the program.

```java
// BAD: Square is NOT a substitutable Rectangle
class Rectangle {
    protected int width, height;
    void setWidth(int w) { this.width = w; }
    void setHeight(int h) { this.height = h; }
    int area() { return width * height; }
}

class Square extends Rectangle {
    @Override void setWidth(int w) { this.width = w; this.height = w; }   // breaks LSP!
    @Override void setHeight(int h) { this.width = h; this.height = h; }
}

// Test that breaks:
void test(Rectangle r) {
    r.setWidth(5);
    r.setHeight(4);
    assert r.area() == 20;  // fails for Square (area = 16)
}

// GOOD: Use composition or separate hierarchy
interface Shape { int area(); }
class Rectangle implements Shape { ... }
class Square implements Shape { ... }  // independent, not extending Rectangle
```

### I — Interface Segregation Principle
> Clients should not be forced to depend on interfaces they don't use.

```java
// BAD: Fat interface forces unneeded methods
interface Worker {
    void work();
    void eat();    // Robots don't eat!
    void sleep();  // Robots don't sleep!
}

class Robot implements Worker {
    public void work() { ... }
    public void eat() { throw new UnsupportedOperationException(); }  // forced!
    public void sleep() { throw new UnsupportedOperationException(); }
}

// GOOD: Segregated interfaces
interface Workable { void work(); }
interface Eatable { void eat(); }
interface Sleepable { void sleep(); }

class Human implements Workable, Eatable, Sleepable { ... }
class Robot implements Workable { ... }
```

### D — Dependency Inversion Principle
> High-level modules should not depend on low-level modules. Both should depend on abstractions.

```java
// BAD: High-level EmailNotifier directly depends on low-level MySQLUserRepo
class EmailNotifier {
    private MySQLUserRepository repo = new MySQLUserRepository();  // tight coupling
    void notifyUser(int id) {
        User user = repo.findById(id);
        sendEmail(user.getEmail());
    }
}

// GOOD: Depend on abstractions
interface UserRepository { User findById(int id); }

class EmailNotifier {
    private final UserRepository repo;  // depends on abstraction

    EmailNotifier(UserRepository repo) { this.repo = repo; }  // DI

    void notifyUser(int id) {
        User user = repo.findById(id);
        sendEmail(user.getEmail());
    }
}

// Can inject: MySQLUserRepository, MongoUserRepository, MockUserRepository
```

---

## 2. Other Design Principles

```
DRY (Don't Repeat Yourself):
  Every piece of knowledge should have a single, unambiguous representation.
  Extract common code into shared methods/classes.
  Violation: copy-paste code → changes need to be made in multiple places.

KISS (Keep It Simple, Stupid):
  Prefer simple solutions over complex ones.
  Don't over-engineer. The simplest solution that works is usually best.

YAGNI (You Aren't Gonna Need It):
  Don't implement features until they are needed.
  Premature optimization and over-engineering lead to unused complexity.

Law of Demeter (Principle of Least Knowledge):
  A method should only talk to: itself, its parameters, objects it creates, its fields.
  BAD: customer.getWallet().getMoney().deduct(price)
  GOOD: customer.pay(price)  // delegation
  
Composition over Inheritance:
  Prefer HAS-A over IS-A when behavior can change at runtime.
  Inheritance: tight coupling, fragile base class problem.
  Composition: flexible, follows OCP.
```

---

## 3. Design Patterns

**Theory.** Design patterns are **named, reusable solutions to recurring design problems** — a shared vocabulary so that saying "use a Strategy here" instantly conveys a whole structure to another engineer. They aren't code to copy blindly but templates you adapt to your context; reaching for patterns you don't need is itself an anti-pattern (remember YAGNI). The classic 23 Gang-of-Four patterns split into three families based on what problem they solve: **Creational** patterns control *how objects are created* (Singleton, Factory Method, Abstract Factory, Builder, Prototype); **Structural** patterns control *how objects are composed* into larger structures (Adapter, Decorator, Facade, Proxy, Composite, Flyweight, Bridge); and **Behavioral** patterns control *how objects interact and distribute responsibility* (Strategy, Observer, Command, State, Template Method, Chain of Responsibility, Iterator, Mediator, and more). The real skill is recognizing *which* problem you have, then picking the pattern that fits.

### Creational Patterns

#### Singleton
```java
// Thread-safe lazy singleton (best for most cases)
public class ConfigManager {
    private static volatile ConfigManager instance;
    private Properties config;

    private ConfigManager() {
        config = new Properties();
        // load from file
    }

    public static ConfigManager getInstance() {
        if (instance == null) {
            synchronized (ConfigManager.class) {
                if (instance == null) {
                    instance = new ConfigManager();
                }
            }
        }
        return instance;
    }

    public String get(String key) { return config.getProperty(key); }
}

// Enum-based (simplest and safest)
public enum DatabaseConnection {
    INSTANCE;
    private Connection conn;
    public Connection getConnection() { return conn; }
}
```

#### Factory Method
```java
// Creator class with factory method
abstract class Notification {
    abstract void send(String message);

    static Notification create(String type) {
        return switch (type.toUpperCase()) {
            case "EMAIL" -> new EmailNotification();
            case "SMS"   -> new SMSNotification();
            case "PUSH"  -> new PushNotification();
            default -> throw new IllegalArgumentException("Unknown: " + type);
        };
    }
}

class EmailNotification extends Notification {
    void send(String msg) { System.out.println("Email: " + msg); }
}
```

#### Abstract Factory
```java
// Factory of related factories
interface UIFactory {
    Button createButton();
    Dialog createDialog();
    TextField createTextField();
}

class LightThemeFactory implements UIFactory {
    public Button createButton() { return new LightButton(); }
    public Dialog createDialog() { return new LightDialog(); }
    public TextField createTextField() { return new LightTextField(); }
}

class DarkThemeFactory implements UIFactory {
    public Button createButton() { return new DarkButton(); }
    // ...
}

// Client uses factory, doesn't know which theme
class Application {
    private UIFactory factory;
    Application(UIFactory factory) { this.factory = factory; }
    void render() {
        Button btn = factory.createButton();  // works with both Light and Dark
        btn.render();
    }
}
```

#### Builder
```java
// Construct complex objects step by step
public class HttpRequest {
    private final String url;
    private final String method;
    private final Map<String, String> headers;
    private final String body;
    private final int timeout;

    private HttpRequest(Builder b) {
        this.url = b.url;
        this.method = b.method;
        this.headers = Collections.unmodifiableMap(b.headers);
        this.body = b.body;
        this.timeout = b.timeout;
    }

    public static class Builder {
        private final String url;
        private String method = "GET";
        private Map<String, String> headers = new HashMap<>();
        private String body;
        private int timeout = 30;

        public Builder(String url) { this.url = url; }
        public Builder method(String m) { this.method = m; return this; }
        public Builder header(String k, String v) { headers.put(k,v); return this; }
        public Builder body(String b) { this.body = b; return this; }
        public Builder timeout(int t) { this.timeout = t; return this; }
        public HttpRequest build() {
            if (url == null) throw new IllegalStateException("URL required");
            return new HttpRequest(this);
        }
    }
}

// Usage
HttpRequest req = new HttpRequest.Builder("https://api.example.com/users")
    .method("POST")
    .header("Content-Type", "application/json")
    .header("Authorization", "Bearer token")
    .body("{\"name\":\"Alice\"}")
    .timeout(60)
    .build();
```

#### Prototype
```java
// Clone existing objects instead of creating from scratch
interface Prototype { Prototype clone(); }

class Resume implements Prototype, Cloneable {
    private String name;
    private List<String> skills;

    @Override
    public Resume clone() {
        try {
            Resume clone = (Resume) super.clone();
            clone.skills = new ArrayList<>(this.skills);  // deep copy collections
            return clone;
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }
}
// Use when: object creation is expensive, create similar objects frequently
```

---

### Structural Patterns

#### Adapter
```java
// Make incompatible interfaces work together
interface MediaPlayer { void play(String filename); }
interface AdvancedPlayer {
    void playMp4(String f);
    void playVlc(String f);
}

class AdvancedPlayerAdapter implements MediaPlayer {
    private AdvancedPlayer player;

    AdvancedPlayerAdapter(String type) {
        if (type.equals("vlc")) player = new VlcPlayer();
        else player = new Mp4Player();
    }

    public void play(String filename) {
        if (filename.endsWith(".vlc")) player.playVlc(filename);
        else if (filename.endsWith(".mp4")) player.playMp4(filename);
    }
}
// Real-world: Arrays.asList() adapts array to List interface
```

#### Decorator
```java
// Add behavior dynamically without modifying class
interface Coffee {
    double getCost();
    String getDescription();
}

class SimpleCoffee implements Coffee {
    public double getCost() { return 1.0; }
    public String getDescription() { return "Coffee"; }
}

abstract class CoffeeDecorator implements Coffee {
    protected final Coffee coffee;
    CoffeeDecorator(Coffee c) { this.coffee = c; }
}

class MilkDecorator extends CoffeeDecorator {
    MilkDecorator(Coffee c) { super(c); }
    public double getCost() { return coffee.getCost() + 0.5; }
    public String getDescription() { return coffee.getDescription() + ", Milk"; }
}

class SugarDecorator extends CoffeeDecorator {
    SugarDecorator(Coffee c) { super(c); }
    public double getCost() { return coffee.getCost() + 0.25; }
    public String getDescription() { return coffee.getDescription() + ", Sugar"; }
}

// Usage
Coffee c = new SugarDecorator(new MilkDecorator(new SimpleCoffee()));
c.getCost();         // 1.75
c.getDescription();  // "Coffee, Milk, Sugar"

// Real-world: Java I/O — BufferedInputStream(new FileInputStream("file.txt"))
```

#### Proxy
```java
// Three main proxy types:

// 1. Virtual Proxy (lazy initialization)
interface Image { void display(); }
class RealImage implements Image {
    private String filename;
    RealImage(String f) { this.filename = f; loadFromDisk(); }
    private void loadFromDisk() { System.out.println("Loading " + filename); }
    public void display() { System.out.println("Displaying " + filename); }
}
class ProxyImage implements Image {
    private RealImage realImage;
    private String filename;
    ProxyImage(String f) { this.filename = f; }
    public void display() {
        if (realImage == null) realImage = new RealImage(filename);  // lazy
        realImage.display();
    }
}

// 2. Protection Proxy (access control)
class SecureFileProxy implements FileAccessor {
    private FileAccessor real;
    private String userRole;
    public void read(String file) {
        if (!userRole.equals("ADMIN")) throw new AccessDeniedException();
        real.read(file);
    }
}

// 3. Caching Proxy
// Spring AOP @Cacheable is essentially a caching proxy
```

#### Facade
```java
// Simplified interface to complex subsystem
class HomeTheaterFacade {
    private Projector projector;
    private SoundSystem sound;
    private StreamingService streaming;
    private Lights lights;

    public void watchMovie(String movie) {
        lights.dim(30);
        projector.on();
        projector.setInputHDMI();
        sound.on();
        sound.setVolume(70);
        streaming.play(movie);
    }

    public void endMovie() {
        streaming.stop();
        projector.off();
        sound.off();
        lights.on();
    }
}
// Real-world: SLF4J (facade over Log4J, Logback, JUL)
```

#### Composite
```java
// Treat individual objects and compositions uniformly
interface FileSystemComponent {
    void display(String indent);
    long getSize();
}

class File implements FileSystemComponent {
    private String name;
    private long size;
    public void display(String indent) { System.out.println(indent + name + " (" + size + "B)"); }
    public long getSize() { return size; }
}

class Directory implements FileSystemComponent {
    private String name;
    private List<FileSystemComponent> children = new ArrayList<>();

    public void add(FileSystemComponent c) { children.add(c); }

    public void display(String indent) {
        System.out.println(indent + name + "/");
        children.forEach(c -> c.display(indent + "  "));
    }

    public long getSize() {
        return children.stream().mapToLong(FileSystemComponent::getSize).sum();
    }
}
// Real-world: Java AWT/Swing component tree, XML DOM
```

#### Flyweight
```java
// Share fine-grained objects to save memory
class CharacterFlyweight {
    private final char character;  // intrinsic state (shared)
    CharacterFlyweight(char c) { this.character = c; }
    void render(int x, int y, String font, int size) {  // extrinsic state (context-specific)
        System.out.println("Char: " + character + " at (" + x + "," + y + ") " + font + " " + size);
    }
}

class CharacterFactory {
    private static final Map<Character, CharacterFlyweight> pool = new HashMap<>();
    static CharacterFlyweight get(char c) {
        return pool.computeIfAbsent(c, CharacterFlyweight::new);
    }
}
// Real-world: String Pool in Java, Integer cache (-128 to 127)
```

---

### Behavioral Patterns

#### Observer
```java
// One-to-many dependency; state change notifies all observers
interface Observer { void update(String event, Object data); }

interface Subject {
    void subscribe(String event, Observer o);
    void unsubscribe(String event, Observer o);
    void publish(String event, Object data);
}

class EventBus implements Subject {
    private Map<String, List<Observer>> listeners = new HashMap<>();

    public void subscribe(String event, Observer o) {
        listeners.computeIfAbsent(event, k -> new ArrayList<>()).add(o);
    }
    public void unsubscribe(String event, Observer o) {
        listeners.getOrDefault(event, List.of()).remove(o);
    }
    public void publish(String event, Object data) {
        listeners.getOrDefault(event, List.of()).forEach(o -> o.update(event, data));
    }
}

// Real-world: Spring ApplicationEvent, RxJava, Java Swing event listeners
```

#### Strategy
```java
// Define family of algorithms; make them interchangeable
interface PaymentStrategy {
    boolean pay(double amount);
}

class CreditCardPayment implements PaymentStrategy {
    private String cardNumber;
    public boolean pay(double amount) {
        System.out.println("Charging " + amount + " to card " + cardNumber);
        return true;
    }
}

class PayPalPayment implements PaymentStrategy {
    private String email;
    public boolean pay(double amount) {
        System.out.println("Charging " + amount + " to PayPal " + email);
        return true;
    }
}

class ShoppingCart {
    private PaymentStrategy paymentStrategy;
    void setPaymentStrategy(PaymentStrategy ps) { this.paymentStrategy = ps; }
    void checkout(double amount) { paymentStrategy.pay(amount); }
}

// Real-world: java.util.Comparator, Collections.sort()
```

#### Command
```java
// Encapsulate a request as an object
interface Command { void execute(); void undo(); }

class TextEditor {
    private StringBuilder text = new StringBuilder();
    void insertText(String s, int pos) { text.insert(pos, s); }
    void deleteText(int pos, int len) { text.delete(pos, pos + len); }
}

class InsertCommand implements Command {
    private TextEditor editor;
    private String text;
    private int position;
    InsertCommand(TextEditor e, String t, int pos) { editor = e; text = t; position = pos; }
    public void execute() { editor.insertText(text, position); }
    public void undo() { editor.deleteText(position, text.length()); }
}

class CommandHistory {
    private Deque<Command> history = new ArrayDeque<>();
    void execute(Command cmd) { cmd.execute(); history.push(cmd); }
    void undo() { if (!history.isEmpty()) history.pop().undo(); }
}
// Real-world: java.lang.Runnable, Spring @Async, transactional commands, undo/redo
```

#### Chain of Responsibility
```java
// Pass request along chain until handled
abstract class SupportHandler {
    protected SupportHandler next;

    SupportHandler setNext(SupportHandler next) {
        this.next = next;
        return next;
    }

    abstract boolean handle(int level, String issue);
}

class Level1Support extends SupportHandler {
    boolean handle(int level, String issue) {
        if (level <= 1) { System.out.println("L1 resolved: " + issue); return true; }
        return next != null && next.handle(level, issue);
    }
}

class Level2Support extends SupportHandler {
    boolean handle(int level, String issue) {
        if (level <= 2) { System.out.println("L2 resolved: " + issue); return true; }
        return next != null && next.handle(level, issue);
    }
}

// Setup
SupportHandler l1 = new Level1Support();
SupportHandler l2 = new Level2Support();
SupportHandler l3 = new Level3Support();
l1.setNext(l2).setNext(l3);
l1.handle(3, "Critical issue");  // passes through L1, L2, handled by L3

// Real-world: Spring Security filter chain, servlet filter chain, logging levels
```

#### Template Method
```java
// Define skeleton; subclasses fill in steps
abstract class DataMigration {
    // Template method (final = can't override the skeleton)
    public final void migrate() {
        connect();
        extractData();
        transformData();  // varies per migration
        loadData();
        validate();
        disconnect();
    }

    protected abstract void extractData();
    protected abstract void transformData();

    private void connect() { System.out.println("Connecting to source..."); }
    private void loadData() { System.out.println("Loading to target..."); }
    private void validate() { System.out.println("Validating migration..."); }
    private void disconnect() { System.out.println("Disconnecting..."); }
}
// Real-world: Spring's JdbcTemplate, AbstractList, HttpServlet.service()
```

#### State
```java
// Allow object to alter behavior when internal state changes
interface VendingMachineState {
    void insertCoin(VendingMachine machine);
    void selectProduct(VendingMachine machine, String product);
    void dispense(VendingMachine machine);
}

class IdleState implements VendingMachineState {
    public void insertCoin(VendingMachine machine) {
        System.out.println("Coin inserted");
        machine.setState(new CoinInsertedState());
    }
    public void selectProduct(VendingMachine m, String p) { System.out.println("Insert coin first"); }
    public void dispense(VendingMachine m) { System.out.println("Insert coin first"); }
}

class CoinInsertedState implements VendingMachineState {
    public void insertCoin(VendingMachine m) { System.out.println("Coin already inserted"); }
    public void selectProduct(VendingMachine m, String p) {
        System.out.println("Product selected: " + p);
        m.setState(new ProductSelectedState(p));
    }
    public void dispense(VendingMachine m) { System.out.println("Select product first"); }
}

class VendingMachine {
    private VendingMachineState state = new IdleState();
    void setState(VendingMachineState s) { this.state = s; }
    void insertCoin() { state.insertCoin(this); }
    void selectProduct(String p) { state.selectProduct(this, p); }
    void dispense() { state.dispense(this); }
}
```

#### Iterator
```java
// Access elements sequentially without exposing internal structure
interface Iterator<T> {
    boolean hasNext();
    T next();
}

class NumberRange implements Iterable<Integer> {
    private int start, end;
    NumberRange(int s, int e) { this.start = s; this.end = e; }

    public Iterator<Integer> iterator() {
        return new Iterator<>() {
            int current = start;
            public boolean hasNext() { return current <= end; }
            public Integer next() { return current++; }
        };
    }
}
// Java's for-each loop uses Iterator
// Real-world: Database cursor, filesystem directory listing
```

#### Mediator
```java
// Reduce direct dependencies between components
interface ChatMediator {
    void sendMessage(String message, User from, User to);
    void addUser(User user);
}

class ChatRoom implements ChatMediator {
    private List<User> users = new ArrayList<>();
    public void addUser(User u) { users.add(u); }
    public void sendMessage(String msg, User from, User to) {
        to.receive(from.getName() + ": " + msg);
    }
}

class User {
    private String name;
    private ChatMediator mediator;
    User(String name, ChatMediator m) { this.name = name; this.mediator = m; }
    void send(String msg, User to) { mediator.sendMessage(msg, this, to); }
    void receive(String msg) { System.out.println(name + " received: " + msg); }
    String getName() { return name; }
}
// Real-world: Air traffic control, Spring's ApplicationEventPublisher
```

---

## 4. LLD Problems with Solutions

### Problem 1: Parking Lot

**Requirements:**
- Multiple floors, multiple spots per floor
- Spot types: Motorcycle, Compact, Large
- Vehicles: Motorcycle, Car, Truck
- Ticket on entry, billing on exit
- Track availability in real-time

```java
// Enums
enum VehicleType { MOTORCYCLE, CAR, TRUCK }
enum SpotType { MOTORCYCLE, COMPACT, LARGE }
enum SpotStatus { AVAILABLE, OCCUPIED }

// Entities
abstract class Vehicle {
    protected String licensePlate;
    protected VehicleType type;
    Vehicle(String plate, VehicleType type) { this.licensePlate = plate; this.type = type; }
    abstract SpotType getRequiredSpotType();
    String getLicensePlate() { return licensePlate; }
    VehicleType getType() { return type; }
}

class Motorcycle extends Vehicle {
    Motorcycle(String plate) { super(plate, VehicleType.MOTORCYCLE); }
    public SpotType getRequiredSpotType() { return SpotType.MOTORCYCLE; }
}

class Car extends Vehicle {
    Car(String plate) { super(plate, VehicleType.CAR); }
    public SpotType getRequiredSpotType() { return SpotType.COMPACT; }
}

class Truck extends Vehicle {
    Truck(String plate) { super(plate, VehicleType.TRUCK); }
    public SpotType getRequiredSpotType() { return SpotType.LARGE; }
}

class ParkingSpot {
    private int spotId;
    private SpotType type;
    private SpotStatus status;
    private Vehicle parkedVehicle;

    ParkingSpot(int id, SpotType type) {
        this.spotId = id;
        this.type = type;
        this.status = SpotStatus.AVAILABLE;
    }

    boolean isAvailable() { return status == SpotStatus.AVAILABLE; }
    SpotType getType() { return type; }
    int getId() { return spotId; }

    void park(Vehicle v) {
        this.parkedVehicle = v;
        this.status = SpotStatus.OCCUPIED;
    }

    Vehicle unpark() {
        Vehicle v = this.parkedVehicle;
        this.parkedVehicle = null;
        this.status = SpotStatus.AVAILABLE;
        return v;
    }
}

class Ticket {
    private String ticketId;
    private Vehicle vehicle;
    private ParkingSpot spot;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private double amount;

    Ticket(Vehicle vehicle, ParkingSpot spot) {
        this.ticketId = UUID.randomUUID().toString();
        this.vehicle = vehicle;
        this.spot = spot;
        this.entryTime = LocalDateTime.now();
    }

    void setExitTime() { this.exitTime = LocalDateTime.now(); }
    long getDurationMinutes() { return ChronoUnit.MINUTES.between(entryTime, exitTime); }
    // getters
}

class PricingStrategy {
    double calculateFee(Ticket ticket) {
        long minutes = ticket.getDurationMinutes();
        double rate = switch (ticket.getSpot().getType()) {
            case MOTORCYCLE -> 0.01;  // $0.01/min
            case COMPACT -> 0.02;
            case LARGE -> 0.03;
        };
        return minutes * rate;
    }
}

class ParkingFloor {
    private int floorNumber;
    private List<ParkingSpot> spots;

    ParkingFloor(int num, int motorcycle, int compact, int large) {
        this.floorNumber = num;
        this.spots = new ArrayList<>();
        int id = 1;
        for (int i = 0; i < motorcycle; i++) spots.add(new ParkingSpot(id++, SpotType.MOTORCYCLE));
        for (int i = 0; i < compact; i++) spots.add(new ParkingSpot(id++, SpotType.COMPACT));
        for (int i = 0; i < large; i++) spots.add(new ParkingSpot(id++, SpotType.LARGE));
    }

    Optional<ParkingSpot> findAvailableSpot(SpotType type) {
        return spots.stream().filter(s -> s.getType() == type && s.isAvailable()).findFirst();
    }

    int getAvailableCount(SpotType type) {
        return (int) spots.stream().filter(s -> s.getType() == type && s.isAvailable()).count();
    }
}

class ParkingLot {
    private static ParkingLot instance;
    private List<ParkingFloor> floors;
    private Map<String, Ticket> activeTickets;  // ticketId → Ticket
    private PricingStrategy pricing;

    private ParkingLot() {
        floors = new ArrayList<>();
        activeTickets = new ConcurrentHashMap<>();
        pricing = new PricingStrategy();
    }

    static synchronized ParkingLot getInstance() {
        if (instance == null) instance = new ParkingLot();
        return instance;
    }

    void addFloor(ParkingFloor floor) { floors.add(floor); }

    Ticket park(Vehicle vehicle) {
        SpotType required = vehicle.getRequiredSpotType();
        for (ParkingFloor floor : floors) {
            Optional<ParkingSpot> spot = floor.findAvailableSpot(required);
            if (spot.isPresent()) {
                spot.get().park(vehicle);
                Ticket ticket = new Ticket(vehicle, spot.get());
                activeTickets.put(ticket.getTicketId(), ticket);
                return ticket;
            }
        }
        throw new ParkingFullException("No spot available for " + vehicle.getType());
    }

    double checkout(String ticketId) {
        Ticket ticket = activeTickets.remove(ticketId);
        if (ticket == null) throw new InvalidTicketException(ticketId);
        ticket.setExitTime();
        ticket.getSpot().unpark();
        double fee = pricing.calculateFee(ticket);
        ticket.setAmount(fee);
        return fee;
    }
}
```

---

### Problem 2: Elevator System

```java
enum Direction { UP, DOWN, IDLE }
enum ElevatorStatus { MOVING, STOPPED, MAINTENANCE }
enum ButtonType { INSIDE, OUTSIDE }

class Request {
    private int floor;
    private Direction direction;
    private RequestType type;
    // INTERNAL: requested from inside elevator (destination floor)
    // EXTERNAL: floor panel button press
}

class Elevator {
    private int id;
    private int currentFloor;
    private Direction direction;
    private ElevatorStatus status;
    private TreeSet<Integer> upRequests = new TreeSet<>();   // SCAN upward destinations
    private TreeSet<Integer> downRequests = new TreeSet<>(Comparator.reverseOrder()); // downward

    void addRequest(int floor) {
        if (floor > currentFloor) upRequests.add(floor);
        else downRequests.add(floor);
    }

    void move() {
        if (direction == Direction.UP && !upRequests.isEmpty()) {
            currentFloor = upRequests.first();
            upRequests.remove(currentFloor);
            if (upRequests.isEmpty()) direction = downRequests.isEmpty() ? Direction.IDLE : Direction.DOWN;
        } else if (direction == Direction.DOWN && !downRequests.isEmpty()) {
            currentFloor = downRequests.first();
            downRequests.remove(currentFloor);
            if (downRequests.isEmpty()) direction = upRequests.isEmpty() ? Direction.IDLE : Direction.UP;
        }
    }

    int distanceTo(int floor) { return Math.abs(currentFloor - floor); }
    boolean canPickup(int floor, Direction dir) {
        if (direction == Direction.IDLE) return true;
        if (direction == Direction.UP && dir == Direction.UP && floor >= currentFloor) return true;
        if (direction == Direction.DOWN && dir == Direction.DOWN && floor <= currentFloor) return true;
        return false;
    }
}

// LOOK Algorithm / SCAN: elevator moves in one direction until no more requests, then reverses
class ElevatorController {
    private List<Elevator> elevators;

    Elevator assignElevator(int requestedFloor, Direction dir) {
        // Pick elevator that can serve in same direction with least distance
        return elevators.stream()
            .filter(e -> e.canPickup(requestedFloor, dir))
            .min(Comparator.comparingInt(e -> e.distanceTo(requestedFloor)))
            .orElseGet(() ->
                // if no elevator going same way, pick nearest idle or any
                elevators.stream().min(Comparator.comparingInt(e -> e.distanceTo(requestedFloor))).get()
            );
    }
}
```

---

### Problem 3: BookMyShow (Movie Ticket Booking)

```java
// Key entities
class Movie { private String id, title, duration; }
class Theatre { private String id, name, city; private List<Screen> screens; }
class Screen { private int screenNumber; private int totalSeats; }
class Show {
    private String id;
    private Movie movie;
    private Screen screen;
    private Theatre theatre;
    private LocalDateTime startTime;
    private Map<Integer, SeatStatus> seatMap;  // seatNumber → status
    private double basePrice;
}

enum SeatStatus { AVAILABLE, LOCKED, BOOKED }

class Booking {
    private String bookingId;
    private User user;
    private Show show;
    private List<Integer> seatNumbers;
    private BookingStatus status;  // PENDING, CONFIRMED, CANCELLED
    private double totalAmount;
    private LocalDateTime expiryTime;  // 10 min lock window
}

// Seat locking (optimistic locking with version or pessimistic with DB lock)
class BookingService {
    private Map<String, String> seatLocks = new ConcurrentHashMap<>();  // "showId:seatNum" → userId

    synchronized boolean lockSeats(String showId, List<Integer> seats, String userId) {
        // Check all seats available
        for (int seat : seats) {
            String key = showId + ":" + seat;
            if (seatLocks.containsKey(key)) return false;  // someone else locked it
        }
        // Lock all seats
        seats.forEach(seat -> seatLocks.put(showId + ":" + seat, userId));

        // Schedule unlock if payment not completed in 10 minutes
        scheduler.schedule(() -> releaseLocksIfUnpaid(showId, seats, userId), 10, TimeUnit.MINUTES);
        return true;
    }

    Booking confirmBooking(String showId, List<Integer> seats, String userId, Payment payment) {
        // Verify locks still held by user
        // Process payment
        // Create booking record
        // Release locks (mark seats as BOOKED)
        // Send confirmation email/SMS
    }
}
```

---

### Problem 4: ATM Machine

```java
enum ATMState { IDLE, CARD_INSERTED, AUTHENTICATING, CHOOSING_TRANSACTION, DISPENSING, MAINTENANCE }

class ATM {
    private ATMState state;
    private Card currentCard;
    private int cashAvailable;
    private Bank bank;

    void insertCard(Card card) {
        if (state != ATMState.IDLE) { System.out.println("ATM busy"); return; }
        this.currentCard = card;
        state = ATMState.CARD_INSERTED;
    }

    boolean authenticate(String pin) {
        if (state != ATMState.CARD_INSERTED) return false;
        state = ATMState.AUTHENTICATING;
        boolean valid = bank.validatePin(currentCard, pin);
        state = valid ? ATMState.CHOOSING_TRANSACTION : ATMState.IDLE;
        if (!valid) currentCard = null;
        return valid;
    }

    WithdrawalResult withdraw(double amount) {
        if (state != ATMState.CHOOSING_TRANSACTION) throw new IllegalStateException();
        if (amount > cashAvailable) return WithdrawalResult.INSUFFICIENT_CASH;
        BankResult bankResult = bank.debit(currentCard, amount);
        if (!bankResult.isSuccess()) return WithdrawalResult.BANK_DECLINED;
        state = ATMState.DISPENSING;
        cashAvailable -= amount;
        dispense(amount);
        state = ATMState.CHOOSING_TRANSACTION;
        return WithdrawalResult.SUCCESS;
    }

    void ejectCard() {
        currentCard = null;
        state = ATMState.IDLE;
    }
}
```

---

### Problem 5: Splitwise

```java
// Key concept: Expense splitting and debt simplification

enum SplitType { EQUAL, EXACT, PERCENTAGE, SHARE }

class User { private String id, name, email; }

class Expense {
    private String id;
    private User paidBy;
    private double totalAmount;
    private String description;
    private List<Split> splits;  // how it's split among users
}

abstract class Split {
    protected User user;
    protected double amount;  // final computed amount
}

class EqualSplit extends Split {
    // amount = total / numUsers
}

class ExactSplit extends Split {
    // amount specified directly
}

class PercentageSplit extends Split {
    private double percentage;
    // amount = total * percentage / 100
}

// Balance calculation
class BalanceManager {
    // balances: userId → Map<userId, amount>
    // Positive: userId is owed by the other
    // Negative: userId owes the other
    Map<String, Map<String, Double>> balances = new HashMap<>();

    void addExpense(Expense expense) {
        String payerId = expense.getPaidBy().getId();
        for (Split split : expense.getSplits()) {
            if (!split.getUser().getId().equals(payerId)) {
                // payerId is owed split.amount by split.user
                updateBalance(payerId, split.getUser().getId(), split.getAmount());
            }
        }
    }

    void updateBalance(String creditor, String debtor, double amount) {
        balances.computeIfAbsent(creditor, k -> new HashMap<>())
            .merge(debtor, amount, Double::sum);
        balances.computeIfAbsent(debtor, k -> new HashMap<>())
            .merge(creditor, -amount, Double::sum);
    }

    // Simplify debts: reduce number of transactions needed to settle
    // Algorithm: Separate creditors and debtors, match greedily
    List<Transaction> simplifyDebts() {
        // net balance for each user
        Map<String, Double> netBalance = new HashMap<>();
        for (var outer : balances.entrySet()) {
            for (var inner : outer.getValue().entrySet()) {
                netBalance.merge(outer.getKey(), inner.getValue(), Double::sum);
            }
        }
        // Use two-pointer or heap to match creditors and debtors
        PriorityQueue<Map.Entry<String,Double>> creditors = new PriorityQueue<>(
            (a,b) -> Double.compare(b.getValue(), a.getValue()));
        PriorityQueue<Map.Entry<String,Double>> debtors = new PriorityQueue<>(
            (a,b) -> Double.compare(a.getValue(), b.getValue()));

        netBalance.forEach((user, balance) -> {
            if (balance > 0) creditors.add(Map.entry(user, balance));
            else if (balance < 0) debtors.add(Map.entry(user, balance));
        });

        List<Transaction> result = new ArrayList<>();
        while (!creditors.isEmpty() && !debtors.isEmpty()) {
            var creditor = creditors.poll();
            var debtor = debtors.poll();
            double settle = Math.min(creditor.getValue(), -debtor.getValue());
            result.add(new Transaction(debtor.getKey(), creditor.getKey(), settle));
            if (creditor.getValue() > settle) creditors.add(Map.entry(creditor.getKey(), creditor.getValue() - settle));
            if (-debtor.getValue() > settle) debtors.add(Map.entry(debtor.getKey(), debtor.getValue() + settle));
        }
        return result;
    }
}
```

---

### Problem 6: Chess Game

```java
enum PieceColor { WHITE, BLACK }
enum PieceType { KING, QUEEN, ROOK, BISHOP, KNIGHT, PAWN }

class Position {
    final int row, col;  // 0-7
    Position(int r, int c) { row = r; col = c; }
    boolean isValid() { return row >= 0 && row < 8 && col >= 0 && col < 8; }
}

abstract class Piece {
    protected PieceColor color;
    protected Position position;

    abstract List<Position> getValidMoves(Board board);

    boolean isEnemy(Piece other) {
        return other != null && other.color != this.color;
    }
}

class Rook extends Piece {
    public List<Position> getValidMoves(Board board) {
        List<Position> moves = new ArrayList<>();
        int[][] directions = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int[] dir : directions) {
            for (int i = 1; i < 8; i++) {
                Position next = new Position(position.row + dir[0]*i, position.col + dir[1]*i);
                if (!next.isValid()) break;
                Piece at = board.getPiece(next);
                if (at == null) moves.add(next);
                else { if (isEnemy(at)) moves.add(next); break; }  // can capture but can't pass
            }
        }
        return moves;
    }
}

class Knight extends Piece {
    public List<Position> getValidMoves(Board board) {
        int[][] jumps = {{2,1},{2,-1},{-2,1},{-2,-1},{1,2},{1,-2},{-1,2},{-1,-2}};
        return Arrays.stream(jumps)
            .map(j -> new Position(position.row + j[0], position.col + j[1]))
            .filter(p -> p.isValid())
            .filter(p -> !board.hasFriendlyPiece(p, color))
            .collect(Collectors.toList());
    }
}

class Board {
    private Piece[][] grid = new Piece[8][8];
    Piece getPiece(Position p) { return grid[p.row][p.col]; }
    boolean hasFriendlyPiece(Position p, PieceColor color) {
        Piece at = grid[p.row][p.col];
        return at != null && at.color == color;
    }
    void movePiece(Position from, Position to) {
        grid[to.row][to.col] = grid[from.row][from.col];
        grid[from.row][from.col] = null;
        grid[to.row][to.col].position = to;
    }
}

class Game {
    private Board board;
    private Player whitePlayer, blackPlayer;
    private Player currentTurn;
    private GameStatus status;

    boolean makeMove(Player player, Position from, Position to) {
        if (player != currentTurn) return false;
        Piece piece = board.getPiece(from);
        if (piece == null || piece.color != player.getColor()) return false;
        List<Position> validMoves = piece.getValidMoves(board);
        if (!validMoves.contains(to)) return false;
        board.movePiece(from, to);
        currentTurn = (currentTurn == whitePlayer) ? blackPlayer : whitePlayer;
        checkGameStatus();
        return true;
    }
}
```

---

## 5. How to Approach LLD Interviews

### Step-by-Step Process (30-40 min)
```
1. Clarify Requirements (5 min)
   - What are the core features?
   - What can we EXCLUDE for now (MVP)?
   - Any scale constraints?
   - Platform (desktop, web, API)?

2. Identify Key Entities/Nouns (3 min)
   - "Parking Lot, Floor, Spot, Vehicle, Ticket" — these become your classes

3. Identify Relationships (3 min)
   - ParkingLot HAS many Floors (Composition)
   - Floor HAS many Spots (Composition)
   - Spot IS-A location for Vehicle (Association)
   - Ticket REFERENCES Vehicle and Spot

4. Design Class Hierarchy (5 min)
   - Identify abstractions (abstract class or interface?)
   - Apply inheritance wisely (use for TRUE is-a relationships)
   - Use composition for HAS-A

5. Define APIs / Key Methods (5 min)
   - For each class: what methods does it need?
   - Think from the caller's perspective

6. Code the Core Classes (15 min)
   - Start with entities (plain classes)
   - Then service/manager classes
   - Add enum for states
   - Handle edge cases (null, full, already booked)

7. Apply Design Patterns (5 min)
   - Singleton for central manager
   - Strategy for varying algorithms (pricing)
   - Observer for event notification
   - State for state machine (ATM, Vending Machine)

8. Discuss Extensibility
   - "How would you add feature X?"
   - OCP: Open for extension without modification
```

### Common Patterns in LLD Problems
```
Singleton: ParkingLot, ATM, BookingSystem (one central manager)
Factory: Creating different Vehicle types, Notification types
Strategy: Pricing algorithm, Payment method, Sorting
Observer: Notifications when booking confirmed, seat status change
State: ATM states, Elevator states, Vending Machine states
Composite: File system, Organization hierarchy
Command: Transaction history, undo/redo
Template Method: Different report generation types
Decorator: Toppings on pizza, coffee customization
Chain of Responsibility: Discount calculation, support escalation
```

### Interview Tips
```
1. Always start with requirements clarification — never jump to code
2. Draw class diagram before writing code
3. Think out loud — interviewers want to see your thought process
4. Start simple, then add complexity
5. Use meaningful names for classes and methods
6. Always consider: thread safety, error handling, extensibility
7. Mention design patterns by name when you use them
8. Don't over-engineer — apply YAGNI
9. Think about edge cases: empty parking lot, concurrent bookings, invalid input
10. Encapsulate what varies (Strategy pattern thinking)
```

---

## 6. DEEP DIVE: Booking System LLD

### 6.1 Requirements Clarification

```
Functional:
  - User browses movies/shows
  - Selects seats on a seat map
  - Books seats (hold → pay → confirm)
  - Cancel before show time

Non-functional:
  - No double booking (same seat to two users)
  - Thread-safe concurrent access
  - Hold expires after 10 minutes if unpaid

Out of scope (MVP):
  - Payment gateway integration details
  - Admin panel
```

### 6.2 Class Diagram (Core Entities)

```
BookingSystem (Singleton)
  ├── ShowRepository
  ├── SeatLockService
  └── BookingService

Show ──has──► Screen ──has──► List<Seat>
Booking ──references──► List<Seat>, User, Show
Seat: id, row, number, SeatType (REGULAR, PREMIUM), SeatStatus (AVAILABLE, LOCKED, BOOKED)

Enums:
  SeatStatus: AVAILABLE, LOCKED, BOOKED
  BookingStatus: PENDING, CONFIRMED, CANCELLED, EXPIRED
```

### 6.3 Full Implementation Sketch

```java
enum SeatStatus { AVAILABLE, LOCKED, BOOKED }
enum BookingStatus { PENDING, CONFIRMED, CANCELLED, EXPIRED }

class Seat {
    private final String id;
    private final int row, number;
    private SeatStatus status = AVAILABLE;
    private String lockedBy;       // userId
    private long lockExpiry;       // epoch millis

    synchronized boolean tryLock(String userId, long holdMinutes) {
        if (status == BOOKED) return false;
        if (status == LOCKED && System.currentTimeMillis() < lockExpiry
            && !userId.equals(lockedBy)) return false;
        status = LOCKED;
        lockedBy = userId;
        lockExpiry = System.currentTimeMillis() + holdMinutes * 60_000;
        return true;
    }

    synchronized void confirm() {
        if (status != LOCKED) throw new IllegalStateException("Seat not locked");
        status = BOOKED;
        lockedBy = null;
    }

    synchronized void releaseIfExpired() {
        if (status == LOCKED && System.currentTimeMillis() >= lockExpiry) {
            status = AVAILABLE;
            lockedBy = null;
        }
    }
}

class BookingService {
    private final Map<String, Seat> seats = new ConcurrentHashMap<>();
    private final Semaphore dbSemaphore = new Semaphore(50); // limit concurrent DB ops

    public BookingResult book(List<String> seatIds, String userId) {
        // Phase 1: lock all seats (fail if any unavailable)
        List<Seat> locked = new ArrayList<>();
        try {
            for (String id : seatIds) {
                Seat seat = seats.get(id);
                if (seat == null || !seat.tryLock(userId, 10)) {
                    locked.forEach(Seat::releaseIfExpired);
                    return BookingResult.failed("Seat unavailable: " + id);
                }
                locked.add(seat);
            }
            // Phase 2: persist booking (with semaphore)
            dbSemaphore.acquire();
            try {
                return persistBooking(locked, userId);
            } finally {
                dbSemaphore.release();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return BookingResult.failed("Interrupted");
        }
    }
}
```

### 6.4 Design Patterns Used

| Pattern | Where | Why |
|---------|-------|-----|
| Singleton | BookingSystem | One central coordinator |
| Strategy | Pricing (Regular vs Premium vs Weekend) | OCP — add pricing without modifying booking |
| State | SeatStatus, BookingStatus | Clear state transitions |
| Observer | Notify user on confirm/cancel | Decouple notification |
| Factory | Create different ticket types | Encapsulate creation |

### 6.5 Concurrency Without synchronized Keyword

Alternatives demonstrated:
1. `ConcurrentHashMap` for seat registry
2. `Semaphore` for limiting concurrent DB writes
3. `ReentrantLock` per seat (finer than synchronized method)
4. Database `SELECT FOR UPDATE` as source of truth
5. Immutable `Booking` object once confirmed

```java
class SeatWithLock {
    private final ReentrantLock lock = new ReentrantLock();
    private SeatStatus status = AVAILABLE;

    boolean tryLock(String userId) {
        if (!lock.tryLock()) return false;
        try {
            if (status != AVAILABLE) return false;
            status = LOCKED;
            return true;
        } finally {
            lock.unlock();
        }
    }
}
```

### 6.6 Interview Follow-Up Questions

**Q: How to handle user selecting 4 seats but only 3 available?**
A: All-or-nothing lock — try lock all, if any fails release all already locked (rollback).

**Q: How to extend for multiple theatres?**
A: `Theatre` → `Screen` → `Seat` hierarchy. BookingSystem becomes facade per theatre or single system with theatreId.

**Q: How to add VIP pricing?**
A: Strategy pattern — `PricingStrategy` interface, `RegularPricing`, `VIPPricing`, `WeekendPricing`.

---

## 7. Tough Interview Q&A Bank

**Q: Explain all SOLID principles with one example each?**
A: SRP — one class one job. OCP — extend via interface not modify. LSP — subclass substitutable. ISP — small interfaces. DIP — depend on abstractions.

**Q: Singleton in LLD — when and pitfalls?**
A: Use for ParkingLot, BookingSystem, ATM (one instance). Thread-safe: enum or holder pattern. Testability: consider dependency injection instead.

**Q: Strategy vs State pattern?**
A: Strategy — client chooses algorithm (pricing). State — object behavior changes with internal state (ATM states).

**Q: How to design Parking Lot LLD?**
A: ParkingLot (singleton) → Floor → Spot. Vehicle types (Bike, Car, Truck) map to spot types. Strategy for pricing. Factory for vehicle creation.

**Q: How to design Elevator LLD?**
A: Elevator state machine (IDLE, MOVING_UP, MOVING_DOWN). Request queue (SCAN algorithm). Observer for floor arrival display.

**Q: How to design Splitwise LLD?**
A: User, Expense, Split (equal/exact/percentage). Minimize transactions via greedy debt settlement. Graph of who owes whom.

**Q: Composition vs Inheritance?**
A: Prefer composition (HAS-A) over inheritance (IS-A) unless true subtype relationship. Composition is more flexible (OCP).

**Q: How to make LLD thread-safe?**
A: synchronized, ReentrantLock, ConcurrentHashMap, immutable objects, atomic operations, or delegate to DB locks.

---

## 8. Order Management System LLD

**Scenario (interview):** Inventory update, payment deduction, and invoice generation must happen as independent steps. Design the LLD.

### 8.1 Requirements

```
- Place order (validate items, reserve inventory)
- Process payment
- Generate invoice
- Steps should be loosely coupled (independent services/components)
- Failure in payment should release inventory
```

### 8.2 Class Diagram

```
OrderService (orchestrator)
  ├── InventoryService
  ├── PaymentService
  ├── InvoiceService
  └── OrderRepository

Order (entity)
  - id, userId, items, status, total
  - status: CREATED → INVENTORY_RESERVED → PAID → INVOICED → COMPLETED / FAILED

Domain Events:
  OrderCreatedEvent, PaymentCompletedEvent, PaymentFailedEvent
```

### 8.3 Implementation — Observer / Event pattern

```java
public enum OrderStatus { CREATED, INVENTORY_RESERVED, PAID, INVOICED, COMPLETED, FAILED }

@Entity
public class Order {
    @Id private String id;
    @Enumerated(EnumType.STRING) private OrderStatus status;
    private BigDecimal total;
    @Version private int version;
}

// Publisher interface (DIP)
public interface DomainEventPublisher {
    void publish(Object event);
}

@Service
public class OrderService {
    private final OrderRepository orderRepo;
    private final DomainEventPublisher eventPublisher;

    @Transactional
    public Order placeOrder(OrderRequest request) {
        Order order = orderRepo.save(Order.from(request));
        eventPublisher.publish(new OrderCreatedEvent(order.getId(), order.getTotal()));
        return order;
    }
}

@Component
public class InventoryHandler {
    @EventListener
    @Order(1)
    public void onOrderCreated(OrderCreatedEvent e) {
        inventoryService.reserve(e.orderId());
    }

    @EventListener
    public void onPaymentFailed(PaymentFailedEvent e) {
        inventoryService.release(e.orderId());  // compensate
    }
}

@Component
public class PaymentHandler {
    @EventListener
    @Order(2)
    public void onOrderCreated(OrderCreatedEvent e) {
        try {
            paymentService.charge(e.orderId(), e.amount());
            eventPublisher.publish(new PaymentCompletedEvent(e.orderId()));
        } catch (PaymentException ex) {
            eventPublisher.publish(new PaymentFailedEvent(e.orderId()));
        }
    }
}

@Component
public class InvoiceHandler {
    @EventListener
    public void onPaymentCompleted(PaymentCompletedEvent e) {
        invoiceService.generate(e.orderId());
    }
}
```

### 8.4 AOP for Cross-Cutting (not workflow)

```java
@Aspect
@Component
public class AuditAspect {
    @AfterReturning(pointcut = "@annotation(Audited)", returning = "result")
    public void audit(JoinPoint jp, Object result) {
        auditLog.record(jp.getSignature().getName(), result);
    }
}

@Audited
@Transactional
public Order placeOrder(OrderRequest req) { ... }
```

**AOP for:** logging, audit, metrics, `@Transactional`. **Events for:** business workflow between independent steps.

### 8.5 Concurrency — stock like product catalog

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT p FROM Product p WHERE p.id = :id")
Product findForUpdate(@Param("id") Long id);
```

Or optimistic `@Version` with retry — see `02_SpringBoot.md` Section 14.6.

### 8.6 Interview talking points

| Topic | Answer |
|-------|--------|
| Why events not direct calls? | Loose coupling; add notification listener without changing OrderService |
| Monolith vs microservices | In-process events for monolith; Kafka for microservices |
| Payment fails? | `PaymentFailedEvent` → release inventory (compensation) |
| Idempotency? | `orderId` as idempotency key on payment API |
| Patterns used | Observer (events), State (order status), Strategy (payment methods) |
