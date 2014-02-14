/// <reference path="Scripts/jquery-2.1.0.js" />
/// <reference path="Scripts/Dust.js" />
/// <reference path="Scripts/Dust-Helpers.js" />
/// <reference path="Scripts/underscore.js" />
/// <reference path="Scripts/x2js.js" />
/// <reference path="Scripts/highlight.pack.js" />
/// <reference path="Scripts/esprima.js" />
/// <reference path="Scripts/esscope.js" />
/// <reference path="Scripts/escodegen.js" />


var doc = {};

(function (cd) {
    /// <summary>
    /// 
    /// </summary>
    /// <param name="cd">
    ///     CodeDoc
    /// </param>

    /// <var> 
    /// options to be passed to esprima
    /// This is used more than once 
    /// </var>
    var _esprimaOptions = {
        comment: true,
        range: true,
        loc: true,
        tokens: true,
        raw: false
    };

    function prepDust() {
        function getTemplateText(url) {
            var ret;
            jQuery.ajax({
                url: url,
                success: function (result) {
                    ret = result;
                },
                async: false
            });
            return ret;
        }
        function getAndCompileTemplate(url, name) {
            var source = getTemplateText(url);
            var comp = dust.compile(source, name);
            dust.loadSource(comp);
        }
        getAndCompileTemplate('templates/fn.html', 'fn');
        getAndCompileTemplate('templates/sample.html', 'sample');
    }
    function renderTemplate(name, data, target, append) {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="name">
        /// Dust name of template
        /// </param>
        /// <param name="data"></param>
        /// <param name="target"> </param>
        /// <param name="append" type="bool"></param>

        dust.render(name, data, function (err, html) {
            if (err) alert('Dust Error: ' + err);
            if (append) {
                $(target).append(html);
            } else {
                $(target).html(html);
            }
        });
    }
    function getCommentBlocks(comments) {
        function newCurrent() {
            return {
                firstLine: -2,
                lastLine: 0,
                lines: [],
                getXml: function () {
                    return this.lines.join('\n');
                }
            };
        }


        var comm = _.where(comments, {
            type: 'Line'
        });
        comm = _.filter(comm, function (d) {
            if (d.value.charAt(0) == '/')
                return true;
            return false;
        });
        comm = _.map(comm, function (d) {
            return {
                v: d.value,
                k: d.loc.start.line
            };
        });

        var lastln = 0;
        var curent = newCurrent();
        var ret = [];

        _.each(comm, function (d) {
            if (curent.lastLine + 1 != d.k && curent.firstLine != -2) {
                ret.push(curent);
                curent = newCurrent();
            }
            if (curent.firstLine == -2) {
                curent.firstLine = d.k;
                curent.lastLine = d.k;
            }
            curent.lastLine = d.k
            curent.lines.push(d.v.replace('/ ', ''));
        });
        ret.push(curent);
        var ret2 = [];
        _.each(ret, function (d) {
            var xml = d.getXml();
            var x2js = new X2JS();
            //var json = x2js.xml2json('<obj>' + d.xml + '</obj>');
            if (xml.indexOf('<summary>') != -1) {
                if (xml.indexOf('<signature>') != -1) {
                    ret2.push({
                        firstLine: d.firstLine,
                        lastLine: d.lastLine,
                        data: x2js.xml2json($.parseXML('<obj>' + xml + '</obj>')).obj
                    });
                }
                else {
                    ret2.push({
                        firstLine: d.firstLine,
                        lastLine: d.lastLine,
                        data: x2js.xml2json($.parseXML('<obj><signature>' + xml + '</signature></obj>')).obj
                    });
                }
            }

        });

        return ret2;
    }
    function rewriteJsCode(src) {
        var tree = esprima.parse(src, _esprimaOptions);
        tree = escodegen.attachComments(tree, tree.comments, tree.tokens);

        return escodegen.generate(tree, {
            comment: true,
            format: {
                indent: {
                    adjustMultilineComment: true
                }
            }
        })
    }
    function getSrc(fn) {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="fn" type="Function"></param>
        var lines = fn.prototype.constructor.toString().split('\n');
        lines.splice(0, 1);
        lines.splice(lines.length - 1, 1);
        var samp = lines.join('\n');
        return samp;
    }

    cd.documentFunction = function (name, fn, opt) {
        /// <summary>
        /// Document function
        /// </summary>
        /// <param name="name">Name of the function. Used as the header.</param>
        /// <param name="fn">the function to document</param>
        /// <param name="opt">options</param>

        opt = $.extend({}, cd.documentFunction.defaultOptions, opt);
        if (opt.target == '') opt.target = cd.options.target;
        var code = fn.prototype.constructor;
        if (code.toString().indexOf('function (') == 0) {
            code = " var fn = " + code;
            console.log(code);
        }
        var tree = esprima.parse(code, _esprimaOptions);
        var comm = getCommentBlocks(tree.comments);
        console.log(comm[0].firstLine);
        if (comm[0].firstLine == 2) {
            //  console.log(comm[0].data);
            var ino = {
                d: comm[0].data,
                name: name
            };
            if (opt.sample !== null) {

                var samp = opt.sample.prototype.constructor.toString();
                var lines = samp.split('\n');
                lines.splice(0, 1);
                lines.splice(lines.length - 1, 1);
                samp = lines.join('\n');
                samp = rewriteJsCode(samp);
                ino.sample = samp;
            }

            renderTemplate('fn', ino, opt.target, opt.append);
        }
    }//end cd.docFunction
    /// <var> Default Options for doc.docFunction </var>
    cd.documentFunction.defaultOptions = {
        sample: null,
        /// <field>
        /// jQuery selector
        /// if the value is '' then doc.options.target is used.
        /// </field>
        target: '',
        append: true
    };

    cd.documentObject = function (name, fn, opt) {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="name"></param>
        /// <param name="fn"></param>
        /// <param name="opt"></param>
    }
    cd.documentObject.defaultOptions = {};

    cd.codeSample = function (name, description, sample) {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="name"></param>
        /// <param name="description"></param>
        /// <param name="sample" type="Function"></param>
        sample = getSrc(sample);
        sample = rewriteJsCode(sample);
        renderTemplate('sample', { name: name, description: description, sample: sample }, cd.options.target, true);
    }

    cd.jsHighlight = function () {
        /// <summary>
        /// Utility function used to highlight all javascript on page
        /// </summary>
        hljs.initHighlightingOnLoad();

    }


    /// <var> Global options for JsCodeDoc </var>
    cd.options = {
        /// <field> Default target div for all documentation functions </field>
        target: '#target'
    }

    prepDust();
})(doc);