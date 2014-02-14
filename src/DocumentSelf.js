/// <reference path="JsCodeDoc.js" />
/// <reference path="Scripts/jquery-2.1.0.js" />

function init() {
    doc.documentFunction('doc.documentFunction', doc.documentFunction, {
        sample: function () {
            doc.documentFunction('doc.documentFunction', doc.documentFunction, {
                sample: function () {
                    // sample code goes in here
                    // * code also gets reformated
                    // * missing semicolons are added
                    sampleCode();

                    var badFormating = function () { var x = 1; x++; /*this is one long line in the src file */ var y = x; }
                }
            })
        }
    });
    doc.documentFunction('doc.jsHighlight', doc.jsHighlight, {
        sample: function () {
            // document code ...
            doc.jsHighlight();
        }
    });

    doc.documentFunction('test', doc.documentFunction, {
        sample: function () {
            /*
                sample
            */
        }
    });

    doc.codeSample('Sample Code', 'This is sample code', function () {
        function intellisenseDocumentation(arg1, arg2, arg3, optionalArg) {
            /// <summary>
            /// Summary about the function
            /// </summary>
            /// <param name="arg1">about arg1</param>
            /// <param name="arg2"></param>
            /// <param name="arg3"></param>
            /// <param name="optionalArg" optional="true">This is optional</param>
            dostuff();

        }
    });

    doc.jsHighlight();
}

$(init);