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
