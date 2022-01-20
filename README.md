# extension-agregore-render-json
Extension for rendering JSON data in Agregore

# json to html

```
 {}              =>  <dl></dl>
 []              =>  <ol></ol>
 { key, value }  =>  <dl>
                       <div>
                         <dt>key</dt>
                         <dd>value</dd>
                       </div>
                     </dl>
 [item]          =>  <ol>
                       <li>item<li>
                     </ol>
```