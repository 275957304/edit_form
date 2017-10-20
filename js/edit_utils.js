//题型设计模块
// 触发添加题目事件的结束时间，此变量是用来跟第二次触发添加题目事件的起始时间相比较，防止多次连击
window.eventEndTime = 0;
//拖动布局

function ProblemDesign(obj) {
    this.obj = obj;
    //dragObj 拖动对象
    //sorObj  容器对象
    this.index = -1; //题目相对分页符位置
    this.t_wz = 0; //题目相对分页符位置
    this.paging_m = 0 //题型前面分页符数量;
    this.paging_wz = 0 //题型前面最后一个分页符位置;
    this.AddQuestion = null; //创建后的题型对象
}

ProblemDesign.prototype = {
    Drag: function(add_topic1, add_topic2, after_dropped) { //初始化拖动排序
        var this_ = this;

        $('.matrix').scroll(function() {
            return false;
        });

        //题型拖动选择
        var x2 = $(window).width();
        var y2 = $(window).height();
        $(this_.obj.dragObj).draggable({
            connectToSortable: ".dragwen",
            helper: "clone",
            appendTo: 'body',
            start: function(event, ui) {

                //删除文字编辑框
                $('.zon_edit').remove();

                var id = ui.helper.attr('disp_type') || ui.helper.attr('name');
                ui.helper.html('').css({
                    'height': 'auto'
                }).addClass('anbx').append(add_topic1(id));
            },
            revert: "invalid"
        });

        //题型点击选择
        $(this_.obj.dragObj).click(function() {
            var eventStartTime = new Date().getTime();
            // 如果两次事件触发的时间少于200ms，则不予处理
            if(eventStartTime - eventEndTime < 200) return;

            loadMack({off:'on',Limg:1,text:'加载中...',set:0});
            // 统计埋点
            var disp_type = $(this).attr('disp_type');
            if(disp_type == 'nps_score' || disp_type == 'geographical_multiple_blank'){
                _hmt.push(['_trackEvent', 'edit', 'click', 'add_' + disp_type]);
            }
            var id = $(this).attr('disp_type') || $(this).attr('name');
            //if(id=='page'){
            //loadMack({off:'on',Limg:0,text:'两个分页符之间必须有内容',set:2500});
            // return false;
            //}
            this_.click_draggable();

            // 由于浏览器渲染机制造成ajax同步请求时，UI停止渲染，造成无法显示loading，用deferred异步可以实现
            $.when(deferredFun(add_topic2, id, this_.t_wz, this_.paging_m)).done(function(data){
                this_.AddQuestion = $(data).appendTo(this_.obj.sorObj);

                $("html,body").animate({
                    scrollTop: $("body").height() - 50
                }, 'slow');
                this_.Update_order(); //更新状态

                setTimeout(function() {
                    this_.AddQuestion.find('.T_edit').click();
                    this_.AddQuestion = null;
                }, 500);
                $('.loadCon,.loadMack').remove();
                eventEndTime = new Date().getTime();
            });

        });

        //处理拖动时弹出框不消失
        $(this_.obj.dragObj).mousedown(function() {
            $('.jsBubble_s').remove();
        });
        $('.module').live('mousedown', function() {
            $('.jsBubble_s').remove();
        });
        //题型排序
        $(this_.obj.sorObj).sortable({
            //containment:".dragwen",
            //axis:'y',
            snap: true,
            delay: 200,
            opacity: 0.9,
            scrollSensitivity: 160,
            tolerance: 'pointer',
            handle: '.Drag_area',
            start: function(event, ui) {

                //删除文字编辑框
                $('.zon_edit').remove();
                //关闭判断题目选项是否显示
                ptvt_Switch=false;
                this_.sort_start_index = ui.helper.index();

            },
            sort: function(event, ui) {
                //var m = $(''+this_.obj.sorObj+' > li').index(ui.placeholder);
                //alert(m);
                //$('.h4st1').text(m);
            },
            receive: function(event, ui) {

                var _this = $(this_.obj.sorObj);
                this_.Site_draggable();

            },
            stop: function(event, ui) {
                loadMack({off:'on',Limg:1,text:'加载中...',set:0});
                //开启判断题目选项是否显示
                ptvt_Switch=true;
                // 判断选项关联
                var $obj = ui.item,
                    oid = $obj.attr('oid'),
                    is_not_sort = false;
                this_.sort_stop_index = ui.item.index();
                if(typeof(oid) != 'undefined' && is_single_or_multiple(oid)){
                    if(this_.sort_stop_index > this_.sort_start_index){  // 下移
                        $(this_.obj.sorObj).find('li.module').each(function(index, el) {
                            if(index >= this_.sort_start_index && index < this_.sort_stop_index){
                                var current_oid = $(el).attr('oid');
                                if(is_single_or_multiple(current_oid) && RELATED_QUESTION_DICT[oid] && RELATED_QUESTION_DICT[oid].indexOf(current_oid) != -1){
                                    $(this_.obj.sorObj).find('.module:eq(' + this_.sort_start_index + ')').before($obj[0]);
                                    is_not_sort = true;
                                    return false;
                                }
                            }
                        });
                    }else if(this_.sort_stop_index < this_.sort_start_index){  // 上移
                        $(this_.obj.sorObj).find('li.module').each(function(index, el) {
                            if(index > this_.sort_stop_index && index <= this_.sort_start_index){
                                var current_oid = $(el).attr('oid');
                                if(is_single_or_multiple(current_oid) && RELATED_QUESTION_DICT[current_oid] && RELATED_QUESTION_DICT[current_oid].indexOf(oid) != -1){
                                    $(this_.obj.sorObj).find('.module:eq(' + this_.sort_start_index + ')').after($obj[0]);
                                    is_not_sort = true;
                                    return false;
                                }
                            }
                        });
                    }
                }
                if(is_not_sort){
                    $('.loadCon,.loadMack').remove();
                    loadMack({off:'on',Limg:0,text:"引用题目不能移至被引用题目之前",set:1500});
                    return;
                }

                //输出内容
                var _this = $(this_.obj.sorObj);
                var mbobj = _this.find('.moduleL');
                var id = mbobj.attr('disp_type') || mbobj.attr('name');

                _this.find('.moduleL').remove();
                var l = _this.find('.module').length;
                // 由于浏览器渲染机制造成ajax同步请求时，UI停止渲染，造成无法显示loading，所以用deferred异步来实现
                $.when(deferredFun(add_topic2, id, this_.t_wz, this_.paging_m)).done(function(data){
                    if (this_.index == 0) {
                        this_.AddQuestion = $(data).prependTo(this_.obj.sorObj);
                    } else if (this_.index == l) {
                        this_.AddQuestion = $(data).appendTo(_this);
                    } else {
                        this_.AddQuestion = $(data).insertBefore(_this.find('.module:eq(' + this_.index + ')'));
                    }
                    if (this_.AddQuestion !== 'undefined' || this_.AddQuestion !== null) {
                        setTimeout(function() {
                            this_.AddQuestion.find('.T_edit').click();
                            this_.AddQuestion = null;
                        }, 500);
                    }

                    this_.Update_order(); //更新状态
                    after_dropped(id);
                    $('.loadCon,.loadMack').remove();
                });

                /*if (this_.index == 0) {
                    this_.AddQuestion = $(add_topic2(id, this_.t_wz, this_.paging_m)).prependTo(_this);
                } else if (this_.index == l) {

                    this_.AddQuestion = $(add_topic2(id, this_.t_wz, this_.paging_m)).appendTo(_this);
                    // this_.Site_total();
                    // if(id=="page"){
                    //                         loadMack({off:'on',Limg:0,text:'不能在最后一题放置分页符',set:2500});
                    //                       }
                } else {
                    //_this.find('.module:eq('+this_.index+')').before(add_topic2(id,this_.t_wz,this_.paging_m));
                    this_.AddQuestion = $(add_topic2(id, this_.t_wz, this_.paging_m)).insertBefore(_this.find('.module:eq(' + this_.index + ')'));
                    //this_.Site_last();//判断最后一题有无分页
                }
                //this_.Site_adjacent();//判断两个分页符是否相邻

                if (this_.AddQuestion !== 'undefined' || this_.AddQuestion !== null) {
                    setTimeout(function() {
                        this_.AddQuestion.find('.T_edit').click();
                        this_.AddQuestion = null;
                    }, 500);
                }

                this_.Update_order(); //更新状态
                after_dropped(id);*/



            },
            revert: true
        });

        //上下移动
        $('.up-icon-active').live('click', function() {


            var $obj = $(this).parents('li');
            var id = $obj.attr('oid');
            var m = $('' + this_.obj.sorObj + ' > li').index($obj);

            if (m == 0) {
                loadMack({
                    off: 'on',
                    Limg: 0,
                    text: '已经是第一道题',
                    set: 800
                });
                return
            }
            // 判断当前题目是否设置了上一题的选项关联，如果是，则不能移动
            var prev_oid = $obj.prev().attr('oid');
            if(is_single_or_multiple(id) && is_single_or_multiple(prev_oid) && $obj.find('li[data-related=true]').length > 0){
                if(RELATED_QUESTION_DICT[prev_oid] && RELATED_QUESTION_DICT[prev_oid].indexOf(id) != -1){
                    loadMack({off:'on',Limg:0,text:"引用题目不能移至被引用题目之前",set:1500});
                    return;
                }
            }

            $(this_.obj.sorObj).find('.module:eq(' + (m - 1) + ')').before($obj[0]);

            // this_.Site_last();//判断最后一题有无分页
            // this_.Site_adjacent();//判断两个分页符是否相邻
            this_.Update_order(); //更新状态
            save_question_order();

            $("html,body").animate({
                scrollTop: ($obj.offset().top - 100)
            }, 'slow');

        });

        $('.down-icon-active').live('click', function() {

            var $obj = $(this).parents('li');
            var id = $obj.attr('oid');
            var m = $('' + this_.obj.sorObj + ' > li').index($obj);
            var l = $('' + this_.obj.sorObj + ' .module').length - 1;
            if (m == l) {
                loadMack({
                    off: 'on',
                    Limg: 0,
                    text: '已经是最后一道题',
                    set: 800
                });
                return
            }
            // 判断下一题是否设置了当前题目的选项关联，如果是，则不能移动
            var next_oid = $obj.next().attr('oid');
            if(is_single_or_multiple(id) && is_single_or_multiple(next_oid) && $obj.next().find('li[data-related=true]').length > 0){
                if(RELATED_QUESTION_DICT[id] && RELATED_QUESTION_DICT[id].indexOf(next_oid) != -1){
                    loadMack({off:'on',Limg:0,text:"引用题目不能移至被引用题目之前",set:1500});
                    return;
                }
            }

            $(this_.obj.sorObj).find('.module:eq(' + (m + 1) + ')').after($obj[0]);

            //this_.Site_last();//判断最后一题有无分页
            //this_.Site_adjacent();//判断两个分页符是否相邻
            this_.Update_order(); //更新状态

            save_question_order();

            if ($obj.offset().top !== 0) {
                $("html,body").animate({
                    scrollTop: ($obj.offset().top - 100)
                }, 'slow');
            }
        });

        //下拉题型事件
        $('.bj_drop').live('click', function() {
            $(this).parent().hide();
            $(this).parents('.topic_type_con').find('.unstyled,.bj_drop_xl').show();
        });
        $('.bj_drop_achieve').live('click', function() {
            var type_con = $(this).parents('.topic_type_con');
            type_con.find('.unstyled,.bj_drop_xl').hide();
            $('.drop_zon', type_con).show();
            var con = '';
            $('.unstyled li', type_con).each(function(index, element) {
                var that = $(this);
                if(that.data('related-question-id')){
                    // 如果有选项关联，要添加对应的属性
                    con += '<option data-related="true" data-related-question-id="'+ that.data('related-question-id') +'" class="T_edit_min_disabled">' + $(this).find('label').text() + '</option>';
                }else{
                    con += '<option>' + $(this).find('label').text() + '</option>';
                }
            });
            $('.drop_down', type_con).html(con);
        });
    },
    Update_order: function() {
        $('.dragwen .setup-group h4').each(function(i, element) {
            $(this).text('Q' + (i + 1));
            // 更新排序后，更新题目字典和选项关联的选项文案
            var oid = $(this).parents('.question').attr('oid');
            QUESTION_DICT[oid].cid = 'Q' + (i + 1);
            update_question_relation_option(oid);
        });
        var m = $('' + this.obj.sorObj + '> .paging span').length;
        $('' + this.obj.sorObj + '> .paging').each(function(i, element) {
            $(this).find('span').text((i + 1) + '/' + (m + 1));
        });
        $('.ul_tail .paging span').text((m + 1) + '/' + (m + 1));
    },

    //拖入计算位置
    Site_draggable: function() {

        this.index = 0;
        this.paging_wz = 0;
        this.paging_m = 0;
        this.t_wz = 0;

        var this_ = this;
        $('' + this_.obj.sorObj + '> li').each(function(i, element) {
            if ($(this).hasClass('paging')) {
                this_.paging_m += 1;
                this_.paging_wz = i;
            }
            if ($(this).hasClass('ui-draggable')) {
                this_.index = i;
                if (this_.paging_m == 0) {
                    this_.t_wz = this_.index;
                } else {
                    this_.t_wz = this_.index - this_.paging_wz - 1;
                }
                return false;
            }
        });

    },
    //点击增加计算位置
    click_draggable: function() {

        this.index = 0;
        this.paging_wz = 0;
        this.paging_m = 0;
        this.t_wz = 0;

        var this_ = this;
        var l = $('' + this_.obj.sorObj + '> li').length;
        $('' + this_.obj.sorObj + '> li').each(function(i, element) {
            if ($(this).hasClass('paging')) {
                this_.paging_m += 1;
                this_.paging_wz = i;
            }
            if (i == l - 1) {
                this_.index = i;
                if (this_.paging_m == 0) {
                    this_.t_wz = this_.index + 1;
                } else {
                    this_.t_wz = this_.index - this_.paging_wz;
                }
                return false;
            }
        });

    },
    //判断最后一题有无分页
    Site_last: function() {
        var lis = $('' + this.obj.sorObj + ' > li').length;

        var m = $('' + this.obj.sorObj + ' > li:eq(' + (lis - 1) + ')').is('.paging');
        if (m) {
            //$(this.obj.sorObj).sortable("cancel"); //返回到以前位置
            var pag = $('' + this.obj.sorObj + ' > li:eq(' + (lis - 1) + ')');
            $('' + this.obj.sorObj + ' > li:eq(' + (lis - 1) + ')').remove();

            var ms = Paging_num(pag);
            delete_page(ms);

            loadMack({
                off: 'on',
                Limg: 0,
                text: '两个分页符之间必须有内容',
                set: 2500
            });
        }
    },
    //判断两个分页符是否相邻
    Site_adjacent: function() {

        var this_ = this;
        var ay = [];
        $('' + this_.obj.sorObj + '> li').each(function(i, element) {
            if ($(this).is('.paging')) {

                var ms = $('' + this_.obj.sorObj + ' > li:eq(' + (i + 1) + ')');

                if (ms.is('.paging')) {
                    //alert(222);
                    ay.push(ms);
                }
                //return false;
            }
        });
        if (ay.length > 0) {
            var m = Paging_num(ay[0]);
            ay[0].remove();
            delete_page(m);
            loadMack({
                off: 'on',
                Limg: 0,
                text: '两个分页符之间必须有内容',
                set: 2500
            });

            //for(var ii=0;ii<ay.length;ii++){
            //                ay[ii].remove();
            //          }
        }

    },
    //更新状态汇总
    Site_total: function() {

        var this_ = this;
        //判断最后一题有无分页
        var lis = $('' + this.obj.sorObj + ' > li').length;
        var thisPaging = $('' + this.obj.sorObj + ' > li:eq(' + (lis - 1) + ')');
        var m = thisPaging.is('.paging');
        if (m) {
            var ms = Paging_num(thisPaging);
            thisPaging.remove();
            delete_page(ms);
        }

        //判断两个分页符是否相邻
        var ay = [];
        $('' + this_.obj.sorObj + '> li').each(function(i, element) {
            if ($(this).is('.paging')) {

                var ms = $('' + this_.obj.sorObj + ' > li:eq(' + (i + 1) + ')');

                if (ms.is('.paging')) {
                    ay.push(ms);
                }
            }
        });
        if (ay.length > 0) {
            var mz = Paging_num(ay[0]);
            ay[0].remove();
            delete_page(mz);
            //for(var ii=0;ii<ay.length;ii++){
            //                ay[ii].remove();
            //          }
        }

        this.Update_order();

    }
}

//题型设置操作

function TopicOperating() {

    this.events = function() {
        ptvt_Switch=true;
        var _this = this;
        //显示设置
        $('.dragwen .module').live("mouseover", function() {
            if(ptvt_Switch){
                $(this).find('.setup-group a,.updown,.operationH a,.operationV a').show();
            }
        }).live('mouseout', function() {
            _this.ptvt($(this));
        });

        //ali load the setting
        // $('.option_Fill input, .option_Fill textarea').live('click', function() {
        //     var option_id = $(this).parent().attr('id');
        //     if (!option_id)
        //         return;
        //     var obj = $(this).parents('.module');
        //     var place = $('.dragwen .module').index(obj);

        //     url = '/edit/ajax/option_sets/'+get_oid(project)+'?option_id=' +
        //         option_id + '&q_index=' + place + '&ts=' + (new Date()).getTime()
        //     $.get(url, function(result){
        //         addSettingContent("选项设置", result);

        //         addLogicSet(false, 2)
        //         addRefSet(false, 2)
        //     });
        // });

        $('body').bind('mouseup', function() {
            $('.dragwen .module').removeData("blah"); //移除blah
        });

        $('.jsTip_close').live('click', function() {
            $('.dragwen .module').removeData("blah"); //移除blah
        });


        //删除分页符
        $('.DelPaging').live('click', function() {

            var obj = $(this).parents('.module');
            var m = Paging_num(obj);

            // var isAlart = check_page_logic(m);
            var isAlart = true;

            if(isAlart){
               $(this).parents('.module').remove();
               delete_page(m);
               $("#pophover").remove();
            }else{
               jsConfirm({
                'content':"删除该分页符会使跳转逻辑失效,你确定要删除吗？",
                'obj':page_logic_Callback,
                'conw':370,
                'Param':[$(this),m]
               });
            }

        });
        function page_logic_Callback(arr){
            arr[0].parents('.module').remove();
            delete_page(arr[1]);
        }

        //删除题目
        $('.Del').live('click', function() {

            var obj = $(this).parents('.module');
            var m = Paging_num(obj);
            var oid = obj.attr('oid');
            var args = {
                'page_count': m,
                'oid': oid
            };
            // 判断当前题目是否被其他题目设置了选项关联，如果有，则题目不能被删除
            if(is_single_or_multiple(oid) && RELATED_QUESTION_DICT[oid] && RELATED_QUESTION_DICT[oid].length > 0){
                loadMack({off:'on',Limg:0,text:"当前题目选项已关联其他题目，不能删除",set:1500});
                return;
            }
            jsConfirm({
                title: '删除题目确认',
                obj: delete_question,
                Param: args,
                conw: 400
            });
        });

        //批量添加行
        $('.operationH .Bub').live('click', function() {


            var mbb = $(this);
            var issue = mbb.parents('.module').attr('issue');
            var obj = mbb.parents('.module');
            var oid = obj.attr('oid');

            obj.data("blah", "yes");
            $('.setup-group a,.updown,.operationH a,.operationV a').hide();
            $('.setup-group a,.updown,.operationH a,.operationV a',obj).show();

            var option_val = mbb.parents('.module').find('.T_edit_min,.Ed_tr .T_edit_td');
            var option_arr = [];
            option_val.each(function(index, element) {
                option_arr.push($(this).text());
            });
            mbb.attr('title','批量添加');
            _this.Batch($(this), issue, oid, 'left', '505px', 'h', option_arr);

        });

        //批量添加列
        $('.operationV .Bub').live('click', function() {

            var mbb = $(this);
            var issue = mbb.parents('.module').attr('issue');
            var obj = mbb.parents('.module');
            var oid = obj.attr('oid');

            obj.data("blah", "yes");
            $('.setup-group a,.updown,.operationH a,.operationV a').hide();
            $('.setup-group a,.updown,.operationH a,.operationV a',obj).show();

            var option_val = mbb.parents('.module').find('td[name="option"]');
            var option_arr = [];
            option_val.each(function(index, element) {
                option_arr.push($(this).text());
            });
            mbb.attr('title','批量添加');
            _this.Batch($(this), issue, oid, 'right', '505px', 'v', option_arr);

        });

        //ali 逻辑设置
        $('.lj_btn').on('click', function() {
            var type = $(".right_operate").attr("type");
            var oid  = $(".right_operate").attr("oid");
            if (type == 'question') {
                var obj = getObjByOid(oid);
                var question = get_question(oid);
                if ($(this).hasClass('jump_btn')) {
                    var popupWidth = 610;
                    if(question.question_type == QUESTION_TYPE_SCORE && !question.custom_attr.disp_type) popupWidth = 800;
                    maptss("跳转逻辑",'/edit/ajax/q_jump_list/'+get_oid(project)+'/?qid='
                        +obj.attr('oid')+'&pid='+get_oid(project)+'&ts='+(new Date()).getTime()
                        ,popupWidth);
                } else {
                    maptss("显示逻辑",'/edit/ajax/q_display_list/'+get_oid(project)+'/?qid='
                        +obj.attr('oid')+'&pid='+get_oid(project)+'&ts='+(new Date()).getTime()
                        ,'780');
                }
            } else {
                var qid = $(".right_operate #option_set_form").attr("qid");
                var question = get_question(qid);
                if (question.question_type == QUESTION_TYPE_MULTIPLE) {
                    maptss("逻辑设置",'/edit/ajax/q_jump_list/'+get_oid(project)+'/?qid='
                        +qid+'&pid='+get_oid(project)+'&ts='+(new Date()).getTime()
                        ,'600');
                } else {
                    maptss("逻辑设置",'/edit/ajax/option_jump_set/'+get_oid(project)+'/?option_id='+oid+'&pid='+get_oid(project)+'&ts='+(new Date()).getTime(), "500");
                }
            }
            return false;
        });

        //ali 引用设置
        $('.yy_btn').on('click', function() {
            var type  = $(".right_operate").attr('type')
            var valid = $(".right_operate").attr('oid')

            maptss("引用设置",'/edit/ajax/autoreplace_set/'+get_oid(project)+
                '/?oid='+valid+'&pid='+get_oid(project)+'&type='+type+'&ts='+(new Date()).getTime(),"509");

            return false;
        });


        //题目设置
        $('.Bub[title="题目设置"]').live('click', function() {

            var mbb = $(this);
            var obj = $(this).parents('.module');
            var place = $('.dragwen .module').index(obj);

            obj.data("blah", "yes");
            $('.setup-group a,.updown,.operationH a,.operationV a').hide();
            $('.setup-group a,.updown,.operationH a,.operationV a',obj).show();
            _this.Bubble($(this),'/edit/ajax/q_options/'+get_oid(project)+'/?q_index='+place+'&ts='+(new Date()).getTime()+'&question_id='+obj.attr('oid'),'left','505px');

        });

        //题目复制
        $('.setup-group .Bub').live('click', function() {
            var eventStartTime = new Date().getTime();
            // 如果两次事件触发的时间少于200ms，则不予处理
            if(eventStartTime - eventEndTime < 200) return;

            loadMack({off:'on',Limg:1,text:'加载中...',set:0});
            var obj = $(this).parents('.module');
            var place = $('.dragwen .module').index(obj);
            $.when(deferredFun(copy_question, obj.attr('oid'), place)).done(function(data){
                $('.loadCon,.loadMack').remove();
                eventEndTime = new Date().getTime();
            });
        });

        //右侧逻辑设置
        $('.BubR').live('click', function() {
            $(this).attr('title','逻辑设置');
            var mbb = $(this);
            var obj = $(this).parents('.module');
            var oid  = obj.attr("oid");

            var question = get_question(oid);

            $(this).parents('.module').data("blah", "yes");
            $('.setup-group a,.updown,.operationH a,.operationV a').hide();
            $('.setup-group a,.updown,.operationH a,.operationV a',obj).show();
            var bubbleWidth = "600px";
            if (question.question_type == QUESTION_TYPE_SCORE) {
                if(question.custom_attr.disp_type == 'nps_score')
                    bubbleWidth = "630px";
                else
                    bubbleWidth = '820px';
            }
            if($(this).hasClass('display_logic_sign')){
                $(this).attr('title','显示逻辑');
                bubbleWidth = "798px";
                _this.Bubble($(this),'/edit/ajax/q_display_list/'+get_oid(project)+'/?qid='+obj.attr('oid')+'&pid='+get_oid(project)+'&ts='+(new Date()).getTime(),'right',bubbleWidth, 'isBindBodyEvent', false);
            }else{
                $(this).attr('title','跳转逻辑');
                _this.Bubble($(this),'/edit/ajax/q_jump_list/'+get_oid(project)+'/?qid='+obj.attr('oid')+'&pid='+get_oid(project)+'&ts='+(new Date()).getTime(),'right',bubbleWidth, 'isBindBodyEvent', false);
            }
        });

        //填空题选项设置
        $('.option_Fill .min_an').live('click', function() {
            var option_id = $(this).parent().attr('id');
            var obj = $(this).parents('.module');
            var place = $('.dragwen .module').index(obj);
            maptss("选项设置", '/edit/ajax/option_sets/'+get_oid(project)+'?option_id=' + option_id + '&q_index=' + place + '&ts=' + (new Date()).getTime(), "500");
        });

        //题目预览
        $('.Pre').live('click', function() {
            var obj = $(this).parents('.module');
            iframe_up("题目预览", '/edit/question_preview/' + obj.attr('oid') + '/?ts=' + (new Date()).getTime(), "850", "500");
        });

    },
    this.ptvt = function(in_this) {

        if(ptvt_Switch){
            //console.log('我出来了');
            // $('.dragwen .module').each(function(index, element) {
                if (in_this.data("blah") !== "yes" || in_this.data("blah") == 'undefined') {
                    $('.setup-group a,.updown,.operationH a,.operationV a',in_this).hide();
                }
            // });
        }

    },
    //设置
    this.SetUp = function() {

    },
    //逻辑
    this.logic = function() {

    },
    //预览
    this.preview = function() {

    },
    this.Bubble = function(mbb, url, type, width, isBindBodyEvent) {

        jsBubble.show({
            obj: mbb,
            loads: true,
            url: url,
            type: type,
            pyleft: 1,
            pytop: -5,
            title: mbb.attr('title'),
            width: width,
            BoColor: "none",
            BaColor: "#fff",
            CBaColor: "#fff",
            TBaColor: "#fff",
            Close: true,
            zIndex: 1000,
            isBindBodyEvent: isBindBodyEvent || false
        });
    },
    //批量添加
    this.Batch = function(mbb, issue, oid, type, width, hv, array) {
        hv == "h" ? hv = "Batch_push" : hv = "Batch_push_v";

        //判断默认选项
        var def_option = '';
        var def_class = '';
        var need_fill = match_text_remove(array);
        if (need_fill) {
            for (var i = 0; i < array.length; i++) {
                def_option += array[i] + '\r';
            }
            def_class = 'def_class';
        }
        def_option = !need_fill ? '' : def_option;

        var con = '<div class="poplayer" oid=' + oid + '>' +
            '<p class="spanlh">每行代表一个选项，可以添加多个选项</p>' +
            '<div><textarea class="bulkadd ' + def_class + '">' + def_option + '</textarea></div>' +
            '<div style="height:40px;" class="mtop postiondiv">' +
            '<div name=' + issue + ' class="WJButton wj_blue smallfontsize postionbtn ' + hv + ' test_class_A">保存</div>' +
            '</div>' +
            '</div>';

        jsBubble.show({
            obj: mbb,
            data: con,
            type: type,
            pyleft: 0,
            pytop: -3,
            title: mbb.attr('title'),
            width: width,
            BoColor: "#EFEFEF",
            BaColor: "#EFEFEF",
            CBaColor: "#fff",
            TBaColor: "#EFEFEF",
            Close: true,
            zIndex: 999
        });

        $('.poplayer[oid=' + oid + '] .def_class').one('click', function() {
            $(this).html('').removeClass(def_class);
            $(this).focus();
        });
        //$('.poplayer[oid='+oid+'] .bulkadd').focus();//焦点
    }
}



//弹出框打包配置

function maptss(title, url, conw, conh) {
    if (!conw) {
        conw = 500
    };
    //if(!conh){conh = 500};
    var wb = new jsbox({
        onlyid: "maptss",
        title: title,
        conw: conw,
        //conh:conh,
        //FixedTop:170,
        url: url,
        loads: true,
        range: true,
        mack: true
    }).show();
}
//弹出框打包配置iframe 方式

function iframe_up(title, url, conw, conh) {
    if (!conw) {
        conw = 500
    };
    if (!conh) {
        conh = 500
    };
    var wb = new jsbox({
        onlyid: "maptss",
        title: title,
        conw: conw,
        conh: conh,
        //FixedTop:170,
        url: url,
        iframe: true,
        range: true,
        mack: true
    }).show();
}

//文字编辑

function TextEdit() {

    this.obj = ''; //被编辑对象
    this.parentCon = {}; //编辑框
    this.addEdit = {}; //编辑框内容
    //this.button = {}; //菜单按钮
    this.fast_machine = {}; //快速操作按钮
    this.html = '';
    this.editor = ''; //FCK编辑器状态
    this.Tinfo = {};
    this.type = '';
    this.id = '';
    this.option_id = '';
    this.Cw = '';

}
TextEdit.prototype = {
    //标题类型编辑
    T_edit: function() {
        var _this = this;

        $('.T_edit').live('click', function() {

            _this.obj = $(this);
            _this.type = _this.obj.attr('name');
            _this.id = _this.obj.parents('.module').attr('oid');

            //选项菜单逻辑
            var menu_list = {};
            if (_this.type == "project" || _this.type == "begin_desc" || _this.type == "end_desc" || _this.type == "screenout_desc") {
                menu_list.sz = false;
                menu_list.yy = false;
                menu_list.line = false;
                menu_list.Del = false;
                menu_list.Up = false;
                menu_list.Dn = false;
                menu_list.Left = false;
                menu_list.Right = false;
                menu_list.lj = false;
            } else if (_this.type == "question") {

                var parli = _this.obj.parents('.module');
                var m = $(".module", '.dragwen').index(parli) + 1;
                var l = $(".module", '.dragwen').length;
                var s = $('.dragwen > li:eq(' + (m - 2) + ')').is('.paging');

                if (m == 1) {
                    menu_list.yy = false;
                }
                if (m == 2) {
                    if (s) {
                        menu_list.yy = false;
                    }
                }
                if (m == l) {
                    menu_list.lj = false;
                }

                menu_list.sz = false;
                menu_list.line = false;
                menu_list.Del = false;
                menu_list.Up = false;
                menu_list.Dn = false;
                menu_list.Left = false;
                menu_list.Right = false;
                menu_list.lj = false;
            }

            //set id
            setOperateOId(_this.type, _this.id)

            // load setting
            var issue = _this.obj.parents('.module').attr('issue');
            if (issue == 70) {
                addSettingContent("设置", "");
            } else {
                var obj = $(this).parents('.module');
                var place = $('.dragwen .module').index(obj);

                obj.data("blah", "yes");
                $('.setup-group a,.updown,.operationH a,.operationV a').hide();
                $('.setup-group a,.updown,.operationH a,.operationV a',obj).show();
                url = '/edit/ajax/q_options/'+get_oid(project)+'/?q_index='+place+'&ts='+(new Date()).getTime()+'&question_id='+obj.attr('oid');
                if (obj.attr('oid')){
                    // 题目设置里，只有单选题和多选题才有选项关联
                    if(is_single_or_multiple(obj.attr('oid'))){
                        $('.option_relation_btn').parent().show();
                    }else{
                        $('.option_relation_btn').parent().hide();
                    }

                    $.get(url, function(result){
                        addSettingContent("题目设置", result);
                    });
                }
            }

            addLogicSet(true, 1)

            //ali ref
            if (menu_list.yy == true || menu_list.yy == undefined) {
                addRefSet(true, 1)
            } else {
                addRefSet(false, 1)
            }

            initRightOperate()

            //生成菜单项
            _this.ConEdit(_this.obj, menu_list);

            //防点击生效
            _this.addEdit.bind('click', function() {
                return false;
            });

            //调出菜单按钮
            // _this.button.toggle(function() {
            //     $(this).parent().find('.menu_edit').show();
            //     // return false;
            // }, function() {
            //     $(this).parent().find('.menu_edit').hide();
            // });


            //点击取消并保存
            $("body").one('click', function() {
                //_this.html = _this.addEdit.html();
                var isText = /^\s+$/.test(_this.addEdit.text());
                var isImg = _this.addEdit.find('img').length;
                if (_this.addEdit.text() == "" || isText) {
                    if(isImg==0){
                        //if (_this.type == "project" || _this.type == "end_desc" || _this.type == "question") {
                        if (_this.type == "project" || _this.type == "question") {
                            _this.Save_title();
                        } else {
                            _this.html = _this.addEdit.html();
                            _this.Save_title();
                        }
                    }else{
                        _this.html = _this.addEdit.html();
                        if (_this.type == 'project') {
                            var top_title = _this.addEdit.text().substr(0, 20);
                            if (top_title.length >= 20) {
                                top_title = top_title + '...'
                            }
                            $('.h4Title').text(top_title).attr('title', _this.html);
                        }
                        _this.Save_title();
                    }
                } else {
                    _this.html = _this.addEdit.html();
                    if (_this.type == 'project') {
                        var top_title = _this.addEdit.text().substr(0, 20);
                        if (top_title.length >= 20) {
                            top_title = top_title + '...'
                        }
                        $('.h4Title').text(top_title).attr('title', _this.html);
                    }
                    _this.Save_title();
                }
            });
        });
    },
    //li结构编辑
    T_edit_li: function() {
        var _this = this;

        $('.T_edit_min').live('click', function() {
            _this.obj = $(this);
            _this.type = _this.obj.attr('name');
            _this.id = _this.obj.parents('.module').attr('oid');
            _this.option_id = _this.obj.attr('id');

            //ali
            setOperateOId(_this.type, _this.option_id)

            //选项菜单逻辑
            var menu_list = {};
            var parli = _this.obj.parents('.module');
            var m = $(".module", '.dragwen').index(parli) + 1;
            var l = $(".module", '.dragwen').length;
            var s = $('.dragwen > li:eq(' + (m - 2) + ')').is('.paging');
            //alert(m);

            if (m == 1) {
                menu_list.yy = false;
            }
            if (m == 2) {
                if (s) {
                    menu_list.yy = false;
                }
            }

            menu_list.Left = false;
            menu_list.Right = false;
            menu_list.lj = false;

            menu_list.Del=true;

            var issue = _this.obj.parents('.module').attr('issue');
            var question_id = _this.obj.parents('.module').attr('oid');

            if (issue == "2" || issue == "3") {
                menu_list.lj = true;
            }

            if (issue == "50" || issue == "60") {
                menu_list.sz = false;
            }

            if (issue == "88") {
                menu_list.lj = true;
                var question = get_question(question_id);
                if (question.question_type == QUESTION_TYPE_SINGLE){
                    menu_list.sz = false;
                }else{
                    menu_list.sz = true;
                }

                menu_list.upimg = false;
            }

            //ali @ 2015/4/8
            //if sz is true need to load the option
            if (menu_list.sz == true || menu_list.sz == undefined) {

                var obj = _this.obj.parents('.module');
                var place = $('.dragwen .module').index(obj);

                url = '/edit/ajax/option_sets/'+get_oid(project)+'/?option_id='+_this.option_id+'&q_index='+place+'&ts='+(new Date()).getTime()

                $.get(url, function(result){
                    addSettingContent("选项设置", result);
                });
            } else {
                addSettingContent("设置", "");
            }

            //ali add logic
            if (menu_list.lj == true) {
                addLogicSet(true, 2)
            } else {
                addLogicSet(false, 2)
            }

            //ali  add ref setting
            if (menu_list.yy == true || menu_list.yy == undefined) {
                addRefSet(true, 2)
            } else {
                addRefSet(false, 2)
            }

            initRightOperate()

            //if(m==l){menu_list.lj=false;}

            //生成选项菜单
            _this.ConEdit_min(_this.obj, menu_list);

            //防点击生效
            _this.addEdit.bind('click', function() {
                return false;
            });

            //向上移动
            _this.menus.find('.EdUp').bind('click', function() {
                _this.EdUp_li();
                moveTop('#'+$('.right_operate').attr('oid'));
                return false;
            });
            //向下移动
            _this.menus.find('.EdDn').bind('click', function() {
                _this.EdDn_li();
                moveTop('#'+$('.right_operate').attr('oid'));
                return false;
            });

            //调出菜单按钮
            // _this.button.toggle(function() {
            //     $(this).parent().find('.menu_edit').show();
            //     // return false;
            // }, function() {
            //     $(this).parent().find('.menu_edit').hide();
            // });

            //点击取消
            $("body").one('click', function() {
                _this.html = _this.addEdit.html();
                var isText = /^\s+$/.test(_this.addEdit.text());
                var isImg = _this.addEdit.find('img').length;
                if (_this.addEdit.text() == "" || isText) {
                    if(isImg == 0){
                       _this.Del_edit();
                    }else{
                        _this.Save_title();
                    }
                } else {

                    //                        var name_deal = new Name_deal();
                    //                        name_deal.ErdogicFn(parli,'.unstyled li',"label[name='option']");
                    //                        var editPt = name_deal.EditFn(_this.addEdit.html());
                    //                        console.log(editPt);
                    //                        var SaveZ = _this.addEdit.html();
                    //
                    //                        var SaveId = _this.option_id;
                    // if(editPt){
                    // _this.parentCon.remove();
                    // $('#'+SaveId).click();
                    // console.log(SaveZ);

                    // $('#'+SaveId).html(SaveZ);
                    // _this.addEdit.html(SaveZ);

                    // loadMack({off:'on',Limg:0,text:"有重名请重新编辑",set:1500});
                    //}else{
                    _this.Save_title();
                    // $('body').unbind('click');
                    // }
                }
            });

        });

    },
    //td结构编辑
    T_edit_td: function() {
        var _this = this;

        $('.T_edit_td').live('click', function() {

            _this.obj = $(this);
            _this.type = _this.obj.attr('name');
            _this.id = _this.obj.parents('.module').attr('oid');
            _this.option_id = _this.obj.attr('id');

            //ali
            setOperateOId(_this.type, _this.option_id)

            //选项菜单逻辑
            var menu_list = {};
            var parli = _this.obj.parents('.module');
            var m = $(".module", '.dragwen').index(parli) + 1;
            var l = $(".module", '.dragwen').length;
            var s = $('.dragwen > li:eq(' + (m - 2) + ')').is('.paging');
            //alert(m);
            if (m == 1) {
                menu_list.yy = false;
            }
            if (m == 2) {
                if (s) {
                    menu_list.yy = false;
                }
            }

            menu_list.Left = false;
            menu_list.Right = false;
            menu_list.lj = false;

            if (_this.type == 'row') {
                menu_list.sz = false;
            }

            var issue = _this.obj.parents('.module').attr('issue');

            if (issue == "2" || issue == "3") {
                menu_list.lj = true;
            }

            if (issue == "50" || issue == "60" || issue == "7") {
                menu_list.sz = false;
            }

            if (m == l) {
                menu_list.lj = false;
            }

            menu_list.Del=true;

            if (_this.obj.attr('menutype') == 'col') {
                menu_list.Up = false;
                menu_list.Dn = false;
                menu_list.Left = true;
                menu_list.Right = true;
            }

            //if sz is true need to load the option
            if (menu_list.sz == true || menu_list.sz == undefined) {

                var obj = _this.obj.parents('.module');
                var place = $('.dragwen .module').index(obj);

                url = '/edit/ajax/option_sets/'+get_oid(project)+'/?option_id='+_this.option_id+'&q_index='+place+'&ts='+(new Date()).getTime()

                $.get(url, function(result){
                    addSettingContent("选项设置", result);
                });
            } else {
                addSettingContent("设置", "");
            }

            //ali add logic
            if (menu_list.lj == true) {
                addLogicSet(true, 2)
            } else {
                addLogicSet(false, 2)
            }

            //ali  add ref setting
            if (menu_list.yy == true || menu_list.yy == undefined) {
                addRefSet(true, 2)
            } else {
                addRefSet(false, 2)
            }

            initRightOperate()

            //生成选项菜单
            _this.ConEdit_min(_this.obj, menu_list);

            //防点击生效
            _this.addEdit.bind('click', function() {
                return false;
            });

            //向上移动
            _this.menus.find('.EdUp').bind('click', function() {
                _this.EdUp_td();
                moveTop('#'+$('.right_operate').attr('oid'));
                return false;
            });
            //向下移动
            _this.menus.find('.EdDn').bind('click', function() {
                _this.EdDn_td();
                moveTop('#'+$('.right_operate').attr('oid'));
                return false;
            });

            //向左移动
            _this.menus.find('.EdLeft').bind('click', function() {
                _this.EdLeft_td();
                return false;
            });
            //向右移动
            _this.menus.find('.EdRight').bind('click', function() {
                _this.EdRight_td();
                return false;
            });

            //调出菜单按钮
            // _this.button.toggle(function() {
            //     $(this).parent().find('.menu_edit').show();
            //     // return false;
            // }, function() {
            //     $(this).parent().find('.menu_edit').hide();
            // });

            //点击取消
            $("body").one('click', function() {
                _this.html = _this.addEdit.html();
                var isText = /^\s+$/.test(_this.addEdit.text());
                var isImg = _this.addEdit.find('img').length;

                if (_this.addEdit.text() == "" || isText) {
                   // _this.Del_edit();
                    if(isImg == 0){
                       _this.Del_edit();
                    }else{
                        _this.Save_title();
                    }
                } else {
                    _this.Save_title();
                }
            });

        });

    },
    //保存编辑
    Save_title: function() {
        var text = this.html;
        this.obj.html(text);

        //        if(this.type=='option'||this.type=='row'){
        //            var bjWidth= this.parentCon.width();
        //            if(bjWidth>=350){
        //                bjWidth=350;
        //                this.obj.width(bjWidth);
        //            };
        //        }

        if (this.type == "project" || this.type == "begin_desc" || this.type == "end_desc" || this.type == "screenout_desc") {
            var id = get_oid(project);
            save_title(text, this.type, id);
            if (this.type == "end_desc"){
                project.end_desc = text;
            }else if (this.type == "screenout_desc"){
                project.custom_attr["screenout_desc"] = text;
            }
        } else if (this.type == "question") {
            save_title(text, this.type, this.id);
        } else {
            var option_id = this.obj.attr('id');
            save_title(text, this.type, option_id);
        }

        this.addEdit.unbind();
        this.parentCon.remove();
    },
    //生成标准编辑框
    ConEdit: function(obj, menu_list) {
        var _this = this;
        _this.html = obj.html();
        var mbWidth = obj.width();
        mbWidth < 500 ? mbWidth = 500 : mbWidth;
        mbWidth >= 750 ? mbWidth = 750 : mbWidth;
        var mbHeight = obj.height();
        mbHeight < 30 ? mbHeight = 30 : mbHeight;
        var style = obj.attr('class').split(" ");
        var addstyle = '';

        for (var i = 0; i < style.length; i++) {
            if (style[i] !== "T_edit") {
                addstyle += style[i] + " "
            }
        }
        _this.fast_machine = $();
        //_this.button = $('<div class="max_an"></div>');
        _this.parentCon = $('<div class="zon_edit"></div>');
        _this.addEdit = $('<div class="add_edit" contentEditable="true">' + _this.html + '</div>');


        _this.parentCon.append(_this.menu(-32, 37, menu_list));
        //_this.parentCon.append(_this.button);
        _this.parentCon.append(_this.addEdit);

        _this.addEdit.attr('style', obj.attr('style'));
        _this.addEdit.addClass(addstyle);
        _this.parentCon.css({
            'width': mbWidth + 'px',
            'minHeight': mbHeight + 'px',
            'position': 'absolute',
            'top': obj.offset().top - 1 + 'px',
            'left': obj.offset().left - 1 + 'px'
        });
        _this.addEdit.css({
            //'width':mbWidth+'px',
            //'minHeight':mbHeight+'px'
            //'padding':'4px 0 0 0',
            'minHeight': 30 + 'px'
        });
        //输出编辑框
        $('body').append(_this.parentCon);
        // alert(_this.parentCon.html());
        _this.addEdit.focus(); //焦点


        _this.setSelectText(_this.addEdit);

        _this.GetRidFormat(_this.addEdit);

        //设置图片大小
        new ImgEditSize(_this.addEdit.find('img'));
    },
    //生成小号编辑框
    ConEdit_min: function(obj, menu_list) {
        var _this = this;
        _this.html = obj.html();
        var mbWidth = obj.width() + 2;
        mbWidth < 260 ? mbWidth = 260 : mbWidth;
        mbWidth > 650 ? mbWidth = 650 : mbWidth;
        var mbHeight = obj.height();
        mbHeight < 21 ? mbHeight = 21 : mbHeight;
        var style = obj.attr('class').split(" ");
        var addstyle = '';
        for (var i = 0; i < style.length; i++) {
            if (style[i] !== "T_edit") {
                addstyle += style[i]
            }
        }

        menu_list.EdUp=true;
        menu_list.EdDn=true;

        //生成选项移动按钮
        // var UDLR = '<li><a title="上移选项" href="javascript:;" class="EdUp nob"><i class="menu_edit6_icon"></i></a></li>' + '<li><a title="下移选项" href="javascript:;" class="EdDn"><i class="menu_edit7_icon"></i></a></li>';
        // if (menu_list.Left == true || menu_list.Right == true) {
        //     UDLR = '<li><a title="左移选项" href="javascript:;" class="EdLeft nob"><i class="menu_edit8_icon"></i></a></li>' + '<li><a title="右移选项" href="javascript:;" class="EdRight"><i class="menu_edit9_icon"></i></a></li>';
        // }
        // _this.fast_machine = $('<ul class="fast_machine">' + UDLR + '<li><a title="删除选项" href="javascript:;" class="DelEdit"><i class="menu_edit5_icon"></i></a></li></ul>');


        //_this.button = $('<div class="min_an"></div>');
        _this.parentCon = $('<div class="zon_edit"></div>');
        _this.addEdit = $('<div class="add_edit" contentEditable="true">' + _this.html + '</div>');
        _this.Cw = $('<div class="Cw">' + _this.html + '</div>');
        _this.parentCon.append(_this.menu(-20, 26, menu_list));
        //_this.parentCon.append(_this.button);
        _this.parentCon.append(_this.addEdit);
        //_this.parentCon.append(_this.fast_machine);
        $('.Cw').remove();
        $('body').append(_this.Cw);

        _this.addEdit.attr('style', obj.attr('style'));
        _this.addEdit.addClass(addstyle);
        //cq 判斷
        var max_left=obj.offset().left+mbWidth;
        var wid_left=$('.rows2').offset().left+$('.rows2').width();
        if(max_left>wid_left || (obj.offset().left<$('.rows2').offset().left+56 && mbWidth>$('.rows2').outerWidth())){
            _this.parentCon.css({
                'width': mbWidth + 2 + 'px',
                'minHeight': mbHeight + 'px',
                'position': 'absolute',
                'top': obj.offset().top - 1 + 'px',
                'left': wid_left-mbWidth-50 + 'px'
            });
        }else if( (obj.offset().left<$('.rows2').offset().left && mbWidth<$('.rows2').outerWidth()) ){
            _this.parentCon.css({
                'width': mbWidth + 2 + 'px',
                'minHeight': mbHeight + 'px',
                'position': 'absolute',
                'top': obj.offset().top - 1 + 'px',
                'left': $('.rows2').offset().left+55 + 'px'
            });
        }else{
            _this.parentCon.css({
                'width': mbWidth + 2 + 'px',
                'minHeight': mbHeight + 'px',
                'position': 'absolute',
                'top': obj.offset().top - 1 + 'px',
                'left': obj.offset().left - 1 + 'px'
            });
        }
        _this.addEdit.css({
            'width': mbWidth + 'px',
            //'minHeight':mbHeight+'px'
            'minHeight': 21 + 'px',
            'padding': '4px 0 0 0' //,
            //'lineHeight':21+'px'
        });

        _this.addEdit.bind('keyup', function() {
            _this.Cw.html(_this.addEdit.html());
            var Cw = _this.parentCon.width();
            var Aw = _this.Cw.width();
            //cq 判斷
            if(max_left>wid_left){
                if (Aw >= mbWidth) {
                    _this.parentCon.width(mbWidth);
                    _this.addEdit.width(mbWidth-2);
                } else if (Aw <= 200) {
                    if (Aw < mbWidth) {
                        Aw < mbWidth ? Aw = mbWidth : Aw;
                        _this.parentCon.width(Aw + 4);
                        _this.addEdit.width(Aw + 2);
                    } else {
                        _this.parentCon.width(200);
                        _this.addEdit.width(200);
                    }

                } else {
                    Aw < mbWidth ? Aw = mbWidth : Aw;
                    _this.parentCon.width(Aw + 4);
                    _this.addEdit.width(Aw + 2);
                }
            }else{
                if (Aw >= 650) {
                    _this.parentCon.width(650);
                    _this.addEdit.width(648);
                } else if (Aw <= 200) {
                    if (Aw < mbWidth) {
                        Aw < mbWidth ? Aw = mbWidth : Aw;
                        _this.parentCon.width(Aw + 4);
                        _this.addEdit.width(Aw + 2);
                    } else {
                        _this.parentCon.width(200);
                        _this.addEdit.width(200);
                    }

                } else {
                    Aw < mbWidth ? Aw = mbWidth : Aw;
                    _this.parentCon.width(Aw + 4);
                    _this.addEdit.width(Aw + 2);
                }
            }
        });

        //输出编辑框
        $('body').append(_this.parentCon);
        // alert(_this.parentCon.html());

        _this.addEdit.focus(); //焦点

        _this.setSelectText(_this.addEdit);

        _this.GetRidFormat(_this.addEdit);

        //设置图片大小
        new ImgEditSize(_this.addEdit.find('img'));
    },
    //光标控制（待定）
    setSelectText: function(el) {


        try {
            var Check = check_title_select(el.text());

            window.getSelection().selectAllChildren(el[0]); //全选
            /*if (!Check) {
                window.getSelection().collapseToEnd(el[0]); //光标置后
            }*/

        } catch (err) {
            //在此处理错误
        }

        //      if(document.selection){
        //
        //      }else{
        //         var Check = check_title_select(el.text());
        //
        //          window.getSelection().selectAllChildren(el[0]);//全选
        //         if(!Check){
        //          window.getSelection().collapseToEnd(el[0]);//光标置后
        //         }
        //      }

    },
    //粘贴内容格式去除
    GetRidFormat: function(obj) {

        EventUtil.addHandler(obj[0], "paste", function(event) {

            setTimeout(function() {
                var html = obj.html();
                html = html.replace(/<\/?[^>(IMG)(img)][^>]*>/g,'');
                obj.html(html);
            }, 50);

        });

        function DgContents(htt) {

            htt = htt.replace(/<\/?SPAN[^>]*>/gi, "");
            htt = htt.replace(/<(\w[^>]*) class=([^ |>]*)([^>]*)/gi, "<$1$3");
            htt = htt.replace(/<(\w[^>]*) style="([^"]*)"([^>]*)/gi, "<$1$3");
            htt = htt.replace(/<(\w[^>]*) lang=([^ |>]*)([^>]*)/gi, "<$1$3");
            htt = htt.replace(/<\\?\?xml[^>]*>/gi, "");
            htt = htt.replace(/<\/?\w+:[^>]*>/gi, "");
            htt = htt.replace(/&nbsp;/, " ");
            var re = new RegExp("(<P)([^>]*>.*?)(<\/P>)", "gi"); // Different because of a IE 5.0 error
            htt = htt.replace(re, "<div$2</div>");
            return htt;
        }

    },
    //插入图片_菜单
    addImg:function(data){
        if(!data.error_msg==""){
           loadMack({off:'on',Limg:0,text:data.error_msg,set:2500});
           return false;
        }
        var editImg = $('<img src="'+data.img_url+'">').appendTo(this.addEdit);
        //this.button.click();
        //设置图片大小
        new ImgEditSize(editImg);
        //imgEditSize.main(editImg);
    },
    //生成菜单
    menu: function(x, y, Obj) {
        if (!Obj) {
            Obj = {};
        }
        this.Tinfo = {
            sz: Obj.sz && true,
            bj: Obj.bj && true,
            lj: Obj.lj && true,
            yy: Obj.yy && true,
            EdUp: Obj.EdUp || false,
            EdDn: Obj.EdDn || false,
            Upimg: Obj.upimg && true,
            Del: Obj.Del && true
            //line:Obj.line && true,
        };

        var _this = this.Tinfo;

        //ali
        // _this.sz == false ? _this.sz = '' : _this.sz = '<li><a name="选项设置" href="javascript:;" class="option_Set"><i class="menu_edit1_icon"></i></a></li>';
        _this.bj == false ? _this.bj = '' : _this.bj = '<li><a name="高级编辑" href="javascript:;" class="SeniorEdit"><i class="menu_edit2_icon"></i></a></li>';
        //_this.lj == false ? _this.lj = '' : _this.lj = '<li><a name="逻辑设置" href="javascript:;" class="logic_Set"><i class="menu_edit3_icon"></i></a></li>';
        //_this.yy == false ? _this.yy = '' : _this.yy = '<li><a name="引用设置" href="javascript:;" class="reference_Set"><i class="menu_edit4_icon"></i></a></li>';



        _this.Del == false ? _this.Del = '' : _this.Del = '<li><a name="删除选项" href="javascript:;" class="DelEdit"><i class="menu_edit5_icon"></i></a></li>';

        var upimg_con = '<div class="beforeup">'+
                        '<iframe src="/edit/upload_img_for_ck?fun=textEdit.addImg" id="imgUpload" style="filter:alpha(opacity = 0);-moz-opacity:0;-khtml-opacity:0;opacity:0;position:absolute;top:0;left:0;width:21px;height:20px;border:0;"></iframe>'+
                        '<div class="wjbtn"></div>'+
                    '</div>';
        _this.Upimg == false ? _this.Upimg = '' : _this.Upimg = '<li><a name="插入图片" href="javascript:;" class="add_Img"><i class="menu_edit10_icon"></i>'+upimg_con+'</a></li>';
        //_this.line==false?_this.line='':_this.line='<li><div class="fgbor"></div></li>';

        // this.menus = $('<ul class="menu_edit" style="display:none;margin-top:' + y + 'px;right:' + x + 'px;">' +
        //     _this.sz +
        //     _this.bj +
        //     _this.Upimg +
        //     _this.lj +
        //     _this.yy +

        //     //_this.line+
        //     '</ul>');
        var UDLR='';
        if (_this.EdUp == true || _this.EdDn == true) {
           UDLR = '<li><a name="上移选项" href="javascript:;" class="EdUp nob"><i class="menu_edit6_icon"></i></a></li>' + '<li><a name="下移选项" href="javascript:;" class="EdDn"><i class="menu_edit7_icon"></i></a></li>';
        }
        if (Obj.Left == true || Obj.Right == true) {
           UDLR = '<li><a name="左移选项" href="javascript:;" class="EdLeft nob"><i class="menu_edit8_icon"></i></a></li>' + '<li><a name="右移选项" href="javascript:;" class="EdRight"><i class="menu_edit9_icon"></i></a></li>';
        }

        this.menus = $('<ul class="fast_machine">' +
            //_this.sz +
            _this.Upimg +
            _this.bj +
            //ali
            //_this.lj +
            //_this.yy +
            UDLR+
            _this.Del +

            //_this.line+
            '</ul>');

        var this_ = this;

        //高级编辑
        if (_this.bj !== "") {
            this_.menus.find('.SeniorEdit').bind('click', function() {
                this_.EditTcc();
                // $('body').unbind('click');
                return false;
            });
        }
        //删除选项
        if (_this.Del !== "") {
            this_.menus.find('.DelEdit').bind('click', function() {
                this_.Del_edit();
                moveLeft();
                $('body').unbind('click');
                return false;
            });
        }

        //逻辑设置
        if (_this.lg !== "") {
            this_.menus.find('.logic_Set').bind('click', function() {
                maptss("逻辑设置",'/edit/ajax/option_jump_set/'+get_oid(project)+'/?option_id='+this_.option_id+'&pid='+get_oid(project)+'&ts='+(new Date()).getTime(),"500");
            });
        }

        //引用设置
        if (_this.yy !== "") {
            this_.menus.find('.reference_Set').bind('click', function() {
                var valid = '';
                this_.type == "question" ? valid = this_.id : valid = this_.option_id;

                //this.parentCon={};//编辑框
                //this.addEdit
                var text = this_.addEdit.html();
                save_title(text, this_.type, valid);

                $('body').unbind('click');
                this_.parentCon.remove();

                    maptss("引用设置",'/edit/ajax/autoreplace_set/'+get_oid(project)+'/?oid='+valid+'&pid='+get_oid(project)+'&type='+this_.type+'&ts='+(new Date()).getTime(),"509");

                return false;

            });
        }

        //选项设置
        if (_this.sz !== "") {
            this_.menus.find('.option_Set').bind('click', function() {

                var obj = this_.obj.parents('.module');
                var place = $('.dragwen .module').index(obj);
                maptss("选项设置",'/edit/ajax/option_sets/'+get_oid(project)+'/?option_id='+this_.option_id+'&q_index='+place+'&ts='+(new Date()).getTime(),"500");
            });
        }

        //添加选项图片鼠标事件
        if (_this.Upimg !== "") {
            this_.menus.find('.add_Img').hover(function() {
                $(this).find('i').addClass('add_Img_bg');
            },function(){
                $(this).find('i').removeClass('add_Img_bg');
            });
        }

        return this.menus;

    },
    //删除选项
    Del_edit: function(only_Dom) {
        var col = this.obj.attr('menutype');
        var id = this.obj.attr('id');
        var name = this.obj.attr('name');
        var oid = this.obj.parents('.module').attr('oid');
        var issue = this.obj.parents('.module').attr('issue');

        if (col == "col") {

            var parTR = this.obj.parent();
            var parTbody = this.obj.parent().parent();
            var m = $("td", parTR).index(this.obj);
            $('tr', parTbody).each(function(index, element) {
                $(this).find('td:eq(' + m + ')').remove();
            });

            if (only_Dom == undefined) {
                delete_option(oid, id);
            }

        } else if (col == "row") {
            this.obj.parent().remove();

            if (only_Dom == undefined) {
                delete_matrixrow(oid, id);
            }

        } else {

            if (issue == "60") {
                //排序题排序限制处理
                var limit = this.obj.parents('.module').attr('limit');
                var m = this.obj.parents('.module').find('.unstyled li').length;
                if(limit==undefined){
                    this.obj.parents('.module').find('.sort-right tbody tr:last').remove();
                }else if(m<=limit){
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '选项数量不能少于需要选出的位数',
                        set: 2000
                    });
                    this.parentCon.remove();
                    return false;
                }
            }

            // this.obj.parent().remove();

            if (only_Dom == undefined) {
                delete_option(oid, id, 'is_remove');
            }
        }
        //alert('删除测试');
        if(this.parentCon.length) this.parentCon.remove();

        //选项计算宽度
        if (issue == "4" || issue == "5"){
            Width_mate(oid);
        }

        return false;
    },
    //创建弹出框
    EditTcc: function(conw, conh) {

        $("body").unbind('click');

        if (!conw) {
            conw = 754
        };
        if (!conh) {
            conh = 400
        };
        var wb = new jsbox({
            onlyid: "EditTcc",
            title: false,
            conw: conw,
            conh: conh,
            title: "高级编辑",
            //FixedTop: 170,
            range: true,
            content: '',
            mack: true
        }).show();

        var style = this.addEdit.html();
        var styleArr = [];
        if (!this.addEdit.css('fonztFamily')) {
            styleArr.push("font-family:" + this.addEdit.css('fontFamily') + ";");
        }
        styleArr.push("font-size:" + this.addEdit.css('fontSize') + ";");
        styleArr.push("color:" + this.addEdit.css('color') + ";");
        styleArr.push("font-style:" + this.addEdit.css('fontStyle') + ";");
        styleArr.push("font-weight:" + this.addEdit.css('fontWeight') + ";");
        styleArr.push("text-decoration:" + this.addEdit.css('textDecoration') + ";");
        // style += this.fontArr[i].color;
        // style += this.fontArr[i].bold;
        // style += this.fontArr[i].italic;
        // style += this.fontArr[i].underline;
        var ii = 0;
        var m = styleArr.length;
        var _this = this;
        dgStyle(ii, m);

        function dgStyle(ii, m) {
            if (ii !== m) {
                style = '<span style="' + styleArr[ii] + '">' + style + '</span>';
                ii++;
                return dgStyle(ii, m);
            } else {
                return style;
            }
        }
        this.createEditor(style, this.obj);

        $('#EditTcc .loaddiv').append("<div class='editTcc'><div class='WJButton wj_blue editTcc_an'>保存</div></div>");

    },
    //li结构向上移动
    EdUp_li: function(conw, conh) {

        var parul = this.obj.parents('.unstyled');
        var parli = this.obj.parents('.unstyled li');
        var cols_count = $('[oid='+this.id+']').attr('disp_type');
        var m = $("li", parul).index(parli);
        if (m == 0) {
            loadMack({
                off: 'on',
                Limg: 0,
                text: '已经是第一个选项',
                set: 800
            });
            return
        }
        if (parli.prev().data('related')) {
            loadMack({
                off: 'on',
                Limg: 0,
                text: '题目自定义选项不能移至关联选项之前',
                set: 800
            });
            return
        }
        parul.find('li:eq(' + (m - 1) + ')').before(parli);
        if(cols_count=='vertical'){
            $("html,body").animate({
                scrollTop: '-=' + 30
            }, 'slow');
        }

        this.parentCon.css({
            'top': this.obj.offset().top - 1 + 'px',
            'left': this.obj.offset().left - 1 + 'px'
        });

        move_option(this.id, this.option_id, 'up');

    },
    //li结构向下移动
    EdDn_li: function(conw, conh) {

        var parul = this.obj.parents('.unstyled');
        var parli = this.obj.parents('.unstyled li');
        var cols_count = $('[oid='+this.id+']').attr('disp_type');
        var m = $("li", parul).index(parli);
        var l = $("li", parul).length - 1;
        if (m == l) {
            loadMack({
                off: 'on',
                Limg: 0,
                text: '已经是最后一个选项',
                set: 800
            });
            return
        }
        parul.find('li:eq(' + (m + 1) + ')').after(parli);

        if(cols_count=="vertical"){
            $("html,body").animate({
                scrollTop: '+=' + 30
            }, 'slow');
        }

        this.parentCon.css({
            'top': this.obj.offset().top - 1 + 'px',
            'left': this.obj.offset().left - 1 + 'px'
        });

        move_option(this.id, this.option_id, 'down');

    },
    //td结构向上移动
    EdUp_td: function(conw, conh) {

        var parTbody = this.obj.parent().parent();
        var parRr = this.obj.parent();
        var m = $(".Ed_tr", parTbody).index(parRr);
        if (this.obj.attr('menutype') == 'row') {
            if (m == 0) {
                loadMack({
                    off: 'on',
                    Limg: 0,
                    text: '已经是第一个选项',
                    set: 800
                });
                return
            }
        }
        if (m == 0) {
            loadMack({
                off: 'on',
                Limg: 0,
                text: '已经是第一个选项',
                set: 800
            });
            return
        }
        parTbody.find('.Ed_tr:eq(' + (m - 1) + ')').before(parRr);
        $("html,body").animate({
            scrollTop: '-=' + 30
        }, 'slow');

        this.parentCon.css({
            'top': this.obj.offset().top - 1 + 'px',
            'left': this.obj.offset().left - 1 + 'px'
        });

        if (this.type == 'row') {
            move_matrixrow(this.id, this.option_id, 'up');
        } else {
            move_option(this.id, this.option_id, 'up');
        }


    },
    //td结构向下移动
    EdDn_td: function(conw, conh) {

        var parTbody = this.obj.parent().parent();
        var parRr = this.obj.parent();
        var m = $(".Ed_tr", parTbody).index(parRr);
        var l = $(".Ed_tr", parTbody).length - 1;
        if (m == l) {
            loadMack({
                off: 'on',
                Limg: 0,
                text: '已经是最后一个选项',
                set: 800
            });
            return
        }
        parTbody.find('.Ed_tr:eq(' + (m + 1) + ')').after(parRr);
        $("html,body").animate({
            scrollTop: '+=' + 30
        }, 'slow');

        this.parentCon.css({
            'top': this.obj.offset().top - 1 + 'px',
            'left': this.obj.offset().left - 1 + 'px'
        });

        if (this.type == 'row') {
            move_matrixrow(this.id, this.option_id, 'down');
        } else {
            move_option(this.id, this.option_id, 'down');
        }

    },
    //td结构向左移动
    EdLeft_td: function(conw, conh) {

        var parTd = this.obj;
        var parTR = this.obj.parent();
        var parTbody = this.obj.parent().parent();
        var m = $("td", parTR).index(parTd);
        if (m == 1) {
            loadMack({
                off: 'on',
                Limg: 0,
                text: '已经是第一个选项',
                set: 800
            });
            return
        }
        //parTR.find('td:eq('+(m-1)+')').before(parTd);
        $('tr', parTbody).each(function(index, element) {
            var parN = $(this).find('td:eq(' + m + ')');
            $(this).find('td:eq(' + (m - 1) + ')').before(parN);
        });

        this.parentCon.css({
            'top': this.obj.offset().top - 1 + 'px',
            'left': this.obj.offset().left - 1 + 'px'
        });

        if (this.type == 'row') {
            move_matrixrow(this.id, this.option_id, 'up');
        } else {
            move_option(this.id, this.option_id, 'up');
        }


    },
    //td结构向右移动
    EdRight_td: function(conw, conh) {

        var parTd = this.obj;
        var parTR = this.obj.parent();
        var parTbody = this.obj.parent().parent();
        var m = $("td", parTR).index(parTd);
        var l = $("td", parTR).length - 1;
        if (m == l) {
            loadMack({
                off: 'on',
                Limg: 0,
                text: '已经是最后一个选项',
                set: 800
            });
            return
        }
        //parTR.find('td:eq('+(m-1)+')').before(parTd);
        $('tr', parTbody).each(function(index, element) {
            var parN = $(this).find('td:eq(' + m + ')');
            $(this).find('td:eq(' + (m + 1) + ')').after(parN);
        });

        this.parentCon.css({
            'top': this.obj.offset().top - 1 + 'px',
            'left': this.obj.offset().left - 1 + 'px'
        });

        if (this.type == 'row') {
            move_matrixrow(this.id, this.option_id, 'down');
        } else {
            move_option(this.id, this.option_id, 'down');
        }
    },
    Tcc_ajax: function() {

    },
    //创建上传图片弹出框
    UpdataImageTcc: function(conw, conh) {

        $("body").unbind('click');

        if (!conw) {
            conw = 412
        };
        if (!conh) {
            conh = 260
        };
        var html = '<div class="upImage_con">'+
                        '<div class="upimg_Tabs">'+
                            '<div class="tabs_item selected">本地上传</div>'+
                            '<div class="tabs_item">网址URL</div>'+
                        '</div>'+
                        '<ul class="">'+
                            '<li class="upImage_img">'+
                                '<div class="upImage_img_con">'+
                                    '点击“上传图片”，在您电脑中选择要上传的图片，每张图片上传完毕后将会自动添加到正文中 <span class="note">（图片不能大于5MB）</span>'+
                                    '<div class="beforeup">'+
                                        '<iframe src="/edit/upload_img_for_ck?fun=ck_img_callback" id="imgUpload" style="filter:alpha(opacity = 0);-moz-opacity:0;-khtml-opacity:0;opacity:0;position:absolute;top:0;left:0;width:92px;height:30px;"></iframe>'+
                                        '<div class="wjbtn">上传图片</div>'+
                                    '</div>'+
                                '</div>'+
                            '</li>'+
                            '<li style="display: none;" class="upImage_url">'+
                                '<div class="upImage_img_con">'+
                                    '<p>请在输入框里面填上要添加图片的URL</p>'+
                                    '<input type="text" class="nui-ipt-input"><div class="nui-ipt-buttom">添加</div>'+
                                '</div>'+
                            '</li>'+
                        '</ul>'+
                    '</div>';

        var wb = new jsbox({
            onlyid: "UpdataImageTcc",
            title: false,
            conw: conw,
            conh: conh,
            title: "上传图片",
            FixedTop: 190,
            range: true,
            content: html,
            mack: true
        }).show();

        $(".upimg_Tabs .tabs_item").click(function(){
            $(this).siblings().removeClass('selected');
            $(this).addClass('selected');
            var li = $(this).parent().next().find('li');
            var m = $(".upimg_Tabs .tabs_item").index(this);
            li.hide();
            li.eq(m).show();
            if(m==1){li.find(".nui-ipt-input").focus();}
        });

    },
    //创建FCK高级编辑器
    createEditor: function(con, obj) {
        var _this = this;
        //console.log(con);
        if (this.editor)
            return;
        $('#EditTcc .loaddiv').html('<div class="ckedit_div"></div>');
        //初始化FCK
        if(obj.hasClass('T_edit_min')){
            //去掉四个对齐按钮的编辑器
            this.editor = CKEDITOR.appendTo($('#EditTcc .loaddiv .ckedit_div')[0], {
                    toolbar: [
                            //{ name: 'document', groups: [ 'mode', 'document', 'doctools' ], items: [ 'Source'] },
                        {name: 'basicstyles',groups: ['basicstyles', 'cleanup'],items: ['Bold', 'Italic', 'Underline', 'Strike']},
                        {name: 'paragraph',groups: ['list', 'indent', 'blocks', 'align', 'bidi'],items: ['Outdent', 'Indent', '-']},
                        {name: 'links',items: ['Link', 'Unlink']},
                        {name: 'insert',items: ['Image','Flash','Smiley']},
                        {name: 'colors',items: ['TextColor', 'BGColor']},
                        {name: 'styles',items: ['Font', 'FontSize']}

                    ],
                    height: 251 //设置高度
                },con //输入内容
            );
        }else{
            this.editor = CKEDITOR.appendTo($('#EditTcc .loaddiv .ckedit_div')[0], {
                    toolbar: [
                        //{ name: 'document', groups: [ 'mode', 'document', 'doctools' ], items: [ 'Source'] },
                        {name: 'basicstyles',groups: ['basicstyles', 'cleanup'],items: ['Bold', 'Italic', 'Underline', 'Strike']},
                        {name: 'paragraph',groups: ['list', 'indent', 'blocks', 'align', 'bidi'],items: ['Outdent', 'Indent', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']},
                        {name: 'links',items: ['Link', 'Unlink']},
                        {name: 'insert',items: ['Image','Flash','Smiley']},
                        {name: 'colors',items: ['TextColor', 'BGColor']},
                        {name: 'styles',items: ['Font', 'FontSize']}

                    ],
                    height: 251 //设置高度
                },con //输入内容
            );
        }
        // setTimeout(function() {
        //  $('.cke_button__image_icon').click(function(){
        //     _this.UpdataImageTcc();
        //     //_this.editor.insertHtml("<img src='http://bbsimg.meizu.net/block/79/797dbce5d44d295f9ab627bc88b8e79c.jpg'>");
        //  });
        // },1000);

        if (!this.editor)return;
        //点击删除按钮关闭
        $('#EditTcc .jsbox_close').one('mousedown', function() {
            _this.editor.destroy();
            _this.editor = null;
            _this.parentCon.remove();
        });

        //点击遮罩关闭
        setTimeout(function() {

            $('#EditTcc .editTcc_an').one('click', function() {

                _this.html = _this.editor.getData();

                var isText = /^\s+$/.test(_this.editor.getData());
                var isImg = _this.editor.getData().indexOf('<img');
                // console.log(isText);
                if (_this.editor.getData() == "" || isText && isImg == -1) {

                    if (_this.type == 'project' || _this.type == 'end_desc' || _this.type == 'question') {
                        _this.html = _this.addEdit.html();
                        _this.Save_title();
                    } else if (_this.type == 'begin_desc') {
                        _this.Save_title();
                    } else {
                        _this.Del_edit();
                    }
                    _this.editor.destroy();
                    _this.editor = null;

                } else {
                    obj.html(_this.editor.getData());
                    _this.html = _this.editor.getData();
                    // Destroy the editor.
                    _this.editor.destroy();
                    _this.editor = null;

                    _this.Save_title();
                }

                $('#EditTcc,#lightBox').remove();
                //click_cq();
            });

        }, 400);

        //点击遮罩关闭
        //           $('#lightBox').one('click',function(){
        //
        //                _this.html = _this.editor.getData();
        //
        //                var isText = /^\s+$/.test(_this.editor.getData());
        //                var isImg = _this.editor.getData().indexOf('<img');
        //                 // console.log(isText);
        //                if(_this.editor.getData()=="" || isText && isImg==-1){
        //                   _this.Del_edit();
        //                   _this.editor.destroy();
        //                   _this.editor = null;
        //                }else{
        //               obj.html(_this.editor.getData());
        //               _this.html=_this.editor.getData();
        //               // Destroy the editor.
        //               _this.editor.destroy();
        //               _this.editor = null;
        //
        //               _this.Save_title();
        //
        //                }
        //               $('#EditTcc').remove();
        //               $(this).remove();
        //
        //           });

        //editor = CKEDITOR.appendTo($('#EditTcc .loaddiv')[0], config, this.addEdit.html());
    }

}


//题型模板

function TopicBank() {

}

//添加&批量添加选项

function AddOrBatch() {
    return this.events();
    this.module = {};
}
AddOrBatch.prototype = {
    events: function() {
        var _this = this;
        //添加单条行
        $('.operationH .add-icon-active').live('mousedown', function(e) {
            $('.zon_edit').remove();
        });
        $('.operationH .add-icon-active').live('click', function(e) {
            e.stopPropagation();
            _this.module = $(this).parents('.module');
            var oid = _this.module.attr('oid');
            var issue = _this.module.attr('issue');
            var cols_count = 0;
            var disp_type = _this.module.attr('disp_type');
            setTimeout(function(){
                _this.module.find('tr:last td:first').click();
            },300);
            if(disp_type=='column'){cols_count=_this.module.attr('cols_count')}
            _this.addConY(oid,issue,1,cols_count);
        });
        //添加多条行
        $('.Batch_push').live('click', function() {
            var that = $(this);
            that.addClass('btn_disabled');
            var oid = $(this).parents('.poplayer').attr('oid');
            _this.module = $('.module[oid=' + oid + ']');
            var issue = _this.module.attr('issue');
            var cols_count = 0;
            var disp_type = _this.module.attr('disp_type');
            if(disp_type=='column'){cols_count=_this.module.attr('cols_count')}
            //如果是默认选项则取消提交
            if ($('.poplayer[oid=' + oid + '] .bulkadd').is('.def_class')) {
                $('.jsTip_close').click();
                return;
            }

            loadMack({off:'on',Limg:1,text:'加载中...',set:0});
            $.when(deferredFun(_this.addConY, oid, issue, 2, cols_count, _this)).done(function(data){
                that.removeClass('btn_disabled');
            });
            // _this.addConY(oid, issue, 2, cols_count);
        });
        //添加单条列
        $('.operationV .add-icon-active').live('click', function() {
            _this.module = $(this).parents('.module');
            var oid = _this.module.attr('oid');
            var issue = _this.module.attr('issue');
            setTimeout(function(){
                _this.module.find('tr:first td:last').click();
            },300);
            _this.addConX(oid, issue, 1);
        });
        //添加多条列
        $('.Batch_push_v').live('click', function() {
            var that = $(this);
            that.addClass('btn_disabled');
            var oid = $(this).parents('.poplayer').attr('oid');
            _this.module = $('.module[oid=' + oid + ']');
            var issue = _this.module.attr('issue');

            //如果是默认选项则取消提交
            if ($('.poplayer[oid=' + oid + '] .bulkadd').is('.def_class')) {
                $('.jsTip_close').click();
                return;
            }

            loadMack({off:'on',Limg:1,text:'加载中...',set:0});
            $.when(deferredFun(_this.addConX, oid, issue, 2, _this)).done(function(data){
                that.removeClass('btn_disabled');
            });
            // _this.addConX(oid, issue, 2);
        });
    },
    addConX: function(oid, issue, type, thisObj) {
        var _this = thisObj ? thisObj : this;
        var swap = _this.module.attr('is_swap');

        //矩阵单选题列
        if (issue == '4') {

            var m = _this.module.find('.matrix table tr').length;
            var l = _this.module.find('.matrix table tr:eq(0) > td').length;
            if (type == 1) {
                if (swap == "1") {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    _this.module.find('.matrix table tr:eq(0) > td[name="row"]').each(function(index, element) {
                        var optV = $(_this).text();
                        name_deal.originalArr.push(optV);
                    });
                    var mun = name_deal.DealFn();

                    _this.module.find('.operationV a').hide();
                    var id = create_matrixrow(oid, ['矩阵行' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[0] + '" name="row" menutype="col" class="T_edit_td">矩阵行' + mun + '</td>');
                    _this.module.find('.operationV a').show();


                } else {


                    //创建选项序列号
                    var name_deal = new Name_deal();
                    _this.module.find('.matrix table tr:eq(0) > td[name="option"]').each(function(index, element) {
                        var optV = $(_this).text();
                        name_deal.originalArr.push(optV);
                    });
                    var mun = name_deal.DealFn();

                    _this.module.find('.operationV a').hide();
                    var id = create_option(oid, ['选项' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[0] + '" name="option" menutype="col" class="T_edit_td">选项' + mun + '</td>');
                    _this.module.find('.operationV a').show();
                }

                for (var ii = 0; ii < m; ii++) {
                    _this.module.find('.matrix table tr:eq(' + (ii + 1) + ')').append('<td><input type="radio" name="radio" id="radio" value="radio" /></td>');
                }

                //Width_mate(_this.module.attr('oid'));

                //宽度处理
                var TableW = _this.module.find('.matrix .table').width();
                _this.module.find('.matrix .table').width(TableW+90);
                _this.module.find('.matrix').scrollLeft(TableW);

            } else {

                var date = $('.poplayer[oid=' + oid + '] .bulkadd').val();
                if (date == "") {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '请输入选项名称',
                        set: 2000
                    });
                    return;
                }
                var zf = date.split('\n');
                if (zf.length > 100) {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '每次最多只能添加100条选项',
                        set: 2000
                    });
                    return;
                }

                //选项名称过滤处理
                var name_deal = new Name_deal();
                _this.module.find('.matrix table tr:eq(0) > td[name="option"]').each(function(index, element) {
                    var optV = $(_this).text();
                    name_deal.originalArr.push(optV);
                });
                zf = name_deal.BatchFn(zf);

                if (zf.length == 0) {
                    $('.jsTip_close').click();
                    return;
                }


                //后台保存数据
                var aiz = [];
                for (var ai = 0; ai < zf.length; ai++) {
                    if (zf[ai] == "") {
                        continue;
                    }
                    aiz.push(zf[ai]);
                }

                //if(swap=="1"){
                //                  var id = create_matrixrow(oid,aiz,true);
                //               }else{
                //                  var id = create_option(oid,aiz,true);
                //               }

                if (swap == "1") {
                    var id = create_matrixrow(oid, aiz, true);
					if(id.length == 0){return};
                } else {
                    var id = create_option(oid, aiz, true);
					if(id.length == 0){return};
                }

                //生成数据并添
                for (var i = 0; i < zf.length; i++) {
                    if (zf[i] == "") {
                        continue;
                    }


                    if (swap == "1") {
                        _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[i] + '" name="row" menutype="col" class="T_edit_td">' + zf[i] + '</td>');
                    } else {
                        _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[i] + '" name="option" menutype="col" class="T_edit_td">' + zf[i] + '</td>');
                    }

                    for (var ii = 0; ii < m; ii++) {
                        _this.module.find('.matrix table tr:eq(' + (ii + 1) + ')').append('<td><input type="radio" name="radio" id="radio" value="radio" /></td>');
                        //宽度处理
                        var TableW = _this.module.find('.matrix .table').width();
                        _this.module.find('.matrix .table').width(TableW+90);
                        _this.module.find('.matrix').scrollLeft(TableW);
                    }
                    //con +='<tr><td align="right"><div class="T_edit_min grade_text" >'+zf[i]+'</div></td><td><div style="width:500px;"><input type="text" name="textfield" id="textfield"/></div></td></tr>';
                }
                //_this.module.find('.matrix table').append(con);
                $('.jsTip_close').click();
                $('.loadCon,.loadMack').remove();

                _this.module.find('.matrix').scrollLeft(TableW);

                //Width_mate(_this.module.attr('oid'));
            }
        }
        //矩阵多选题列
        if (issue == '5') {

            var m = _this.module.find('.matrix table tr').length;
            var l = _this.module.find('.matrix table tr:eq(0) > td').length;
            if (type == 1) {

                if (swap == "1") {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    _this.module.find('.matrix table tr:eq(0) > td[name="row"]').each(function(index, element) {
                        var optV = $(_this).text();
                        name_deal.originalArr.push(optV);
                    });
                    var mun = name_deal.DealFn();


                    var id = create_matrixrow(oid, ['矩阵行' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[0] + '" name="row" menutype="col" class="T_edit_td">矩阵行' + mun + '</td>');
                } else {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    _this.module.find('.matrix table tr:eq(0) > td[name="option"]').each(function(index, element) {
                        var optV = $(_this).text();
                        name_deal.originalArr.push(optV);
                    });
                    var mun = name_deal.DealFn();


                    var id = create_option(oid, ['选项' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[0] + '" name="option" menutype="col" class="T_edit_td">选项' + mun + '</td>');
                }

                for (var ii = 0; ii < m; ii++) {
                    _this.module.find('.matrix table tr:eq(' + (ii + 1) + ')').append('<td><input type="checkbox" name="checkbox"/></td>');
                }

                //Width_mate(_this.module.attr('oid'));

                //宽度处理
                var TableW = _this.module.find('.matrix .table').width();
                _this.module.find('.matrix .table').width(TableW+90);
                _this.module.find('.matrix').scrollLeft(TableW);

            } else {

                var date = $('.poplayer[oid=' + oid + '] .bulkadd').val();
                if (date == "") {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '请输入选项名称',
                        set: 2000
                    });
                    return;
                }
                var zf = date.split('\n');
                if (zf.length > 100) {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '每次最多只能添加100条选项',
                        set: 2000
                    });
                    return;
                }

                //选项名称过滤处理
                var name_deal = new Name_deal();
                _this.module.find('.matrix table tr:eq(0) > td[name="option"]').each(function(index, element) {
                    var optV = $(_this).text();
                    name_deal.originalArr.push(optV);
                });
                zf = name_deal.BatchFn(zf);

                if (zf.length == 0) {
                    $('.jsTip_close').click();
                    return;
                }


                //后台保存数据
                var aiz = [];
                for (var ai = 0; ai < zf.length; ai++) {
                    if (zf[ai] == "") {
                        continue;
                    }
                    aiz.push(zf[ai]);
                }

                //if(swap=="1"){
                //                  var id = create_matrixrow(oid,aiz,true);
                //               }else{
                //                  var id = create_option(oid,aiz,true);
                //               }

                if (swap == "1") {
                    var id = create_matrixrow(oid, aiz, true);
					if(id.length == 0){return};
                } else {
                    var id = create_option(oid, aiz, true);
					if(id.length == 0){return};
                }

                //生成数据并
                for (var i = 0; i < zf.length; i++) {
                    if (zf[i] == "") {
                        continue;
                    }


                    if (swap == "1") {
                        _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[i] + '" name="row" menutype="col" class="T_edit_td">' + zf[i] + '</td>');
                    } else {
                        _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[i] + '" name="option" menutype="col" class="T_edit_td">' + zf[i] + '</td>');
                    }

                    for (var ii = 0; ii < m; ii++) {
                        _this.module.find('.matrix table tr:eq(' + (ii + 1) + ')').append('<td><input type="checkbox" name="checkbox"/></td>');
                        //宽度处理
                        var TableW = _this.module.find('.matrix .table').width();
                        _this.module.find('.matrix .table').width(TableW+90);
                        _this.module.find('.matrix').scrollLeft(TableW);
                    }
                    //con +='<tr><td align="right"><div class="T_edit_min grade_text" >'+zf[i]+'</div></td><td><div style="width:500px;"><input type="text" name="textfield" id="textfield"/></div></td></tr>';
                }
                //_this.module.find('.matrix table').append(con);
                $('.jsTip_close').click();
                $('.loadCon,.loadMack').remove();

                _this.module.find('.matrix').scrollLeft(TableW);

                //Width_mate(_this.module.attr('oid'));
            }
        }
        //矩阵填空题列
        if (issue == '100') {

            var m = _this.module.find('.matrix table tr').length;
            var l = _this.module.find('.matrix table tr:eq(0) > td').length;
            if (type == 1) {
                if (swap == "1") {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    _this.module.find('.matrix table tr:eq(0) > td[name="row"]').each(function(index, element) {
                        var optV = $(_this).text();
                        name_deal.originalArr.push(optV);
                    });
                    var mun = name_deal.DealFn();

                    var id = create_matrixrow(oid, ['矩阵行' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[0] + '" name="row" menutype="col" class="T_edit_td">矩阵行' + mun + '</td>');
                } else {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    _this.module.find('.matrix table tr:eq(0) > td[name="option"]').each(function(index, element) {
                        var optV = $(_this).text();
                        name_deal.originalArr.push(optV);
                    });
                    var mun = name_deal.DealFn();

                    var id = create_option(oid, ['请填空' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[0] + '" name="option" menutype="col" class="T_edit_td">请填空' + mun + '</td>');
                }

                for (var ii = 0; ii < m; ii++) {
                    _this.module.find('.matrix table tr:eq(' + (ii + 1) + ')').append('<td><textarea cols="20" rows="1"></textarea></td>');
                }

                //宽度处理
                var TableW = _this.module.find('.matrix .table').width();
                _this.module.find('.matrix .table').width(TableW+90);
                _this.module.find('.matrix').scrollLeft(TableW);

            } else {

                var date = $('.poplayer[oid=' + oid + '] .bulkadd').val();
                if (date == "") {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '请输入选项名称',
                        set: 2000
                    });
                    return;
                }
                var zf = date.split('\n');
                if (zf.length > 100) {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '每次最多只能添加100条选项',
                        set: 2000
                    });
                    return;
                }


                //选项名称过滤处理
                var name_deal = new Name_deal();
                _this.module.find('.matrix table tr:eq(0) > td[name="option"]').each(function(index, element) {
                    var optV = $(_this).text();
                    name_deal.originalArr.push(optV);
                });
                zf = name_deal.BatchFn(zf);

                if (zf.length == 0) {
                    $('.jsTip_close').click();
                    return;
                }


                //后台保存数据
                var aiz = [];
                for (var ai = 0; ai < zf.length; ai++) {
                    if (zf[ai] == "") {
                        continue;
                    }
                    aiz.push(zf[ai]);
                }


                if (swap == "1") {
                    var id = create_matrixrow(oid, aiz, true);
					if(id.length == 0){return};
                } else {
                    var id = create_option(oid, aiz, true);
					if(id.length == 0){return};
                }

                //生成数据并
                for (var i = 0; i < zf.length; i++) {
                    if (zf[i] == "") {
                        continue;
                    }

                    if (swap == "1") {
                        _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[i] + '" name="row" menutype="col" class="T_edit_td">' + zf[i] + '</td>');
                    } else {
                        _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[i] + '" name="option" menutype="col" class="T_edit_td">' + zf[i] + '</td>');
                    }


                    for (var ii = 0; ii < m; ii++) {
                        _this.module.find('.matrix table tr:eq(' + (ii + 1) + ')').append('<td><textarea cols="20" rows="1"></textarea></td>');
                        //宽度处理
                        var TableW = _this.module.find('.matrix .table').width();
                        _this.module.find('.matrix .table').width(TableW+90);
                    }
                    //con +='<tr><td align="right"><div class="T_edit_min grade_text" >'+zf[i]+'</div></td><td><div style="width:500px;"><input type="text" name="textfield" id="textfield"/></div></td></tr>';
                }
                //_this.module.find('.matrix table').append(con);
                $('.jsTip_close').click();
                $('.loadCon,.loadMack').remove();

                _this.module.find('.matrix').scrollLeft(TableW);
            }
        }
        //矩阵打分题列
        if (issue == '7') {

            var m = _this.module.find('.matrix table tr').length;
            var l = _this.module.find('.matrix table tr:eq(0) > td').length;

            var max_num = _this.module.attr('maxnum') * 1;
            var answer = '';
            var dfW_width = max_num * 29;
            if (type == 1) {
                if (swap == "1") {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    _this.module.find('.matrix table tr:eq(0) > td[name="row"]').each(function(index, element) {
                        var optV = $(_this).text();
                        name_deal.originalArr.push(optV);
                    });
                    var mun = name_deal.DealFn();

                    var id = create_matrixrow(oid, ['矩阵行' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[0] + '" name="row" menutype="col" class="T_edit_td">矩阵行' + mun + '</td>');
                } else {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    _this.module.find('.matrix table tr:eq(0) > td[name="option"]').each(function(index, element) {
                        var optV = $(_this).text();
                        name_deal.originalArr.push(optV);
                    });
                    var mun = name_deal.DealFn();

                    var id = create_option(oid, ['请打分' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[0] + '" name="option" menutype="col" class="T_edit_td">请打分' + mun + '</td>');
                }


                for (var ms = 0; ms < max_num; ms++) {
                    answer += '<a href="javascript:;"><i class="basic-too14-icon-active"></i></a>';
                }

                for (var ii = 0; ii < m; ii++) {
                    _this.module.find('.matrix table tr:eq(' + (ii + 1) + ')').append('<td><div class="dfW" style="width:'+dfW_width+'px">' + answer + '</div></td>');
                }

                //宽度处理
                var TableW = _this.module.find('.matrix .table').width();
                _this.module.find('.matrix .table').width(TableW+90);
                _this.module.find('.matrix').scrollLeft(TableW);

            } else {

                var date = $('.poplayer[oid=' + oid + '] .bulkadd').val();
                if (date == "") {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '请输入选项名称',
                        set: 2000
                    });
                    return;
                }
                var zf = date.split('\n');
                if (zf.length > 100) {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '每次最多只能添加100条选项',
                        set: 2000
                    });
                    return;
                }


                //选项名称过滤处理
                var name_deal = new Name_deal();
                _this.module.find('.matrix table tr:eq(0) > td[name="option"]').each(function(index, element) {
                    var optV = $(_this).text();
                    name_deal.originalArr.push(optV);
                });
                zf = name_deal.BatchFn(zf);

                if (zf.length == 0) {
                    $('.jsTip_close').click();
                    return;
                }


                //后台保存数据
                var aiz = [];
                for (var ai = 0; ai < zf.length; ai++) {
                    if (zf[ai] == "") {
                        continue;
                    }
                    aiz.push(zf[ai]);
                }


                if (swap == "1") {
                    var id = create_matrixrow(oid, aiz, true);
					if(id.length == 0){return};
                } else {
                    var id = create_option(oid, aiz, true);
					if(id.length == 0){return};
                }

                for (var ms = 0; ms < max_num; ms++) {
                    answer += '<a href="javascript:;"><i class="basic-too14-icon-active"></i></a>';
                }

                //生成数据
                for (var i = 0; i < zf.length; i++) {
                    if (zf[i] == "") {
                        continue;
                    }

                    if (swap == "1") {
                        _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[i] + '" name="row" menutype="col" class="T_edit_td">' + zf[i] + '</td>');
                    } else {
                        _this.module.find('.matrix table tr:eq(0)').append('<td id="' + id[i] + '" name="option" menutype="col" class="T_edit_td">' + zf[i] + '</td>');
                    }


                    for (var ii = 0; ii < m; ii++) {
                        _this.module.find('.matrix table tr:eq(' + (ii + 1) + ')').append('<td><div class="dfW" style="width:'+dfW_width+'px">' + answer + '</div></td>');
                        //宽度处理
                        var TableW = _this.module.find('.matrix .table').width();
                        _this.module.find('.matrix .table').width(TableW+90);
                    }
                    //con +='<tr><td align="right"><div class="T_edit_min grade_text" >'+zf[i]+'</div></td><td><div style="width:500px;"><input type="text" name="textfield" id="textfield"/></div></td></tr>';
                }
                //_this.module.find('.matrix table').append(con);
                $('.jsTip_close').click();
                $('.loadCon,.loadMack').remove();

                _this.module.find('.matrix').scrollLeft(TableW);
            }
        }
    },
    addConY: function(oid, issue, type ,cols_count, thisObj) {
        var _this = thisObj ? thisObj : this;
        var con = '';
        var swap = _this.module.attr('is_swap');
        var cols_width = 100/cols_count+"%";
        //单选题
        if (issue == '2') {

            var m = _this.module.find('.unstyled li').length;

            if (type == 1) {

                //创建选项序列号
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.unstyled li', "label[name='option']");
                var mun = name_deal.DealFn();

                var id = create_option(oid, ['选项' + mun], false);
				if(id.length == 0){return};
                con = '<li style="width:'+cols_width+';"><input name="radio" type="radio"><label id=' + id[0] + ' name="option" class="T_edit_min">选项' + mun + '</label></li>';
                _this.module.find('.unstyled').append(con);

                $('#' + id[0]).click(); //触发创建文本编辑框

            } else {


                var date = $('.poplayer[oid=' + oid + '] .bulkadd').val();
                if (date == "") {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '请输入选项名称',
                        set: 2000
                    });
                    return;
                }
                var zf = date.split('\n');
                if (zf.length > 100) {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '每次最多只能添加100条选项',
                        set: 2000
                    });
                    return;
                }

                //选项名称过滤处理
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.unstyled li', "label[name='option']");
                zf = name_deal.BatchFn(zf);

                if (zf.length == 0) {
                    $('.jsTip_close').click();
                    return;
                }


                //后台保存数据
                var aiz = [];
                for (var ai = 0; ai < zf.length; ai++) {
                    if (zf[ai] == "") {
                        continue;
                    }
                    aiz.push(zf[ai]);
                }
                var id = create_option(oid, aiz, true);
				if(id.length == 0){return};

                //生成数据并添加
                for (var i = 0; i < aiz.length; i++) {
                    con += '<li style="width:'+cols_width+';"><input name="radio" type="radio"><label id=' + id[i] + ' name="option" class="T_edit_min">' + aiz[i] + '</label></li>';
                }
                _this.module.find('.unstyled').append(con);

                $('.jsTip_close').click();
                $('.loadCon,.loadMack').remove();
            }
        } else
        //多选题
        if (issue == '3') {
            var cols_width = 100/cols_count+"%";
            var m = _this.module.find('.unstyled li').length;
            if (type == 1) {

                //创建选项序列号
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.unstyled li', "label[name='option']");
                var mun = name_deal.DealFn();

                var id = create_option(oid, ['选项' + mun], false);
				if(id.length == 0){return};
                con = '<li style="width:'+cols_width+';"><input type="checkbox"><label id=' + id[0] + ' name="option" class="T_edit_min">选项' + mun + '</label></li>';
                _this.module.find('.unstyled').append(con);

                $('#' + id[0]).click(); //触发创建文本编辑框

            } else {
                var date = $('.poplayer[oid=' + oid + '] .bulkadd').val();
                if (date == "") {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '请输入选项名称',
                        set: 2000
                    });
                    return;
                }
                var zf = date.split('\n');
                if (zf.length > 100) {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '每次最多只能添加100条选项',
                        set: 2000
                    });
                    return;
                }


                //选项名称过滤处理
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.unstyled li', "label[name='option']");
                zf = name_deal.BatchFn(zf);

                if (zf.length == 0) {
                    $('.jsTip_close').click();
                    return;
                }


                //后台保存数据
                var aiz = [];
                for (var ai = 0; ai < zf.length; ai++) {
                    if (zf[ai] == "") {
                        continue;
                    }
                    aiz.push(zf[ai]);
                }
                var id = create_option(oid, aiz, true);
				if(id.length == 0){return};
                //生成数据并添加
                for (var i = 0; i < zf.length; i++) {
                    if (zf[i] == "") {
                        continue;
                    }
                    con += '<li style="width:'+cols_width+';"><input type="checkbox"><label id=' + id[i] + ' name="option" class="T_edit_min">' + zf[i] + '</label></li>';
                }
                _this.module.find('.unstyled').append(con);

                $('.jsTip_close').click();
                $('.loadCon,.loadMack').remove();
            }
        } else
        //打分题
        if (issue == '50') {
            var m = _this.module.find('.grade > table > tbody > .Ed_tr').length;
            var min_num = parseInt(_this.module.attr('minnum'));
            var max_num = _this.module.attr('maxnum') * 1;
            var score_display = _this.module.attr('score_display');
            var answer = '';
            var op_class = ''; //滑块样式
            var op_width = ''; //滑块样式
            if (type == 1) {

                //创建选项序列号
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.grade > table > tbody > .Ed_tr', "td[name='option']");
                var mun = name_deal.DealFn();

                var id = create_option(oid, ['选项' + mun], false);
				if(id.length == 0){return};
                if (score_display == "op_slider"){
                    answer += '<td class="div_float score_slider_box"><div class="score_slider">';
                    for (var ms = min_num; ms < max_num + 1; ms++) {
                        if (ms == min_num){
                            op_class = " s_tag_first s_tag_m";
                            op_width = 50/(max_num - min_num) + "%";
                        }else if(ms == max_num){
                            op_class = " s_tag_last s_tag_m";
                            op_width = 50/(max_num - min_num) + "%";
                        }else{
                            op_class = " s_tag_c";
                            op_width = 100/(max_num - min_num) + "%";
                        }
                        answer += '<div class="s_tag' + op_class + '" style="width: ' + op_width + '"><span class="tag_i"></span></div>';
                    }
                    answer += '<a class="score_slider_bt slider_def slider_def_gray" href="javascript:;"></a></div></td>';
                }else{
                    for (var ms = min_num; ms < max_num + 1; ms++) {
                        answer += '<td class="div_float"><i class="score_i '+score_display+'"></td>';
                    }
                }
                con = '<tr class="Ed_tr"><td id="' + id[0] + '" name="option" align="right" class="T_edit_td">选项' + mun + '</td><td><table style="width:462px;"><tbody><tr><td><div class="grade_text grade_text_v2"><table cellspacing="0" cellpadding="1" border="0" class="topic_ul"><tbody><tr>' + answer + '</tr></tbody></table></div></td><td width="30" align="right"></td></tr></tbody></table></td></tr>';

                _this.module.find('.grade > table > tbody').append(con);

                setTimeout(function(){ $('#' + id[0]).click();},300);

            } else {
                var date = $('.poplayer[oid=' + oid + '] .bulkadd').val();
                if (date == "") {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '请输入选项名称',
                        set: 2000
                    });
                    return;
                }
                var zf = date.split('\n');
                if (zf.length > 100) {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '每次最多只能添加100条选项',
                        set: 2000
                    });
                    return;
                }


                //选项名称过滤处理
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.grade > table > tbody > .Ed_tr', "td[name='option']");
                zf = name_deal.BatchFn(zf);

                if (zf.length == 0) {
                    $('.jsTip_close').click();
                    return;
                }


                //后台保存数据
                var aiz = [];
                for (var ai = 0; ai < zf.length; ai++) {
                    if (zf[ai] == "") {
                        continue;
                    }
                    aiz.push(zf[ai]);
                }
                var id = create_option(oid, aiz, true);
				if(id.length == 0){return};

                //生成数据并添加
                if (score_display == "op_slider"){
                    answer += '<td class="div_float score_slider_box"><div class="score_slider">';
                    for (var ms = min_num; ms < max_num + 1; ms++) {
                        if (ms == min_num){
                            op_class = " s_tag_first s_tag_m";
                            op_width = 50/(max_num - min_num) + "%";
                        }else if(ms == max_num){
                            op_class = " s_tag_last s_tag_m";
                            op_width = 50/(max_num - min_num) + "%";
                        }else{
                            op_class = " s_tag_c";
                            op_width = 100/(max_num - min_num) + "%";
                        }
                        answer += '<div class="s_tag' + op_class + '" style="width: ' + op_width + '"><span class="tag_i"></span></div>';
                    }
                    answer += '<a class="score_slider_bt slider_def slider_def_gray" href="javascript:;"></a></div></td>';
                }else{
                    for (var ms = min_num; ms < max_num + 1; ms++) {
                        answer += '<td class="div_float"><i class="score_i '+score_display+'"></td>';
                    }
                }
                for (var i = 0; i < zf.length; i++) {
                    if (zf[i] == "") {
                        continue;
                    }

                    con += '<tr class="Ed_tr"><td id="' + id[i] + '" name="option" align="right" class="T_edit_td">' + zf[i] + '</td><td><table style="width:462px;"><tbody><tr><td><div class="grade_text grade_text_v2"><table cellspacing="0" cellpadding="1" border="0" class="topic_ul"><tbody><tr>' + answer + '</tr></tbody></table></div></td><td width="30" align="right"></td></tr></tbody></table></td></tr>';
                }
                _this.module.find('.grade > table > tbody').append(con);
                $('.jsTip_close').click();
                $('.loadCon,.loadMack').remove();
            }
        } else
        //排序题
        if (issue == '60') {
            var conR = "";
            var m = _this.module.find('.unstyled li').length;
            var limit = _this.module.attr('limit');
            if (type == 1) {

                //创建选项序列号
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.unstyled li', "label[name='option']");
                var mun = name_deal.DealFn();

                var id = create_option(oid, ['选项' + mun], false);
				if(id.length == 0){return};
                con = '<li><label id="' + id[0] + '" name="option" class="T_edit_min">选项' + mun + '</label></li>';
                _this.module.find('.unstyled').append(con);
                conR = '<tr><th class="w28">' + (m + 1) + '</th><td>&nbsp;</td></tr>';

                if(limit==undefined){
                   _this.module.find('.sort-right .table2').append(conR);
                }
                setTimeout(function(){$('#'+id+'').click();},300);

            } else {
                var date = $('.poplayer[oid=' + oid + '] .bulkadd').val();
                if (date == "") {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '请输入选项名称',
                        set: 2000
                    });
                    return;
                }
                var zf = date.split('\n');
                if (zf.length > 100) {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '每次最多只能添加100条选项',
                        set: 2000
                    });
                    return;
                }


                //选项名称过滤处理
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.unstyled li', "label[name='option']");
                zf = name_deal.BatchFn(zf);

                if (zf.length == 0) {
                    $('.jsTip_close').click();
                    return;
                }


                //后台保存数据
                var aiz = [];
                for (var ai = 0; ai < zf.length; ai++) {
                    if (zf[ai] == "") {
                        continue;
                    }
                    aiz.push(zf[ai]);
                }
                var id = create_option(oid, aiz, true);
				if(id.length == 0){return};

                //生成数据并添
                for (var i = 0; i < zf.length; i++) {
                    if (zf[i] == "") {
                        continue;
                    }
                    con += '<li><label id="' + id[i] + '" name="option" class="T_edit_min">' + zf[i] + '</label></li>';
                }
                _this.module.find('.unstyled').append(con);

                _this.module.find('.unstyled li').each(function(index, element) {
                    conR += '<tr><th class="w28">' + (index + 1) + '</th><td>&nbsp;</td></tr>';
                });

                if(limit==undefined){
                  _this.module.find('.sort-right .table2').html(conR);
                }

                $('.jsTip_close').click();
                $('.loadCon,.loadMack').remove();
            }
        } else
        //多项填空题
        if (issue == '95') {

            var m = _this.module.find('.grade table .Ed_tr').length;
            if (type == 1) {

                //创建选项序列号
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.grade table .Ed_tr', "td[name='option']");
                var mun = name_deal.DealFn();

                var id = create_option(oid, ['选项' + mun], false);
				if(id.length == 0){return};
                con = '<tr class="Ed_tr"><td align="right" class="T_edit_td" name="option" id="' + id[0] + '">选项' + mun + '</td><td><div class="grade_text" style="width:500px;"><textarea cols="30" rows="1"></textarea></div></td></tr>';
                _this.module.find('.grade table').append(con);

                $('#' + id[0]).click(); //触发创建文本编辑框

            } else {
                var date = $('.poplayer[oid=' + oid + '] .bulkadd').val();
                if (date == "") {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '请输入选项名称',
                        set: 2000
                    });
                    return;
                }
                var zf = date.split('\n');
                if (zf.length > 100) {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '每次最多只能添加100条选项',
                        set: 2000
                    });
                    return;
                }


                //选项名称过滤处理
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.grade table .Ed_tr', "td[name='option']");
                zf = name_deal.BatchFn(zf);

                if (zf.length == 0) {
                    $('.jsTip_close').click();
                    return;
                }


                //选项名称过滤处理
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.unstyled li', "label[name='option']");
                zf = name_deal.BatchFn(zf);

                if (zf.length == 0) {
                    $('.jsTip_close').click();
                    return;
                }


                //后台保存数据
                var aiz = [];
                for (var ai = 0; ai < zf.length; ai++) {
                    if (zf[ai] == "") {
                        continue;
                    }
                    aiz.push(zf[ai]);
                }
                var id = create_option(oid, aiz, true);
				if(id.length == 0){return};

                //生成数据并添
                for (var i = 0; i < zf.length; i++) {
                    if (zf[i] == "") {
                        continue;
                    }
                    con += '<tr class="Ed_tr"><td id="' + id[i] + '" align="right" name="option" class="T_edit_td">' + zf[i] + '</td><td><div class="grade_text" style="width:500px;"><textarea cols="30" rows="1"></textarea></div></td></tr>';
                }
                _this.module.find('.grade table').append(con);
                $('.jsTip_close').click();
                $('.loadCon,.loadMack').remove();
            }
        }
        //矩阵单选题行
        if (issue == '4') {
            var conY = '';
            var m = _this.module.find('.matrix table .Ed_tr').length + 1;
            var l = _this.module.find('.matrix table tr:eq(0) > td').length - 1;
            if (type == 1) {
                for (var ii = 0; ii < l; ii++) {
                    var is_open = _this.module.find('.matrix table tr:eq(0) > td:eq(' + (ii + 1) + ')').attr('is_open');
                    if (is_open == '1') {
                        con += '<td><input type="radio" name="radio" id="radio" value="radio" /><input class="open_input" type="text" name="radio"/></td>';
                    } else {
                        con += '<td><input type="radio" name="radio" id="radio" value="radio" /></td>';
                    }
                }

                if (swap == "1") {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    name_deal.ErdogicFn(_this.module, '.matrix table .Ed_tr', "td[name='option']");
                    var mun = name_deal.DealFn();

                    var id = create_option(oid, ['选项' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table').append('<tr class="Ed_tr"><td id="' + id[0] + '" name="option" menutype="row" class="T_edit_td" style="text-align:left;">选项' + mun + '</td>' + con + '</tr>');


                } else {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    name_deal.ErdogicFn(_this.module, '.matrix table .Ed_tr', "td[name='row']");
                    var mun = name_deal.DealFn();

                    var id = create_matrixrow(oid, ['矩阵行' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table').append('<tr class="Ed_tr"><td id="' + id[0] + '" name="row" menutype="row" class="T_edit_td" style="text-align:left;">矩阵行' + mun + '</td>' + con + '</tr>');

                }

                var question = get_question(oid);
                try{
                    matrixWidthProcess(oid, question.custom_attr.col_width.parseJSON());
                }catch(e){}

                _this.module.find('.matrix').scrollLeft(0);

                $('#' + id[0]).click(); //触发创建文本编辑框


            } else {
                var conY = "";
                var date = $('.poplayer[oid=' + oid + '] .bulkadd').val();
                if (date == "") {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '请输入选项名称',
                        set: 2000
                    });
                    return;
                }
                var zf = date.split('\n');
                if (zf.length > 100) {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '每次最多只能添加100条选项',
                        set: 2000
                    });
                    return;
                }


                //选项名称过滤处理
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.matrix table .Ed_tr', "td[name='row']");
                zf = name_deal.BatchFn(zf);

                if (zf.length == 0) {
                    $('.jsTip_close').click();
                    return;
                }


                //后台保存数据
                var aiz = [];
                for (var ai = 0; ai < zf.length; ai++) {
                    if (zf[ai] == "") {
                        continue;
                    }
                    aiz.push(zf[ai]);
                }
                if (swap == "1") {
                    var id = create_option(oid, aiz, true);
					if(id.length == 0){return};
                } else {
                    var id = create_matrixrow(oid, aiz, true);
					if(id.length == 0){return};
                }


                //生成数据并添
                for (var ii = 0; ii < l; ii++) {
                    var is_open = _this.module.find('.matrix table tr:eq(0) > td:eq(' + (ii + 1) + ')').attr('is_open');
                    if (is_open == '1') {
                        con += '<td><input type="radio" name="radio"/><input class="open_input" type="text"/></td>';
                    } else {
                        con += '<td><input type="radio" name="radio"/></td>';
                    }
                }
                for (var i = 0; i < zf.length; i++) {
                    if (zf[i] == "") {
                        continue;
                    }
                    conY += '<tr class="Ed_tr"><td id="' + id[i] + '" name="row" menutype="row" class="T_edit_td" style="text-align:left;">' + zf[i] + '</td>' + con + '</tr>';
                }
                _this.module.find('.matrix table').append(conY);
                $('.jsTip_close').click();
                $('.loadCon,.loadMack').remove();

                var question = get_question(oid);
                try{
                    matrixWidthProcess(oid, question.custom_attr.col_width.parseJSON());
                }catch(e){}
            }
        }
        //矩阵多选题行
        if (issue == '5') {
            var conY = '';
            var m = _this.module.find('.matrix table .Ed_tr').length + 1;
            var l = _this.module.find('.matrix table tr:eq(0) > td').length - 1;
            if (type == 1) {
                for (var ii = 0; ii < l; ii++) {
                    var is_open = _this.module.find('.matrix table tr:eq(0) > td:eq(' + (ii + 1) + ')').attr('is_open');
                    if (is_open == '1') {
                        con += '<td><input type="checkbox" name="checkbox"/><input class="open_input" type="text"/></td>';
                    } else {
                        con += '<td><input type="checkbox" name="checkbox"/></td>';
                    }
                }
                if (swap == "1") {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    name_deal.ErdogicFn(_this.module, '.matrix table .Ed_tr', "td[name='option']");
                    var mun = name_deal.DealFn();

                    var id = create_option(oid, ['选项' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table').append('<tr class="Ed_tr"><td id="' + id[0] + '" name="option" menutype="row" class="T_edit_td" style="text-align:left;">选项' + mun + '</td>' + con + '</tr>');

                } else {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    name_deal.ErdogicFn(_this.module, '.matrix table .Ed_tr', "td[name='row']");
                    var mun = name_deal.DealFn();

                    var id = create_matrixrow(oid, ['矩阵行' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table').append('<tr class="Ed_tr"><td id="' + id[0] + '" name="row" menutype="row" class="T_edit_td" style="text-align:left;">矩阵行' + mun + '</td>' + con + '</tr>');

                }

                var question = get_question(oid);
                try{
                    matrixWidthProcess(oid, question.custom_attr.col_width.parseJSON());
                }catch(e){}

                _this.module.find('.matrix').scrollLeft(0);

                $('#' + id[0]).click(); //触发创建文本编辑框


            } else {
                var conY = "";
                var date = $('.poplayer[oid=' + oid + '] .bulkadd').val();
                if (date == "") {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '请输入选项名称',
                        set: 2000
                    });
                    return;
                }
                var zf = date.split('\n');
                if (zf.length > 100) {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '每次最多只能添加100条选项',
                        set: 2000
                    });
                    return;
                }


                //选项名称过滤处理
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.matrix table .Ed_tr', "td[name='row']");
                zf = name_deal.BatchFn(zf);

                if (zf.length == 0) {
                    $('.jsTip_close').click();
                    return;
                }


                //后台保存数据
                var aiz = [];
                for (var ai = 0; ai < zf.length; ai++) {
                    if (zf[ai] == "") {
                        continue;
                    }
                    aiz.push(zf[ai]);
                }
                if (swap == "1") {
                    var id = create_option(oid, aiz, true);
					if(id.length == 0){return};
                } else {
                    var id = create_matrixrow(oid, aiz, true);
					if(id.length == 0){return};
                }

                //生成数据并添
                for (var ii = 0; ii < l; ii++) {
                    var is_open = _this.module.find('.matrix table tr:eq(0) > td:eq(' + (ii + 1) + ')').attr('is_open');
                    if (is_open == '1') {
                        con += '<td><input type="checkbox" name="checkbox"/><input class="open_input" type="text"/></td>';
                    } else {
                        con += '<td><input type="checkbox" name="checkbox"/></td>';
                    }
                }
                for (var i = 0; i < zf.length; i++) {
                    if (zf[i] == "") {
                        continue;
                    }
                    conY += '<tr class="Ed_tr"><td id="' + id[i] + '" name="row" menutype="row" class="T_edit_td" style="text-align:left;">' + zf[i] + '</td>' + con + '</tr>';
                }
                _this.module.find('.matrix table').append(conY);
                $('.jsTip_close').click();
                $('.loadCon,.loadMack').remove();

                var question = get_question(oid);
                try{
                    matrixWidthProcess(oid, question.custom_attr.col_width.parseJSON());
                }catch(e){}

                _this.module.find('.matrix').scrollLeft(0);

                $('#' + id[0]).click(); //触发创建文本编辑框
            }
        }
        //矩阵填空题行
        if (issue == '100') {
            var conY = '';
            var m = _this.module.find('.matrix table .Ed_tr').length + 1;
            var l = _this.module.find('.matrix table tr:eq(0) > td').length - 1;
            if (type == 1) {
                for (var ii = 0; ii < l; ii++) {
                    con += '<td><textarea cols="20" rows="1"></textarea></td>';
                }
                if (swap == "1") {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    name_deal.ErdogicFn(_this.module, '.matrix table .Ed_tr', "td[name='option']");
                    var mun = name_deal.DealFn();

                    var id = create_option(oid, ['选项' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table').append('<tr class="Ed_tr"><td id="' + id[0] + '" name="option" menutype="row" class="T_edit_td" style="text-align:left;">选项' + mun + '</td>' + con + '</tr>');

                } else {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    name_deal.ErdogicFn(_this.module, '.matrix table .Ed_tr', "td[name='row']");
                    var mun = name_deal.DealFn();

                    var id = create_matrixrow(oid, ['矩阵行' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table').append('<tr class="Ed_tr"><td id="' + id[0] + '" name="row" menutype="row" class="T_edit_td" style="text-align:left;">矩阵行' + mun + '</td>' + con + '</tr>');

                }

                var question = get_question(oid);
                try{
                    matrixWidthProcess(oid, question.custom_attr.col_width.parseJSON());
                }catch(e){}

                _this.module.find('.matrix').scrollLeft(0);

                $('#' + id[0]).click(); //触发创建文本编辑框

            } else {
                var conY = "";
                var date = $('.poplayer[oid=' + oid + '] .bulkadd').val();
                if (date == "") {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '请输入选项名称',
                        set: 2000
                    });
                    return;
                }
                var zf = date.split('\n');
                if (zf.length > 100) {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '每次最多只能添加100条选项',
                        set: 2000
                    });
                    return;
                }


                //选项名称过滤处理
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.matrix table .Ed_tr', "td[name='row']");
                zf = name_deal.BatchFn(zf);

                if (zf.length == 0) {
                    $('.jsTip_close').click();
                    return;
                }

                //后台保存数据
                var aiz = [];
                for (var ai = 0; ai < zf.length; ai++) {
                    if (zf[ai] == "") {
                        continue;
                    }
                    aiz.push(zf[ai]);
                }
                if (swap == "1") {
                    var id = create_option(oid, aiz, true);
					if(id.length == 0){return};
                } else {
                    var id = create_matrixrow(oid, aiz, true);
					if(id.length == 0){return};
                }

                //生成数据并添
                for (var ii = 0; ii < l; ii++) {
                    con += '<td><textarea cols="20" rows="1"></textarea></td>';
                }
                for (var i = 0; i < zf.length; i++) {
                    if (zf[i] == "") {
                        continue;
                    }
                    conY += '<tr class="Ed_tr"><td id="' + id[i] + '" name="row" menutype="row" class="T_edit_td" style="text-align:left;">' + zf[i] + '</td>' + con + '</tr>';
                }
                _this.module.find('.matrix table').append(conY);
                $('.jsTip_close').click();
                $('.loadCon,.loadMack').remove();
            }

            var question = get_question(oid);
            try{
                matrixWidthProcess(oid, question.custom_attr.col_width.parseJSON());
            }catch(e){}
        }
        //矩阵打分题行
        if (issue == '7') {
            var conY = '';
            var m = _this.module.find('.matrix table .Ed_tr').length + 1;
            var l = _this.module.find('.matrix table tr:eq(0) > td').length - 1;

            var max_num = _this.module.attr('maxnum') * 1;
            var answer = '';
            var dfW_width = max_num * 29;
            if (type == 1) {

                for (var ms = 0; ms < max_num; ms++) {
                    answer += '<a href="javascript:;"><i class="basic-too14-icon-active"></i></a>';
                }

                for (var ii = 0; ii < l; ii++) {
                    con += '<td><div class="dfW" style="width:'+dfW_width+'px">' + answer + '</div></td>';
                }
                if (swap == "1") {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    name_deal.ErdogicFn(_this.module, '.matrix table .Ed_tr', "td[name='option']");
                    var mun = name_deal.DealFn();

                    var id = create_option(oid, ['选项' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table').append('<tr class="Ed_tr"><td id="' + id[0] + '" name="option" menutype="row" class="T_edit_td" style="text-align:left;">选项' + mun + '</td>' + con + '</tr>');

                } else {

                    //创建选项序列号
                    var name_deal = new Name_deal();
                    name_deal.ErdogicFn(_this.module, '.matrix table .Ed_tr', "td[name='row']");
                    var mun = name_deal.DealFn();

                    var id = create_matrixrow(oid, ['矩阵行' + mun], false);
					if(id.length == 0){return};
                    _this.module.find('.matrix table').append('<tr class="Ed_tr"><td id="' + id[0] + '" name="row" menutype="row" class="T_edit_td" style="text-align:left;">矩阵行' + mun + '</td>' + con + '</tr>');


                }

                var question = get_question(oid);
                try{
                    matrixWidthProcess(oid, question.custom_attr.col_width.parseJSON());
                }catch(e){}

                _this.module.find('.matrix').scrollLeft(0);

                $('#' + id[0]).click(); //触发创建文本编辑框

            } else {
                var conY = "";
                var date = $('.poplayer[oid=' + oid + '] .bulkadd').val();
                if (date == "") {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '请输入选项名称',
                        set: 2000
                    });
                    return;
                }
                var zf = date.split('\n');
                if (zf.length > 100) {
                    $('.loadCon,.loadMack').remove();
                    loadMack({
                        off: 'on',
                        Limg: 0,
                        text: '每次最多只能添加100条选项',
                        set: 2000
                    });
                    return;
                }

                //选项名称过滤处理
                var name_deal = new Name_deal();
                name_deal.ErdogicFn(_this.module, '.matrix table .Ed_tr', "td[name='row']");
                zf = name_deal.BatchFn(zf);

                if (zf.length == 0) {
                    $('.jsTip_close').click();
                    return;
                }


                //后台保存数据
                var aiz = [];
                for (var ai = 0; ai < zf.length; ai++) {
                    if (zf[ai] == "") {
                        continue;
                    }
                    aiz.push(zf[ai]);
                }
                if (swap == "1") {
                    var id = create_option(oid, aiz, true);
					if(id.length == 0){return};
                } else {
                    var id = create_matrixrow(oid, aiz, true);
					if(id.length == 0){return};
                }

                //生成数据并添
                for (var ms = 0; ms < max_num; ms++) {
                    answer += '<a href="javascript:;"><i class="basic-too14-icon-active"></i></a>';
                }
                for (var ii = 0; ii < l; ii++) {
                    con += '<td><div class="dfW" style="width:'+dfW_width+'px">' + answer + '</div></td>';
                }
                for (var i = 0; i < zf.length; i++) {
                    if (zf[i] == "") {
                        continue;
                    }
                    conY += '<tr class="Ed_tr"><td id="' + id[i] + '" name="row" menutype="row" class="T_edit_td" style="text-align:left;">' + zf[i] + '</td>' + con + '</tr>';
                }
                _this.module.find('.matrix table').append(conY);
                $('.jsTip_close').click();
                $('.loadCon,.loadMack').remove();

                var question = get_question(oid);
                try{
                    matrixWidthProcess(oid, question.custom_attr.col_width.parseJSON());
                }catch(e){}
            }
        }
    }
}

//获取题型顺序

function get_project_order_list() {
    var array = [
        []
    ];
    var pagingAy = [];
    $('.dragwen > li').each(function(index, element) {
        var isP = $(this).is('.paging');
        if (isP) {
            array.push([]);
        } else {
            array[array.length - 1].push($(this).attr('oid'));
        }
    });

    return array;
}
//更新状态

function init_question_desc() {
    $('.dragwen .setup-group h4').each(function(i, element) {
        $(this).text('Q' + (i + 1));
        // 更新排序后，更新题目字典和选项关联的选项文案
        var oid = $(this).parents('.question').attr('oid');
        QUESTION_DICT[oid].cid = 'Q' + (i + 1);
        update_question_relation_option(oid);
    });
    var m = $('.dragwen > .paging span').length;
    $('.dragwen > .paging').each(function(i, element) {
        $(this).find('span').text((i + 1) + '/' + (m + 1));
    });
    $('.ul_tail .paging span').text((m + 1) + '/' + (m + 1));
}
//计算对象前面分页符个数

function Paging_num(_this) {
    var obj = _this;
    var index = $('.dragwen .module').index(obj);
    var m = 0;
    $('.dragwen > li').each(function(i, element) {
        if (i >= index) {
            return false;
        }
        if ($(this).hasClass('paging')) {
            m += 1;
        }
    });
    return m;
}

//表格宽度处理

function Width_mate(oid) {

    var obj = $('li[oid="' + oid + '"]');
    var objTable = $('table tr:eq(0) td', obj);
    var l = objTable.length;
    var mean_width = 80 / (l - 1);
    var w =  $('table', obj).width();
    objTable.each(function(index, element) {
        if (index == 0) {
            $(this).attr('width', (20/100)*w + 'px');
        } else {
            $(this).attr('width', (mean_width/100)*w + 'px');
        }
    });

}
//输出题型逻辑按钮

function set_jumpconstraint_status(oid, is_logic, count, type) {
    var question = get_question(oid);
    var is_quota = false,
        is_jump_logic = false,
        is_display_logic = false;
    if(!question) return;
    var jump_logic_len = question.jumpconstraint_id_list2.length,
        display_logic_len = question.displayconstraint_id_list2.length;
    var $topic_type_con = $('.module[oid=' + oid + '] .topic_type_con');
    var $showTable = $topic_type_con.find('.showTable');

    if (question.custom_attr.has_quota)
        is_quota = true;
    if(type == 'display'){
        if(is_logic && count > 0){
            is_display_logic = true;
            display_logic_len = count;
            if (display_logic_len > 9) display_logic_len = '9+';
        }
        var $jump_sign = $showTable.find('.logic_sign');
        is_jump_logic = $jump_sign.length > 0 ? true : false;
        if(is_jump_logic) jump_logic_len = $jump_sign.find('.logic_num').text();
    }else if(type == 'jump'){
        if(is_logic && count > 0){
            is_jump_logic = true;
            jump_logic_len = count;
            if (jump_logic_len > 9) jump_logic_len = '9+';
        }
        var $display_sign = $showTable.find('.display_logic_sign');
        is_display_logic = $display_sign.length > 0 ? true : false;
        if(is_display_logic) display_logic_len = $display_sign.find('.logic_num').text();
    }else{
        if(jump_logic_len > 0){
            is_jump_logic = true;
            if (jump_logic_len > 9) jump_logic_len = '9+';
        }
        if (display_logic_len > 0){
            is_display_logic = true;
            if (display_logic_len > 9) display_logic_len = '9+';
        }
    }

    $showTable.remove();
    var jump_logic_sign_con = '', display_logic_sign_con = '', quota_sign_con = '';
    if (is_jump_logic || is_quota || is_display_logic){
        if(is_jump_logic)
            jump_logic_sign_con = '<div class="logic_sign BubR cq_lj_ts"><i class="jump-icon-active"></i><span class="logic_num">' + jump_logic_len + '</span></div>';
        if(is_display_logic)
            display_logic_sign_con = '<div class="display_logic_sign BubR cq_lj_ts"><i class="display-icon-active"></i><span class="logic_num">' + display_logic_len + '</span></div>';
        if (is_quota)
            quota_sign_con = '<div class="quota_sign cq_qt_ts"><a target="_blank" href="/collect/quota/'+ pid +'"><i class="quota-icon-active"></i></a></div>';

        var showTableCon = '<table class="showTable"><tr><td>' + jump_logic_sign_con + display_logic_sign_con + quota_sign_con + '</td></tr></table>';
        $topic_type_con.append(showTableCon);
    }
}

//插入题型

function insert_question_html(q_index, question_html) {
    $('.dragwen .module:eq(' + q_index + ')').after(question_html).remove().empty();
}
//指定位置添加题目
function add_question_html(q_index, question_html) {
    var obj = $(question_html).insertAfter('.dragwen .module:eq(' + q_index + ')');
    $("html,body").animate({
                scrollTop: (obj.offset().top - 100)
            }, 'slow');
}
//jquery插件
;
(function($) {
    $.fn.extend({
        "MenuFixed": function(obj, top) {
            function Mf() {
                var scrollT = $(this).scrollTop();
                if (scrollT > top) {
                    //obj.attr('style','position:absolute; top:'+(scrollT-80)+'px;');
                    obj.attr('style', 'position:fixed; top:2px;');
                } else {
                    obj.attr('style', '');
                }
            }
            Mf();
            $(window).scroll(function() {
                Mf();
            });

        }
    });
})(jQuery);



//初始化题目设置
var jsBubble = new JsBubble();

//初始化问卷设计模块
var problem_design = new ProblemDesign({
    dragObj: ".moduleL",
    sorObj: ".dragwen"
});

problem_design.Drag(get_init_template, save_question, after_dropped);

//问卷设置
var topicOperating = new TopicOperating();
topicOperating.events();

//添加选项
var addOrBatch = new AddOrBatch();

$(function() {
    //固定菜单
    $().MenuFixed($('.rows1'), 176);
    //菜单切换
    $(".accordion-group h4").click(function() {
        $(this).find('i').toggleClass("icon_on");
        $(this).siblings("h4").find('i').removeClass("icon_on");
        $(this).next("ul").slideToggle("slow")
            .siblings("ul:visible").slideUp("slow");
    });

});

//文字编辑
var textEdit = new TextEdit();
textEdit.T_edit();
textEdit.T_edit_li();
textEdit.T_edit_td();

//高级编辑图片上传回调方法
function ck_img_callback(data){
    if(!data.error_msg==""){
       loadMack({off:'on',Limg:0,text:data.error_msg,set:2500});
       return false;
    }
    textEdit.editor.insertHtml('<img onclick="alert(123)" src="'+data.img_url+'">');
    $('#UpdataImageTcc .jsbox_close').click();
}
$(function(){
    $('.nui-ipt-buttom').live('click',function(){
        var url = $(this).parent().find(".nui-ipt-input").val();
        var img = new Image();

        img.onload = function() {
            if(img.width>750){var w = 750;}else{var w = img.width;}
            textEdit.editor.insertHtml('<img width="'+w+'" src="'+url+'">');
            $('#UpdataImageTcc .jsbox_close').click();
        };
        img.onerror=function(){loadMack({off:'on',Limg:0,text:"图片地址不存在",set:2500});     }
        img.src = url;
    });

});

//图片太小调节
function ImgEditSize(obj){
    this.main=function(obj){
        this.obj = $(obj);
        this.event();
    }
    this.status=true;
    this.status_menu=true;
    this.event=function(){
        var _this=this;
        this.obj.mouseover(function(){
            _this.status_menu=false;
            if(_this.Menu){_this.DelMenu()};
            _this.addMenu();
        });
        this.obj.mouseout(function(){
            setTimeout(function(){
                _this.DelMenu();
            },50);
        });

    }
    this.addMenu=function(){
        var _this = this;
        this.Menu=$('<div class="ImgEditSize"><ul>'+
                        '<li class="Enl" title="放大"></li>'+
                        '<li class="Ori" title="原图"></li>'+
                        '<li class="Nar" title="缩小"></li>'+
                        '<li class="Del" title="删除"></li>'+
                    '</ul></div>');


        $('body').append(_this.Menu);
        this.Menu.css({
            'position':'absolute',
            'top': _this.obj.offset().top+5 + 'px',
            'left':_this.obj.offset().left+5 + 'px'
        });
        this.Menu.hover(function(){
            _this.status=false;
        },function(){
            _this.status=true;
            _this.status_menu=true;
            setTimeout(function(){
                if(_this.status_menu){
                   _this.DelMenu();
                }
            },200);

        });
        this.Menu.find(".Enl").click(function(){
            var width = _this.obj.width();
            var height = _this.obj.height();
            var xs = width/height;
            if(width>=750){return false};
            _this.getImgWH(width+20*xs,height+20);
            return false;
        });
        this.Menu.find(".Ori").click(function(){
            var img = _this.imgSize(_this.obj.attr('src'));

            return false;
        });
        this.Menu.find(".Nar").click(function(){
            var width = _this.obj.width();
            var height = _this.obj.height();
            var xs = width/height;
            if(width<=100){return false};
            _this.getImgWH(width-20*xs,height-20);
            return false;
        });
        this.Menu.find(".Del").click(function(){
            _this.obj.remove();
            _this.status=true;
            _this.DelMenu();
            return false;
        });
    }
    this.getImgWH=function(w,h){

        this.obj.width(w);
        this.obj.height(h);
    }
    this.DelMenu=function(){
        if(this.status){
          this.Menu.remove();
        }
    }
    this.imgSize=function(src){
       var _this = this;
       var imgObj = new Image();
       imgObj.onload=function(){
        _this.getImgWH(imgObj.width,imgObj.height);
       }
       imgObj.src = src;
    }
    return this.main(obj);
}

//图片点选题悬浮窗
function Qimg_edit() {
    var Qimg_obj_parent = $("#question_box");
    Qimg_obj_parent.on({
        "mouseover":function(){
            Qimg_obj_parent.find(".Imgli .questionImgBox .QImgCon").unbind("click");
            if ($(this).find(".img_handle").length == 0){
                $(this).append('<div class="img_handle"> <span class="edit_img">编辑</span> <span class="edit_del">删除</span> </div>');
            }else{
                $(this).find(".img_handle").show();
            }
        },
        "mouseout":function(){
            $(this).find(".img_handle").hide();
        }
    },".Imgli .questionImgBox .QImgCon");
    Qimg_obj_parent.on("click", ".img_handle .edit_img", function(e){
        var _this = $(this).parents(".QImgCon").find("img");
        var url = _this.attr("Maxsrc");
        var option_id = _this.parents(".questionImgBox").attr("name");
        var bbox = _this.attr("bbox");
        var orig_width = _this.attr("orig_width");
        if(bbox==undefined||bbox==""){bbox="[75,75,150,150]";}
        bbox = bbox.parseJSON();
        new CreateJcrop(url, ChgThumbnailCallback, option_id,bbox,orig_width);
    });
    Qimg_obj_parent.on("click",".img_handle .edit_del" ,function(e){
        var lable_obj = $(this).parents(".questionImgBox").find(".T_edit_min");
        var active_oid = lable_obj.parents('.module').attr('oid');
        var active_option_id = lable_obj.attr('id');
        // lable_obj.parent().remove();
        delete_option(active_oid, active_option_id, 'is_remove');
    });
}

//新手帮助

function Help_up() {
    var content = $('<div class="Help_up"><div class="close_help"></div></div>');
    var html_h = $("body").height();
    var wid_h = $(window).height();
    var mack_h = '';
    html_h > wid_h ? mack_h = html_h : mack_h = wid_h;

    var con = $('<div id="lightBox" class="popupComponent maptss_lightBox" style="display: block; height:' + mack_h + '+px;"><div class="popupCover"></div></div>');

    $('body').append(con);
    $('.container-fluid ').append(content);
    var conH = $('.jsbox').height();
    var conTop = 69;
    var conLeft = 16;
    $('.Help_up').css({
        'top': conTop + 'px',
        'left': conLeft + 'px'
    });
    $('html').css({
        'overflowY': 'hidden'
    });

    $('.close_help').live('click', function() {
        con.remove();
        content.remove();
        $('html').attr('style', '');
    });

}

//选项名称处理

function Name_deal() {
    this.originalArr = [];
    this.numArr = [];
    this.Batch_data = [];
    this.num = -1;
    this.tsm = 0; //批量添加选项重复数
    this.tsmC = 0; //批量添加选项成功数
    //数据存储
    this.ErdogicFn = function(Obj, this_option, Mb) {
        var this_ = this;
        Obj.find(this_option).each(function(index, element) {
            var optV = $(Mb, $(this)).text();
            this_.originalArr.push(optV);

        });
    };
    //选项编辑重复判断
    this.EditFn = function(val) {
        var rtz = false;
        for (var ei = 0; ei < this.originalArr.length; ei++) {
            if (this.originalArr[ei] == val) {
                rtz = true;
                break;
            }
        }
        return rtz;

    };
    //缺省名称处理
    this.DealFn = function() {

        var reg = /(\d+)/g;

        for (var i = 0; i < this.originalArr.length; i++) {

            if (/^选项\d+$/.test(this.originalArr[i]) || /^矩阵行\d+$/.test(this.originalArr[i]) || /^请打分\d+$/.test(this.originalArr[i]) || /^请填空\d+$/.test(this.originalArr[i])) {
                this.numArr.push(this.originalArr[i].match(reg) * 1);
            }

        };
        this.numArr = this.numArr.unique();
        //console.log(this.numArr);

        if (this.numArr.length == 0) {
            return this.num = 1;
        };
        this.numArr.sort(this.Conmpare);
        for (var ii = 0; ii < this.numArr.length; ii++) {

            if (this.numArr[ii] !== (ii + 1)) {
                this.num = ii + 1;
                break;
            }

        }
        //console.log(this.numArr);
        if (this.num == -1) {
            this.num = this.numArr[this.numArr.length - 1] + 1;
        }
        return this.num;

    };
    //名称批量处理
    this.BatchFn = function(data) {
        this.Batch_data = [];
        var sbt = -1;
        var tsm = 0;
        this.tsm = 0;
        this.tsm = 0;
        for (var m = 0; m < data.length; m++) {

            var Dmt = data[m].trim();
            //去重方法
            //          for(var mi = 0;mi<this.originalArr.length;mi++){
            //              if(this.originalArr[mi].trim()==Dmt){
            //                  //console.log(this.originalArr[mi].trim()+"<<>>"+data[m].trim());
            //                  sbt = 1;
            //                  this.tsm+=1;
            //              break;
            //              }else{
            //                sbt=-1;
            //              }
            //          }
            //          if(sbt==-1){

            if (Dmt !== "") {
                this.tsmC += 1;
                this.Batch_data.push(Dmt);
            }

            //          }

        }
        //console.log(this.Batch_data);
        return this.Batch_data;
    };
    this.Conmpare = function(value1, value2) {
        if (value1 < value2) {
            return -1;
        } else if (value1 > value2) {
            return 1;
        } else {
            return 0;
        }
    };
}


//去除字符串左右空格
if (!String.prototype.trim) {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    }
}

//数组去重
Array.prototype.unique = function() {
    var n = []; //一个新的临时数组
    for (var i = 0; i < this.length; i++) //遍历当前数组
    {
        if (n.indexOf(this[i]) == -1) n.push(this[i]);
    }
    return n;
}


//js原生事件注册
var EventUtil = {

    //增加事件处理函数
    addHandler: function(element, type, handler) {
        if (element.addEventListener) {
            element.addEventListener(type, handler, false);
        } else if (element.attachEvent) {
            element.attachEvent("on" + type, handler);
        } else {
            element["on" + type] = handler;
        }
    },
    //移除事件处理函数
    removeHandler: function(element, type, handler) {
        if (element.removeEventListener) {
            element.removeEventListener(type, handler, false);
        } else if (element.detachEvent) {
            element.detachEvent("on" + type, handler);
        } else {
            element["on" + type] = null;
        }
    }

}

    function setOperateOId(type, oid) {
        $(".right_operate").attr("type", type)
        $(".right_operate").attr("oid", oid)
    }

    function initRightOperate() {
        if ($(".right_operate .setup").is(':hidden') &&
            $(".right_operate .btn").is(':hidden') &&
            $(".lj_btn").is(':hidden') && $(".yy_btn").is(':hidden') ) {

                moveLeft();
                return true;
        }
        return false;
    }

    function relaodSetting() {
        var oid  = $(".right_operate").attr('oid')
        var type = $(".right_operate").attr('type')

        if (type=='question') {
            var obj  = getObjByOid(oid)
            obj.find('.T_edit').click();
        }
    }

    function getObjByOid(oid) {
        return $(".module[oid=" + oid + "]");
    }

    function addSettingContent (title, content) {
        $(".right_operate .setup").empty()
        $(".right_operate .bt").html(title);
        if (content != "") {
            $(".right_operate .setup").html(content);

            $(".right_operate .setup").show()
            $(".right_operate .btn").show()

        } else {
            $(".right_operate .setup").hide()
            $(".right_operate .btn").hide()
        }
        // 单个选项设置没有逻辑设置和选项关联
        var $display_btn = $('.right_operate').find('.display_btn').parent();
        var $jump_btn = $('.right_operate').find('.jump_btn').parent();
        var $option_relation_btn = $('.right_operate').find('.option_relation_btn').parent();
        if(title == '选项设置'){
            $display_btn.hide();
            $jump_btn.hide();
            $option_relation_btn.hide();
        }else{
            $display_btn.show();
            $jump_btn.show();
        }
    }

    /*
    author: ali
    param:
        bShow
        type
            1  -- question
            2  -- option
    */
    function addLogicSet (bShow, type) {
        if (bShow) {
            $(".lj_btn,.lj_tip2").show()
            if (type==1) {
                $(".lj_btn").addClass('question')
                $(".lj_btn").removeClass('option')
            } else if (type==2) {
                $(".lj_btn").addClass('option')
                $(".lj_btn").removeClass('question')
            }
        } else {
            $(".lj_btn,.lj_tip2").hide()
        }
    }

    /*
    author: ali
    param:
        bShow
        type
            1  -- question
            2  -- option
    */
    function addRefSet (bShow, type) {
        if (bShow) {
            $(".yy_btn,.yy_tip").show()
            if (type==1) {
                $(".yy_btn").addClass('question')
                $(".yy_btn").removeClass('option')
            } else if (type==2) {
                $(".yy_btn").addClass('option')
                $(".yy_btn").removeClass('question')
            }
        } else {
            $(".yy_btn,.yy_tip").hide()
        }
    }

    function match_text_remove(array) {
        var need_fill = true;
        var text_reg = /[选项|矩阵行|请打分|请填空](\d{1})$/;
        if (array.length == 2) {
            for (var i = 0; i < 2; i++) {
                if (text_reg.test(array[i])) {
                    // if (/^选项|矩阵行|请打分|请填空([1-2])$/.test(array[i]) || /^[1-2]$/.test(array[i])|| /^请打分\d+$/.test(array[i])|| /^请填空\d+$/.test(array[i])){
                    var text_num = parseInt(array[i].match(text_reg)[1]);
                    if (text_num == i + 1) {} else {
                        need_fill = false;
                    }
                } else {
                    need_fill = false;
                }
            };
        } else {
            need_fill = false;
        }
        return need_fill;
    }

// 判断当前题目是否是单选题或多选题
function is_single_or_multiple(oid) {
    var question_obj = QUESTION_DICT[oid];
    // 排序分页时，oid 为 undefined
    if(question_obj){
        var question_type = question_obj ? question_obj.question_type : '',
            disp_type = question_obj.custom_attr.disp_type;
        var disp_type_list = ['vertical', 'transverse', 'column', 'dropdown'];
        if(check_in(question_type, [QUESTION_TYPE_SINGLE, QUESTION_TYPE_MULTIPLE])){
            if(!disp_type){
                return true;
            }else if(check_in(disp_type, disp_type_list)){
                return true;
            }else{
                return false;
            }
        }else{
            return false;
        }
    }else{
        return false;
    }
}
