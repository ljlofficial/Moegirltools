/**
 * 在编辑时，对{{LyricsKai}}提供一个编辑窗口，原文与翻译并排排列，再进行翻译等工作无需滚动页面查看原文，方便编辑。
 * 默认匹配第一个出现个的{{LyricsKai}}，如需匹配其他请使用鼠标选中相应代码。
 * 很可能有bug，提交前请预览。
 */
 // <nowiki>
 $(function () {
    if (mw.config.values.wgAction == "edit") {                              //只寻找编辑页面
        var btn = $('<li><a title="LyricsKai可视化编辑">歌词编辑</a></li>');
        btn.click(showLyricsKaiEditor);
        $('#p-cactions ul').append(btn);
    }
    function showLyricsKaiEditor() {
        var textbox = document.getElementById('wpTextbox1');
        var regex = /\{\{LyricsKai\}\}/;  //只严格寻找LyricsKai
        var codeContent = '';
        if (textbox.selectionStart == textbox.selectionEnd) {
            codeContent = $(textbox).val();
        } else {
            codeContent = textbox.value.substring(textbox.selectionStart, textbox.selectionEnd);
            if (!regex.test(codeContent)) {
                mw.notify('所选代码没有LyricsKai，尝试在所有代码中搜寻');
                codeContent = $(textbox).val();
            }
        }
        if (!regex.test(codeContent)) {
            mw.notify('代码没有LyricsKai');
        }
        var original_str, translated_str;
        [_, _, original_str, _, translated_str] = codeContent.match(regex);
        var original = trim(original_str).split('\n');
        var translated = trim(translated_str).split('\n');
        var n = Math.max(original.length, translated.length);
        var editor = $('<div />');
        editor.css({
            'overflow': 'auto',
            'padding': '16px 24px 16px 24px',
            'max-height': '100%',
            'box-sizing': 'border-box',
            'line-height': '1.6'
        });
        editor.addClass('Lyrics');
        editor.addClass('Lyrics-no-ruby');
        editor.append('<style data-mw-deduplicate="TemplateStyles:r2208000">.Lyrics.Lyrics-has-ruby .Lyrics-original,.Lyrics.Lyrics-has-ruby .Lyrics-translated{line-height:2.1}.Lyrics.Lyrics-no-ruby .Lyrics-original,.Lyrics.Lyrics-no-ruby .Lyrics-translated{vertical-align:top}.Lyrics .Lyrics-original,.Lyrics .Lyrics-translated{width:100%;display:inline-block;white-space:pre-wrap}@media all and (max-width:720px){.Lyrics{min-width:100%}}@media all and (min-width:720px){.Lyrics .Lyrics-original,.Lyrics .Lyrics-translated{width:49.85%}}</style>');
        editor.append(
            '<style>' +
            '   #LyricsKaiEditor .Lyrics-original:hover, #LyricsKaiEditor .Lyrics-translated:hover {' +
            '      box-shadow: inset 0px 0px 0.2em #004eff;' +
            '   }' +
            '   #LyricsKaiEditor .Lyrics-line {' +
            '      margin-top: 5px;' +
            '   }' +
            '</style>');
        for (i = 0; i < n; i++) {
            var line = $('<div />');
            line.addClass('Lyrics-line');
            var original_line = $('<div />');
            original_line.addClass('Lyrics-original');
            original_line.attr('contenteditable', 'true');
            original_line.text(original[i] || '');
            var translated_line = $('<div />');
            translated_line.addClass('Lyrics-translated');
            translated_line.attr('contenteditable', 'true');
            translated_line.text(translated[i] || '');
            line.append(original_line);
            line.append(translated_line);
            editor.append(line);
        }
        var close = $('<span />');
        close.text('x');
        close.css({
            'cursor': 'pointer',
            'position': 'absolute',
            'top': '0px',
            'right': '0px',
            'margin': '0px 3px',
            'font-size': '20px'
        });
        close.on('click', function () {
            save();
            container.remove();
        });
        var container = $('<div />')
        container.attr('id', 'LyricsKaiEditor');
        container.css({
            'position': 'fixed',
            'left': '50px',
            'bottom': '50px',
            'top': '50px',
            'right': '50px',
            'width': 'calc(100% - 100px)',
            'height': 'calc(100% - 100px)',
            'padding-top': '20px',
            'box-sizing': 'border-box',
            'box-shadow': '3px 3px 5px',
            'background': 'white'
        });
        container.append(close);
        container.append('<div style="clear:both;"></div>');
        container.append(editor);
        $('body').append(container);
        container.on('keypress', '.Lyrics-original, .Lyrics-translated', function (e) {
            if (e.which == 13) { // enter
                var line = $('<div />');
                line.addClass('Lyrics-line');
                var original_line = $('<div />');
                original_line.addClass('Lyrics-original');
                original_line.attr('contenteditable', 'true');
                original_line.text('');
                var translated_line = $('<div />');
                translated_line.addClass('Lyrics-translated');
                translated_line.attr('contenteditable', 'true');
                translated_line.text('');
                line.append(original_line);
                line.append(translated_line);
                $(this).parent('.Lyrics-line').after(line);
                if ($(this).is('.Lyrics-original')) {
                    original_line.focus();
                } else {
                    translated_line.focus();
                }
                return false;
            }
        });
        container.on('keyup', '.Lyrics-original, .Lyrics-translated', function (e) {
            if (e.which == 38) { // up
                if ($(this).is('.Lyrics-original')) {
                    $(this).parent('.Lyrics-line').prev('.Lyrics-line').find('.Lyrics-original').focus();
                } else {
                    $(this).parent('.Lyrics-line').prev('.Lyrics-line').find('.Lyrics-translated').focus();
                }
            } else if (e.which == 40) { // down
                if ($(this).is('.Lyrics-original')) {
                    $(this).parent('.Lyrics-line').next('.Lyrics-line').find('.Lyrics-original').focus();
                } else {
                    $(this).parent('.Lyrics-line').next('.Lyrics-line').find('.Lyrics-translated').focus();
                }
            }
        })
        function trim(str) {
            return str.replace(/(^\s*)|(\s*$)/g, '');
        }
        function save() {
            var original_new = '';
            var translated_new = '';
            editor.find('.Lyrics-line').each(function () {
                original_new = original_new + '\n' + $(this).find('.Lyrics-original').text();
                translated_new = translated_new + '\n' + $(this).find('.Lyrics-translated').text();
            });
            original_new = trim(original_new);
            translated_new = trim(translated_new);
            var codeContent_new = codeContent.replace(regex, '$1\n' + original_new + '\n$3\n' + translated_new + '\n}}')
            $('#wpTextbox1').val($('#wpTextbox1').val().replace(codeContent, codeContent_new));
        }
    }
});
// </nowiki>