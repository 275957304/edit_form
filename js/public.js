//输入框默认文字处理
function inputVal(id, style) {

    //Modernizr 插件判断浏览器兼容状况
    if (!Modernizr.input.placeholder) {

        $(id).each(function(index, element) {
            var _this = $(this);
            var ysval = _this.attr('placeholder');
            if (ysval == "") return;
            var type = _this.attr('type');

            //处理password
            if (type == "password") {
                if (!style) {
                    style = {}
                }
                if (!style.size) {
                    style.size = 12
                };
                if (!style.px) {
                    style.px = 0
                };
                if (!style.py) {
                    style.py = 0
                };
                var x = _this.offset().left + style.px;
                var y = _this.offset().top + style.py + 1;
                var con = $('<span style="position:absolute; font-size:' + style.size + 'px; top:' + y + 'px; left:' + x + 'px;">' + ysval + '</span>');
                $('body').append(con);
                _this.focus(function() {
                    con.hide();
                }).blur(function() {
                    if ($(this).val() == '') {
                        con.show();
                    }
                });

            } else {

                $(this).val(ysval);
                $(this).focus(function() {
                    if ($(this).val() == ysval) {
                        $(this).val("");
                    }
                }).blur(function() {
                    if ($(this).val() == '') {
                        $(this).val(ysval);
                    }
                });
            }
        });
    }

}


//投票题
//图片投票题
function qImageVoteHandle(qid) {
    var qmodel = get_qmodel(qid);
    var qdiv = $("#question_" + qmodel.qid);
    var op_vote_count = vote_count[qmodel.qid];
    var total_vote = parseFloat(vote_count[qmodel.qid + "_count"]) || 0;

    try { //用try与catch是为了浏览器兼容的
        var canElm_test = document.createElement("canvas");
        canElm_test.getContext("2d");
        qdiv.find(".questionImgBox .voteProgressBox").each(function() {
            $(this).radialIndicator({
                radius: 50, //定义圆形指示器的内部的圆的半径。
                barColor: "#53a4f4", //定义刻度条颜色，即外圆进度条颜色
                barBgColor: "transparent", //定义圆形指示器的刻度条的背景颜色,即外圆进度条背景色
                barWidth: 5, //定义圆形指示器的刻度条的宽度。
                initValue: 0, //圆形指示器初始化的值。
                fontColor: "white", //字体颜色
                voteNum: 4, //票数
                fontSize: 16, //字体大小
                fontFamily: "microsoft yahei",
                fontWeight: "normal", //z字体加粗样式
                percentage: true //设置为true显示圆形指示器的百分比数值。
            });
        });
        qdiv.find(".questionImgBox .option").on("click", function() {
            setTimeout(function() {
                qdiv.find(".questionImgBox .voteProgressBox").show();
                qdiv.find(".questionImgBox").each(function() {
                    var radialObj = $(this).find(".voteProgressBox").data("radialIndicator");
                    var curProgress = radialObj.value();
                    var option_obj = $(this).find(".option");
                    var opid = option_obj.attr("id").split("_")[1];
                    var qid = option_obj.attr("name").split("_")[1];
                    var ans = total_answers[qid];
                    var vote = 0;
                    if(op_vote_count){
                        vote = parseFloat(op_vote_count[opid]) || 0;
                        if (vote_change && vote > 0 && ans) {
                            if (ans[0] instanceof Array){
                                // 多选
                                var opids = [];
                                for (var i=0; i < ans.length; i++) {
                                    opids.push(ans[i][0]);
                                };
                                if (opids.indexOf(opid) != -1){
                                    vote -= 1;
                                }
                            } else {
                                // 单选
                                if (opid == ans[0]){
                                    vote -= 1;
                                }
                            }
                        }
                    }
                    if (option_obj.prev().hasClass("jqTransformChecked")) {
                        vote += 1;
                    }
                    var new_total_vote = total_vote + qdiv.find(".jqTransformChecked").length;
                    if (vote_change && ans) {
                        // 处理总数
                        if (ans[0] instanceof Array){  // 多选
                            new_total_vote -= ans.length;
                        } else {  // 单选
                            new_total_vote -= 1;
                        }
                    }
                    var vNum = 0;
                    if (new_total_vote != 0) {
                        vNum = (vote / new_total_vote) * 100;
                    }
                    radialObj.option("voteNum", vote);
                    radialObj.animate(vNum);
                    var voto_str = (vNum.toFixed(2)).toString() + "%<br/>" + vote.toString() + vote_unit;
                    $(this).find(".progress_info").html(voto_str);
                });
            }, 200);
        });
    } catch (err) {
        qdiv.find(".questionImgBox .option").on("click", function() {
            setTimeout(function() {
                qdiv.find(".questionImgBox .voteProgressBox").show();
                qdiv.find(".questionImgBox").each(function() {
                    var vote_progress = $(this).find(".progress_info");
                    var option_obj = $(this).find(".option");
                    var opid = option_obj.attr("id").split("_")[1];
                    var qid = option_obj.attr("name").split("_")[1];
                    var ans = total_answers[qid];
                    var vote = 0;
                    if(op_vote_count){
                        vote = parseFloat(op_vote_count[opid]) || 0;
                        if (vote_change && vote > 0 && ans) {
                            if (ans[0] instanceof Array){
                                // 多选
                                var opids = [];
                                for (var i=0; i < ans.length; i++) {
                                    opids.push(ans[i][0]);
                                };
                                if (opids.indexOf(opid) != -1){
                                    vote -= 1;
                                }
                            } else {
                                // 单选
                                if (opid == ans[0]){
                                    vote -= 1;
                                }
                            }
                        }
                    }
                    if (option_obj.prev().hasClass("jqTransformChecked")) {
                        vote += 1;
                    }
                    var new_total_vote = total_vote + qdiv.find(".jqTransformChecked").length;
                    if (vote_change && ans) {
                        // 处理总数
                        if (ans[0] instanceof Array){  // 多选
                            new_total_vote -= ans.length;
                        } else {  // 单选
                            new_total_vote -= 1;
                        }
                    }
                    var vNum = 0;
                    if (new_total_vote != 0) {
                        vNum = (vote / new_total_vote) * 100;
                    }
                    var voto_str = (vNum.toFixed(2)).toString() + "%<br/>" + vote.toString() + vote_unit;
                    vote_progress.html(voto_str);
                });
            }, 200);
        });
    }
}

//文字投票题
function qFontVoteHandle(qid) {
    var qmodel = get_qmodel(qid);
    var qdiv = $("#question_" + qmodel.qid);
    var op_vote_count = vote_count[qmodel.qid];
    var total_vote = parseFloat(vote_count[qmodel.qid + "_count"]) || 0;

    qdiv.find(".icheckbox_div .option").on("click", function() {
        setTimeout(function() {
            qdiv.find(".icheckbox_div .fontVoteProgressBox").show();
            qdiv.find(".icheckbox_div").each(function() {
                var vote_progress = $(this).find(".progress_vote");
                var option_obj = $(this).find(".option");
                var opid = option_obj.attr("id").split("_")[1];
                var qid = option_obj.attr("name").split("_")[1];
                var ans = total_answers[qid];
                var vote = 0;
                if(op_vote_count){
                    vote = parseFloat(op_vote_count[opid]) || 0;
                    if (vote_change && vote > 0 && ans) {
                        if (ans[0] instanceof Array){
                            // 多选
                            var opids = [];
                            for (var i=0; i < ans.length; i++) {
                                opids.push(ans[i][0]);
                            };
                            if (opids.indexOf(opid) != -1){
                                vote -= 1;
                            }
                        } else {
                            // 单选
                            if (opid == ans[0]){
                                vote -= 1;
                            }
                        }
                    }
                }
                if (option_obj.prev().hasClass("jqTransformChecked")) {
                    vote += 1;
                }
                var new_total_vote = total_vote + qdiv.find(".jqTransformChecked").length;
                if (vote_change && ans) {
                    // 处理总数
                    if (ans[0] instanceof Array){  // 多选
                        new_total_vote -= ans.length;
                    } else {  // 单选
                        new_total_vote -= 1;
                    }
                }
                var vNum = '0.00%';
                if (new_total_vote != 0) {
                    vNum = ((vote / new_total_vote) * 100).toFixed(2).toString() + "%";
                }
                vote_progress.animate({
                    width: vNum
                }, 200);
                var progress_info_obj = $(this).find(".progress_info");
                progress_info_obj.find(".percentage").html(vNum);
                var vote_str = vote.toString() + vote_unit;
                progress_info_obj.find(".vote_N").html(vote_str);
            });
        }, 200);
    });
}