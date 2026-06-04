---
slug: foundations
title: "Foundations: Patterns & the Go Mindset"
category: foundations
kind: guide
order: 1
difficulty: "Start here"
status: ready
intent: "What design patterns are, why they exist, and why they look so different in Go than in Java or C++."
related:
  - singleton
  - strategy
  - stdlib-patterns
quiz:
  - q: "What is a design pattern, most precisely?"
    options:
      - text: "A reusable library you import"
        correct: false
      - text: "A named, reusable solution to a recurring design problem"
        correct: true
      - text: "A rule you must always follow"
        correct: false
      - text: "A Go language feature"
        correct: false
    explain: "A pattern is a description of a solution — a shared vocabulary — not code you import. You implement it yourself, shaped by your language."
  - q: "Why do several classic patterns shrink or vanish in Go?"
    options:
      - text: "Go is slower so they aren't worth it"
        correct: false
      - text: "Go has no objects"
        correct: false
      - text: "Interfaces, embedding, first-class functions and goroutines solve some problems at the language level"
        correct: true
      - text: "Go forbids design patterns"
        correct: false
    explain: "Many GoF patterns work around the absence of features Go has built in. Strategy is often just a function value; Iterator is range; Observer leans on channels."
  - q: "Which statement reflects idiomatic Go best?"
    options:
      - text: "Prefer deep inheritance hierarchies"
        correct: false
      - text: "Favor composition and small interfaces over inheritance"
        correct: true
      - text: "Always make everything a Singleton"
        correct: false
      - text: "Avoid interfaces entirely"
        correct: false
    explain: "Go has no inheritance. It composes behavior with struct embedding and satisfies small, implicit interfaces — accept interfaces, return structs."
---

> **In one line.** A design pattern is a *named, proven solution to a problem that keeps coming up* — a shared vocabulary that lets one engineer say "let's use a Strategy here" and another instantly know what they mean.

Patterns aren't code you download. They're **descriptions of a design** that you adapt to your language and problem. The catalog comes from the 1994 book *Design Patterns* by the "Gang of Four" (GoF), which cataloged 23 of them. That catalog is the backbone of this guide — but we read it through a **Go lens**, because Go changes the answers.

## Why patterns are worth your time

<div class="dp-features">
  <div class="dp-feature"><div class="dp-feature__icon">🗣️</div><h3>Shared vocabulary</h3><p>"Wrap it in a Decorator" compresses a paragraph of explanation into two words on a code review.</p></div>
  <div class="dp-feature"><div class="dp-feature__icon">🧩</div><h3>Tried-and-tested</h3><p>Each pattern encodes trade-offs people already learned the hard way, so you skip some of the mistakes.</p></div>
  <div class="dp-feature"><div class="dp-feature__icon">🔌</div><h3>Design for change</h3><p>Most patterns exist to isolate the part of a system most likely to change behind a stable interface.</p></div>
</div>

## The three families

The 23 GoF patterns split into three groups by *what kind of problem* they solve.

```mermaid
graph TD
  A["Design Patterns (GoF)"] --> C["Creational<br/>how objects are made"]
  A --> S["Structural<br/>how objects are composed"]
  A --> B["Behavioral<br/>how objects interact"]
  C --> C1["Singleton · Factory Method<br/>Abstract Factory · Builder · Prototype"]
  S --> S1["Adapter · Bridge · Composite · Decorator<br/>Facade · Flyweight · Proxy"]
  B --> B1["Strategy · Observer · Command · State<br/>Iterator · Template Method · and more"]
```

<div class="dp-callout dp-callout--intent" markdown="1">
<p class="dp-callout__title">🎯 A quick way to remember them</p>

**Creational** = the *birth* of objects. **Structural** = the *shape* objects form together. **Behavioral** = the *conversation* between objects.

</div>

## Why Go is different

Most pattern tutorials are written for Java or C++. Go deliberately omits features those languages lean on — and that changes everything.

| Java / C++ relies on… | Go gives you instead… | Effect on patterns |
|---|---|---|
| Class inheritance | **Struct embedding** (composition) | Template Method, Decorator become composition |
| Explicit `implements` | **Implicit, small interfaces** | Adapter & Strategy get trivial |
| Objects everywhere | **First-class functions** | Strategy/Command can be a `func` value |
| Threads + locks | **Goroutines + channels** | Observer/Pub-Sub become channel-native |
| Constructors | **Plain `NewX()` functions** | Factory Method is just a function |

<div class="dp-callout dp-callout--go" markdown="1">
<p class="dp-callout__title">🐹 The Go proverbs that matter here</p>

"**Accept interfaces, return structs.**" · "**The bigger the interface, the weaker the abstraction.**" · "**Don't communicate by sharing memory; share memory by communicating.**" Each one quietly rewrites a classic pattern.

</div>

So in this guide, every pattern page asks two questions: *what's the classic shape?* and *what does it actually look like in idiomatic Go?* Sometimes the answer is "a one-line function." That's a feature, not a disappointment.

## The four pillars behind Go's approach

- **Interfaces are implicit.** A type satisfies an interface just by having the methods — no `implements` keyword. This makes Adapter, Strategy and Dependency Injection nearly free.
- **Embedding, not inheritance.** Put a struct inside another and its methods are promoted. You get reuse without a class hierarchy.
- **Functions are values.** You can pass behavior directly, so many "make an object to hold one method" patterns collapse.
- **Concurrency is built in.** Goroutines and channels turn Observer, Pipeline and Pub/Sub into language-level idioms.

## How to read a pattern page

Every pattern in this guide follows the same structure, so you always know where to look:

<div class="dp-features">
  <div class="dp-feature"><div class="dp-feature__icon">①</div><h3>Intent & analogy</h3><p>One-line purpose plus a real-world story to anchor it in memory.</p></div>
  <div class="dp-feature"><div class="dp-feature__icon">②</div><h3>Problem & structure</h3><p>The pain it removes, then a UML diagram of the moving parts.</p></div>
  <div class="dp-feature"><div class="dp-feature__icon">③</div><h3>Idiomatic Go</h3><p>Runnable Go code — the Go-native form, not a Java translation.</p></div>
  <div class="dp-feature"><div class="dp-feature__icon">④</div><h3>Trade-offs & quiz</h3><p>When to use it, when not to, where the stdlib uses it, and a self-check.</p></div>
</div>

<div class="dp-callout dp-callout--tip" markdown="1">
<p class="dp-callout__title">✅ Mark pages as 'learned'</p>

Use the **Mark as learned** button on every pattern page to track your journey. Your progress bars on the home page fill up as you go — it's all saved in your browser.

</div>

Ready? The most natural place to begin is the very first creational pattern.
