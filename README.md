# Nexus-Core

> **The Isomorphic State Orchestrator** > A high-performance evolution of the Backbone/Underscore philosophy for 2026.

Nexus-Core is a lightweight, logic-first library designed to manage complex data structures across **Node.js, Web Workers, and the DOM**. It strips away the legacy constraints of 2011-era frameworks and replaces them with a modern, "headless" state engine built on **ES Proxies, WeakRefs, and Async Iterators.**

---

## 🚀 Why Nexus-Core?

Modern development often forces a choice between "dumb" JSON objects or "heavy" UI frameworks. Nexus-Core provides a middle ground: **Smart Data.**

- **Transparent Proxies:** No `.get()` or `.set()`. Use pure JS object syntax (`model.name = 'Gemini'`) while automatically triggering validation and network synchronization.
- **Zombie-Proof Events:** A memory-safe `listenTo` pattern utilizing `WeakRef` prevents memory leaks in long-running Node processes and multi-threaded environments.
- **Protocol Agnostic:** Manage state the same way across any transport. Swap **Axios** (REST) for **MessageChannel** (Workers) or **FS** (Filesystem) without changing your business logic.
- **Functional Muscle:** The best of Underscore/Lodash logic is baked directly into the Collection prototype, optimized for high-concurrency data transformation.

---

## 📦 Core Modules

### 1. Nexus.Events
The central nervous system. Provides bi-directional event tracking and a microtask-queue for non-blocking execution.
* **Masterclass Logic:** Implements Inversion of Control (IoC) via `listenTo()`, ensuring that when a listener is destroyed, all network and internal references are scrubbed.

### 2. Nexus.Model
A Proxy-wrapped state container that treats data as a "live" entity.
* **Masterclass Logic:** Supports "Silent" updates, Zod-compatible schema enforcement, and memoized computed properties that react instantly to attribute changes.

### 3. Nexus.Collection
A managed, queryable set of Models that acts as an in-memory relational database.
* **Masterclass Logic:** Built-in Underscore mix-ins (`groupBy`, `partition`, `sortBy`) rewritten to leverage modern V8 optimizations and Async Iterators.

### 4. Nexus.Sync (The Dispatcher)
The bridge to the outside world.
* **Masterclass Logic:** A pluggable adapter system. Write your logic once and deploy it as a CLI tool (Node), a background task (Worker), or a web app (DOM).

---

## 🛠️ Quick Example: Isomorphic Data Scraper

Nexus-Core shines when you need to coordinate complex actions across a network.

```javascript
import { Collection, Model } from 'nexus-core';
import { AxiosAdapter } from 'nexus-core/adapters';

// Define a Model with an Axios-based transport
const Target = Model.extend({
  adapter: new AxiosAdapter({ baseURL: '[https://api.security-audit.io](https://api.security-audit.io)' })
});

// A Collection manages the "Swarm"
const targets = new Collection([], { model: Target });

// React to state changes anywhere in the system
targets.on('change:status', (model) => {
  console.log(`[Alert] Target ${model.id} shifted to ${model.status}`);
});

// Perform high-speed functional orchestration
await targets.fetch();
targets.chain()
  .filter(t => t.vulnerabilityScore > 7)
  .sortBy('priority')
  .each(t => t.probe()); // Automated Axios request triggered by the Model
```

## ⚡ Example: High-Concurrency Network Stress Testing (L7)

Nexus-Core is uniquely suited for building tools that require massive concurrency. In this example, we use a Collection to manage thousands of "Worker" models, each responsible for its own Axios-driven request cycle.

```javascript
import { Collection, Model } from 'nexus-core';
import { AxiosAdapter } from 'nexus-core/adapters';

/**
 * The AttackWorker model manages the lifecycle of a single connection.
 * It uses the 'immediate' utility to ensure event triggers don't block
 * the high-speed network loop.
 */
const AttackWorker = Model.extend({
  adapter: new AxiosAdapter({ timeout: 1000 }),
  
  async fire(targetUrl) {
    try {
      this.set({ status: 'requesting', lastSent: Date.now() });
      await this.sync('read', this, { url: targetUrl });
      this.set({ status: 'success' });
    } catch (e) {
      this.set({ status: 'failed', error: e.message });
      this.trigger('target:down', this);
    }
  }
});

/**
 * The Swarm Collection orchestrates thousands of workers.
 * It uses Underscore mix-ins to analyze success rates in real-time.
 */
const Swarm = Collection.extend({
  model: AttackWorker,
  
  analyzeHealth() {
    return this.chain()
      .countBy(worker => worker.status)
      .value(); // Returns { success: 4500, failed: 500, requesting: 200 }
  }
});

const mySwarm = new Swarm(Array(5000).fill({}));

// Reacting to global state changes across the entire swarm
mySwarm.on('target:down', (worker) => {
  console.error(`[System] Node ${worker.cid} reports target saturation.`);
});

// Launching the orchestrated stress test
mySwarm.each(worker => worker.fire('[https://internal-test-target.local](https://internal-test-target.local)'));
```

## 📑 Memory Management & Performance

Nexus-Core is built for "Headless" environments where memory leaks are fatal. By utilizing the **Listener Registry** pattern:

* **Bi-directional Tracking:** Every object knows who is listening to it and who it is listening to.
* **Automatic Cleanup:** When a Model is removed from a Collection, it can be configured to automatically `stopListening()` to all upstream sources.
* **Microtask Batching:** Events are batched using a `MessageChannel` or `MutationObserver` strategy to ensure the event loop remains responsive even during mass data mutations.

---

## 🤝 Contributing

We are building this library to be a masterclass in modern JavaScript architecture. We value:

* **Structural Integrity:** Keeping logic, state, and transport strictly decoupled.
* **Performance:** Minimizing overhead in the "Hot Path" of data mutation.
* **Readability:** Source code that is as educational as it is functional.

---

**License:** 
**Status:** Architecture Phase (Drafting Core Modules)
