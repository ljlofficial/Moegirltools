// eslint-disable-next-line no-unused-vars
var _addText = '__NOINDEX__';

$(() => (async () => {
    const DEBUGGING = false;
    function consoleLog() {
        if(DEBUGGING) {
            console.log.apply(this, arguments);
        }
    }



    /*
     * 初始化部分
     */
    // Template & User
    if(![2, 10].includes(mw.config.get('wgNamespaceNumber'))) {
        return;
    }

    await mw.loader.using(['mediawiki.api']);
    let api = new mw.Api();

    const data = await api.get({
        action: 'query',
        prop: 'revisions',
        titles: mw.config.get('wgPageName'),
        rvprop: 'content'
    });
    let pageCode = data.query.pages[mw.config.get('wgArticleId')].revisions[0]['*'],
        pageCodeStart,
        pageCodeEnd,
        currentIsOdd = false,
        oddStyle = '',
        evenStyle = '',
        evenoddOnly = false;
    // 统一格式
    pageCode = pageCode
        .replace(/{{\s*Navbox[\s_]*subgroup/gi, '{{#invoke:Nav|box|subgroup')
        .replace(/{{\s*#invoke:\s*Nav\s*\|\s*box\s*\|\s*subgroup/gi, '{{#invoke:Nav|box|subgroup')
        .replace(/{{\s*Navbox[\s_]*child/gi, '{{#invoke:Nav|box|child')
        .replace(/{{\s*#invoke:\s*Nav\s*\|\s*box\s*\|\s*child/gi, '{{#invoke:Nav|box|child')
        .replace(/{{\s*Navbox[\s_]*with[\s_]*collapsible[\s_]*groups/gi, '{{#invoke:Nav|box|collapsible groups')
        .replace(/{{\s*#invoke:\s*Nav\s*\|\s*box\s*\|\s*collapsible groups/gi, '{{#invoke:Nav|box|collapsible groups')
        .replace(/{{\s*Navbox/gi, '{{#invoke:Nav|box')
        .replace(/{{\s*#invoke:\s*Nav\s*\|\s*box/gi, '{{#invoke:Nav|box');
    pageCodeStart = pageCode.search(/{{#invoke:Nav\|box/) + 1;
    if(pageCodeStart == 0 || pageCode.search(/{{大家族/) != -1) {
        return;
    }
    pageCodeEnd = match(pageCode, pageCodeStart, '{', '}');

    // 自动填入存在于 Navbox 里的第一个奇偶样式
    let pos;
    if((pos = pageCode.slice(pageCodeStart, pageCodeEnd).search(/\|\s*oddstyle\s*=/)) != -1) {
        oddStyle = pageCode.slice(pageCodeStart + pos).replace(/\|\s*oddstyle\s*=\s*/, '');
        oddStyle = oddStyle.slice(0, oddStyle.indexOf('\n')).trim();
    }
    if((pos = pageCode.slice(pageCodeStart, pageCodeEnd).search(/\|\s*evenstyle\s*=/)) != -1) {
        evenStyle = pageCode.slice(pageCodeStart + pos).replace(/\|\s*evenstyle\s*=\s*/, '');
        evenStyle = evenStyle.slice(0, evenStyle.indexOf('\n')).trim();
    }



    /*
     * 核心代码部分
     */
    // 仅调整 evenodd 参数时，尽量在 evenstyle / oddstyle 下面插
    // 能在 liststyle 下面插就在 liststyle 下面插，否则在 groupstyle / titlestyle 下面插，都不行就在 group1 或 above 上面插
    const ARGS = [
        /([ \t]*)\|\s*(?:evenstyle|oddstyle)\s*=/,
        /([ \t]*)\|\s*liststyle\s*=/,
        /([ \t]*)\|\s*groupstyle\s*=/,
        /([ \t]*)\|\s*titlestyle\s*=/,
        // 真的有人写 Navbox 时参数不换行吗
        /(?:\n[\n \t]*\n([ \t]*)|\n([ \t]*))\|\s*(?:above|group\d+|list\d+)\s*=/
    ];
    const ARGS_ALLOW_OVERWRITE = [
        true,
        true,
        true,
        true,
        false
    ];
    function findBestInsertPos(code) {
        consoleLog(code);
        let indent = [],
            insertPos = [];

        for(let i = 0; i < code.length; i++) {
            for(let j = 0; j < ARGS.length; j++) {
                if(!ARGS_ALLOW_OVERWRITE[j] && insertPos[j] !== undefined) {
                    continue;
                }

                if(check(code, i, ARGS[j])) {
                    let indentMatch = code.match(ARGS[j]);
                    // 缩进选取第一个捕获组
                    for(let k = 1; k < indentMatch.length; k++) {
                        if(indentMatch[k] !== undefined) {
                            indent[j] = indentMatch[k];
                            break;
                        }
                    }
                    insertPos[j] = code.indexOf('\n', i);
                    consoleLog(j + '[' + indent[j] + ']' + code.slice(insertPos[j]-10, insertPos[j]+10));
                    consoleLog(indentMatch);
                    break;
                }
            }
        }
        for(let i = 0; i < ARGS.length; i++) {
            if(insertPos[i] !== undefined) {
                if(i == 0 && !evenoddOnly) continue;
                consoleLog(i);
                return [indent[i], insertPos[i]];
            }
        }
        // 遇到空 Navbox 等情况返回 undefined
        return [];
    }

    function generateInsertCode(indent, adjacentIsOdd) {
        let str = '\n';

        if(!evenoddOnly && oddStyle.trim() != '') {
            str += `${indent}|oddstyle =${oddStyle}\n`;
        }

        if(!evenoddOnly && evenStyle.trim() != '') {
            str += `${indent}|evenstyle =${evenStyle}\n`;
        }

        if(adjacentIsOdd) {
            str += `${indent}|evenodd = swap\n`;
        }

        if(str != '\n') {
            str = str.slice(0, str.length - 1);
            return str;
        }
        return '';
    }

    function unstripMarkers(str, markers) {
        let result = str;
        for(let i = 0; i < markers.length; i++) {
            result = result.replace(`###${i}###`, markers[i]);
        }
        return result;
    }

    function parse(code, adjacentIsOdd) {
        let markers = [],
            hasTitle = false,
            isCollapsibleGroups = code.startsWith('{#invoke:Nav|box|collapsible groups');

        for(let i = 0; i < code.length; i++) {
            // 去注释
            if(check(code, i, /<!--/)) {
                let comment = code.slice(i, code.indexOf('-->', i + 4) + 3);
                code = code.replace(comment, `###${markers.length}###`);
                markers.push(comment);
            }

            // 解析各类参数
            if(check(code, i, /list\d+\s*=/)) {
                i = code.indexOf('=', i) + 1;
                // list 内容为空则跳过
                if(check(code, i, /\s*(\||})/)) {
                    continue;
                    /**
                     * 当 list 紧接着子 Navbox 时，不翻转奇偶
                     * @todo 还有一种少见的情况未考虑到，即 list 紧接着子 Navbox 再紧接着内容
                     */
                } else if(check(code, i, /\s*{{#invoke:Nav\|box/)) {

                    // 否则翻转奇偶
                } else {
                    currentIsOdd = !currentIsOdd;
                }
            } else if(check(code, i, /title\s*=/)) {
                hasTitle = true;
                // 在 collapsible groups 中，group 参数发挥 title 的作用
            } else if(isCollapsibleGroups && check(code, i, /group\d+\s*=/)) {
                currentIsOdd = false;
                /**
                 * 删除原有的 evenodd、evenstyle、oddstyle 参数
                 * @todo 删除 listnstyle 中的 background 属性
                 */
            } else if(
                check(code, i, /evenodd\d*\s*=/) ||
                (!evenoddOnly && check(code, i, /(evenstyle|oddstyle)\d*\s*=/))
            ) {
                let lineStart = code.slice(0, i + 1).lastIndexOf('\n');
                let line = code.slice(lineStart, code.indexOf('\n', i));
                code = code.slice(0, lineStart) + code.slice(lineStart + line.length);
                // 跳转到行首，避免因为删除而跳过一些内容
                i -= (i - lineStart);
            }

            // 有子 Navbox 则递归
            if(check(code, i, /{{#invoke:Nav\|box/)) {
                let subCode = code.slice(i+1, match(code, i+1, '{', '}'));
                code = code.replace(subCode, `###${markers.length}###`);
                markers.push(parse(subCode, currentIsOdd));
            }
        }

        // 插入参数
        let [indent, insertPos] = findBestInsertPos(code);
        if(insertPos !== undefined) {
            code = code.slice(0, insertPos) + `###${markers.length}###` + code.slice(insertPos);
            markers.push(generateInsertCode(indent, adjacentIsOdd));
        }

        // 有 title 下一个子 Navbox 视为从第一行开始
        if(hasTitle) {
            currentIsOdd = false;
        }
        return unstripMarkers(code, markers);
    }

    function check(text, start, keyword) {
        return text.slice(start).search(keyword) == 0;
    }

    function match(text, index, start, end) {
        let balance = 0;
        for(let i = index; i < text.length; i++) {
            if(check(text, i, start)) {
                balance++;
            } else if(check(text, i, end)) {
                balance--;
            }

            if(balance == 0) {
                return i + end.length;
            }
        }
    }



    /*
     * 界面交互部分
     */
    await mw.loader.using(['mediawiki.util', 'oojs-ui']);
    let portletLink = mw.util.addPortletLink('p-cactions', '#', '设置奇偶样式', null, null, 'o');

    function ProcessDialog(config) {
        ProcessDialog.super.call(this, config);
    }
    OO.inheritClass(ProcessDialog, OO.ui.ProcessDialog);
    ProcessDialog.static.name = 'naveo';
    ProcessDialog.static.title = '设置大家族模板奇偶样式';
    ProcessDialog.static.actions = [
        {
            action: 'execute',
            label: '执行',
            flags: ['primary', 'progressive']
        },
        {
            action: 'close',
            framed: false,
            icon: 'close',
            invisibleLabel: true,
            flags: ['safe', 'close']
        },
        {
            action: 'help',
            icon: 'help',
            framed: false,
            invisibleLabel: true
        }
    ];

    ProcessDialog.prototype.initialize = function() {
        ProcessDialog.super.prototype.initialize.apply(this, arguments);

        let _this = this;

        // Body 部分
        this.oddInput = new OO.ui.TextInputWidget({
            labelPosition:  'before',
            label: 'oddstyle =',
            value: oddStyle
        });
        this.evenInput = new OO.ui.TextInputWidget({
            labelPosition: 'before',
            label: 'evenstyle =',
            value: evenStyle
        });
        this.oddInput.$element.find('input').on('keydown', function(e) {
            if([13, 38, 40].includes(e.keyCode)) {
                _this.evenInput.$element.find('input').focus();
            }
        });
        this.evenInput.$element.find('input').on('keydown', function(e) {
            if([13, 38, 40].includes(e.keyCode)) {
                _this.oddInput.$element.find('input').focus();
            }
        });

        this.content = new OO.ui.PanelLayout({
            padded: true,
            expanded: false
        });
        this.content.$element.append(
            new OO.ui.FieldLayout(
                this.oddInput, {label: new OO.ui.HtmlSnippet('奇数行样式<small>（留空则执行清空操作，下同）</small>'), align: 'top'}
            ).$element,
            new OO.ui.FieldLayout(
                this.evenInput, {label: '偶数行样式', align: 'top'}
            ).$element
        );

        this.$body.append(this.content.$element);


        // Footer 部分
        this.toggle_evenoddonly = new OO.ui.CheckboxInputWidget();
        this.toggle_evenoddonly.on('change', function(value) {
            if(value){
                evenoddOnly = true;
                _this.oddInput.setDisabled(true);
                _this.evenInput.setDisabled(true);
            } else {
                evenoddOnly = false;
                _this.oddInput.setDisabled(false);
                _this.evenInput.setDisabled(false);
            }
        });

        this.toggle_revert = new OO.ui.CheckboxInputWidget();
        this.toggle_revert.$element
            .css({'margin-left': '1em'});

        this.summaryInput = new OO.ui.TextInputWidget({
            placeholder: '设置奇偶样式',
            labelPosition: 'before',
            label: 'NavEO：',
            maxLength: 220
        });

        this.$element.find('.oo-ui-processDialog-actions-other').append(
            new OO.ui.HorizontalLayout({
                items: [
                    new OO.ui.FieldLayout(this.toggle_evenoddonly, {align: 'inline', label: '仅调整evenodd参数'}),
                    new OO.ui.FieldLayout(this.toggle_revert, {align: 'inline', label: '奇偶反转'})
                ]
            }).$element,
            new OO.ui.FieldLayout(
                this.summaryInput, {label: '附加摘要', align: 'top'}
            ).$element
        );
    };


    // 科技与狠活
    ProcessDialog.prototype.getReadyProcess = function(action) {
        let _this = this;

        // 代码字体
        const codeFont = 'Consolas,Monaco,Andale Mono,Ubuntu monospace,方正中等线_GBK,monospace';
        this.oddInput.$element
            .css({'font-family': codeFont});
        this.evenInput.$element
            .css({'font-family': codeFont});

        // TextInputWidget的label功能存在问题
        this.oddInput.$element.find('input')
            .css({'padding-left': '93px'});
        this.oddInput.$element.find('.oo-ui-labelElement-label')
            .css({'padding-right': '0'});
        this.evenInput.$element.find('input')
            .css({'padding-left': '101px'});
        this.evenInput.$element.find('.oo-ui-labelElement-label')
            .css({'padding-right': '0'});
        this.summaryInput.$element.find('input')
            .css({'padding-left': '66px'});
        this.summaryInput.$element.find('.oo-ui-labelElement-label')
            .css({'padding-right': '0'});

        // 美化窗口
        this.$element.find('.oo-ui-window-head')
            .css({'border-bottom': '1px solid #a2a9b1'});
        this.$element.find('.oo-ui-window-body')
            .css({
                'outline': 'none',
                'bottom': '0'
            });
        this.$element.find('.oo-ui-processDialog-actions-other')
            .css({
                'background': '#eaecf0',
                'border-top': '1px solid #a2a9b1',
                'padding': '7px 1.14em 9px'
            });
        this.$element.find('.oo-ui-processDialog-actions-other .oo-ui-actionWidget')
            .remove();

        // 美化执行按钮——什么时候才能升级 mw
        let headerHeight = this.$element.find('.oo-ui-processDialog-navigation').outerHeight(true);
        this.$element.find('.oo-ui-processDialog-actions-primary>span')
            .css({'margin': '0'});
        this.$element.find('.oo-ui-processDialog-actions-primary>span>a')
            .css({
                'border': 'none',
                'border-radius': '0',
                'padding-top': '0',
                'padding-bottom': '0'
            });
        this.$element.find('.oo-ui-processDialog-actions-primary>span>a .oo-ui-labelElement-label')
            .css({'line-height': headerHeight + 'px'});

        this.updateSize();

        return ProcessDialog.super.prototype.getReadyProcess.apply(this, action);
    };


    ProcessDialog.prototype.getActionProcess = function(action) {
        let _this = this;

        if (action === 'close') {
            return new OO.ui.Process(function() {
                _this.close({action: action});
            }, this);
        }
        if (action === 'execute') {
            this.pushPending();

            currentIsOdd = this.toggle_revert.isSelected();
            oddStyle = " " + this.oddInput.getValue().trim();
            evenStyle = " " + this.evenInput.getValue().trim();
            pageCode =
                pageCode.slice(0, pageCodeStart) +
                parse(pageCode.slice(pageCodeStart, pageCodeEnd), currentIsOdd) +
                pageCode.slice(pageCodeEnd);

            mw.notify('执行完毕，正在提交编辑。');
            api.postWithToken('csrf', {
                action: 'edit',
                title: mw.config.get('wgPageName'),
                tags: 'Automation tool',
                bot: true,
                minor: true,
                watchlist: 'nochange',
                nocreate: true,
                text: pageCode,
                summary: '[[User:Chi_ZJ2/js#NAVEO|NavEO]]：' + (this.summaryInput.getValue() || '设置奇偶样式')
            }).done(function() {
                _this.close({ action: action });
                mw.notify('编辑成功，正在刷新页面。');
                if(!DEBUGGING) {
                    location.reload();
                }
            });
        }

        return ProcessDialog.super.prototype.getActionProcess.call(this, action);
    };

    ProcessDialog.prototype.getBodyHeight = function() {
        return this.content.$element.outerHeight(true);
    };


    let windowManager = new OO.ui.WindowManager();
    $(document.body).append(windowManager.$element);
    let processDialog = new ProcessDialog({
        size: 'medium'
    });
    windowManager.addWindows([processDialog]);


    $(portletLink).click(function(e) {
        e.preventDefault();
        windowManager.openWindow(processDialog);
    });

})());
