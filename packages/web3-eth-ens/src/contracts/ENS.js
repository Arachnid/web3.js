"use strict";
var _ = require('underscore');
var ENSRegistry = require('./contracts/ENSRegistry.js');
var ENS_ADDRESSES = require('./config.js');

/**
 * Constructs a new ENS instance.
 *
 * @method ENS
 * @constructor
 * @param {Object} eth
 */
var ENS = function ENS(eth) {
	this._eth = eth;
};

/**
 * Checks that the current network supports ENS and is synced. Throws an error if not.
 *
 * @method checkNetwork
 * @param {Function} callback
 * @return The address of the ENS registry, if present on this network and if
 *         the node is synced.
 */
ENS.prototype.checkNetwork = function checkNetwork(callback) {
	var eth = this._eth;
	return eth.getBlock('latest').then(function(block) {
		var headAge = new Date() / 1000 - block.timestamp;
		if(headAge > 3600) {
			throw new Error("Network not synced; last block was " + headAge + " seconds ago");
		}
		return eth.net.getNetworkType();
	})
		.then(function(networkType) {
			var addr = ENS_ADDRESSES[networkType];
			if(addr === undefined) {
				throw new Error("ENS is not supported on network " + networkType);
			}
			if(_.isFunction(callback)) callback(null, addr);
			return addr;
		})
		.catch(function(err) {
			if(_.isFunction(callback)) callback(err);
			throw err;
		});
};

Object.defineProperty(ENS.prototype, 'registry', {
	get: function(){
		return new ENSRegistry(this);
	},
	enumerable: true
});

/**
 * Gets the address record associated with a name.
 *
 * @method address
 * @param {string} name
 * @param {Function} optional callback
 * @return {Function} a promise
 */
ENS.prototype.getAddress = function getAddress(name, callback) {
	return this.registry.resolver(name).then(function(resolver) {
		return resolver.methods.addr().call(callback);
	}, function(err) {
		if(_.isFunction(callback)) callback(err);
		throw err;
	});
};

module.exports = ENS;
