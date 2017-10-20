function get_question(qid_or_qcid) {
    for(var key in QUESTION_DICT){
        if (get_oid(QUESTION_DICT[key]) == qid_or_qcid || QUESTION_DICT[key].cid == qid_or_qcid){
            return QUESTION_DICT[key];
        }
    }
    return null;
}

function get_option(qid, option_id_or_list){
    var question = get_question(qid);
    if (!isNotEmpty(question)){
        return null;
    }
    if (option_id_or_list.constructor == Array){
        var option_list = [];
        for (var i = 0; i < question.option_list.length; i++) {
            var option = question.option_list[i];
            if (check_in(get_oid(option), option_id_or_list)){
                option_list.push(option);
            }
        }
        return option_list;
    }else{
        for (var i = 0; i < question.option_list.length; i++) {
            var option = question.option_list[i];
            if (get_oid(option) == option_id_or_list){
                return option;
            }
        }
        for (var i = 0; i < question.related_question_list.length; i++) {
            for (var j = 0; j < question.related_question_list[i].option_list.length; j++) {
                var option = question.related_question_list[i].option_list[j];
                if (get_oid(option) == option_id_or_list){
                    return option;
                }
            }
        }
    }
    return null;
}

function get_matrixrow(qid, row_id_or_list){
    //row_id_or_list可能为一个list, 可能以为单个的rcid或者rid
    var question = get_question(qid);
    if (!isNotEmpty(question) || !isNotEmpty(question.matrixrow_list)){
        return null;
    }
    if (row_id_or_list.constructor == String){
        for (var i = 0; i < question.matrixrow_list.length; i++) {
            var matrixrow = question.matrixrow_list[i];
            if (get_oid(matrixrow) == row_id_or_list){
                return matrixrow;
            }
        }
    }else {
        var row_list = [];
        for (var i = 0; i < question.matrixrow_list.length; i++) {
            var matrixrow = question.matrixrow_list[i];
            if (check_in(get_oid(matrixrow), row_id_or_list)){
                row_list.push(matrixrow);
            }
        }
        return row_list;
    }
    return null;
}

function get_qmodel(qid_or_qcid_or_question){
    var question = null;
    if (qid_or_qcid_or_question.constructor == String){
        question = get_question(qid_or_qcid_or_question);
    }else{
        question = qid_or_qcid_or_question;
    }
    if (isNotEmpty(question)){
        if (isNotEmpty(QMODEL_DICT[get_oid(question)])){
            return QMODEL_DICT[get_oid(question)];
        }else{
            var qmodel = QModelFactory.getQModel(question);
            QMODEL_DICT[get_oid(question)] = qmodel;
            return qmodel;
        }
    }else{
        return null;
    }
}

function get_questionpage(page_id){
    return QUESTIONPAGE_DICT[page_id];
}

function get_question_list_by_page(oid_or_page){
    var page = null;
    if (oid_or_page.constructor == String){
        page = get_questionpage(oid_or_page);
    }else{
        page = oid_or_page;
    }
    return $.map(page.question_id_list, get_question);
}

function update_question(question){
    QUESTION_DICT[get_oid(question)] = question;
    QMODEL_DICT[get_oid(question)] = null;
    // 更新关联题目的关联选项
    update_question_relation_option(question._id.$oid);
}

function check_hide_for_question(qid){
    var css_str = $("#question_"+qid).css("display");
    var is_hide_by_logic = isNotEmpty($("#question_"+qid).attr("hideByLogic")) ? true : false;
    if ((!isNotEmpty(css_str) || css_str == "none") && is_hide_by_logic){
        return true;
    }
    return false;
}

function Process_title_p(id) {
    var title_html = $('#' + id + ' .topic_title p:eq(0)').html();
    $('#' + id + ' .topic_title p:eq(0)').replaceWith("<span>"+title_html+"</span>");
}

function check_answer_integrity(){
    var is_intact = true;
    return is_intact;
    for (var page_id in question_visible_map){
        var visible_qid_list = question_visible_map[page_id];
        for (var i = 0; i < visible_qid_list.length; i++) {
            var question_id = visible_qid_list[i];
            if(!(question_id in total_answers)){
                var question = get_question(question_id);
                // 如果题目设置了允许为空, 或者是描述题
                if ('allow_null' in question.custom_attr || question.question_type === QUESTION_TYPE_DESC){}
                // 如果是填空题或者多项填空题, 并且选项中设置了允许为空
                else if (check_in(question.question_type, [QUESTION_TYPE_BLANK, QUESTION_TYPE_MULTIPLE_BLANK])){
                    for (var i = 0; i < question.option_list.length; i++) {
                        var option = question.option_list[i];
                        if ('allow_null' in option.custom_attr){}
                        else{
                            is_intact = false;
                            break;
                        }
                    };
                }
                else{
                    is_intact = false;
                    break;
                }
            }
        };
    }
    return is_intact;
}

var verify_question_option = {
    show: function(qid, errorTxt){
        $('#question_box').children('li').each(function(){
            if($(this).attr('oid') == qid){
                $('<div class="topic_type_error" style="padding:8px 15px; background:#fcecec; color:#f2395b;">' + errorTxt + '</div>').insertBefore($(this).find('.topic_type'));
            };
        });
    },
    hide: function(qid){
        $('#question_box').children('li').each(function(){
            if($(this).attr('oid') == qid){
                $(this).find('.topic_type_error').remove();
            };
        });
    }
};

function check_answer_unique(qmodels){
    var answers = {};
    var result = null;
    for (var i = 0; i < qmodels.length; i++) {
        var qmodel = qmodels[i];
        var get_answer_func = qmodel.get_getanswer_function();
        var answer = get_answer_func(qmodel);
        if (isNotEmpty(answer)){
            answers[qmodel.qid] = answer;
        }
    }
    if (isNotEmpty(answers)){
        result = send_check_unique_request(answers);
        if (isNotEmpty(result)){
            is_unique = false;
            for(var qid in result){
                var option_id_list = result[qid];
                for (var i = 0; i < option_id_list.length; i++) {
                    var option_id = option_id_list[i];
                    $("#"+option_id).addClass("invalid");
                    $("#tip_"+option_id).show();
                }
            }
        }
    }
    return result;
}

function send_check_unique_request(answers){
    var data = {
        answer_str: toJSONString(answers)
    };
    var duplicate_answer = {};
    syncPost("/f/unique_check/", data, function(ret){
        duplicate_answer = ret.duplicate_answer;
    });
    return duplicate_answer;
}

function is_blank(question){
    return check_in(question.question_type, [QUESTION_TYPE_BLANK, QUESTION_TYPE_MULTIPLE_BLANK]);
}
