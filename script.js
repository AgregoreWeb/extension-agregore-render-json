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
