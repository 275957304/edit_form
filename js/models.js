
//-------------super class-----------
function QBase(question){
    this.question = arguments[0] || null;
    if (isNotEmpty(this.question)){
        this.qid = get_oid(this.question);
        this.title = copy_obj(this.question.title);
        if (isNotEmpty(this.question.cid)){
            var cid = copy_obj(this.question.cid);
            this.seq = cid.substring(1, cid.length);
        }
    }
}

QBase.prototype.set_question = function(question) {
    this.question = question;
};

QBase.prototype.get_survey_html = function() {
    return "";
};

QBase.prototype.get_base_option_list = function() {
    if (isNotEmpty(this.question.option_list)){
        return this.question.option_list;
    }
    return [];
};

QBase.prototype.get_base_matrixrow_list = function() {
    if (isNotEmpty(this.question.matrixrow_list)){
        return this.question.matrixrow_list;
    }
    return [];
};

QBase.prototype.get_current_answer = function() {
    return total_answers[this.qid];
};

QBase.prototype.get_survey_source = function() {
    return '';
};

QBase.prototype.gen_edit_template = function() {
    var source = this.get_edit_template();
    return TemplateFactory.getHtml(this, source);
};

QBase.prototype.gen_survey_template = function() {
    var source = this.get_survey_source();
    if (isNotEmpty(source)){
        var href = window.location.href;
        var show_seq = false;
        if (href.indexOf('preview=1')>=0){
            if (href.indexOf('show_seq=1')>=0){
                show_seq = true;
            }else if (href.indexOf('show_seq=0')>=0){
                show_seq=false;
            }else if ("show_seq" in project.custom_attr){
                show_seq = true;
            }else {
                show_seq=false;
            }
        }else{
            if ("show_seq" in project.custom_attr){
                show_seq = true;
            }
        }
        if (show_seq){
            if (this.title.indexOf("Qnum") === -1){
                this.title = '<span class="Qnum">' + this.seq + '.</span> ' + this.title;
            }
        }
        // this.title += parseInt(this.estimate_time());
        return TemplateFactory.getHtml(this, source);
    }else{
        console.warn("QModel: " + this + "has no survey_source yet.");
        return "";
    }
};

QBase.prototype.get_selected = function() {
    return "";
};

QBase.prototype.get_input = function() {
    return "";
};

QBase.prototype.get_validate_function = function() {
    return function(){return true;};
};

QBase.prototype.get_getanswer_function = function() {
    return function(){return null};
};

QBase.prototype.estimate_time = function() {
    return estimate_map[this.qid];
};

QBase.prototype.show_option_msg = function(option_id, msg) {
    return;
};

QBase.prototype.clear_option_msg = function(option_id) {
    return;
};

QBase.prototype.show_edit_error_msg = function() {
    var msg = '请至少添加1个选项';
    verify_question_option.show(this.qid, msg);
};

QBase.prototype.hide_edit_error_msg = function() {
    verify_question_option.hide(this.qid);
};


//-------单选题-------
function QSingle(question){
    QBase.call(this, question);
}

QSingle.prototype = new QBase();

QSingle.prototype.get_selected = function() {
    var answer = this.get_current_answer();
    if (isNotEmpty(answer)){
        return answer[this.question.id];
    }
    return null;
};

QSingle.prototype.get_input = function() {
    var answer = this.get_current_answer();
    if (isNotEmpty(answer)){
        return answer[this.qid + "_open"];
    }
    return null;
};

QSingle.prototype.get_edit_template = function() {
    var disp_type = this.question.custom_attr['disp_type'] || 'vertical';
    if ("dropdown" == disp_type || "dropdown" in this.question.custom_attr){
        return source_qsingle_dropdown;
    }
    return source_qsingle;
};

QSingle.prototype.get_survey_source = function() {
    var disp_type = this.question.custom_attr['disp_type'] || 'vertical';
    if ("dropdown" == disp_type || "dropdown" in this.question.custom_attr){
        return source_qsingle_dropdown;
    }
    return source_qsingle;
};

QSingle.prototype.get_selected = function() {
    var current_answer = this.get_current_answer();
    if (isNotEmpty(current_answer)){
        return current_answer[0];
    }
    return "";
};

QSingle.prototype.get_input = function() {
    var current_answer = this.get_current_answer();
    if (isNotEmpty(current_answer) && current_answer.length == 2){
        return current_answer[1];
    }
    return "";
};

QSingle.prototype.get_validate_function = function() {
    return validate_answer_qsingle;
};

QSingle.prototype.get_getanswer_function = function() {
    return get_answer_qsingle;
};

QSingle.prototype.show_option_msg = function(option_id, msg) {
    $("#"+option_id).next().text(msg);
};

QSingle.prototype.clear_option_msg = function(option_id) {
    $("#"+option_id).next().text("");
};


QSingle.prototype.show_edit_error_msg = function() {
    var msg = '请至少添加1个选项';
    verify_question_option.show(this.qid, msg);
};

//---------多选题---------

function QMultiple(question){
    QBase.call(this, question);
}

QMultiple.prototype = new QBase();

QMultiple.prototype.get_selected = function() {
    var answer = this.get_current_answer();
    if (isNotEmpty(answer)){
        return answer[this.qid];
    }
    return [];
};

QMultiple.prototype.get_input = function(option_id_or_cid) {
    var option = get_option(this.qid, option_id_or_cid);
    if (isNotEmpty(answer)){
        return answer[this.qid + option.id + "_open"];
    }
    return "";
};

QMultiple.prototype.get_edit_template = function() {
    return source_qmultiple;
};

QMultiple.prototype.get_survey_source = function() {
    return source_qmultiple;
};

QMultiple.prototype.get_selected = function() {
    var current_answer = this.get_current_answer();
    if (isNotEmpty(current_answer)){
        return $.map(current_answer, function(item){
            if (isNotEmpty(item)){
                return item[0];
            }
        });
    }
    return [];
};

QMultiple.prototype.get_input = function() {
    var current_answer = this.get_current_answer();
    if (isNotEmpty(current_answer)){
        return $.map(current_answer, function(item){
            if (isNotEmpty(item) && item.length == 2){
                return item[1];
            }
        });
    }
    return [];
};

QMultiple.prototype.get_validate_function = function() {
    return validate_answer_qmultiple;
};

QMultiple.prototype.get_getanswer_function = function() {
    return get_answer_qmultiple;
};

QMultiple.prototype.show_option_msg = function(option_id, msg) {
    $("#"+option_id).next().text(msg);
};

QMultiple.prototype.clear_option_msg = function(option_id) {
    $("#"+option_id).next().text("");
};

QMultiple.prototype.show_edit_error_msg = function() {
    var msg = '请至少添加1个选项';
    verify_question_option.show(this.qid, msg);
};


//--------填空题-------
function QBlank(question){
    QBase.call(this, question);
}

QBlank.prototype = new QBase();

QBlank.prototype.get_edit_template = function() {
    return source_qblank;
};

QBlank.prototype.get_survey_source = function() {
    return source_qblank;
};

QBlank.prototype.get_validate_function = function() {
    return validate_answer_qblank;
};

QBlank.prototype.get_getanswer_function = function() {
    return get_answer_qblank;
};

QBlank.prototype.get_selected = function() {
    var answer = this.get_current_answer();
    if (isNotEmpty(answer)){
        var option_id = this.question.option_id_list[0];
        var input_val = answer[option_id+"_open"];
        if (isNotEmpty(input_val)){
            return input_val;
        }
        return "";
    }
    return "";
};

QBlank.prototype.show_option_msg = function(option_id, msg) {
    $("#tip_"+this.qid).text(msg);
};

QBlank.prototype.clear_option_msg = function(option_id) {
    $("#tip_"+this.qid).text("");
};

//-----打分题----
function QScore(question){
    QBase.call(this, question);
}

QScore.prototype = new QBase();

QScore.prototype.get_edit_template = function() {
    return source_qscore;
};

QScore.prototype.get_survey_source = function() {
    return source_qscore;
};

QScore.prototype.get_validate_function = function() {
    return validate_answer_qscore;
};

QScore.prototype.get_getanswer_function = function() {
    return get_answer_qscore;
};

QScore.prototype.show_edit_error_msg = function() {
    var msg = '请至少添加1个打分项';
    verify_question_option.show(this.qid, msg);
};

//---------排序题--------
function QOrder(question){
    QBase.call(this, question);
}

QOrder.prototype = new QBase();

QOrder.prototype.get_edit_template = function() {
    return source_qorder;
};

QOrder.prototype.get_survey_source = function() {
    return source_qsort;
};

QOrder.prototype.get_validate_function = function() {
    return validate_answer_qsort;
};

QOrder.prototype.get_getanswer_function = function() {
    return get_answer_qsort;
};

QOrder.prototype.show_edit_error_msg = function() {
    var msg = '请至少添加1个选项';
    verify_question_option.show(this.qid, msg);
};


//-------多项填空题---------
function QMultipleBlank(question){
    QBase.call(this, question);
}

QMultipleBlank.prototype = new QBase();

QMultipleBlank.prototype.get_edit_template = function() {
    return source_qmultiple_blank;
};

QMultipleBlank.prototype.get_survey_source = function() {
    return source_qmultiple_blank;
};

QMultipleBlank.prototype.get_validate_function = function() {
    return validate_answer_qmultipleblank;
};

QMultipleBlank.prototype.get_getanswer_function = function() {
    return get_answer_qmultipleblank;
};


QMultipleBlank.prototype.show_option_msg = function(option_id, msg) {
    $("#"+option_id).next().text(msg);
};

QMultipleBlank.prototype.clear_option_msg = function(option_id) {
    $("#"+option_id).next().text("");
};

QMultipleBlank.prototype.show_edit_error_msg = function() {
    var msg = '请至少添加1个填空项';
    verify_question_option.show(this.qid, msg);
};

//-------矩阵单选题--------
function QMatrixSingle(question){
    QBase.call(this, question);
}

QMatrixSingle.prototype = new QBase();

QMatrixSingle.prototype.get_edit_template = function() {
    return source_qmatrix_single;
};

QMatrixSingle.prototype.get_survey_source = function() {
    if ("is_swap" in this.question.custom_attr){
        return source_qmatrix_single_swap;
    }
    return source_qmatrix_single;
};

QMatrixSingle.prototype.get_validate_function = function() {
    return validate_answer_qmatrixsingle;
};

QMatrixSingle.prototype.get_getanswer_function = function() {
    return get_answer_qmatrixsingle;
};

QMatrixSingle.prototype.show_option_msg = function(option_id, msg) {
    $("#"+option_id).next().next().text(msg);
};

QMatrixSingle.prototype.clear_option_msg = function(option_id) {
    $("#"+option_id).next().next().text("");
};

QMatrixSingle.prototype.show_edit_error_msg = function() {
    var msg = '请至少添加1个矩阵行和选项';
    verify_question_option.show(this.qid, msg);
};

//------矩阵多选题------
function QMatrixMultiple(question){
    QBase.call(this, question);
}

QMatrixMultiple.prototype = new QBase();

QMatrixMultiple.prototype.get_edit_template = function() {
    return source_qmatrix_multiple;
};

QMatrixMultiple.prototype.get_survey_source = function() {
    if ("is_swap" in this.question.custom_attr){
        return source_qmatrix_multiple_swap;
    }
    return source_qmatrix_multiple;
};

QMatrixMultiple.prototype.get_validate_function = function() {
    return validate_answer_qmatrixmultiple;
};

QMatrixMultiple.prototype.get_getanswer_function = function() {
    return get_answer_qmatrixmultiple;
};

QMatrixMultiple.prototype.show_option_msg = function(option_id, msg) {
    $("#"+option_id).next().next().text(msg);
};

QMatrixMultiple.prototype.clear_option_msg = function(option_id) {
    $("#"+option_id).next().next().text("");
};

QMatrixMultiple.prototype.show_edit_error_msg = function() {
    var msg = '请至少添加1个矩阵行和选项';
    verify_question_option.show(this.qid, msg);
};


//矩阵填空题
function QMatrixBlank(question){
    QBase.call(this, question);
}

QMatrixBlank.prototype = new QBase();

QMatrixBlank.prototype.get_edit_template = function() {
    return source_qmatrix_blank;
};

QMatrixBlank.prototype.get_survey_source = function() {
    if ("is_swap" in this.question.custom_attr){
        return source_qmatrix_blank_swap;
    }
    return source_qmatrix_blank;
};

QMatrixBlank.prototype.get_validate_function = function() {
    return validate_answer_qmatrixblank;
};

QMatrixBlank.prototype.get_getanswer_function = function() {
    return get_answer_qmatrixblank;
};

QMatrixBlank.prototype.show_option_msg = function(option_id, msg) {
    $("#"+option_id).next().next().text(msg);
};

QMatrixBlank.prototype.clear_option_msg = function(option_id) {
    $("#"+option_id).next().next().text("");
};

QMatrixBlank.prototype.show_edit_error_msg = function() {
    var msg = '请至少添加1个矩阵行和填空项';
    verify_question_option.show(this.qid, msg);
};

//矩阵打分题
function QMatrixScore(question){
    QBase.call(this, question);
}

QMatrixScore.prototype = new QBase();

QMatrixScore.prototype.get_edit_template = function() {
    return source_qmatrix_score;
};

QMatrixScore.prototype.get_survey_source = function() {
    if ("is_swap" in this.question.custom_attr){
        return source_qmatrix_score_swap;
    }
    return source_qmatrix_score;
};

QMatrixScore.prototype.get_validate_function = function() {
    return validate_answer_qmatrixscore;
};

QMatrixScore.prototype.get_getanswer_function = function() {
    return get_answer_qmatrixscore;
};

QMatrixScore.prototype.show_edit_error_msg = function() {
    var msg = '请至少添加1个打分项和分值';
    verify_question_option.show(this.qid, msg);
};


//描述题
function QDesc(question){
    QBase.call(this, question);
}

QDesc.prototype = new QBase();

QDesc.prototype.get_edit_template = function() {
    if (this.question.custom_attr.disp_type === "split_line"){
        return source_qdesc_split_line;
    }
    return source_qdesc;
};

QDesc.prototype.get_survey_source = function() {
    if (this.question.custom_attr.disp_type === "split_line"){
        return source_qdesc_split_line;
    }
    return source_qdesc;
};



//下拉框式填空题
function QBlankDropdown(question){
    QBlank.call(this, question);
}

QBlankDropdown.prototype = new QBase();

QBlankDropdown.prototype.get_edit_template = function() {
    return source_qblank_dropdown;
};

QBlankDropdown.prototype.get_survey_source = function() {
    return source_qblank_dropdown;
};

QBlankDropdown.prototype.get_validate_function = function() {
    return validate_answer_qblank_dropdown;
};

QBlankDropdown.prototype.get_getanswer_function = function() {
    return get_answer_qblank_dropdown;
};

QBlankDropdown.prototype.bind_drop = function() {
    var drop_type = this.question.custom_attr.drop_type;
    var qdiv = $("#question_" + this.qid);
    // var null_option_html = "<option value=''>请选择</option>";
    if (drop_type == "city" || drop_type == "address"){
        var province = qdiv.find("select:eq(0)");
        var city = qdiv.find("select:eq(1)");
        var region = qdiv.find("select:eq(2)");
        for (var i = 0; i < ssq_data.length; i++) {
            var p_obj = ssq_data[i];
            province.append("<option value="+p_obj.name+">"+p_obj.name+"</option>");
        }
        province.change(function(){
            if (this.value != ""){
                var val = this.value;
                var p_obj = ssq_data.filter(function(e){return e.name == val;})[0];
                city.html("<option value=''>请选择市</option>");
                for (var i = 0; i < p_obj.sub.length; i++) {
                    var c_obj = p_obj.sub[i];
                    city.append("<option value="+c_obj.name+">"+c_obj.name+"</option>");
                }
                region.html("<option value=''>请选择区/县</option>");
            }else{
                city.html("<option value=''>请选择市</option>");
                region.html("<option value=''>请选择区/县</option>");
            }
        });
        city.change(function(){
            if (this.value != ""){
                var c_val = this.value;
                var p_val = province.val();
                var p_obj = ssq_data.filter(function(e){return e.name == p_val;})[0];
                var c_obj = p_obj.sub.filter(function(e){return e.name == c_val})[0];
                region.html("<option value=''>请选择区/县</option>");
                for (var i = 0; i < c_obj.sub.length; i++) {
                    var area = c_obj.sub[i];
                    region.append("<option value="+area.name+">"+area.name+"</option>");
                }
            }else{
                region.html("<option value=''>请选择区/县</option>");
            }
        });
    }else if (drop_type == "age"){
        var year = qdiv.find("select:eq(0)");
        var month = qdiv.find("select:eq(1)");
        var date = qdiv.find("select:eq(2)");
        var now = new Date();
        for (var i = now.getFullYear(); i >= 1900; i--) {
            // if (i == 1980){
            //     year.append("<option value='"+i+"' selected='selected'>"+i+"</option>");
            // }
            year.append("<option value='"+i+"'>"+i+"</option>");
        }
        for (var i = 1; i <= 12; i++) {
            month.append("<option value='"+i+"'>"+i+"</option>");
        }
        year.change(function(){
            var days = getDaysInOneMonth(year.val(), month.val());
            date.html("<option value=''>请选择日</option>");
            for (var i = 1; i <= days; i++) {
                date.append("<option value='"+i+"'>"+i+"</option>");
            }
        });
        month.change(function(){
            var days = getDaysInOneMonth(year.val(), month.val());
            date.html("<option value=''>请选择日</option>");
            for (var i = 1; i <= days; i++) {
                date.append("<option value='"+i+"'>"+i+"</option>");
            }
        });
        year.focus(function(){
            if (this.value == ""){
                this.value = "1980";
            }
        });
    }
};


function QBlankExtra(question){
    QMultipleBlank.call(this, question);
}

QBlankExtra.prototype = new QBase();

QBlankExtra.prototype.get_edit_template = function() {
    if (this.question.custom_attr.disp_type === "date"){
        return source_qblank_date;
    }else if (this.question.custom_attr.disp_type === "time"){
        return source_qblank_time;
    }else if (this.question.custom_attr.disp_type === "upload_file"){
        return source_qblank_upload_file;
    }else if (this.question.custom_attr.disp_type === DISP_TYPE_GEOGRAPHICAL){
        return source_qblank_geographical;
    }
};

QBlankExtra.prototype.get_survey_source = function() {
    if (this.question.custom_attr.disp_type === "date"){
        return source_qblank_date;
    }else if (this.question.custom_attr.disp_type === "time"){
        return source_qblank_time;
    }else if (this.question.custom_attr.disp_type === "upload_file"){
        return source_qblank_upload_file;
    }else if (this.question.custom_attr.disp_type === DISP_TYPE_GEOGRAPHICAL){
        return source_qblank_geographical;
    }
};

QBlankExtra.prototype.get_validate_function = function() {
    if (this.question.custom_attr.disp_type === "date"){
        return validate_answer_qblank_date;
    }else if (this.question.custom_attr.disp_type === "time"){
        return validate_answer_qblank_time;
    }else if (this.question.custom_attr.disp_type === "upload_file"){
        return validate_answer_qblank_upload_file;
    }else if (this.question.custom_attr.disp_type === DISP_TYPE_GEOGRAPHICAL){
        return validate_answer_qblank_geographical;
    }
};

QBlankExtra.prototype.get_getanswer_function = function() {
    if (this.question.custom_attr.disp_type === "date"){
        return get_answer_qblank_date;
    }else if (this.question.custom_attr.disp_type === "time"){
        return get_answer_qblank_time;
    }else if (this.question.custom_attr.disp_type === "upload_file"){
        return get_answer_qblank_upload_file;
    }else if (this.question.custom_attr.disp_type === DISP_TYPE_GEOGRAPHICAL){
        return get_answer_qblank_geographical;
    }
};

QBlankExtra.prototype.show_edit_error_msg = function() {
    var msg = '请至少添加1个选项';
    verify_question_option.show(this.qid, msg);
};


function QImageSingle(question){
    QSingle.call(this, question);
}

QImageSingle.prototype = new QSingle();

QImageSingle.prototype.get_edit_template = function() {
    return source_qimage_single;
};

QImageSingle.prototype.get_survey_source = function() {
    return source_qimage_single;
};

QImageSingle.prototype.get_validate_function = function() {
    return validate_answer_for_q_image_single;
};

QImageSingle.prototype.get_getanswer_function = function() {
    return get_answer_q_image_single;
};

QImageSingle.prototype.show_edit_error_msg = function() {
    var msg = '请至少添加1张图片';
    verify_question_option.show(this.qid, msg);
};



function QImageMultiple(question){
    QMultiple.call(this, question);
}

QImageMultiple.prototype = new QMultiple();

QImageMultiple.prototype.get_edit_template = function() {
    return source_qimage_multiple;
};

QImageMultiple.prototype.get_survey_source = function() {
    return source_qimage_multiple;
};

QImageMultiple.prototype.get_validate_function = function() {
    return validate_answer_q_image_multiple;
};

QImageMultiple.prototype.get_getanswer_function = function() {
    return get_answer_q_image_multiple;
};

QImageMultiple.prototype.show_edit_error_msg = function() {
    var msg = '请至少添加1张图片';
    verify_question_option.show(this.qid, msg);
};

//--------------------------nps start-----
function QNpsScore(question){
    QScore.call(this, question);
}

QNpsScore.prototype = new QScore();

QNpsScore.prototype.get_edit_template = function() {
    return source_qnps_score;
};

QNpsScore.prototype.get_survey_source = function() {
    return source_qnps_score;
};

QNpsScore.prototype.get_validate_function = function() {
    return validate_answer_qNpsScore;
};

QNpsScore.prototype.get_getanswer_function = function() {
    return get_answer_qNpsScore;
};

//--------------------------nps end-----


//---------单项打分题---------

function QSingleVote(question){
    QSingle.call(this, question);
}

QSingleVote.prototype = new QSingle();

QSingleVote.prototype.get_edit_template = function() {
    return source_qsinglevote;
};

QSingleVote.prototype.get_survey_source = function() {
    return source_qsinglevote;
};



//---------多项打分题---------

function QMultipleVote(question){
    QBase.call(this, question);
}

QMultipleVote.prototype = new QMultiple();

QMultipleVote.prototype.get_edit_template = function() {
    return source_qmultiplevote;
};

QMultipleVote.prototype.get_survey_source = function() {
    return source_qmultiplevote;
};



//---------图片单项打分题---------

function QImageVoteSingle(question){
    QSingle.call(this, question);
}

QImageVoteSingle.prototype = new QImageSingle();

QImageVoteSingle.prototype.get_edit_template = function() {
    return source_qimagevote_single;
};

QImageVoteSingle.prototype.get_survey_source = function() {
    return source_qimagevote_single;
};



//---------图片多项打分题---------

function QImageVoteMultiple(question){
    QMultiple.call(this, question);
}

QImageVoteMultiple.prototype = new QImageMultiple();

QImageVoteMultiple.prototype.get_edit_template = function() {
    return source_qimagevote_multiple;
};

QImageVoteMultiple.prototype.get_survey_source = function() {
    return source_qimagevote_multiple;
};


//------QModel Factory -----

var QMODEL_CLASS_MAP = {};

QMODEL_CLASS_MAP[QUESTION_TYPE_SINGLE] = QSingle;
QMODEL_CLASS_MAP[QUESTION_TYPE_MULTIPLE] = QMultiple;
QMODEL_CLASS_MAP[QUESTION_TYPE_BLANK] = QBlank;
QMODEL_CLASS_MAP[QUESTION_TYPE_SCORE] = QScore;
QMODEL_CLASS_MAP[QUESTION_TYPE_ORDER] = QOrder;
QMODEL_CLASS_MAP[QUESTION_TYPE_MULTIPLE_BLANK] = QMultipleBlank;
QMODEL_CLASS_MAP[QUESTION_TYPE_MATRIX_SINGLE] = QMatrixSingle;
QMODEL_CLASS_MAP[QUESTION_TYPE_MATRIX_MULTIPLE] = QMatrixMultiple;
QMODEL_CLASS_MAP[QUESTION_TYPE_MATRIX_SCORE] = QMatrixScore;
QMODEL_CLASS_MAP[QUESTION_TYPE_MATRIX_BLANK] = QMatrixBlank;
QMODEL_CLASS_MAP[QUESTION_TYPE_DESC] = QDesc;
QMODEL_CLASS_MAP[QUESTION_TYPE_BLANK_DROPDOWN] = QBlankDropdown;

var QModelFactory = {
    getQModel: function(question){
        var QModelClass = QMODEL_CLASS_MAP[question.question_type];
        if (isNotEmpty(question.custom_attr.disp_type)){
            if (question.question_type === QUESTION_TYPE_MULTIPLE_BLANK){
                return new QBlankExtra(question);
            }else if (check_in(question.question_type, [QUESTION_TYPE_SINGLE, QUESTION_TYPE_MULTIPLE])){
                var disp_type = question.custom_attr.disp_type;
                if (disp_type == "image_single"){
                    return new QImageSingle(question);
                }else if (disp_type == "image_multiple"){
                    return new QImageMultiple(question);
                }else if (disp_type == "singlevote"){
                    // 文字投票题（单选）
                    return new QSingleVote(question);
                }else if (disp_type == "multiplevote"){
                    // 文字投票题（多选）
                    return new QMultipleVote(question);
                }else if (disp_type == "imagevote_single"){
                    return new QImageVoteSingle(question);
                    // 图片投票题（单选）
                }else if (disp_type == "imagevote_multiple"){
                    // 图片投票题（多选）
                    return new QImageVoteMultiple(question);
                }else{
                    return new QModelClass(question);
                }
            }else if (check_in(question.question_type, [QUESTION_TYPE_SCORE])){
                var disp_type = question.custom_attr.disp_type;
                if (disp_type == "nps_score"){
                    return new QNpsScore(question);
                }
            }else{
                return new QModelClass(question);
            }
        }
        return new QModelClass(question);
    }
};
