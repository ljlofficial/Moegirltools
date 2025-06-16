$(function () {
	var action = mw.config.get('wgAction')
	var ns = mw.config.get('wgNamespaceNumber')
	var contentModel = mw.config.get('wgPageContentModel')
	if (action === 'edit' && ns % 2 !== 0 && contentModel === 'wikitext') {
		alert('你这个**还**在讨论页发言？\n除非特殊情况，否则请不要使用讨论页，如需使用请使用小号发言')
	}