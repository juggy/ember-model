function NIL() {}

Ember.Model.Store = Ember.Object.extend({

  modelFor: function(type) {
    return Ember.getOwner(this)._lookupFactory('model:'+type);
  },

  adapterFor: function(type) {
    var adapter = this.modelFor(type).adapter,
        owner = Ember.getOwner(this);

    if (adapter && adapter !== Ember.Model.adapter) {
      return adapter;
    } else {
      adapter = owner._lookupFactory('adapter:'+ type) ||
                owner._lookupFactory('adapter:application') ||
                owner._lookupFactory('adapter:REST');

      return adapter ? adapter.create() : adapter;
    }
  },

  createRecord: function(type, props) {
    var klass = this.modelFor(type),
        attrs = Ember.merge({store: this}, props);
    klass.reopenClass({adapter: this.adapterFor(type)});
    Ember.setOwner(attrs, Ember.getOwner(this));
    return klass.create(attrs);
  },

  find: function(type, id) {
    if (arguments.length === 1) { id = NIL; }
    return this._find(type, id, true);
  },

  _find: function(type, id, async) {
    var klass = this.modelFor(type);

    // if (!klass.adapter) {
      klass.reopenClass({adapter: this.adapterFor(type)});
    // }

    if (id === NIL) {
      return klass._findFetchAll(async, this);
    } else if (Ember.isArray(id)) {
      return klass._findFetchMany(id, async, this);
    } else if (typeof id === 'object') {
      return klass._findFetchQuery(id, async, this);
    } else {
      return klass._findFetchById(id, async, this);
    }
  },

  _findSync: function(type, id) {
    return this._find(type, id, false);
  }
});

Ember.onLoad('Ember.Application', function(Application) {

  Application.initializer({
    name: "store",

    initialize: function(application) {
      var store = application.Store || Ember.Model.Store;
      application.register('store:application', store);
      application.register('store:main', store);

      application.inject('route', 'store', 'store:main');
      application.inject('controller', 'store', 'store:main');
    }
  });

});
