import Events from './events.js';
import { uniqueId } from './utils/id.js';

export default class Model extends Events {
  constructor(attributes = {}) {
    super();
    this.cid = uniqueId();
    this.attributes = {};
    this._previousAttributes = {};
    this._isDirty = false;

    // The Proxy: This is the "Magic" layer
    return new Proxy(this, {
      set(target, prop, value) {
        // 1. Check if we are setting a core property (like .cid or .attributes)
        // If it's a private or internal property, just set it normally.
        if (prop.startsWith('_') || prop in target || prop === 'id') {
          target[prop] = value;
          return true;
        }

        // 2. Logic for data attributes
        const prevValue = target.attributes[prop];
        if (prevValue !== value) {
          target._previousAttributes = { ...target.attributes };
          target.attributes[prop] = value;
          
          // 3. Trigger events
          target.trigger(`change:${prop}`, value, prevValue);
          target.trigger('change', target);
        }
        
        return true;
      },
      
      get(target, prop) {
        // If it's in the Model class (like .on() or .save()), return that
        if (prop in target) return target[prop];
        
        // Otherwise, look in the attributes
        return target.attributes[prop];
      }
    });
  }

  /**
   * Return a shallow copy of attributes for JSON strings.
   */
  toJSON() {
    return { ...this.attributes };
  }

  /**
   * Reset state to a specific object.
   */
  set(obj) {
    for (const [key, val] of Object.entries(obj)) {
      this[key] = val; // Triggers the Proxy setter
    }
    return this;
  }
}
