const { createVDOMElement } = require('./virtual-dom')
const { isNumber, isString, isObject, isBoolean, isArray } = require('./util')

module.exports = { walk }

/**
 *  {}              =>  <dl></dl>
 *  []              =>  <ol></ol>
 *  { key, value }  =>  <dl>
 *                        <div>
 *                          <dt>key</dt>
 *                          <dd>value</dd>
 *                        </div>
 *                      </dl>
 *  [item]          =>  <ol>
 *                        <li>item<li>
 *                      </ol>
 */
function walk (data) {
  const type = valueType(data)
  const children = []

  /** iterate over object and array keys */
  for (const key in data) {
    const value = data[key]
    const childType = valueType(value)

    const arrayFollowsProperty = type === 'object' && childType === 'array'
    const objectFollowsProperty = type === 'object' && childType === 'object'

    /** walk child array values and child object values */
    if (childType === 'array' || childType === 'object') {
      if (arrayFollowsProperty) {
        /** e.g. { property: [] } => <dt>property</dt><ol>...</ol> */
        const dt = createVDOMElement('dt', { className: 'ml-6 text(bracket)' }, [key])
        children.push(dt)
        children.push(walk(value))
      } else if (objectFollowsProperty) {
        /** e.g. { property: {} } => <dt>property</dt><dl>...</dl> */
        const dt = createVDOMElement('dt', { className: 'ml-6 text(brace)' }, [key])
        children.push(dt)
        children.push(walk(value))
      } else children.push(walk(value))
    }

    /** render object values wrapped in divs */
    if (type === 'object') {
      /**
         * key, value pairs of object wrapped in div
         * e.g. { age: 99 } => <div><dt>age</dt><dd>99</dd></div>
         * */
      const dt = createVDOMElement('dt', { className: 'text(secondary)' }, [key])
      const dd = createVDOMElement('dd', { className: 'text(primary)' }, [value])
      const div = createVDOMElement('div', { className: 'ml-6 flex space-x-4' }, [dt, dd])
      children.push(...[div])
    }

    /** render array values */
    if (type === 'array') {
      /** array values e.g. [1, 2, 3]
         * <ol>
         *  <li>1</li>
         *  <li>2</li>
         *  <li>3</li>
         * </ol> */
      const li = createVDOMElement('li', { className: 'ml-6 text(primary)' }, [value])
      children.push(li)
    }
  }

  /** render object */
  if (type === 'object') {
    /** open and close object e.g. { age: 99 }
     *  <p>{</p>
     *    <dl>
     *      <div>
     *        <dt>age</dt>
     *        <dd>99</dd>
     *      </div>
     *    </dl>
     *  <p>}</p>
     */
    const openBrace = createVDOMElement('p', { className: 'text(brace)' }, ['{'])
    const closeBrace = createVDOMElement('p', { className: 'text(brace)' }, ['}'])
    const dl = createVDOMElement('dl', { className: 'ml-6 text(secondary)' }, [openBrace, ...children, closeBrace])
    return dl
  }
  /** render array */
  if (type === 'array') {
    /** open and close array e.g. [1, 2, { age: 99 }]
     *  <ol>
     *    <li>1</li>
     *    <li>2</li>
     *    <p>{</p>
     *      <dl>
     *        <div>
     *          <dt>age</dt>
     *          <dd>99</dd>
     *       </div>
     *      </dl>
     *   <p>}</p>
     *  </ol>
    */
    const openBracket = createVDOMElement('p', { className: 'text(bracket)' }, ['['])
    const closeBracket = createVDOMElement('p', { className: 'text(bracket)' }, [']'])
    const ol = createVDOMElement('ol', { className: 'ml-6 text(text)' }, [openBracket, ...children, closeBracket])
    return ol
  }
}

function valueType (data) {
  const type = isArray(data)
    ? 'array'
    : isObject(data)
      ? 'object'
      : isString(data)
        ? 'string'
        : isNumber(data)
          ? 'number'
          : isBoolean(data)
            ? 'boolean'
            : null
  return type
}
