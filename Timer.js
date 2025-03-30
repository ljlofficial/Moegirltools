//时间显示
var offset = Number(mw.user.options.get("timecorrection").split("|")[1]);
var $timer = $("<li id='pt-timer'><a title='当地时间' href='/Special:参数设置#mw-prefsection-rendering-timeoffset'></a></li>");
$("#p-personal ul>li:last").after($timer.children().text(moment(mw.now()).utcOffset(offset).format("LTS")).end());
timerInterval = setInterval(function() {
	$("#p-personal ul>li:last").after($timer.children().text(moment(mw.now()).utcOffset(offset).format("LTS")).end());
}, 1000);