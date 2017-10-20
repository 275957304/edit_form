var bState = true;
var mayEdit = $('.canEdit',window.parent.document).attr('can_edit');
var myEdit = $('.ent_flag',window.parent.document).attr('ent_flag');
var canEdit = '';
var expire_flag;
// 判断逻辑修复：非企业成员和企业管理员拥有操作权限
if(mayEdit == 'True' || myEdit === '0'){
    canEdit = 'True';
}
var envelopePaidSettings_qj = {};
var pluginCenterIframe = {
    init: function(options) {
        var pluginCenterIframe = {};
        var timestamp = new Date().getTime();
        /*
            settings.type:主要是获取他要用那种应用的模版
            settings.step:主要是知道他要用settings.type模版的第几步，因为需求不是都从第一步开始设置的
            settings.string：这个主要是获取需要使用地方的new出来的变量名字，然后传给子页面可以操作pluginCenterIframe.remove()的方法。
        */
        var settings = {
            type: 'default',
            string: 'default',
            step: '',
            p_type: idyC.getUrlQuery('p_type'),
            way: ''
        };
        $.extend(settings, options);

        var $iframe = $('<iframe id="plugin_center_iframe" src="/plugin/setting?type=' + settings.type + '&string=' + settings.string + '&step=' + settings.step + '&p_type=' + settings.p_type + '&project_id=' + settings.project_id + '&way=' + settings.way + '" allowtransparency="true" frameborder="0" style=" width: 920px; height: 614px; position: fixed; left: 50%; top: 50%; margin-left: -460px; margin-top: -307px; z-index: 9999901; background: #fff; border-radius: 7px; overflow: hidden; border: 0; box-shadow:0 0 12px rgba(0, 0, 0, 0.15);"></iframe>');

        var $mark = new idyC.mark({
            'opacity': '0.2'
        });

        pluginCenterIframe.created = function() {
            $mark.open();
            $('body').append($iframe);
        };

        pluginCenterIframe.remove = function() {
            $iframe.remove();
            $mark.remove();
        };

        if (settings.type != 'default') {
            pluginCenterIframe.created();
        }
        return pluginCenterIframe;
    }
};

var pluginCenter = {
    init: function(options) {
        var pluginCenter = {};
        var timestamp = new Date().getTime();
        var settings = {
            type: '',
            string: '',
            step: '',
            configUrl: '/plugin/ajax/get_plugin_info/?' + timestamp,
            info: '',
            hide_logo_buy: false, //隐藏预览页的购买logo窗口
            project_single_id: '' //单个项目购买入口，如果有值则为项目ID
        };
        $.extend(settings, options);
        if (settings.type == 'envelope') settings.type = 'lucky_money';
        var pluginName = settings.type;
        if (typeof(settings.project._id) != "undefined") {
            settings.project_single_id = settings.project._id.$oid;
        }
        var configInfo = JSON.parse($.ajax({
            url: settings.configUrl,
            data: {
                'plugin_name': pluginName,
                '_xsrf': getCookie('_xsrf')
            },
            async: false
        }).responseText);
        settings.info = configInfo;
        var $dialogApplication = $('<div class="dialog_application"></div>');
        var $showChildWrap = $('<div class="show_childWrap"></div>');
        var $showSmallWrap = $('<div class="show_smallWrap"></div>');
        var $mark = new idyC.mark({
            opacity: '0.5',
            zIndex: 9999903,
            backgroundColor: 'fff'
        });
        $('body').append($dialogApplication);

        // 初始化sessionStorage
        sessionStorage.isRenew = false;

        $dialogApplication.on('click', '.close', function() {
            parent[settings.string].remove();
        });

        pluginCenter.remove = function() {
            $dialogApplication.remove();
        };

        pluginCenter.showApplication = function() {
            //主要是检测是否已激活应用 isBuy 0 未购买 1已购买
            $.ajax({
                "url": "/plugin/ajax/is_already_buy/",
                "type": "POST",
                "data": {
                    'plugin_id': settings.info.oid,
                    'project_id': settings.project_single_id,
                    '_xsrf': getCookie('_xsrf')
                },
                "dataType": "JSON",
                success: function(data) {
                    expire_flag = data.is_expire;
                    if (data.isSingle == 1) { //判断是否是以前购买了单个应用并且还没有应用到项目上【只有抽奖与隐藏logo有这个】
                        if (settings.project_single_id) { //判断购买入口是不是当前项目，而非应用中心
                            var singleOrder_wenan_dict = {
                                'hide_logo': '隐藏问卷网logo',
                                'lucky_draw': '抽奖'
                            };
                            pluginCenter.showSmallWrap({
                                title: "支付确认",
                                defaultStyle: true,
                                defaultStyleText2: singleOrder_wenan_dict[settings.type] + '将应用到此项目，其他项目使用' + singleOrder_wenan_dict[settings.type] + '需再次购买？',
                                type: "confirm",
                                width: "440px;",
                                btnOKFn: function() {
                                    pluginCenter.singleOrderRelation('old');
                                },
                                btnCancelFn: function() {
                                    parent[settings.string].remove();
                                },
                            });
                            return false;
                        }
                        pluginCenter.showProjectList();
                    } else if (data.isBuy == 1) { //已购买高级版
                        if (settings.type == 'hide_logo' || settings.type == 'quota' || settings.type == 'vote_wall') {
                            //和产品讨论后，统一为hideLogoRenew
                            pluginCenter.hideLogoRenew(data.expire_time);
                        } else if (settings.type == 'custom_domain') {
                            if (data.audit_status == '1') { //审核通过，显示控制台
                                pluginCenter.domainComplete(data.domain, data.expire_time, data.service_status);
                            } else if (data.audit_status == '-1') { //审核不通过
                                if (data.show_complete) { //显示控制台，提示未通过原因，禁用修改自定义域名状态
                                    pluginCenter.domainComplete(data.tmp_domain, data.expire_time, data.service_status, data.audit_desc);
                                } else {
                                    pluginCenter.domainStep(1);
                                }
                            } else {
                                if (data.service_status == '1') {
                                    pluginCenter.domainComplete(data.domain, data.expire_time, data.service_status);
                                } else {
                                    //如果有购买了，还没有域名（高级用户）
                                    if (data.is_expire==0 && data.domain==""){
                                        $.ajax({
                                            url: "/plugin/ajax/domain/",
                                            type: "GET",
                                            dataType: "JSON",
                                            async: false,
                                            data: {
                                                'plugin_id': settings.info.oid
                                            },
                                            success: function(ret) {
                                                if (ret.result == '1') {
                                                    if (ret.audit_status == '0') {
                                                        settings.info.domain = ret.domain;
                                                        pluginCenter.domainAudit(ret.mobile, true);
                                                    }else if(ret.audit_status=='1'){
                                                        var options = {};
                                                        if(ret.expire_time !== ''){
                                                            options = {is_renew: true, domainName: ret.domain, expireTime: ret.expire_time, service_status: ret.expire_time};
                                                        }else{
                                                            options = {prevText: "修改域名"};
                                                        }
                                                    }else{
                                                        pluginCenter.domainStep(1);
                                                    }
                                                } else {
                                                    pluginCenter.domainStep(1);
                                                }
                                            }
                                        });
                                        return false;
                                    }
                                    settings.info.domain = data.domain;
                                    pluginCenter.domainAudit(data.mobile, false);
                                }
                            }
                        } else if(settings.type == 'ent_cooperation'){
                            $.ajax({
                                url : '/enterprise/get_member_ent/',
                                type : 'GET',
                                async : false,
                                success:function(ret){
                                    if(ret.ent_id){
                                        showApplicationCreate();
                                    }else{
                                        settings.isCreate = 0; //给settings新加一个属性isCreate，未创建企业时赋值为零
                                        showApplicationCreate();
                                    }
                                }
                            });   
                        }else {
                            if (settings.project_single_id) { //判断购买入口是不是当前项目，而非应用中心
                                if (data.is_expire) { //如果到期则进入到期展示页
                                    if (settings.type == 'restrict_mobile_rspd') {
                                        if (data.is_history != 1) {
                                            //限定手机广告位，没有设置过，应用到期了则显示到期提醒
                                            pluginCenter.sing_project_buy_exhibition(data.expire_time, data.is_history, data.is_expire);
                                        } else { //判断是否有设置，如果设置了则直接进入到查看记录页面
                                            pluginCenter.historyRecordList(settings.project_single_id);
                                        }
                                    } else if (settings.type == 'wx_signin') {
                                        // 此方法用于项目列表页的下拉框
                                        pluginCenter.showBuyProjectList(data.expire_time, data.is_expire);
                                    } else {
                                        pluginCenter.sing_project_buy_exhibition(data.expire_time, data.is_history, data.is_expire);
                                    }
                                } else {
                                    if (data.is_history) { //判断是否有设置，如果设置了则直接进入到查看记录页面
                                        pluginCenter.historyRecordList(settings.project_single_id);
                                    }else{ //判断是否有设置，没有设置则进入设置页面
                                        if(settings.type == 'restrict_mobile_rspd'){
                                            pluginCenter.setMobileList(settings.project_single_id);//直接跳转到编辑名单页面
                                        }else if (settings.type == 'wx_signin') {
                                            // 此方法用于项目列表页的下拉框
                                            pluginCenter.showBuyProjectList(data.expire_time, data.is_expire);
                                        }else{
                                            pluginCenter.singleOrderRelation();
                                        }
                                    }
                                }
                                return false;
                            }
                            pluginCenter.showBuyProjectList(data.expire_time, data.is_expire);
                        }
                    } else {    //未购买高级版
                        settings.unBuy = 0; //给settings新加一个属性unBuy，未购买高级版时赋值为零
                        showApplicationCreate();
                    }
                }
            });

            //单独项目页面购买
            pluginCenter.singleOrderRelation = function(edition) {
                $.ajax({
                    "url": "/plugin/ajax/relation/",
                    "type": "POST",
                    "data": {
                        '_xsrf': getCookie('_xsrf'),
                        'plugin_name': pluginName,
                        'project_id': settings.project_single_id
                    },
                    "async": false,
                    success: function(data) {
                        var result = JSON.parse(data);
                        if (result.info) {
                            alert(result.info);
                        } else {
                            if (settings.type == 'hide_logo') {
                                // pluginCenter.hideLogoComplete(data.expire_time, 'single', settings.project);
                                pluginCenter.transferComplete(data);

                            } else if (settings.type == 'lucky_draw') {
                                pluginCenter.luckyDrawSetPrize(settings.project_single_id); //直接跳转到设置页面
                            } else if (settings.type == 'lucky_money') {
                                pluginCenter.setEnvelope(settings.project_single_id); //直接跳转到设置页面
                            } else if (settings.type == 'restrict_mobile_rspd') {
                                pluginCenter.setMobileList(settings.project_single_id); //直接跳转到编辑名单页面
                            }
                        }
                    }
                });
            };

            //单个项目购买状态,目前只有抽奖会触发（1、购买完成时展示，2、过期时展示）
            pluginCenter.sing_project_buy_exhibition = function(expire_time, is_history, is_expire) {
                var common_imgUrl = '/static/images/plugin_center/bg_draw.png',
                    common_h4Text = '支付成功，功能已启用',
                    common_text = '您账号下的所有项目都可以设置抽奖应用<br />（有效期至' + expire_time + '）',
                    common_btnText = '立即设置',
                    common_showBtn = true;
                if (settings.type == 'restrict_mobile_rspd') {
                    common_imgUrl = '/static/images/ico_appeal_success.png';
                    common_h4Text = '支付成功，功能已启用';
                    common_text = '您账号下的所有项目都可以设置' + settings.info.title + '<br />（有效期至' + expire_time + '）';
                    common_showBtn = true;
                    if (is_expire) {
                        common_imgUrl = '/static/images/ico_appeal_fail.png';
                        common_h4Text = '应用已过期，请续费购买';
                        common_text = '此应用截止日期：' + expire_time;
                        common_btnText = '续费购买';
                    }
                } else {
                    if (is_history) {
                        common_btnText = "查看记录";
                    }
                    if (is_expire) {
                        common_h4Text = '抽奖应用到期';
                        common_text = '抽奖应用已于' + expire_time.toString() + '到期，您可以<span class="btn_again_buy" style="color:#53a4f4;cursor:pointer;" href="/senior_user/" target="_blank">续费延期</span>再次开启抽奖应用';
                        common_showBtn = false;
                    }
                }

                commonComplete({
                    "imgUrl": common_imgUrl,
                    "h4Text": common_h4Text,
                    "text": common_text,
                    "showBtn": common_showBtn,
                    "btnText": common_btnText,
                    "blank": false,
                    "btnFn": function() {
                        if (is_history) {
                            pluginCenter.historyRecordList(settings.project_single_id);
                        } else {
                            if (settings.type == 'restrict_mobile_rspd' && common_btnText == '续费购买') {
                                pluginCenter.removeChildWrap();
                                var options = {is_renew: true};
                            }else{
                                pluginCenter.singleOrderRelation();
                            }
                        }
                    }
                });
            };

            function showApplicationCreate() {
                var $showApplication = $('<div class="show_application"></div>');
                var introductionStr = '';
                var instructionsStr = '';
                var imgStr = '';
                var imgDiscStr = '';
                $.each(settings.info.introduction, function(index, value) {
                    introductionStr += '<dd>' + value + '</dd>';
                });
                $.each(settings.info.instructions, function(index, value) {
                    instructionsStr += '<dd>' + value + '</dd>';
                });
                $.each(settings.info.imgSrc, function(index, value) {
                    imgStr += '<img src="' + value + '">';
                    imgDiscStr += '<li></li>';
                });
                var help_a = '';
                var seniorUserTxt = '';
                var Immediate = "免费使用";
                if (settings.type == "lucky_draw") {
                    Immediate = "升级高级版";
                    help_a = '<span class="seniorUserIcon">高级版应用</span><a href="http://www.wenjuan.com/helpcenter/list/53916b15f7405b30051f15b8/h3565fe439a320fc75a5479f45" target="_blank" class="cj_tip"></a>';
                    seniorUserTxt = '<span class="seniorUserTxt">限高级版使用</span>';
                } else if (settings.type == "lucky_money") {
                    help_a = '<a href="http://www.wenjuan.com/helpcenter/list/53916b15f7405b30051f15b8/h3569e262da320fc9711562545" target="_blank" class="cj_tip"></a>';
                } else if (settings.type == "quota" || settings.type == "hide_logo" || settings.type == "custom_domain"){
                    Immediate = "升级高级版";
                    help_a = '<span class="seniorUserIcon">高级版应用</span>';
                    seniorUserTxt = '<span class="seniorUserTxt">限高级版使用</span>';
                } else if (settings.type == "ent_cooperation"){
                    if(settings.unBuy === 0){
                        Immediate = "升级高级版";
                        help_a = '<span class="seniorUserIcon">高级版应用</span>';
                        seniorUserTxt = '<span class="seniorUserTxt">限高级版使用</span>';
                    }else if(expire_flag == 1){
                        Immediate = "续费高级版";
                    }else if(settings.isCreate === 0){
                        Immediate = "立即使用";
                    }
                    
                }
                var showApplicationStr = '' +
                    '<div class="title">' +
                    '<a class="close"></a>' +
                    '<dl>' +
                    '<dt><img src="' + settings.info.iconImgSrc + '"></dt>' +
                    '<dd>' +
                    '<p class="p1">' + settings.info.title + help_a + '</p>' +
                    '<p class="p2">' + settings.info.type + '</p>' +
                    '<p class="p3">' + settings.info.useNum + '位用户安装</p>' +
                    '</dd>' +
                    '</dl>' +
                    '<a class="btn_default btn_use" href="javascript:;">' + Immediate + '</a>' +
                    seniorUserTxt +
                    '</div>' +
                    '<div class="content">' +
                    '<div class="img_wrap">' +
                    '<div class="img">' + imgStr + '</div>' +
                    // '<ul>' + imgDiscStr + '</ul>' +
                    '</div>' +
                    '<div class="txt">' +
                    '<dl><dt>简介</dt>' + introductionStr + '</dl>' +
                    '<dl><dt>定价</dt>' + instructionsStr + '</dl>' +
                    '</div>' +
                    '</div>';
                $showApplication.html(showApplicationStr);
                $dialogApplication.append($showApplication);
                var $imgWrap = $showApplication.find('.content .img_wrap');
                var $discLi = $imgWrap.find('li');
                var $imgCon = $imgWrap.find('.img');
                var iW = $imgCon.find('img').eq(0).width();
                $imgCon.css({
                    'width': iW * settings.info.imgSrc.length
                });
                $discLi.eq(0).addClass('active');
                $discLi.click(function() {
                    var index = $(this).index();
                    $discLi.removeClass('active');
                    $discLi.eq(index).addClass('active');
                    $imgCon.animate({
                        left: -iW * index
                    });
                });

                $showApplication.on('mouseenter', '.cj_tip', function() {
                    hover_tip($(this), '点击查看帮助');
                });

                $showApplication.on('click', '.btn_use', function() {
                    $showApplication.remove();
                    var options = {};
                    _hmt.push(['_trackEvent', 'pluginUse', 'click', settings.type + '_pluginUse']);
                    //配额、抽奖、隐藏logo是高级版应用，未购买高级版时引导购买，不可单独购买
                    if (settings.type == "quota" || settings.type == "lucky_draw" || settings.type == "hide_logo" || settings.type == 'custom_domain'){
                        parent.window.location.href = "/senior_user";
                    }else if(settings.type == "ent_cooperation"){
                        //首先判断是否为高级版试用账户
                        $.ajax({
                            url : '/plugin/ajax/check_free_super_account/',
                            type : 'GET',
                            success : function(ret){
                                console.log(ret);
                                if(ret.check_status == true){   //试用
                                    loadMack({
                                        'str': '高级版试用用户暂不支持使用',
                                        'timer': 1500
                                    });
                                    parent.window.location.reload();    
                                }else{  //购买，非试用
                                    if(expire_flag == 1){   //已过期，引导购买
                                        parent.window.location.href = "/senior_user";
                                    }else if(settings.isCreate == 0){
                                        parent.window.location.href = "/enterprise/"
                                    }else{
                                        parent.window.location.href = "/senior_user";
                                    }
                                }   
                            }
                        });
                    }else if(settings.type == 'lucky_money' || settings.type == 'restrict_mobile_rspd' || settings.type == 'wx_signin'){
                        //微信红包、限定手机号、微信签到、投票墙下放为免费应用，参照红包的逻辑
                        $.ajax({
                            "url": "/plugin/ajax/consume/",
                            "type": "POST",
                            "dataType": "JSON",
                            "async": false,
                            "data": {
                                'plugin_id': settings.info.oid,
                                'buy_type': 'first_buy',
                                '_xsrf': getCookie('_xsrf')
                            },
                            success: function(data) {
                                if (!data.info) {
                                    if (settings.project_single_id) {
                                        pluginCenter.setEnvelope(settings.project_single_id); 
                                        //如果是单独项目页面上购买入口，微信红包立即使用后直接进入设置页面
                                        return false;
                                    }
                                    pluginCenter.showBuyProjectList();
                                } else {
                                    pluginCenter.showSmallWrap({
                                        title: '提示',
                                        contentHtml: data.info,
                                        type: 'alert'
                                    });
                                }
                            }
                        });
                    }else if(settings.type == 'vote_wall'){
                        $.ajax({
                            "url": "/plugin/ajax/consume/",
                            "type": "POST",
                            "dataType": "JSON",
                            "async": false,
                            "data": {
                                'plugin_id': settings.info.oid,
                                'buy_type': 'first_buy',
                                '_xsrf': getCookie('_xsrf')
                            },
                            success: function(data) {
                                if (!data.info) {
                                    parent.window.location.href = '/plugin/vote_wall/';
                                } else {
                                    pluginCenter.showSmallWrap({
                                        title: '提示',
                                        contentHtml: data.info,
                                        type: 'alert'
                                    });
                                }
                            }
                        });
                    }
                });
            }
        };

        pluginCenter.appSubmit = function(calTypeId, is_renew) {
            $.ajax({
                "url": "/plugin/ajax/consume/",
                "type": "POST",
                "dataType": "JSON",
                "async": false,
                "data": {
                    'plugin_id': settings.info.oid,
                    'cal_type_id': calTypeId,
                    'month_count': settings.month_count,
                    'discount_id': settings.discount_id,
                    'c_type': settings.c_type,
                    '_xsrf': getCookie('_xsrf')
                },
                success: function(data) {
                    if (!data.info) {
                        pluginCenter.removeChildWrap();
                        data.is_renew = is_renew;
                        pluginCenter.transferComplete(data);
                    } else {
                        pluginCenter.showSmallWrap({
                            title: '提示',
                            contentHtml: data.info,
                            btnOKFn: function() {
                                parent[settings.string].remove();
                            },
                            type: 'alert'
                        });
                    }
                }
            });
        };

        // 成功页面
        pluginCenter.transferComplete = function(options){
            var sub_settings = {
                transferCompleteName: "立即使用",
                imgUrl: "/static/images/plugin_center/success_icon.png",
                h4Text: (settings.info.title).replace(" ", "") + "购买成功",
                text: "应用截止日期：" + options.expire_time,
                audit:false,
            };

            if (settings.type == "lucky_money"){
                sub_settings.transferCompleteName = "查看红包记录";
                if (settings.lucky_money_setting_status != 5){
                    sub_settings.imgUrl = "/static/images/plugin_center/audit.png";
                    sub_settings.h4Text = "您的红包正在审核中";
                    sub_settings.text = "管理员审核通过后即可开启";
                    sub_settings.audit = true;
                }else{
                    sub_settings.h4Text = "您的红包已启用";
                    sub_settings.text = "每次答题成功后可以获得一次开红包机会";
                }
            }

            commonComplete({
                "imgUrl": sub_settings.imgUrl,
                "h4Text": sub_settings.h4Text,
                "text": sub_settings.text,
                "showBtn": true,
                "btnText": sub_settings.transferCompleteName,
                "blank": false,
                "audit": sub_settings.audit,
                "buy_app_active":{'m_lucky_id': options.m_lucky_id, 'vcode':options.vcode},
                "btnFn": function() {
                    pluginCenter.transferCompleteFn(options);
                }
            });
        };

        // 成功页面按钮触发函数
        pluginCenter.transferCompleteFn = function(options){
            if (settings.type == "lucky_money"){
                pluginCenter.historyRecordList(settings.plugin_pid);
            }
        };

        pluginCenter.wxSigninEnable = function(obj) {
            $.ajax({
                "url": "/plugin/ajax/relation/",
                "type": "POST",
                "data": {
                    '_xsrf': getCookie('_xsrf'),
                    'plugin_name': settings.type,
                    'project_id': obj.pid
                },
                "async": false,
                success: function(data) {
                    var result = JSON.parse(data);
                    if (result.info) {
                        alert(result.info);
                    } else {
                        $.ajax({
                            "url": "/edit/ajax/signin_question_create/" + obj.pid + "/",
                            "type": "POST",
                            "dataType": "json",
                            "async": false,
                            "data": {
                                'pid': obj.pid,
                                '_xsrf': getCookie('_xsrf')
                            },
                            success: function(data) {
                                if (data.status == '200') {
                                    obj.q_wx_signin_datetime_id = data.q_wx_signin_datetime_id;
                                    obj.q_wx_signin_status_id = data.q_wx_signin_status_id;
                                    pluginCenter.wxSigninComplete(obj);
                                }
                            }
                        });
                    }
                }
            });
        };

        //此处原有pluginCenter的appPaid函数，用来实现应用的单独购买。现在不再有单独购买的应用，已删除。

        pluginCenter.wxSigninComplete = function(data) {
            var pid = data.pid;
            var headStr = '<h2>微信签到应用已启用</h2><div class="tip">用户必须通过微信填写表单，使用微信扫一扫 [ 签到二维码 ] 完成签到<br/>系统已默认开启“用户只能通过微信填写”，可在“签到设置”中修改</div>';
            
            //后台获取当前项目的签到人数、填写人数和项目类型（表单、问卷、测评）
            var signinNum = data.wxsignin_count,
                formFillinNum = data.rspd_count,
                p_type = '表单';
            var wxSigninCompleteStr = '' +
                '<div class="domain_complete wx_signin_complete">' +
                '<div class="content_wrap">' +
                '<div class="head_info">' +
                headStr +
                '</div>' +
                '<div class="module_list">' +
                '<div class="module">' +
                '<a class="btn_default btn_wx_signin_record">签到记录</a>' +
                '<p>当前扫码签到人数：<span class="red">' + signinNum + '</span></p>' +
                '<p>当前' + p_type + '填写人数：<span class="red">' + formFillinNum + '</span></p>' +
                '</div>' +
                '<div class="module">' +
                '<a class="btn_default btn_wx_signin_ewm">签到二维码</a>' +
                '<p>将签到二维码置于活动会场</p>' +
                '<p>用户通过微信扫码完成签到</p>' +
                '</div>' +
                '<div class="module">' +
                '<a class="btn_default btn_wx_signin_set">签到设置</a>' +
                '<p>设置微信答题</p>' +
                '<p>设置签到截止时间</p>' +
                '<p class="wx_settings_tip"></p>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';

            pluginCenter.showChildWrap(settings.info.title, wxSigninCompleteStr);
            var $wxSigninComplete = $showChildWrap.find('.wx_signin_complete');

            $wxSigninComplete.on("click", ".btn_renew", function(){
                var options = {
                    "is_renew": true,
                    "prevStepFun": function() {
                        pluginCenter.wxSigninComplete(data);
                    }
                };
                settings.project_single_id = pid;
                sessionStorage.isRenew = JSON.stringify(data);
            });

            $wxSigninComplete.on("click", ".btn_wx_signin_record", function() {
                pluginCenter.wxSigninRecord(data);
            });

            $wxSigninComplete.on("click", ".btn_wx_signin_ewm", function() {
                $.ajax({
                    "url": "/plugin/ajax/get_matrix_url/",
                    "type": "GET",
                    "dataType": "text",
                    "async": false,
                    "data": {
                        pid: pid
                    },
                    success: function(data) {
                        var wxSigninewmBox = new jsbox({
                            onlyid: "wxSigninewmBox",
                            title: '签到二维码',
                            conw: 425,
                            conh: 272,
                            FixedTop: 220,
                            Fun: showWxSigninewmBox,
                            range: true,
                            mack: true
                        }).show();

                        function showWxSigninewmBox(id) {
                            //console.log(pid, data);
                            var ewmBoxStr = '<div class="ewmBox"><p>选择适合尺寸的签到二维码</p><div class="clearfix"><div class="img_box">' +
                                '<img src="/images/get_matrix_img?survey_url=' + data + '&box_size=5" width="140"/>' +
                                '</div><div class="down_box">' +
                                '<a class="btn_download" onclick="downloadMatrixSignin(8,\'' + pid + '\',\'' + data + '\')"><i></i>小尺寸 [280px边长]</a>' +
                                '<a class="btn_download" onclick="downloadMatrixSignin(15,\'' + pid + '\',\'' + data + '\')"><i></i>中尺寸 [525px边长]</a>' +
                                '<a class="btn_download" onclick="downloadMatrixSignin(30,\'' + pid + '\',\'' + data + '\')"><i></i>大尺寸 [1050px边长]</a></div></div></div>';
                            $('#' + id + ' .loaddiv').html(ewmBoxStr);
                        }
                    }
                });
            });

            $wxSigninComplete.on("click", ".btn_wx_signin_set", function() {
                var wxSigninSetBox = new jsbox({
                    onlyid: "wxSigninSetBox",
                    title: '签到设置',
                    conw: 490,
                    conh: 310,
                    FixedTop: 200,
                    Fun: getWxSigninSetBosInfo,
                    range: true,
                    mack: true
                });
                wxSigninSetBox.show();

                function getWxSigninSetBosInfo(id) {
                    $.ajax({
                        "url":"/plugin/ajax/get_setting/",
                        "type":"POST",
                        "dataType": "json",
                        "async": false,
                        "data": {project_id:pid, plugin_name:settings.type, _xsrf:getCookie('_xsrf')},
                        success:function(data){
                            if(data.status=='200'){
                                showWxSigninSetBox(id, data);
                            }
                        }
                    });
                }

                function showWxSigninSetBox(id, custom_attr) {
                    var wxSigninSetBoxStr = '<div class="wxSigninSetBox"><div class="mod"><h3>微信设置</h3><div><label>' +
                        '<input type="checkbox" class="is_weixin_rspd_only" id="" />用户只能通过微信填写<span class="set_tip">（用户不通过微信填写，无法完成签到）</span></label><a class="cj_tip wx_signin_tip"></a></div></div>' +
                        '<div class="mod"><h3>签到时间设置</h3>' +
                        '<label><input type="checkbox" class="input_switch close_weixin_signin" id="" />立即关闭签到（用户签到显示签到失败）</label>' +
                        '<label class="set_wxsign_time"><input type="checkbox" class="input_switch" id="" />设定签到截止时间<input type="text" id="send_timeInput" readonly="readonly" /><i class="ico_date"></i></label></div></div>' +
                        '<div class="WJButton wj_blue fr" id="btn_wx_signin_set">保存</div>';
                    $('#' + id + ' .loaddiv').html(wxSigninSetBoxStr);
                    jeDate.skin("gray");
                    var jsTip = new JsTip();
                    $('.wx_signin_tip').on({
                        "mouseover": function() {
                            jsTip.show({
                                type: 'bottom',
                                obj: $(this),
                                pyleft: -94,
                                pytop: 0,
                                width: '190px',
                                TColor: '#fff',
                                BaColor: 'rgba(0,0,0,0.7)',
                                BoColor: 'rgba(0,0,0,0.1)',
                                data: '<p>微信签到是依赖微信用户信息实现，如果不通过微信答题，无法获取微信用户信息</p>',
                                zIndex: 9999906
                            });
                        },
                        "mouseout": function() {
                            jsTip.del();
                        }
                    });

                    $("#send_timeInput,.ico_date").click(function() {
                        jeDate({
                            dateCell: '#send_timeInput',
                            format: 'YYYY-MM-DD hh:mm:ss',
                            minDate: jeDate.now(0),
                            isTime: true,
                            zIndex: 9999906,
                            top: 69,
                            choosefun: function(val) {
                                $('.set_wxsign_time').find('.error').remove();
                                $('.input_switch').prop("checked", true);
                                $('.close_weixin_signin').prop("checked", false);
                            }
                        });
                    });

                    if (custom_attr.is_weixin_rspd_only) {
                        $('.is_weixin_rspd_only').prop('checked', true);
                    }
                    if (custom_attr.close_weixin_signin) {
                        $('.close_weixin_signin').prop('checked', true);
                    }
                    if (custom_attr.close_weixin_signin_time) {
                        $('#send_timeInput').val(custom_attr.close_weixin_signin_time);
                        $('#send_timeInput').prev('.input_switch').prop('checked', true);
                    }

                    $('.is_weixin_rspd_only').click(function() {
                        if ($(this).prop("checked") != true) {
                            $(this).siblings(".set_tip").addClass('red');
                        } else {
                            $(this).siblings(".set_tip").removeClass('red');
                        }
                    });

                    $('.input_switch').click(function() {
                        if ($(this).prop("checked") == true) {
                            $('.input_switch').prop("checked", false);
                            $(this).prop("checked", true);
                            if ($(this).hasClass('close_weixin_signin')) {
                                $('#send_timeInput').val('');
                                $('#send_timeInput').siblings('.error').remove();
                            }
                        } else {
                            $(this).prop("checked", false);
                            if (!$(this).hasClass('close_weixin_signin')) {
                                $('#send_timeInput').val('');
                                $('#send_timeInput').siblings('.error').remove();
                            }
                        }
                    });

                    $('#btn_wx_signin_set').click(function() {
                        if ($('.set_wxsign_time').find('.input_switch').prop("checked") == true) {
                            if ($('#send_timeInput').val() == '') {
                                $('.set_wxsign_time').find('.error').remove();
                                $('.set_wxsign_time').append('<span class="error">请选择签到截止日期</span>');
                            }
                        } else {
                            $('#send_timeInput').parents('label').find('.error').remove();
                        }
                        if ($('.wxSigninSetBox').find('.error').length == 0) {
                            //后端发请求，保存微信设置
                            var is_weixin_rspd_only = $('.is_weixin_rspd_only').is(':checked') ? 'on' : '';
                            var close_weixin_signin = $('.close_weixin_signin').is(':checked') ? 'on' : '';
                            $.ajax({
                                "url":"/plugin/ajax/update_setting/",
                                "type":"POST",
                                "dataType": "json",
                                "async": false,
                                "data": {
                                    project_id:pid,
                                    plugin_name:settings.type,
                                    is_weixin_rspd_only:is_weixin_rspd_only,
                                    close_weixin_signin:close_weixin_signin,
                                    close_weixin_signin_time:$('#send_timeInput').val(),
                                    _xsrf:getCookie('_xsrf')
                                },
                                success: function(data) {
                                    if (data.status == '200') {
                                        wxSigninSetBox.remove();
                                    }
                                }
                            });
                        }
                    });
                }
            });
        };

        pluginCenter.wxSigninUpdateRecord = function(pid, options) {
            wxSigninUpdateRecordFun(pid, settings.info.oid, options);
        };

        pluginCenter.wxSigninRecord = function(data, isFullScreen) {
            //静态数据，需要后台获取
            var version = data.version;
            var q_wx_signin_datetime_id = data.q_wx_signin_datetime_id;
            var q_wx_signin_status_id = data.q_wx_signin_status_id;
            var pid = data.pid;
            var _download_status = parseInt($('#_download_status').val());
            var downloadStatusStr = "导出";
            if (_download_status) downloadStatusStr = "处理中";

            var wxSigninRecordStr = '' +
                '<div class="wx_signin_record">' +
                '<div class="FilterList"></div>' +
                '<div class="formMenu">' +
                '<div class="fmL">' +
                '<div title="选择显示字段" class="showRow fmLb"></div>' +
                '<div title="选择显示字段" class="Filter_form fmLb"></div>' +
                '<div title="全屏显示" class="Enlarge_form fmLb"></div>' +
                '<div class="operate" name="czsel">' +
                '<span>操作</span>' +
                '<div class="arrowup">' +
                '<div class="arrowupt"></div>' +
                '</div>' +
                '</div>' +
                '<a class="btn_default_white btn_according_signin_type">签到状态筛选</a>' +
                '<a class="btn_default_white btn_export">' + downloadStatusStr + '</a>' +
                '<a class="btn_default_white btn_share">分享</a>' +
                '</div>' +
                '<a class="wx_signin_back">返回</a>' +
                '</div>' +
                '<form id="get_report_info" pid="' + pid + '" style="display:none" action="/report/ajax/report_info/?pid=' + pid + '" method="POST" callback="get_report_info_callback"  >' +
                '<input type="hidden" name="project_id" value="' + pid + '">' +
                '<input type="hidden" name="version" value="' + version + '">' +
                '<input type="hidden" name="info_type">' +
                '<input type="hidden" name="data">' +
                '<input type="hidden" name="filter_type">' +
                '<input type="hidden" name="_xsrf">' +
                '</form>' +
                '<div class="record_table"></div>' +
                '</div>';
            pluginCenter.showChildWrap(settings.info.title, wxSigninRecordStr);
            var $wxSigninRecord = $showChildWrap.find(".wx_signin_record");
            if (isFullScreen) {
                $showChildWrap.find(".head_title").hide();
                $(".dialog_application").addClass('fullScreen');
                var it_num = idyC.getUrlQuery("it_num");
                var page = idyC.getUrlQuery("page");
                var options = {
                    'it_num': it_num,
                    'page': page
                };
                pluginCenter.wxSigninUpdateRecord(data.pid, options);
            } else {
                //非全屏时，数据显示为10条/页
                var options = {
                    'it_num': 10
                };
                pluginCenter.wxSigninUpdateRecord(data.pid, options);
            }

            //后台获取当前项目的答题数据量和筛选数据量
            var rspd_count = parseInt($('#_rspd_count').val());
            var rspd_count_filter = parseInt($('#_rspd_count_filter').val());

            $wxSigninRecord.on("click", ".showRow", function() {
                jsBubbleConfig({
                    obj: $(this),
                    ajax: true,
                    fun: showRowdata,
                    url: '/report/ajax/report_info/?info_type=get_form_data_display&version=' + version + '&project_id=' + pid + '&pid=' + pid,
                });
            });
            //筛选菜单列表点击事件
            $('.Rowdata li').live('click', function() {
                var Qid = $(this).attr('Qid');
                var Table = $('.record_table');
                var index = $('thead tr td', Table).index($('#' + Qid));
                var isStatus = $(this).is('.form_selected');
                var status = 0;
                if (isStatus) {
                    status = 0;
                    $(this).removeClass('form_selected');
                    $('tr', Table).each(function() {
                        $('td:eq(' + index + ')', $(this)).hide();
                    });
                } else {
                    status = 1;
                    $(this).addClass('form_selected');
                    $('tr', Table).each(function() {
                        $('td:eq(' + index + ')', $(this)).show();
                    });
                }
                //与后台进行交互，记录显示隐藏值
                $("#get_report_info input[name='info_type']").val('form_display_attr');
                var param = new Object();
                param.q_id = $(this).attr("qid");
                param.q_title = $(this).children()[0].innerText;
                param.status = status;
                var param_str = JSON.stringify(param);
                $("#get_report_info input[name='data']").val(param_str);
                $("#get_report_info input[name='_xsrf']").val(getCookie('_xsrf'));
                ajaxSubmit($("#get_report_info"));
            });
            //生成筛选菜单
            $('.Filter_form').click(function() {
                var FilterList = {
                    "result": [{
                        "q_title": "按回答筛选",
                        "q_id": "AccordingToFilter"
                    }, {
                        "q_title": "按答卷时间筛选",
                        "q_id": "AccordingTodate"
                    }, {
                        "q_title": "按编辑时间筛选",
                        "q_id": "AccordingToEdit"
                    }, {
                        "q_title": "按签到时间筛选",
                        "q_id": "AccordingToSigninTime"
                    }]
                }
                jsBubbleConfig({
                    obj: $(this),
                    fun: Filterdata,
                    jsonData: FilterList
                });
            });
            //过滤菜单列表点击事件
            $('.Filterdata li').live('click', function() {
                var Qid = $(this).attr('Qid');
                var filterByDateBox;
                if (Qid == "AccordingToFilter") {
                    jsboxConfig('回答筛选', '/report/ajax/report_page/?info_type=filter_by_content&parent_page=form_data_list&version=' + version + '&project_id=' + pid + '&pid=' + pid);
                } else if (Qid == "AccordingTodate") {
                    filterByDateBox = new jsbox({
                        onlyid: "AccordingTodate",
                        title: '时间筛选',
                        conw: 520,
                        conh: 380,
                        FixedTop: 80,
                        Fun: showDate,
                        range: true,
                        mack: true
                    });
                    filterByDateBox.show();
                } else if (Qid == "AccordingToEdit") {
                    jsboxConfig('按编辑时间筛选', '/report/ajax/report_page/?info_type=filter_by_version&parent_page=form_data_list&project_id=' + pid + '&pid=' + pid, 600);
                } else if (Qid == "AccordingToSigninTime") {
                    jsboxConfig('按签到时间筛选', '/report/ajax/report_page/?info_type=q_type_filter_page&parent_page=form_data_list&project_id=' + pid + '&pid=' + pid + '&question_id=' + q_wx_signin_datetime_id + '&version=' + version);
                }
                $(this).parents('.jsBubble_s').remove();

                //时间筛选内容输出
                function showDate(id) {
                    var dat = new Date();
                    var date_str = dat.getFullYear() + '-' + (dat.getMonth() * 1 + 1) + '-' + dat.getDate();
                    $('#' + id + ' .loaddiv').html('<div class="datebox"><input class="DateStart" type="hidden" value="' + date_str + '" /><input class="DateEnd" type="hidden" value="' + date_str + '" /><div class="datecon_s"></div><div class="datecon_e"></div></div><div class="WJButton wj_blue fr" id="filter_by_date" >保存</div>');
                    setTimeout(function() {
                        $('.DateStart').Zebra_DatePicker({
                            show_week_number: '周',
                            pair: $('.DateEnd'),
                            show_clear_date: 1,
                            always_visible: $('#' + id + ' .loaddiv .datecon_s')
                        });
                        $('.DateEnd').Zebra_DatePicker({
                            show_week_number: '周',
                            show_clear_date: 1,
                            always_visible: $('#' + id + ' .loaddiv .datecon_e')
                        });
                    }, 100);

                    $('#datepicker-example7-end').Zebra_DatePicker({
                        direction: 1
                    });
                }
                $("#filter_by_date").die().live('click', function(event) {
                    var param = new Object();
                    param.date_inteval = $('.DateStart').val() + ',' + $('.DateEnd').val();
                    if ($('.DateStart').val() == '' || $('.DateEnd').val() == '') {
                        loadMack({
                            'str': '请选择开始时间和结束时间',
                            'timer': 1500
                        });
                        return;
                    }
                    param_str = JSON.stringify(param);
                    $("#get_report_info input[name='filter_type']").val(3);
                    $("#get_report_info input[name='info_type']").val('update_filter_condition');
                    $("#get_report_info input[name='data']").val(param_str);
                    $("#get_report_info input[name='_xsrf']").val(getCookie('_xsrf'));
                    ajaxSubmit($("#get_report_info"));
                    filterByDateBox.remove();
                });
            });
            //操作
            $wxSigninRecord.on("click", ".operate", function() {
                var addGroup = {
                    "type": "5",
                    "data": [{
                        "id": 2093596143,
                        "name": "改为已签到",
                        "url": "javascript:;"
                    }, {
                        "id": 2093596144,
                        "name": "改为未签到",
                        "url": "javascript:;"
                    }]
                };
                var jsMenu = new JsMenu();
                jsMenu.main($(this), addGroup, 'href', 0, 12, '', 9999906);
                return false;
            });
            $('.menu_a').die().live('click', function() {
                var obj = $(this).parents('ul.JsMenu');
                var type = obj.attr('type');
                var text = $(this).text();
                if (type == 5) {
                    var seq_list = '';
                    var signin_seqs = '';
                    $('.record_table tbody tr td:first-child input').each(function() {
                        if ($(this).attr('checked') == 'checked') {
                            seq_list += $(this).attr('id') + ';';
                        }
                    });
                    $('.wx_signin_col').each(function() {
                        if ($(this).find('span').text() == '已签到') {
                            signin_seqs += $(this).attr('seq') + ';';
                        }
                    });
                    if (seq_list == "") {
                        loadMack({
                            'str': '请选择数据',
                            'timer': 1500
                        });
                        return;
                    }

                    var data = {};
                    if (text == "改为已签到") {
                        data['wx_signin_status'] = '已签到'
                    } else {
                        data['wx_signin_status'] = '未签到'
                    }
                    data['seq_list'] = seq_list;
                    data['signin_seqs'] = signin_seqs; //后台需要已签到的rid列表
                    loadMack({
                        'str': '加载中...',
                        'timer': 2000
                    });
                    ajaxPost("/report/wx_signin_status_change/" + pid, data, function(ret) {
                        if (ret.errmsg) {
                            $('.loadCon,.loadMack').remove();
                            loadMack({
                                'str': '参数错误',
                                'timer': 1500
                            });
                            return;
                        } else {
                            //后端加载更新后的数据
                            pluginCenter.wxSigninUpdateRecord(pid);
                        }
                    });
                }
            });

            function del_data() {
                var seq_list = '';
                $('.record_table tbody tr td:first-child input').each(function() {
                    if ($(this).attr('checked') == 'checked') {
                        seq_list += $(this).attr('id') + ';';
                    }
                });
                seq_list = seq_list.substring(0, seq_list.length - 1);
                //执行删除数据(后台)
                alert("你要删除的数据id为：" + seq_list)
            }
            //签到状态筛选
            $wxSigninRecord.on("click", ".btn_according_signin_type", function() {
                jsboxConfig('按签到状态筛选', '/report/ajax/report_page/?info_type=q_type_filter_page&parent_page=form_data_list&project_id=' + pid + '&pid=' + pid + '&question_id=' + q_wx_signin_status_id + '&version=' + version);
            });

            //导出提示
            var jsTip = new JsTip();
            $wxSigninRecord.on({
                "click": function() {
                    if (rspd_count == 0 || rspd_count_filter == 0) {
                        loadMack({
                            'str': '没有数据可下载',
                            'timer': 1500
                        });
                        return;
                    }
                    if (rspd_count > 3000) {
                        $("#div_download_data").text('处理中');
                    }
                    ajaxSubmit($("#export_form_csv_deal"));
                },
                "mouseover": function() {
                    jsTip.show({
                        type: 'right',
                        obj: $(this),
                        pyleft: -0,
                        pytop: -4,
                        width: '240px',
                        TColor: '#fff',
                        BaColor: 'rgba(0,0,0,0.7)',
                        BoColor: 'rgba(0,0,0,0.1)',
                        data: '<p>迅雷等第三方下载工具下载可能存在问题，建议使用浏览器自带下载功能</p>',
                        zIndex: 9999906
                    });
                },
                "mouseout": function() {
                    jsTip.del();
                }
            }, ".btn_export");
            //分享
            $wxSigninRecord.on("click", ".btn_share", function() {
                var fx = new jsbox({
                    onlyid: "EditTcc",
                    conw: 430,
                    conh: 230,
                    title: "分享图表",
                    range: true,
                    url: '/report/share_setting/' + pid + '/?pid=' + pid,
                    loads: true,
                    mack: true
                }).show();
                setTimeout(function() {
                    $('.loaddiv').css('line-height', '30px');
                }, 300);
            });
            //全屏显示
            $wxSigninRecord.on("click", ".Enlarge_form", function() {
                var url = location.href;
                window.open(url + '&fullScreenPanel=wxSigninRecord&pid=' + pid + '&it_num=20&page=1&version=' + version + '&q_wx_signin_datetime_id=' + q_wx_signin_datetime_id + '&q_wx_signin_status_id=' + q_wx_signin_status_id);
            });
            //返回
            $wxSigninRecord.on("click", ".wx_signin_back", function() {
                // 返回需要更新控制台签到数据
                $.ajax({
                    "url": "/report/ajax/get_signin_info/",
                    "type": "POST",
                    "dataType": "json",
                    "async": false,
                    "data": {
                        pid: pid,
                        _xsrf: getCookie('_xsrf')
                    },
                    success: function(data) {
                        pluginCenter.wxSigninComplete(data);
                    }
                });
            });
            //全选
            $wxSigninRecord.on("click", ".selectall", function() {
                $('[name=contact_id]:checkbox').attr("checked", this.checked);
            });
            $wxSigninRecord.on("click", "[name=contact_id]:checkbox", function() {
                var $tmp = $('[name=contact_id]:checkbox');
                $(".selectall").attr('checked', $tmp.length == $tmp.filter(':checked').length);
            });
        };

        pluginCenter.wxSigninRecordList = function(pid) {
            //获取data数据
            $.ajax({
                "url": "/report/ajax/get_signin_info/",
                "type": "POST",
                "dataType": "json",
                "async": false,
                "data": {
                    pid: pid,
                    _xsrf: getCookie('_xsrf')
                },
                success: function(data) {
                    pluginCenter.wxSigninComplete(data);
                }
            });
        };

        pluginCenter.setMobileList = function(pid) {
            // 获取联系人分组
            var group_info = {
                'all': '全部联系人',
                'default': '未分组联系人'
            };
            var response = JSON.parse($.ajax({
                'url': '/contact/group/list/',
                'data': {
                    '_xsrf': getCookie('_xsrf')
                },
                'type': 'POST',
                'async': false
            }).responseText);
            $.extend(group_info, response.info);
            var groupListStr = '';

            for (var group_id in group_info) {
                groupListStr += '<div class="MailUserGroup" gid="' + group_id + '"><i class="Mico_on"></i>' + group_info[group_id] + '<a class="addMailinfo" href="javascript:;">整组添加</a></div><ul></ul><div class="Loading_Mli" style="display: none;"></div>'
            }

            var setMobileListStr = '<div class="set_mobileList">' +
                '<div class="respondents">' +
                '<div class="MailEnterRight" onselectstart="return false">' +
                '<div class="MailEnterRight_Con">' +
                '<div class="Mtop">' +
                '<div class="Mtop_t">联系人 <a class="" href="/contact/list" target="_blank">管理</a></div>' +
                '</div>' +
                '<div class="Msoso"><input placeholder="搜索联系人" type="text"/></div>' +
                '<div class="Mcon">' +
                '<div class="Msoso_con">' +
                '<div class="MailUserList">' +
                '<ul></ul>' +
                '<div class="Loading_Mli" style="display: none;"></div>' +
                '</div>' +
                '</div>' +
                '<div class="MailUserList thisGroupList">' +
                groupListStr +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="MailEnterLeft">' +
                '<div id="MailCon" class="MailCon"></div>' +
                '<div class="tip_txt">' +
                '<p>在此添加名单，添加方法：</p>' +
                '<p>1，您可以从左侧联系人列表中整组添加，或单个添加。</p>' +
                '<p>2，批量粘贴“手机号，姓名（非必填）”，每行代表一条名单。示例：15216718888,Jack</p>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="btn_save_wrap">' +
                '<div class="txt">共添加联系人 <span id="Mun">0</span>个，<span id="errorMun">0</span>个联系人手机格式错误</div>' +
                '<a href="javascript:;" class="WJButton wj_blue btn_saveMobile">保存</a>' +
                '</div>' +
                '</div>';
            pluginCenter.showChildWrap('编辑名单', setMobileListStr);
            var $setMobileList = $showChildWrap.find('.set_mobileList');
            var $mailCon = $setMobileList.find("#MailCon");
            var $tipTxt = $setMobileList.find(".tip_txt");
            var mailUserList = new MailUserList();
            // 短信收件人输入框初始化
            mailSenderEdit = new MailSenderEdit($mailCon);
            $mailCon.selectable({
                filter: '.addMail',
                start: function() {
                    $mailCon.mouseup();
                }
            });

            // 如果已经保存过答题名单，显示该名单.
            var $oMark = new idyC.loading({text:'加载中','opacity':'0.1'});
            $oMark.open();
            setTimeout(function(){
                var query_result = JSON.parse($.ajax({'url': '/plugin/ajax/show_sms_roster/', 'data': {'project_id': pid, '_xsrf': getCookie('_xsrf')}, 'type': 'POST', 'async': false}).responseText);
                var roster_info = query_result.info;
                if (roster_info.length > 0) {
                    $tipTxt.remove(); //隐藏提示
                    // 添加已保存的名单.
                    var dataArr=[];
                    for(var i = 0; i < roster_info.length; i++){
                        //当姓名为空时，不加逗号，方便SmsSenderEdit.js里错误信息的判断
                        if(roster_info[i].name != ""){
                            dataArr.push('<div title="鼠标双击进行编辑" class="addMail" oldmail="'+roster_info[i].mobile+'" thisval="'+roster_info[i].mobile+','+roster_info[i].name+'"><span class="MailText">'+roster_info[i].mobile+'</span><span class="UserName">,'+roster_info[i].name+'</span></div>');
                        }else{
                            dataArr.push('<div title="鼠标双击进行编辑" class="addMail" oldmail="'+roster_info[i].mobile+'" thisval="'+roster_info[i].mobile+'"><span class="MailText">'+roster_info[i].mobile+'</span></div>');
                        }
                     }
                     var addMailListHtml = dataArr.join("");
                    mailSenderEdit.addMailList($mailCon, addMailListHtml);
                }
                $oMark.remove();
            }, 500);

            setObjContentWrap($setMobileList);
            $mailCon.on({
                'focus': function() {
                    $tipTxt.hide();
                },
                'blur': function(e) {
                    e.stopPropagation();
                    var firstycTextVal = $mailCon.find('.yc_text').eq(0).val();
                    var firstTextVal = $mailCon.find('.addMail').eq(0).attr('thisval');
                    if (firstycTextVal == "" && firstTextVal == undefined) {
                        $tipTxt.show();
                    } else {
                        $tipTxt.hide();
                    }
                }
            }, '.yc_text');
            $mailCon.on("blur", '.topInput', function() {
                var dataId = $(this).attr('data-id');
                if (dataId <= 0) {
                    $tipTxt.show();
                } else {
                    $tipTxt.hide();
                }
            });
            $tipTxt.on({
                'click': function() {
                    $tipTxt.hide();
                    $mailCon.trigger('mouseup');
                },
                'blur': function() {
                    $mailCon.trigger('blur');
                }
            });

            $setMobileList.find('.btn_saveMobile').click(function() {
                //保存手机号
                var $oMark = new idyC.loading({
                    text: '保存中',
                    'opacity': '0.1'
                });
                $oMark.open();
                var m = $(".MailCon .addMail").length;
                if (m < 1) {
                    $oMark.remove();
                    loadMack({
                        str: "请在编辑框内添加名单"
                    });
                    return false;
                }
                var $addMail = $("#MailCon").find(".addMail");
                if ($addMail.length > 0 && $("#MailCon .text_error").length == 0) {
                    //保存名单
                    var totalNum = $addMail.length;
                    if(Number(totalNum) > 10000){
                        $oMark.remove();
                        loadMack({str: "最多可导入10000个名单"});
                    }else{
                        setTimeout(function(){
                            var val = new Array();
                            $("#MailCon .addMail").each(function() {
                                val.push($(this).attr("thisval"));
                            });
                            // 保存答题手机名单
                            var sms_roster = val.join('|');
                            $.ajax({
                                "url": "/plugin/ajax/save_sms_roster/",
                                "type": "POST",
                                "data": {
                                    'project_id': pid,
                                    'sms_roster': sms_roster,
                                    '_xsrf': getCookie('_xsrf')
                                },
                                "dataType": "JSON",
                                "async": false,
                                success: function(data) {
                                    if (data.status == '200') {
                                        smstask_id = data.smstask_id;
                                        if (data.is_modify == 1) {
                                            var url = top.location.href;
                                            if (url.match(/setMobileList/)) {
                                                url = url.replace(/setMobileList/, 'historyRecordList');
                                                top.location.href = url;
                                            } else {
                                                $oMark.remove();
                                                pluginCenter.limiteMobileComplete(pid, data.is_modify);
                                            }
                                        } else {
                                            $.ajax({
                                                "url": "/plugin/ajax/relation/",
                                                "type": "POST",
                                                "data": {
                                                    '_xsrf': getCookie('_xsrf'),
                                                    'plugin_name': settings.type,
                                                    'project_id': pid
                                                },
                                                "async": false,
                                                success: function(data) {
                                                    var result = JSON.parse(data);
                                                    if (result.info) {
                                                        $oMark.remove();
                                                        alert(result.info);
                                                    } else {
                                                        $.ajax({
                                                            "url": "/plugin/ajax/update_setting/",
                                                            "type": "POST",
                                                            "data": {
                                                                '_xsrf': getCookie('_xsrf'),
                                                                'plugin_name': settings.type,
                                                                'project_id': pid,
                                                                'status': 1,
                                                                'sms_status': 1
                                                            },
                                                            "async": false,
                                                            success: function(data) {
                                                                var result = JSON.parse(data);
                                                                if (result.info) {
                                                                    $oMark.remove();
                                                                    alert(result.info);
                                                                } else {
                                                                    //限定手机广告位
                                                                    $("input[name=limit_mobile]", parent.document).prop('checked', true);
                                                                    var url = top.location.href;
                                                                    if (url.match(/setMobileList/)) {
                                                                        url = url.replace(/setMobileList/, 'historyRecordList');
                                                                        top.location.href = url;
                                                                    } else {
                                                                        $oMark.remove();
                                                                        pluginCenter.limiteMobileComplete(pid, data.is_modify);
                                                                    }
                                                                }
                                                            }
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                    }
                                }
                            });
                        },200);
                    }
                }else {
                    $oMark.remove();
                    loadMack({str: "手机格式错误"});
                }
            });
        };

        pluginCenter.limiteMobileComplete = function(pid, is_modify) {
            var expire_time;

            // 获取已保存的名单人数
            var query_roster_lenth = JSON.parse($.ajax({
                'url': '/plugin/ajax/roster_length/',
                'type': 'POST',
                'data': {
                    'project_id': pid,
                    '_xsrf': getCookie('_xsrf')
                },
                'async': false
            }).responseText);
            var totalNum = query_roster_lenth.roster_length;

            var status = 1,
                sms_status = 1, //手机限制开关和短信验证开关默认开启
                mobile_unique = false;  // 每个手机号只能提交一次是否开启，默认关闭
            var set_info = JSON.parse($.ajax({
                url: '/plugin/ajax/get_setting/',
                type: 'POST',
                data: {
                    'plugin_name': pluginName,
                    'project_id': pid,
                    '_xsrf': getCookie('_xsrf')
                },
                async: false
            }).responseText);
            expire_time = set_info.expire_date;
            if (is_modify == 1) {
                status = set_info.status;
                sms_status = set_info.sms_status;
                mobile_unique = set_info.mobile_unique;
            }
            var completeStr = '' +
                '<div class="limite_mobile_complete">' +
                '<div class="content_wrap">' +
                '<div class="head_info">' +
                '<h2>此应用<span class="state_txt">已开启</span><span class="btn_switch btn_app_switch open"></span></h2>' +
                '<div class="tip">答题前输入手机号，验证通过后开始答题</div>' +
                '</div>' +
                '<div class="module_list">' +
                '<div class="module">' +
                // '<div class="state_title">短信验证<span class="state_txt">已关闭</span><span class="btn_switch btn_sms_switch"></span></div>' +
                '<label for="sms_verification"><i class="ico_checkbox"></i><input type="checkbox" id="sms_verification">开启短信验证</input></label>' +
                '<p>短信余额：<span class="blue" id="smsRemainder"></span> 条   <a target="_blank" href="/member/buysms" class="btn_buy_sms">购买短信</a></p>' +
                '</div>' +
                '<div class="module">' +
                '<label for="data_unique"><i class="ico_checkbox"></i><input type="checkbox" id="data_unique">每个手机号只能提交一次</input></label>' +
                '</div>' +
                '<div class="module">' +
                '<a class="btn_default btn_revise_namelist">修改名单</a>' +
                '<p>已添加名单：<span class="blue">' + totalNum.toString() + '</span> 条</p>' +
                '</div>' +
                /*'<div class="module">' +
                '<a class="btn_default btn_renew">充值续费</a>' +
                '<p>截止日期：<span class="blue">' + expire_time + '</span></p>' +
                '</div>' +*/
                '</div>' +
                '</div>' +
                '</div>';
            pluginCenter.showChildWrap(settings.info.title, completeStr);
            var $limiteMobileComplete = $showChildWrap.find('.limite_mobile_complete');
            var $smsRemainder = $limiteMobileComplete.find('#smsRemainder');
            var $btnAppSwitch = $limiteMobileComplete.find('.btn_app_switch');
            var $btnSmsSwitch = $limiteMobileComplete.find('#sms_verification');
            var $btnDataUnique = $limiteMobileComplete.find('#data_unique');
            var $labelSmsSwitch = $btnSmsSwitch.parent();
            var $labelDataUnique = $btnDataUnique.parent();
            var $switchTip = $limiteMobileComplete.find('.tip');
            var $btnBuySms = $limiteMobileComplete.find('.btn_buy_sms');

            // 获取当前的短信余额
            var query_sms_quota = JSON.parse($.ajax({
                'url': '/plugin/ajax/sms_quota/',
                'type': 'POST',
                'data': {
                    '_xsrf': getCookie('_xsrf')
                },
                'async': false
            }).responseText);
            var SMSRemainderNum = query_sms_quota.sms_quota;
            $smsRemainder.text(SMSRemainderNum);
            if (SMSRemainderNum == 0) {
                $btnSmsSwitch.attr('disabled', true);
                $labelSmsSwitch.removeClass('active');
                $btnBuySms.addClass('red');
                $smsRemainder.attr({
                    'class': 'red'
                });
            } else {
                $smsRemainder.attr({
                    'class': 'blue'
                });
            }

            var btnAppSwitchFlag = false; //默认开关可点击
            if (localStorage.mobileAppSwitch) {
                var nowTime = new Date().getTime();
                //点过一次之后10m之后才可以再次点击
                if (nowTime - localStorage.mobileAppSwitch > 10000) {
                    btnAppSwitchFlag = false;
                } else {
                    btnAppSwitchFlag = true;
                }
            }

            $btnAppSwitch.click(function() {
                //如果是第二次点击，判断点击间隔时间
                if (btnAppSwitchFlag) {
                    var nowTime = new Date().getTime();
                    if (nowTime - localStorage.mobileAppSwitch > 10000) {
                        btnAppSwitchFlag = false;
                    } else {
                        loadMack({
                            'str': '间隔时间过短，请稍后再试',
                            'timer': 1500
                        });
                        return;
                    }
                }
                btnAppSwitchFlag = true;
                localStorage.mobileAppSwitch = new Date().getTime();

                if ($btnAppSwitch.hasClass('btn_disabled')) return;
                var $btnSwitch, $stateTxt;
                if ($btnSmsSwitch.hasClass('btn_disabled')) {
                    $btnSwitch = $(this);
                    $stateTxt = $btnSwitch.siblings('.state_txt');
                } else {
                    $btnSwitch = $('.btn_switch');
                    $stateTxt = $('.state_txt');
                }
                if ($btnSwitch.hasClass('open')) {
                    $btnSwitch.removeClass('open');
                    $stateTxt.text('已关闭').removeClass('blue');
                    $switchTip.text('答题前不验证手机号，直接进入答题');
                    $.ajax({
                        url: '/plugin/ajax/update_setting/',
                        'type': 'POST',
                        data: {
                            '_xsrf': getCookie('_xsrf'),
                            'plugin_name': settings.type,
                            'project_id': pid,
                            'status': 0,
                            'sms_status': 0
                        },
                        async: false
                    });
                    $btnSmsSwitch.prop('checked', false).attr('disabled', true);
                    $btnDataUnique.prop('checked', false).attr('disabled', true);
                    $labelSmsSwitch.removeClass('active');
                    $labelDataUnique.removeClass('active');
                    //限定手机广告位
                    $("input[name=limit_mobile]", parent.document).prop('checked', false);
                } else {
                    $btnSwitch.addClass('open');
                    $stateTxt.text('已开启').addClass('blue');
                    $switchTip.text('答题前输入手机号，验证通过后开始答题');
                    $.ajax({
                        url: '/plugin/ajax/update_setting/',
                        'type': 'POST',
                        data: {
                            '_xsrf': getCookie('_xsrf'),
                            'plugin_name': settings.type,
                            'project_id': pid,
                            'status': 1,
                            'sms_status': 1
                        },
                        async: false
                    });
                    $btnSmsSwitch.prop('checked', true).attr('disabled', false);
                    $btnDataUnique.prop('disabled', false);
                    $labelSmsSwitch.addClass('active');
                    $labelDataUnique.removeClass('active');
                    //限定手机广告位
                    $("input[name=limit_mobile]", parent.document).prop('checked', true);
                }
            });
            $btnSmsSwitch.click(function() {
                var $this = $(this);
                if ($this.hasClass('btn_disabled') || !$btnAppSwitch.hasClass('open')) return;
                if (!$this.prop("checked")) {
                    $this.prop("checked", false);
                    $labelSmsSwitch.removeClass('active');
                    $.ajax({
                        url: '/plugin/ajax/update_setting/',
                        'type': 'POST',
                        data: {
                            '_xsrf': getCookie('_xsrf'),
                            'plugin_name': settings.type,
                            'project_id': pid,
                            'sms_status': 0
                        },
                        async: false
                    });
                } else {
                    $this.prop("checked", true);
                    $labelSmsSwitch.addClass('active');
                    $.ajax({
                        url: '/plugin/ajax/update_setting/',
                        'type': 'POST',
                        data: {
                            '_xsrf': getCookie('_xsrf'),
                            'plugin_name': settings.type,
                            'project_id': pid,
                            'sms_status': 1
                        },
                        async: false
                    });
                }
            });
            $btnDataUnique.click(function() {
                var $this = $(this);
                if ($this.hasClass('btn_disabled') || !$btnAppSwitch.hasClass('open')) return;
                if (!$this.prop("checked")) {
                    $this.prop("checked", false);
                    $labelDataUnique.removeClass('active');
                    $.ajax({
                        url: '/plugin/ajax/update_setting/',
                        'type': 'POST',
                        data: {
                            '_xsrf': getCookie('_xsrf'),
                            'plugin_name': settings.type,
                            'project_id': pid,
                            'mobile_unique': 'off'
                        },
                        async: false
                    });
                } else {
                    $this.prop("checked", true);
                    $labelDataUnique.addClass('active');
                    $.ajax({
                        url: '/plugin/ajax/update_setting/',
                        'type': 'POST',
                        data: {
                            '_xsrf': getCookie('_xsrf'),
                            'plugin_name': settings.type,
                            'project_id': pid,
                            'mobile_unique': 'on'
                        },
                        async: false
                    });
                }
            });
            if (status == 0) {
                closeSwitch($btnAppSwitch);
                $btnSmsSwitch.prop('checked', false).attr('disabled', true);
                $btnDataUnique.prop('checked', false).attr('disabled', true);
                $labelSmsSwitch.removeClass('active');
                $labelDataUnique.removeClass('active');
            } else if (status == 1) {
                if (sms_status == 0) {
                    $btnSmsSwitch.prop('checked', false);
                    $labelSmsSwitch.removeClass('active');
                } else {
                    //短信余额大于0，并且应用开启时，开启短信验证
                    if (SMSRemainderNum > 0 && $btnAppSwitch.hasClass('open')) {
                        $btnSmsSwitch.prop('checked', true).attr('disabled', false);
                        $labelSmsSwitch.addClass('active');
                    }
                }
                // 判断 每个手机号只能提交一次 的状态
                if(mobile_unique === true){
                    $btnDataUnique.prop('checked', true);
                    $labelDataUnique.addClass('active');
                }else{
                    $btnDataUnique.prop('checked', false);
                    $labelDataUnique.removeClass('active');
                }
            }

            function closeSwitch(obj) {
                obj.removeClass('open');
                obj.siblings('.state_txt').text('已关闭').removeClass('blue');
                if (obj.hasClass('btn_app_switch')) {
                    $switchTip.text('答题前不验证手机号，直接进入答题');
                }
            }

            $btnBuySms.click(function() {
                var tmp = '' +
                    '<div class="plugin_paid_confim">' +
                    '<p class="p1">支付是否成功？</p>' +
                    '<div class="paid_wrap">' +
                    '<a class="failure" href="javascript:;">遇到问题</a>' +
                    '<a class="success" href="javascript:;" style="color:#53a4f4;">支付成功</a>' +
                    '</div>' +
                    '</div>';
                pluginCenter.showSmallWrap({
                    title: '支付成功确认',
                    contentHtml: tmp
                });

                $showSmallWrap.on('click', '.plugin_paid_confim .failure', function() {
                    window.open("/about/zxzx/");
                });

                $showSmallWrap.on('click', '.plugin_paid_confim .success', function() {
                    pluginCenter.removeSmallWrap();

                    //更新短信余额
                    var query_sms_quota = JSON.parse($.ajax({
                        'url': '/plugin/ajax/sms_quota/',
                        'type': 'POST',
                        'data': {
                            '_xsrf': getCookie('_xsrf')
                        },
                        'async': false
                    }).responseText);
                    var SMSRemainderNum = query_sms_quota.sms_quota;
                    $smsRemainder.text(SMSRemainderNum);
                    if (parseInt(SMSRemainderNum) > 0) {
                        $smsRemainder.attr({
                            'class': 'blue'
                        });
                        $btnSmsSwitch.removeClass('btn_disabled');
                        $btnBuySms.removeClass('red');
                        //如果购买之前短信验证是关闭的，则开启短信验证
                        if ($btnAppSwitch.hasClass('open') && !$btnSmsSwitch.hasClass('open')) {
                            $btnSmsSwitch.trigger('click');
                        }
                    }
                });
            });

            // 修改答题名单
            $limiteMobileComplete.on("click", '.btn_revise_namelist', function() {
                pluginCenter.setMobileList(pid);
            });
            /*$limiteMobileComplete.on("click", '.btn_renew', function() {
                settings.project_single_id = pid;
                settings.isRenew = true;
                var options = {"is_renew": true};
                pluginCenter.appPaid(options);
            });*/
        };

        pluginCenter.domainStepContentObj = function() {
            var dataObj = [{
                'title': '确认拥有独立域名且完成备案',
                'intro': '<p>首先确认您已经购买了域名，同时根据国家相关法律规定，域名备案才能进行接入绑定服务，所以需要确认您的域名已经完成备案</p><p class="step1_tip">*问卷网不提供域名购买、域名备案服务，您可咨询域名供应商</p>'
            }, {
                'title': '设置域名指向',
                'intro': '<p>请登录域名购买网站，进入您持有的域名解析管理界面，新增CNAME记录 <a class="blue" onclick="bigImg.showImg(this,\'/static/images/plugin_center/domain_step_img1.png\')">[ 点击查看图示 ]</a></p><dl><dt>记录类型：</dt><dd>CNAME</dd></dl><dl><dt>主机记录：</dt><dd>例如设置主机记录为diaocha，如果您的域名为mydomain.com，则域名绑定后的地址为diaocha.mydomain.com/s/A1B2C3</dd></dl><dl><dt>记录值：</dt><dd>cname.wenjuan.com</dd></dl>'
            }, {
                'title': '确认域名指向生效',
                'intro': '<p>如果您已经成功设置域名指向，请等待域名指向生效，一般最长不超过24小时，请耐心等待。</p><p>检查生效方法：Windows系统点击“开始”，搜索cmd点击运行，输入命令“ping diaocha.mydomain.com”<br/>（diaocha为上一步设置的主机记录，mydomain.com为您的域名），运行结果若为<a class="red">cname.wenjuan.com</a>，即为生效  <a class="blue" onclick="bigImg.showImg(this,\'/static/images/plugin_center/domain_step_img2.png\')">[ 点击查看图示 ]</a></p>'
            }, {
                'title': '绑定域名',
                'intro': '<p>上述步骤完成后，请输入您的域名，例如“diaocha.mydomain.com”，同时输入您的备案号，例如“沪ICP备10013448”，确认无误后，请点击“提交审核”</p><form class="audit_form"><dl><dt>输入您的域名</dt><dd><input type="text" class="domain_name require" placeholder="diaocha.mydomain.com" /><span class="error"></span></dd></dl><dl><dt>备案号</dt><dd><input type="text" class="record_number require" placeholder="沪ICP备10013448" /><span class="error"></span></dd></dl></form>'
            }];
            return dataObj;
        };
        pluginCenter.domainStep = function(num, domainName, expireTime, service_status, audit_desc) {
            var domainContentObj = pluginCenter.domainStepContentObj();
            var domainStepTitle = domainContentObj[(num - 1)].title;
            var domainStepIntro = domainContentObj[(num - 1)].intro;
            var showDomainStepStr = pluginCenter.domainStepTemplate(num, domainStepTitle, domainStepIntro);
            pluginCenter.showChildWrap(settings.info.title, showDomainStepStr);
            var $domainStep = $showChildWrap.find('.domain_step');
            setObjContentWrap($domainStep);

            $domainStep.on('click', '.btn_prev', function() {
                if (num == 1) {
                    if (domainName) {
                        pluginCenter.domainComplete(domainName, expireTime, service_status, audit_desc);
                    } else {
                        pluginCenter.removeChildWrap();
                        pluginCenter.showApplication();
                    }
                } else {
                    pluginCenter.domainStep(--num, domainName, expireTime, service_status, audit_desc);
                }
            });
            $domainStep.on('click', '.btn_next', function() {
                pluginCenter.domainStep(++num, domainName, expireTime, service_status, audit_desc);
            });
            $domainStep.on('click', '.btn_audit', function() {
                $('.audit_form .require').trigger('blur');
                if ($('.audit_form .error').text()) {
                    return false;
                }

                settings.info.domain = $('.domain_name').val();
                var record_number = $('.record_number').val();
                var data = {
                    'plugin_id': settings.info.oid,
                    'domain': settings.info.domain,
                    'record': record_number,
                    '_xsrf': getCookie('_xsrf')
                }
                ajaxPost('/plugin/ajax/domain/', data,
                    function(ret) {
                        if (ret.message) {
                            $('.domain_name').siblings('.error').text(ret.message);
                        } else {
                            pluginCenter.removeChildWrap();
                            if (ret.mobile != '') {
                                pluginCenter.domainAudit(ret.mobile);
                            } else {
                                pluginCenter.domainAudit();
                            }
                        }
                    }
                );
            });
            var domainPlaceholder = $('.domain_name').attr('placeholder');
            var recordNamePlaceholder = $('.record_number').attr('placeholder')
            $('.domain_name').blur(function(event) {
                var domainNameVal = $('.domain_name').val() == domainPlaceholder ? '' : $('.domain_name').val();
                var reg = new RegExp('^([0-9a-z-]+\\.)*([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\\.[a-z]{2,8}$');
                if (reg.test(domainNameVal)) {
                    $(this).siblings('.error').text('');
                } else {
                    $(this).siblings('.error').text('请输入正确的域名');
                }
            });
            $('.record_number').blur(function(event) {
                var recordNameVal = $('.record_number').val() == recordNamePlaceholder ? '' : $('.record_number').val();
                if (recordNameVal == null || recordNameVal == '' || recordNameVal == undefined) {
                    $(this).siblings('.error').text('请输入备案号');
                } else {
                    $(this).siblings('.error').text('');
                }
            });
        };

        pluginCenter.domainStepTemplate = function(num, title, intro) {
            var stepsStr = '';
            var temp = '';
            var btnPrevStr = '';
            for (var i = 1; i <= 4; i++) {
                if (i == num) {
                    temp = '<span class="step_' + i + ' active"></span>';
                } else {
                    temp = '<span class="step_' + i + '"></span>';
                }
                if (i != 4) {
                    temp += '<i></i>';
                }
                stepsStr += temp;
            }
            if (num == 4) {
                btnNextStr = '<a class="btn_audit btn_default" href="javascript:;">提交审核</a>';
            } else {
                btnNextStr = '<a class="btn_next btn_default" href="javascript:;">下一步</a>';
            }
            if (num == 1) {
                btnPrevStr = '返回';
            } else {
                btnPrevStr = '上一步';
            }
            var templateStr = '<div class="domain_step">' +
                '<div class="content_wrap">' +
                '<div class="step_tip">自定义域名准备工作，请由网站管理员协助完成</div>' +
                '<div class="steps">' + stepsStr + '</div>' +
                '<div class="domain_step_content step' + num + '_content">' +
                '<div class="step_title">' + title + '</div>' +
                '<div class="step_intro">' + intro + '</div>' +
                '</div>' +
                '</div>' +
                '<div class="btn_wrap">' + btnNextStr +
                '<a class="btn_prev btn_none" href="javascript:;">' + btnPrevStr + '</a>' +
                '</div>' +
                '</div>';
            return templateStr;
        };

        pluginCenter.domainAudit = function(mobileNumber, hasPrev) {
            var domainName = settings.info.domain;
            var mobileTxt = '',
                mobileStr = '';
            if (mobileNumber != null && mobileNumber != '') {
                mobileTxt = '<span class="blue">手机短信</span>和';
                mobileStr = '<div class="audit_tip">接收通知短信手机号码：<span id="phoneNumber">' + mobileNumber + '</span></div>';
            } else {
                mobileStr = '<div class="audit_tip">您可以绑定问卷网手机号，通过手机短信接收审核结果 <a class="blue btn_bound_phone">[立即绑定]</a></div>'
            }
            var auditStr = '<div class="domain_audit">' +
                '<div class="content_wrap">' +
                '<div class="audit_result" style="padding-top:180px;">' +
                '<p>您的域名<span class="blue">' + domainName + '</span>已提交审核，我们会在24小时内进行审核</p></div>' +
                '<div class="audit_tip">审核结果将通过<span class="blue">站内信</span>、' + mobileTxt + '<span class="blue">邮件</span>方式通知您</div>' +
                mobileStr +
                '</div>' +
                '<div class="btn_wrap">' +
                '<a class="btn_bound_finish btn_default" href="javascript:;">完成</a>';
            if (hasPrev == null) auditStr += '<a class="btn_prev btn_none" href="javascript:;">上一步</a>';
            auditStr += '</div>' +
                '</div>';
            pluginCenter.showChildWrap(settings.info.title, auditStr);
            var $domainAudit = $showChildWrap.find('.domain_audit');
            setObjContentWrap($domainAudit);
            $domainAudit.on('click', '.btn_prev', function() {
                pluginCenter.domainStep(4);
            });
            $domainAudit.on('click', '.btn_bound_finish', function() {
                parent[settings.string].remove();
            });
            if (mobileNumber == null || mobileNumber == '') {
                pluginCenter.domainBoundPhoneEvent();
            }
        };
        pluginCenter.domainBoundPhoneEvent = function() {
            $('.btn_bound_phone').live('click', function() {
                var boundPhoneStr = '<div id="bound_phone">' +
                    '<div class="head_title">' +
                    '<p></p><i class="close_m"></i>' +
                    '</div>' +
                    '<form action="" id="bound_phone_form" callback="bound_phone_callback">' +
                    '<dl><dt>您的手机号</dt><dd><input type="text" class="user_phone require" id="user_phone" name="user_phone" /><label class="error"></label></dd></dl>' +
                    '<dl><dt>验证码</dt><dd><input type="text" class="phone_code require" id="phone_code" displayname="验证码" /><span class="btn_get_mobile_code">获取验证码</span><label class="error"></label></dd></dl>' +
                    '<dl><input type="button" value="确认" class="btn_submit_m" /><dd><label class="error"></label></dd></dl>' +
                    '</form>' +
                    '</div>';
                var iframeZindex = $('#plugin_center_iframe', parent.document).css('zIndex');
                var $markBoundPhone = new idyC.mark({
                    opacity: '0.5',
                    zIndex: (iframeZindex + 2),
                    backgroundColor: 'fff'
                });
                $("body").append(boundPhoneStr);
                $markBoundPhone.open();
                $("#bound_phone").css({
                    'position': 'absolute',
                    'top': '50%',
                    'left': '50%',
                    'margin-left': '-237px',
                    'margin-top': '-136px',
                    'zIndex': (iframeZindex + 4)
                });

                $('.close_m').live('click', function() {
                    boundPhoneRemove();
                });

                $('.btn_get_mobile_code').live('click', function() {
                    var $user_phone = $('#user_phone');
                    if (!$user_phone.val()) {
                        $user_phone.parent().find('.error').text('手机号不能为空');
                        return false;
                    } else if (!/^(1[0-9])\d{9}$/.test($user_phone.val())) {
                        $user_phone.parent().find('.error').text('手机号格式有误');
                        return false;
                    }
                    if (bState) {
                        //发送手机验证码
                        var data = {
                            'mobile': $user_phone.val()
                        };
                        var obj = $(this);
                        ajaxPost('/register/auth_mobile_validatecode/', data, function(ret) {
                            if (ret.result == '1') {
                                getMobileCode(obj);
                            } else {
                                $user_phone.parent().find('.error').text(ret.error_msg);
                                $user_phone.focus();
                            }
                        });
                    }
                });
                $('#bound_phone_form .require').blur(function() {
                    var $parent = $(this).parent();
                    $parent.find('.error').text('');

                    //验证手机号
                    if ($(this).is('#user_phone')) {
                        if (!$(this).val()) {
                            $parent.find('.error').text('手机号不能为空');
                        } else if (!/^(1[0-9])\d{9}$/.test($(this).val())) {
                            $parent.find('.error').text('请确保手机格式正确');
                        }
                    }
                    //验证码
                    else if ($(this).is('#phone_code')) {
                        if (!$(this).val()) {
                            $parent.find('.error').text('验证码不能为空');
                        }
                    } else {
                        if (!$(this).val()) {
                            var name = $(this).attr('displayname');
                            $parent.find('.error').text(name + '不能为空');
                        }
                    }
                });
                $('.btn_submit_m').click(function() {
                    var $parent = $(this).parent();
                    $parent.find('.error').text('');

                    $('#bound_phone_form .require').trigger('blur');

                    if ($('#bound_phone_form .error').text()) {
                        return false;
                    }

                    var data = {
                        'mobile': $('#user_phone').val(),
                        'vcode': $('#phone_code').val(),
                        '_xsrf': getCookie('_xsrf')
                    };
                    ajaxPost('/register/mobile_validate/', data,
                        function(ret) {
                            if (ret.result == '1') {
                                pluginCenter.domainAudit($('#user_phone').val());
                                boundPhoneRemove();
                            } else {
                                $parent.find('.error').text(ret.error_msg);
                            }
                        }
                    );
                    return false;
                });

                function boundPhoneRemove() {
                    $("#bound_phone").remove();
                    $markBoundPhone.remove();
                }
            });
        };

        pluginCenter.domainComplete = function(domainName, expireTime, service_status, auditDesc) {
            var now = new Date();
            //IE new Date()不支持 yyyy-mm-dd格式，只支持 yyyy/mm/dd 格式
            var expire_time = new Date(expireTime.replaceAll('-', '/'));
            var domain_info1 = '已完成绑定';
            var domain_info2 = '您可以在[收集数据]-[链接收集]查看访问绑定域名后的链接地址';
            var domain_info3 = '';
            var domain_color1 = '';
            var domain_color2 = 'blue';
            if (now >= expire_time) {
                domain_info1 = '绑定服务已到期';
                domain_info2 = '续费后服务将开启';
                domain_info3 = '<span class="red"> [已到期] </span>';
            } else if (auditDesc) {
                domain_info1 = '审核未通过';
                domain_info2 = '原因：' + auditDesc;
                domain_info3 = '';
                domain_color1 = 'red';
                domain_color2 = 'red';
            }
            var completeStr = '<div class="domain_complete">' +
                '<div class="content_wrap">' +
                '<div class="head_info">' +
                '<h2 class="' + domain_color1 + '">您的域名<span class="' + domain_color2 + '">' + domainName + '</span>' + domain_info1 + '</h2>' +
                '<div class="tip">' + domain_info2 + '</div>' +
                '</div>' +
                '<div class="module_list">' +
                '<div class="module">' +
                '<div class="state_title"><span>自定义域名状态</span><span class="btn_switch open"></span></div>' +
                '<p class="state_warning">自定义域名地址可访问</p>' +
                '<p>问卷网域名地址可访问</p>' +
                '</div>' +
                '<div class="module">' +
                '<a class="btn_default btn_renew">续 费</a>' +
                '<p>自定义域名服务截止日期</p>' +
                '<p class="blue">' + expireTime + domain_info3 + '</p>' +
                '</div>' +
                '<div class="module">' +
                '<a class="btn_default btn_revise_domain">修改域名</a>' +
                '<p>新绑定的域名将进行审核</p>' +
                '<p>审核将在24小时内完成</p>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
            pluginCenter.showChildWrap(settings.info.title, completeStr);
            var $domainBoundComplete = $showChildWrap.find('.domain_complete');
            var $stateWarning = $domainBoundComplete.find('.state_warning');
            if (service_status == '1') {
                $domainBoundComplete.find('.btn_switch').addClass('open');
                $stateWarning.text('自定义域名地址可访问').removeClass('red');
            } else {
                $domainBoundComplete.find('.btn_switch').removeClass('open');
                $stateWarning.text('自定义域名地址无法访问').addClass('red');
            }
            var switchFlag = false; //默认开关可点击
            if (localStorage.domainSwitch) {
                var nowTime = new Date().getTime();
                //点过一次之后15m之后才可以再次点击
                if (nowTime - localStorage.domainSwitch > 15000) {
                    switchFlag = false;
                } else {
                    switchFlag = true;
                }
            }
            if (now < expire_time && !auditDesc) {
                $domainBoundComplete.on("click", '.btn_switch', function() {
                    //如果是第二次点击，判断点击间隔时间
                    if (switchFlag) {
                        var nowTime = new Date().getTime();
                        if (nowTime - localStorage.domainSwitch > 15000) {
                            switchFlag = false;
                        } else {
                            loadMack({
                                'str': '间隔时间过短，请稍后再试',
                                'timer': 1500
                            });
                            return;
                        }
                    }
                    switchFlag = true;
                    localStorage.domainSwitch = new Date().getTime();
                    var $btnSwitch = $(this);
                    var service_status = 1;
                    if ($btnSwitch.hasClass('open')) service_status = -1;
                    var data = {
                        'plugin_id': settings.info.oid,
                        'service_status': service_status,
                        '_xsrf': getCookie('_xsrf')
                    }
                    ajaxPost('/plugin/ajax/domain/', data,
                        function(ret) {
                            if ($btnSwitch.hasClass('open')) {
                                $btnSwitch.removeClass('open');
                                $stateWarning.text('自定义域名地址无法访问').addClass('red');
                            } else {
                                $btnSwitch.addClass('open');
                                $stateWarning.text('自定义域名地址可访问').removeClass('red');
                            }
                        }
                    );
                });
            } else {
                $domainBoundComplete.find('.btn_switch').css({
                    'cursor': 'not-allowed'
                });
            }
            $domainBoundComplete.on("click", '.btn_renew', function(){
                parent.window.location.href = '/senior_user/';
            });
            $domainBoundComplete.on("click", '.btn_revise_domain', function() {
                pluginCenter.domainStep(1, domainName, expireTime, service_status, auditDesc);
            });
        };

        pluginCenter.showChildWrap = function(title, contentHtml) {
            $showChildWrap.html('<div class="head_title"><p>' + title + '</p><i class="close"></i></div><div class="content_wrap">' + contentHtml + '</div>')
            $dialogApplication.append($showChildWrap);
            $('input,textarea').placeholder();
            //对于非企业管理员用户，隐藏续费按钮
            if(canEdit == 'True'){
                $('.btn_again_buy,.renew_btn,.renew_btn_v2,.btn_renew').show();
            }else{
                $('.btn_again_buy,.renew_btn,.renew_btn_v2,.btn_renew').hide();
            }
        };

        pluginCenter.removeChildWrap = function() {
            $showChildWrap.remove();
        };

        pluginCenter.showSmallWrap = function(options) {
            var smallSettings = {
                title: '标题',
                btnOkText: '确定',
                btnCancelText: '取消',
                type: 'default', //3种类型 alert/confirm/default
                btnOKFn: function() {},
                btnCancelFn: function() {},
                contentHtml: '',
                defaultStyle: false,
                defaultStyleText1: '',
                defaultStyleText2: '',
                width: 'auto'
            };
            $.extend(smallSettings, options);
            $mark.open();
            var $contentTmp = $('<div class="small_content"></div>');
            if (smallSettings.defaultStyle === false) {
                $contentTmp.html('<div>' + smallSettings.contentHtml + '</div>');
            } else if (smallSettings.defaultStyle === true) {
                if (smallSettings.defaultStyleText1 != '') {
                    $contentTmp.append('<p class="default_p1">' + smallSettings.defaultStyleText1 + '</p>');
                };
                if (smallSettings.defaultStyleText2 != '') {
                    $contentTmp.append('<p class="default_p2">' + smallSettings.defaultStyleText2 + '</p>');
                };
            };

            var btnWrapTmp = '';
            if (smallSettings.type == 'alert') {
                btnWrapTmp = '<div class="btn_wrap"><a class="btn_ok WJButton WJButton_one" href="javascript:;">' + smallSettings.btnOkText + '</a></div>';
            } else if (smallSettings.type == 'confirm') {
                btnWrapTmp = '<div class="btn_wrap"><a class="btn_ok WJButton" href="javascript:;">' + smallSettings.btnOkText + '</a><a class="btn_cancel WJButton uniteC" href="javascript:;">' + smallSettings.btnCancelText + '</a></div>';
            } else {
                btnWrapTmp = '';
            };

            var tmp = '<div class="head_title"><p>' + smallSettings.title + '</p><i class="small_close"></i></div><div class="small_wrap" style="width:' + smallSettings.width + ';"></div>';
            $showSmallWrap.html(tmp);
            $showSmallWrap.find('.small_wrap').append($contentTmp);
            $showSmallWrap.append(btnWrapTmp);
            $('body').append($showSmallWrap);

            $(window).resize(function() {
                var iL = ($(window).width() - $showSmallWrap.innerWidth()) / 2;
                var iT = ($(window).height() - $showSmallWrap.innerHeight()) / 2;
                $showSmallWrap.css({
                    'left': iL,
                    'top': iT
                });
            });
            $(window).resize();

            $showSmallWrap.on('click', '.small_close', function() {
                pluginCenter.removeSmallWrap();
                $mark.remove();
                smallSettings.btnCancelFn();
            });
            $showSmallWrap.on('click', '.btn_cancel', function() {
                pluginCenter.removeSmallWrap();
                $mark.remove();
                smallSettings.btnCancelFn();
            });
            $showSmallWrap.on('click', '.btn_ok', function() {
                pluginCenter.removeSmallWrap();
                $mark.remove();
                smallSettings.btnOKFn();
            });
        };

        pluginCenter.removeSmallWrap = function() {
            $showSmallWrap.remove();
            $mark.remove();
        };

        pluginCenter.showProjectList = function() {
            var curPage = 1,
                totalPage = 1;
            var projList, projListStr, timer, bStop = true,
                pid, showProjectListStr;
            getProjectList(curPage);
            if (projListStr == '') {
                showProjectListStr = '<div class="show_project_list"><p class="noproject">你还没有任何项目，请先去<a href="/new/" target="_blank">添加一个</a></p></div>';
            } else {
                showProjectListStr = '<div class="show_project_list">' +
                    '<div class="content_wrap">' +
                    '<p class="title">请选择一个项目，把' + settings.info.title + '应用添加到这个项目</p>' +
                    '<div class="project_wrap"><ul>' + projListStr + '</div></ul>' +
                    '</div>' +
                    '<div class="btn_wrap">' +
                    '<a class="btn_use btn_default" href="javascript:;">开始使用</a>' +
                    '</div>' +
                    '</div>';
            };
            pluginCenter.showChildWrap(settings.info.title, showProjectListStr);
            var $showProjectList = $dialogApplication.find('.show_project_list');

            if (projListStr == '') {
                $showProjectList.find('.noproject').css("line-height", getContentWrapH() + "px");
            } else {
                var $projectWrap = $showProjectList.find('.project_wrap');
                var $projectWrapUl = $showProjectList.find('.project_wrap ul');
                var contentWrapH = $dialogApplication.innerHeight() - $showProjectList.find('.title').innerHeight() - $showProjectList.find('.btn_wrap').innerHeight() - $dialogApplication.find('.show_childWrap .head_title').innerHeight();
                $projectWrap.css({
                    'height': contentWrapH
                });
                $projectWrap.scroll(function() {
                    var iScrollT = $projectWrap.scrollTop();
                    var iprojectWrapH = parseInt($projectWrap.css('height'));
                    var iprojectWrapUlH = parseInt($projectWrapUl.css('height'));
                    if (iScrollT + iprojectWrapH >= iprojectWrapUlH - 30 && bStop === true && curPage <= totalPage) {
                        bStop = false;
                        timer = setTimeout(function() {
                            clearTimeout(timer);
                            getProjectList(curPage);
                            $projectWrapUl.append(projListStr);
                            bStop = true;
                        }, 500);
                    };
                });

                $projectWrapUl.on('click', 'li', function() {
                    if ($(this).hasClass('hover')) {
                        $(this).removeClass('hover');
                    } else {
                        $(this).addClass('hover').siblings('li').removeClass('hover');
                        pid = $(this).attr('oid');
                    }
                });
                $showProjectList.on('click', '.btn_use', function() {
                    if ($projectWrapUl.find('.hover').length >= 1) {
                        $.ajax({
                            "url": "/plugin/ajax/relation/",
                            "type": "POST",
                            "data": {
                                '_xsrf': getCookie('_xsrf'),
                                'plugin_name': settings.type,
                                'project_id': pid
                            },
                            "async": false,
                            success: function(data) {
                                var result = JSON.parse(data);
                                if (result.info) {
                                    alert(result.info);
                                } else {
                                    if (settings.type == 'hide_logo') {
                                        settings.project_single_id = 1;
                                        if (settings.project_single_id) {
                                            // pluginCenter.hideLogoComplete(data.expire_time, 'single', settings.project);
                                            pluginCenter.transferComplete(data);
                                            return false;
                                        }
                                        var new_obj = {};
                                        var obj = $showProjectList.find('.project_wrap li.hover');
                                        new_obj.title = obj.find('p').text();
                                        new_obj.short_id = obj.attr('short_id');
                                        settings.project = new_obj;
                                        // pluginCenter.hideLogoComplete(data.expire_time, 'single', $showProjectList.find('.project_wrap li.hover'));
                                        pluginCenter.transferComplete(data);
                                    } else if (settings.type == 'lucky_draw') {
                                        parent.window.location.href = '/collect/urllink/' + pid + '?type=' + settings.type + '&step=luckyDrawSetPrize';
                                    }
                                }
                            }
                        });
                    } else {
                        loadMack({
                            str: '请选择一个项目！',
                            timer: 1500
                        });
                    };
                });
            };

            function getProjectList(num) {
                projList = '';
                projListStr = '';
                $.ajax({
                    "url": "/plugin/ajax/get_proj_list/",
                    "type": "POST",
                    "data": {
                        'plugin_id': settings.info.oid,
                        'data_type': 'buy_list',
                        '_xsrf': getCookie('_xsrf'),
                        'page': num
                    },
                    "dataType": "JSON",
                    "async": false,
                    success: function(data) {
                        curPage = data.cur_page + 1;
                        totalPage = data.total_page;
                        projList = data.proj_list;
                        $.each(projList, function(i) {
                            projListStr += '<li short_id="' + projList[i].short_id + '" class="' + projList[i].p_type + '" oid="' + projList[i].oid + '"><i></i><p>' + projList[i].title + '</p><span>' + projList[i].created + '</span></li>';
                        });
                    }
                });
            };
        };

        pluginCenter.showBuyProjectList = function(expire_time, is_expire) {
            //createPageFlag 判断是否要创建分页
            var projectStr, curPage = 1,
                totalPage = 1,
                buyAgain = '',
                createPageFlag = false;
            buyAgain = '';
            var appTxtDict = {'lucky_draw':'抽奖','restrict_mobile_rspd':'限定手机号答题'}
            if (settings.type == 'lucky_draw') {
                buyAgain = '应用已在下列项目使用，请查看或 <a class="btn_again_buy" href="/senior_user/" target="_blank">[续费延期]</a>';
                if (expire_time && typeof(expire_time) != "undefined") {
                    buyAgain = '应用截止日期：' + expire_time.toString() + ' <a class="btn_again_buy" href="/senior_user/" target="_blank">[续费延期]</a>';
                    if (is_expire) {
                        buyAgain = '应用已于' + expire_time.toString() + '到期，<a class="btn_again_buy" href="/senior_user/" target="_blank">[立即续费]</a>重新开启'+ appTxtDict[settings.type] +'应用';

                    }
                }
            } else if (settings.type == 'wx_signin') {
                //true代表是从应用中心打开的微信签到已启用项目列表
                sessionStorage.firstLoadWxsigninProjList = true;
                buyAgain = '<span class="wxsign_tip">提示：微信签到仅支持表单，问卷将在后续版本中支持</span><span class="wx_signin_tab"><a class="btn_tab_default active" isEnabled="true">已启用</a><a class="btn_tab_default" isEnabled="false">未启用</a></span>';
            }

            projectStr = '<div class="show_buy_project_list ' + settings.type + '_project_list">' +
                '<div class="content_wrap">' +
                '<p class="title">' + buyAgain + '</p>' +
                '<div class="project_wrap"><ul></ul></div>' +
                '<div class="page_wrap"><div class="c_paginationa project_list clearfix">' +
                '<div class="c_pagenum"></div>' +
                '</div></div>' +
                '</div>' +
                '</div>';
            pluginCenter.showChildWrap(settings.info.title, projectStr);
            var $showBuyProjectList = $dialogApplication.find('.show_buy_project_list');
            setObjContentWrap($showBuyProjectList);

            getProList(function() {
                if (totalPage > 1) {
                    $showBuyProjectList.find('.project_list .c_pagenum').createPage({
                        pageCount: totalPage,
                        current: curPage,
                        backFn: function(cur) {
                            curPage = cur;
                            getProList();
                        }
                    });
                };
            });

            if (settings.type == "wx_signin") {
                $showBuyProjectList.on("click", ".btn_tab_default", function() {
                    var $that = $(this);
                    $that.addClass('active').siblings().removeClass('active');
                    createPageFlag = true;
                    getProList();
                });
            }

            $showBuyProjectList.on('click', '.btn_set_next', function() {
                var step = '';
                var pid = $(this).parent('li').attr('oid');
                var check_permission = true;
                $.ajax({
                  url : '/enterprise/check_member_permission/?permission_type=plugin&project_id='+pid,
                  type : 'GET',
                  dataType : 'json',
                  async : false,
                  success : function(ret){
                      if(ret.status == 200){
                          if(ret.code == 1){
                            check_permission = true;
                          }else if(ret.code == 2){ 
                            check_permission = false;
                          }
                      }else{
                          check_permission = false;
                      }
                  }
                });
                if(check_permission == false){
                    loadMack({
                        'str': '您没有权限使用，请联系项目所有者',
                        'timer': 1500
                    });
                    return false
                } 
                var p_type = $(this).parent().attr('class');
                if (settings.type == 'lucky_draw') {
                    step = 'luckyDrawSetPrize';
                    $.ajax({
                        "url": "/plugin/ajax/relation/",
                        "type": "POST",
                        "data": {
                            '_xsrf': getCookie('_xsrf'),
                            'plugin_name': 'lucky_draw',
                            'project_id': pid
                        },
                        "async": false,
                        success: function(data) {
                            var result = JSON.parse(data);
                            if (result.info) {
                                alert(result.info);
                            } else {
                                // parent.window.location.href = '/collect/urllink/' + pid + '?type=' + settings.type + '&step=' + step + '&p_type=' + p_type;
                                pluginCenter.luckyDrawSetPrize(pid);
                            }
                        }
                    });
                } else if (settings.type == 'lucky_money') {
                    // step = 'setEnvelope';
                    // parent.window.location.href = '/collect/urllink/' + pid + '?type=' + settings.type + '&step=' + step;
                    settings.plugin_pid = pid;
                    pluginCenter.setEnvelope(pid);
                } else if (settings.type == 'restrict_mobile_rspd') {
                    // step = 'setMobileList';
                    // parent.window.location.href = '/collect/urllink/' + pid + '?type=' + settings.type + '&step=' + step;
                    pluginCenter.setMobileList(pid);
                } else if (settings.type == 'wx_signin') {
                    var data = {
                        'pid': pid,
                        'is_expire': is_expire
                    };
                    var rspd_count = parseInt($(this).siblings('.project_data').attr('rspd_count'));
                    var wxsignin_count = parseInt($(this).siblings('.project_data').attr('wxsignin_count'));
                    var version = parseInt($(this).siblings('.project_data').attr('version'));
                    var q_wx_signin_datetime_id = $(this).siblings('.project_data').attr('q_wx_signin_datetime_id');
                    var q_wx_signin_status_id = $(this).siblings('.project_data').attr('q_wx_signin_status_id');
                    data.rspd_count = rspd_count;
                    data.wxsignin_count = wxsignin_count;
                    data.version = version;
                    data.q_wx_signin_datetime_id = q_wx_signin_datetime_id;
                    data.q_wx_signin_status_id = q_wx_signin_status_id;
                    if ($(this).hasClass("btn_open_next")) {
                        //后台获取当前项目的数据量和项目类型（表单、问卷、测评）
                        var p_type = "表单";
                        if (rspd_count > 0) {
                            jsConfirm({
                                'content': '此' + p_type + '已收集' + rspd_count + '条数据，微信签到开启前的填写用户无法完成签到，是否确定使用此' + p_type + '?',
                                'obj': pluginCenter.wxSigninEnable,
                                'Param': data
                            });
                        } else {
                            pluginCenter.wxSigninEnable(data);
                        }
                    } else {
                        pluginCenter.wxSigninComplete(data);
                    }
                }
            });

            function getProList(fn) {
                var ajaxData = '',
                    lookRecordStr = "查看记录";
                if (settings.type == 'lucky_draw') {
                    ajaxData = {
                        'plugin_id': settings.info.oid,
                        'page': curPage,
                        'num_per_page': 10,
                        'data_type': 'used_list',
                        '_xsrf': getCookie('_xsrf')
                    };
                } else if (settings.type == 'restrict_mobile_rspd') {
                    ajaxData = {
                        'plugin_id': settings.info.oid,
                        'page': curPage,
                        'num_per_page': 10,
                        'data_type': 'used_list',
                        '_xsrf': getCookie('_xsrf')
                    };
                    lookRecordStr = "查看设置";
                } else if (settings.type == "wx_signin") {
                    var isEnabled = $(".wx_signin_tab").find(".btn_tab_default.active").attr("isEnabled");
                    ajaxData = {
                        'plugin_id': settings.info.oid,
                        'page': curPage,
                        'isEnabled': isEnabled, //true为已启用，false为未启用
                        'num_per_page': 10,
                        '_xsrf': getCookie('_xsrf')
                    };
                } else {
                    ajaxData = {
                        'plugin_id': settings.info.oid,
                        'page': curPage,
                        'num_per_page': 10,
                        '_xsrf': getCookie('_xsrf')
                    };
                };

                $.ajax({
                    "url": "/plugin/ajax/get_proj_list/",
                    "type": "POST",
                    "data": ajaxData,
                    "dataType": "JSON",
                    success: function(data) {
                        //has_relation 0:查看记录，1:立即设置
                        var projListStr = '';
                        curPage = data.cur_page;
                        totalPage = data.total_page;
                        if (settings.type == 'wx_signin') {
                            projListStr += '<li class="list_title"><em class="project_title">标题</em><em class="project_time">创建日期</em><em class="project_data">填写数量</em><em class="project_signinNum">签到人数</em><em class="btn_set_next">操作</em></li>';
                            if (data.proj_list.length > 0) {
                                sessionStorage.firstLoadWxsigninProjList = false;
                                var setNextStr = '',
                                    btnOpenClass = '';
                                if (ajaxData.isEnabled == "true") {
                                    setNextStr = '立即设置';
                                } else {
                                    setNextStr = '立即开启';
                                    btnOpenClass = ' btn_open_next';
                                }
                                $.each(data.proj_list, function(i) {
                                    if(data.proj_list[i].p_type == 'form'){
                                        projListStr += '<li class="' + data.proj_list[i].p_type + '" oid="' + data.proj_list[i].oid + '"><i></i>' +
                                            '<em class="project_title">' + str_Intercept(data.proj_list[i].title) + '</em>' +
                                            '<em class="project_time">' + data.proj_list[i].created + '</em>' +
                                            '<em class="project_data" ' +
                                            'rspd_count="' + data.proj_list[i].rspd_count + '" ' +
                                            'wxsignin_count="' + data.proj_list[i].wxsignin_count + '" ' +
                                            'version="' + data.proj_list[i].version + '" ' +
                                            'q_wx_signin_datetime_id="' + data.proj_list[i].q_wx_signin_datetime_id + '" ' +
                                            'q_wx_signin_status_id="' + data.proj_list[i].q_wx_signin_status_id + '">' + data.proj_list[i].rspd_count + '</em>' +
                                            '<em class="project_signinNum">' + data.proj_list[i].wxsignin_count + '</em>' +
                                            '<span oid="' + data.proj_list[i].oid + '" class="btn_set_next' + btnOpenClass + '">' + setNextStr + '</span></li>';
                                    }
                                    
                                });
                            } else {
                                //如果是从应用中心打开的微信签到已启用项目列表，并且已启用列表数据为空时，默认打开未启用列表
                                if (sessionStorage.firstLoadWxsigninProjList == "true" && ajaxData.isEnabled == "true") {
                                    $(".wx_signin_tab").find(".btn_tab_default[isEnabled='false']").click();
                                } else if(ajaxData.isEnabled == "false") {
                                    sessionStorage.firstLoadWxsigninProjList = false;
                                    projListStr += '<li class="project_null_result">暂无项目，<a class="new_project" href="javascript:;"">立即创建项目</a></li>';
                                } else {
                                    sessionStorage.firstLoadWxsigninProjList = false;
                                    projListStr += '<li class="project_null_result">暂无已启用项目</li>';
                                }
                            }
                        } else {
                            //限定手机号答题
                            if(data.proj_list.length == 0){
                                projListStr += '<p class="center_tip">您还没有创建项目，<a class="new_project" href="javascript:;">立即创建项目</a></p>'
                            }else{
                                $.each(data.proj_list, function(i) {
                                    if (data.proj_list[i].has_relation == 0) {
                                        projListStr += '<li class="' + data.proj_list[i].p_type + '" oid="' + data.proj_list[i].oid + '"><i></i><p>' + str_Intercept(data.proj_list[i].title) + '</p><span oid="' + data.proj_list[i].oid + '" class="btn_set_next">立即设置</span></li>';
                                    } else {
                                        projListStr += '<li class="' + data.proj_list[i].p_type + '"><i></i><p>' + str_Intercept(data.proj_list[i].title) + '</p><span oid="' + data.proj_list[i].oid + '" class="btn_look_record">' + lookRecordStr + '</span></li>';
                                    }
                                });
                            }
                            
                        }
                        if (createPageFlag == true) {
                            $showBuyProjectList.find('.project_list .c_pagenum').html("");
                            if (totalPage > 1) {
                                $showBuyProjectList.find('.project_list .c_pagenum').createPage({
                                    pageCount: totalPage,
                                    current: curPage,
                                    backFn: function(cur) {
                                        curPage = cur;
                                        getProList();
                                    }
                                });
                            };
                            createPageFlag = false;
                        }
                        $showBuyProjectList.find('.project_wrap ul').html(projListStr);
                        if (fn) fn();
                    }
                });
            };
            $('.new_project').live('click',function(){
                parent.window.location.href = '/list/';
            });

            $showBuyProjectList.on('click', '.btn_look_record', function() {
                var pid = $(this).attr('oid');
                // parent.window.location.href = '/collect/urllink/' + pid + '?type=' + settings.type + '&step=historyRecordList';
                settings.plugin_pid = pid;
                pluginCenter.historyRecordList(pid);
            });

        };

        pluginCenter.setEnvelope = function(pid) {
            var check_permission = true;
            $.ajax({
              url : '/enterprise/check_member_permission/?permission_type=plugin&project_id='+pid,
              type : 'GET',
              dataType : 'json',
              async : false,
              success : function(ret){
                  if(ret.status == 200){
                      if(ret.code == 1){
                        check_permission = true;
                      }else if(ret.code == 2){ 
                        check_permission = false;
                      }
                  }else{
                      check_permission = false;
                  }
              }
            });
            if(check_permission == false){
                loadMack({
                    'str': '您没有权限使用，请联系项目所有者',
                    'timer': 1500
                });
                return false
            } 
            var setEnvelopeStr = '<div class="set_envelope">' +
                '<div class="content_wrap">' +
                '<p class="title">红包金额</p>' +
                '<ul class="tab_nav">' +
                '<li kind="random" class="active"><i></i><span>拼手气红包</span></li>' +
                '<li kind="common"><i></i><span>普通红包</span></li>' +
                '</ul>' +
                '<div class="tab_wrap">' +
                '<div class="tab" style="display:block;">' +
                '<p><span>总金额<input id="total_money" type="text" style="ime-mode:disabled;" onpaste="return false;" />元</span><span>红包个数<input id="envelope_random_num" type="text" /></span><span class="tip"></span></p>' +
                '</div>' +
                '<div class="tab">' +
                '<p><span>单个金额<input id="single_money" type="text" />元</span><span>红包个数<input id="envelope_common_num" type="text" /></span><span class="tip"></span></p>' +
                '</div>' +
                '</div>' +
                '<p class="envelope_rules">微信规定单个红包金额范围：1.00~200.00元<br/><a target="_blank" href="/about/enveloperule" style="margin-left:0px; margin-top:3px;display:inline-block;">点击查看红包规则和发票问题</a></p>' +
                '<p class="title_2">发放设置</p>' +
                '<p class="weixin_only_once"><i class="active"></i><span>每个微信号只能领取一次红包，重复参与无效。</span></p>' +
                '<ul class="probability">' +
                '<li class="first" kind="100_percent"><i class="active"></i>100%抽中红包，先到先得领完为止</li>' +
                '<li kind="custom_percent"><i></i>有概率抽中红包，预计总参与人数为' +
                '<input id="expected_person" type="text" />人<span class="tip"></span><span class="envelope_probability">领取概率为：<em id="probability_num"></em></span></li>' +
                '</ul>' +
                '<p class="probability_text">根据您预计的参与人数，将红包随机分布，在到达预计参与人数前全部抽完。</p>' +
                '<p class="prevent_brush"><i></i><a href="https://www.wenjuan.com/helpcenter/list/5232d9b489c0971a7a0e71f0/h357873968a320fc5d74f77680" target="_blank">如何防止红包被刷，我们有妙招！</a></p>' +
                '</div>' +
                '<div class="btn_wrap">' +
                '<a class="btn_next btn_default" href="javascript:;">下一步</a>' +
                '</div>' +
                '</div>';
            pluginCenter.showChildWrap(settings.info.title, setEnvelopeStr);
            var $setEnvelope = $showChildWrap.find('.set_envelope');
            var $weixin_only_once = $setEnvelope.find('.weixin_only_once');
            var $probability = $setEnvelope.find('.probability');
            var $tabNav = $setEnvelope.find('.tab_nav');
            var $tabWrap = $setEnvelope.find('.tab_wrap');
            var $tip = $tabWrap.find('.tip');

            setObjContentWrap($setEnvelope);
            $tabNav.on('click', 'li', function() {
                var index = $(this).index();
                $(this).addClass('active');
                $(this).siblings('li').removeClass('active');
                $tabWrap.find('.tab').hide();
                $tabWrap.find('.tab').eq(index).show();
                $tip.html('');
                $tabWrap.find('input').removeClass('error');
                $('.envelope_probability').hide();

                var kind = $tabNav.find('.active').attr("kind");
                if (kind == "random") {
                    blurCheck.random_envelope();
                } else if (kind == "common") {
                    blurCheck.common_envelope();
                }
            });

            $tabWrap.on('focus', 'input', function() {
                $tip.html('');
                $tabWrap.find('input').removeClass('error');
            });

            $tabWrap.on('blur', '#total_money,#envelope_random_num', function() {
                blurCheck.random_envelope();
            });

            $tabWrap.on('blur', '#single_money,#envelope_common_num', function() {
                blurCheck.common_envelope();
            });

            $setEnvelope.on('blur', '#expected_person', function() {
                var kind = $tabNav.find('.active').attr("kind");
                if (kind == "random") {
                    blurCheck.random_envelope();
                } else if (kind == "common") {
                    blurCheck.common_envelope();
                }
            });

            $setEnvelope.on('keyup', '#total_money, #single_money,#expected_person', function() {
                validationNum($(this), true);
            });

            $setEnvelope.on('keyup', '#envelope_random_num, #envelope_common_num', function() {
                validationNum($(this));
            });
            var blurCheck = {
                random_envelope: function() {
                    var total_money_val = $("#total_money").val(),
                        random_num_val = $("#envelope_random_num").val();
                    if (total_money_val == '') {
                        blurCheck.tipHtml('#total_money', '请填写总金额');
                        return false;
                    } else if (parseFloat(total_money_val) > parseFloat(random_num_val * 200)) {
                        blurCheck.tipHtml('#total_money', '总金额太大，请小于红包个数的200倍');
                        return false;
                    } else if (parseFloat(total_money_val) < parseFloat(random_num_val)) {
                        blurCheck.tipHtml('#total_money', '总金额太小，请大于红包个数');
                        return false;
                    };
                    if (random_num_val == '') {
                        blurCheck.tipHtml('#envelope_random_num', '请填写红包个数');
                        return false;
                    } else if (parseFloat(random_num_val) <= 0) {
                        blurCheck.tipHtml('#envelope_random_num', '红包个数需是大于1的整数');
                        return false;
                    };
                    blurCheck.envelope_probability(random_num_val);
                    return true;
                },
                common_envelope: function() {
                    var single_money_val = $("#single_money").val(),
                        common_num_val = $("#envelope_common_num").val();
                    if (single_money_val == '') {
                        blurCheck.tipHtml('#single_money', '请填写单个金额');
                        return false;
                    } else if (parseFloat(single_money_val) < 1 || parseFloat(single_money_val) > 200) {
                        blurCheck.tipHtml('#single_money', '单个金额需在1~200元之间');
                        return false;
                    }
                    if (common_num_val == '') {
                        blurCheck.tipHtml('#envelope_common_num', '请填写红包个数');
                        return false;
                    } else if (parseFloat(common_num_val) <= 0) {
                        blurCheck.tipHtml('#envelope_common_num', '红包个数需是大于1的整数');
                        return false;
                    };
                    blurCheck.envelope_probability(common_num_val);
                    return true;
                },
                tipHtml: function(obj, tip) {
                    $(obj).addClass('error');
                    $tip.html(tip);
                },
                envelope_probability: function(envelope_num) {
                    var expected_person_val = $("#expected_person").val();
                    if ($("li[kind=custom_percent]").find("i").hasClass('active')) {
                        if (expected_person_val == '') {
                            $(".envelope_probability").hide();
                            $("#expected_person").siblings('.tip').text("请填写人数");
                        } else {
                            var $tip = $("#expected_person").siblings('.tip');
                            if (parseFloat(expected_person_val) < parseFloat(envelope_num)) {
                                $(".envelope_probability").hide();
                                $tip.text("预计人数不得小于红包个数");
                                return false;
                            } else {
                                $tip.text('');
                                var probability_num = parseFloat(parseFloat(envelope_num) / parseFloat(expected_person_val) * 100).toFixed(2);
                                $("#probability_num").text(probability_num + "%");
                                $(".envelope_probability").show();
                            }
                        }
                    }
                }
            };

            $weixin_only_once.on('click', function() {
                if ($(this).find('i').hasClass('active')) {
                    $(this).find('i').removeClass('active');
                } else {
                    $(this).find('i').addClass('active');
                }
            });

            $probability.on('click', 'li', function() {
                $(this).find('i').addClass('active');
                $(this).siblings('li').find('i').removeClass('active');
                if ($(this).hasClass('first')) {
                    $(this).siblings('li').find("input").val("");
                    $(this).siblings('li').find(".tip").text('');
                    $(this).siblings('li').find(".envelope_probability").hide();
                }
            });

            $setEnvelope.on('click', '.btn_next', function() {
                var kind = $tabNav.find('.active').attr("kind");
                var envelope_money, count, each_money, weixin_only_once, probability, expected_person;
                if (kind == "random") {
                    if (!blurCheck.random_envelope()) {
                        return false;
                    }
                    envelope_money = $("#total_money").val();
                    count = $("#envelope_random_num").val().replace(/\s+/g, "");
                } else if (kind == "common") {
                    if (!blurCheck.common_envelope()) {
                        return false;
                    }
                    each_money = $("#single_money").val();
                    count = $("#envelope_common_num").val().replace(/\s+/g, "");
                    envelope_money = $("#single_money").val() * $("#envelope_common_num").val();
                }

                if ($weixin_only_once.find('i').hasClass('active')) {
                    weixin_only_once = 1;
                } else {
                    weixin_only_once = 0;
                }

                var probability_kind = $probability.find('.active').parent('li').attr('kind');
                if (probability_kind == '100_percent') {
                    probability = 1;
                    expected_person = 0;
                    $probability.find('.tip').text('');
                } else if (probability_kind == 'custom_percent') {
                    probability = 0;
                    expected_person = $('#expected_person').val().replace(/\s+/g, "");
                    if (!expected_person) {
                        $probability.find('.tip').text("请填写人数");
                        return false;
                    } else {
                        if (!/^[0-9]\d*$/.test(expected_person)) {
                            $probability.find('.tip').text("请填写大于0的整数");
                            return false;
                        } else if (parseFloat(expected_person) < parseFloat(count)) {
                            $probability.find('.tip').text("预计人数不得小于红包个数");
                            return false;
                        } else {
                            $probability.find('.tip').text('');
                        }
                    }
                }
                pluginCenter.removeChildWrap();
                envelopePaidSettings_qj = {
                    kind: kind,
                    pid: pid,
                    envelopeMoney: envelope_money,
                    eachMoney: each_money,
                    count: count,
                    weixin_only_once: weixin_only_once,
                    probability: probability,
                    expected_person: expected_person
                };
                pluginCenter.envelopePaid(envelopePaidSettings_qj);
            });
        };

        pluginCenter.envelopePaid = function(options) {
            var envelopePaidSettings = {
                kind: '',
                pid: '',
                envelopeMoney: 0,
                eachMoney: 0,
                count: 0,
                weixin_only_once: 0,
                probability: 1,
                expected_person: 0
            };
            $.extend(envelopePaidSettings, options);

            var service_price = Number(envelopePaidSettings.envelopeMoney * 0.05).toFixed(1);
            if (service_price < 1) {
                service_price = 1;
            }
            var actual_price = Number(envelopePaidSettings.envelopeMoney).toFixed(2);
            var needMoney = parseFloat(envelopePaidSettings.envelopeMoney) + parseFloat(service_price);

            var envelopePaidStr = '<div class="envelope_paid">' +
                '<div class="content_wrap">' +
                '<dl><dt>红包充值</dt><dd>收取红包金额的5%作为服务费（最低1元），确认支付后，红包将由问卷网服务号代发</dd></dl>' +
                '<div class="amount_info hb_">' +
                '<p class="p1">总金额</p>' +
                '<p class="num red"><span class="s1">￥</span><span class="s2 needMoney">' + Number(needMoney).toFixed(2) + '</span></p>' +
                '<p class="p2">代发红包：<span class="red">￥' + actual_price + ' 元</span>&nbsp;&nbsp;&nbsp;服务费：<span class="red">￥' + service_price + ' 元</span></p>' +
                //'<p class="p2" style="color:#f97c7c;">公测期间（至2月29日）免收5%服务费</p>' +
                '</div>' +
                '</div>' +
                '<div class="btn_wrap">' +
                // '<p class="paid_num">账户余额：<span class="userMoney">0.00</i></span>' +
                // '<a class="chongzhi btn_chongzhi" href="javascript:;">充值</a>' +
                '</p>' +
                '<a class="btn_next btn_default" href="javascript:;">确认支付</a>' +
                '<a class="btn_prev btn_none" href="javascript:;">上一步</a>' +
                '</div>' +
                '</div>';
            pluginCenter.showChildWrap(settings.info.title, envelopePaidStr);
            var $envelopePaid = $showChildWrap.find('.envelope_paid');
            var availableRmb = getAvailableRmb().availableRmb;
            setObjContentWrap($envelopePaid);
            $envelopePaid.find('.userMoney').html(availableRmb);

            $envelopePaid.on('click', '.btn_next', function() {
                _hmt.push(['_trackEvent', 'pluginPay', 'click', 'lucky_money_pluginPay']);
                if (getAvailableRmb().status == '200') {
                    var leave_money = parseFloat(availableRmb);

                    if(needMoney > leave_money){
                        payment_Method.goPay({
                            needPay: needMoney - leave_money,
                            leave_money: leave_money,
                            type: settings.type,
                            btnOKFn:function(){
                                payment_Method.markRemove();
                                payment_Method.payConfirm({
                                    btnOKFn:function(){
                                        payment_Method.markRemove();
                                        var orderStatus;
                                        getOrderStatus(function(data){
                                            orderStatus = JSON.parse(data).order_status;
                                            if(orderStatus == 1){
                                                pluginCenter.envelopeConfirmPay(envelopePaidSettings);
                                                $('body').find('.paid_mark').remove();
                                            }else{
                                                payment_Method.payConfirm({payStatus:false});
                                            }
                                        });
                                    },
                                    btnCancelFn:function(){
                                        payment_Method.markRemove();
                                    }
                                });
                            }
                        });
                    }else{
                        payment_Method.orderConfirm({
                            payMoney: needMoney,
                            leave_money: leave_money,
                            btnOKFn:function(){
                                pluginCenter.envelopeConfirmPay(envelopePaidSettings);
                                $('body').find('.paid_mark').remove();
                            }
                        });
                    }
                }else{
                    pluginCenter.showSmallWrap({
                        title: '提示',
                        contentHtml: '提交报错',
                        type: 'alert'
                    });
                }
            });

            $envelopePaid.on('click', '.btn_prev', function() {
                pluginCenter.removeChildWrap();
                pluginCenter.setEnvelope(envelopePaidSettings.pid);
            });
            $envelopePaid.on('click', '.btn_chongzhi', function() {
                window.open("/member/onlinepay");
            });
        };

        pluginCenter.envelopeConfirmPay = function(envelopePaidSettings) {
            $.ajax({
                "url": "/plugin/ajax/consume/",
                "type": "POST",
                "dataType": "JSON",
                "async": false,
                "data": {
                    'plugin_id': settings.info.oid,
                    'project_id': envelopePaidSettings.pid,
                    'en_type': envelopePaidSettings.kind,
                    'en_money': envelopePaidSettings.envelopeMoney,
                    'en_count': envelopePaidSettings.count,
                    'en_each_money': envelopePaidSettings.eachMoney,
                    'weixin_only_once': envelopePaidSettings.weixin_only_once,
                    'probability': envelopePaidSettings.probability,
                    'expected_person': envelopePaidSettings.expected_person,
                    '_xsrf': getCookie('_xsrf')
                },
                success: function(data) {
                    if (!data.info) {
                        pluginCenter.removeChildWrap();
                        settings.lucky_money_setting_status = data.lucky_money_setting_status;
                        // pluginCenter.envelopeComplete();
                        settings.plugin_pid = envelopePaidSettings.pid;
                        pluginCenter.transferComplete(data);
                    } else {
                        pluginCenter.showSmallWrap({
                            title: '提示',
                            contentHtml: data.info,
                            type: 'alert'
                        });
                    };
                }
            });
        }

        //此处原有hidelogoBuylist函数，展示一个列表，内容为购买隐藏logo的项目，现已删除。
        
        pluginCenter.hideLogoRenew = function(expire_time) {
            var txts = {
                'txt1': '到期后该应用将失效',
                'txt2': ''
            }
            if (settings.type == "hide_logo"){
                txts.txt1 = '到期后问卷网标志将再次显示';
                txts.txt2 = '账号下所有项目均已隐藏问卷网标志，打开您的问卷、表单、测评试试吧';
            }

            var overdueStr = '';
            var nowdate = new Date().Format("yyyyMMdd");
            var enddate = expire_time.replace('-', '').replace('-', '');
            if (nowdate > enddate) {
                overdueStr = '<h6 class="f16">已于 ' + expire_time + ' 到期，如需使用请 <a href="/senior_user/" target="_blank" class="renew_btn_v2">购买高级版</a></h6><p>' + txts.txt1 + '</p>';
            } else {
                overdueStr = '<h6>该功能有效期至<span>' + expire_time + '</span></h6><p>' + txts.txt2 + '</p><a href="/senior_user/" target="_blank" class="renew_btn">续费延期</a>';
            }
            // 项目列表页下拉框的投票墙，如果购买了没有设置，显示立即设置
            if(settings.type == 'vote_wall' && top.location.pathname == "/list"){
                overdueStr += '<a href="/plugin/vote_wall/" target="_blank" class="btn_setting">立即设置</a>';
            }
            var tmp = '<div class="hide_logo_renew">' +
                '<div class="content_wrap">' +
                '<div class="renew">' + overdueStr +
                '</div>' +
                '</div>' +
                '</div>';
            pluginCenter.showChildWrap(settings.info.title, tmp);
            var $hideLogoRenew = $showChildWrap.find('.hide_logo_renew');
            setObjContentWrap($hideLogoRenew);
        }

        pluginCenter.luckyDrawSetPrize = function(pid, drawSettings) {
            var prizeHtml = '<li class="prizeItem">' +
                ' <div class="clearfix bt">' +
                '<h6></h6><span class="probability">（中奖概率：<i>输入奖项数量后自动计算</i>）</span>' +
                '<a href="javascript:;" class="del"></a>' +
                '</div>' +
                '<dl class="clearfix">' +
                '<dt>' +
                '<span><img src="/static/images/plugin_center/upload-prize.png" type="default" class="prizePic"/></span>' +
                '<input type="file" class="inputPrizePic" name="file" accept="image/gif, image/jpeg, image/png, image/jpg" />' +
                '</dt>' +
                '<dd>' +
                '<div class="clearfix">' +
                '<input type="text" class="txt name" placeholder="奖品名称（必填）" />' +
                '<input type="text" class="txt num" placeholder="数量（必填）" />' +
                ' <span>份</span>' +
                ' </div>' +
                '<input type="text" class="txt desc" placeholder="奖品简介" />' +
                '</dd>' +
                '</dl>' +
                '</li>';

            var tmp = '<div class="set_prize">' +
                '<div class="content_wrap">' +
                '<div class="clearfix">' +
                '<div class="draw_way set_prize_pic">' +
                '<p><img src="/static/images/plugin_center/draw-way-zp1.png" /></p>' +
                '<center style="display: none;">' +
                '<select id="circleStyle">' +
                '<option value="turntable">大转盘</option>' +
                '</select>' +
                '</center>' +
                '</div>' +
                '<div class="draw_prize"><div class="auto">' +
                '<div class="draw_rule num_People"><div class="clearfix">' +
                '<span>预计参与人数<i class="c_ts_wh dh_num"></i></span>' +
                '<input type="text" class="txt" placeholder="1-1000000" id="inputNumOfPeople" />' +
                '</div></div>' +
                '<ul>' +
                '</ul></div>' +
                '<a href="javascript:;" class="add_prize">添加奖品</a>' +
                '</div>' +
                ' </div>' +
                '</div>' +
                '<div class="btn_wrap">' +
                ' <a class="btn_next btn_default" href="javascript:;">下一步</a>' +
                '<a class="btn_look btn_default btn_preview" href="javascript:;">预览效果</a>' +
                // ' <a class="btn_prev btn_none" href="javascript:;">上一步</a>'+
                '</div>' +
                '<form action="" method="post" id="previewForm" target="_blank">' +
                '<input type="hidden" name="settings" value="" id="previewSettings">' +
                '</form>' +
                '</div>';
            pluginCenter.showChildWrap(settings.info.title, tmp);
            var $setPrize = $showChildWrap.find('.set_prize');

            setObjContentWrap($setPrize);

            if (drawSettings) {
                // 如果是上一步的动作, 就还原设置
                $("#inputNumOfPeople").val(drawSettings.num_of_people);
                for (var i = 0; i < drawSettings.struct.length; i++) {
                    var prize = drawSettings.struct[i];
                    $('.draw_prize ul').append(prizeHtml);
                    var prizeItem = $setPrize.find('.prizeItem:eq(' + i + ')');
                    if (prize.pic == 'https://dn-wenjuan-com.qbox.me/draw_default.png'){
                        prize.pic = '/static/images/plugin_center/upload-prize.png';
                    }
                    prizeItem.find('img').attr('src', prize.pic).attr('type', '');
                    prizeItem.find('.name').val(prize.name);
                    prizeItem.find('.desc').val(prize.desc);
                    prizeItem.find('.num').val(prize.remain);
                    if (parseFloat(prize.remain) >= parseFloat(drawSettings.num_of_people)){
                        prizeItem.find('.probability i').html('100%');
                    }else{
                        prizeItem.find('.probability i').html((prize.remain*100/drawSettings.num_of_people).toFixed(2)+"%");
                    }
                };
            } else {
                $('.draw_prize ul').append(prizeHtml);
            }

            _setPrizeIndex();


            $setPrize.on('mouseenter', '.dh_num', function() {
                hover_tip($(this), '根据您预计的参与人数，奖品将随机分布，在到达预计参与人数前全部抽完。这样可以保证奖品不会过早抽完或久抽不中。例：您提供50个奖品，预计参与人数1000人，那每20人中会有一位随机中奖');
            });

            $setPrize.on('keyup', '#inputNumOfPeople', function() {
                validationNum($(this));
                var num_c = $(this).val();
                if (num_c != ""){
                    $setPrize.find(".prizeItem").each(function(){
                        var num_k = $(this).find(".num").val();
                        if (num_k != ""){
                            $(this).find('.probability i').addClass("warning");
                            if (parseFloat(num_k) >= parseFloat(num_c)){
                                $(this).find('.probability i').html('100%');
                            }else{
                                $(this).find('.probability i').html((num_k*100/num_c).toFixed(2)+"%");
                            }
                        }
                    });
                }else{
                     $setPrize.find(".prizeItem i").html("输入奖项数量后自动计算");
                     $setPrize.find(".prizeItem i").removeClass("warning");
                }
            });

            $setPrize.on('blur', '#inputNumOfPeople', function() {
                if (parseInt($(this).val()) > 1000000) {
                    $(this).val(1000000);
                    loadMack({
                        str: '参与人数上限为1000000',
                        timer: 1000
                    });
                }
            });

            $setPrize.on('blur', '.num', function() {
                var value = $(this).val();
                if (isNaN(value) || parseInt(value) === 0) {
                    $(this).val(1);
                    return;
                }
                if (parseInt(value) > 50000) {
                    $(this).val(50000);
                    loadMack({
                        str: '单项奖品上限为50000个。',
                        timer: 1000
                    });
                }
            });

            $setPrize.on('change', '.inputPrizePic', function() {
                var $input = $(this);
                $input.closest('li.prizeItem').find('.prizePic').attr('src', '').hide();
                // 开始上传时，显示loading动画
                $input.closest('li.prizeItem').find('dt span').addClass('uploading');
                $.ajaxFileUpload({
                    url: '/plugin/ajax/luckdraw/upload_pic/' + pid + '/?fileId=' + $input.attr('id'),
                    secureuri: false,
                    fileElementId: $input.attr('id'),
                    dataType: "json",
                    success: prizePicUploadSuccess
                })
            });

            $setPrize.on('keyup', '.prizeItem .num', function() {
                validationNum($(this));
                var num_k = $(this).val();
                var num_c = $("#inputNumOfPeople").val()
                if (num_c != "" && num_k != ""){
                    $(this).parents(".prizeItem").find('.probability i').addClass('warning');
                    if (parseFloat(num_k) >= parseFloat(num_c)){
                        $(this).parents(".prizeItem").find('.probability i').html('100%');
                    }else{
                        $(this).parents(".prizeItem").find('.probability i').html((num_k*100/num_c).toFixed(2)+"%");
                    }
                }else{
                     $(this).parents(".prizeItem").find("i").html("输入奖项数量后自动计算");
                     $(this).parents(".prizeItem").find("i").removeClass('warning')
                }
            });

            $setPrize.on('click', '.add_prize', function() {
                if ($('.draw_prize ul li').length >= 7) {
                    loadMack({
                        str: '最多只能添加7个奖项！',
                        timer: 1500
                    });
                    return false;
                } else {
                    $('.draw_prize ul').append(prizeHtml);
                    $('input,textarea').placeholder();
                }
                _setPrizeIndex();
            });
            $setPrize.on('click', '.draw_prize ul li .del', function() {
                if ($('.draw_prize ul li').length == 1) {
                    loadMack({
                        str: '至少要有一个奖项！',
                        timer: 1500
                    });
                } else {
                    $(this).parents('li').remove();
                    _setPrizeIndex();
                }
            });
            $setPrize.on('click', '.btn_prev', function() {
                pluginCenter.removeChildWrap();
                pluginCenter.showProjectList();
            });

            $setPrize.on('click', '.btn_preview', function() {
                var drawSettings = {
                    'pid': pid
                };
                var prizeData = [];
                var isValid = true;

                var numOfPeople = $("#inputNumOfPeople").val();
                if (numOfPeople === '') {
                    loadMack({
                        str: '请填写预计抽奖人数',
                        timer: 1500
                    });
                    isValid = false;
                    return false;
                }

                $setPrize.find('.prizeItem').each(function(index, dom) {
                    var pic = $(this).find('img').attr('src');
                    if (pic == '/static/images/plugin_center/upload-prize.png'){
                        pic = 'https://dn-wenjuan-com.qbox.me/draw_default.png';
                    }
                    var isDefaultPic = $(this).find('img').attr('type');
                    var name = $("<div>").text($(this).find('.name').val()).html();
                    var desc = $("<div>").text($(this).find('.desc').val()).html();
                    var remain = $(this).find('.num').val();
                    var level = index + 1;
                    // if (isDefaultPic == 'default') {
                    //     loadMack({
                    //         str: '请上传奖品图片',
                    //         timer: 1500
                    //     });
                    //     isValid = false;
                    //     return false;
                    // } else
                    if (name == '' || name == '奖品名称（必填）') {
                        loadMack({
                            str: '请输入奖品名称',
                            timer: 1500
                        });
                        isValid = false;
                        return false;
                    } else if (remain == '' || remain == '数量（必填）') {
                        loadMack({
                            str: '请输入奖品数量',
                            timer: 1500
                        });
                        isValid = false;
                        return false;
                    } else {
                        if ($(this).find('img').attr('mode') === 'default') {
                            isValid = false;
                            return false;
                        }
                        prizeData.push({
                            'pic': pic,
                            'name': name,
                            'desc': desc,
                            'remain': remain,
                            'level': level
                        });
                    }
                });
                if (!isValid) {
                    return;
                }
                drawSettings['struct'] = prizeData;
                var result = null;
                $.ajax({
                    url: '/plugin/luckydraw/get_preview_url/' + drawSettings.pid + '/',
                    dataType: 'JSON',
                    async: false,
                    success: function(ret) {
                        result = ret;
                    }
                });
                if (result.msg) {
                    loadMack({
                        str: result.msg,
                        timer: 1500
                    });
                    return;
                }
                $("#previewSettings").val(JSON.stringify(drawSettings));
                $("#previewForm").attr('action', result.preview_url).submit();
            });

            $setPrize.on('click', '.btn_next', function() {
                // TODO 获取奖品列表
                var drawSettings = {
                    'pid': pid
                };
                var prizeData = [];
                var isValid = true;

                var numOfPeople = $("#inputNumOfPeople").val();
                if (numOfPeople === '') {
                    loadMack({
                        str: '请填写预计抽奖人数',
                        timer: 1500
                    });
                    isValid = false;
                    return false;
                }

                $setPrize.find('.prizeItem').each(function(index, dom) {
                    var pic = $(this).find('img').attr('src');
                    if (pic == '/static/images/plugin_center/upload-prize.png'){
                        pic = 'https://dn-wenjuan-com.qbox.me/draw_default.png';
                    }
                    var isDefaultPic = $(this).find('img').attr('type');
                    var name = $("<div>").text($(this).find('.name').val()).html();
                    var desc = $("<div>").text($(this).find('.desc').val()).html();
                    var remain = $(this).find('.num').val();
                    var level = index + 1;
                    // if (isDefaultPic == 'default') {
                    //     loadMack({
                    //         str: '请上传奖品图片',
                    //         timer: 1500
                    //     });
                    //     isValid = false;
                    //     return false;
                    // } else
                    if (name == '' || name == '奖品名称（必填）') {
                        loadMack({
                            str: '请输入奖品名称',
                            timer: 1500
                        });
                        isValid = false;
                        return false;
                    } else if (remain == '' || remain == '数量（必填）') {
                        loadMack({
                            str: '请输入奖品数量',
                            timer: 1500
                        });
                        isValid = false;
                        return false;
                    } else {
                        if ($(this).find('img').attr('mode') === 'default') {
                            isValid = false;
                            return false;
                        }
                        prizeData.push({
                            'pic': pic,
                            'name': name,
                            'desc': desc,
                            'remain': remain,
                            'level': level,
                            'numOfPeople': numOfPeople
                        });
                    }
                });
                if (!isValid) {
                    return;
                }

                drawSettings.num_of_people = numOfPeople;
                drawSettings.struct = prizeData;
                pluginCenter.removeChildWrap();
                pluginCenter.luckyDrawRule(drawSettings);
            });
        };

        pluginCenter.luckyDrawRule = function(drawSettings) {
            var tmp = '<div class="draw_rule"><div class="load_mack"><span>保存中...</span></div>' +
                '<div class="content_wrap">' +
                // '<h6>中奖概率</h6>' +
                // '<p class="sm">根据您预计的参与人数，奖品将随机分布，在到达预计参与人数前全部抽完。这样可以保证奖品不会过早抽完或久抽不中。<br/>' + '例：您提供50个奖品，预计参与人数1000人，那每20人中会有一位随机中奖。</p>' +
                '<h6>发奖方式</h6>' +
                '<ul>' +
                // '<li>'+
                //     '<label class="check_label" id="isShowCreatorNotice"><span></span>向中奖者展示发奖说明</label>'+
                //     '<div class="desc_sr">'+
                //         '<textarea placeholder="请填写发放相关说明，如发奖人联系方式，发奖时间，寄送方式等" id="creatorNotice"></textarea>'+
                //     '</div>'+
                // '</li>'+
                '<li>' +
                '<label class="check_label" id="useExchangeCode"><span></span><i>启用兑换码</i><em>（适合现场兑奖或在线领奖）</em><i class="c_ts_wh dh_tips"></i></label> ' +
                '</li>' +
                '<li>' +
                '<label class="check_label" id="needReceiveAddress"><span></span><i>需要填写收货地址</i><em>' + '（适合寄送奖品的方式）</em><i class="c_ts_wh js_tips"></i></label> ' +
                '</li>' +
                '</ul>' +
                '<div class="award_info">' +
                '<h6>发奖人信息</h6>' +
                '<p>为确保抽奖活动真实有效，请确保以下信息真实准确！<span style="color:#f97c7c;">同时以下信息也将被公示给中奖者！</span></p>' +
                '<div class="clearfix award-information">' +
                '<input type="text" class="txt name" placeholder="发奖人" id="creatorName"/>' +
                '<input type="text" class="txt phone" placeholder="电话" id="contactInfo"/>' +
                '<input type="text" class="txt time timeInput" placeholder="发奖时间" id="distributeTime"/>' +
                '</div>' +
                '<textarea placeholder="发奖方式" class="textarea" id="distributeDesc"></textarea>' +
                '</div>' +
                '</div>' +
                '<div class="btn_wrap clearfix">' +
                '<div class="fl"><label class="fr agree_rule active"><span></span><em>我同意</em></label><a href="/about/drawrule" target="_blank">《问卷网抽奖管理规范》</a>，保证发起的抽奖活动真实有效</div>' +
                '<div class="fr"><a class="btn_next btn_default" href="javascript:;">提交</a>' +
                '<a class="btn_prev btn_none" href="javascript:;">上一步</a></div>' +
                '</div>' +
                '</div>';
            pluginCenter.showChildWrap(settings.info.title, tmp);
            var $drawRule = $showChildWrap.find('.draw_rule');

            setObjContentWrap($drawRule);

            $('.timeInput').Zebra_DatePicker({
                // direction:[true,30],
                direction: true,
                show_week_number: '周'
            });
            $('.Zebra_DatePicker_Icon').css({
                'top': '6px',
                'left': '-30px'
            });
            $('.Zebra_DatePicker').css('z-index', '9999999');

            $drawRule.on('mouseenter', '.dh_tips', function() {
                hover_tip($(this), '中奖者将看到一个兑换码，需凭此兑换码才可领奖。您可在中奖名单找到有效兑换码进行对照然后发奖');
            });
            $drawRule.on('mouseenter', '.js_tips', function() {
                hover_tip($(this), '中奖者需在中奖后填写一份表单，提供姓名、手机、邮编、地址方可领奖');
            });

            $drawRule.on('click', '.check_label', function() {
                $(this).toggleClass('active');
                if ($(this).next('.desc_sr').length > 0) {
                    $(this).next('.desc_sr').fadeToggle(10);
                }
            });

            $drawRule.on('click', '.agree_rule', function() {
                $(this).toggleClass('active');
            });

            if (drawSettings.need_receive_address) {
                $("#needReceiveAddress").addClass('active');
            }

            if (drawSettings.use_exchange_code) {
                $("#useExchangeCode").addClass('active');
            }

            if (drawSettings.is_show_creator_notice) {
                $("#isShowCreatorNotice").click();
                $('#creatorNotice').val(drawSettings.creator_notice);
            }


            $drawRule.on('keyup', '#contactInfo', function() {
                validationNum($(this));
            });

            $drawRule.on('click', '#needReceiveAddress', function() {
                $drawRule.find('#useExchangeCode').removeClass('active');
            });

            $drawRule.on('click', '#useExchangeCode', function() {
                $drawRule.find('#needReceiveAddress').removeClass('active');
            })

            $drawRule.on('click', '.btn_prev', function() {
                pluginCenter.removeChildWrap();
                pluginCenter.luckyDrawSetPrize(drawSettings.pid, drawSettings);
            });

            $drawRule.on('click', '.btn_next', function() {
                if ($('.agree_rule').hasClass('active')) {
                    // TODO 获取抽奖规则
                    drawSettings.need_receive_address = $("#needReceiveAddress").hasClass('active') ? true : false;
                    drawSettings.use_exchange_code = $("#useExchangeCode").hasClass('active') ? true : false;
                    if ($('#isShowCreatorNotice').hasClass('active')) {
                        drawSettings.is_show_creator_notice = true;
                        drawSettings.creator_notice = $('#creatorNotice').val();
                    }
                    //awardinfo
                    var creatorName = $("<div>").text($("#creatorName").val()).html();
                    var contactInfo = $("#contactInfo").val();
                    var distributeTime = $("#distributeTime").val();
                    var distributeDesc = $("<div>").text($("#distributeDesc").val()).html();
                    if (creatorName && contactInfo && distributeTime && distributeDesc) {
                        drawSettings['creator_name'] = creatorName;
                        drawSettings['contact_info'] = contactInfo;
                        drawSettings['distribute_time'] = distributeTime;
                        drawSettings['distribute_desc'] = distributeDesc;
                    } else {
                        loadMack({
                            str: '请完整填写发奖人信息',
                            timer: 1500
                        });
                        return;
                    }
                    pluginCenter.showSmallWrap({
                        title: '提交确认',
                        type: 'confirm',
                        contentHtml: '<p style="color:#5c5c5c;font-size:16px;">为确保抽奖真实有效，提交后不可更改。如需更改，请<br/>在抽奖设置中新建抽奖。</p>',
                        btnOKFn: function() {
                            $drawRule.find('.load_mack').show();
                            var _xsrf = $.cookie('_xsrf');
                            $.ajax({
                                url: '/plugin/ajax/luckdraw/setting/' + drawSettings.pid + '/',
                                type: 'POST',
                                dataType: 'JSON',
                                data: {
                                    'settings': JSON.stringify(drawSettings),
                                    '_xsrf': _xsrf
                                },
                                success: function(ret) {
                                    if (ret.status == '200') {
                                        pluginCenter.removeChildWrap();
                                        pluginCenter.luckyDrawComplete();
                                        $drawRule.find('.load_mack').hide();
                                    }
                                }
                            });
                        },
                        btnCancelFn: function() {
                            pluginCenter.removeSmallWrap();
                        }
                    });
                } else {
                    loadMack({
                        str: '请同意抽奖管理规范',
                        timer: 1500
                    });
                }
            });
        };

        pluginCenter.luckyDrawAwardInfo = function(drawSettings) {
            var tmp = '<div class="award_info"><div class="load_mack"><span>保存中...</span></div>' +
                '<div class="content_wrap">' +
                '<h6>发奖人信息</h6>' +
                '<p>确保抽奖活动真实有效，活动需经问卷网审核，请确保以下信息真实准确！<span style="color:#f97c7c;">同时以下信息也将被公示给中奖者！</span></p>' +
                '<div class="clearfix">' +
                '<input type="text" class="txt name" placeholder="发奖人" id="creatorName"/>' +
                '<input type="text" class="txt phone" placeholder="电话" id="contactInfo"/>' +
                '<input type="text" class="txt time timeInput" placeholder="发奖时间" id="distributeTime"/>' +
                '</div>' +
                '<textarea placeholder="发奖方式" class="textarea" id="distributeDesc"></textarea>' +
                '</div>' +
                '<div class="btn_wrap">' +
                '<a class="btn_next btn_default" href="javascript:;">下一步</a>' +
                '<a class="btn_prev btn_none" href="javascript:;">上一步</a>' +
                '</div>' +
                '</div>';
            pluginCenter.showChildWrap(settings.info.title, tmp);
            var $awardInfo = $showChildWrap.find('.award_info');

            setObjContentWrap($awardInfo);

            $awardInfo.on('keyup', '#contactInfo', function() {
                validationNum($(this));
            });

            $awardInfo.on('click', '.btn_prev', function() {
                pluginCenter.removeChildWrap();
                pluginCenter.luckyDrawRule(drawSettings);
            });

            $('.timeInput').Zebra_DatePicker({
                // direction:[true,30],
                direction: 1,
                show_week_number: '周'
            });
            $('.Zebra_DatePicker_Icon').css({
                'top': '6px',
                'left': '-30px'
            });
            $('.Zebra_DatePicker').css('z-index', '9999999');

            $awardInfo.on('click', '.btn_next', function() {
                // TODO 获取抽奖信息 并保存drawSettings
                var creatorName = $("<div>").text($("#creatorName").val()).html();
                var contactInfo = $("#contactInfo").val();
                var distributeTime = $("#distributeTime").val();
                var distributeDesc = $("<div>").text($("#distributeDesc").val()).html();
                if (creatorName && contactInfo && distributeTime && distributeDesc) {
                    drawSettings['creator_name'] = creatorName;
                    drawSettings['contact_info'] = contactInfo;
                    drawSettings['distribute_time'] = distributeTime;
                    drawSettings['distribute_desc'] = distributeDesc;
                } else {
                    loadMack({
                        str: '请确定信息填写完整',
                        timer: 1500
                    });
                    return;
                }
                $awardInfo.find('.load_mack').show();
                var _xsrf = $.cookie('_xsrf');
                $.ajax({
                    url: '/plugin/ajax/luckdraw/setting/' + drawSettings.pid + '/',
                    type: 'POST',
                    dataType: 'JSON',
                    data: {
                        'settings': JSON.stringify(drawSettings),
                        '_xsrf': _xsrf
                    },
                    success: function(ret) {
                        if (ret.status == '200') {
                            pluginCenter.removeChildWrap();
                            pluginCenter.luckyDrawComplete();
                            $awardInfo.find('.load_mack').hide();
                        }
                    }
                });
            });
        };

        pluginCenter.luckyDrawComplete = function() {
            commonComplete({
                "imgUrl": '/static/images/plugin_center/bg_draw.png',
                "h4Text": '您的抽奖功能已启用',
                "text": "每次答题成功后可以获得一次抽奖机会",
                "showBtn": true,
                "btnText": '查看常见问题',
                "btnFn": function() {
                    parent.window.open('http://www.wenjuan.com/helpcenter/list/53916b15f7405b30051f15b8/h356d7eb7da320fc6ad8b71dcb');
                }
            });
        };

        var wx_signin_data; //项目列表页中微信签到所需数据
        pluginCenter.historyRecordList = function(pid) {
            //限定手机号答题
            if (settings.type == 'restrict_mobile_rspd') {
                pluginCenter.limiteMobileComplete(pid, 1);
                return;
            }
            var listStr = '';
            var tmp;
            var his_datas = JSON.parse($.ajax({
                url: '/plugin/ajax/history/',
                type: 'post',
                data: {
                    'plugin_id': settings.info.oid,
                    'project_id': pid,
                    '_xsrf': getCookie('_xsrf')
                },
                async: false
            }).responseText);
            wx_signin_data = his_datas;
            settings.is_going = false;
            if (settings.type == 'lucky_money') {
                for (var i = 0; i < his_datas.datas.length; i++) {
                    var status_str = '';
                    if (i == 0 && his_datas.datas[i].status == 4 || his_datas.datas[i].status == 5) {
                        settings.is_going = true;
                        status_str = '<a class="history_btn_link btn_primary fr cancel_btn cancel_envelope" href="javascript:;" oid="' + his_datas.datas[i].oid + '">取消该红包</a>'
                    }
                    var listStr_tmp = '<div class="history_surveys envelope_history_list">' +
                        '<p class="history_surveys_name">' +
                        str_Intercept(his_datas.datas[i].title) +
                        status_str +
                        '</p>' +
                        '<div class="history_surveys_info_box">' +
                        '<div class="history_surveys_info">' +
                        '<span class="info_span">' +
                        '红包类型：' +
                        '<span class="history_envelope">' + his_datas.datas[i].l_type_desc + '</span>' +
                        '</span>' +
                        '</div>' +
                        '<div class="history_surveys_info">' +
                        '<span class="info_span">' +
                        '红包总额：' +
                        '<span class="history_envelope">' + his_datas.datas[i].amount + ' 元</span>' +
                        '</span>' +
                        '</div>' +
                        '<div class="history_surveys_info wAuto">' +
                        '<span class="info_span">' +
                        '剩余金额：' +
                        '<span class="history_envelope">' + his_datas.datas[i].rest_money + ' 元</span>' +
                        '</span>' +
                        '</div>' +
                        '<div class="history_surveys_info">' +
                        '<span class="info_span">' +
                        '状态：' +
                        '<span class="history_envelope text_pink status_' + his_datas.datas[i].status + '">' + his_datas.datas[i].status_desc + '</span>' +
                        '</span>' +
                        '</div>' +
                        '<div class="history_surveys_info">' +
                        '<span class="info_span">' +
                        '已发金额：' +
                        '<span class="history_envelope">' + his_datas.datas[i].picked_money + ' 元</span>' +
                        '</span>' +
                        '</div>' +
                        '<div class="history_surveys_info wAuto">' +
                        '<span class="info_span">' +
                        '起止时间：' +
                        '<span class="history_envelope">' + his_datas.datas[i].begin_time + ' 至 ' + his_datas.datas[i].end_time + '</span>' +
                        '</span>' +
                        '</div>' +
                        '</div>' +
                        '<a class="history_btn_special winner_list" href="javascript:;" oid="' + his_datas.datas[i].oid + '">领取名单</a>' +
                        '</div>';
                    listStr += listStr_tmp;
                }

                tmp = '<div class="history_record history_record_list">' +
                    '<a class="history_btn_default btn_new" href="javascript:;">新建红包</a>' + listStr +
                    '</div>';
                pluginCenter.showChildWrap(settings.info.title, tmp);
            } else if (settings.type == 'lucky_draw') {
                for (var i = 0; i < his_datas.datas.info.length; i++) {
                    var status_str = '';
                    if (his_datas.datas.info[i].status == '1' || his_datas.datas.info[i].status == '3') {
                        status_str = '<a class="history_btn_link btn_primary fr cancel_btn cancel_luck_draw" oid="' + his_datas.datas.info[i].id + '" href="javascript:;">取消抽奖</a>';
                        settings.is_going = true;
                    }
                    var listStr_tmp = '<div class="history_surveys luck_surveys luckydraw_history_list">' +
                        '<p class="history_surveys_name">' +
                        str_Intercept(his_datas.title) +
                        status_str +
                        '</p>' +
                        '<div class="history_surveys_info_box">' +
                        '<div class="history_surveys_info">' +
                        '<span class="info_span">' +
                        '奖品总数：' +
                        '<span class="history_envelope">' + his_datas.datas.info[i].total_count + '</span>' +
                        '</span>' +
                        '</div>' +
                        '<div class="history_surveys_info">' +
                        '<span class="info_span">' +
                        '已抽奖项：' +
                        '<span class="history_envelope">' + (his_datas.datas.info[i].total_count - his_datas.datas.info[i].remain) + '</span>' +
                        '</span>' +
                        '</div>' +
                        '<div class="history_surveys_info">' +
                        '<span class="info_span">' +
                        '剩余奖项：' +
                        '<span class="history_envelope">' + his_datas.datas.info[i].remain + '</span>' +
                        '</span>' +
                        '</div>' +
                        '<div class="history_surveys_info">' +
                        '<span class="info_span">' +
                        '状态：' +
                        '<span class="history_envelope text_pink status_' + his_datas.datas.info[i].status + '">' + his_datas.datas.info[i].status_cn + '</span>' +
                        '</span>' +
                        '</div>' +
                        '<div class="history_surveys_info wAuto">' +
                        '<span class="info_span">' +
                        '起止时间：' +
                        '<span class="history_envelope">' + his_datas.datas.info[i].created + ' 至 ' + his_datas.datas.info[i].finished + '</span>' +
                        '</span>' +
                        '</div>' +
                        '</div>' +
                        '<a class="history_btn_special winner_list" oid="' + his_datas.datas.info[i].id + '" href="javascript:;">中奖名单</a>' +
                        '</div>';
                    listStr += listStr_tmp;
                }
                if (his_datas.is_avaliable == 1) {
                    tmp = '<div class="history_record history_record_list">' +
                        '<a class="history_btn_default btn_new" href="javascript:;">新建抽奖</a>' + listStr +
                        '</div>';
                } else {
                    tmp = '<div class="history_record history_record_list"><div class="btn_wrap_disabled"><a class="history_btn_default btn_new disabled" href="javascript:;">新建抽奖</a><p>该应用已于' + his_datas.expire_time + '到期，如需使用请 <a href="javascript:;" class="buy_again_btn">再次购买</a></p></div>' + listStr +
                        '</div>';
                }
                pluginCenter.showChildWrap(settings.info.title, tmp);
            }else if (settings.type == 'wx_signin') {
                var step = '';
                var pid = settings.project_single_id;
                var check_permission = true;
                $.ajax({
                  url : '/enterprise/check_member_permission/?permission_type=plugin&project_id='+pid,
                  type : 'GET',
                  dataType : 'json',
                  async : false,
                  success : function(ret){
                      if(ret.status == 200){
                          if(ret.code == 1){
                            check_permission = true;
                          }else if(ret.code == 2){ 
                            check_permission = false;
                          }
                      }else{
                          check_permission = false;
                      }
                  }
                });
                if(check_permission == false){
                    loadMack({
                        'str': '您没有权限使用，请联系项目所有者',
                        'timer': 1500
                    });
                    parent.window.location.reload();
                }
                var data = {
                        'pid': pid,
                        'is_expire': 0
                    };
                data.rspd_count = wx_signin_data.rspd_count;
                data.wxsignin_count = wx_signin_data.wxsignin_count;
                data.version = wx_signin_data.version;
                data.q_wx_signin_datetime_id = wx_signin_data.q_wx_signin_datetime_id;
                data.q_wx_signin_status_id = wx_signin_data.q_wx_signin_status_id;
                pluginCenter.wxSigninComplete(data);
            }
            var $historyRecordList = $showChildWrap.find('.history_record_list');

            setObjContentWrap($historyRecordList);

            $historyRecordList.on('click', '.winner_list', function() {
                pluginCenter.removeChildWrap();
                pluginCenter.historyRecordWinnerList($(this).attr('oid'), pid);
            });

            $historyRecordList.on('click', '.buy_again_btn', function() {
                pluginCenter.removeChildWrap();
                var options = {is_renew: true};
            });

            $historyRecordList.on('click', '.cancel_btn', function() {
                $('.history_surveys').removeClass('click');
                $(this).parents('.history_surveys').addClass('click');
                pluginCenter.cancelConfirm($(this).attr('oid'), pid);
            });

            $historyRecordList.on('click', '.btn_new', function() {
                if (!$(this).hasClass('disabled')) {
                    if (settings.type == 'lucky_draw') {
                        pluginCenter.createConfirm(settings.is_going, pid, $(".history_btn_link.btn_primary.fr.cancel_btn.cancel_luck_draw").attr("oid"));
                    } else if (settings.type == 'lucky_money') {
                        pluginCenter.createConfirm(settings.is_going, pid, $(".history_btn_link.btn_primary.fr.cancel_btn.cancel_envelope").attr("oid"));
                    }
                }
            });
        }

        pluginCenter.historyRecordWinnerList = function(batch_id, pid, chart_datas_old, table_datas_old) {
            var chart_datas;
            var table_datas;
            if (!chart_datas_old) {
                chart_datas = JSON.parse($.ajax({
                    url: '/plugin/ajax/history_detail/',
                    type: 'post',
                    data: {
                        'plugin_id': settings.info.oid,
                        'data_type': 'chart',
                        'pid': pid,
                        'batch_id': batch_id,
                        '_xsrf': getCookie('_xsrf')
                    },
                    async: false
                }).responseText);
                //table_datas = JSON.parse($.ajax({url:'/plugin/ajax/history_detail/', type: 'post',data: {'plugin_id':settings.info.oid, 'data_type': 'table', 'pid': pid, 'batch_id': batch_id, '_xsrf': getCookie('_xsrf')}, async:false}).responseText);
            } else {
                chart_datas = chart_datas_old;
                table_datas = table_datas_old;
            }
            var join_count = 0,
                title_bt;
            if (settings.type == 'lucky_money') {
                join_count = chart_datas.rspd_count;
                title_bt = "领取名单";
            } else if (settings.type == 'lucky_draw') {
                join_count = chart_datas.chart_datas.draw_count;
                title_bt = "中奖名单";
            }
            var tmp = '<div class="history_record history_record_winner_list">' +
                '<a class="history_btn_link btn_primary btn_back" href="javascript:;">' +
                '<i></i>' +
                '返回' +
                '</a>' +
                '<div class="history_box">' +
                '<div class="history_chats">' +
                '<div class="history_chats_watch fl">' +
                '<div id="chart_content"></div>' +
                '<p class="textC">' +
                '参与总人数：' +
                '<span class="text_pink">' + join_count + '</span>' +
                '</p>' +
                '</div>' +
                '<div class="history_chats_watch fr"></div>' +
                '</div>' +
                '<div class="history_list">' +
                '<p class="history_list_p">' + title_bt + '</p>' +
                '<ul class="page_ck"><li class="status_bt" st="2">待发放</li><li class="status_bt" st="3">已发放</li><li class="status_bt" st="1">不发放</li></ul>' +
                '<a class="history_btn_special btn_down_list" href="javascript:;">' +
                '<i></i>' +
                '导出' + title_bt + '' +
                '</a>' +
                '<table class="history_list_table"></table>' +
                '<div class="page_wrap" style="float:right;"><div class="c_paginationa project_list clearfix">' +
                '<div class="c_pagenum"></div>' +
                '</div></div>' +
                '</div>' +
                '</div>' +
                '</div>';
            pluginCenter.showChildWrap('查看' + title_bt + '', tmp);

            var $historyRecordWinnerList = $showChildWrap.find('.history_record_winner_list');
            setObjContentWrap($historyRecordWinnerList);

            //填充报表右侧和下面的表格数据
            var rightStr;
            var chart_data = new Array();

            if (settings.type == 'lucky_money') {
                chart_data = chart_datas.pie_data;

                rightStr = '<div class="round_cont">' +
                    '<div class="txt">' +
                    '<p><span>' + chart_datas.picker_count + '</span>个</p>' +
                    '<p>已发红包</p>' +
                    '</div>' +
                    '</div>' +
                    '<p class="textC">' +
                    '剩余红包：' +
                    '<span class="text_pink">' + chart_datas.rest_count + '个</span>' +
                    '</p>' +
                    '<p class="textC">' +
                    '剩余金额：' +
                    '<span class="text_pink">' + chart_datas.rest_amount + '元</span>' +
                    '</p>' +
                    '<p class="textC">' +
                    '红包总额：' +
                    '<span class="text_pink">' + chart_datas.amount + '元</span>' +
                    '</p>';

                $historyRecordWinnerList.find('.history_chats_watch.fr').html(rightStr);
                $('.round_cont').circleProgress({
                    value: chart_datas.picker_count / (chart_datas.picker_count + chart_datas.rest_count),
                    startAngle: -Math.PI * 0.5,
                    size: 190,
                    fill: {
                        gradient: ['#f47a69', '#f47a69']
                    }
                });
                $historyRecordWinnerList.find('.history_chats_watch.fl').hide();
                $historyRecordWinnerList.find('.history_chats_watch.fr').css('width', '100%');
            } else if (settings.type == 'lucky_draw') {

                chart_data = [
                    ['中奖人数', chart_datas.chart_datas.winner_count],
                    ['未中奖人数', chart_datas.chart_datas.draw_count - chart_datas.chart_datas.winner_count]
                ];

                rightItem = '';
                for (var i = 0; i < chart_datas.chart_datas.prizes.length; i++) {
                    rightItem += '<li class="grade' + chart_datas.chart_datas.prizes[i].level + '">' +
                        '<p><span style="width:' + ((chart_datas.chart_datas.prizes[i].count - chart_datas.chart_datas.prizes[i].remain) / chart_datas.chart_datas.prizes[i].count) * 100 + '%;"></span><em>' + (chart_datas.chart_datas.prizes[i].count - chart_datas.chart_datas.prizes[i].remain) + '/' + chart_datas.chart_datas.prizes[i].count + '</em></p>' +
                        '<span class="dj">' + chart_datas.chart_datas.prizes[i].level_cn + '</span>' +
                        '</li>';
                }
                rightStr = '<div class="draw_win_list"><ul>' + rightItem + '</ul></div>';
                $historyRecordWinnerList.find('.history_chats_watch.fr').html(rightStr);
            }
            render_chart('chart_content', chart_data);

            var totalPage = 1;
            curPage = 1, ec_s = '', re_addr_s = '';
            getTrList(pid, function() {
                if (totalPage > 1) {
                    $historyRecordWinnerList.find('.project_list .c_pagenum').createPage({
                        pageCount: totalPage,
                        current: curPage,
                        backFn: function(cur) {
                            curPage = cur;
                            getTrList(pid);
                        }
                    });
                };
            });

            function getTrList(pid, fn) {
                $.ajax({
                    "url": "/plugin/ajax/history_detail/",
                    "type": "POST",
                    "data": {
                        'plugin_id': settings.info.oid,
                        'data_type': 'table',
                        'pid': pid,
                        'batch_id': batch_id,
                        'page': curPage,
                        'num_per_page': 10,
                        '_xsrf': getCookie('_xsrf')
                    },
                    async: false,
                    "dataType": "JSON",
                    success: function(data) {
                        table_datas = data;
                        var data;
                        if (settings.type == 'lucky_draw') {
                            data = data.table_datas;
                            $historyRecordWinnerList.find($('.history_record .page_ck li')).removeClass('active');;
                            $historyRecordWinnerList.find($('.history_record .page_ck')).hide();
                            $historyRecordWinnerList.find(".history_list_p").show();
                        }
                        curPage = data.page;
                        totalPage = data.page_count;
                        var total_tr_str = '';
                        var tableListStr = '';
                        if (settings.type == 'lucky_money') {
                            $.each(data.winners, function(i) {
                                total_tr_str += '<tr>' +
                                    '<td>' + data.winners[i].seq + '</td>' +
                                    '<td>￥' + data.winners[i].amount + '</td>' +
                                    '<td>' + data.winners[i].status + '</td>' +
                                    '<td>' + data.winners[i].pick_time + '</td>' +
                                    '<td>' +
                                    '<a class="history_btn_link btn_primary btn_look" target="_blank" href="/report/rspd_detail/' + pid + '/' + data.winners[i].seq + '?v=1&pid=' + pid + '">查看</a>' +
                                    '</td>' +
                                    '</tr>';
                            });
                            tableListStr = '<tr>' +
                                '<th>填写序号</th>' +
                                '<th>红包金额</th>' +
                                '<th>红包状态</th>' +
                                '<th>发放时间</th>' +
                                '<th>填写内容</th>' +
                                '</tr>' + total_tr_str;
                        } else if (settings.type == 'lucky_draw') {
                            if (!data.need_receive_address) {
                                re_addr_s = 'display:none';
                            }
                            if (!data.use_exchange_code) {
                                ec_s = 'display:none';
                            }
                            $.each(data.winners, function(i) {
                                total_tr_str += '<tr>' +
                                    '<td><i class="ck_bt"></i></td>' +
                                    '<td>' + data.winners[i].seq + '</td>' +
                                    '<td>' + data.winners[i].prize_level + '</td>' +
                                    '<td class="max"><p>' + data.winners[i].prize_name + '</p></td>' +
                                    '<td>' + data.winners[i].created + '</td>' +
                                    '<td>' + data.winners[i].send_status + '</td>' +
                                    '<td style="' + ec_s + '">' + data.winners[i].exchange_code + '</td>' +
                                    '<td style="' + re_addr_s + '">' +
                                    '<a seq="' + data.winners[i].seq + '" class="history_btn_link look_address btn_primary btn_look" href="javascript:;">查看</a>' +
                                    '</td>' +
                                    '<td>' +
                                    '<a class="history_btn_link see_detail btn_primary btn_look" target="_blank" seq="' + data.winners[i].seq + '" status="' + data.winners[i].status + '"  >查看</a>' +
                                    '</td>' +
                                    '</tr>';
                            });
                            tableListStr = '<tr>' +
                                '<th><i class="input_ck"></i></th>' +
                                '<th>填写序号</th>' +
                                '<th>所中奖项</th>' +
                                '<th>奖品名称</th>' +
                                '<th>中奖时间</th>' +
                                '<th>状态</th>' +
                                '<th style="' + ec_s + '">兑换序列号</th>' +
                                '<th style="' + re_addr_s + '">收奖地址</th>' +
                                '<th>填写内容</th>' +
                                '</tr>' + total_tr_str;
                        }
                        $historyRecordWinnerList.find('.history_list_table').html(tableListStr);
                        if (fn) fn();
                    }
                });
            }
            var history_obj = $historyRecordWinnerList.find(".history_list_p");
            var status_bt_obj = $historyRecordWinnerList.find($('.history_record .page_ck'));
            $historyRecordWinnerList.on('click', 'i.ck_bt', function() {
                $(this).toggleClass('active');
                if ($historyRecordWinnerList.find("td i.active").length == 0){
                    status_bt_obj.hide();
                    status_bt_obj.find("li").removeClass('active');
                    history_obj.show();
                }else{
                    status_bt_obj.show();
                    history_obj.hide();
                }
            });

            $historyRecordWinnerList.on('click', 'i.input_ck', function() {
                if ($(this).hasClass('active')){
                    $(this).removeClass('active');
                    $historyRecordWinnerList.find("i.ck_bt").removeClass('active');
                    status_bt_obj.hide();
                    history_obj.show();
                    status_bt_obj.find("li").removeClass('active');
                }else{
                    $(this).addClass('active');
                    $('.history_record .history_list_table tr i').addClass('active');
                    if ($historyRecordWinnerList.find("td i.active").length != 0){
                        history_obj.hide();
                        status_bt_obj.show();
                    }
                }
            });

            $historyRecordWinnerList.on('click', '.page_ck .status_bt', function() {
                if ($historyRecordWinnerList.find(".page_ck_bt").length > 0){
                    loadMack({str: '后台保存中，请稍后操作', timer: 500});
                    return false;
                }
                $historyRecordWinnerList.find(".page_ck").addClass("page_ck_bt");
                $(this).addClass('active').siblings().removeClass('active');
                var status_name = $(this).html();
                var st = $(this).attr("st");
                var seq = "";
                $historyRecordWinnerList.find("i.ck_bt").each(function(){
                    if ($(this).hasClass('active')){
                        var this_tr_obj = $(this).parents("tr");
                        seq += this_tr_obj.find("td:eq(1)").html() + "|";
                    }
                });
                $.ajax({
                    url: '/plugin/ajax/luckdraw/update_prize_send_status/',
                    type: 'POST',
                    dataType: 'json',
                    data: {project_id: pid,seq: seq,prize_status: st, '_xsrf': getCookie('_xsrf')},
                    traditional: true,
                    async: false,
                    success: function(data){
                        if (data.status == 200){
                            $historyRecordWinnerList.find("i.ck_bt").each(function(){
                                if ($(this).hasClass('active')){
                                    var this_tr_obj = $(this).parents("tr");
                                    this_tr_obj.find("td:eq(5)").html(status_name);
                                }
                            });
                            loadMack({str: '更改成功', timer: 500 });
                        }else{
                            loadMack({str: '网络繁忙，请稍后再试', timer: 1000 });
                        }
                        $historyRecordWinnerList.find(".page_ck").removeClass("page_ck_bt");
                    }
                });
            });

            $historyRecordWinnerList.on('click', '.look_address', function() {
                pluginCenter.removeChildWrap();
                pluginCenter.historyRecordAddressInfo($(this).attr('seq'), batch_id, pid, chart_datas, table_datas);
            });

            $historyRecordWinnerList.on('click', '.see_detail', function() {
                if ($(this).attr('status') == '1') {
                    window.open('/report/rspd_detail/' + pid + '/' + $(this).attr('seq') + '?v=1&pid=' + pid);
                } else {
                    alert('填写内容已经被删除');
                }
            });

            $historyRecordWinnerList.on('click', '.btn_back', function() {
                pluginCenter.removeChildWrap();
                pluginCenter.historyRecordList(pid);
            });

            $historyRecordWinnerList.on('click', '.btn_down_list', function() {
                $("#download_form input[name='batch_id']").val(batch_id);
                $("#download_form input[name='plugin_id']").val(settings.info.oid);
                $("#download_form input[name='pid']").val(pid);
                if (settings.type == 'lucky_draw') {
                    if (table_datas.table_datas.winners.length == 0) {
                        alert('中奖名单为空');
                        return;
                    }
                    $("#download_form input[name='total_count']").val(table_datas.table_datas.total_count);
                } else if (settings.type == 'lucky_money') {
                    $("#download_form input[name='total_count']").val(table_datas.total_count);
                }
                $("#download_form").submit();
            });
        }

        pluginCenter.historyRecordAddressInfo = function(seq, batch_id, pid, chart_datas, table_datas) {
            var data_obj;
            for (var i = 0; i < table_datas.table_datas.winners.length; i++) {
                if (table_datas.table_datas.winners[i].seq == seq) {
                    data_obj = table_datas.table_datas.winners[i].receiptor_info;
                }
            }
            if (data_obj) {
                var tmp = '<div class="history_record address_info">' +
                    '<a class="history_btn_link btn_primary btn_back" href="javascript:;">' +
                    '<i></i>' +
                    '返回' +
                    '</a>' +
                    '<div class="history_winners">' +
                    '<p>' +
                    '<span class="text_gray">收件人：</span>' +
                    '<span class="">' + data_obj.name + '</span>' +
                    '</p>' +
                    '<p>' +
                    '<span class="text_gray">手     机：</span>' +
                    '<span class="">' + data_obj.mobile + '</span>' +
                    '</p>' +
                    '<p>' +
                    '<span class="text_gray">邮     编：</span>' +
                    '<span class="">' + data_obj.zipcode + '</span>' +
                    '</p>' +
                    '<p>' +
                    '<span class="text_gray">收件地址：</span>' +
                    '<span class="">' + data_obj.province + data_obj.city + data_obj.region + data_obj.address + '</span>' +
                    '</p>' +
                    '</div>' +
                    '</div>';
            } else {
                var tmp = '<div class="history_record address_info">' +
                    '<a class="history_btn_link btn_primary btn_back" href="javascript:;">' +
                    '<i></i>' +
                    '返回' +
                    '</a>' +
                    '<div class="history_winners">' +
                    '<p>中奖者未填写收货地址</p>'
                '</div>' +
                '</div>';
            }

            pluginCenter.showChildWrap('查看收货地址', tmp);
            var $historyRecordAddressInfo = $showChildWrap.find('.address_info');

            setObjContentWrap($historyRecordAddressInfo);

            $historyRecordAddressInfo.on('click', '.btn_back', function() {
                pluginCenter.removeChildWrap();
                pluginCenter.historyRecordWinnerList(batch_id, pid, chart_datas, table_datas);
            });
        }

        pluginCenter.createConfirm = function(is_going, pid, oid) {
            if (is_going) {
                var tmp;
                if (settings.type == 'lucky_draw') {
                    tmp = '<div class="history_text alert_using">' +
                        '<p class="maxWi">' +
                        '新的抽奖设置成功后，之前的抽奖自动取消，系统自动替换为新的抽奖。<span class="text_pink">请遵守<a href="/about/drawrule" target="_blank" class="btn_gray">《抽奖管理规范》</a>对已中奖的用户继续履行发奖义务！</span>' +
                        '</p>' +
                        '</div>';
                } else if (settings.type == 'lucky_money') {
                    tmp = '<div class="history_text alert_using">' +
                        '<p class="maxWi">' +
                        '您将创建一个新的红包订单，在当前项目中，如果有未发完的红包将被取消，红包余额将在<span style="color:#ef6262;">24小时之后</span>退还至您的<span style="color:#ef6262;">账号余额</span>；如果有未审核的红包，将立即退还到您的<span style="color:#ef6262;">账户余额</span>。' +
                        '</p>' +
                        '</div>';
                }

                pluginCenter.showSmallWrap({
                    title: '新建提示',
                    type: 'confirm',
                    contentHtml: tmp,
                    btnOKFn: function() {
                        pluginCenter.removeSmallWrap();
                        if (settings.type == 'lucky_draw') {
                            // var ret = JSON.parse($.ajax({url:'/plugin/ajax/update_draw_status/', type: 'post',data: {'batch_id':oid, 'project_id': pid, '_xsrf': getCookie('_xsrf')}, async:false}).responseText);
                            // if(ret.status==200){
                            //     $('.history_envelope.text_pink').html('已结束');
                            //     $('.history_btn_link.btn_primary.fr.cancel_btn.cancel_luck_draw').hide();
                            pluginCenter.luckyDrawSetPrize(pid);
                            // }
                        } else if (settings.type == 'lucky_money') {
                            var ret = JSON.parse($.ajax({
                                url: '/plugin/ajax/update_luckymoney_status/',
                                type: 'post',
                                data: {
                                    'lucky_money_setting_id': oid,
                                    'status': 2,
                                    '_xsrf': getCookie('_xsrf')
                                },
                                async: false
                            }).responseText);
                            if (ret.status == 200) {
                                $('.history_surveys.click .history_envelope.text_pink').html('已取消');
                                $('.history_surveys.click .history_btn_link.btn_primary.fr.cancel_btn.cancel_envelope').hide();
                                settings.plugin_pid = pid;
                                pluginCenter.setEnvelope(pid);
                            }
                        }
                    },
                    btnCancelFn: function() {
                        pluginCenter.removeSmallWrap();
                    }
                });
            } else {
                pluginCenter.removeSmallWrap();
                if (settings.type == 'lucky_draw') {
                    pluginCenter.luckyDrawSetPrize(pid);
                } else if (settings.type == 'lucky_money') {
                    settings.plugin_pid = pid;
                    pluginCenter.setEnvelope(pid);
                }
            }
        }

        pluginCenter.cancelConfirm = function(oid, pid) {
            var tmp, type_str;
            if (settings.type == 'lucky_money') {
                type_str = "红包";
                tmp = '<div class="history_text">' +
                    '<p class="maxWi">' +
                    '您的红包订单将被取消，如果有尚未发完的红包，红包余额将在<span style="color:#ef6262;">24小时之后</span>退还至您的<span style="color:#ef6262;">账号余额</span>；如果该红包尚未审核，将立即退还到您的<span style="color:#ef6262;">账户余额</span>。' +
                    '</p>' +
                    '</div>';
            } else if (settings.type == 'lucky_draw') {
                type_str = "抽奖";
                tmp = '<div class="history_text">' +
                    '<p class="maxWi">' +
                    '您的抽奖功能将被取消，填写您问卷的用户将无法抽奖，' +
                    '<span class="text_pink">请对已中奖用户，请继续履行发奖义务！</span>' +
                    '</p>' +
                    '<p class="maxWi">' +
                    '<span class="text_gray">详见</span>' +
                    '<a href="/about/drawrule" target="_blank" class="btn_gray">《抽奖管理规范》</a>' +
                    '</p>' +
                    '</div>';
            }

            pluginCenter.showSmallWrap({
                title: '取消' + type_str + '确认',
                type: 'confirm',
                contentHtml: tmp,
                btnCancelText: '取消',
                btnOKFn: function() {
                    if (settings.type == 'lucky_draw') {
                        var ret = JSON.parse($.ajax({
                            url: '/plugin/ajax/update_draw_status/',
                            type: 'post',
                            data: {
                                'batch_id': oid,
                                'project_id': pid,
                                '_xsrf': getCookie('_xsrf')
                            },
                            async: false
                        }).responseText);
                        if (ret.status == 200) {
                            $('.history_envelope.text_pink').html('已结束').css('color', '#9c9c9c');
                            $('.history_btn_link.btn_primary.fr.cancel_btn.cancel_luck_draw').hide();
                            settings.is_going = false;
                        }
                    } else if (settings.type == 'lucky_money') {
                        var ret = JSON.parse($.ajax({
                            url: '/plugin/ajax/update_luckymoney_status/',
                            type: 'post',
                            data: {
                                'lucky_money_setting_id': oid,
                                'status': 2,
                                '_xsrf': getCookie('_xsrf')
                            },
                            async: false
                        }).responseText);
                        if (ret.status == 200) {
                            $('.history_surveys.click .history_envelope.text_pink').html('已取消').css('color', '#9c9c9c');
                            $('.history_surveys.click .history_btn_link.btn_primary.fr.cancel_btn.cancel_envelope').hide();
                            settings.is_going = false;
                        }
                    }
                    pluginCenter.removeSmallWrap()
                },
                btnCancelFn: function() {
                    pluginCenter.removeSmallWrap();
                }
            });
        }

        var prizeIndex = ['一等奖', '二等奖', '三等奖', '四等奖', '五等奖', '六等奖', '七等奖', '八等奖'];

        function _setPrizeIndex() {
            var len = $('.draw_prize ul li').length;
            if (len > 3) {
                $('.draw_prize .auto').scrollTop($('.auto ul').height() - $('.auto').height() + 20);
            }
            $('.draw_prize ul li').each(function(index, i) {
                $(this).find('h6').text(prizeIndex[index]);
                $(this).find('input:file').attr('id', 'inputPrizePic' + (index + 1));
            });
            $('.set_prize_pic p img').attr('src', '/static/images/plugin_center/draw-way-zp' + len + '.png');
        }

        function projectType(p_class) {
            var p_type = '';
            if (p_class == 'survey') {
                p_type = '问卷';
            } else if (p_class == 'form') {
                p_type = '表单';
            } else if (p_class == 'assess') {
                p_type = '测评';
            }
            return p_type;
        }

        function hover_tip(obj, txt) {
            $('body').append('<p class="c_hover_tip">' + txt + '</p>');
            $('.c_hover_tip').css({
                'z-index': '99999999',
                'left': obj.offset().left + obj.outerWidth() + 8,
                'top': obj.offset().top + (obj.outerHeight() - 29) / 2
            });
            obj.on('mouseleave', function() {
                $('.c_hover_tip').remove();
            });
        }

        function confirmPay() {
            var buyObj = $('.lucky_draw_paid_box .active');
            // var needMoney = $('.dialog_application .userMoney i').html();
            if (settings.type == "lucky_money"){
                pluginCenter.envelopeConfirmPay(envelopePaidSettings_qj);
            }else{
                pluginCenter.appSubmit(buyObj.attr('id'));
            }
        }

        function discount_info(currency_info) {

            var discount_str = '',
                discount_arr = [];
            var type_Company = {'2':'折', '3':'元'},
                type_Company_v = {'2':10, '3':1};
            if (currency_info.data.length > 0) {
                discount_str = '<div class="discount_paid"><span>&nbsp;&nbsp;&nbsp;优惠券：</span><select>';
                discount_str += '<option oid="" value="1" c_type="" class="init_C">不使用</option>';
                for (var i = 0; i < currency_info.data.length; i++) {
                    tmp = '<option oid="' + currency_info.data[i].oid + '" value="' + currency_info.data[i].value + '" c_type="' + currency_info.data[i].c_type + '">' + currency_info.data[i].value * type_Company_v[currency_info.data[i].c_type] + type_Company[currency_info.data[i].c_type] + '优惠券</option>';
                    discount_str += tmp;
                    discount_arr.push(currency_info.data[i].value);
                }
                discount_str += '</select><span class="discount_val">优惠<i>0</i>元</span></div>';
                discount_arr.sort(function(a, b) {
                    return a - b;
                })
            }

            return {
                discount_str: discount_str,
                discount_arr: discount_arr
            }

        }

        // 更新优惠券列表
        function init_paid_select($buy_time_select, currency_info, total_consumption, buy_time){
            var scope_type = 'year',
                type_Company = {'2':'折', '3':'元'},
                type_Company_v = {'2':10, '3':1};
            if ($buy_time_select.length>0){
                $buy_time_select.find("option").not(".init_C").remove();
                if (buy_time != 12){scope_type = 'month';}
                var option_str = '';
                var add_num = 0;
                for (var i = 0; i < currency_info.data.length; i++){
                    if (!((currency_info.data[i].scope.indexOf('year') != -1 || currency_info.data[i].scope.indexOf('month') != -1) && currency_info.data[i].scope.indexOf(scope_type) == -1)){
                        if (!currency_info.data[i].satisfy_value || (parseFloat(total_consumption) >= parseFloat(currency_info.data[i].satisfy_value))){
                            option_str += '<option oid="' + currency_info.data[i].oid + '" value="' + currency_info.data[i].value + '" c_type="' + currency_info.data[i].c_type + '">' + currency_info.data[i].value * type_Company_v[currency_info.data[i].c_type] + type_Company[currency_info.data[i].c_type] + '优惠券</option>';
                            add_num += 1;
                        }
                    }
                }
                if (add_num == 0){
                    $buy_time_select.find("option:eq(0)").attr("selected", true);
                    $buy_time_select.find(".init_C").text("无优惠券可用")
                }else{
                    $buy_time_select.find(".init_C").text("不使用");
                    $buy_time_select.append(option_str);
                    $buy_time_select.find("option:eq(1)").attr("selected", true);
                }
                settings.discount_id = $buy_time_select.find("option:selected").attr("oid");
            }
        }

        //购买时长
        function buy_time_info(num_month, buy_name) {
            var buy_time_list = [
                ["1", "1个月"],
                ["2", "2个月"],
                ["3", "3个月"],
                ["4", "4个月"],
                ["5", "5个月"],
                ["6", "6个月"],
                ["7", "7个月"],
                ["8", "8个月"],
                ["9", "9个月"],
                ["10", "10个月"],
                ["11", "11个月"],
                ["12", "1年"]
            ];
            var buy_time_str = '<div class="buy_time_length"><span>购买时长：</span><select>';
            if (typeof(buy_name) != 'undefined') {
                buy_time_str = '<div class="buy_time_length"><span>' + buy_name + '：</span><select>';
            }
            for (var i = 0; i < num_month; i++) {
                buy_time_str += '<option value=' + buy_time_list[i][0] + '>' + buy_time_list[i][1] + '</option>';
            }
            buy_time_str += '<option selected="selected" value="12">1年</option>';
            buy_time_str += '</select><span class="discount_val">花6个月的钱享12个月的优惠</span></div>';
            return buy_time_str;
        }

        function discount(price, discount, obj, time_num, c_type) {
            settings.month_count = time_num;
            settings.c_type = c_type;
            var max_month = 6;
            if (time_num && parseInt(time_num) < max_month && price < 100) {
                price = price * parseInt(time_num);
            }
            var real_pay = Number(price).toFixed(2);
            if (c_type && c_type != 'undefined'){
                if (c_type == '2'){
                    real_pay = Number(price * discount).toFixed(2);
                }else{
                    if (parseFloat(price)<=parseFloat(discount)){
                        real_pay = 0;
                    }else{
                        real_pay = Number(price - discount).toFixed(2);
                    }
                }
            }
            var discount_val = Number(price - real_pay).toFixed(2);
            obj.find('.discount_paid .discount_val i').html(discount_val);
            obj.find('.userMoney i').html(real_pay);
        }

        function str_Intercept(str_t) {
            if (str_t.length > 46) {
                return str_t.substring(0, 46) + "..."
            } else {
                return str_t
            }
        }

        function commonComplete(options) {
            var commonCompleteSettings = {
                "imgUrl": '',
                "h4Text": '',
                "text": "",
                "showBtn": true,
                "btnText": '查看示例',
                "btnFn": "",
                "audit":false,
                "buy_app_active":{},
                "blank": true,
            };

            $.extend(commonCompleteSettings, options);
            var imgTmp = '<img src="' + commonCompleteSettings.imgUrl + '" />';
            var h4TextTmp = '<h4>' + commonCompleteSettings.h4Text + '</h4>';
            var textTmp = '<p>' + commonCompleteSettings.text + '</p>';
            var btnTmp = '';
            var envelope_info = "";
            var app_active_bt = "";
            if (commonCompleteSettings.showBtn == true) {
                if (commonCompleteSettings.blank) {
                    btnTmp = '<a class="btn" href="javascript:;" target="_blank">' + commonCompleteSettings.btnText + '</a>';
                } else {
                    btnTmp = '<a class="btn" href="javascript:;">' + commonCompleteSettings.btnText + '</a>';
                }
            };
            if (commonCompleteSettings.audit){
                envelope_info = "<div class='info_box'><p class='info_title'>红包审核时间</p><p>1、工作时间（9:00-18:30）：<span class='Warning'>2个小时内</span></p><p>2、非工作时间：<span class='Warning'>2-5个小时</span></p></div>";
            }

            if (commonCompleteSettings.buy_app_active.m_lucky_id){
                // app_active_bt = '<div class="active_bt"><img src="/static/images/plugin_center/active_bt.png" alt="" />扫码分享<br/>领现金红包</div>';
                var url = '/images/get_matrix_img?survey_url=' + encodeURIComponent(window.location.protocol + '//' + window.location.host + '/luckymoney/share_for_market_lucky_money/' + commonCompleteSettings.buy_app_active.m_lucky_id +'/?vcode=' + commonCompleteSettings.buy_app_active.vcode) + '&box_size=20',
                app_active_bt =
                    '<div class="active_mark">' +
                        '<div class="active_smallWrap show_smallWrap">' +
                            '<i class="active_close"></i>' +
                            // '<p class="active_describe" >感谢您购买问卷网应用<br/>奖励您一个微信红包！17（一起）前行！</p>' +
                            '<img class="active_erweima" src='+ url +' alt="" />' +
                            '<a class="refuse_to_led" id="'+commonCompleteSettings.buy_app_active.m_lucky_id+'" href="javascript:;"></a>' +
                        '</div>' +
                    '</div>';
            }
            var tmp = '<div class="common_complete">' + imgTmp + h4TextTmp + textTmp + btnTmp + envelope_info + app_active_bt + '</div>';
            pluginCenter.showChildWrap(settings.info.title, tmp);
            var $envelopeComplete = $showChildWrap.find('.common_complete');
            $envelopeComplete.on('click', '.btn', function() {
                if (commonCompleteSettings.showBtn == true) commonCompleteSettings.btnFn();
            });

            $('.head_title').on('click', '.close', function() {
                if (settings.type == 'lucky_draw') {
                    if ($(".wj_nav .active", parent.document).length > 0) {
                        parent.window.location.href = $(".wj_nav .active", parent.document).attr('href');
                    }
                }
            });
            $envelopeComplete.on('mouseenter', '.cj_tip', function() {
                hover_tip($(this), '如果您设置过跳转逻辑，请注意“提前<br/>结束不计入结果”不是正常提交');
            });
            $envelopeComplete.on('click', '.active_close', function() {
                $envelopeComplete.find(".active_mark").hide();
            });
            $envelopeComplete.on('click', '.refuse_to_led', function() {
                $.ajax({
                    url: '/luckymoney/refuse_market_lucky_money/',
                    type: 'POST',
                    data: {'_xsrf': getCookie('_xsrf'), 'id': $(this).attr("id")},
                    success:function(data){
                        if (data.status == 200){
                            $("#maptss, .active_mark, .popupComponent").remove();
                        }else{
                            loadMack({off: 'on', Limg: 0, text: '系统繁忙，请稍后再试', set: 1000 });
                        }
                    }
                });
            });

      //       $envelopeComplete.on('click', '.active_bt', function() {
      //           if ($envelopeComplete.find(".active_mark").length > 0){
      //               $envelopeComplete.find(".active_mark").show();
      //           }else{
      //                // 显示二维码图片
					 // if (commonCompleteSettings.buy_app_active.m_lucky_id){
					 //     url = '/images/get_matrix_img?survey_url=' + window.location.protocol + '//' + window.location.host +  '/luckymoney/share_for_market_lucky_money/' + commonCompleteSettings.buy_app_active.m_lucky_id + '&box_size=20',
      //                    app_active = '<div class="active_mark"><div class="active_smallWrap show_smallWrap"><img class="active_erweima" src='+ url +' alt="" /><i class="active_close"></i></div></div>';
      //                    $envelopeComplete.append(app_active);
					 // }
      //           }
      //       });
        };

        function setObjContentWrap(obj) {
            obj.find('.content_wrap').css({
                'height': getContentWrapH()
            });
        };

        function getContentWrapH() {
            var contentWrapH = $dialogApplication.innerHeight() - $showChildWrap.find('.btn_wrap').innerHeight() - $dialogApplication.find('.show_childWrap .head_title').innerHeight();
            return contentWrapH;
        };

        function loadMack(options) {
            var loadMackSettings = {
                str: '',
                timer: 800
            };
            $.extend(loadMackSettings, options);
            var $loadMack = $('<div style="position: fixed; z-index: 99999901;width:100%;height:100%;left:0px; top:0px; background:rgba(255,255,255,0.2);"><div style="position: fixed; border-radius: 5px; background:url(/static/images/plugin_center/bg_70.png); color: #fff; line-height:40px; font-size:14px; padding: 0 10px;">' + loadMackSettings.str + '</div></div>');
            $('body').append($loadMack);
            var iL = ($(window).width() - parseInt($loadMack.find('div').css('width'))) / 2;
            var iT = ($(window).height() - parseInt($loadMack.find('div').css('height'))) / 2;
            $loadMack.find('div').css({
                'left': iL,
                'top': iT
            });
            setTimeout(function() {
                $loadMack.remove();
            }, loadMackSettings.timer);
        };

        function validationNum(obj, isDisc) {
            //没有第二个参数说明不能输入点
            if (isDisc) {
                obj.val(obj.val().replace(/[^\d.]/g, "")); //清除“数字”和“.”以外的字符
            } else {
                if (obj.attr('id') == "contactInfo") {
                    obj.val(obj.val().replace(/[^\d-]/g, ""));
                } else {
                    obj.val(obj.val().replace(/[^\d]/g, ""));
                }
            }
            obj.val(obj.val().replace(/^\./g, "")); //验证第一个字符是数字而不是.
            obj.val(obj.val().replace(/\.{2,}/g, ".")); //只保留第一个. 清除多余的.
            obj.val(obj.val().replace(".", "$#$").replace(/\./g, "").replace("$#$", "."));
            obj.val(obj.val().replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3')); //只能输入两个小数
        };

        //返回用户账户内可用的金额
        function getAvailableRmb() {
            // 前端新建一个json对象来对应ajax获取后端返回的数据，主要是我不想因为后端的json命名变化让前端调用过此函数的地方都改一遍
            var availableRmb = {
                status: 0,
                availableTicket: 0,
                availableRmb: 0
            };
            //正常请求返回的值是Object { status: 200, available_ticket: 0, available_rmb: 0 }
            $.ajax({
                "url": "/pconvert/ajax/get_available/",
                "type": "POST",
                "dataType": "JSON",
                "async": false,
                "data": {
                    '_xsrf': getCookie('_xsrf')
                },
                success: function(data) {
                    availableRmb.status = data.status;
                    availableRmb.availableTicket = data.available_ticket;
                    availableRmb.availableRmb = data.available_rmb;
                }
            });
            return availableRmb;
        };

        return pluginCenter;
    }
};

function prizePicUploadSuccess(ret) {
    // 上传成功移除loading动画
    $("#" + ret.fileId).closest('li.prizeItem').find('dt .uploading').removeClass('uploading');
    $("#" + ret.fileId).closest('li.prizeItem').find('.prizePic').attr('src', ret.url).attr('type', '').show();
}
//日期格式化
Date.prototype.Format = function(fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

var bigImg = {
    showImg: function(obj, url) {
        var _this = $(obj);
        _this.parent().find('.help_paly').hide();
        if (url == 'undefined' || url == null || url == " ") {
            url = obj.src;
        }
        // this.Imgload(url);
        this.img = new Image();
        var ImgParent = _this.parent();
        ImgParent.css({
            'position': 'relative'
        });
        var loadimgT = _this.height() / 2 - 8;
        var loadimgL = _this.width() / 2 - 8;
        var Loadimg = $('<img style="position:absolute;width:16px;height:16px" src="/static/images/loading.gif"/>').css({
            'left': '' + loadimgL + 'px',
            'top': '' + loadimgT + 'px'
        }).appendTo(ImgParent)
        var imgobj = this;
        imgobj.img.onload = function() {
            Loadimg.remove();
            $('.help_paly').show();
            var Nimgw = imgobj.img.width;
            var Nimgh = imgobj.img.height;
            var Wz = top.document.documentElement.clientWidth || top.document.body.clientWidth;
            var Hz = top.document.documentElement.clientHeight || top.document.body.clientHeight;
            if (Nimgh > Hz - 30 && Nimgw < Wz - 30) {
                Nimgh = Hz - 30;
                Nimgw = (Hz - 30) / imgobj.img.height * Nimgw;
            } else if (Nimgw > Wz - 30) {
                Nimgw = Wz - 30;
                Nimgh = (Wz - 30) / imgobj.img.width * Nimgh;
            }
            var wc = Nimgw / 2;
            var hc = Nimgh / 2;
            var tccL = Wz / 2 - wc;
            var tccT = Hz / 2 - hc;
            //var _this = $(obj);
            var pic_cancel = $('<div class="pic_cancel"></div>').appendTo($('body', top.document));
            var NewImg = $('<img src="' + imgobj.img.src + '"></img>').appendTo($('body', top.document));
            if (window.top.length == 0) {
                var offsetT = _this.offset().top;
                var offsetL = _this.offset().left;
            } else {
                var offsetL = tccL;
                var offsetT = -100;
            }
            NewImg.css({
                'position': 'absolute',
                'z-index': '9999903',
                'top': '' + offsetT + 'px',
                'left': '' + offsetL + 'px',
                'width': '' + _this.width() + 'px',
                'height': '' + _this.height() + 'px'
            });
            pic_cancel.css({
                'z-index': '9999904',
                'top': '' + (offsetT - 18) + 'px',
                'left': '' + (offsetL + _this.width() - 18) + 'px'
            });
            var makObj = $('<div style="position:fixed; display:block;left:0px; top:0px; width:100%; height: 100%; z-index:9999902; "><div style="position:absolute;left:0px; top:0px; width:100%; height: 100%; opacity:0; filter:alpha(opacity=0);display: block; background:#0E1011;" class="mak"></div></div>').appendTo($('body', top.document));
            makObj.find('.mak').animate({
                opacity: 0.2
            }, 'slow');
            var collt = top.document.body.scrollTop || top.document.documentElement.scrollTop;
            setTimeout(function() {
                NewImg.animate({
                    left: '' + tccL + '',
                    top: '' + (tccT + collt) + '',
                    width: '' + Nimgw + '',
                    height: '' + Nimgh + ''
                }, 'slow');
                pic_cancel.animate({
                    left: '' + (Nimgw + tccL - 18) + '',
                    top: '' + (tccT + collt - 18) + ''
                }, 'slow');
            }, 250);
            pic_cancel.click(function() {
                makObj.click();
            });
            makObj.click(function() {
                var _this = $(this);
                _this.animate({
                    opacity: '0'
                }, 650);
                setTimeout(function() {
                    _this.remove();
                }, 650);
                NewImg.remove();
                pic_cancel.remove();
                this.img = false;
            });
            $('.jsbox_close').live('click', function() {
                bigImg.img.onload = false;
            });
        }
        this.img.src = url;
    }
}

function getMobileCode(obj) {
    var iCountDownNum = 59;
    var timer = null;
    if (bState) {
        bState = false;
        timer = setInterval(function() {
            if (iCountDownNum <= 0) {
                clearInterval(timer);
                iCountDownNum = 59;
                obj.html('获取验证码');
                bState = true;
            } else {
                iCountDownNum--;
                obj.html('重新发送' + iCountDownNum);
            }
        }, 1000);
    }
}

function bound_phone_callback(info) {
    if (info.error_msg) {
        loadMack({
            off: 'on',
            Limg: 0,
            text: info.error_msg,
            set: 1000
        });
        return false;
    }
    pluginCenter.domainAudit($('#user_phone').val());
}

//生成筛选菜单
function showRowdata(data, obj) {
    var con = '',
        zon = '',
        ms = 1,
        sel = '';
    for (var i = 0; i < data.result.length; i++) {
        if (data.result[i].status == 1) {
            sel = 'form_selected';
        } else {
            sel = ''
        }
        con += '<li Qid="' + data.result[i].q_id + '" class="' + sel + '"><a href="javascript:;">' + data.result[i].q_title + '</a></li>';
        ms++;
        if (ms == 10) {
            ms = 1;
            zon += '<ul>' + con + '</ul>';
            con = '';
        }
    }
    if (ms > 1) {
        zon += '<ul>' + con + '</ul>';
    }
    obj.find('.tipCon_t').append('<div class="Bubble_list Rowdata">' + zon + '</div>');
}
//生成设置菜单
function Filterdata(data, obj) {
    var con = '',
        zon = '',
        ms = 1;
    for (var i = 0; i < data.result.length; i++) {
        con += '<li Qid="' + data.result[i].q_id + '" class="PTlist"><a href="javascript:;">' + data.result[i].q_title + '</a></li>';
        ms++;
        if (ms == 10) {
            ms = 1;
            zon += '<ul>' + con + '</ul>';
            con = '';
        }
    }
    if (ms > 1) {
        zon += '<ul>' + con + '</ul>';
    }
    obj.find('.tipCon_t').append('<div class="Bubble_list Filterdata">' + zon + '</div>');
}

function ansrest_callback(ret) {
    if (ret.status == 200) {
        $('.state_title').append("<em>已保存</em>");
    }
}
//JsBubble打包配置
function jsBubbleConfig(options) {
    var settings = {
        type: 'top',
        pyleft: -6,
        pytop: -7,
        BoColor: "#DBDBDB",
        BaColor: "#fff",
        CBaColor: "#fff",
        TBaColor: "#EFEFEF",
        zIndex: 9999906
    };
    $.extend(settings, options);
    var showBubble = new JsBubble().show(settings);
}
//jsbox打包配置
function jsboxConfig(title, url, conw, conh) {
    if (!conw) {
        conw = 500
    };
    var wb = new jsbox({
        onlyid: "maptss",
        title: title,
        conw: conw,
        url: url,
        loads: true,
        range: true,
        mack: true
    }).show();
}

function del_filter_con(obj) {
    var key = $(obj).attr('id');
    var param = new Object();
    param[key] = '';
    param_str = JSON.stringify(param);
    $("#get_report_info input[name='filter_type']").val(3);
    $("#get_report_info input[name='info_type']").val('update_filter_condition');
    $("#get_report_info input[name='data']").val(param_str);
    $("#get_report_info input[name='_xsrf']").val(getCookie('_xsrf'));
    ajaxSubmit($("#get_report_info"));
    $('#' + key).parent('.FilterTab').remove();
    loadMack({
        off: 'on',
        Limg: 1,
        text: '加载中...',
        set: 0
    });
}

function get_report_info_callback(info) {
    if (info.info_type == 'update_filter_condition') {
        wxSigninUpdateRecordFun($("#get_report_info").attr('pid'));
    }
}

function wxSigninUpdateRecordFun(pid, oid, options) {
    //options 用来配置 ajax里的 data参数
    var dataSettings = {
        '_xsrf': getCookie('_xsrf')
    };
    $.extend(dataSettings, options);
    var $record_table = $(".show_childWrap").find(".record_table");
    var $c_paginationa = $(".show_childWrap").find(".c_paginationa");
    $record_table.html("");
    var recordTableStr = '',
        recordlistStr = '';
    //ajax请求，获取筛选条件和筛选结果数据
    $.ajax({
        "url": "/report/form_list/" + pid + "/",
        "type": "GET",
        "dataType": "html",
        "async": false,
        "data": dataSettings,
        success: function(data) {
            $('.loadCon,.loadMack').remove();
            $record_table.html(data);
            var filterList = $('.FilterListTmp').html();
            $('.FilterList').html(filterList);

            $(".record_table .paginationa").on("click", "a", function(event) {
                event.preventDefault();
                var _this = $(this);
                var curPage = dataSettings.page ? dataSettings.page : 1;
                if (_this.text() == '下一页') {
                    dataSettings.page = curPage + 1;
                    wxSigninUpdateRecordFun(pid, oid, dataSettings);
                } else if (_this.text() == '上一页') {
                    dataSettings.page = curPage - 1;
                    wxSigninUpdateRecordFun(pid, oid, dataSettings);
                } else {
                    dataSettings.page = parseInt(_this.text());
                    wxSigninUpdateRecordFun(pid, oid, dataSettings);
                }
            });
        }
    });
}

function downloadMatrixSignin(num, pid, url) {
    //console.log(num, pid, url);
    if ($('#download_matrix_form')) $('#download_matrix_form').remove();
    var tmp = '<form id="download_matrix_form" action="/images/downloadMatrix" method="post">' +
        '<input type="hidden" name="survey_url" value="' + url + '" />' +
        '<input type="hidden" name="old_id" value="' + pid + '" />' +
        '<input type="hidden" name="box_size" value="' + num + '" />' +
        '<input type="hidden" name="_xsrf" value="' + getCookie('_xsrf') + '" />' +
        '</form>';
    $('body').append(tmp);
    $('#download_matrix_form').submit();
}
