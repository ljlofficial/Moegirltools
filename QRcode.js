/*基于第三方平台生成二维码，提供草料二维码和GoogleQRcode*/
(function($) {
	var qrcode_msgs_zh_hans = {
		title: '二维码',
		title_cli: '草料二维码',
		title_google: 'Google QRcode'
	};
	var qrcode_msgs_zh_hant = {
		title: 'QR碼',
		title_google: 'Google QRcode',
		title_cli: '草料二維碼'
	};
	function QRcode() {
		var portal = null,
			ul = null;
		var cururl = mw.config.get("wgServer") + mw.config.get("wgScriptPath") + '/index.php?curid=' + mw.config.get('wgArticleId') ;
	function _init() {
		if ($("#p-sl").length > 0){
			$('#p-sl').clone().attr('id', 'p-qrcode').attr('style', 'position:sticky; top:9.4em').find('h3').text(qrcode_msgs.title).end().find('li').remove().end().insertAfter('#p-sl');
		}
		else{
			$('#p-tb').clone().attr('id', 'p-qrcode').find('h3').text(qrcode_msgs.title).end().find('li').remove().end().insertAfter('#p-tb');
		}
	}
	function _array_rand(o) {
		for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	}
	function _li(id, title, url, query, w, h, scroll) {
			if (typeof scroll === 'undefined') scroll = 'yes';
		url += '?&' + $.param(query);
		var portletLink = $(mw.util.addPortletLink('p-qrcode', url, title, 's-qrcode' + id)).find('a').addBack().filter('a');
		$(portletLink).click(function(e) {
			e.preventDefault();
			window.open(url, '_blank', 'scrollbars=' + scroll + ',width=' + w + ',height=' + h + ',left=75,top=20,status=no,resizable=yes');
		});
	}
	this._li_google = function() {
		var url = 'https://chart.apis.google.com/chart';
		var query = {
			cht: 'qr',
			chs: '400x400',
			chl: cururl
		};
		_li('google', qrcode_msgs.title_google, url, query, 500, 450);
	};
	this._li_cli = function() {
			var url = 'https://cli.im/api/qrcode/code';
			query = {
				text: cururl,
				mhid: 'thHEXw7tncIhMHYqLNRXMao'
			};
			_li('cli', qrcode_msgs.title_cli, url, query , 1000, 750);
		};
	this.init = function() {
		var elem,
			funcs = Array();
		_init();
		for (elem in this) {
			if (elem.indexOf('_li_') === 0) funcs.push(this[elem]);
		}
		funcs = _array_rand(funcs);
		for (var i = 0; i < funcs.length; i++) {
			funcs[i]();
		}
	};
}
$.when($.ready, mw.loader.using(['mediawiki.api','ext.gadget.site-lib'])).then(function(){
	if (mw.config.get('wgAction') === 'view' && mw.util.getParamValue('diff') === null && mw.util.getParamValue('oldid') === null && !mw.config.get('wgCanonicalSpecialPageName')) {
		qrcode_msgs = wgULS(qrcode_msgs_zh_hans, qrcode_msgs_zh_hant);
		var stobj = new QRcode();
		stobj.init();
		$("#sl-page span a,#sl-currev span a").text("复制wikitext");//防止字符过长换行导致定位错误
	}
});
})(jQuery);