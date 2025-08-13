/*
	注意：该插件必须依附于Wikiplus才能生效。
	
	载入后将在Wikiplus快速编辑的界面中添加一个“+”加号按钮，点击后可以新建快速替换的方案，完成后将生成一个按钮。
	在名称栏中，输入#号后面的文字将作为摘要使用，在执行匹配成功后将自动把摘要的文字置于编辑摘要栏中。
	在替换栏中可以使用 _@br_ 来指代换行，无论是否为正则模式。
	左键点击按钮执行预先设置好的替换，右键点击按钮删除该替换方案。
	
	注意：替换方案保存在当前浏览器中，而不是帐号内，若更换浏览器、更换电脑或清除缓存等，替换方案将不会同步。
*/
$(function(){
	if(typeof MutationObserver == 'undefined'){
		mw.notify('你使用的浏览器版本过低或不符合规范，无法使用Wikiplus-replace插件！', { type : 'warn' })
		return false
	}
	var topBtn = document.getElementById('Wikiplus-Edit-TopBtn')
	topBtn && topBtn.addEventListener('click', function(e){
		if($('.Wikiplus-InterBox').length == 1){
			 $('.Wikiplus-InterBox').remove()
		}
	}, true)
    $.each(document.getElementsByClassName('mw-editsection'), function(index, value){
        value.addEventListener('click', function(e){
            if(e.target.classList.contains('Wikiplus-Edit-SectionBtn') && $('.Wikiplus-InterBox').length == 1){
		        $('.Wikiplus-InterBox').remove()
	        }
        }, true)
    })
	
    var observar = new MutationObserver(function(record){
        var wikiplus = null
        var wikiplusTextarea = $('#Wikiplus-Quickedit')
        $.each(record[0].addedNodes, function(item, element){
            if(element.classList && element.classList.contains('Wikiplus-InterBox')){
                wikiplus = element
            }
        })
        if(wikiplus){
        	var br = '\n'		//用于快捷指代替换中的换行
            $(wikiplus).find('.Wikiplus-InterBox-Content')
            .find('div:first').find('#Wikiplus-Quickedit-Jump')
            .after('<span id="Wikiplus-Quickedit-addReplace" class="Wikiplus-Btn">✚</span>')

            $(wikiplus).contextmenu(function(){ return false })

            if(localStorage.getItem('Quickedit-replace')){
                var replaceData = JSON.parse(localStorage.getItem('Quickedit-replace'))
                $.each(replaceData, function(item, data){
                    var newButton = $('<span class="Wikiplus-Btn" data-id="' + data[3] + '">' + data[0] + '</span>')
                    newButton.mousedown(function(e){
                        if(e.which == 1){
                            var code = wikiplusTextarea.val()
                            var newCode = code.replace(new RegExp(data[1], 'gm'), data[2] ? data[2] : '')
                            .replace(/_@br_/g ,br)
                            if(code == newCode){
                                mw.notify('匹配结果为空！', { type : 'warn' })
                            }else{
                                wikiplusTextarea.val(newCode)
                                data[4] && $('#Wikiplus-Quickedit-Summary-Input').val(data[4])
                                mw.notify('已完成替换！')
                            }
                        }
                        
                        if(e.which == 3){
                            var replaceData = JSON.parse(localStorage.getItem('Quickedit-replace'))
                            .filter(function(repData){
                                return repData[3] != $(e.target).data('id')
                            })
                            localStorage.setItem('Quickedit-replace', JSON.stringify(replaceData))
                            $(this).remove()
                        }
                    })
                    $(wikiplus).find('.Wikiplus-InterBox-Content')
                    .find('div:first').find('.Wikiplus-Btn:last').after(newButton)
                })
            }

            $('#Wikiplus-Quickedit-addReplace').click(function(){
                var addReplaceHTML = '\
                <div id="Wikiplus-Quickedit-replace" style="width:400px; background:#EDF9F7; border:1px #666 solid; font-size:80%; box-shadow: 2px 2px 5px #aaa; overflow:hidden; padding:5px; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); -webkit-user-select:none; -moz-user-select:none; -o-user-select:none; user-select:none; z-index:300;">\
                <div style="padding:10px; padding-bottom:0;">添加快速替换<div class="Quickedit-replace-hide" style="float:right; font-size:26px; font-weight:bold; margin-top:-8px; -webkit-user-select:none; -moz-user-select:none; -o-user-select:none; user-select:none; cursor:pointer">×</div></div>\
                <hr style="height:1px; margin-bottom:-5px; background:#66CCFF; border:none;">\
                <div style="height:110px; border-radius:3px; padding:10px;">\
                    <p>名称：<input id="Quickedit-replace-Name" style="width:300px; height:25px; text-indent:3px;"></p>\
                    <p>查找：<input id="Quickedit-replace-Lookup" style="width:300px; height:25px; text-indent:3px;"></p>\
                    <p>替换：<input id="Quickedit-replace-Replace" style="width:300px; height:25px; text-indent:3px;"></p>\
                    <p>正则模式：<input type="checkbox" id="Quickedit-replace-pattern" value="reg" style="width:16px; height:16px; position:relative; top:3px;">\
                    <input class="Quickedit-replace-hide" type="button" value="关闭" style="float:right; width:50px; height:25px; background:white; box-shadow: 0 1px 2px #aaa; -webkit-user-select:none; -moz-user-select:none; -o-user-select:none; user-select:none; margin:0 5px;">\
                    <input id="Quickedit-replace-add" type="button" value="添加" style="float:right; width:50px; height:25px; background:white; box-shadow: 0 1px 2px #aaa; -webkit-user-select:none; -moz-user-select:none; -o-user-select:none; user-select:none; margin:0 5px;"></p>\
                </div>\
                </div>'
                $(document.body).append(addReplaceHTML)

                var addReplace = $('#Wikiplus-Quickedit-replace'),
                name = $('#Quickedit-replace-Name'),
                lookup = $('#Quickedit-replace-Lookup'),
                replace = $('#Quickedit-replace-Replace'),
                patternSwitch = $('#Quickedit-replace-pattern'),
                hideBtn = $('.Quickedit-replace-hide'),
                addBtn = $('#Quickedit-replace-add')

                hideBtn.click(function(){
                    addReplace.remove()
                })

                addBtn.click(function(){
                    var text = name.val()
                    if(/#/.test(text)){
                    	var note = text.replace(/(.+)#(.+)/, '$2')
                    	text = text.replace(/(.+)#(.+)/, '$1')
                    }
                    var pattern = lookup.val()
                    var replaceText = replace.val()
                    try{
                        if(! patternSwitch.prop('checked')){
                            pattern = pattern.replace(/([\\\(\)\[\]\{\}\+\.\*\^\$\!\?\|])/g,'\\$1')
                        }
                        new RegExp(pattern, 'gm')
                    }catch(e){
                        mw.notify('正则表达式有误，请核对后重新输入！', { type : 'error' })
                        return false
                    }
                    var id = Math.random()
                    if(localStorage.getItem('Quickedit-replace')){
                        var replaceData = JSON.parse(localStorage.getItem('Quickedit-replace'))
                        replaceData.push([text, pattern, replaceText, id, note || null])
                        replaceData = JSON.stringify(replaceData)
                        localStorage.setItem('Quickedit-replace', replaceData)
                    }else{
                        var replaceData = JSON.stringify([[text, pattern, replaceText, id, note || null]])
                        localStorage.setItem('Quickedit-replace', replaceData)
                    }
                    var newButton = $('<span class="Wikiplus-Btn" data-id="' + id + '">' + text + '</span>')
                    newButton.mousedown(function(e){
                        if(e.which == 1){
                            var code = wikiplusTextarea.val()
                            var newCode = code.replace(new RegExp(pattern, 'gm'), replaceText ? replaceText : '')
                            .replace(/_@br_/g ,br)
                            if(code == newCode){
                                mw.notify('匹配结果为空！', { type : 'warn' })
                            }else{
                                wikiplusTextarea.val(newCode)
                                note && $('#Wikiplus-Quickedit-Summary-Input').val(note)
                                mw.notify('已完成替换！')
                            }
                        }

                        if(e.which == 3){
                            var replaceData = JSON.parse(localStorage.getItem('Quickedit-replace'))
                            .filter(function(repData){
                                return repData[3] != $(e.target).data('id')
                            })
                            localStorage.setItem('Quickedit-replace', JSON.stringify(replaceData))
                            $(this).remove()
                        }
                    })
                    $(wikiplus).find('.Wikiplus-InterBox-Content')
                    .find('div:first').find('.Wikiplus-Btn:last').after(newButton)
                    mw.notify('已添加新的替换方案！')
                })

            })
            $('#Wikiplus-Quickedit-Back, .Wikiplus-InterBox-Close').click(function(){
                $('#Wikiplus-Quickedit-replace').remove()
            })
        }
    })
    var options = {
        childList : true
    }
    observar.observe(document.body, options)
})