/* 
 * ES6 Enum implementation 
 */

function Enum(object) {
  return new Proxy(Object.freeze(object), Object.freeze({
    get: function(target, lookup) {
        const lookupByName = isNaN(parseInt(lookup, 10));
        const lookupByValue = !lookupByName;
        if (lookupByName) {
          const value = target[lookup]
          return value
        }
        if (lookupByValue) {
          const name = Object
            .fromEntries(
              Object
              .entries(target)
              .map(
                ([key, val]) => ([val, key])
              )
            )[lookup]
          return name
        }
    }
}))
}

const e = Enum({
  UNKNOWN: 0,
  OPEN: 1,
  CLOSED: 2
}, false)

console.log('by name: ' + e.CLOSED); // output: 2
console.log('by value: ' + e[2]);  // output: "OPEN"

console.log(`---`)

const ee = Enum({
  UNKNOWN: 0,
  FOO: 1,
  BAR: 2
}, true)

console.log('by name: ' + ee.FOO); // output: 1
console.log('by value: ' + ee[1]);  // output: "FOO"
