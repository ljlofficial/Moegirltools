//编辑栏快捷插入
$(document).ready(function() {
	if($("#specialchars").length && (typeof charsets != "undefined")){ //自定义插入按钮
		$("#specialchars").prepend("<p id='myspecialchars'></p>");
		for(let i=0;i<charsets.length;i++) {
			$label = $("<a class='mw-charinsert-item'></a>");
			$label.attr("data-mw-charinsert-start", charsets[i].start);
			$label.attr("data-mw-charinsert-end", charsets[i].end);
			$label.text(charsets[i].text);
			$label.on("click", insertChar);
			$("#myspecialchars").append($label);
			$("#myspecialchars").append(' ');
		}
	}
	$(".mw-charinsert-item").on("click", autoScroll);
	if($("#wpSummary").length && (typeof summarysets != "undefined")){ //快捷摘要插入
		$(".mw-summary-preset").parent().append("<br>自定义摘要：<span id='mysummary' class='mw-summary-preset'></span>");
		for(let i=0;i<summarysets.length;i++) {
			$label = $("<span class='mw-summary-preset-item'><a herf='#.'></a></span>");
			$label.children().attr("title", summarysets[i].title);
			$label.children().text(summarysets[i].text);
			if(i<summarysets.length-1) {
				$label.children().after(" | ");
			}
			$("#mysummary").append($label);
		}
	}
});
function insertChar(event) { //插入事件
	$item = $(event.target);
	let $currentFocused = $('#wpTextbox1');
	if ($currentFocused.length) {
		$currentFocused.textSelection('encapsulateSelection', {
			pre: $item.attr('data-mw-charinsert-start'), 
			post: $item.attr('data-mw-charinsert-end')
		});
		$item.attr('data-mw-charinsert-done', true);
	}
}
function autoScroll() {// 临时修正无法滚动回编辑框的问题
	$('.mw-editform')[0].scrollIntoView();
}