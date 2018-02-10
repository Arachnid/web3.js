"use strict";
var Contract = require('web3-eth-contract');
var namehash = require('eth-ens-namehash');
var _ = require('underscore');
var ENS_ABI = require('./ressources/ens-abi.js');
var RESOLVER_ABI = require('./ressources/resolver-abi.js');

/**
 * A wrapper around the ENS registry contract.
 *
 * @method ENSRegistry
 * @constructor
 * @param {Object} ens
 */
var ENSRegistry = function ENSRegistry(ens) {
	this._ens = ens;
	this._contract = ens.checkNetwork().then(function (address) {
		return new Contract(ENS_ABI, address);
	});
};

/**
 * Returns the address of the owner of an ENS name.
 *
 * @method owner
 * @constructor
 * @param {string} name
 * @param {Function} optional callback
 * @return {Function} a promise
 */
ENSRegistry.prototype.owner = function owner(name, callback) {
	return this._contract
		.then(function(contract) {
			return contract.methods.owner(namehash.hash(name)).call();
		}, function(err) {
			if(_.isFunction(callback)) callback(err);
			throw err;
		});
};

/**
 * Returns the resolver contract associated with a name.
 *
 * @method owner
 * @constructor
 * @param {string} name
 * @param {Function} optional callback
 * @return {Function} a promise that yields a resolver contract instance
 */
ENSRegistry.prototype.resolver = function resolver(name, callback) {
	var node = namehash.hash(name);

	return this._contract
		.then(function(contract) {
			return contract.methods.resolver(node).call();
		})
		.then(function(addr) {
			var contract = new Contract(RESOLVER_ABI, addr);
			_.each(contract.methods, function(method, name) {
				if(name === 'supportsInterface') return;
				contract.methods[name] = _.partial(method, node);
			});

			if(_.isFunction(callback)) callback(null, contract);
			return contract;
		}, function(err) {
			if(_.isFunction(callback)) callback(err);
			throw err;
		});
};

module.exports = ENSRegistry;
