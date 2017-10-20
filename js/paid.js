var pay_order_id; //订单ID
var seniorUser_order = {pay_order_id: "",pay_type: ""};
var check_order_id_list = [];

//支付方法
var payment_Method = {
    orderConfirm: function(options) {
        var settings = {
            title: '支付确认',
            buyNum: '',
            payMoney: '',
            btnOKFn: '',
            btnCancelFn: '',
            marginLeft: 256
        };
        $.extend(settings, options);

        var htmlStr = '<div class="paid_mark"><div class="show_smallWrap" style="width:510px;margin-left:-' + settings.marginLeft + 'px;margin-top:-100px;"><div class="head_title"><p>' + settings.title + '</p><i class="small_close"></i></div><div class="small_wrap" style="width:auto;"><div class="small_content"><p class="default_p1">账号余额为：<span class="num_Warning">' + Number(settings.leave_money).toFixed(2) + '元</span>，系统将扣除<span class="num_Warning">' + Number(settings.payMoney).toFixed(2) + '元</span></p></div></div><div class="btn_wrap"><a class="btn_cancel WJButton newBtn" href="javascript:;">取消</a><a class="btn_ok WJButton" href="javascript:;">确定</a></div></div></div>';
        $('body').append(htmlStr);
        var $mark = $('body').find('.paid_mark');
        if (settings.btnOKFn) {
            $mark.on('click', '.btn_ok', function() {
                $(this).html('提交中');
                $(this).removeClass('WJButton');
                $(this).addClass('newWJButton');
                $mark.find(".btn_ok").removeClass("btn_ok");
                settings.btnOKFn();
            });
        }
        $mark.on('click', '.btn_cancel', function() {
            if (settings.btnCancelFn == '') {
                $mark.remove();
            } else {
                settings.btnCancelFn();
            }
        });
        $mark.on('click', '.small_close', function() {
            $mark.remove();
        });
    },
    goPay: function(options) {
        var settings = {
            title: '支付确认',
            needPay: '',
            btnOKFn: '',
            btnCancelFn: '',
            marginLeft: 256,
            type: ''  // 购买来源
        };
        $.extend(settings, options);

        var form_str = '<form name="onlinepay_form" id="onlinepay_form" action="/member/payredirect/" target="_blank" method="post"><input type="hidden" name="order_id" /><input type="hidden" name="_xsrf" /></form>';
        var payment_ul_str = '<div class="mt10"><p class="default_p2">请选择以下支付方式：</p><ul class="payment_ul"><li class="payment_mode"><div class="zfb payment" name="alipay"></div></li><li class="payment_mode mleft10"><div class="wx payment" name="wechatpay"></div></li></ul></div>';

        var htmlStr = '<div class="paid_mark"><div class="show_smallWrap" style="width:510px;margin-left:-' + settings.marginLeft + 'px; margin-top:-100px;"><div class="head_title"><p>' + settings.title + '</p><i class="small_close"></i></div><div class="small_wrap" style="width:auto;"><div class="small_content"><div><div class="plugin_choose_paid_type"><p class="default_p1">扣除账户余额（<span class="num_Warning">' + Number(settings.leave_money).toFixed(2) + '元</span>）后，需支付<span class="num_Warning">' + Number(settings.needPay).toFixed(2) + '元</span></p>' + payment_ul_str + form_str + '</div></div></div></div></div></div>';

        $('body').append(htmlStr);
        var $mark = $('body').find('.paid_mark');
        if(settings.btnOKFn){
            $mark.on('click','.payment_mode',function(){
                var pay_channel = $(this).find(".payment").attr("name");
                if (settings.type) {
                    var settingsType = settings.type;
                    if (settingsType == 'envelope') {
                        settingsType = 'lucky_money';
                    }
                    if (pay_channel == 'alipay') {
                        _hmt.push(['_trackEvent', 'pluginAliPay', 'click', settingsType +'_pluginAliPay']);
                    }else{
                        _hmt.push(['_trackEvent', 'pluginWxPay', 'click', settingsType +'_pluginWxPay']);
                    }
                }
                var order_id = JSON.parse($.ajax({url:'/member/payorder/', type:'post', data: {'money':Number(settings.needPay).toFixed(2),'pay_channel':pay_channel,'_xsrf': getCookie('_xsrf')}, async:false}).responseText).order_id;
                $("#onlinepay_form input[name='order_id']").val(order_id);
                $("#onlinepay_form input[name='_xsrf']").val(getCookie('_xsrf'));
                $("#onlinepay_form").submit();
                pay_order_id = order_id;
                if (settings.type == "seniorUser"){
                    seniorUser_order.pay_order_id = order_id;
                    seniorUser_order.pay_type = pay_channel;
                }
                settings.btnOKFn();
            });
        }
        $mark.on('click', '.small_close', function() {
            $(".paid_mark").remove();
        });
    },
    payConfirm: function(options) {
        var settings = {
            title: '支付成功确认',
            payStatus: true,
            btnOKFn: '',
            btnCancelFn: '',
            marginLeft: 256
        };
        $.extend(settings, options);
        if (options.pay_order_id){
            pay_order_id = options.pay_order_id;
        }

        var contentHtml = '';
        if (settings.payStatus) {
            contentHtml = '<p class="p1">支付完成前，请勿关闭此窗口。</p><p class="p1">支付完成后，请根据支付情况点击以下按钮。</p><div class="paid_wrap"><a class="paidFailure" href="javascript:;">遇到问题</a><a class="paidSuccess" href="javascript:;" style="color:#53a4f4;">支付成功</a></div>';
        } else {
            contentHtml = '<p class="p1">您未完成支付。</p>';
        }
        var htmlStr = '<div class="paid_mark"><div class="show_smallWrap" style="width:510px;margin-left:-' + settings.marginLeft + 'px; margin-top:-100px;"><div class="head_title"><p>' + settings.title + '</p><i class="small_close"></i></div><div class="small_wrap" style="width:auto;"><div class="small_content"><div class="plugin_paid_confim">' + contentHtml + '</div></div></div></div></div>';
        $('body').append(htmlStr);
        var $mark = $('body').find('.paid_mark');
        if (settings.btnOKFn) {
            $mark.on('click', '.paidSuccess', function() {
                $mark.find(".paidSuccess").removeClass("paidSuccess");
                settings.btnOKFn();
            });
        }
        if (settings.btnCancelFn) {
            $mark.on('click', '.paidFailure', function() {
                window.open("/about/zxzx/");
                settings.btnCancelFn();
            });
        }
        $mark.on('click', '.small_close', function() {
            $(".paid_mark").remove();
        });
        var check_order_id = window.setInterval(check_order, 3000);
        check_order_id_list.push(check_order_id);

        function check_order() {
            getOrderStatus(function(data) {
                orderStatus = JSON.parse(data).order_status;
                if (orderStatus == 1) {
                    if (settings.btnOKFn){
                        settings.btnOKFn();
                        $.each(check_order_id_list, function(index) {
                            window.clearInterval(check_order_id_list[index]);
                        });
                    }
                }
            });
        }
    },
    markRemove: function() {
        $('.paid_mark').remove();
    }
};

//充值
var account_Recharge = {
    save_account: function(){
        window.location.href = '/member/mywallet';
        return;
    }
};

// 购买返回弹窗
function submitComplete(type, status){
    $(".paid_mark").remove();
    if (type == "sms"){
        type_name = "短信";
    }else if (type == "email"){
        type_name = "邮件";
    }
    var sub_settings = {
        subImgurl:"/static/images/register/success_duigou.png",
        sub1_txt: "您已经成功购买"+type_name+"余额",
        subBt_txt: "查看我的"+type_name+"余额",
        status: status || false // true/false
    };

    if (!sub_settings.status){
        sub_settings.subImgurl = "/static/images/register/fail_duigou.png";
        sub_settings.sub1_txt = "网络繁忙，请稍后再试！";
        sub_settings.subBt_txt = "我知道了";
    }

    var confirm_str =
        '<div class="dialog_seniorUser">' +
            '<div class="show_submitC">' +
                '<h2 class="atitle">支付提示</h2>'+
                '<a class="aclose" href="javascript:;"></a>' +
                '<div class="amain">' +
                    '<img src="'+ sub_settings.subImgurl +'" alt="" />' +
                    '<p class="sub1">'+ sub_settings.sub1_txt +'</p>' +
                    '<a href="javascript:;" class="subYesBT mt20 WJButton margin_no status_' + sub_settings.status + '">' + sub_settings.subBt_txt +'</a>' +
                '</div>' +
            '</div>' +
        '</div>';
    $("body").append(confirm_str);

    var $mark = $('body').find('.dialog_seniorUser');

    $("body").on("click",".show_submitC .status_true",function(){
        window.location.href = '/member/unifybuy/';
    });
    $("body").on("click",".show_submitC .status_false",function(){
        $mark.remove();
    });
    $("body").on("click",".show_submitC .aclose",function(){
        $mark.remove();
    });
}

//购买短信
var sms_paid = {
    validationNum: function(obj, isDisc) {
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
    },
    buy_sms: function(buy_number) {
        $.ajax({
            url: '/member/buysms/',
            type: 'post',
            dataType: "JSON",
            data: {
                'number': buy_number,
                '_xsrf': getCookie('_xsrf')
            },
            success: function(ret) {
                if (ret.info != '') {
                    loadMack({
                        off: 'on',
                        Limg: 1,
                        text: ret.info,
                        set: 1000
                    });
                } else {
                    submitComplete('sms', true);
                    return;
                }
            }
        });
    }

};

//购买邮件
var email_paid = {
    validationNum: function(obj, isDisc) {
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
    },
    buy_email: function(package_name) {
        $.ajax({
            url: '/collect/mail_quota/packages/',
            type: 'post',
            dataType: "JSON",
            data: {
                'package_name': package_name,
                '_xsrf': getCookie('_xsrf')
            },
            success: function(ret) {
                if (!ret.is_success) {
                    loadMack({
                        off: 'on',
                        Limg: 1,
                        text: ret.msg,
                        set: 1000
                    });
                } else {
                    submitComplete('email', true);
                    return;
                }
            }
        });
    }

};

//联系人发送短信
var Contacts = {
    send_sms: function() {
        var url = '/contact/sms/consume_to_send_sms/';
        var data = {
            '_xsrf': getCookie('_xsrf')
        };
        var $oMark = new idyC.loading({
            text: '发送中'
        });
        $oMark.open();
        idyC.ajaxPost(url, data, function(result) {
            $oMark.remove();

            var rsp_info = JSON.parse(result);
            var rsp_status = rsp_info.status;

            if (rsp_status == 'success') {
                window.location.href = '/contact/sms/showSMSTip';
                return;
            }
        });
    },
    send_sms_from_collect: function(){
        var url = '/sms/collect/consumetosend/';
        var data = {
            pid: project_id,
            '_xsrf': getCookie('_xsrf')
        };
        var $oMark = new idyC.loading({
            text: '发送中'
        });
        $oMark.open();
        idyC.ajaxPost(url, data, function(result) {
            $oMark.remove();

            var rsp_info = JSON.parse(result);
            var rsp_status = rsp_info.status;

            if (rsp_status == 'success') {
                window.location.href = '/collect/sendsms/' + project_id + '/';
                return;
            }
        });
    }
};

//题型购买
var question_paid = {
    bay_question: function(options) {
        $.ajax({
            "url": "/plugin/ajax/consume/",
            "type": "POST",
            "dataType": "JSON",
            "async": false,
            "data": {
                'plugin_id_list': options.calTypeList,
                'discount_id': options.discount_id,
                'month_count': options.month_count,
                '_xsrf': getCookie('_xsrf')
            },
            success: function(data) {
                if (!data.info) {
                    var success_list = [];
                    paidSuccessFun(data);
                } else {
                    loadMack({
                        off: 'on',
                        Limg: 1,
                        text:data.info,
                        set: 1000
                    });
                }
                $('body').find('.paid_mark').remove();
            }
        });
    }
};

//有偿收集
var paid_Collection = {
    save_pconvert: function(pid, costInfo) {
        $.ajax({
            url: '/collect/paid/' + pid,
            data: {
                act: 'comfirm_order',
                community_info_list: costInfo.community_info_list,
                c_id: costInfo.zkqOid,
                c_type: costInfo.c_type,
                "_xsrf": getCookie('_xsrf')
            },
            dataType: "JSON",
            type: "POST",
            timeout: 15000,
            success: function(ret) {
                if (ret.status == "200") {
                    if(ret.success == false){
                        loadMack({
                            off: 'on',
                            Limg: 1,
                            text: ret.msg,
                            set: 1000
                        });
                    }else{
                        $('.paid_mark').hide();
                        $('.page_2').hide();
                        $('.page_3').show();
                    }
                    
                } else {
                    loadMack({
                        off: 'on',
                        Limg: 1,
                        text: '网络繁忙，请稍后再试！',
                        set: 1000
                    });
                }
            }
        });

        $('.page_3 span').click(function(){
            window.location.href = '/collect/paid/' + pid;
        })
    }
};

//支付请求
function getOrderStatus(successCallback) {
    $.ajax({
        url: '/member/validatepayorder/',
        type: 'post',
        data: {
            'order_id': pay_order_id,
            '_xsrf': getCookie('_xsrf')
        },
        success: successCallback
    });
}

//高级用户购与或续费
var seniorUser = {
    init: function(options) {
        sessionStorage.senior_user_promo = false;
        var seniorUser = {};
        var timestamp = new Date().getTime();
        var settings = {
            max_month: 9,
            buyTxt: '购买时长',
            expireTime: '',
            month_count: 12,
            discount: 1,
            discount_id: '',
            calTypeId: '',
            c_type: '',
        };
        $.extend(settings, options);
        var datas_info = JSON.parse($.ajax({
                url: '/plugin/ajax/get_cal_type/?'+timestamp,
                type: "POST",
                data: {
                    'plugin_id': 'super_account',
                    '_xsrf': getCookie('_xsrf')
                },
                async: false
            }).responseText);
        var currency_info = JSON.parse($.ajax({
                url: '/auth/ajax/get_currency_info/?'+timestamp,
                type: "POST",
                data: {
                    'currency_type': '0|2|3',
                    'scope': 'super_account',
                    '_xsrf': getCookie('_xsrf')
                },
                async: false
            }).responseText);
        var super_account = JSON.parse($.ajax({
                url: '/plugin/ajax/get_info_for_buy_super_account/?'+timestamp,
                type: "POST",
                data: {
                    'month_count': settings.month_count,
                    '_xsrf': getCookie('_xsrf')
                },
                async: false
            }).responseText);
        var annual_fee = new Object();    //年费
        var monthly_fee = new Object();   //月费
        update_fee_type(datas_info.datas);
        var buy_time_str = buy_time_info(settings.max_month, settings.buyTxt, super_account);
        var discount_str = discount_info(currency_info);
        var discount_select_money = '';
        if (discount_str){
            discount_select_money = '<tr><td><p class="mL24">优惠券抵扣：</p></td><td class="aDeductible"><p class="mR24">-<span class="num">0.00</span>元</p></td></tr>';
        }
        var $dialogApplication =
            '<div class="dialog_seniorUser">' +
                '<div class="show_dialog">' +
                    '<h2 class="atitle">支付确认</h2>'+
                    '<a class="aclose" href="javascript:;"></a>' +
                    '<div class="amain">' +
                        buy_time_str +
                        discount_str +
                        '<div class="promo mt10">'+
                            '<span class="mTitle"><label class="ckbox" ><span></span>使用优惠码：</label></span>' +
                            '<input class="promoNum" disabled=true type="text" />' +
                            '<a class="promobt WJButton failureBt" href="javascript:;">确定</a>' +
                            '<span class="num_Warning clues colBlur"></span>' +
                        '</div>' +
                        '<div class="aprice mt20">' +
                            '<h2 class="bclose">费用统计：</h2>' +
                            '<div class="aprice_info mt20"><table>' +
                                '<tr><td><p class="mL24">高级版费用：</p></td><td class="aConsumption"><p class="mR24"><span class="num">0.00</span>元</p></td></tr>' +
                                discount_select_money +
                                '<tr><td><p class="mL24">优惠码抵扣：</p></td><td class="aPromo"><p class="mR24">-<span class="num">0.00</span>元</p></td></tr>' +
                                '<tr style="display:none"><td><p class="mL24">已购应用抵扣：</p></td><td class="aDeductibleHis"><p class="mR24">-<span class="num">0.00</span>元<i class="c_ht ah"></i></p></td></tr>' +
                                '<tr class="last"><td><p class="mL24">账户余额扣除：</p></td><td class="aBalance"><p class="mR24"><span>0.00</span>元</p></td></tr>' +
                                '<tr><td>还需支付：</td><td class="num_Warning paymentV"><span>0</span>元</td></tr>' +
                            '</table></div>' +
                        '</div>' +
                        '<a href="javascript:;" class="success_bt mt20 WJButton margin_no">确认支付</a>' +
                    '</div>' +
                '</div>' +
            '</div>';
        $('body').append($dialogApplication);

        var $seniorUserBox = $(".dialog_seniorUser");
        var $show_dialog = $seniorUserBox.find(".show_dialog");
        var $buy_time_select = $seniorUserBox.find(".amain .buy_time_length select");
        var $discount_paid_select = $seniorUserBox.find(".amain .discount_paid select");
        var $aprice = $seniorUserBox.find(".aprice_info");
        var $promo = $seniorUserBox.find('.promo');
        var $clues = $seniorUserBox.find('.promo .clues');
        var $promoNum = $promo.find('.promoNum');
        var $promobt = $promo.find('.promobt');
        var availableRmb = currency_info.rmb_data.value;

        if (settings.month_count != 12){
            $buy_time_select.find("option:first").attr("selected","selected");
            settings.calTypeId = $buy_time_select.find('option:selected').attr("oid");
        }

        $seniorUserBox.on('click', '.aclose', function() {
            $seniorUserBox.remove();
        });

        $seniorUserBox.on('click', '.mTitle .ckbox', function() {
            $(this).toggleClass('active');
            var activeDiv = $(this).parents('div');
            if (activeDiv.hasClass('discount_paid')){
                var activeSelect = activeDiv.find('select');
                if ($(this).hasClass('active')){
                    settings.discount = activeSelect.find('option:selected').val();
                    settings.c_type = activeSelect.find('option:selected').attr("c_type");
                    settings.discount_id = activeSelect.find('option:selected').attr("oid");
                }else{
                    settings.c_type = '';
                }
                init_discount(settings.month_count, availableRmb, settings.c_type, settings.discount);
            }else if (activeDiv.hasClass('promo')){
                if ($(this).hasClass('active')){
                    $promoNum.attr('disabled',false);
                    $promobt.removeClass('failureBt');
                    $clues.show();
                }else{
                    $promoNum.val('').attr('disabled',true);
                    $promobt.addClass('failureBt');
                    $clues.text('').hide();
                    sessionStorage.senior_user_promo = false;
                    init_discount(settings.month_count, availableRmb, settings.c_type, settings.discount);
                }
            }
        });

        $promoNum.keyup(function(){
            // var new_v = $(this).val().replace(/\D/g, "");
            var new_v = $(this).val().trim();
            $(this).val(new_v);
        });

        $seniorUserBox.on('click', '.promo .promobt', function() {
            var promoNum = $(this).prev().val().strip();
            if (!promoNum){
                $clues.removeClass('colBlur').html('请输入您的优惠码');
                return false;
            }
            $.ajax({
                url: '/auth/ajax/validate_voucher_code/',
                type: 'POST',
                dataType: 'json',
                data: {'vcode': promoNum, '_xsrf': getCookie('_xsrf')},
                success: function(data){
                    if (data.msg == ''){
                        $promoNum.attr('disabled', true);
                        var txt = '';
                        if (settings.month_count == 12 && data.use_scope.value == 'super_account_month'){
                            txt = '此优惠码仅用于购买包月';
                        }else if (settings.month_count != 12 && data.use_scope.value == 'super_account_year'){
                            txt = '此优惠码仅用于购买包年';
                        }else{
                            txt = '优惠码正确，可抵扣'+data.c_value+'元';
                            $clues.addClass('colBlur').html(txt);
                            sessionStorage.senior_user_promo = JSON.stringify(data);
                            init_discount(settings.month_count, availableRmb, settings.c_type, settings.discount);
                            return;
                        }
                        $clues.removeClass('colBlur').html(txt);
                    }else{
                        settings.promo = '';
                        settings.promo_money = 0;
                        $clues.removeClass('colBlur').html(data.msg);
                    }
                }
            });
        });

        $seniorUserBox.on('mouseenter', '.ah', function() {
            hover_tip($(this), '尚未到期的付费功能,可按天抵扣部分费用。<br/>举例：您在30天之前买了一款599元包年应用，<br/>此时升级高级版，可抵扣金额为：599*(335/365)=549.77元');
        });

        $seniorUserBox.on('change', '.amain .buy_time_length select', function() {
            var expireTime;
            var time_v = $(this).find('option:selected').val();
            settings.calTypeId = $(this).find('option:selected').attr("oid");
            super_account = JSON.parse($.ajax({
                url: '/plugin/ajax/get_info_for_buy_super_account/?'+timestamp,
                type: "POST",
                data: {
                    'month_count': time_v,
                    '_xsrf': getCookie('_xsrf')
                },
                async: false
            }).responseText);
            if (settings.month_count == 12 || (settings.month_count != 12 && time_v == 12)){
                $promoNum.val('').attr('disabled',true);
                $promobt.addClass('failureBt');
                $clues.text('').hide();
                $promo.find('.ckbox').removeClass('active');
                sessionStorage.senior_user_promo = false;
            }
            settings.month_count = time_v;
            expireTime = get_expireTime(super_account, time_v);
            $(".amain .expireTime .num_Warning").text(expireTime);
            init_paid_select($discount_paid_select, currency_info, settings.month_count);
            init_discount(settings.month_count, availableRmb, settings.c_type, settings.discount);
        });

        $seniorUserBox.on('change', '.amain .discount_paid select', function() {
            var activeDiv = $(this).parents('div');
            if (activeDiv.find('.ckbox').hasClass('active')){
                settings.discount = $(this).find('option:selected').val();
                settings.c_type = $(this).find('option:selected').attr("c_type");
                settings.discount_id = $(this).find('option:selected').attr("oid");
                init_discount(settings.month_count, availableRmb, settings.c_type, settings.discount);
            }
        });

        init_paid_select($discount_paid_select, currency_info, settings.month_count);
        init_discount(settings.month_count, availableRmb, settings.c_type, settings.discount);

        $seniorUserBox.on('click', '.success_bt', function() {
            var paymentV = parseFloat($seniorUserBox.find(".paymentV span").text());
            var balanceV = parseFloat($aprice.find(".aBalance span").text());
            if(paymentV > 0){
                payment_Method.goPay({
                    needPay: paymentV,
                    leave_money: availableRmb,
                    type: "seniorUser",
                    btnOKFn:function(){
                        payment_Method.markRemove();
                        payment_Method.payConfirm({
                            btnOKFn:function(){
                                payment_Method.markRemove();
                                var orderStatus;
                                getOrderStatus(function(data){
                                    orderStatus = JSON.parse(data).order_status;
                                    if(orderStatus == 1){
                                        // 购买成功
                                        seniorUser.saveBuy();
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
                    payMoney: balanceV,
                    leave_money: availableRmb,
                    btnOKFn:function(){
                        // 购买成功
                        seniorUser.saveBuy();
                        $('body').find('.paid_mark').remove();
                    }
                });
            }
        });

        seniorUser.remove = function() {
            $seniorUserBox.remove();
        };

        seniorUser.saveBuy = function(){
            $.ajax({
                "url": "/plugin/ajax/consume/",
                "type": "POST",
                "dataType": "JSON",
                "async": false,
                "data": {
                    'plugin_id': 'super_account',
                    'cal_type_id': settings.calTypeId,
                    'month_count': settings.month_count,
                    'discount_id': settings.discount_id,
                    'pay_order_id': seniorUser_order.pay_order_id,
                    'pay_type': seniorUser_order.pay_type,
                    'vcode': $promoNum.val(),
                    '_xsrf': getCookie('_xsrf')
                },
                success: function(data) {
                    $show_dialog.remove();
                    if (!data.info) {
                        seniorUser.submitComplete('', data.expire_time);
                    } else {
                        seniorUser.submitComplete('no', '');
                    }
                }
            });
        };

        seniorUser.submitComplete = function(substatus, expire_time){
            if (window.location.href.indexOf("/senior_user") != -1 && substatus === ""){
                if ($(".select_on_trial ").length > 0){
                    $(".select_on_trial ").attr("on_trial_type", "True");
                }
            }
            var sub_settings = {
                subImgurl:"/static/images/register/success_duigou.png",
                sub1_txt: "升级成功!",
                sub2_txt: "高级版有效期至：" + expire_time,
                subBt_txt: "立即使用"
            };
            if (substatus == "no"){
                sub_settings.subImgurl = "/static/images/register/fail_duigou.png";
                sub_settings.sub1_txt = "升级失败";
                sub_settings.sub2_txt = "请稍后再试";
                sub_settings.subBt_txt = "";
            }

            var subBt_txt_str = '';
            if (sub_settings.subBt_txt){
                subBt_txt_str = '<a href="javascript:;" class="subYesBT mt20 WJButton margin_no">' + sub_settings.subBt_txt +'</a>';
            }

            var confirm_str =
                '<div class="show_submitC">' +
                    '<h2 class="atitle">支付提示</h2>'+
                    '<a class="aclose" href="javascript:;"></a>' +
                    '<div class="amain">' +
                        '<img src="'+ sub_settings.subImgurl +'" alt="" />' +
                        '<p class="sub1">'+ sub_settings.sub1_txt +'</p>' +
                        '<p class="sub2">'+ sub_settings.sub2_txt +'</p>' +
                        subBt_txt_str +
                    '</div>' +
                '</div>';
            $seniorUserBox.append(confirm_str);

            $seniorUserBox.on("click",".show_submitC .subYesBT",function(){
                if (window.location.href.indexOf("plugin/use_list") != -1){
                    window.location.href = window.location.href;
                }else{
                    window.location.href = '/list';
                }
            });
        };

        function hover_tip(obj, txt) {
            $('body').append('<p class="c_hover_tip_p">' + txt + '</p>');
            $('.c_hover_tip_p').css({
                'z-index': '99999999',
                'left': obj.offset().left + obj.outerWidth() + 8,
                'top': obj.offset().top + (obj.outerHeight() - 29) / 2
            });
            obj.on('mouseleave', function() {
                $('.c_hover_tip_p').remove();
            });
        }

        function update_fee_type(fee_list) {
            for (var i=0;i<fee_list.length;i++){
                if (fee_list[i].use_time == 365){
                    annual_fee = fee_list[i];
                }else if (fee_list[i].use_time == 30){
                    monthly_fee = fee_list[i];
                }
            }
        }

        // 更新优惠券列表
        function init_paid_select($buy_time_select, currency_info, buy_time){
            var scope_type = 'year',
                type_Company = {'2':'折', '3':'元'},
                type_Company_v = {'2':10, '3':1},
                total_consumption = annual_fee.cost;
            if ($buy_time_select.length>0){
                $buy_time_select.find("option").not(".init_C").remove();
                if (buy_time != 12){scope_type = 'month';total_consumption = monthly_fee.cost*buy_time;}
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
                    $buy_time_select.find(".init_C").text("无优惠券可用");
                }else{
                    // $buy_time_select.find(".init_C").text("不使用");
                    $buy_time_select.find(".init_C").remove();
                    $buy_time_select.append(option_str);
                    $buy_time_select.find("option:first").attr("selected", true);
                }
                settings.discount_id = $buy_time_select.find("option:selected").attr("oid");
                settings.discount = $buy_time_select.find("option:selected").attr("value");
                settings.c_type = $buy_time_select.find("option:selected").attr("c_type");
            }
        }

        function discount_info(currency_info) {
            var discount_str = '';
            var type_Company = {'2':'折', '3':'元'},
                type_Company_v = {'2':10, '3':1};
            if (currency_info.data.length > 0) {
                discount_str = '<div class="discount_paid mt10"><span class="mTitle"><label class="ckbox active"><span></span>优惠券：</label></span><select class="">';
                discount_str += '<option oid="" value="1" c_type="" class="init_C">不使用</option>';
                for (var i = 0; i < currency_info.data.length; i++) {
                    if (i === 0){
                        tmp = '<option selected="selected" oid="' + currency_info.data[i].oid + '" value="' + currency_info.data[i].value + '" c_type="' + currency_info.data[i].c_type + '">' + currency_info.data[i].value * type_Company_v[currency_info.data[i].c_type] + type_Company[currency_info.data[i].c_type] + '优惠券</option>';
                    }else{
                        tmp = '<option oid="' + currency_info.data[i].oid + '" value="' + currency_info.data[i].value + '" c_type="' + currency_info.data[i].c_type + '">' + currency_info.data[i].value * type_Company_v[currency_info.data[i].c_type] + type_Company[currency_info.data[i].c_type] + '优惠券</option>';
                    }
                    discount_str += tmp;
                }
                discount_str += '</select></div>';
            }

            return discount_str;
        }

        //购买时长
        function buy_time_info(num_month, buy_name, super_account) {
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
            var buy_time_str = '<div class="buy_time_length"><span class="mTitle">购买时长：</span><select>';
            var expireTime;
            if (typeof(buy_name) != 'undefined') {
                buy_time_str = '<div class="buy_time_length"><span class="mTitle">' + buy_name + '：</span><select class="">';
            }
            for (var i = 0; i < num_month; i++) {
                buy_time_str += '<option oid='+ monthly_fee.oid +' value=' + buy_time_list[i][0] + '>' + buy_time_list[i][1] + '</option>';
            }
            buy_time_str += '<option oid='+ annual_fee.oid +' selected="selected" value="12">1年</option></select>';
            expireTime = get_expireTime(super_account, settings.month_count);
            buy_time_str += '<div class="expireTime">高级版截止日期：<span class="num_Warning">'+ expireTime +'</span></div>';
            buy_time_str += '</div>';
            settings.calTypeId = annual_fee.oid;
            return buy_time_str;
        }

        function get_expireTime(super_account, month){
            var expireTime;
            var D = new Date();
            if (super_account.exprie_status == 1){
                D = new Date(super_account.expire_time);
            }
            D.setMonth(D.getMonth() + parseInt(month));
            expireTime = D.getFullYear() + "-" + (D.getMonth()+1) + "-" + D.getDate();
            return expireTime;
        }

        function init_discount(time_num, availableRmb, c_type, discount) {
            //高级版费用
            var price_V = annual_fee.cost;
            if (time_num != 12){
                price_V = monthly_fee.cost * time_num;
            }
            //优惠券
            var deductible_V = 0;
            if (c_type && $(".discount_paid .mTitle .active").length>0){
                if (c_type == 2){
                    deductible_V = price_V - Number(price_V * discount).toFixed(2);
                }else{
                    deductible_V = discount;
                }
            }
            // 优惠码
            var promoV = 0;
            if (sessionStorage.senior_user_promo && $seniorUserBox.find('.promo .ckbox').hasClass('active')){
                var senior_user_promo = JSON.parse(sessionStorage.senior_user_promo);
                if (senior_user_promo.use_scope.value == 'super_account' || (senior_user_promo.use_scope.value == 'super_account_month' && time_num != 12) || (senior_user_promo.use_scope.value == 'super_account_year' && time_num == 12)){
                    promoV = senior_user_promo.c_value;
                }
            }

            //扣除账户余额
            var balance_V = parseFloat(price_V) - parseFloat(deductible_V) - parseFloat(super_account.money) - parseFloat(promoV);
            //实际支付费用
            var payment_V = 0;
            if (parseFloat(availableRmb) <= balance_V){
                payment_V = balance_V - parseFloat(availableRmb);
                balance_V = availableRmb;
            }else{
                if (parseFloat(balance_V) < 0){
                    balance_V = 0;
                }
            }

            var $aConsumption = $aprice.find(".aConsumption span");
            var $aBalance = $aprice.find(".aBalance span");
            var $aDeductible = $aprice.find(".aDeductible span");
            var $aPromo = $aprice.find(".aPromo span");
            var $aDeductibleHis = $aprice.find(".aDeductibleHis span");
            var $paymentV = $aprice.find(".paymentV span");
            $aConsumption.text(Number(price_V).toFixed(2));
            $aDeductible.text(Number(deductible_V).toFixed(2));
            $aPromo.text(Number(promoV).toFixed(2));
            $aDeductibleHis.text(Number(super_account.money).toFixed(2));
            //针对老用户的处理，当抵扣金额存在时，才会显示
            $aDeductibleHis.text() > 0.00 ? $aDeductibleHis.parents('tr').css('display','table-row') : $aDeductibleHis.parents('tr').css('display','none');
            $aBalance.text(Number(balance_V).toFixed(2));
            $paymentV.text(Number(payment_V).toFixed(2));

            settings.month_count = time_num;
            settings.c_type = c_type;
            settings.discount = discount;
            (promoV == 0) ? $aPromo.parents("tr").find("p").addClass("failureFont") : $aPromo.parents("tr").find("p").removeClass("failureFont");
            (balance_V == 0) ? $aBalance.parents("tr").find("p").addClass("failureFont") : $aBalance.parents("tr").find("p").removeClass("failureFont");
            (deductible_V == 0) ? $aDeductible.parents("tr").find("p").addClass("failureFont") : $aDeductible.parents("tr").find("p").removeClass("failureFont");
            (super_account.money == 0) ? $aDeductibleHis.parents("tr").find("p").addClass("failureFont") : $aDeductibleHis.parents("tr").find("p").removeClass("failureFont");
        }
    }
};
