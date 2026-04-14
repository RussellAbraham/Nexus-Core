import Events from './events.js';
import Model from './model.js';

/**
 * Nexus-Core: Collection
 * A managed, ordered set of Models. Acts as a smart wrapper around an array 
 * with O(1) lookups and automatic event bubbling.
 */
export default class Collection extends Events {
  constructor(models = [], options = {}) {
    super();
    
    // Internal storage for order (array) and speed (Map)
    this.models = [];
    this._byId = new Map();
    
    // Allow users to define a custom Model class for this collection
    this.model = options.model || Model;

    // If initial models are provided, perform a silent reset
    if (models.length) {
      this.reset(models, { silent: true });
    }
    
    this.initialize(models, options);
  }

  /**
   * Hook for custom logic after construction.
   */
  initialize() {}

  /**
   * Smart Update (The Reconciliation Engine):
   * This is the "Diffing" heart of the collection. It updates the state 
   * to match the provided data without destroying existing models.
   */
  set(models, options = {}) {
    const nodes = Array.isArray(models) ? models : [models];
    
    // Create a Set of all existing IDs to track which models are "missing" 
    // from the new data and should be removed.
    const toRemove = new Set(this._byId.keys());
    const result = [];

    for (let data of nodes) {
      // Find an existing model by ID or CID
      const id = data.id || data.cid || (data instanceof Model ? data.id || data.cid : null);
      let existing = this.get(id);

      if (existing) {
        // 1. UPDATE: Model already exists. Use the Model's Proxy setter.
        const attrs = data instanceof Model ? data.attributes : data;
        existing.set(attrs);
        
        // Remove from the purge list so it stays in the collection
        toRemove.delete(existing.id);
        toRemove.delete(existing.cid);
        result.push(existing);
      } else {
        // 2. ADD: Model is new to this collection.
        result.push(this.add(data, options));
      }
    }

    // 3. REMOVE: If the model wasn't in the incoming set, purge it.
    if (options.remove !== false) {
      for (const id of toRemove) {
        const model = this._byId.get(id);
        if (model) {
          this.remove(model, options);
          // Ensure we don't try to delete the same model twice via CID then ID
          toRemove.delete(model.id);
          toRemove.delete(model.cid);
        }
      }
    }

    return result;
  }

  /**
   * Adds a model or array of models.
   * Ensures every item is cast to a Model and starts bubbling events.
   */
  add(models, options = {}) {
    const nodes = Array.isArray(models) ? models : [models];
    const added = [];
    
    for (let data of nodes) {
      // Ensure we have a Model instance
      let model = data instanceof Model ? data : new this.model(data);

      // Prevent duplicate additions (Check by ID or CID)
      if (this._byId.has(model.id) || this._byId.has(model.cid)) continue;

      // Store references
      this.models.push(model);
      if (model.id) this._byId.set(model.id, model);
      this._byId.set(model.cid, model);

      // Event Bubbling: The collection listens to the model.
      // If the model screams 'change', the collection screams 'change'.
      this.listenTo(model, 'all', this._onModelEvent);
      added.push(model);

      if (!options.silent) this.trigger('add', model, this);
    }

    return Array.isArray(models) ? added : added[0];
  }

  /**
   * Removes a model from the collection.
   * Cleans up all listeners to prevent memory leaks (Zombies).
   */
  remove(models, options = {}) {
    const nodes = Array.isArray(models) ? models : [models];
    const removed = [];

    for (let model of nodes) {
      const target = this.get(model);
      if (!target) continue;

      // Clean up maps and array
      this._byId.delete(target.id);
      this._byId.delete(target.cid);
      this.models = this.models.filter(m => m !== target);
      
      // Stop listening to the model (Essential for GC)
      this.stopListening(target);
      removed.push(target);

      if (!options.silent) this.trigger('remove', target, this);
    }
    return Array.isArray(models) ? removed : removed[0];
  }

  /**
   * O(1) lookup utility.
   * Can accept an ID string, a CID, or a Model instance.
   */
  get(id) {
    if (id == null) return undefined;
    const lookup = typeof id === 'object' ? id.id || id.cid : id;
    return this._byId.get(lookup);
  }

  /**
   * Internal callback that handles events bubbling up from Models.
   */
  _onModelEvent(event, model, ...args) {
    // Special case: If a model gains an ID (e.g., after saving to DB),
    // we must update the collection's internal Map index.
    if (event === 'change:id') {
      const prevId = args[1];
      if (prevId) this._byId.delete(prevId);
      if (model.id) this._byId.set(model.id, model);
    }
    
    // Pass the event through the collection's emitter
    this.trigger(event, model, ...args);
  }

  /**
   * Wipes the collection clean and replaces it with new data.
   */
  reset(models, options = {}) {
    // Remove all listeners to prevent memory leaks
    this.models.forEach(m => this.stopListening(m));
    
    this.models = [];
    this._byId.clear();
    
    if (models) this.add(models, { silent: true });
    if (!options.silent) this.trigger('reset', this);
    
    return this;
  }

  /**
   * Returns a raw JSON array of all model attributes.
   */
  toJSON() {
    return this.models.map(m => m.toJSON());
  }

  /**
   * Proxy the length property of the internal array.
   */
  get length() {
    return this.models.length;
  }
}
