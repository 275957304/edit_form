//IE木有indexOf函数..
if(!Array.indexOf) {
    Array.prototype.indexOf = function(obj) {
        for(var i = 0; i < this.length; i++) {
            if(this[i] == obj) {
                return i;
            }
        }
        return -1;
    }
}

//IE也没有trim
String.prototype.trim= function(){
    // 用正则表达式将前后空格
    // 用空字符串替代。
    return this.replace(/(^\s*)|(\s*$)/g, "");
}

//Array的shuffle函数
Array.prototype.shuffle = function() {
    for(var j, x, i = this.length; i; j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
    return this;
};

Array.prototype.sum = function(){
    var sum = 0;
    for(var i = 0; i < this.length; i++){sum += this[i];};
    return sum;
};

//strip函数
String.prototype.strip = function() {
    return this.replace(/^\s*(.*?)\s*$/, "$1");
};

//模仿python的使用习惯, 0|[]|{}|""这些都返回false


function isNotEmpty(obj) {
    if(typeof(obj) == "undefined" || null == obj) {
        return false;
    }
    if(typeof(obj) == "function") {
        return true;
    }
    if(obj.constructor == Number) {
        if(obj) {
            return true;
        } else {
            return false;
        }
    }else if (typeof(obj) == "string"){
        if (obj != ""){
            return true;
        }else{
            return false;
        }
    }else {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop)) {
                return true;
            }
        }
        return false;
    }
};

//重载String.format方法,使格式化字符串更方便
//调用方法
//"{0},{1},hehe".format(["hello","world"]); //hello,world,hehe
//"数学={数学},语文={语文},hou".format({"数学":100,"语文":95});//数学=100,语文=95,hou
Overload = function(fn_objs) {
    var is_match = function(x, y) {
            if(x == y) return true;
            if(x.indexOf("*") == -1) return false;

            var x_arr = x.split(","),
                y_arr = y.split(",");
            if(x_arr.length != y_arr.length) return false;

            while(x_arr.length) {
                var x_first = x_arr.shift(),
                    y_first = y_arr.shift();
                if(x_first != "*" && x_first != y_first) return false;
            }
            return true;
        };
    var ret = function() {
            var args = arguments,
                args_len = args.length,
                args_types = [],
                args_type, fn_objs = args.callee._fn_objs,
                match_fn = function() {};

            for(var i = 0; i < args_len; i++) {
                var type = typeof args[i];
                type == "object" && (args[i].length > -1) && (type = "array");
                args_types.push(type);
            }
            args_type = args_types.join(",");
            for(var k in fn_objs) {
                if(is_match(k, args_type)) {
                    match_fn = fn_objs[k];
                    break;
                }
            }
            return match_fn.apply(this, args);
        };
    ret._fn_objs = fn_objs;
    return ret;
};

String.prototype.format = Overload({
    "array": function(params) {
        var reg = /{(\d+)}/gm;
        return this.replace(reg, function(match, name) {
            return params[~~name];
        });
    },
    "object": function(param) {
        var reg = /{([^{}]+)}/gm;
        return this.replace(reg, function(match, name) {
            return param[name];
        });
    }
});


function load_path(path) {
    if(!path || path.length === 0) {
        throw new Error('argument "path" is required !');
    }
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.src = path;
    script.type = 'text/javascript';
    head.appendChild(script);
}

//简单实现in的判断


function check_in(obj, seq) {
    return $.inArray(obj, seq) != -1;
}

function is_equal(obj1, obj2) {
    if(obj1.constructor !== obj2.constructor) return false;
    var aMemberCount = 0;
    for(var a in obj1) {
        if(!obj1.hasOwnProperty(a)) continue;
        if(typeof obj1[a] === 'object' && typeof obj2[a] === 'object' ? !obj1[a].equals(obj2[a]) : obj1[a] !== obj2[a]) return false;
        ++aMemberCount;
    }
    for(var a in obj2)
    if(obj2.hasOwnProperty(a))--aMemberCount;
    return aMemberCount ? false : true;
}

//复制对象


function copy_obj(obj) {
    if(obj.constructor == Array) {
        var new_obj_list = [];
        for(var i = 0; i < obj.length; i++) {
            var item = obj[i];
            new_obj_list.push(copy_obj(item));
        }
        return new_obj_list;
    } else if(obj.constructor == Number || obj.constructor == String) {
        var num = obj;
        return num;
    } else {
        return $.extend(true, {}, obj);
    }
};

//给定一个dom元素，得到与它最近的指定类型的parent元素(jquery类型)


function get_parent(obj, parent_type) {
    var $parent = $(obj).parent();
    while($parent.length > 0 && $parent[0].nodeName != parent_type.toUpperCase()) {
        $parent = $parent.parent();
    }
    return $parent;
}

function ajaxGet(obj) {
    var url = $(obj).attr("href");
    var target = $(obj).attr("rel");
    $.ajax({
        url: url,
        type: "GET",
        success: function(html_code) {
            $("#" + target).html(html_code);
        }
    });
}

function ajaxPost(url, data, callback, fail_callback) {
    //保存提示
    var secure_key = $.cookie("_xsrf") || "";
    if(isNotEmpty(secure_key)){
        data["_xsrf"] = secure_key;
    }
    var is_edit = url.indexOf("edit/ajax") != -1 ? true : false;
    if (is_edit){
        if (typeof(client_uuid) !== "undefined"){
            loadMack({off:'on',Limg:1,text:'加载中...',set:0});
            data["client_uuid"] = client_uuid;
            SavePrompt();
        }
    }
    isNotEmpty(fail_callback) ? fail_callback = fail_callback : fail_callback = function(){};
    $.ajax({
        url: url,
        data: data,
        dataType: "JSON",
        type: "POST",
        timeout: 60000,
        error: fail_callback,
        success: function(ret) {
            if(ret.status == "200") {
                if (ret.hasOwnProperty("edit_valid")){
                    if (!ret.edit_valid){
                        edit_lock_alert();
                        return;
                    }
                }
                if(isNotEmpty(callback)) {
                    callback(ret);
                }
                if (is_edit && !ret.err_msg){
                    SavePrompt(true);
                    $('.loadCon,.loadMack').remove();
                }
            }
        }
    });
}

function syncPost(url, data, callback) {
    //保存提示
    var secure_key = $.cookie("_xsrf");
    if(isNotEmpty(secure_key)){
        data["_xsrf"] = secure_key;
    }
    var is_edit = url.indexOf("edit/ajax") != -1 ? true : false;
    if (is_edit){
        data["client_uuid"] = client_uuid;
        SavePrompt();
    }
    $.ajax({
        url: url,
        data: data,
        dataType: "JSON",
        type: "POST",
        async: false,
        success: function(ret) {
            if(ret.status == "200") {
                if (ret.hasOwnProperty("edit_valid")){
                    if (!ret.edit_valid){
                        edit_lock_alert();
                        return;
                    }
                }
                if(isNotEmpty(callback)) {
                    callback(ret);
                }
            }
            if(is_edit){
                SavePrompt(true);
            }
        }
    });
}

function ajaxSubmit(obj) {
    var url = $(obj).attr("action") || window.location.href;
    var callback_name = $(obj).attr("callback");
    var callback = null;
    eval("callback = " + callback_name + "");
    var data = {};
    $.map($(obj).serializeArray(), function(item) {
        data[item.name] = item.value;
    });
    $.ajax({
        url: url,
        type: "POST",
        data: data,
        dataType: "JSON",
        success: function(ret) {
            if(ret.status == "200") {
                if(isNotEmpty(callback)) {
                    callback(ret);
                }
            } else if(ret.status == null) {
                alert("status is not defined in server response!");
            }
        }
    });
}

function ajaxGetSubmit(obj) {
    var url = $(obj).attr("action") || window.location.href;
    var callback_name = $(obj).attr("callback");
    var callback = null;
    eval("callback = " + callback_name + "");
    var data = {};
    $.map($(obj).serializeArray(), function(item) {
        data[item.name] = item.value;
    });
    $.ajax({
        url: url,
        type: "GET",
        data: data,
        dataType: "JSON",
        success: function(ret) {
            if(ret.status == "200") {
                if(isNotEmpty(callback)) {
                    callback(ret);
                }
            } else if(ret.status == null) {
                alert("status is not defined in server response!");
            }
        }
    });
}

function get_oid(obj) {
    if(obj.hasOwnProperty("_id")) {
        return obj._id["$oid"];
    }
    return "";
}

function set_active_head1(idx) {
    //首页，我的问卷，问卷库等几个tab的切换
    $('.main-nav li:eq(' + idx + ')').addClass('active');
}
function set_active_head_v2(idx) {
    //新版 首页，我的问卷，问卷库等几个tab的切换
    $('.left_Menu li a').removeClass('active');
    $('.left_Menu li:eq(' + idx + ') a').addClass('active');
}
function scroll_to(obj) {
    //滚动滚动条至对象所在的位置
    var is_iframe = (self.frameElement && self.frameElement.tagName == "IFRAME") ? true : false;
    var top = $(obj).offset().top;
    if(is_iframe){
        get_iframe_height(obj);
    }else{
        $('body, html').animate({
            scrollTop: top
        }, 'fast');
    }
}

//删除数组中某位置的元素
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

//确认框


function jsConfirm(Obj) {
    var onlyid = Obj.onlyid || "maptss";
    Tinfo = {
        title: Obj.title || "提示",
        content: Obj.content || "<span style='color:#ef6262;'>确定要删除吗？</span>",
        //提示内容
        conw: Obj.conw || 300,
        //宽度
        obj: Obj.obj || false,
        //执行方法
        Param: Obj.Param || '',
        //执行方法参数
		obj_text: Obj.obj_text || '确定',
        //执行方法按钮内容
        close_obj: Obj.close_obj || false,
        //取消方法
        close_Param: Obj.close_Param || '',
		//取消方法参数
		close_text: Obj.close_text || '取消',
        //取消方法按钮内容
        is_zhifu:false
    };
    var qr = '<div class="WJButton wj_blue tcQz">'+ Tinfo.obj_text +'</div>';
    var qx = '<div class="WJButton wj_blue uniteC">'+ Tinfo.close_text +'</div>';
    var con = '<div class="tccCon">' + '<div class="tccCon_t">'+ Tinfo.content +'</div><div class="tccCon_a">' + qr + qx + '</div></div>';

    //创建弹出层
    var wb = new jsbox({
        onlyid: onlyid,
        title: Tinfo.title,
        conw: Tinfo.conw,
        // FixedTop:170,
        content: con,
        range: true,
        mack: true
    }).show();

    //确定事件
    $('.tcQz').die().live('click', function() {
        var isReturn = Tinfo.obj(Tinfo.Param);
		if(isReturn==undefined || isReturn==null){
          $('.jsbox_close').click();
          setTimeout(function(){$('.zon_edit').remove();},100);
		}
    });
    //取消事件
    $('.uniteC').one('click', function() {
        if(Tinfo.close_obj) {
            Tinfo.close_obj(Tinfo.close_Param);
        }
        $('.jsbox_close').click();
    });
	//关闭按钮取消事件
    $('.jsbox_close').one('mousedown', function() {
        if(Tinfo.close_obj) {
            Tinfo.close_obj(Tinfo.close_Param);
        }
        $('.jsbox_close').click();
		return false;
    });

}

function jsCropConfirm(Obj) {
    Tinfo = {
        title: Obj.title || "提示",
        content: Obj.content || "确定要删除吗？",
        //提示内容
        conw: Obj.conw || 300,
        //宽度
        obj: Obj.obj || false,
        //执行方法
        Param: Obj.Param || '',
        //执行方法参数
        obj_text: Obj.obj_text || '确定',
        //执行方法按钮内容
        close_obj: Obj.close_obj || false,
        //取消方法
        close_Param: Obj.close_Param || '',
        //取消方法参数
        close_text: Obj.close_text || '取消',
        //取消方法按钮内容
    };
    var qr = '<div class="WJButton wj_blue tcQz">'+ Tinfo.obj_text +'</div>';
    var qx = '<div class="WJButton wj_blue c_close">'+ Tinfo.close_text +'</div>';
    var con = '<div class="tccCon">' + '<div class="tccCon_t">'+ Tinfo.content +'</div><div class="tccCon_a">' + qr + qx + '</div></div>';

    //创建弹出层
    var wb = new jsbox({
        onlyid: "maptss",
        title: Tinfo.title,
        conw: Tinfo.conw,
        // FixedTop:170,
        content: con,
        range: true,
        mack: true
    }).show();

    //确定事件
    $('.tcQz').die().live('click', function() {
        var isReturn = Tinfo.obj(Tinfo.Param);
        if(isReturn==undefined || isReturn==null){
          $('.jsbox_close').click();
          setTimeout(function(){$('.zon_edit').remove();},100);
        }
    });
    $('.c_close').bind('click', function() {
        if(Tinfo.close_obj) {
            Tinfo.close_obj(Tinfo.close_Param);
        }
        $('.jsbox_close').click();
    });
    //关闭按钮取消事件
    $('.jsbox_close').one('mousedown', function() {
        $('.jsbox_close').click();
        return false;
    });

}

function sleep(delay) {
    var start = new Date().getTime();
    while(new Date().getTime() < start + delay);
}

if(!Array.prototype.filter) {
    Array.prototype.filter = function(fun /*, thisp*/ ) {
        "use strict";

        if(this == null) throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if(typeof fun != "function") throw new TypeError();

        var res = [];
        var thisp = arguments[1];
        for(var i = 0; i < len; i++) {
            if(i in t) {
                var val = t[i]; // in case fun mutates this
                if(fun.call(thisp, val, i, t)) res.push(val);
            }
        }

        return res;
    };
}

//数组去重
Array.prototype.unique = function () {
    var n = []; //一个新的临时数组
    for (var i = 0; i < this.length; i++) //遍历当前数组
    {
        if (n.indexOf(this[i]) == -1) n.push(this[i]);
    }
    return n;
}

//确认框
function jsAlert(Obj) {
    var onlyid = Obj.onlyid || "maptss";
    Tinfo = {
        title: Obj.title || "提示",
        content: Obj.content || "确定要删除吗？",
        //提示内容
        conw: Obj.conw || 300,
        //宽度
        obj: Obj.obj || false,
        //执行方法
        Param: Obj.Param || '',
        //执行方法参数
        obj_text: Obj.obj_text || '确定'
        //执行方法按钮内容
    };
    var qr = '<div class="WJButton wj_blue tcQz">'+ Tinfo.obj_text +'</div>';
    var con = '<div class="tccCon">' + '<div class="tccCon_t">'+ Tinfo.content +'</div><div class="tccCon_a">' + qr+ '</div></div>';

    //创建弹出层
    var wb = new jsbox({
        onlyid: onlyid,
        title: Tinfo.title,
        conw: Tinfo.conw,
        //FixedTop:170,
        content: con,
        Close:false,
        range: true,
        mack: true
    }).show();

    //确定事件
    $('.tcQz').die().live('click', function() {
        if(Tinfo.obj){
            var isReturn = Tinfo.obj(Tinfo.Param);
            if(isReturn==undefined || isReturn==null){
              $('.jsbox_close', '#'+onlyid).click();
            }
        }else{
          $('.jsbox_close', '#'+onlyid).click();
        }
    });
}

//新消息提示
function NewMessage(off){
      if(off!==undefined){
         clearInterval(message);
         $('.NewMessage a').removeClass('xsa');
         return;
      }
      message = setInterval(function(){
          var Class = $('.NewMessage a').attr('class');
          if(Class==""){$('.NewMessage a').addClass('xsa');}else{$('.NewMessage a').removeClass('xsa');}
      },800);

  }

eval(function(p,a,c,k,e,d){e=function(c){return c.toString(36)};if(!''.replace(/^/,String)){while(c--){d[c.toString(a)]=k[c]||c.toString(a)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('4 8(a,b){1 d,e,c="";5(d=0;d<a.7/b;d++)e=a.g(d*b),c+=e;3 c}4 h(9,6){1 f=k;3 i("f = j"+6),f(9)}4 l(a){1 c,b="";5(c=0;c<a.7;c++)b+=8(a[c],2);3 m(b)}',23,23,'|var||return|function|for|v|length|slice_str|sa|||||||charAt|et|eval|ef|null|ef1|hex_md5'.split('|'),0,{}))

function InterceptString(str,length,length1)
{
//str=str.replace(/[" "|"　"]/g,"");//去半角+全角空格
//str=str.replace(/\s+/g,"");//去半角空格
//str=str.replace(/[\u3000]/g,"")去全角空格
//str=str.replace(/\s/ig,'');去半角空格
if(str.length>length)
{
   if(length1==0)
   {
    length1=length;
   }
   if (str.length >= length1)
   {
    var str_left = str.substr(0, length1);
    var str_right = str.substr(length1);
    var banjiao = 0;
    var quanjiao = 0;
    var strCode;
    for(var i=0;i<str_left.length;i++)
    {
     strCode=str.charCodeAt(i);

     if (strCode>= 33 && strCode <= 126)
     {
      banjiao++;
     }
     else
     {
      quanjiao++;
     }
    }
    if ((quanjiao + banjiao / 2) > length || (quanjiao + banjiao / 2) - length == 0.5)
    {
     str_left = str_left.substr(0,str_left.length-1);
     return str_left;
    }
    else if ((quanjiao + banjiao / 2) - length != 0)
    {
     if (length1 + 1 <= str.length)
     {
      str_left = InterceptString(str, length, length1 + 1);
     }
    }
    return str_left;
   }
}
}

function getDaysInOneMonth(year, month){var d= new Date(year, month, 0);return d.getDate();}var developer = "CC,JJ,PP,SF";

function get_iframe_height(obj){

    if(isNotEmpty(obj)&&obj==-2){
        var top = -2;
    }else if(!isNotEmpty(obj)){
        var top = -1;
    }else{
        var top = $(obj).offset().top;
    }
    var body_height = $('body').height()+30;
    var postObj = body_height+","+top;
    if (typeof postMessage != 'undefined'){
       window.parent.postMessage(postObj,'*');
    }
}
//Load页面
function Appload(Obj){
    var url = Obj.url||"/";
    if(url.indexOf('?')==-1){
        url = url+"?rd="+new Date().getTime();
    }else{
        url = url+"&rd="+new Date().getTime();
    }
        var Tinfo={
            obj:Obj.obj||$('body'),
            url:url,
            data:Obj.data||"",
            limg:Obj.limg||false,
            callback:Obj.callback||function(){}
        }
        Tinfo.obj.load(Tinfo.url,Tinfo.data, function(){
           Tinfo.callback();
        });
}

function tabularize(arr, cols){
    var ret = [];
    for (var i = 0; i < parseInt(arr.length / cols) + 1; i++) {
        var item = arr.slice(cols * i, cols * (i + 1));
        if (item.length < cols){
            for (var k = 0; k < (cols - item.length); k++) {
                item.push(null);
            }
        }
        ret.push(item);
    }
    return ret;
}

String.prototype.replaceAll = function(stringToFind,stringToReplace){
    var temp = this;
    var index = temp.indexOf(stringToFind);
    while(index != -1){
        temp = temp.replace(stringToFind,stringToReplace);
        index = temp.indexOf(stringToFind);
    }
    return temp;
}

function edit_lock_alert(){
    $('.loadCon,.loadMack').remove();
    jsConfirm({
        content:"问卷内容刚在其它浏览器窗口被修改， 是否重新加载进行编辑？",
        title: "提示",
        obj_text: "是",
        close_text: "否",
        obj: get_edit_lock,
        close_obj: close_window
    });
}


//让IE8以下浏览器支持split
var split;

// Avoid running twice; that would break the `nativeSplit` reference
split = split || function (undef) {

    var nativeSplit = String.prototype.split,
        compliantExecNpcg = /()??/.exec("")[1] === undef, // NPCG: nonparticipating capturing group
        self;

    self = function (str, separator, limit) {
        // If `separator` is not a regex, use `nativeSplit`
        if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
            return nativeSplit.call(str, separator, limit);
        }
        var output = [],
            flags = (separator.ignoreCase ? "i" : "") +
                    (separator.multiline  ? "m" : "") +
                    (separator.extended   ? "x" : "") + // Proposed for ES6
                    (separator.sticky     ? "y" : ""), // Firefox 3+
            lastLastIndex = 0,
            // Make `global` and avoid `lastIndex` issues by working with a copy
            separator = new RegExp(separator.source, flags + "g"),
            separator2, match, lastIndex, lastLength;
        str += ""; // Type-convert
        if (!compliantExecNpcg) {
            // Doesn't need flags gy, but they don't hurt
            separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
        }
        /* Values for `limit`, per the spec:
         * If undefined: 4294967295 // Math.pow(2, 32) - 1
         * If 0, Infinity, or NaN: 0
         * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
         * If negative number: 4294967296 - Math.floor(Math.abs(limit))
         * If other: Type-convert, then use the above rules
         */
        limit = limit === undef ?
            -1 >>> 0 : // Math.pow(2, 32) - 1
            limit >>> 0; // ToUint32(limit)
        while (match = separator.exec(str)) {
            // `separator.lastIndex` is not reliable cross-browser
            lastIndex = match.index + match[0].length;
            if (lastIndex > lastLastIndex) {
                output.push(str.slice(lastLastIndex, match.index));
                // Fix browsers whose `exec` methods don't consistently return `undefined` for
                // nonparticipating capturing groups
                if (!compliantExecNpcg && match.length > 1) {
                    match[0].replace(separator2, function () {
                        for (var i = 1; i < arguments.length - 2; i++) {
                            if (arguments[i] === undef) {
                                match[i] = undef;
                            }
                        }
                    });
                }
                if (match.length > 1 && match.index < str.length) {
                    Array.prototype.push.apply(output, match.slice(1));
                }
                lastLength = match[0].length;
                lastLastIndex = lastIndex;
                if (output.length >= limit) {
                    break;
                }
            }
            if (separator.lastIndex === match.index) {
                separator.lastIndex++; // Avoid an infinite loop
            }
        }
        if (lastLastIndex === str.length) {
            if (lastLength || !separator.test("")) {
                output.push("");
            }
        } else {
            output.push(str.slice(lastLastIndex));
        }
        return output.length > limit ? output.slice(0, limit) : output;
    };

    // For convenience
    String.prototype.split = function (separator, limit) {
        return self(this, separator, limit);
    };

    return self;

}();

function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]); return null;
}


//实时保存提示
function SavePrompt(isOff, message){
    var message1 = '已实时保存';
    var message2 = '正实时保存';
    if (message) {
        message1 = message2 = message;
    }
    var Sav = $('.SavePrompt');
    if(!isOff){var isOff=false;}
    if(isOff){
      $('.SavePrompt').text(message1);
      setTimeout(function(){
        Sav.fadeOut("slow");
        setTimeout(function(){
          Sav.remove();
        },600);
      },800);
    }else{
       if(Sav.length<1 && !$('.jsbox').is(':visible')){
          $('body').append('<div class="SavePrompt">正实时保存</div>');
       }
    }
}
//文件上传基础方法
function file_upload_custom(f,obj,url,success_callback,fail_callback) {

    if(!success_callback){success_callback=function(){}};
    if(!fail_callback){fail_callback=function(){}};

    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    var formData;
    formData = new FormData();
    formData.append('file', f);
    for(var key in obj){
        formData.append(key, obj[key]);
    }
    xhr.onreadystatechange = function(response) {
        if(xhr.readyState == 4 && xhr.status == 200 && xhr.responseText != "") {
            var ret = JSON.parse(xhr.responseText);
            success_callback(ret, qid);
        } else if(xhr.status != 200 && xhr.responseText) {
            var ret = JSON.parse(xhr.responseText);
            fail_callback(ret, qid);
        }
    };
    xhr.send(formData);
};

function strip_tags(dirtyString) {
    var container = document.createElement('div');
    container.innerHTML = dirtyString;
    return container.textContent || container.innerText;
}
//footer weizhi
function foot_address(){
    var winH=$(window).height();
    var bodyH = $('body').height();
    if($('.cq_footer').css('position')!= 'static'){
        if(bodyH>winH-$('.cq_footer').outerHeight()){
            $('.cq_footer').css({'position':'static'});
        } else {
            $('.cq_footer').css({'position':'absolute','bottom':0, 'left':0});
        }
    } else {
        if(bodyH>winH){
            $('.cq_footer').css({'position':'static'});
        } else {
            $('.cq_footer').css({'position':'absolute','bottom':0, 'left':0});
        }
    }

    // var winH=$(window).height();
    // var docH=$(document).height();
    // console.log(winH + '/' + $('body').height());
    // if(docH-$('.cq_footer').outerHeight()<winH){
    //     $('.cq_footer').css({'position':'absolute','left':'0px','bottom':'0px'});
    // }else{
    //     $('.cq_footer').css({'position':'static'});
    // }
}

$(function(){
    foot_address();
});
$(window).load(function(){
    foot_address();
    $('.cq_footer').show();
});
/*$(window).resize(function(){
    setTimeout(function(){foot_address();},100);
});*/

function GetQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
}

if ('function' !== typeof Array.prototype.reduce) {
    Array.prototype.reduce = function(callback, opt_initialValue) {
        'use strict';
        if (null === this || 'undefined' === typeof this) {
            // At the moment all modern browsers, that support strict mode, have
            // native implementation of Array.prototype.reduce. For instance, IE8
            // does not support strict mode, so this check is actually useless.
            throw new TypeError(
                'Array.prototype.reduce called on null or undefined');
        }
        if ('function' !== typeof callback) {
            throw new TypeError(callback + ' is not a function');
        }
        var index, value,
            length = this.length >>> 0,
            isValueSet = false;
        if (1 < arguments.length) {
            value = opt_initialValue;
            isValueSet = true;
        }
        for (index = 0; length > index; ++index) {
            if (this.hasOwnProperty(index)) {
                if (isValueSet) {
                    value = callback(value, this[index], index, this);
                } else {
                    value = this[index];
                    isValueSet = true;
                }
            }
        }
        if (!isValueSet) {
            throw new TypeError('Reduce of empty array with no initial value');
        }
        return value;
    };
}

function escape_html(s){
  return (s)? jQuery("<p>").text(s).html(): "";
}
//兼容IE9以下不支持Object.keys
if (!Object.keys) Object.keys = function(o) {
  if (o !== Object(o))
    throw new TypeError('Object.keys called on a non-object');
  var k=[],p;
  for (p in o) if (Object.prototype.hasOwnProperty.call(o,p)) k.push(p);
  return k;
}

var projectPublishFun = {
    init: function(pid, option) {
        this.bState = true;  // 默认可发送验证码
        this.setting = {
            pid: pid,
            type: '问卷',  // 问卷类型（问卷、表单、测评）
            surveyTitle: '',  // 问卷标题
            showShare: true,  // 当前页面默认是否可以共享模版（概况页、列表页默认不共享）
            page: '',  // 当前所在页面
            isPublish: true,  // 是否发布
            // publishSaveFun: function(){},  // 确认发布回调函数
            publishCancelFun: function(){}  // 取消发布回掉函数
        };
        $.extend(this.setting, option);
        this.validateFun(pid);
    },
    // 验证企业协作权限
    validateFun: function(pid){
        var _this = this;
        $.ajax({
            url : '/enterprise/check_member_permission/?permission_type=edit&project_id=' + pid,
            type : 'GET',
            dataType : 'json',
            success : function(ret){
                if(ret.status == 200){
                    if(ret.code == 1){
                        // 收集页面，停止收集
                        if (!_this.setting.isPublish) {
                            _this.checkPconvertForm(pid);
                        } else {
                            // 编辑页面，移除错误提示信息
                            if (_this.setting.page === 'surveyEdit' || _this.setting.page === 'formEdit') {
                                $(".question").each(function(){
                                    verify_question_option.hide($(this).attr("oid"));
                                });
                                _this.publishCheckFun(pid);
                            } else if (_this.setting.page === 'assessEdit') {
                                if (is_validate_all()) _this.publishCheckFun(pid);
                            } else {
                                _this.publishCheckFun(pid);
                            }
                        }
                    }else if(ret.code == 2){ 
                      loadMack({ off: 'on', Limg: 1, text:'您没有权限使用，请联系项目所有者', set: 1000 });
                      _this.setting.publishCancelFun();
                    }
                }else{
                    check_permission = false;
                    loadMack({ off: 'on', Limg: 1, text:'请稍后再试', set: 1000 });
                    _this.setting.publishCancelFun();
                }
            }
        });
    },
    // 判断是否有未编辑完成的题目
    publishCheckFun: function(pid){
        var _this = this;
        $.ajax({
            url: '/edit/ajax/publish_check/' + pid+'/',
            dataType: 'JSON',
            success: function(ret){
                if (ret.invalid_qid_list.length === 0){
                    if (_this.setting.hasMobile) {
                        _this.publishFun(pid);
                    } else {
                        _this.showBindMobileFun(pid);
                    }
                }else{
                    // 未编辑完成的题目
                    if (_this.setting.page === 'surveyEdit' || _this.setting.page === 'formEdit' || _this.setting.page === 'assessEdit') {
                        // 编辑页面，验证项目中是否有未编辑完成的题目，添加提示
                        for (var i = 0; i < ret.invalid_qid_list.length; i++) {
                            var qid = ret.invalid_qid_list[i];
                            var qmodel = get_qmodel(qid);
                            qmodel.show_edit_error_msg();
                        };
                        scroll_to($('.question[oid='+ret.invalid_qid_list[0]+']'));
                    } else {
                        // 收集页、数据报表、列表页、概览页，包含未编辑完成的题目
                        jsAlert({
                            title: '提示',
                            content: '<p>该'+ _this.setting.type +'包含未编辑完成的题目，暂时无法发布，请先前往编辑页面完成编辑。</p>',
                            conw: 380,
                            obj: _this.setting.publishCancelFun
                        });
                    }
                }
            }
        })
    },
    // 发布问卷弹窗
    publishFun: function(pid){
        var _this = this;
        var content = '';
        if (_this.setting.isPublish) {
            if (_this.setting.surveyTitle) {
                content = '<p>你要发布'+ _this.setting.type +'<span>《'+ _this.setting.surveyTitle +'》</span>吗？</p>';
            } else {
                content = '<p>是否发布'+ _this.setting.type +'？</p>';
            }
        }

        if(_this.setting.showShare && _this.setting.isPublish){
            var shareUnChecked = localStorage.getItem('share_unchecked_' + pid);
            if (shareUnChecked) {
                content += '<label><input style="vertical-align:middle;margin: 3px;" type="checkbox" id="checkbox_selector"/>共享到模板库</label><i class="tips" title="选中该选项，本'+ _this.setting.type +'经审核合格后会添加到模板库中，供其他会员制作'+ _this.setting.type +'时参考。"></i>';
            } else {
                content += '<label><input style="vertical-align:middle;margin: 3px;" type="checkbox" checked id="checkbox_selector"/>共享到模板库</label><i class="tips" title="选中该选项，本'+ _this.setting.type +'经审核合格后会添加到模板库中，供其他会员制作'+ _this.setting.type +'时参考。"></i>';
            }
        }

        var confirmPopupObj = {
            'title': '发布确认',
            'content': content,
            'obj': _this.setting.publishSaveFun || _this.publishSaveFun,
            'Param': _this.setting,
            'close_obj': _this.setting.publishCancelFun
        };
        jsConfirm(confirmPopupObj);
    },
    // 显示绑定手机号弹窗
    showBindMobileFun: function(pid) {
        var _this = this;
        var shareContent = '';
        if (_this.setting.showShare && _this.setting.isPublish){
            var shareUnChecked = localStorage.getItem('share_unchecked_' + pid);
            if (shareUnChecked) {
                shareContent = '<div class="share_temp"><label><input type="checkbox" id="checkbox_selector" />'+ _this.setting.type +'共享到模版库</label></div>';
            } else {
                shareContent = '<div class="share_temp"><label><input type="checkbox" id="checkbox_selector" checked />'+ _this.setting.type +'共享到模版库</label></div>';
            }
        }
        var bindMobileHtml = '' +
            '<div class="bind_mobile_wrap">' +
                '<div class="bind_mobile_form">' +
                    '<div class="form_item_wrap">' +
                        '<div class="form_item form_mobile"><label for=""><input type="text" placeholder="手机号" name="mobile" class="mobile" /></label></div>' +
                        '<div class="form_error">据网信办规定，发布'+ _this.setting.type +'需绑定手机</div>' +
                    '</div>' +
                    '<div class="form_item_wrap">' +
                        '<div class="form_item form_vcode"><label for=""><input type="text" placeholder="验证码" name="vcode" class="vcode" /></label><a class="btn_get_vcode">获取验证码</a></div>' +
                        '<div class="form_error"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="btn_wrap"><a class="btn_publish btn_disable">确定并发布'+ _this.setting.type +'</a></div>' +
                shareContent +
            '</div>';
        var bindMobilePopup = new jsbox({
            onlyid: 'publish_bind_mobile',
            title: '绑定手机号',
            content: bindMobileHtml,
            conw: 600,
            range: true,
            mack: true
        }).show();

        // 关闭按钮
        $('#publish_bind_mobile .jsbox_close').one('click', function() {
            if(_this.setting.publishCancelFun) {
                _this.setting.publishCancelFun();
            }
        });
        // 监听手机号码
        $('#publish_bind_mobile input[name=mobile]').keyup(function(e){
            var $this = $(this);
            var mobile = $this.val().replace(/\D/g,'');
            var $mobileError = $this.parents('.form_item_wrap').find('.form_error');
            mobile = mobile.substr(0, 11);
            $this.val(mobile);
            if (mobile !== '') {
                $mobileError.text('').hide();
                if (mobile.length === 11) {
                    _this.validateMobileAndVcode($this);
                }

            } else {
                $mobileError.show().text('据网信办规定，发布'+ _this.setting.type +'需绑定手机');
            }
        });
        // 监听验证码
        $('#publish_bind_mobile input[name=vcode]').keyup(function(e){
            var $this = $(this);
            // var mobile = $this.val().replace(/\D/g,'');
            var vcode = $this.val();
            var $vcodeError = $this.parents('.form_item_wrap').find('.form_error');
            if (vcode.length >= 6) vcode = vcode.substr(0, 6);
            $this.val(vcode);
            if (vcode !== '') {
                $vcodeError.text('').hide();
                if (vcode.length === 6) {
                    _this.validateMobileAndVcode($this);
                }
            } else {
                $vcodeError.show().text('请输入验证码');
            }
        });
        // 获取验证码
        $('#publish_bind_mobile .btn_get_vcode').click(function(e){
            if ($(this).hasClass('btn_disabled')) return;
            var $this = $(this),
                $mobile = $this.parents('.bind_mobile_form').find('input[name=mobile]');
                mobile = $mobile.val();
                $mobileError = $mobile.parents('.form_item_wrap').find('.form_error');
            if (mobile == '') {
                $mobileError.text('据网信办规定，发布'+ _this.setting.type +'需绑定手机').show();
                return false;
            } else if (!/^(1[0-9])\d{9}$/.test(mobile)) {
                $mobileError.text('请输入正确的手机号码').show();
                return false;
            } else {
                $mobileError.text('').hide();
            };
            if(_this.bState) {
                ajaxPost('/register/auth_mobile_validatecode/', {'mobile': mobile}, function(response){
                    if (response.error_msg) {
                        $mobileError.text(response.error_msg).show();
                    } else {
                        loadMack({off: 'on', Limg: 0, text:' 验证码已发送，请查收', set: 2000});
                        _this.getMobileCode($this);
                    }
                });
            };
        });
        
        // 确定并发布问卷
        $('#publish_bind_mobile .btn_publish').click(function(e){
            var $this = $(this);
            if (!$this.hasClass('btn_disable')) {
                var $bindMobileForm = $this.parents('.bind_mobile_wrap'),
                    $mobile = $bindMobileForm.find('input[name=mobile]');
                    mobile = $mobile.val(),
                    $mobileError = $mobile.parents('.form_item_wrap').find('.form_error'),
                    $vcode = $bindMobileForm.find('input[name=vcode]'),
                    vcode = $vcode.val(),
                    $vcodeError = $vcode.parents('.form_item_wrap').find('.form_error'),
                    is_shared = $("#checkbox_selector").attr("checked");
                if (mobile == '') {
                    $mobileError.text('据网信办规定，发布'+ _this.setting.type +'需绑定手机').show();
                    return false;
                } else if (!/^(1[0-9])\d{9}$/.test(mobile)) {
                    $mobileError.text('请输入正确的手机号码').show();
                    return false;
                } else {
                    $mobileError.text('').hide();
                };
                if (vcode == '') {
                    $vcodeError.text('请输入验证码').show();
                    return false;
                } else {
                    $vcodeError.text('').hide();
                };
                if (!is_shared) {
                    localStorage.setItem('share_unchecked_' + pid, true);
                } else {
                    localStorage.removeItem('share_unchecked_' + pid);
                }
                var data = {
                    'mobile': mobile,
                    'vcode': vcode,
                    'proj_id': pid,
                    'status': 1,
                    'is_shared': is_shared,
                };
                loadMack({off:'on',text:'发布中',set:10000});
                ajaxPost('/edit/ajax/bind_mobile_update_project_status/', data, function(response){
                    if (response.error_msg) {
                        if (response.error_msg.indexOf('手机号') != -1) {
                            $mobileError.text(response.error_msg).show();
                            $vcodeError.text('').hide();
                        } else {
                            $mobileError.text('').hide();
                            $vcodeError.text(response.error_msg).show();
                        }
                    } else {
                        _this.publishSuccessFun(pid, response);
                    }
                });
            }
        });
    },
    // 验证手机号和验证码
    validateMobileAndVcode: function(obj){
        var $bindMobileForm = obj.parents('.bind_mobile_wrap'),
            $mobile = $bindMobileForm.find('input[name=mobile]');
            mobile = $mobile.val(),
            $mobileError = $mobile.parents('.form_item_wrap').find('.form_error'),
            $vcode = $bindMobileForm.find('input[name=vcode]'),
            vcode = $vcode.val(),
            $vcodeError = $vcode.parents('.form_item_wrap').find('.form_error'),
            $btnPublish = $bindMobileForm.find('.btn_publish'),
            $share = $bindMobileForm.find('.share_temp');
        if (mobile.length === 11 && vcode.length === 6) {
            var data = {
                'mobile': mobile,
                'vcode': vcode,
                '_xsrf': $.cookie('_xsrf')
            }
            $.ajax({
                url: '/register/mobile_validate/',
                data: data,
                dataType: 'JSON',
                type: 'POST',
                timeout: 60000,
                success: function(response) {
                    if (response.status == '200') {
                        if (response.error_msg) {
                            if (response.error_msg.indexOf('手机号') != -1) {
                                $mobileError.text(response.error_msg).show();
                                $vcodeError.text('').hide();
                            } else {
                                $mobileError.text('').hide();
                                $vcodeError.text(response.error_msg).show();
                            }
                            $btnPublish.addClass('btn_disable');
                            if ($share) $share.hide();
                        } else {
                            $btnPublish.removeClass('btn_disable');
                            if ($share) $share.show();
                        }
                    }
                }
            });
        } else {
            $btnPublish.addClass('btn_disable');
            if ($share) $share.hide();
        }
    },
    // 正常流程发布成功的回调函数(已绑定过手机号的用户)
    publishSaveFun: function(){
        var param = this.Param,
            pid = param.pid,
            is_shared = $("#checkbox_selector").attr("checked");
        if (!is_shared) {
            localStorage.setItem('share_unchecked_' + pid, true);
        } else {
            localStorage.removeItem('share_unchecked_' + pid);
        }
        var data = {
            'proj_id': pid,
            'status': 1,
            'is_shared': is_shared,
            '_xsrf': $.cookie("_xsrf")
        };
        loadMack({off:'on',text:'发布中',set:10000});
        $.ajax({
            url: '/edit/ajax/update_project_status/',
            data: data,
            dataType: 'JSON',
            type: 'POST',
            timeout: 60000,
            success: function(response) {
                if(response.status == "200") {
                    if (response.error_msg) {
                        $('.loadCon,.loadMack').remove();
                        loadMack({off: 'on', Limg: 0, text: response.error_msg, set: 2000});
                    } else {
                        projectPublishFun.publishSuccessFun(pid, response);
                    }
                }
            }
        });
    },
    // 绑定手机号和发布成功后的回调函数
    publishSuccessFun: function(pid, info) {
        var _this = this;
        try{
            if (change_project_status_callback && typeof(change_project_status_callback) == "function") {
                change_project_status_callback(info);
            }
        }catch(e){}
        if (_this.setting.page == 'report' || _this.setting.page == 'assessReport') {
            $('.loadCon,.loadMack,#publish_bind_mobile,.publish_bind_mobile_lightBox').remove();
            _this.setting.obj.html('停止收集').addClass('cq_stop_btn');
        } else if (_this.setting.page == 'collect') {
            window.location.href = '/collect/'+ _this.setting.pagename + '/' + _this.setting.pid + '/';
        } else if (_this.setting.page == 'list') {
            $('.loadCon,.loadMack,#publish_bind_mobile,.publish_bind_mobile_lightBox').remove();
            var $obj = _this.setting.obj,
                $tr = $obj.parents('.tr');
            if($obj.find('option:selected').val() == 2){
              $tr.find('.editor').addClass('end').attr("href",'javascript:;');
              $tr.find('.editor').attr("onclick",'');
            }else{
              var pid=$obj.attr('pid');
              $tr.find('.editor,.collect_a').removeClass('end').attr("href",'/collect/urllink/' + pid);
              $tr.find('.editor').attr("onclick",'project_design_confirm(this);return false;');
            }
        } else if (_this.setting.page == 'overview') {
            location.reload()
        }
    },
    // 获取验证码后的倒计时
    getMobileCode: function(obj){
        var _this = this;
        var sendMobileTimer = null;
        var iCountDownNum = 59;
        if(_this.bState){
            _this.bState = false;
            sendMobileTimer = setInterval(function(){
                if(iCountDownNum <= 0){
                    clearInterval(sendMobileTimer);
                    iCountDownNum = 59;
                    obj.html('获取验证码').removeClass('btn_disabled');
                    _this.bState = true;
                } else {
                    iCountDownNum--;
                    obj.html(iCountDownNum + '秒后重新获取').addClass('btn_disabled');
                }
            }, 1000);
        }
    },
    // 停止收集弹窗
    checkPconvertForm: function(pid) {
        var _this = this;
        ajaxPost('/edit/ajax/get_rspd_count/', {'proj_id': pid}, function(response){
            if (response.error_msg) {
                loadMack({off: 'on', text: response.error_msg, set:10000});
            } else {
                if(response.pc_count != 0) {
                    var confirmPopupObj = {
                        'title': '修改确认',
                        'content': '<img style="display: block; margin: 10px auto 25px;" src="/static/images/exclamation_mark.png" />停止收集你的有偿收集订单也将被<span style="color:#cd4444;">取消</span>！你想再收集时可至“<span style="color:#cd4444;">收集数据→有偿收集</span>”重新下订单。',
                        'obj': _this.stopCollectFun,
                        'Param': _this.setting,
                        'conw': 400,
                        'close_obj': _this.setting.publishCancelFun
                    };
                    jsConfirm(confirmPopupObj);
                } else {
                    var confirmPopupObj = {
                        'title': '停止确认',
                        'content': '<p>确认停止收集<span>《'+ _this.setting.surveyTitle +'》</span>吗？</p><p>该'+ _this.setting.type +'所有数据收集将被停止，答题链接将无法收集数据</p>',
                        'obj': _this.stopCollectFun,
                        'Param': _this.setting,
                        'conw': 400,
                        'close_obj': _this.setting.publishCancelFun
                    };
                    jsConfirm(confirmPopupObj);
                }
            }
        });
    },
    // 停止收集
    stopCollectFun: function(){
        var param = this.Param;
        var data = {
            'proj_id': param.pid,
            'status': 0,
            '_xsrf': $.cookie("_xsrf")
        };
        $.ajax({
            url: '/edit/ajax/update_project_status/',
            data: data,
            dataType: 'JSON',
            type: 'POST',
            timeout: 60000,
            success: function(response) {
                if(response.status == "200") {
                    if (response.error_msg) {
                        $('.loadCon,.loadMack').remove();
                        loadMack({off: 'on', Limg: 0, text: response.error_msg, set: 2000});
                    } else {
                        if (param.page == 'report' || param.page == 'assessReport') {
                            param.obj.html('开始收集').removeClass('cq_stop_btn');
                        } else if (param.page == 'collect') {
                            window.location.href = '/collect/'+ param.pagename + '/' + param.pid + '/';
                        }
                    }
                }
            }
        });
    }
};

var projectPublishMobileFun = {
    init: function(pid, option) {
        this.bState = true;  // 默认可发送验证码
        this.setting = {
            pid: pid,
            type: '问卷'  // 问卷类型（问卷、表单）
        };
        $.extend(this.setting, option);
        this.showBindMobileFun(pid);
    },
    // 显示绑定手机号弹窗
    showBindMobileFun: function(pid) {
        var _this = this;
        $('#bindMobileHtml').remove();
        var bindMobileHtml = '' +
            '<div id="publish_bind_mobile">' +
                '<div class="bind_mobile_wrap">' +
                    '<a class="btn_close_bind_mobile"></a>' +
                    '<div class="title">绑定手机号</div>' +
                    '<div class="bind_mobile_form">' +
                        '<div class="form_item_wrap">' +
                            '<div class="form_item form_mobile"><label for=""><input type="text" placeholder="手机号" name="mobile" class="mobile" /></label></div>' +
                            '<div class="form_error">据网信办规定，发布'+ _this.setting.type +'需绑定手机</div>' +
                        '</div>' +
                        '<div class="form_item_wrap">' +
                            '<div class="form_item form_vcode"><label for=""><input type="text" placeholder="验证码" name="vcode" class="vcode" /></label><a class="btn_get_vcode">获取验证码</a></div>' +
                            '<div class="form_error"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="btn_wrap"><a class="btn_publish btn_disable">确定并发布'+ _this.setting.type +'</a></div>' +
                '</div>' +
            '</div>';
        $('body').append(bindMobileHtml);

        // 关闭按钮
        $('#publish_bind_mobile .btn_close_bind_mobile').one('click', function() {
            $('#publish_bind_mobile').remove();
        });
        // 监听手机号码
        $('#publish_bind_mobile input[name=mobile]').keyup(function(e){
            var $this = $(this);
            var mobile = $this.val().replace(/\D/g,'');
            var $mobileError = $this.parents('.form_item_wrap').find('.form_error');
            mobile = mobile.substr(0, 11);
            $this.val(mobile);
            if (mobile !== '') {
                $mobileError.text('').hide();
                if (mobile.length === 11) {
                    projectPublishFun.validateMobileAndVcode($this);
                }

            } else {
                $mobileError.show().text('据网信办规定，发布'+ _this.setting.type +'需绑定手机');
            }
        });
        // 监听验证码
        $('#publish_bind_mobile input[name=vcode]').keyup(function(e){
            var $this = $(this);
            // var mobile = $this.val().replace(/\D/g,'');
            var vcode = $this.val();
            var $vcodeError = $this.parents('.form_item_wrap').find('.form_error');
            if (vcode.length >= 6) vcode = vcode.substr(0, 6);
            $this.val(vcode);
            if (vcode !== '') {
                $vcodeError.text('').hide();
                if (vcode.length === 6) {
                    projectPublishFun.validateMobileAndVcode($this);
                }
            } else {
                $vcodeError.show().text('请输入验证码');
            }
        });
        // 获取验证码
        $('#publish_bind_mobile .btn_get_vcode').click(function(e){
            if ($(this).hasClass('btn_disabled')) return;
            var $this = $(this),
                $mobile = $this.parents('.bind_mobile_form').find('input[name=mobile]');
                mobile = $mobile.val();
                $mobileError = $mobile.parents('.form_item_wrap').find('.form_error');
            if (mobile == '') {
                $mobileError.text('据网信办规定，发布'+ _this.setting.type +'需绑定手机').show();
                return false;
            } else if (!/^(1[0-9])\d{9}$/.test(mobile)) {
                $mobileError.text('请输入正确的手机号码').show();
                return false;
            } else {
                $mobileError.text('').hide();
            };
            if(_this.bState) {
                ajaxPost('/register/auth_mobile_validatecode/', {'mobile': mobile}, function(response){
                    if (response.error_msg) {
                        $mobileError.text(response.error_msg).show();
                    } else {
                        loadMack({off: 'on', Limg: 0, text:' 验证码已发送，请查收', set: 2000});
                        _this.getMobileCode($this);
                    }
                });
            };
        });
        
        // 确定并发布问卷
        $('#publish_bind_mobile .btn_publish').click(function(e){
            var $this = $(this);
            if (!$this.hasClass('btn_disable')) {
                var $bindMobileForm = $this.parents('.bind_mobile_wrap'),
                    $mobile = $bindMobileForm.find('input[name=mobile]');
                    mobile = $mobile.val(),
                    $mobileError = $mobile.parents('.form_item_wrap').find('.form_error'),
                    $vcode = $bindMobileForm.find('input[name=vcode]'),
                    vcode = $vcode.val(),
                    $vcodeError = $vcode.parents('.form_item_wrap').find('.form_error');
                if (mobile == '') {
                    $mobileError.text('据网信办规定，发布'+ _this.setting.type +'需绑定手机').show();
                    return false;
                } else if (!/^(1[0-9])\d{9}$/.test(mobile)) {
                    $mobileError.text('请输入正确的手机号码').show();
                    return false;
                } else {
                    $mobileError.text('').hide();
                };
                if (vcode == '') {
                    $vcodeError.text('请输入验证码').show();
                    return false;
                } else {
                    $vcodeError.text('').hide();
                };
                var data = {
                    'mobile': mobile,
                    'vcode': vcode,
                    'proj_id': pid,
                    'status': 1
                };
                loadMack({off:'on',text:'发布中',set:10000});
                ajaxPost('/edit/ajax/bind_mobile_update_project_status/', data, function(response){
                    if (response.error_msg) {
                        if (response.error_msg.indexOf('手机号') != -1) {
                            $mobileError.text(response.error_msg).show();
                            $vcodeError.text('').hide();
                            return false;
                        } else {
                            $mobileError.text('').hide();
                            $vcodeError.text(response.error_msg).show();
                            return false;
                        }                        
                    } else {
                        if (_this.setting.page == 'list') {
                            surePub = true; //表示从发布按钮跳到分享按钮
                            $('.sr_share[pidname='+ pid +']').triggerHandler("tapone");
                        } else if (_this.setting.page == 'edit') {
                            window.location.href = _this.setting.getSurveyUrl + '?own=1';
                        }
                    }
                });
            }
        });
    },
    // 获取验证码后的倒计时
    getMobileCode: function(obj){
        var _this = this;
        var sendMobileTimer = null;
        var iCountDownNum = 59;
        if(_this.bState){
            _this.bState = false;
            sendMobileTimer = setInterval(function(){
                if(iCountDownNum <= 0){
                    clearInterval(sendMobileTimer);
                    iCountDownNum = 59;
                    obj.html('获取验证码').removeClass('btn_disabled');
                    _this.bState = true;
                } else {
                    iCountDownNum--;
                    obj.html(iCountDownNum + '秒后重新获取').addClass('btn_disabled');
                }
            }, 1000);
        }
    },
};
