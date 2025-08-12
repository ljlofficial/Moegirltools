$(function() {
    function d() {
        c && (c.abort(), c = null)
    }
    var a, b, c;
    $(document).on("mouseover", "a", function(e) {
        var f = this;
        /((Special|%E7%89%B9%E6%AE%8A):(Diff|%E5%B7%AE%E5%BC%82|%E5%B7%AE%E7%95%B0))|[?&]diff=/i.test(f.href) && !/#/.test(f.href) && (clearTimeout(b), clearTimeout(a), a = setTimeout(function() {
            var a, b, g;
            $("#quick-diff").length || ($("body").append('<div id="quick-diff"> <div id="quick-diff-close" onClick="$(\'#quick-diff\').hide();">x</div> <div id="quick-diff-arrow"></div> <div id="quick-diff-content"></div></div>'), $("head").append('<link rel="stylesheet" href="' + mw.config.get("wgLoadScript") + '?debug=false&modules=mediawiki.diff.styles&only=styles">'), $("head").append('<style type="text/css"> #quick-diff { border: 1px solid #a7d7f9; padding: 16px 24px 16px 24px; background-color: #ffffff; color: #222222; position: absolute; left: 20px; right: 20px; font-size: 14px; margin-bottom: 10px; display: none; z-index:20; } #quick-diff-close { cursor: pointer; position: absolute; top: 0px; right: 0px; margin: -2px 7px; font-size: 20px; } #quick-diff-content { max-height: 300px; overflow: auto; height: 100%; } #quick-diff-arrow { position:absolute; height:0px; width:0px; border:6px solid transparent; }</style>')), e.clientY < document.body.clientHeight / 2 ? ($("#quick-diff").css({
                top: $(f).offset().top + $(f).height() + 6,
                transform: ""
            }).show(), $("#quick-diff-arrow").css({
                top: "-13px",
                bottom: "",
                "border-top-color": "transparent",
                "border-bottom-color": "#66ccff",
                left: $(f).offset().left + $(f).width() / 2 - 20 - 6
            })) : ($("#quick-diff").css({
                top: $(f).offset().top - 6,
                transform: "translate(0, -100%)"
            }).show(), $("#quick-diff-arrow").css({
                top: "",
                bottom: "-13px",
                "border-top-color": "#a7d7f9",
                "border-bottom-color": "transparent",
                left: $(f).offset().left + $(f).width() / 2 - 20 - 6
            })), $("#quick-diff-content").html('<div style="text-align: center;">Loading...</div>'), a = (f.href.match(/[?&]oldid=(\d*)/i) || ["", null])[1], a || (a = (f.href.match(/(?:Special|%E7%89%B9%E6%AE%8A):(?:Diff|%E5%B7%AE%E5%BC%82|%E5%B7%AE%E7%95%B0)\/(\d+)\/\d+/i) || [null, null])[1]), b = (f.href.match(/[?&]diff=([^&]*)/i) || [null, null])[1], b || (b = (f.href.match(/(?:Special|%E7%89%B9%E6%AE%8A):(?:Diff|%E5%B7%AE%E5%BC%82|%E5%B7%AE%E7%95%B0)\/\d+\/(\d+)/i) || [null, null])[1], b || (b = (f.href.match(/(?:Special|%E7%89%B9%E6%AE%8A):(?:Diff|%E5%B7%AE%E5%BC%82|%E5%B7%AE%E7%95%B0)\/(\d+)/i) || [null, null])[1])), g = {
                action: "compare",
                format: "json",
                utf8: 1
            }, jQuery.isNumeric(a) && jQuery.isNumeric(b) ? "0" == b ? (g.torelative = "cur", g.fromrev = a) : (g.fromrev = a, g.torev = b) : a ? (g.torelative = b, g.fromrev = a) : (g.torelative = "prev", g.fromrev = b), d(), c = $.ajax({
                type: "GET",
                url: mw.config.get("wgScriptPath") + "/api.php",
                data: g,
                timeout: 15e3,
                success: function(a) {
                    a.compare && null != a.compare["*"] ? ($("#quick-diff-content").html('<table class="diff diff-contentalign-left" data-mw="interface"><colgroup><col class="diff-marker"><col class="diff-content"><col class="diff-marker"><col class="diff-content"></colgroup><tbody>' + ("" === a.compare["*"] ? '<div style="text-align: center;color: red">（没有差异）</div>' : a.compare["*"]) + "</tbody></table>"), $.each(window.QuickDiffExtension || [], function(b, c) {
                        "function" == typeof c && c($("#quick-diff")[0], a)
                    })) : $("#quick-diff-content").html('<div>出现未知错误，以下是错误信息，请<a href="/User_talk:Nzh21">反馈给Nzh21</a></div>' + JSON.stringify(a)), c = null
                },
                error: function() {
                    $("#quick-diff-content").html('<div style="text-align: center; color: darkred; font-size: larger;">网络连接出错</div>'), c = null
                }
            })
        }, 300))
    }), $(document).on("mouseout", function() {
        clearTimeout(a), clearTimeout(b), b = setTimeout(function() {
            d(), $("#quick-diff").hide()
        }, 500)
    }), $(document).on("mouseover", "#quick-diff", function() {
        clearTimeout(b)
    }), $(document).on("mouseout", "#quick-diff", function() {
        clearTimeout(b), b = setTimeout(function() {
            d(), $("#quick-diff").hide()
        }, 500)
    })
});