(function()
{
    "use strict";

    Array.prototype.indexOf = Array.prototype.indexOf || function(value)
    {
        return $.inArray(value, this);
    };
    
    function Container(parent)
    {
        this.initialize(parent);
    }

    window.Container = Container;

    Container.prototype = {
        constructor: Container,

        initialize: function(parent)
        {
            this._aliases = {};
            this._instances = {};
            this._dataStore = {};
            this._parent = parent || null;
        },

        alias: function(alias, key)
        {
            this._aliases[alias] = key;

            return this;
        },

        _resolveAlias: function(key)
        {
            if(this._aliases.hasOwnProperty(key))
            {
                return this._aliases[key];
            }

            return key;
        },

        set: function(key, value, shared, protect)
        {
            var dataStore = this._dataStore,
                callback;

            if(dataStore.hasOwnProperty(key) && dataStore[key].protect)
            {
                throw new Error('Key ' + key + ' is protected and can\'t be overwritten.');
            }
            
            if(typeof value !== 'function')
            {
                callback = function()
                {
                    return value;
                };
            }
            else
            {
                callback = value;
            }

            dataStore[key] = {
                callback: callback,
                shared: Boolean(shared), // singleton
                protect: Boolean(protect) // write protect
            };

            return this;
        },

        _getRaw: function(key)
        {
            key = this._resolveAlias(key);

            if(this._dataStore.hasOwnProperty(key))
            {
                return this._dataStore[key];
            }
            else if(this._parent instanceof Container)
            {
                return this._parent._getRaw(key);
            }

            return null;
        },

        get: function(key, forceNew)
        {
            var raw = this._getRaw(key);

            if(raw === null)
            {
                throw new Error('Key ' + key + ' has not been registered with the container.');
            }

            if(raw.shared)
            {
                if(!this._instances.hasOwnProperty(key) || forceNew)
                {
                    this._instances[key] = raw.callback.call(this);
                }

                return this._instances[key];
            }

            return raw.callback.call(this);
        },

        protect: function(key, callback, shared)
        {
            return this.set(key, callback, shared, true);
        },

        share: function(key, callback, protect)
        {
            return this.set(key, callback, true, protect);
        },

        exists: function(key)
        {
            return Boolean(this._getRaw(key));
        },

        createChild: function()
        {
            return new Container(this);
        },

        register: function(className, callback)
        {
            this.set('Class:' + className, callback, true, true);
            this.set(className, function()
            {
                var constructor = this.get('Class:' + className);

                if(typeof constructor !== 'function')
                {
                    throw new Error(className + ' is not a function!');
                }

                return new constructor;
            }, true);

            return this;
        }
    };

})();

