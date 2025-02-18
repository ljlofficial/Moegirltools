/*
	这是一个保存编辑内容的小插件，载入后将在“显示更改”按钮后生成一个“还原备份”按钮。	
	萌百本身有一个缓存编辑的内容的插件，但是我用得感觉很迷，曾经两次在开了那个插件的情况下提交编辑后发生网络错误，
	然而再次回到编辑页面后却无法还原，不知道是有Bug还是我没用好。
	
	这个插件将在点击“提交编辑、显示预览、显示更改”中任意一个按钮时备份当前的编辑。当存在备份时，“还原备份”按钮变为可以点击。
	备份会保存7天，7天后自动清除。
*/
$(function(){
    if(! /action=(edit|submit)/.test(location.href)){ return }
    var editBox = $('#wpTextbox1'),
    btns = $('#wpSaveWidget, #wpPreviewWidget, #wpDiffWidget'),
    title = decodeURIComponent(location.search.match(/title=([^&]+)/)[1]),
    backupList = JSON.parse(localStorage.getItem('Moegirl-koharubiyori-editBackup') || '{}')
    
    $.each(backupList, function(key, val){
        var time = new Date().getTime()
        if(val.expires < time){
            delete backupList[key]
        }
    })
      setTimeout(function(){
        var backup = backupList[title]
        if(backup){
          var btn = $('<span class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-buttonElement oo-ui-buttonElement-framed oo-ui-labelElement oo-ui-buttonInputWidget"><input type="button" value="还原备份" class="oo-ui-inputWidget-input oo-ui-buttonElement-button" /></span>')
          .click(function(){ 
              editBox.val(backup.content)
              mw.notify('已还原备份！', { type: 'warn' })     
          })    	
        }else{
            var btn = $('<span class="oo-ui-widget oo-ui-inputWidget oo-ui-buttonElement oo-ui-buttonElement-framed oo-ui-labelElement oo-ui-buttonInputWidget oo-ui-widget-disabled"><input type="button" value="还原备份" class="oo-ui-inputWidget-input oo-ui-buttonElement-button" disabled /></span>')
        }
        $('#wpDiffWidget').after(btn)
      })
    btns.mousedown(function(e){
        var content = editBox.val()
        var expire = new Date().getTime() + 1000 * 60 * 60 * 24 * 7
        backupList[title] = {
            expires : expire,
            content : content
        }
        localStorage.setItem('Moegirl-koharubiyori-editBackup', JSON.stringify(backupList))
    })
  })