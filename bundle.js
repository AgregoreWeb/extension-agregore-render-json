(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/** global location */
if (document.contentType.includes('text/json')) {
  const { mountDOM } = require('./virtual-dom')
  const { walk } = require('./walk')

  // tailwind compilation by https://twind.dev/handbook/the-shim.html
  const script = document.createElement('script')
  script.setAttribute('defer', 'defer')
  script.setAttribute('type', 'module')
  script.innerHTML = `
  import { setup, disconnect } from 'https://cdn.skypack.dev/twind/shim'
  import { apply } from 'https://cdn.skypack.dev/twind'
  setup({
    target: document.body,
    theme: {
      colors: {
        primary: 'var(--ag-theme-primary)',       // purple
        secondary: 'var(--ag-theme-secondary)',   // green
        background: 'var(--ag-theme-background)', // black
        text: 'var(--ag-theme-text)',             // white
        bracket: 'var(--ag-theme-bracket)',       // light purple
        brace: 'var(--ag-theme-brace)',           // light green
      }
    },
    preflight: {
      body: apply('bg-background text(base secondary)'),
    },
  })
  `

  /**
   * todo: use the theme stylesheet from agregore
   * */
  const style = document.createElement('style')
  style.innerHTML = `
    :root {
      --ag-color-purple: #6e2de5;
      --ag-color-black: #111;
      --ag-color-white: #F2F2F2;
      --ag-color-green: #2de56e;
      --ag-theme-font-family: system-ui;
      --ag-theme-background: var(--ag-color-black);
      --ag-theme-text: var(--ag-color-white);
      --ag-theme-primary: var(--ag-color-purple);
      --ag-theme-secondary: var(--ag-color-green);
      --ag-theme-indent: 16px;
      --ag-theme-max-width: 666px;
      --ag-color-purple-light: #af8cf0;
      --ag-color-green-light: #7ef1a7;
      --ag-theme-bracket: var(--ag-color-purple-light);
      --ag-theme-brace: var(--ag-color-green-light);
    }
  `
  document.head.appendChild(style)

  let json
  let preElement
  try {
    preElement = document.querySelector('pre')
    json = preElement.innerText
  } catch (error) {
    console.warn(
      `extension-agregore-render-json: Error getting json content ${error}`
    )
  }

  const data = JSON.parse(json)
  const tree = walk(data)
  console.dir(tree)

  /**
   *  hide the body on load. twind will un-hide it when
   *  finished compiling and injecting styles. prevents FOUC.
   */
  document.body.setAttribute('hidden', 'hidden')

  const root = document.createElement('webview')
  root.setAttribute('id', 'content')
  root.setAttribute('class', 'text(primary)')
  mountDOM(tree, root)

  // show the raw json while implementing. todo: remove
  preElement.textContent = JSON.stringify(data, null, 2)
  preElement.setAttribute('class', 'm-6 text(base secondary)')
  document.body.insertBefore(root, preElement)

  // document.body.replaceChild(root, preElement)
  document.body.appendChild(script)
}

},{"./virtual-dom":3,"./walk":4}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
const { isString, isNumber } = require('./util')

module.exports = {
  createVDOMElement,
  mountDOM
}

function createVDOMElement (tag, config, children = []) {
  const { className } = config
  return {
    tag,
    className,
    props: {
      children
    },
    dom: null
  }
}

function mountDOM (content, parent) {
  if (isNumber(content) || isString(content)) mountVDOMText(content, parent)
  else mountVDOMElement(content, parent)
}

function mountVDOMText (text, parent) {
  parent.textContent = text
}

function mountVDOMElement (element, parent) {
  const { className, tag, props } = element
  const el = document.createElement(tag)
  element.dom = el
  if (props?.children) props.children.forEach(child => mountDOM(child, el))
  const classes = `${className}` // wrap with tw`...` calls ? strings seem fine actually...
  if (className) el.className = classes
  parent.appendChild(el)
}

},{"./util":2}],4:[function(require,module,exports){
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

},{"./util":2,"./virtual-dom":3}]},{},[1]);
