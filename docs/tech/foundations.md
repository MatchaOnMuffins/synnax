# Technical Foundations

# 0 - Summary

Building real-time distributed systems is no easy task. This document outlines the
software engineering foundations necessary to effectively develop different components
of the Synnax platform.

Different areas of the codebase require different skill sets to work with. Nonetheless,
all of these areas require common foundational knowledge. This guide is organized
by software engineering concept, and, as s a way to navigate the subsequent sections,
we've provided a general 'roadmap' for different platform components below.

## 0.0 - Roadmap

### 0.0.0 - Storage Engine

1. [Programming Core in Go](#100---programming-core-in-go)
2. [Essential Abstractions](#11---essential-abstractions)
3. [Building Large Software Systems](#2---building-large-software-systems)
2. [Database Engineering](#4---database-engineering)

### 0.0.1 - Distribution and Networking

1. [Programming Core in Go](#100---programming-core-in-go)
2. [Essential Abstractions](#11---essential-abstractions)
3. [Building Large Software Systems](#2---building-large-software-systems)
4. [Web Services](#5---web-services)
5. [Distributed Systems](#3---distributed-systems)

### 0.0.2 - Core Services

1. [Programming Core in Go](#100---programming-core-in-go)
2. [Essential Abstractions](#11---essential-abstractions)
3. [Web Services](#5---web-services)

### 0.0.3 - Analysis Tooling

1. [Programming Core in Python](#102---programming-core-in-python)
2. [Essential Abstractions](#11---essential-abstractions)

### 0.0.4 - User Interfaces

1. [Programming Core in TypeScript](#103---programming-core-in-javascript-and-typescript)
2. [Package Management](#7---package-management)
3. [User Interfaces](#9---user-interfaces)
4. [Essential Abstractions](#11---essential-abstractions)
5. [Web Services](#5---web-services)
6. [Building Large Software Systems](#2---building-large-software-systems)

### 0.0.5 - Build Systems and Infrastructure

1. Programming Core in a Language of Choice

# 1 - Philosophy

This guide is **practical**, meaning that it bares little resemblance to a traditional,
theoretical computer science curriculum. Instead, it focuses on the skills that allow
you to **implement** real-world systems. That is not to say that the theoretical is not
relevant. We simply believe that _theory is an emergent property of trying to solve a
problem in practice_; find a real-world problem you want to solve, and learn the theory
you need to solve it.

This guide is **opinionated** in that it focuses specifically on software engineering
for Synnax. This is not to say the content is not directly applicable to other projects,
but rather that we've chosen to omit certain topics that are not relevant to the problem
at hand.

Finally, **we strongly believe that the only way to learn is by doing, and doing a
lot.** Get your hands dirty, make mistakes, and put in the time. A few thousand hours
from now, everything in this guide will seem basic.

# 1 - Programming Core

The first, and most critical, step is to become proficient in the core programming
skills that underlie all work that we do here.

## 1.0 - The Basics

Any free, online programming course should get you quickly through the basics of
programming. Here are the courses we recommend for different programming languages:

### 1.0.0 - Programming Core in Go

#### 1.0.0.0 - Recommended Beginner's Course

If you're new to programming, we recommend starting with the following course:

[Learn Go Programming](https://www.youtube.com/watch?v=YS4e4q9oBaU&ab_channel=freeCodeCamp.org)

#### 1.0.0.1 - Programming in Go for Experienced Programmers

If you're already proficient in another language, we recommend quickly going through
the official go tour:

[A tour of Go](https://go.dev/learn/)

#### 1.0.0.2 - Important Supplements

- The Stack, Heap, and
  Pointers - [Golang pointers explained, once and for all](https://www.youtube.com/watch?v=sTFJtxJXkaY&ab_channel=JunminLee)
- Effective Go - [Effective Go](https://go.dev/doc/effective_go)

### 1.0.2 - Programming Core in Python

#### 1.0.0.0 - Recommended Beginner's Course

If you're new to programming, we recommend starting
with [Learn Python - Full Course for Beginner's](https://www.youtube.com/watch?v=rfscVS0vtbw).

### 1.0.3 - Programming Core in Javascript and Typescript

#### 1.0.3.0 - Recommended Beginner's Course

If you're new to programming, we recommend starting
with [Learn JavaScript](https://www.youtube.com/watch?v=PkZNo7MFNFg&ab_channel=freeCodeCamp.org)
and supplementing it
with [Learn TypeScript](https://www.youtube.com/watch?v=30LWjhZzg50&ab_channel=freeCodeCamp.org).

#### 1.0.3.1 - Experienced JavaScript Programmer, New to TypeScript

If you're already proficient in JavaScript, we recommend going through the
[TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html).

## 1.1 - Essential Abstractions

After learning the basics, it's time to step into what programming is really about:
abstracting complexity to solve a problem.

### 1.1.0 - Interfaces and Polymorphism

Understanding that software components should be built to satisfy an interface, rather
than provide an implementation, is perhaps the most important realization that enables
engineers to build large, complex systems.

### 1.1.1 - Classes, Object-Oriented Programming, and Inheritance

### 1.1.2 - Composition

- [The flaws of Inheritance](https://www.youtube.com/watch?v=hxGOiiR9ZKg&t=89s&ab_channel=CodeAesthetic)

### 1.1.3 - Design Patterns

- [Refactoring Guru - Design Patterns](https://refactoring.guru/design-patterns)
- [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.amazon.com/dp/0201633612?ref_=cm_sw_r_cp_ud_dp_56C2VFSRGP5XW20DH7E4)


# 2 - Building Large Software Systems

- John Ousterhout's [A Philosophy of Software Design](https://www.amazon.com/Philosophy-Software-Design-John-Ousterhout/dp/1732102201)
- John Ousterhout's [A Philosophy of Software Design (Lecture)](https://www.youtube.com/watch?v=bmSAYlu0NcY&ab_channel=StanfordUniversitySchoolofEngineering)
- Martin Kleppmann's [Designing Data-Intensive Applications](https://a.co/d/4rHgKH3)

# 3 - Distributed Systems

- Martin Van Steen, [Distributed Systems](https://a.co/d/017uaCQ)

# 4 - Database Engineering

- Alex Petrov, [Database Internals](https://a.co/d/jfIHa0D)

# 5 - Web Services

- The IP Suite
- HTTP
- TCP/UDP
- TLS
- Mutual TLS

# 6 - Data Analysis

- [Data Analysis with Python](https://www.youtube.com/watch?v=r-uOLxNrNk8&ab_channel=freeCodeCamp.org)

# 7 - Package Management

- Poetry
- PNPM

# 8 - Build Systems and Infrastructure

- Continuous Integration/Continuous Deployment
- Docker
- Kubernetes
- Turborepo

# 9 - User Interfaces

- Javascript Frameworks in General
- React
- Redux
- Astro
- GPU Programming
- Tauri

# 9 - Concurrent Programming

- Rob
  Pike, [Concurrency is not Parallelism](https://www.youtube.com/watch?v=oV9rvDllKEg&ab_channel=gnbitcom)

# 10 - Profiling

- Profiling in Go
