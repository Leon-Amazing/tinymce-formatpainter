/* formatpainter
 * @Author: Created by Leon
 * @Date: 2022-11-22 15:53:36
 */

let pluginName = '格式刷',
    toggleState = false,
    wrapDom = null,
    mapStyle = [];

function parseVNode(vnode) {
    let _node = null;
    _node = document.createElement(vnode.name.toLowerCase());
    vnode.style && (_node.style.cssText = vnode.style);
    // 子元素
    let children = vnode.children;
    if (children) {
        _node.appendChild(parseVNode(children));
    }
    return _node;
}

function getDeepestNode(element) {
    while (element.firstElementChild) {
        element = (element).firstElementChild;
    }
    return element;
}

function getNewNode(currentContainer, text) {
    const newMap = mapStyle.reduce((pre, cur, i) => {
        return {
            ...cur,
            ...(i > 0 ? { 'children': { ...pre } } : {}),
        };
    }, {})
    const parent = parseVNode(newMap);
    getDeepestNode(parent).innerHTML = text;
    return parent;
}

tinymce.PluginManager.add("formatpainter", function (editor, url) {
    /* 图标 */
    editor.ui.registry.addIcon('format-brush', '<svg t="1669195029868" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5149" width="25" height="20"><path d="M917.333333 960c0 23.466667-19.2 42.666667-42.666666 42.666667H149.333333c-23.466667 0-42.666667-19.2-42.666666-42.666667V535.466667c0-70.4 59.733333-130.133333 130.133333-130.133334H384V149.333333c0-70.4 57.6-128 128-128s128 57.6 128 128v256h147.2c72.533333 0 130.133333 59.733333 130.133333 130.133334V960z m-85.333333-384v-40.533333c0-25.6-21.333333-44.8-44.8-44.8H236.8C213.333333 490.666667 192 512 192 535.466667V576h640z m0 341.333333V661.333333H192v256h85.333333v-85.333333c0-23.466667 19.2-42.666667 42.666667-42.666667s42.666667 19.2 42.666667 42.666667v85.333333h106.666666v-42.666666c0-23.466667 19.2-42.666667 42.666667-42.666667s42.666667 19.2 42.666667 42.666667v42.666666h277.333333zM469.333333 149.333333v256h85.333334V149.333333c0-23.466667-19.2-42.666667-42.666667-42.666666s-42.666667 19.2-42.666667 42.666666z" fill="#2c2c2c" p-id="5150" data-spm-anchor-id="a313x.7781069.0.i11" class="selected"></path></svg>');

    /* 获取原标签和样式映射 */
    const _onAction = () => {
        mapStyle = [];
        let index = 0;
        if (!editor.selection.getContent()) {
            return;
        }
        let currentContainer = editor.selection.getRng().startContainer.parentNode;
        const dom = editor.dom;
        isEnd = () => {
            return (currentContainer.nodeName === "BODY" || currentContainer.nodeName === "HTML" || currentContainer.nodeName === "#document" || currentContainer.id === 'js_content');
        }
        while (currentContainer && !isEnd()) {
            currentName = currentContainer.nodeName;
            if (currentName === 'SECTION') {
                index++
            }
            if (index <= 2) {
                currentSty = dom.getAttrib(currentContainer, 'style');
                mapStyle.push({
                    name: currentName,
                    style: currentSty,
                })
            }
            currentContainer = currentContainer.parentNode;
        }

        if (mapStyle.length) {
            // 自定义鼠标光标
            wrapDom = currentContainer;
            const svgIcon = `<svg t="1669193356853" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3595" width="32" height="32"><path d="M345.9 413.7l263.2 300.6 140-133.3-253.3-303.2zM837.4 329.8l-73.3-83.7-173.5 110L714 496z" fill="#446EB1" p-id="3596"></path><path d="M340.9 448.6s-146.6 70-223.3 41.7l318.2 403.2s115-164.9 138.3-166.6L340.9 448.6z" fill="#E1F0FF" p-id="3597"></path><path d="M555.1 751.1c8.6-10 17.6-20.4 25.2-28.6L342.9 439.3l-5.2 2.5c-1.4 0.7-144.7 68.3-217.4 41.4l-25-9.2 341 432.1 5.8-8.3c0.3-0.4 28.3-40.6 59.1-80.9 17.1-22.4 30.4-38.8 40.6-50.7 5.1-6.2 9.6-11.1 13.3-15.1z m-64.8 55.1c-23 30.2-44.8 60.5-54.8 74.7L137.1 502.8c72.5 10.9 176.8-33.7 201.7-45l223.4 266.5c-5.7 4-13.5 11.3-25.1 24.3-12.6 14-28.3 33.4-46.8 57.6z" fill="#6D9EE8" p-id="3598"></path></svg>`;
            const iconUrl = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgIcon)));
            wrapDom && (wrapDom.style.cursor = 'url(' + iconUrl + ') 24 24,auto');
            toggleState = true;
        }
    }

    /* 处理要格式化的所有内容 */
    const selectionchange = () => {
        if (toggleState === true) {
            // 要格式化的所有内容
            const blocks = editor.selection.getSelectedBlocks();
            for (let index = 0; index < blocks.length; index++) {
                const current = blocks[index];
                const outNode = current.parentNode;
                const next = current.nextElementSibling;
                let currentContainer = current.firstChild;
                const text = current.innerText.trim();
                if (text) {
                    const newNode = getNewNode(currentContainer, text);
                    current.remove();
                    outNode.insertBefore(newNode, next);
                }
            }
            // 光标放到内容最后面
            editor.selection.select(editor.getBody(), true);
            editor.selection.collapse(false);
            // 添加历史记录，方便撤回
            tinymce.activeEditor.undoManager.add();
            // 复原光标
            wrapDom && (wrapDom.style.cursor = 'text');
            toggleState = false;
        }
    };

    /* 工具栏按钮 */
    editor.ui.registry.addToggleButton('formatpainter', {
        icon: 'format-brush',
        tooltip: pluginName,
        onAction: _onAction,
        onSetup: (api) => {
            api.setActive(toggleState);
            editor.on("mouseup", selectionchange);
            return () => editor.off("mouseup", selectionchange);
        }
    });
});
