/*
	载入该插件后，将对wikitext语法所使用的符号和html标签进行成对的补全。
	该插件并不会计算整个源代码中的html标签配对情况，标签的补全仅发生在输入大于号(>)时，补全距离最近的html标签。
	在输入无其他信息的标签后（如：<div></div>），若按下退格（backspace）键，可以直接删除这一组标签。
	注意：因为每次输入时都会对整个源代码进行查找匹配，为了防止卡顿，默认限制为500个字符，但这会导致当标签过长（例如在节点上添加了大量css代码）时，无法自动补全。
	过长的源代码会使输入时性能大幅下降，造成卡顿。当总字符数大于20000时，将自动关闭补全，请合理使用段落编辑的功能。
*/
$(function(){
    if(/action=(edit|submit)/.test(location.href)){
	    var wpText = $('#wpTextbox1')
	    
	    if(wpText.val().length > 20000){
	    	mw.notify('因源代码过长，补全功能被关闭！', { type : 'warn' })
	    	return
	    }
	    
		var retrospect = 500
		var pattern = [
			['-{', '}-'],
			['[', ']'],
			['{', '}'],
			["'", "'"],
			['"', '"'],
			['(', ')'],
			['<!--', '-->']
		]
	
	    //光标后插入信息
	    function insertText(obj, str){
			var content = obj.value,
			position = obj.selectionEnd,
			left = content.substring(0, position),
			right = content.substring(position)
			obj.value = left + str + right
	    }
		var original = null
		wpText.one('click', function(){
			original = {
				code : wpText.val(),
				start : wpText[0].selectionStart,
				end : wpText[0].selectionEnd
			}
		})	
	
	    // 缓存输入内容 & 判断
		var end = 0, 
		thisLength = 0,
		lastLength = 0,
		code = '',
		thisCode = '',
		deletedKeyword = '',
		
		// 需要暂停补全的状态
		typewritingMode = false,
		cutPaste = false,
		selectInput = false,
		selectDelete = false,
		inputFinish = false
 
		var codeSave = [{
			code : wpText.val(),
			start : wpText[0].selectionStart,
			end : wpText[0].selectionEnd
		}],
		inputMark = false
	    function selectionReset(){
	        end = wpText[0].selectionEnd
	        lastLength = wpText.val().length
		}
	
	    wpText.click(function(){
	        selectionReset()
	    }).keyup(function(e){
	        if(e.keyCode > 36 && e.keyCode < 41){
	            selectionReset()
	            code = ''
	        }
	    }).on('keydown keyup', function(e){
			if(e.keyCode == 8){
				var subStart = (this.selectionEnd - 1) < 0 ? 0 : (this.selectionEnd - 1)
				var left = thisCode.substring(subStart, this.selectionEnd)
				deletedKeyword = left
				selectionReset()
			}
		}).on('compositionstart', function(){
			typewritingMode = true
		}).on('compositionend', function(){
			typewritingMode = false
            inputFinish = true
            $(this).trigger('input')
            selectionReset()
		}).on('cut paste', function(){
			cutPaste = true
			
			codeSave.push({
				code : wpText.val(),
				start : wpText[0].selectionStart,
				end : wpText[0].selectionEnd
			})
			inputMark = false
			setTimeout(selectionReset, 0)
		}).on('keydown', function(e){
			selectInput = !! document.getSelection().toString()
			if(selectInput){ end = wpText[0].selectionStart}
			if(selectInput && (e.keyCode == 8 || e.keyCode == 46)){ selectDelete = true }
		}).on('input', function(){
			;(function(_this){
                if(typewritingMode){ return }
                if(inputFinish){ inputFinish = false; return }
				if(cutPaste){ cutPaste = false; return }
				if(selectDelete){ selectDelete = false; return }
		        thisCode = $(_this).val()
		        var right = thisCode.substring(end)
		        thisLength = $(_this).val().length
		        if(thisLength - lastLength == 1 || selectInput){
					code += right.substring(0, 1)
		        }else{
		            code = ''
		            
		            if(lastLength - thisLength == 1){
		            	var subStart = (_this.selectionEnd - 20) < 0 ? 0 : (_this.selectionEnd - 20),
		            	subEnd = (_this.selectionEnd + 20) > thisLength ? thisLength : (_this.selectionEnd + 20)
		            	
		            	var subLeft = thisCode.substring(0, subStart),
		            	subRight = thisCode.substring(subEnd)
		            	
		            	var left = thisCode.substring(subStart, _this.selectionEnd),
		            	right = thisCode.substring(_this.selectionEnd, subEnd),
		            	leftRE = /([\s\S]*)<(.+)$/,
						rightRE = /^\<\/(.+?)>([\s\S]*)/
		            	var tagLeft = left.replace(leftRE, '$2')
						var tagRight = right.replace(rightRE, '$1')
		            	if(tagLeft == tagRight){
		            		var leftCode = left.replace(leftRE, '$1')
		            		var rightCode = right.replace(rightRE, '$2')
		            		$(_this).val(subLeft + leftCode + rightCode + subRight)
		            		var cursorPos = new String(subLeft + leftCode).length
		            		_this.selectionStart = _this.selectionEnd = cursorPos
		            	}
	 
						$.each(pattern, function(){
							var $this = wpText[0]
							if(lastLength - thisLength == 1){
								var subStart = $this.selectionEnd < 0 ? 0 : $this.selectionEnd
								var subEnd = ($this.selectionEnd + 1) > thisLength ? thisLength : ($this.selectionEnd + 1)
								$this.selectionEnd == subEnd && subEnd++
								var subLeft = thisCode.substring(0, $this.selectionEnd),
								subRight = thisCode.substring(subEnd)
								var left = thisCode.substring(subStart, $this.selectionEnd),
								right = thisCode.substring($this.selectionEnd, subEnd)
	 
								if(deletedKeyword == this[0] && right == this[1]){	
									$($this).val(subLeft + subRight)
									$this.selectionStart = $this.selectionEnd = subLeft.length
									selectionReset()
								}
							}						
						})
		            }
		            
		        }
	 
		        function pair(keyword, char, num){
		            if(code.indexOf(keyword) != -1){
						var num = num || char.length
						var position = wpText[0].selectionEnd
		                insertText(wpText[0], char)
		                wpText[0].selectionStart = wpText[0].selectionEnd = position
		                selectionReset()
		                code = ''
		            }
		        }
	  
		        function addPair(arr){
		        	$.each(arr, function(){
						pair(this[0], this[1], this[2])
					})
					
		        }
	            selectionReset()
	 
		        addPair(pattern)
		
	            
				// 配对标签
	            if(code.indexOf('>') != -1){
	            	var start = (end - retrospect) < 0 ? 0 : (end - retrospect)
	                var left = wpText.val().substring(start, end)
	                var ptn = /[\s\S]*<((?!br|hr|img|references|templatestyles|\!--|\/|\>)[^\s<>]+)[^>]*?>$/
	                if(ptn.test(left)){
						var tagEnd = '</' + left.replace(ptn, '$1') + '>'
						var position = wpText[0].selectionEnd
	                    insertText(wpText[0], tagEnd)
		                wpText[0].selectionStart = wpText[0].selectionEnd = position
	                    selectionReset()
	                    code = ''                        
	                }	                	
	            }	
			})(this)
            
			codeSave.push({
				code : wpText.val(),
				start : wpText[0].selectionStart,
				end : wpText[0].selectionEnd
			})
			inputMark = true            
			
			input = false
		})
		
		wpText.on('keydown', function(e){
			if(e.ctrlKey && e.keyCode == 90){
				e.preventDefault()
				if(inputMark){
					codeSave.pop()
					inputMark = false
				}
				var history = codeSave.pop() || original
				if(history){
					wpText.val(history.code).focus()
					wpText[0].selectionStart = history.start
					wpText[0].selectionEnd = history.end
				}
			}
		})
    }
})