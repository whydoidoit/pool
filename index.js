var inherits = require('javascript-dual-inherit')
var isNumber = require('lodash/isNumber')
var Promise = require('bluebird')

function returnEmpty() {
    return {}
}

function noop() {
}

var Pool = inherits(function Pool(construction, reset, count) {
    if (isNumber(reset)) {
        count = reset
        reset = noop
    }
    reset = reset || noop
    this.construction = construction = construction || returnEmpty
    count = count || 1024
    for (let i = 0; i < count; i++) {
        this.push(construction())
    }
    this.reset = reset
    this.current = 0
    this.expectedCount = count
    this.minimumCount = Math.ceil(count / 4)
}, Array, function (_super, item) {
    _super.call(item)
})

Pool.prototype.get = function () {
    let result = this[this.current++ % this.length]
    this.reset.call(result, result)
    for (var i = 0; i < arguments.length; i += 2) {
        result[arguments[0 + i]] = arguments[1 + i]
    }
    return result
}

Pool.prototype.reserve = function () {
    var currentEntry = (this.current++ % this.length)
    var result = this[currentEntry]
    this.splice(currentEntry, 1)
    if (this.length < this.minimumCount) {
        for (var i = 0; i < this.minimumCount; i++) {
            this.push(this.construction())
        }
    }
    return result
}

Pool.prototype.return = function (item) {
    this.push(item)
}

var workingList = []

Pool.prototype.provide = function (number, fn) {
    var working
    if (workingList.length == 0) {
        working = []
    } else {
        working = workingList.pop()
    }
    working.length = 0
    for (var i = 0; i < number; i++) {
        working.push(this.reserve())
    }
    return Promise.resolve(fn.apply(null, working))
        .finally(function () {
            working.forEach(item => this.return(item))
            workingList.push(working)
        })
}

module.exports = Pool
