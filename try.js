;((window, undefined) => {
window.initTry = window.initTry || initTry

function initTry(userCfg) {
  loadScript(`https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js`)
    .then(() => loadScript(`https://cdn.jsdelivr.net/npm/jquery.scrollto@2.1.2/jquery.scrollTo.min.js`))
    .then(() => loadScript(`https://cdn.jsdelivr.net/npm/swagger-ui-dist@3.48.0/swagger-ui-bundle.js`))
    .then(() => loadScript(`https://cdn.jsdelivr.net/npm/compare-versions@3.6.0/index.min.js`))
    .then(() => {
      const cfg = cfgHandle(userCfg)
      window.cfg = cfg
      if(cfg.onlySwagger) {
        initSwagger(cfg.swaggerOptions)
        $(`.swaggerBox`).addClass(`onlySwagger`)
      } else {
        Redoc.init(...cfg.redocOptions)
      }
      initCss()
    })
    .catch(() => {
      console.error('Something went wrong.')
    })
}

function cfgHandle(userCfg) {
  if (typeof userCfg === `string`) {
    userCfg = { openApi: userCfg };
  }
  const { redocOptions } = userCfg;
  const testOpenApi = `https://httpbin.org/spec.json`; // `https://petstore.swagger.io/v2/swagger.json`
  const redocOptionsRes = dataType(redocOptions, `object`)
    ? [undefined, redocOptions]
    : redocOptions || [];
  const [redoc_openApi, redoc_options, redoc_dom, redoc_callBack] =
    redocOptionsRes;
  const redocVersion = (( // Read the redoc version number from the label
    $(`script[src*="/redoc@"]`).attr(`src`) || ``
  ).match(/redoc@(.+?)\//) || [])[1];
  const cfg = {
    openApi: testOpenApi,
    onlySwagger: false, // Only render swagger, in some cases redoc will render openApi error
    tryText: `try it `, // try button text
    trySwaggerInApi: true, // Is the swagger debugging window displayed under the api? true: yes, false: displayed after the request, when the request is relatively large, you may not see the debugging window
    redocVersion,
    authBtnPosSelector: `h1:eq(0)`,
    authBtnText: `AUTHORIZE`,
    pure: false, // Concise mode, hide some existing elements of redoc

    ...userCfg,
    swaggerOptions: {
      url: userCfg.openApi || testOpenApi,
      dom_id: `#swagger-ui`,
      onComplete: () => {
        if (Boolean(cfg.onlySwagger) === false) {
          trySwagger(cfg);
        }
      },
      tryItOutEnabled: true,
      ...userCfg.swaggerOptions,
    },
    redocOptions: [
      redoc_openApi || userCfg.openApi || testOpenApi,
      redoc_options || { enableConsole: true },
      redoc_dom || document.getElementById("redoc-container"),
      () => {
        redoc_callBack && redoc_callBack();
        initSwagger(cfg.swaggerOptions);
        $(`.swaggerBox`).addClass(`hide`);
        cfg.pure && $(`.swaggerBox`).addClass(`pure`);
      },
    ],
  };
  return cfg;
}

function initCss() {
  // reset swagger-ui css
  $("head").append(`
    <style>
    .tryBtn{
          margin-right: 2%;
    background-color: black;

    font-size: 18px;
    cursor: pointer;
    color: white;
    border: 0.5px dashed #f93e3e;
    }
      /* Set the position of swaggerBox with body as the relative element */
      body {
        position: relative;
      }
      @media print, screen and (max-width: 85rem) {
        .eIeJha,
        .dtUibw {
          padding: 4px;
        }
      }

      .swaggerBox.hide {
        visibility: hidden;
        cursor: none;
        width: 0;
        height: 0;
      }
      .swaggerBox.show {
        visibility: visible;
        cursor: initial;
      }

      /* Reset the style of swagger-ui */
      .swaggerBox .swagger-ui .wrapper {
        padding: 0;
      }

      /* Disable api bar to avoid problems */
      .swaggerBox:not(.onlySwagger) .swagger-ui .opblock .opblock-summary {
        cursor: not-allowed;
        pointer-events: none;
      }

      /* Disable the api bar, but exclude the authorization button */
      .swaggerBox .swagger-ui .authorization__btn {
        cursor: initial;
        pointer-events: initial;
      }

      .swaggerBox {
        border-radius: 4px;
        background-color: #fff;
        width: 100%;
        height: 100vh;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
      }
      .swaggerBox:not(.onlySwagger) {
        overflow: hidden;
      }
      /* Hide some disturbing elements */
      .swaggerBox.pure:not(.onlySwagger) .swagger-ui .opblock-summary {
        visibility: hidden;
        padding: 0;
      }
      .swaggerBox.pure:not(.onlySwagger) .opblock-section thead,
      .swaggerBox.pure:not(.onlySwagger) .swagger-ui .opblock-summary * {
        display: none;
      }

      .swaggerBox:not(.onlySwagger) .swagger-ui .opblock .opblock-section-header,
      .swaggerBox:not(.onlySwagger) .btn.cancel,
      .swaggerBox:not(.onlySwagger) .try-out,
      .swaggerBox:not(.onlySwagger) .responses-inner>div>h4,
      .swaggerBox:not(.onlySwagger) :not(.live-responses-table).responses-table,
      .swaggerBox:not(.onlySwagger) .opblock-body > .opblock-description-wrapper {
        display: none;
      }

      .swaggerBox .tryBtn {
        margin-right: 10px;
        background-color: #fff;
      }
    </style>
  `);
}

function initSwagger(swaggerOptions) {
  // dom
  $('body').append(`
    <div class="swaggerBox">
      <div id="swagger-ui"></div>
    </div>
  `)
  // swagger-ui.css
  $('head').append(`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3.25.1/swagger-ui.css" />`)
  SwaggerUIBundle(swaggerOptions)
}

function trySwagger(cfg) {
  { // Add a button to set auth to redoc
    $(cfg.authBtnPosSelector).after($(`
      <div class="${$(`a[download]:eq(0)`).attr(`class`)} btn setAuth">` + cfg.authBtnText + `</div>
    `))
    $(`.btn.setAuth`).click(() => {
      // The pop-up window in swaggerBox can be displayed, but the swaggerBox itself is hidden
      const $swaggerBox = $(`.swaggerBox`)
        .removeClass(`hide`)
        .css({
          visibility: `hidden`,
          height: ``,
          left: ``,
          top: ``,
          width: ``,
        })
      $(`.swagger-ui .auth-wrapper .authorize.unlocked`).click() // Open the pop-up window for setting auth
      const $modal = $(`.swagger-ui .dialog-ux .modal-ux`)
      $modal.css({ visibility: `visible` })
      $(`.swagger-ui .auth-btn-wrapper .btn-done, .swagger-ui .dialog-ux .modal-ux-header .close-modal`).click(() => {
        $swaggerBox.addClass(`hide`).css({ visibility: `` })
        $modal.css({ visibility: `` })
      });
    })
  }

  // Add try button
  $(`.http-verb`).before(`
    <button class="tryBtn">${cfg.tryText}</button>
  `)
  $(`.tryBtn`).click(function (event) {
    event.stopPropagation()
    const $tryBtn = $(this)
    $(`.swaggerShadow`).remove() // First clear all temporary elements
    const $operation = $tryBtn.parents(`[data-section-id]`) // Get the outermost api box
    if ($operation.hasClass(`try`) === true) { // If the current API is already in the try state, uninstall and exit the function
      $(`.swaggerBox`).addClass(`hide`).removeClass(`show`)
      $operation.removeClass(`try`)
      return false
    }
    $(`[data-section-id]`).removeClass(`try`) // Delete the try class name of all other APIs
    $operation.addClass(`try`) // Add try class name to the currently clicked api

    // The following 3 lines add class names to some necessary elements to facilitate acquisition or identification
    $(`.try>div>div:nth-child(2)`).addClass(`apiBlock`)
    $(`.try .apiBlock>div:nth-child(1)`).addClass(`fullApiBox`)
    if(window.cfg.redocVersion !== 'next' && window.compareVersions.compare(window.cfg.redocVersion, `2.0.0-rc.32`, `<=`)) {
      $(`.try .apiBlock>div>div:nth-child(1)`).addClass(`fullApi`)
    } else {
      $(`.try .apiBlock>div>button`).addClass(`fullApi`)
    }
    const appendSwaggerShadow = () => $(`.try .fullApiBox`).append(`<div class="swaggerShadow"></div>`) // Add a swaggerShadow element to synchronize the height of swagger and use it to occupy space
    // If cfg.trySwaggerInApi === true then swaggerShadow will be added under fullApi, otherwise it may be under reqBox
    if (cfg.trySwaggerInApi === true) {
      appendSwaggerShadow()
    } else {
      const requestSel = `.try .apiBlock h3`
      $(requestSel).parent().addClass(`reqBox`)
      if ($(requestSel).length && $(requestSel).text().includes(`Request`)) {
        $(`.try .reqBox`).append(`<div class="swaggerShadow"></div>`)
      } else {
        appendSwaggerShadow()
      }
    }

    // get the click method and api
    const fullApi = $(`.try .fullApi`).text().replace(cfg.tryText, '').trim()
    const [, method, api] = fullApi.match(/(\w+)(.*)/)

    // Get the position of swaggerShadow
    let pos = {}
    pos = getAbsolutePosition($(`.try .swaggerShadow`)[0])
    pos = Object.keys(pos).reduce((prev, cur, index) => { // Add px to the number without unit, undefined when the number is 0
      const val = pos[cur]
      return {
        ...prev,
        [cur]: typeof (val) === `number` ? (val > 0 ? `${val}px` : undefined) : val,
      }
    }, {})

    let oldHeight = pos.height ? `${pos.height}` : undefined

    // Move swagger to the position of swaggerShadow
    const getSwaggerBoxHeight = () => getAbsolutePosition($(`.swaggerBox`)[0]).height + `px`
    $(`.swaggerBox`).css({
      left: `${pos.left}`,
      top: `${pos.top}`,
      width: `${pos.width}`,
      height: oldHeight,
    }).removeClass(`hide`).addClass('show')

    // Synchronize the size of swaggerShadow to make it as big as swaggerBox
    $(`.swaggerShadow`).css({
      height: getSwaggerBoxHeight()
    })

    // scroll the swagger view to the same api position
    const selStr = `.opblock-summary-${method} [data-path="${api}"]`
    const $swaggerApiDom = $(selStr)
    const $opblock = $swaggerApiDom.parents(`.opblock`) // Get the currently clicked swagger api, and it is not an expanded element
    if ($opblock.hasClass(`open`) === false) {
      $swaggerApiDom.click() // turn on
    }
    $opblock.addClass(`open`)
    console.log(`selStr`, selStr)
    $(`.swaggerBox`).scrollTo($swaggerApiDom.parent())
    function changeFn() {
      const pos = getAbsolutePosition($opblock[0])
      if (pos.height === 0) {
        return false; // The height is 0, no processing
      } else {
        let newHeight = `${pos.height}px`
        if (oldHeight !== newHeight) {
          $(`.swaggerBox`).scrollTo($swaggerApiDom.parent())
          $(`.swaggerBox`).css({
            height: newHeight,
          })
          $(`.swaggerShadow`).css({
            height: getSwaggerBoxHeight()
          })
          oldHeight = newHeight
        }
      }
    }
    changeFn()
    const observer = new MutationObserver(changeFn)
    observer.disconnect()
    observer.observe($opblock[0], {
      attributes: true,
      childList: true,
      subtree: true,
    })
  })

  // When changing the browser window size, reset the state of swaggerBox
  $(window).resize(debounce(() => {
    $(`.swaggerBox`).addClass(`hide`).removeClass(`show`).css({ left: 0, top: 0 })
    $(`[data-section-id^="operation/"]`).removeClass(`try`)
  }, 500))
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.onload = resolve
    script.onerror = reject
    script.src = src
    document.head.append(script)
  })
}

function debounce(fn, wait) { // anti-shake
  let timer = null
  return function () {
    if (timer !== null) {
      clearTimeout(timer)
    }
    timer = setTimeout(fn, wait)
  }
}

function getAbsolutePosition(domObj) { // Get element position and size
  // If the function has no value, the return object is empty
  if (!domObj) return null;
  const width = domObj.offsetWidth
  const height = domObj.offsetHeight
  // Start traversing outward from the target element, accumulate top and left values
  let top
  let left
  for (top = domObj.offsetTop, left = domObj.offsetLeft; domObj = domObj.offsetParent;) {
    top += domObj.offsetTop
    left += domObj.offsetLeft
  }
  const right = document.body.offsetWidth - width - left
  const bottom = document.body.offsetHeight - height - top

  // Returns the coordinate set of positioned elements
  return { width, height, top, left, right, bottom }
}

function dataType(data, type) {
  const dataType = Object.prototype.toString.call(data).match(/\s(.+)]/)[1].toLowerCase()
  return type ? (dataType === type.toLowerCase()) : dataType
}
})(window);
