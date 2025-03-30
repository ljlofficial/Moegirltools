/* 自动编辑预览 */
const queryModerationStatus = { //API查询审核状态
	"action": "query",
	"format": "json",
	"prop": "revisions",
	"revids": mw.config.get('wgCurRevisionId'),
	"rvprop": "ids"
};
$(document).ready(function() {
	var wgAction = mw.config.get('wgAction');
	if(wgAction == 'view') { //审核提示链接更改为当前标签页
		if($(".moderation-notice").length) {
			$(".moderation-notice>a").attr('target', '_self');
		}
		if($(".permissions-errors").length) {
			$(".permissions-errors>p>a").attr('target', '_self');
		}
	}
	else if(wgAction == 'edit') { //检查审核状态自动预览
		const api = new mw.Api();
		api.get(queryModerationStatus).done(function (data) {
			if(Object.values(data.query.pages)[0].revisions[0].moderation.status_code === 0) {
				$("#wpPreview").click();
			}
		});
	}
	else if(wgAction == 'submit') { //自动滚动到预览区
		$(window).scrollTop($("#wikiPreview").offset().top);
	}
});