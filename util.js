module.exports = {
  isNumber,
  isString,
  isObject,
  isArray,
  isBoolean
}

function isNumber (n) {
  return typeof n === 'number'
}

function isString (s) {
  return !!(typeof s === 'string' || s instanceof String)
}

function isObject (o) {
  return !!(typeof o === 'object' && o !== null)
}

function isArray (a) {
  return Array.isArray(a)
}

function isBoolean (b) {
  return !!(b === true || b === false || toString.call(b) === '[object Boolean]')
}
