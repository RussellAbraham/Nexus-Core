import Events from './events.js';
import Model from './model.js';

export default class Collection extends Events {
  constructor(models = [], options = {}) {
    super();
    this.models = [];
    this._byId = new Map();
    this.model = options.model || Model; // Allow custom Model classes

    if (models.length) {
      this.reset(models, { silent: true });
    }
    
    this.initialize(models, options);
  }

  initialize() {}

  /**
   * Add a model (or array of models) to the collection.
   */
  add(models, options = {}) {
    const isArray = Array.isArray(models);
    const nodes = isArray ? models : [models];
    
    for (let data of nodes) {
      // 1. Transform raw object to Model instance if necessary
      let model = data instanceof Model ? data : new this.model(data);

      // 2. Prevent duplicates
      if (this._byId.has(model.id) || this._byId.has(model.cid)) continue;

      // 3. Setup internal references
      this.models.push(model);
      if (model.id) this._byId.set(model.id, model);
      this._byId.set(model.cid, model);

      // 4. Event Bubbling: Collection listens to the Model
      this.listenTo(model, 'all', this._onModelEvent);

      if (!options.silent) this.trigger('add', model, this);
    }

    return isArray ? nodes : nodes[0];
  }

  /**
   * Get a model by ID or CID.
   */
  get(id) {
    if (id == null) return void 0;
    return this._byId.get(id?.id || id?.cid || id);
  }

  /**
   * Internal proxy for bubbling events from models up to the collection.
   */
  _onModelEvent(event, model, ...args) {
    // If a model's ID changes, update our internal map
    if (event === 'change:id') {
      const prevId = args[1];
      if (prevId) this._byId.delete(prevId);
      if (model.id) this._byId.set(model.id, model);
    }
    
    // Re-trigger the event on the collection
    this.trigger(event, model, ...args);
  }

  /**
   * Replace the entire collection with new data.
   */
  reset(models, options = {}) {
    this.models.forEach(m => this.stopListening(m));
    this.models = [];
    this._byId.clear();
    
    this.add(models, options);
    if (!options.silent) this.trigger('reset', this);
    return this;
  }

  toJSON() {
    return this.models.map(m => m.toJSON());
  }

  // --- Baseline "Array-like" Helpers ---

  get length() {
    return this.models.length;
  }

  at(index) {
    return this.models[index];
  }

  // For review: do we need a set as robust as backbones?
  /**
   * Smartly updates the collection with a list of models.
   * Performs a "diff": adds new, updates existing, and removes missing.
   */
  set(models, options = {}) {
    const nodes = Array.isArray(models) ? models : [models];
    const toRemove = new Set(this._byId.keys());
    const result = [];

    for (let data of nodes) {
      const id = data.id || data.cid;
      let existing = this.get(id);

      if (existing) {
        // Update existing: use the Model's set method
        existing.set(data instanceof Model ? data.attributes : data);
        toRemove.delete(existing.id);
        toRemove.delete(existing.cid);
        result.push(existing);
      } else {
        // Add new
        result.push(this.add(data, options));
      }
    }

    // Remove models that weren't in the new list
    if (options.remove !== false) {
      for (const id of toRemove) {
        const model = this._byId.get(id);
        if (model) this.remove(model, options);
      }
    }

    return result;
  }

  /**
   * Remove a model from the collection.
   */
  remove(models, options = {}) {
    const nodes = Array.isArray(models) ? models : [models];
    for (let model of nodes) {
      model = this.get(model);
      if (!model) continue;

      this._byId.delete(model.id);
      this._byId.delete(model.cid);
      this.models = this.models.filter(m => m !== model);
      
      this.stopListening(model);
      if (!options.silent) this.trigger('remove', model, this);
    }
    return nodes;
  }
  
}
