var QUESTION_DICT = {};
var QUESTIONPAGE_DICT = {};
var QMODEL_DICT = {};
var JUMPCONSTRIANT_DICT = {};
var DISPLAYCONSTRIANT_DICT = {};
var AUTOREPLACE_SOURCE_Q_DICT = {};
var AUTOREPLACE_OBJ_ID_DICT = {};
var total_answers = {};
var JUMPCONSTRAINT_SOURCE_Q_DICT = {};
var DISPLAYCONSTRAINT_SOURCE_Q_DICT = {};
var RELATED_QUESTION_DICT = {};
var DISPLAYCONSTRIANT_DEST_QID_LIST = [];
var answer_path = [];
var curr_time_cost = 0;
var site_url = window.location.protocol + "//" + window.location.host;
var mobile_auth_queston_status;
var selected_related_questions = [];

function add_question(question) {
    QUESTION_DICT[get_oid(question)] = question;
}

function remove_question(qid) {
    delete QUESTION_DICT[qid];
}

//初始化动作
if (isNotEmpty(project)) {
    for (var i = 0; i < project.questionpage_list.length; i++) {
        var page = project.questionpage_list[i];
        QUESTIONPAGE_DICT[get_oid(page)] = page;
        for (var k = 0; k < page.question_list.length; k++) {
            var question = page.question_list[k];
            if (question.matrixrow_id_list && question.matrixrow_id_list.length === 0) {
                question.matrixrow_list = [];
            }
            QUESTION_DICT[get_oid(question)] = question;
        }
    }
    if (project.hasOwnProperty("jumpconstraint_list")) {
        for (var i = 0; i < project.jumpconstraint_list.length; i++) {
            var jumpconstraint = project.jumpconstraint_list[i];
            JUMPCONSTRIANT_DICT[jumpconstraint.id] = jumpconstraint;
            if (JUMPCONSTRAINT_SOURCE_Q_DICT[jumpconstraint.question_id]) {
                JUMPCONSTRAINT_SOURCE_Q_DICT[jumpconstraint.question_id].push(jumpconstraint);
            } else {
                JUMPCONSTRAINT_SOURCE_Q_DICT[jumpconstraint.question_id] = [jumpconstraint];
            }
        }
    }
    if (project.hasOwnProperty("displayconstraint_list")) {
        for (var i = 0; i < project.displayconstraint_list.length; i++) {
            var displayconstraint = project.displayconstraint_list[i];
            DISPLAYCONSTRIANT_DICT[displayconstraint.id] = displayconstraint;
            if (DISPLAYCONSTRAINT_SOURCE_Q_DICT[displayconstraint.question_id]) {
                DISPLAYCONSTRAINT_SOURCE_Q_DICT[displayconstraint.question_id].push(displayconstraint);
            } else {
                DISPLAYCONSTRAINT_SOURCE_Q_DICT[displayconstraint.question_id] = [displayconstraint];
            }
            for (var j = 0; j < displayconstraint.condition.condition_item_list.length; j++) {
                DISPLAYCONSTRIANT_DEST_QID_LIST.push(displayconstraint.condition.condition_item_list[j].question_id);
            }
        }
    }
    if (project.hasOwnProperty("question_relation_list")) {
        for (var i = 0; i < project.question_relation_list.length; i++) {
            var question_relation = project.question_relation_list[i];
            if (question_relation.from_qid in RELATED_QUESTION_DICT) {
                RELATED_QUESTION_DICT[question_relation.from_qid].push(question_relation);
            } else {
                RELATED_QUESTION_DICT[question_relation.from_qid] = [question_relation];
            }
        }
    }
    if (project.hasOwnProperty("autoreplace_list")) {
        for (var i = 0; i < project.autoreplace_list.length; i++) {
            var autoreplace = project.autoreplace_list[i];
            var source_items = AUTOREPLACE_SOURCE_Q_DICT[autoreplace.source_qid];
            var obj_items = AUTOREPLACE_OBJ_ID_DICT[autoreplace.obj_id];
            if (isNotEmpty(source_items)) {
                source_items.push(autoreplace);
                AUTOREPLACE_SOURCE_Q_DICT[autoreplace.source_qid] = source_items;
            } else {
                AUTOREPLACE_SOURCE_Q_DICT[autoreplace.source_qid] = [autoreplace];
            }
            if (isNotEmpty(obj_items)) {
                obj_items.push(autoreplace);
                AUTOREPLACE_OBJ_ID_DICT[autoreplace.obj_id] = obj_items;
            } else {
                AUTOREPLACE_OBJ_ID_DICT[autoreplace.obj_id] = [autoreplace];
            }
        }
    }
}
