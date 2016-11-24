function HtmlNode (node) {

    if (typeof node === 'string') {

        var tmp = document.createElement('p');

        // ie8 bug
        tmp.innerHTML = node;
        node = tmp;

        this.noRoot = true;
    }

    this.rootNode = node;
}

HtmlNode.SafeNodeNames = /^(p|a|span|b|i|img)$/i;
HtmlNode.UnsafeNodeNames = /^(script|link|input|select|button|meta|style)$/i;

HtmlNode.EscapeMap = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;'
};

HtmlNode.escape = function (text) {

    return text.replace(/[<>&]/g, function (char) {

        return HtmlNode.EscapeMap[char];
    });
};

HtmlNode.prototype = {

    safeHTML: function () {

        var
            ret = '',
            rootNode = this.rootNode,
            nodeType = rootNode.nodeType;

        if (nodeType === 3) {
            ret += HtmlNode.escape(rootNode.nodeValue);
        }
        else if (nodeType === 1) {

            // bug: img 标签会被过滤
            if (this.innerText() || this.hasImg()) {

                ret += this.safeOuterHTML();
            }
            else {
                if (this.isBr()) {
                    ret += '\n';
                }
                else if (this.isImg()) {
                    ret += '<img' + this.attribute('src') + this.attribute('alt') + ' />';
                }
                else {
                    //
                }
            }
        }
        else {
            //
        }

        return ret;
    },

    hasImg: function () {

        return Boolean(this.rootNode.getElementsByTagName('img').length);
    },

    isUnsafeNode: function () {

        var nodeName = this.nodeName();

        if (HtmlNode.UnsafeNodeNames.test(nodeName)) {
            return true;
        }
        else {
            return false;
        }
    },

    attribute: function (name) {

        var ret = '',
            attrValue = this.rootNode.getAttribute(name);

        if (attrValue) {
            ret += ' ' + name + '="' + attrValue + '"';
        }

        return ret;
    },

    safeOuterHTML: function () {

        if (this.isUnsafeNode()) {
            return '';
        }

        var name = this.safeNodeName(),
            rootNode = this.rootNode,
            nodes = rootNode.childNodes,
            node,
            ret = '';

        if (!this.noRoot) {

            if (name === 'a') {
                ret += '<a' + this.attribute('href') + this.attribute('target') + this.attribute('download') + '>';
            }
            else {
                ret += '<' + name + '>';
            }
        }

        for (var i = 0 ; i < nodes.length; ++i) {
            node = nodes[i];
            ret += new HtmlNode(node).safeHTML();
        }

        if (!this.noRoot) {
            ret += '</' + name + '>';
        }

        return ret;
    },

    innerText: function () {

        var innerText = this.rootNode.innerText || this.rootNode.textContent || '';

        innerText = innerText.replace(/^[\s\r\n]+|[\s\r\n]+$/g, '');

        return innerText;
    },

    nodeName: function () {

        return this.rootNode.nodeName.toLowerCase();
    },

    isImg: function () {
        return this.nodeName() === 'img' && this.rootNode.src;
    },

    isBr: function () {
        return this.nodeName() === 'br';
    },

    safeNodeName: function () {

        var nodeName = this.nodeName();

        if (!HtmlNode.SafeNodeNames.test(nodeName)) {
            nodeName = 'p';
        }

        return nodeName;
    }
};
