// 选项关联的选项模板
var source_relation_option = '{@each option_list as option}<li data-related="true" data-related-question-id="${option.question_qid}"><input type="${form_type}" name="${form_type}" id="option_${option.option_id}" value="option_${option.option_id}"><label class="T_edit_min_disabled" for="" name="option" id="${option.option_id}">$${option.option_title}<span class="text-relation">[关联自$${option.question_cid}]</span></label>{@if option.is_open}<input type="text" name="" id="" class="open_input">{@/if}</li>{@/each}';
var source_relation_option_dropdown = '{@each option_list as option}<option data-related="true" data-related-question-id="${option.question_qid}" class="T_edit_min_disabled" id="58f70f78e73a0914a4f660c4">$${option.option_title}<span class="text-relation">[关联自$${option.question_cid}]</span></option>{@/each}';

jQuery(document).ready(function($) {
    //----绑定事件---

    $(".ajaxGet").die().live("click", ajaxGet);

    $(".ajaxPost").die().live("click", function() {
        var func_name = $(this).attr("func");
        var func = null;
        if(isNotEmpty(func_name)) {
            eval("func = " + func_name);
            if(isNotEmpty(func)) {
                func();
            }
        }
    });

    $(".ajaxSubmit").die().live("submit", ajaxSubmit);

    //消除加载提示框
    // loadMack("off");

    //初始化题目
    init_question();
    init_question_desc();

    $("#proj_func_select").change(function(){
        var proj_func_id = $(this).val();
        var proj = {
            _id: {"$oid": get_oid(project)},
            project_func_id: proj_func_id
        };
        var data = {
            struct_str: toJSONString(proj),
            cls_type: "Project"
        };
        ajaxPost("/edit/ajax/struct_save/" + get_oid(project), data);
    });

    //图片修改("图片点选题")
    Qimg_edit();

    //切换页面时的检查函数
    $(window).focus(function(){
        $.ajax({
            type: "GET",
            url: "/edit/ajax/check_status_for_edit/?pid=" + get_oid(project),
            dataType: "JSON",
            success: function(ret){
                if (ret.user_online){
                    // console.log("user is online");
                }else{
                    // console.warn("user is offline");
                    jsAlert({content:"<p style='text-align:left;'>登录超时, 请重新登录</p>", obj: function(){
                        window.location.href = "/login/";
                    }});
                }
                if (ret.can_edit){
                    // console.log("this project can be edited");
                }else{
                    jsAlert({content:"<p style='text-align:left;'>你的问卷已在其他页面发布成功，如需修改，请点击编辑按钮。</p>", obj: function(){
                        window.location.href = "/mysurvey/";
                    }});
                }
            }
        });
    });

    $.ajax({
        type: "GET",
        url: "/edit/ajax/check_status_for_edit/?pid=" + get_oid(project),
        dataType: "JSON",
        success: function(ret){
            if (ret.user_online){
                // console.log("user is online");
            }else{
                // console.warn("user is offline");
                jsAlert({content:"<p style='text-align:left;'>登录超时, 请重新登录</p>", obj: function(){
                    window.location.href = "/login/";
                }});
            }
            if (ret.can_edit){
                // console.log("this project can be edited");
            }else{
                jsAlert({content:"<p style='text-align:left;'>你的问卷已在其他页面发布成功，如需修改，请点击编辑按钮。</p>", obj: function(){
                    window.location.href = "/mysurvey/";
                }});
            }
        }
    });

    $("#end_desc_type").change(function(){
        var desc_type = $(this).val();
        if (desc_type == "complete"){
            $("#end_desc").html(project.end_desc).attr("name", "end_desc");
        }else{
            $("#end_desc").html(project.custom_attr.screenout_desc||"").attr("name", "screenout_desc");
        }
    });

});

function matrixWidthProcess(qid, col_width_array){
    var table_width =0;
    var objPadding =0;
    $("li[oid='"+qid+"'] table tbody:eq(0) tr").each(function(m){
        table_width =0;
        $(this).children("td").each(function(i){
             objPadding=parseFloat($(this).css('paddingLeft'))+parseFloat($(this).css('paddingRight'))+1;

             if(col_width_array[i]==undefined){col_width_array[i]=col_width_array[i-1]};
             $(this).width(col_width_array[i]+"px");
             if(m>0&&i>0){
               $(this).wrapInner('<div class="div" style="width:'+(col_width_array[i])+'px"></div>');
             }
             table_width+=col_width_array[i]+objPadding;
        });

    });
    $("li[oid='"+qid+"'] table").width(table_width);
}

function get_init_question(question_type) {
    return INIT_QUESTION_MAP[parseInt(question_type)];
}

function gen_init_template(question_type) {
    var init_question = get_init_question(question_type);
    var qmodel = get_qmodel(init_question);
    return qmodel.get_edit_html();
}
function cq_bg(){
    var len=$('#question_box li.module').length;
    if(len>0){
        $('#question_box').css('background','none');
    }else{
        $('#question_box').css('background','url(/static/images/tuo.png) no-repeat left 70px');
    }
}
function init_question(){
    for (var i = 0; i < project.questionpage_id_list.length; i++) {
        if (typeof(project.questionpage_id_list[i-1]) != "undefined"){
            $("#question_box").append(PAGE_TEMPLATE);
        }
        var page_id = project.questionpage_id_list[i];
        var page = get_questionpage(page_id);
        for (var k = 0; k < page.question_id_list.length; k++) {
            var question_id = page.question_id_list[k];
            var question = get_question(question_id);
            var question_content = null;
            try {
				if(!question.custom_attr.hide){
                    var qmodel = get_qmodel(question);
                    question_content = qmodel.gen_edit_template();
				}
            } catch(e) {
                console.warn("qmodel_" + question.question_type + " has an error: " + e.toString());
                continue;
            }
            $("#question_box").append(question_content);
            if (isNotEmpty(question.jumpconstraint_id_list2) || isNotEmpty(question.displayconstraint_id_list2)){
                set_jumpconstraint_status(get_oid(question), true, question.jumpconstraint_id_list2.length);
            }else{
                set_jumpconstraint_status(get_oid(question), false);
            }
            if (check_in(question.question_type, [QUESTION_TYPE_MATRIX_SINGLE, QUESTION_TYPE_MATRIX_MULTIPLE, QUESTION_TYPE_MATRIX_SCORE, QUESTION_TYPE_MATRIX_BLANK])){
                Width_mate(get_oid(question));
                if ('col_width' in question.custom_attr){
                    matrixWidthProcess(get_oid(question), question.custom_attr.col_width.parseJSON());
                }
            }
            // 初始化选项关联
            init_related_question_dict(question);
        }
    }
    cq_bg();
}

// 初始化选项关联
function init_related_question_dict(question) {
    var related_question_list = question.related_question_list,
        question_id = question._id.$oid;
    if(related_question_list && related_question_list.length > 0){
        for(var j = 0; j < related_question_list.length; j++){
            var related_qid = related_question_list[j]._id.$oid;
            var relation_qid_list = RELATED_QUESTION_DICT[related_qid] ? RELATED_QUESTION_DICT[related_qid] : [];
            if(relation_qid_list.indexOf(question_id) == -1) relation_qid_list.push(question_id);
            RELATED_QUESTION_DICT[related_qid] = relation_qid_list;
        }
    }
}

/**
 * 更新选项关联字典 RELATED_QUESTION_DICT
 * @param  {String}  qid  被更新选项关联的题目id
 * @param  {Array}  old_relation_qid_list  被更新选项关联的题目的老选项关联列表题目id列表
 * @param  {Array}  new_related_qid_list  被更新选项关联的题目的新选项关联列表题目id列表
 */
function update_related_question_dict(qid, old_relation_qid_list, new_related_qid_list) {
    old_relation_qid_list = old_relation_qid_list ? old_relation_qid_list : [];
    new_related_qid_list = new_related_qid_list ? new_related_qid_list : [];
    // 删除老的选项关联
    for(var i = 0; i < old_relation_qid_list.length; i++){
        var from_qid = old_relation_qid_list[i],
            related_qid_list = RELATED_QUESTION_DICT[from_qid] ? RELATED_QUESTION_DICT[from_qid] : [];
        if(related_qid_list.indexOf(qid) != -1){
            related_qid_list.splice(related_qid_list.indexOf(qid), 1);
            var index = related_qid_list.indexOf(qid);
            RELATED_QUESTION_DICT[from_qid] = related_qid_list;
        }
    }
    // 新增新的选项关联
    for(var i = 0; i < new_related_qid_list.length; i++){
        var from_qid = new_related_qid_list[i],
            related_qid_list = RELATED_QUESTION_DICT[from_qid] ? RELATED_QUESTION_DICT[from_qid] : [];
        if(related_qid_list.indexOf(qid) == -1){
            related_qid_list.push(qid);
        }
        RELATED_QUESTION_DICT[from_qid] = related_qid_list;
    }
    // 更新关联题目的关联选项
    update_question_relation_option(qid);
}

// 更新关联题目的关联选项
function update_question_relation_option(qid) {
    // qid_list 所有关联 qid 的题目列表
    var qid_list  = RELATED_QUESTION_DICT[qid];
    if(qid_list){
        for(var i = 0; i < qid_list.length; i++){
            var question_obj = QUESTION_DICT[qid_list[i]],
                disp_type = QUESTION_DICT[question_obj._id.$oid].custom_attr.disp_type,
                question_type = question_obj.question_type;
            var $unstyled = $('#question_box').find('li.question[oid='+ question_obj._id.$oid +']').find('ul.unstyled'),
                index = $unstyled.find('li[data-related-question-id='+ qid +']').index();
            $unstyled.find('li[data-related-question-id='+ qid +']').remove();

            var relation_option_list = [],
                form_type = '';
            if(question_type == QUESTION_TYPE_SINGLE){
                form_type = 'radio';
            }else if(question_type == QUESTION_TYPE_MULTIPLE){
                form_type = 'checkbox';
            }

            for(var j = 0; j < question_obj.related_question_list.length; j++){
                var relation_question = question_obj.related_question_list[j],
                    question_qid = relation_question._id.$oid,
                    question_cid = QUESTION_DICT[question_qid].cid;
                if(question_qid == qid){
                    // 默认选项批量添加选项时，会先删除默认选项，然后添加新选项，此时index=-1
                    // 如果j=0，根据选项关联的顺序index应为0
                    // 如果j>0，index应为上一个关联选项中最后一项的下标加1
                    if(index == -1){
                        if (j == 0) index = 0;
                        else{
                            var prev_oid = question_obj.related_question_list[j - 1]._id.$oid;
                            index = $unstyled.find('li[data-related-question-id='+ prev_oid +']:last').index() + 1;
                        }
                    }
                    get_relation_option_list(QUESTION_DICT[question_qid], qid, question_cid, relation_option_list);
                }
            }

            var data = {
                'form_type': form_type,
                'option_list': relation_option_list
            };
            var option_temp_html = juicer(source_relation_option, data);

            if(index == 0){
                $unstyled.prepend(option_temp_html);
            }else if(index > 0){
                $(option_temp_html).insertAfter($unstyled.find('li').eq(index-1));
            }
            if(disp_type == 'dropdown'){
                var $drop_down = $('#drop_down_' + question_obj._id.$oid);
                $drop_down.find('option[data-related-question-id='+ qid +']').remove();
                var drop_down_option_html = juicer(source_relation_option_dropdown, data);
                if(index == 0){
                    $drop_down.prepend(drop_down_option_html);
                }else if(index > 0){
                    $(drop_down_option_html).insertAfter($drop_down.find('option').eq(index-1));
                }
            }

            update_question_relation_option(question_obj._id.$oid);
        }
    }
}

// 获取指定关联题目的选项列表
function get_relation_option_list (question_obj, question_qid, question_cid, list){
    var option_list = question_obj.option_list,
        relation_option_list = [];
    var cur_len = list.length;
    for(var j = 0; j < option_list.length; j++){
        var option_id = option_list[j]._id.$oid,
            option_title = option_list[j].title,
            is_open = option_list[j].is_open;
        var option_obj = {
            'question_qid': question_qid,
            'question_cid': question_cid,
            'option_id': option_id,
            'option_title': option_title,
            'is_open': is_open
        }
        list.splice(list.length - cur_len, 0, option_obj);
    }
    if(question_obj.related_question_list){
        var question_obj_list = question_obj.related_question_list;
        for(var j = 0; j < question_obj_list.length; j++){
            get_relation_option_list(QUESTION_DICT[question_obj_list[j]._id.$oid], question_qid, question_cid, list);
        }
    }
}

function get_init_template(question_type) {
    var init_template = INIT_TEMPLATE_MAP[question_type];
    return init_template;
}

function deferredFun(){
    var param = arguments;
    var defer = $.Deferred();
    setTimeout(function(){
        var data = param[0](param[1], param[2], param[3], param[4], param[5], param[6]);
        defer.resolve(data);
    }, 50);
    return defer.promise();
}

function save_question(question_type, question_index, page_count) {
    if (question_type != "page"){
        var init_question = INIT_QUESTION_MAP[question_type];
        if (isNotEmpty(init_question)){
            var page_id = project.questionpage_id_list[page_count];
            init_question.questionpage_id = page_id;
            var data = {
                "question_struct": toJSONString(init_question),
                "questionpage_id": page_id,
                "index": question_index
            };
            var url = "/edit/ajax/question_create/" + get_oid(project);
            var question_content = null;
            syncPost(url, data, function(ret){
                if (ret.limit){
                    $('.loadCon,.loadMack').remove();
                    jsAlert({content:"<p style='text-align:left;'>最多只能添加200道题目</p>", obj: function(){
                        return;
                    }});
                    return;
                }

                var question_struct = ret.question;
                var page_index = project.questionpage_id_list.indexOf(ret.page_id);
                var page = project.questionpage_list[page_index];
                page.question_list.splice(question_index, 0, question_struct);
                page.question_id_list.splice(question_index, 0, get_oid(question_struct));
                add_question(question_struct);
                var qmodel = get_qmodel(question_struct);
                question_content = qmodel.gen_edit_template();
            });
            return question_content;
        }
    }else{
        var orig_page = project.questionpage_list[page_count];
        var orig_question_list = orig_page.question_list.slice(0, question_index);
        var orig_question_id_list = orig_page.question_id_list.slice(0, question_index);
        var new_question_list = orig_page.question_list.slice(question_index);
        var new_question_id_list = orig_page.question_id_list.slice(question_index);
        orig_page.question_list = orig_question_list;
        orig_page.question_id_list = orig_question_id_list;
        var data = {
            'orig_page_id': get_oid(orig_page),
            'new_page_struct': toJSONString({
                'project_id': get_oid(project),
                'question_id_list': new_question_id_list
            })
        };
        syncPost('/edit/ajax/questionpage_create/'+get_oid(project), data, function(ret){
            var new_page = ret.new_page;
            new_page.question_list = new_question_list;
            for (var i = 0; i < new_page.question_list.length; i++) {
                var question = new_page.question_list[i];
                question.questionpage_id = get_oid(new_page);
            }
            project.questionpage_list.splice(page_count + 1, 0, new_page);
            project.questionpage_id_list.splice(page_count + 1, 0, get_oid(new_page));
            QUESTIONPAGE_DICT[get_oid(new_page)] = new_page;
        });
        return PAGE_TEMPLATE;
    }
}

function after_dropped(question_type){
    //保存题目的顺序

    //如果是新添加题目, 则不需要执行保存顺序的动作
    if (isNotEmpty(question_type) && !isNaN(question_type)){
        return;
    }
    save_question_order();
}

function save_question_order(){
    var order_list = get_project_order_list();
    var data = {
        "order_list_str": toJSONString(order_list),
        "project_id": get_oid(project)
    };
    var url = "/edit/ajax/save_question_order/" + get_oid(project);
    ajaxPost(url, data, function(ret){
        if (ret.reject){
            window.location.reload();
        }
        if (ret.status == "200"){
            update_pageid_for_question(order_list);
        }
    });
}

function delete_question(args){
    var page_count = args.page_count;
    var qid = args.oid;
    if (isNotEmpty(qid)){

        var page_id = project.questionpage_id_list[page_count];
        var url = "/edit/ajax/delete_question/"+get_oid(project);
        var data = {"qid": qid, "page_id": page_id};
        ajaxPost(url, data, function(ret){
            if (ret.status == "200"){
                var qid = ret.qid;
				if(ret.err_msg){
                    $('.loadCon,.loadMack').remove();
                    loadMack({off:'on',Limg:1,text:'该题目有配额设置，请先删除配额设置',set:2000});
					return;
				}
                // 删除成功后更新选项关联字典
                if($(".module[oid="+ qid +"]").find('li[data-related=true]').length > 0){
                    var old_relation_qid_list = [],
                        related_question_list = QUESTION_DICT[qid].related_question_list;
                    for(var i = 0; i < related_question_list.length; i++){
                        var current_qid = related_question_list[i]._id.$oid;
                        old_relation_qid_list.push(current_qid);
                    }
                    update_related_question_dict(qid, old_relation_qid_list);
                }
                $(".module[oid="+ qid +"]").remove();
                init_question_desc();
                var question = get_question(qid);
                var questionpage = project.questionpage_list[page_count];
                questionpage.question_list.pop(questionpage.question_list.indexOf(question));
                questionpage.question_id_list.pop(questionpage.question_id_list.indexOf(get_oid(question)));
                remove_question(qid);

                var rel_map = ret.rel_map.parseJSON();
                //更新逻辑数量的值
                if (isNotEmpty(rel_map)){
                    for(var qid in rel_map){
                        var count = rel_map[qid];
                        if (count != 0){
                            set_jumpconstraint_status(qid, true, count);
                        }else{
                            set_jumpconstraint_status(qid, false);
                        }
                    }
                }
                
            }
        });
    }
}

function create_option(qid, str_list, batch){
    var option_list = [];
    var question = get_question(qid);
    //如果是批量添加, 并且题目中含有默认选项, 则删除
    if (batch){
        var need_remove_opid_list = [];
        var option_text_list = $.map(question.option_list, function(option){
            return option.title;
        });
        if (isNotEmpty(option_text_list)){
            if (match_text_remove(option_text_list)){
                need_remove_opid_list = $.map(question.option_list, function(option){
                    return get_oid(option);
                });
                question.option_list = [];
                update_question(question);
                delete_option(get_oid(question), need_remove_opid_list, 'is_remove');
            }
        }
    }

    for (var i = 0; i < str_list.length; i++) {
        var option_title = str_list[i];
        if (!isNotEmpty(option_title)){
            continue;
        }
        var option_struct = {"title": option_title, "question_id": qid};
        if (question.question_type == QUESTION_TYPE_MULTIPLE_BLANK){
            option_struct['custom_attr'] = {'text_col': '15', 'text_row': '1'};
        }else if (question.question_type == QUESTION_TYPE_MATRIX_BLANK){
            option_struct['custom_attr'] = {'text_col': '10', 'text_row': '1'};
        }
        option_list.push(option_struct);
    }
    var option_id_list = [];
    syncPost("/edit/ajax/option_create/" + get_oid(project),
        {"question_id": qid, "option_list_str": toJSONString(option_list)},
        function(ret){
            if (ret.matrix_col_limit){
                $('.loadCon,.loadMack').remove();
                jsAlert({content:"<p style='text-align:left;'>最多只能添加50列</p>", obj: function(){
                    return;
                }});
            return;
            }
            if (ret.option_limit){
                $('.loadCon,.loadMack').remove();
				jsAlert({content:"<p style='text-align:left;'>最多只能添加200个选项</p>", obj: function(){
					return;
				}});
			return;
			}
            if (ret.status == "200"){
                option_id_list = $.map(ret.option_id_list, function(oid){
                    return "" + oid;
                });
                var question = get_question(qid);
                question.option_id_list = question.option_id_list.concat(option_id_list);
                question.option_list = question.option_list.concat(ret.option_list);
                update_question(question);
                if (check_in(question.question_type, [QUESTION_TYPE_MATRIX_BLANK, QUESTION_TYPE_MATRIX_SCORE, QUESTION_TYPE_MATRIX_MULTIPLE, QUESTION_TYPE_MATRIX_SINGLE])){
                    if (isNotEmpty(question.matrixrow_id_list)){
                        verify_question_option.hide(qid);
                    }
                }else{
                    verify_question_option.hide(qid);
                }
            }
        });
    return option_id_list;
}

function create_matrixrow(qid, str_list, batch){
    var question = get_question(qid);
    //如果是批量添加, 并且题目中含有默认矩阵行, 则删除
    if (batch){
        var need_remove_rid_list = [];
        var row_text_title = $.map(question.matrixrow_list, function(row){
            return row.title;
        });
        if (isNotEmpty(row_text_title)){
            if (match_text_remove(row_text_title)){
                need_remove_rid_list = $.map(question.matrixrow_list, function(row){
                    return get_oid(row);
                });
                question.matrixrow_list = [];
                update_question(question);
                delete_matrixrow(get_oid(question), need_remove_rid_list);
            }
        }
    }

    var row_list = [];
    for (var i = 0; i < str_list.length; i++) {
        var row_title = str_list[i];
        if (!isNotEmpty(row_title)){
            continue;
        }
        row_list.push({"title": row_title, "question_id": qid});
    }
    var row_id_list = [];
    syncPost("/edit/ajax/matrixrow_create/" + get_oid(project),
        {"question_id": qid, "row_list_str": toJSONString(row_list)},
        function(ret){
			if (ret.matrix_row_limit){
                $('.loadCon,.loadMack').remove();
				jsAlert({content:"<p style='text-align:left;'>最多只能添加50行</p>", obj: function(){
					return;
				}});
			return;
			}
            if (ret.status == "200"){
                row_id_list = $.map(ret.row_id_list, function(oid){
                    return "" + oid;
                });
                question.matrixrow_id_list = question.matrixrow_id_list.concat(row_id_list);
                question.matrixrow_list = question.matrixrow_list.concat(ret.row_list);
                update_question(question);
                if (isNotEmpty(question.option_id_list)){
                    verify_question_option.hide(qid);
                }
            }
        });
    return row_id_list;
}

function delete_page(page_count){
    var page = project.questionpage_list[page_count];
    syncPost('/edit/ajax/questionpage_delete/'+get_oid(project), {"page_id": get_oid(page), "page_count": page_count, "project_id": get_oid(project)}, function(ret){
        if (ret.is_del){
            var next_page = project.questionpage_list[page_count + 1];
            for (var i = 0; i < next_page.question_id_list.length; i++) {
                var qid = next_page.question_id_list[i];
                var question = get_question(qid);
                question.questionpage_id = get_oid(page);
            }
            page.question_list = page.question_list.concat(next_page.question_list);
            page.question_id_list = page.question_id_list.concat(next_page.question_id_list);
            project.questionpage_list.remove(page_count + 1);
            project.questionpage_id_list.remove(page_count + 1);
            problem_design.Site_total();
        }
    });

}

function insert_page(question_id, new_page){
    var orig_page_id = get_question(question_id).questionpage_id;
    var orig_page_index = project.questionpage_id_list.indexOf(orig_page_id);
    var orig_page = project.questionpage_list[orig_page_index];
    var question_index = orig_page.question_id_list.indexOf(question_id);
    var orig_question_list = orig_page.question_list.slice(0, question_index + 1);
    var orig_question_id_list = orig_page.question_id_list.slice(0, question_index + 1);
    var new_question_list = orig_page.question_list.slice(question_index + 1);
    new_page.question_list = new_question_list;
    for (var i = 0; i < new_question_list.length; i++) {
        var question = new_question_list[i];
        question.questionpage_id = get_oid(new_page);
    }
    orig_page.question_id_list = orig_question_id_list;
    orig_page.question_list = orig_question_list;
    project.questionpage_list.splice(orig_page_index + 1, 0, new_page);
    project.questionpage_id_list.splice(orig_page_index + 1, 0, get_oid(new_page));
    QUESTIONPAGE_DICT[get_oid(new_page)] = new_page;
}

function save_title(title, type, id){
    var data = {
        type: type,
        content: title,
        oid: id
    };
    ajaxPost('/edit/ajax/save_content/'+get_oid(project), data, function(ret){
        if (type == "option"){
            var option = get_option(ret.qid, id);
            // 判断题目标题是否更改，若更改了，则更新关联题目的关联选项
            var isChanged = false;
            if(option.title != title) isChanged = true;
            option.title = title;
            if(isChanged){
                // 更新关联题目的关联选项
                update_question_relation_option(ret.qid);
            }
        }else if (type == "row"){
            var row = get_matrixrow(ret.qid, id);
            row.title = title;
        }
    });
}

function delete_option(qid, option_id_or_list, is_remove){
    var option_param = null;
    if (option_id_or_list.constructor == Array){
        option_param = toJSONString(option_id_or_list);
    }else{
        option_param = option_id_or_list;
    }
    var data = {
        qid: qid,
        option_id_or_list: option_param
    };
    syncPost('/edit/ajax/delete_option/' + get_oid(project), data, function(ret){
		if(ret.err_msg){
            loadMack({off:'on',Limg:1,text:'该选项有配额设置，请先删除配额设置',set:2000});
			return;
		}

        if (ret.jump_count != 0){
            set_jumpconstraint_status(ret.qid, true, ret.jump_count);
        }else{
            set_jumpconstraint_status(ret.qid, false);
        }
        var question = get_question(qid);
        if (option_id_or_list.constructor == Array){
            for (var i = 0; i < option_id_or_list.length; i++) {
                var option_id = option_id_or_list[i];
                var option_index = question.option_id_list.indexOf(option_id);
                question.option_id_list.remove(option_index);
                question.option_list.remove(option_index);
                textEdit.obj=$('#'+option_id);
                textEdit.Del_edit(true);
                textEdit.obj='';
                if (is_remove){
                    $("#" + option_id).parent().remove();
                }
            }
        }else{
            var option_index = question.option_id_list.indexOf(option_id_or_list);
            question.option_id_list.remove(option_index);
            question.option_list.remove(option_index);
            if (is_remove){
                $("#" + option_id_or_list).parent().remove();
            }
        }
        update_question(question);
    });
}

function delete_matrixrow(qid, row_id_or_list){
    var row_param = null;
    if (row_id_or_list.constructor == Array){
        row_param = toJSONString(row_id_or_list);
    }else{
        row_param = row_id_or_list;
    }
    var data = {
        qid: qid,
        row_id_or_list: row_param
    };
    syncPost("/edit/ajax/delete_matrixrow/" + get_oid(project), data, function(ret){
        var question = get_question(qid);
        if (row_id_or_list.constructor == Array){
            for (var i = 0; i < row_id_or_list.length; i++) {
                var row_id = row_id_or_list[i];
                var row_index = question.matrixrow_id_list.indexOf(row_id);
                question.matrixrow_id_list.remove(row_index);
                question.matrixrow_list.remove(row_index);
                textEdit.obj=$('#' + row_id);
                textEdit.Del_edit(true);
                textEdit.obj='';
            }
        }else{
            var row_index = question.matrixrow_id_list.indexOf(row_id_or_list);
            question.matrixrow_id_list.remove(row_index);
            question.matrixrow_list.remove(row_index);
        }
        update_question(question);
    });
}

function move_option(qid, option_id, direction){
    var data = {
        question_id: qid,
        option_id: option_id,
        direction: direction
    };
    ajaxPost("/edit/ajax/option_move/"+get_oid(project), data, function(ret){
        if (isNotEmpty(ret.option_id_list)){
            var question = get_question(qid);
            question.option_id_list = ret.option_id_list;
            question.option_list = $.map(ret.option_id_list, function(option_id){
                return get_option(qid, option_id);
            });
        }
    });
}

function move_matrixrow(qid, row_id, direction){
    var data = {
        question_id: qid,
        row_id: row_id,
        direction: direction
    };
    ajaxPost("/edit/ajax/matrixrow_move/"+get_oid(project), data, function(ret){
        if (isNotEmpty(ret.row_id_list)){
            var question = get_question(qid);
            question.matrixrow_id_list = ret.row_id_list;
            question.matrixrow_list = $.map(ret.row_id_list, function(row_id){
                return get_matrixrow(qid, row_id);
            });
        }
    });
}

function check_whether_insert_page(question_id, title){
    var reg = /\[(Q\d{1,3})\]/g;
    var cid_int = null;
    var match_group = title.match(reg);
    if (!isNotEmpty(match_group)){
        return false;
    }
    for (var i = 0; i < match_group.length; i++) {
        var match_str = match_group[i];
        if (isNotEmpty(cid_int)){
            var tmp_cid_int = match_str.match(/(\d{1,3})/)[0];
            if (parseInt(tmp_cid_int) > parseInt(cid_int)){
                cid_int = tmp_cid_int;
            }
        }else{
            var tmp_cid_int = match_str.match(/(\d{1,3})/)[0];
            cid_int = tmp_cid_int;
        }
    }
    if (isNotEmpty(cid_int)){
        var modules = $(".module");
        var qcid = "Q" + cid_int;
        var h = modules.find("h4:contains('"+qcid+"')");
        var begin_module = get_parent(h, "li");
        var end_module = modules.filter("[oid="+question_id+"]");
        var begin_index = modules.index(begin_module);
        var end_index = modules.index(end_module);
        var has_page = false;
        $(".module:lt("+end_index+"):gt("+begin_index+")").each(function(){
            if ($(this).hasClass("paging")){
                has_page = true;
                return false;
            }
        });
        if (!has_page){
            var page_count = 0;
            modules.filter(":lt("+end_index+")").each(function(){
                if ($(this).hasClass("paging")){
                    page_count += 1;
                }
            });
            var question = get_question(question_id);
            var page = get_questionpage(question.questionpage_id);
            var index = page.question_id_list.indexOf(question_id);
            save_question("page", index, page_count);
            end_module.before(PAGE_TEMPLATE);
            init_question_desc();
        }
    }
}

function get_option_list(qid){
    return question_option_map[qid];
}

function get_source_q_list(disabled_list){
    var temp_qid_list = qid_list.slice(0, qid_list.length);
    var disabled_arr = disabled_list ? disabled_list : disabled_qid_list;
    return $.map(temp_qid_list, function(qid){
        if (check_in(qid, disabled_arr)){
            return;
        }
        var question = q_attr_dict[qid];
        // if (check_in(question.qtype, [QUESTION_TYPE_SINGLE, QUESTION_TYPE_MULTIPLE])){
        // if (question.qtype != QUESTION_TYPE_DESC){
        //     return question;
        // }
        return question;
    });
}

function get_jump_q_list(qid){
    var q_index = qid_list.indexOf(qid);
    var after_qid_list = qid_list.slice(q_index+1);
    return $.map(after_qid_list, function(qid){
        return q_attr_dict[qid];
    });
}

function get_display_q_list(qid){
    var q_index = qid_list.indexOf(qid);
    var before_qid_list = qid_list.slice(0, q_index);
    return $.map(before_qid_list, function(qid){
        return q_attr_dict[qid];
    });
}

function check_all_question_selected(disabled_list){
    var all_selected = true;
    var disabled_arr = disabled_list ? disabled_list : disabled_qid_list;
    for (var i = 0; i < qid_list.length; i++) {
        var qid = qid_list[i];
        if (!check_in(qid, disabled_arr)){
            all_selected = false;
            break;
        }
    }
    return all_selected;
}


var need_select_title_list = ['单选题', '多选题', '填空题', '多项填空题', '打分题', '矩阵单选题', '矩阵多选题', '矩阵打分题', '矩阵填空题', '排序题', '描述说明'];
function check_title_select(title){
    if (check_in(title, need_select_title_list)){
        return true;
    }
    if (/^选项\d+$/.test(title) || /^矩阵行\d+$/.test(title)|| /^请打分\d+$/.test(title)|| /^请填空\d+$/.test(title)){
        return true;
    }
    return false;
}

function update_pageid_for_question(order_list){
    for (var i = 0; i < order_list.length; i++) {
        var questionpage_order = order_list[i];
        var page_id = project.questionpage_id_list[i];
        var page = get_questionpage(page_id);
        page.question_id_list = questionpage_order;
        for (var k = 0; k < questionpage_order.length; k++) {
            var qid = questionpage_order[k];
            var question = get_question(qid);
            question.questionpage_id = get_oid(page);
        }
    }
}

function copy_question(qid, question_index){
    var data = {
        'qid': qid
    };
    var question_content = null;
    syncPost("/edit/ajax/copy_question/"+get_oid(project), data, function(ret){
        if (ret.limit){
            $('.loadCon,.loadMack').remove();
            jsAlert({content:"<p style='text-align:left;'>最多只能添加200道题目</p>", obj: function(){
                return;
            }});
            return;
        }
        var question_struct = ret.new_q_struct;
        if (!isNotEmpty(question_struct.option_list)){
            question_struct.option_list = [];
        }
        if (!isNotEmpty(question_struct.matrixrow_list)){
            question_struct.matrixrow_list = [];
        }
        var page_index = project.questionpage_id_list.indexOf(question_struct.questionpage_id);
        var page = project.questionpage_list[page_index];
        page.question_list.splice(question_index, 0, question_struct);
        page.question_id_list.splice(question_index, 0, get_oid(question_struct));
        add_question(question_struct);
        var qmodel = get_qmodel(question_struct);
        question_content = qmodel.gen_edit_template();
    });
    // return question_content;
    if (isNotEmpty(question_content)){
        add_question_html(question_index, question_content);
        init_question_desc();
    }
}

function check_page_logic(page_index){
    var page_id = project.questionpage_id_list[page_index];
    var data = {
        'project_id': get_oid(project),
        'page_id': page_id
    }
    var valid = false;
    syncPost("/edit/ajax/check_page_logic/", data, function(ret){
        valid = ret.valid;
    });

    return valid;
}

function check_is_blank(question){
    return check_in(question.question_type, [QUESTION_TYPE_BLANK, QUESTION_TYPE_MULTIPLE_BLANK, QUESTION_TYPE_MATRIX_BLANK]);
}

function get_edit_lock(){
    window.location.reload();
}

function close_window(){
    // window.opener=null;
    // window.open('','_self');
    // window.close();
    window.location.href = "/mysurvey";
}

function insert_question_html(qid, q_index){
    var qmodel = get_qmodel(qid);
    insert_question_html(q_index, qmodel.gen_edit_template());
    if (check_in(qmodel.question.question_type, [QUESTION_TYPE_MATRIX_SINGLE, QUESTION_TYPE_MATRIX_MULTIPLE, QUESTION_TYPE_MATRIX_SCORE, QUESTION_TYPE_MATRIX_BLANK])){
        Width_mate(get_oid(qmodel.question));
    }
    init_question_desc();
    if (isNotEmpty(qmodel.question.jumpconstraint_id_list2)){
        set_jumpconstraint_status(get_oid(qmodel.question), true, qmodel.question.jumpconstraint_id_list2.length);
    }else{
        set_jumpconstraint_status(get_oid(qmodel.question), false);
    }
    if (project.p_type === 1){
        if ("need_permission" in qmodel.question.custom_attr){
            set_quesitonLock_status(get_oid(qmodel.question), true);
        }else{
            set_quesitonLock_status(get_oid(qmodel.question), false);
        }
    }
}

function QuestionImg(qid) {
    this.qid = qid;
    this.m = 0;
    // 本次选择上传图片的个数
    this.totalImgNum = 0;
    this.main = function() {
        var _this = this;
        $('.AddQImgCon').dmUploader({
            url: '/edit/form/ajax/create_image_option/' + get_oid(project) + '/',
            dataType: 'json',
            allowedTypes: 'image\/jpeg|bmp|jpg|png',
            extraData: {
                qid: _this.qid,
                _xsrf: $.cookie("_xsrf") || ""
            },
            maxFileSize:5242880,
            extFilter: 'jpg;png;bmp;jpeg',
            //初始化插件
            onInit: function() {
                //$.danidemo.addLog('#demo-debug', 'default', 'Plugin initialized correctly');
            },
            //检查浏览器是否支持该插件
            onBeforeUpload: function(id) {

            },
            //添加新文件
            onNewFile: function(id,file) {
                // 添加遮罩
                loadMack({off:'on',Limg:1,text:'加载中...',set:0});
                _this.totalImgNum++;
                $.danidemo.addFile('#demo-files', id, file);
                _this.AddImgCon(_this.qid, id);
            },
            //
            onComplete: function() {},
            //如果浏览器支持上传进度，这将被调用的时候，我们有一个更新。
            onUploadProgress: function(id, percent) {
                var percentStr = percent + '%';
                $('#' + _this.qid + '_' + id).find('.pbg').width(percentStr);
            },
            //上传成功
            onUploadSuccess: function(id, data) {

                if(data.status == '200') {

                    //var Pobj = $('#' + _this.qid + '_' + id);
                    var Pobj = $(".questionImgBox[name="+ _this.qid + '_' + id+']');

                    Pobj.find('.QImgCon img').attr('src', data.option_struct.custom_attr.images.thumbnail_src);
                    Pobj.find('.QImgCon img').attr('maxsrc', data.option_struct.custom_attr.images.src);
                    Pobj.find('.QImgCon img').attr('orig_width', data.option_struct.custom_attr.images.orig_width);
                    Pobj.find('.QImgCon').append('<input type="file" name="files[]" multiple="multiple" style="display: none;">');
                    Pobj.find('.ImgBox_loading').hide();
                    Pobj.find('.QImgCon').show();
                    Pobj.append(_this.AddImgOption(get_oid(data.option_struct), data.option_struct.title));
                    var option_id = get_oid(data.option_struct);
                    var question = get_question(_this.qid);
                    if (question.hasOwnProperty('option_list')){
                        question.option_list.push(data.option_struct);
                        question.option_id_list.push(option_id);
                    }else{
                        question.option_list = [data.option_struct];
                        question.option_id_list = [option_id];
                    }
                    Pobj.attr("name", option_id);

                    // $(".questionImgBox[name="+option_id+ '] .QImgCon img').live('click',function() {
                    //     var _this = $(this);
                    //     var url = _this.attr("maxsrc");
                    //     var option_id = _this.parents(".questionImgBox").attr("name");
                    //     var bbox = _this.attr("bbox");
                    //     var orig_width = _this.attr("orig_width");

                    //     if(bbox==undefined){bbox="[75,75,150,150]";}
                    //     bbox = bbox.parseJSON();
                    //     CreateJcrop(url, ChgThumbnailCallback, option_id, bbox, orig_width, qid);
                    // });
                    verify_question_option.hide(_this.qid);

                    _this.totalImgNum--;
                    // 全部上传结束后，移除遮罩
                    if(_this.totalImgNum == 0){
                        $('.loadCon,.loadMack').remove();
                    }
                }
            },
            onUploadError: function(id) {
                var Pobj = $('#' + _this.qid + '_' + id);
                    Pobj.find('.ProgressBar').html('<span class="text_red">上传失败</span>');
                    setTimeout(function(){
                      Pobj.remove();
                    },3000);
            },
            onFileTypeError: function(file) {
                alert(file.name+" 该图片格式有误, 仅允许jpeg, bmp, jpg, png的格式文件");
            },
            onFileSizeError: function(file) {

                alert(file.name+" 该图片太大,单张不能超过5M");
            },
            /*onFileExtError: function(file){
                      $.danidemo.addLog('#demo-debug', 'error', 'File \'' + file.name + '\' has a Not Allowed Extension');
                    },*/
            onFallbackMode: function(message) {

                $('li[oid="' + _this.qid + '"] .AddQImgCon').hide();
                $('li[oid="' + _this.qid + '"] .AddQImgCon_ie').show();
            }
        });
    }
    //批量添加图片题选项
    this.AddImgCon = function(qid, id) {
        var question = $('li[oid="' + qid + '"]');
        var optionLength = question.find('.Imgli li').length;
        var imgli = '<li><div class="questionImgBox" name="' + qid + '_' + id + '"><div class ="ImgBox_loading"><div class ="ProgressBar"><div class="pbg"></div></div><p class="ProgressBar_info">图片上传中</p></div>' + '<div style="display:none;" class="QImgCon"><img maxsrc="" src=""></div>' + '</div></li>';
        $('.dragZone', question).before(imgli);
    }
    this.AddImgOption = function(oid, name) {
        var question = get_question(this.qid);
        if (question.question_type === QUESTION_TYPE_SINGLE){
            var optionCon = '<input type="radio" name="radio" id="option_' + oid + '" value="option_' + oid + '">' + '<label class="T_edit_min" for="" name="option" id="' + oid + '">' + name + '</label>';
        }else{
            var optionCon = '<input type="checkbox" name="checkbox" id="option_' + oid + '" value="option_' + oid + '">' + '<label class="T_edit_min" for="" name="option" id="' + oid + '">' + name + '</label>';
        }
        return optionCon;
    }

    return this.main();
}

function CreateJcrop(url, Callback, option_id, bbox, orig_width) {
    var cjimgId = new Date().getTime();

    if(orig_width>400){var imgwidth = 400;}else{var imgwidth = orig_width;}

    jsCropConfirm({
        'title': '图片裁剪',
        'content': '<div class="cjimg"><img width="'+imgwidth+'" src="'+url+'" id="'+cjimgId+'" alt="图片加载错误" /></div>',
        'obj': SavefCutOut,
        'conw': 440,
        'obj_text': '保存',
        //'close_text':'取消',
        'Param': '#target',
        'close_text': '更换',
        'close_obj': ChangeImg,
        'notClose': true
    });
    initJcrop("#"+cjimgId);

    function initJcrop(obj) {
        $('.requiresjcrop').hide();
        // Invoke Jcrop in typical fashion
        $(obj).Jcrop({
            // onRelease: releaseCheck
            onSelect: showCoords,
            minSize: [75,75]
        }, function() {

            jcrop_api = this;
            jcrop_api.animateTo(bbox);
            jcrop_api.setOptions({
                aspectRatio: 4 / 4
            });

            $('.requiresjcrop').show();

        });
        return false;
    }

    var Coordinate = {};
    Coordinate.x = bbox[0];
    Coordinate.y = bbox[1];
    Coordinate.x2 = bbox[2];
    Coordinate.y2 = bbox[3];

    function showCoords(c) {
        Coordinate = c;
    };

    function SavefCutOut() {
        var new_bbox = [Coordinate.x, Coordinate.y, Coordinate.x2, Coordinate.y2]
        if (new_bbox.toString() != bbox.toString()) {
            var data = {
                "option_id": option_id,
                "bbox": toJSONString(new_bbox)
            };
            var Pobj = $('.questionImgBox[name='+ option_id + ']');
            Pobj.find('.QImgCon').hide();
            if (Pobj.find('.ImgBox_loading').length == 0){
                var imgli = '<div class ="ImgBox_loading"><div class ="ProgressBar"><div class="pbg"></div></div><p class="ProgressBar_info">图片保存中</p></div>';
                Pobj.find('.QImgCon').before(imgli);
            }else{
                Pobj.find('.ImgBox_loading .ProgressBar_info').html("图片保存中");
                Pobj.find('.ImgBox_loading').show();
            }
            ajaxPost("/edit/form/ajax/upload_cut_image/"+get_oid(project), data, function(ret){
                var new_thumb_url = ret.thumb_url;
                Callback(new_thumb_url, option_id, ret.bbox);
                SavePrompt(false, '保存成功');
                SavePrompt(true, '保存成功');
                Pobj.find('.ImgBox_loading').hide();
                Pobj.find('.QImgCon').show();
            });
        }
    }

    function ChangeImg() {
        $('div[name=' + option_id + '] .QImgCon').dmUploader({
            url: '/edit/form/ajax/update_image_option/' + get_oid(project) + '/',
            dataType: 'json',
            allowedTypes: 'image\/jpeg|bmp|jpg|png',
            extraData: {
                option_id: option_id,
                _xsrf: $.cookie("_xsrf") || ""
            },
            maxFileSize:5242880,
            extFilter: 'jpg;png;bmp;jpeg',
            //初始化插件
            onInit: function() {
                //$.danidemo.addLog('#demo-debug', 'default', 'Plugin initialized correctly');
            },
            //检查浏览器是否支持该插件
            onBeforeUpload: function(id) {
            },
            //添加新文件
            onNewFile: function(id,file) {

                // $.danidemo.addFile('#demo-files', id, file);
                // _this.AddImgCon(option_id, id);
            },
            //
            onComplete: function() {},
            //如果浏览器支持上传进度，这将被调用的时候，我们有一个更新。
            onUploadProgress: function(id, percent) {
                // var percentStr = percent + '%';
                // $('#' + qid + '_' + id).find('.pbg').width(percentStr);
                var Pobj = $('.questionImgBox[name='+ option_id + ']');
                Pobj.find('.QImgCon').hide();
                if (Pobj.find('.ImgBox_loading').length == 0){
                    var imgli = '<div class ="ImgBox_loading"><div class ="ProgressBar"><div class="pbg"></div></div><p class="ProgressBar_info">图片更换中</p></div>';
                    Pobj.find('.QImgCon').before(imgli);
                }else{
                    Pobj.find('.ImgBox_loading .ProgressBar_info').html("图片更换中");//上传图片的时候产生进度，页面没有刷新情况下更改提示
                    Pobj.find('.ImgBox_loading').show();
                }
            },
            //上传成功
            onUploadSuccess: function(id, data) {
                if(data.status == '200') {
                    var Pobj = $('.questionImgBox[name='+ option_id + ']');

                    Pobj.find('.QImgCon img').attr('src', data.option_struct.custom_attr.images.thumbnail_src);
                    Pobj.find('.QImgCon img').attr('maxsrc', data.option_struct.custom_attr.images.src);
                    Pobj.find('.QImgCon img').attr('orig_width', data.option_struct.custom_attr.images.orig_width);
                    $('.cjimg img').attr('src', data.option_struct.custom_attr.images.src);
                    Pobj.find('.ImgBox_loading').hide();
                    Pobj.find('.QImgCon').show();
                    SavePrompt(false, '更换成功');
                    SavePrompt(true, '更换成功');
                }
            },
            onUploadError: function(id) {
                // var Pobj = $('#' + _this.qid + '_' + id);
                //     Pobj.find('.ProgressBar').html('<span class="text_red">上传失败</span>');
                //     setTimeout(function(){
                //       Pobj.remove();
                //     },3000);
            },
            onFileTypeError: function(file) {
                alert(file.name+" 该图片格式有误, 仅允许jpeg, bmp, jpg, png的格式文件");
            },
            onFileSizeError: function(file) {

                alert(file.name+" 该图片太大,单张不能超过5M");
            },
            /*onFileExtError: function(file){
                      $.danidemo.addLog('#demo-debug', 'error', 'File \'' + file.name + '\' has a Not Allowed Extension');
                    },*/
            onFallbackMode: function(message) {

                // $('li[oid="' + _this.qid + '"] .AddQImgCon').hide();
                // $('li[oid="' + _this.qid + '"] .AddQImgCon_ie').show();
            }
        });
        $('div[name="' + option_id + '"] input[type="file"]').trigger('click');
    }
}
//裁剪图片回调方法
function ChgThumbnailCallback(imgurl,oid,bbox){

    // var imgobj = new Image();
    // imgobj.onload=function(){
        setTimeout(function(){
            var maxsrc = $(".questionImgBox[name="+oid+ '] .QImgCon img').attr('maxsrc');
            var orig_width = $(".questionImgBox[name="+oid+ '] .QImgCon img').attr('orig_width');
            $(".questionImgBox[name="+oid+ '] .QImgCon img').remove();
            var NewImg = $('<img maxsrc="'+maxsrc+'" bbox="'+bbox+'" orig_width="'+orig_width+'" src="'+imgurl+'"></img>').appendTo(".questionImgBox[name="+oid+ '] .QImgCon');
        }, 50);

    // }
    // imgobj.src = imgurl;

   // $("#"+oid+ ' .QImgCon img').attr('src',imgurl);
}


function upload_img_success_for_ie(qid,option_struct){
        var question = $('li[oid="' + qid + '"]');
        var optionLength = question.find('.Imgli li').length-1;
        //var Pobj = $('#' + qid + '_' +optionLength);
        var Pobj = $(".questionImgBox[name="+qid + '_' +optionLength+']');

        Pobj.find('.QImgCon img').attr('src',option_struct.custom_attr.images.thumbnail_src);
        Pobj.find('.QImgCon img').attr('maxsrc',option_struct.custom_attr.images.src);
        Pobj.find('.QImgCon img').attr('orig_width',option_struct.custom_attr.images.orig_width);
        Pobj.find('.ImgBox_loading').hide();
        Pobj.find('.QImgCon').show();
        Pobj.append(AddImgOption(get_oid(option_struct),option_struct.title));
        var option_id = get_oid(option_struct);
        Pobj.attr("id", option_id);
        $(".questionImgBox[name="+option_id+ '] .QImgCon img').live('click',function() {
            var url = $(this).attr("maxsrc");
            var orig_width = $(this).attr("orig_width");
            var option_id = $(this).parents(".questionImgBox").attr("name");
            CreateJcrop(url, ChgThumbnailCallback, option_id, orig_width, qid);
        });

        function AddImgOption(oid,name) {
            var question = get_question(this.qid);
            if (question.question_type === QUESTION_TYPE_SINGLE){
                var optionCon = '<input type="radio" name="radio" id="option_' + oid + '" value="option_' + oid + '">' + '<label class="T_edit_min" for="" name="option" id="' + oid + '">' + name + '</label>';
            }else{
                var optionCon = '<input type="checkbox" name="checkbox" id="option_' + oid + '" value="option_' + oid + '">' + '<label class="T_edit_min" for="" name="option" id="' + oid + '">' + name + '</label>';
            }
            return optionCon;
        }

}
function start_upload_img_for_ie(qid){
        var question = $('li[oid="' + qid + '"]');
        var optionLength = question.find('.Imgli li').length;
        var imgli = '<li><div class="questionImgBox" name="' + qid + '_' + optionLength + '"><div class ="ImgBox_loading"><div class ="ProgressBar"><div class="pbg"></div></div><p class="ProgressBar_info">图片上传中</p></div>' + '<div style="display:none;" class="QImgCon"><img maxsrc="" src=""></div>' + '</div></li>';
        $('.dragZone', question).before(imgli);
        $("#"+qid+"_"+optionLength+" .pbg").animate({width:'+90%'}, "1000");
}

loadMack({off:'on',Limg:1,text:'加载中...',set:0});
