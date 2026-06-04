---
title: "Design Patterns — A Visual, Go-First Guide"
layout: dp-home
permalink: /design-patterns/
dp: true
author_profile: false
description: "Learn every Gang-of-Four design pattern and Go's concurrency patterns the way that sticks — with diagrams, idiomatic Go, real standard-library examples, quizzes and progress tracking."
---

{% assign pats = site.patterns | where: "kind", "pattern" %}
{% assign allslugs = pats | map: "slug" | join: "," %}

<header class="dp-hero">
  <p class="dp-hero__eyebrow">Interactive learning journey</p>
  <h1>Design Patterns, the Go way</h1>
  <p class="dp-hero__lede">Every classic Gang-of-Four pattern and Go's essential concurrency patterns — explained with clear diagrams, idiomatic Go you can run, and the exact places they hide in the standard library. Built to actually stick.</p>
  <div class="dp-hero__cta">
    <a class="dp-btn dp-btn--primary" href="{{ '/design-patterns/foundations/' | relative_url }}">Start the journey →</a>
    <a class="dp-btn dp-btn--ghost" href="#creational">Jump to the patterns</a>
  </div>
</header>

<div class="dp-overall">
  <div class="dp-overall__top">
    <strong>Your progress</strong>
    <button class="dp-btn dp-btn--ghost" data-dp-reset style="padding:.35rem .8rem;font-size:.82rem;">Reset</button>
  </div>
  <div class="dp-progress" data-dp-progress data-slugs="{{ allslugs }}">
    <div class="dp-progress__track"><div class="dp-progress__fill"></div></div>
    <span class="dp-progress__label"></span>
  </div>
  <p class="dp-kicker" style="margin:.7rem 0 0;">Progress is saved in your browser — mark a pattern “learned” on its page and watch the bars fill.</p>
</div>

## How this guide works

<div class="dp-features">
  <div class="dp-feature">
    <div class="dp-feature__icon">🧭</div>
    <h3>One pattern, one page</h3>
    <p>Each page follows the same rhythm: analogy → problem → diagram → idiomatic Go → trade-offs → quiz. Once you learn the rhythm, every pattern is easy to absorb.</p>
  </div>
  <div class="dp-feature">
    <div class="dp-feature__icon">📊</div>
    <h3>See it, then read it</h3>
    <p>UML structure and sequence diagrams (rendered with Mermaid) make the relationships obvious before you hit a single line of code.</p>
  </div>
  <div class="dp-feature">
    <div class="dp-feature__icon">🐹</div>
    <h3>Go-first, not Java-translated</h3>
    <p>We show how interfaces, composition and goroutines reshape each classic pattern — and where Go's standard library already uses it.</p>
  </div>
  <div class="dp-feature">
    <div class="dp-feature__icon">🧠</div>
    <h3>Made to remember</h3>
    <p>Runnable examples, a self-check quiz on every page, and progress tracking turn passive reading into a journey you finish.</p>
  </div>
</div>

<div class="dp-callout dp-callout--tip">
  <p class="dp-callout__title">🚀 New here? Start with the Foundations</p>
  <p>Five minutes on <a href="{{ '/design-patterns/foundations/' | relative_url }}">what patterns are and why Go does them differently</a> will make every page that follows click into place. Then work top-to-bottom, or jump straight to whatever you need.</p>
</div>

## Start here

<div class="dp-grid">
  {% assign foundations = site.patterns | where: "slug", "foundations" | first %}
  {% if foundations %}
  <a class="dp-card" data-cat="foundations" data-slug="foundations" href="{{ foundations.url | relative_url }}">
    <span class="dp-card__num">START · {{ foundations.difficulty }}</span>
    <span class="dp-card__title">{{ foundations.title }}</span>
    <p class="dp-card__intent">{{ foundations.intent }}</p>
    <span class="dp-card__foot"><span>Read first</span><span class="dp-card__check" aria-hidden="true">✓</span></span>
  </a>
  {% endif %}
</div>

{% include dp/category.html cat="creational" title="Creational" blurb="How objects get made — controlling instantiation so the rest of your code doesn't have to care about concrete types." %}

{% include dp/category.html cat="structural" title="Structural" blurb="How objects are composed — assembling types into larger structures while keeping them flexible." %}

{% include dp/category.html cat="behavioral" title="Behavioral" blurb="How objects collaborate — assigning responsibilities and managing the flow of communication between them." %}

{% include dp/category.html cat="concurrency" title="Go Concurrency Patterns" blurb="The patterns that make Go special — goroutines and channels composed into pipelines, pools and safe cancellation." %}

## Go &amp; the standard library

<div class="dp-grid">
  {% assign stdlib = site.patterns | where: "slug", "stdlib-patterns" | first %}
  {% if stdlib %}
  <a class="dp-card" data-cat="stdlib" data-slug="stdlib-patterns" href="{{ stdlib.url | relative_url }}">
    <span class="dp-card__num">GUIDE · {{ stdlib.difficulty }}</span>
    <span class="dp-card__title">{{ stdlib.title }}</span>
    <p class="dp-card__intent">{{ stdlib.intent }}</p>
    <span class="dp-card__foot"><span>Tour</span><span class="dp-card__check" aria-hidden="true">✓</span></span>
  </a>
  {% endif %}
  {% assign cheat = site.patterns | where: "slug", "cheatsheet" | first %}
  {% if cheat %}
  <a class="dp-card" data-cat="practice" data-slug="cheatsheet" href="{{ cheat.url | relative_url }}">
    <span class="dp-card__num">PRACTICE · {{ cheat.difficulty }}</span>
    <span class="dp-card__title">{{ cheat.title }}</span>
    <p class="dp-card__intent">{{ cheat.intent }}</p>
    <span class="dp-card__foot"><span>Revise</span><span class="dp-card__check" aria-hidden="true">✓</span></span>
  </a>
  {% endif %}
</div>

<div class="dp-callout dp-callout--go" style="margin-top:2.4rem;">
  <p class="dp-callout__title">🐹 A note on Go and patterns</p>
  <p>Many “patterns” are really workarounds for things Java and C++ make hard. Go's interfaces, struct embedding, first-class functions and goroutines dissolve some of them and reshape the rest. Throughout this guide we'll call out when a pattern becomes a one-liner in Go — and when it's still genuinely useful.</p>
</div>
