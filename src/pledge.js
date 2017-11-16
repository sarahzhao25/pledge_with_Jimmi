'use strict';
/*----------------------------------------------------------------
Promises Workshop: build the pledge.js ES6-style promise library
----------------------------------------------------------------*/
// YOUR CODE HERE:
function $Promise(executor) {
    if (typeof(executor) !== 'function') throw new TypeError('executor function');
    this._state = 'pending';
    this._handlerGroups = [];
    this._internalResolve = function(someData) {
        if (this._state === 'pending') {
            this._state = 'fulfilled';
            this._value = someData;
        }
        if (this._handlerGroups.length) this._callHandlers();
    };
    this._internalReject = function(reason) {
        if (this._state === 'pending') {
            this._state = 'rejected';
            this._value = reason;
        }
        if (this._handlerGroups.length) this._callHandlers();
    };
    executor(this._internalResolve.bind(this), this._internalReject.bind(this));
}

$Promise.prototype.then = function(success, error) {
    let groups = this._handlerGroups;
    if (typeof(success) !== 'function')
        success = null;
    if (typeof(error) !== 'function')
        error = null;
    groups.push({
        successCb: success,
        errorCb: error,
        downstreamPromise: new $Promise(function() {})
    });
    let p = groups[groups.length - 1].downstreamPromise;
    this._callHandlers();
    return p;
};

$Promise.prototype._callHandlers = function() {
    let groups = this._handlerGroups;
    let value = this._value;
    if (this._state === 'fulfilled') {
        groups.forEach(obj => {
            try {
                obj.downstreamPromise._internalResolve(obj.successCb(value));
            } catch (e) {
                if (e instanceof TypeError)
                    obj.downstreamPromise._internalResolve(value);
                else
                    obj.downstreamPromise._internalReject(e);
            }
        })
        this._handlerGroups = [];
    } else if (this._state === 'rejected') {
        groups.forEach(obj => {
            try {
                obj.downstreamPromise._internalResolve(obj.errorCb(value));
            } catch (e) {
                if (e instanceof TypeError)
                    obj.downstreamPromise._internalReject(value);
                else
                    obj.downstreamPromise._internalReject(e);
            }
            this._handlerGroups = [];
        })

    }
}
$Promise.prototype.catch = function(CALLBACK) {
    return this.then(null, CALLBACK);
}


/*-------------------------------------------------------
The spec was designed to work with Test'Em, so we don't
actually use module.exports. But here it is for reference:

module.exports = $Promise;

So in a Node-based project we could write things like this:

var Promise = require('pledge');
…
var promise = new Promise(function (resolve, reject) { … });
--------------------------------------------------------*/