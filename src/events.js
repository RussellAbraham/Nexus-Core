import { uniqueId } from './utils/id.js';

/**
 * Internal helper for multiple event syntaxes.
 * Supports: 
 * on('change error', cb)
 * on({ 'change': cb, 'error': cb })
 */
const eventsApi = (target, name, callback, options) => {
  if (!name) return true;

  if (typeof name === 'object') {
    for (const key in name) {
      target.on(key, name[key], options);
    }
    return false;
  }

  if (/\s+/.test(name)) {
    const names = name.split(/\s+/);
    for (const n of names) {
      target.on(n, callback, options);
    }
    return false;
  }

  return true;
};

export default class Events {
  constructor() {
    this._events = new Map();
    this._listeners = new Map(); // Tracks objects this instance is listening to
    this._listenId = uniqueId();
  }

  /**
   * Bind a callback to an event.
   */
  on(name, callback, context) {
    if (!eventsApi(this, name, callback, context)) return this;
    if (!callback) return this;

    const handlers = this._events.get(name) || [];
    handlers.push({ 
      callback, 
      context, 
      ctx: context || this 
    });
    this._events.set(name, handlers);
    
    return this;
  }

  /**
   * Inversion of Control (IoC) listening.
   * Tells 'this' to listen to 'obj'. 'this' tracks the reference 
   * for automatic cleanup later.
   */
  listenTo(obj, name, callback) {
    if (!obj) return this;
    
    const id = obj._listenId || (obj._listenId = uniqueId());
    this._listeners.set(id, obj);
    
    obj.on(name, callback, this);
    return this;
  }

  /**
   * Remove bound callbacks. 
   */
  off(name, callback, context) {
    if (!eventsApi(this, name, callback, context)) return this;

    // No arguments: remove all tracked events
    if (!name && !callback && !context) {
      this._events.clear();
      return this;
    }

    const names = name ? [name] : Array.from(this._events.keys());
    for (const n of names) {
      const handlers = this._events.get(n);
      if (!handlers) continue;

      if (!callback && !context) {
        this._events.delete(n);
      } else {
        const remaining = handlers.filter(h => {
          return (callback && h.callback !== callback) || (context && h.context !== context);
        });
        
        remaining.length > 0 ? this._events.set(n, remaining) : this._events.delete(n);
      }
    }
    return this;
  }

  /**
   * The "Zombie Killer". 
   * Unbinds all events this object is listening to on other objects.
   */
  stopListening(obj, name, callback) {
    const listeners = this._listeners;
    if (!listeners) return this;

    const ids = obj ? [obj._listenId] : Array.from(listeners.keys());

    for (const id of ids) {
      const target = listeners.get(id);
      if (target) {
        target.off(name, callback, this);
        // If unbinding everything from this target, remove from map
        if (!name && !callback) listeners.delete(id);
      }
    }
    return this;
  }

  /**
   * Trigger callbacks for the given event name(s).
   */
  trigger(name, ...args) {
    if (!this._events) return this;
    
    const handlers = this._events.get(name);
    const allHandlers = this._events.get('all');

    if (handlers) this._fireInternal(handlers, args);
    if (allHandlers) this._fireInternal(allHandlers, [name, ...args]);

    return this;
  }

  /**
   * High-performance execution loop.
   */
  _fireInternal(handlers, args) {
    let i = -1;
    const len = handlers.length;
    while (++i < len) {
      const h = handlers[i];
      h.callback.apply(h.ctx, args);
    }
  }
}
