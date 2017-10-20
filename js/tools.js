Array.prototype.in_array = function(e){ 
    for(i=0;i<this.length;i++){
        if(this[i] == e)
			return true;
    }
    return false;
}

function getCookie(c_name){
	if (document.cookie.length>0){
		c_start=document.cookie.indexOf(c_name + "=")
		if (c_start!=-1){
			c_start=c_start + c_name.length+1;
			c_end=document.cookie.indexOf(";",c_start);
			if (c_end==-1) c_end=document.cookie.length;
			return unescape(document.cookie.substring(c_start,c_end));
		}
	}
	return "";
}

function SetWinHeight(obj, height, objid){
	 var win=obj;
	 
	 if(typeof(objid) != 'undefined'){
		win = document.getElementById(objid);
	 }

	 if(typeof(height) != 'undefined'){
		win.height = height;
		return true;
	 }

	 if (document.getElementById){
		  if (win && !window.opera){
			   if (win.contentDocument && win.contentDocument.body.offsetHeight) 
					win.height = win.contentDocument.body.offsetHeight; 
			   else if(win.Document && win.Document.body.scrollHeight)
					win.height = win.Document.body.scrollHeight;
			}
	 }
	 return true;
}

function goto_furl(url, furl){
	target = '';
	if (furl == ''){
		location_href = location.href;
		location_href = url_add_random(location_href);
	}
	else
		location_href = furl;

	join_pre_str = url.indexOf('?')>0?'&':'?';
	if(target == ''){
		if (url == '/login/')
		{
			location.href = url + join_pre_str + 'furl=' + encodeURIComponent(location_href);
		}
		else
		{
			location.href = url + join_pre_str + 'furl=' + encodeURIComponent(location_href);
		}
	}
	else{
		alert(target);
	}
	return false;
}

function show_loginwin(){
	$("#LoginWinModal").modal();
}

function check_loginwin(vcode){
	user = $('#loginwin_emailorusername').val();
	
	if(user.length < 1){
		return false;
	}
	password = $('#loginwin_password').val();
	if(password.length < 1){
		return false;
	}

	var saveme = '1';
	$(".loginbut").text('登录中...');
	login_sessionid(user, password, vcode, saveme, errorback);
}

function check_loginwin_ls(vcode){
	user = $('#loginwin_emailorusername').val();
	
	if(user.length < 1){
		return false;
	}
	password = $('#loginwin_password').val();
	if(password.length < 1){
		return false;
	}

	var saveme = '1';
	$(".loginbut").text('登录中...');
	login_sessionid(user, password, vcode, saveme, errorback_ls);
}

function errorback_ls(error, msg, emailorusername){
	if (error > 10)
	{
		
		alert(decodeURIComponent(msg));

	}
	else{
	}
	
	return;
}

function errorback(error, msg, emailorusername){
	if (error > 10)
	{
		
		location.href = "/login/?emailorusername="+ emailorusername +"&msg=" + msg + "&time=" + Math.random();

	}
	else{
	}
	
	return;
}

function auto_show_hide(objid, showtime){
	$('#'+ objid).show();
	window.setTimeout("auto_hide('" + objid + "')", showtime);
}

function auto_hide(objid){
	$('#' + objid).hide();
}

var sessionid = '';
var nickname = '';
function get_sessionid(){
		$.ajax({url:"/jslogin/",async:false,data:{}, success:function(data){

			var obj = eval( "(" + data + ")" );		
			sessionid = obj.sessionid;
			nickname = obj.nickname;

		},error:function(xhr){
			alert(xhr.responseText)
		}});
}

function send_sessionid(sessionid, nickname){
		//发送给服务器端、或保存在客户端， nickname可以用来判断登陆状态（空：未登陆， 其他：已登陆）
		return true;
}

function checkandloginshow(){
	$.ajax({url:"/jslogin/",async:true,data:{}, success:function(data){

			var obj = eval( "(" + data + ")" );		
			if(obj.nickname == '')
				show_loginwin();

		},error:function(xhr){
			alert(xhr.responseText)
		}});
}

function checkloginstatus(callback){
	$.ajax({url:"/jslogin/",async:true,data:{}, success:function(data){
			var obj = eval( "(" + data + ")" );		
			if(obj.nickname == '')
				callback('nologin');
			else
				callback('login');

		},error:function(xhr){
			alert(xhr.responseText)
		}});
}

function login_sessionid(emailorusername, password, vcode, saveme, callback) {
    $.ajax({
        url: "/jslogin/",
        async: false,
        data: {
            emailorusername: emailorusername,
            password: password,
            vcode: vcode,
            saveme:saveme
        },
        dataType: 'json',
        type: 'post',
        success:function(data) {
            var obj = data;
            if (obj.error == 0) {
                // login success
                old_href = location.href;
                old_href_arr = old_href.split('#');
                prefix = (old_href_arr[0].indexOf("?") > 0)?'&':'?';
                new_href = old_href_arr[0] + prefix + Math.random();
                if (old_href_arr.length > 1)
                    new_href += "#" + old_href_arr[1];
                if (new_href.indexOf('/form') > 0){
                    var site_n = new_href.indexOf('/form');
                    var c_char = new_href[site_n + 5];
                    if (c_char == '?' || c_char == '&' || c_char == '/')
                        new_href = new_href.replace('/form', '/myform');
                }else if(new_href.indexOf('/auth/bind_account') != -1){  //第三方登录绑定
                    // new_href = '/auth/bind_account';
                    // 绑定的第三方账号类型，例如：微信，微博，QQ
					var type_dict = {'weixin': '微信', 'qq': 'QQ', 'renren': '人人', 'sina': '微博', 'mingdao': '明道'};
					var type = type_dict[obj.reg_type];
                    showBindSuccess(type);
                }else
                    new_href = '/mysurvey/';
                if(new_href.indexOf('/auth/bind_account') == -1){
	                location.href = new_href;
	            }
                $('.tc_login_cq .error').text('');
            }
            else {
            	$(".loginbut").text('登录');
                if (obj.err_msg == 'appeal') {
                    $('.tc_login_cq .error').html('<a target="_blank" href="/about/appeal?username='+ emailorusername +'">账号被禁，立即申诉</a>');
                }
                else {
                    $('.tc_login_cq .error').text(obj.err_msg);
                }
            }
        },
        error:function(xhr) {
            $('.tc_login_cq .error').text(xhr.responseText);
        }});
}

function mod_password(oldpassword, newpassword, callback){
	$.ajax({url:"/member/data/pwd/",async:true,data:{oldpassword:oldpassword, password:newpassword, _xsrf:getCookie('_xsrf')}, dataType:'json', type:'post', success:function(data){
					
					if (data.error == 0)
					{
						callback(data.result);
					}
					else{
						location.href="/";
						alert(data.error);
					}
		},error:function(xhr){
			alert(xhr.responseText);
		}});
}

function mod_username(username, callback){
	$.ajax({url:"/member/data/username/",async:true,data:{username:username, _xsrf:getCookie('_xsrf')}, dataType:'json', type:'post', success:function(data){
					
					if (data.error == 0)
					{
						callback(data.result);
					}
					else{
						location.href="/";
						alert(data.error);
					}
		},error:function(xhr){
			alert(xhr.responseText);
		}});
}

var global_error = 0;
function check_register(field, value, operate, callback){
	$.ajax({url:"/checkmember/",async:false,data:{field:field, value:value, operate:operate}, dataType:'json', type:'post', success:function(data){
					
					if (data.error == 0)
					{
						if (operate == 'sendmail' && data.result == 0 && field=='email')
						{
							location.href = '/register/?rtype=send&email=' + data.email + '&time=' + Math.random();
							return;
						}
						else if (operate == 'sendmail' && data.result == 1)
						{
							data.result = "该Email已经被占用。";
						}
						else if (data.result == 2)
						{
							data.result = "未登陆。";
						}
						
						if(field=='bindemail')
							callback(data.result, data);
						else
							callback(data.result);
					}
					else{
						alert(data.error);
					}
		},error:function(xhr){
			alert(xhr.responseText);
		}});
}

function check_forgotpwd(vcode, value, vvcode, operate, callback){
	$.ajax({url:"/forgotpwd/email/",async:true,data:{vcode:vcode, email:value, vvcode:vvcode, operate:operate, _xsrf:getCookie('_xsrf')}, dataType:'json', type:'post', success:function(data){
					
					if (data.error == 0)
					{
						if (operate == 'sendmail')
						{
							location.href = '/forgotpwd/send/?email=' + data.email + '&email_head=' + data.email_head + '&server_url=' + data.server_url + '&vvcode=' + data.vvcode + '&time=' + Math.random();
							return;
						}
						if (operate == 'sendmail_again')
						{
							callback('0');
							return;
						}
						
					}
					else if(data.error == 1)
					{
						if (operate == 'sendmail')
						{
							callback(data.msg);
						}
						if (operate == 'sendmail_again')
						{
							callback(data.msg);
						}
					}

					else{
						alert(data.error);
					}
		},error:function(xhr){
			alert(xhr.responseText);
		}});
}

p_sendweibo = false;
function send_weibo(msgid){
		if (p_sendweibo)
		{
			alert('wait');
			return;
		}
		var content = $("#tr_content_detail_" + msgid).val();
		var follow = '0';
		if ($("#tr_follow_detail_" + msgid).attr('checked') == 'checked')follow = '1';
		
		p_sendweibo = true;
		$.ajax({url:"/event/sendweibo/send/?" + Math.random(),async:false,data:{content:content, follow:follow, _xsrf:getCookie('_xsrf')},dataType:'json', type:'post', success:function(data){
			  var obj = data;
			  if(obj.error > 900 && obj.error < 904){
				old_href = location.href;
				new_href = old_href;
				alert('分享操作成功。');
				//goto_furl('/sharesuccess/?s=' + obj.error + '&w=' + weibo, new_href);
			  }
			  else if(obj.error == 1){
				alert('请先登录或注册，不然领不到奖品哦');
				var furl = location.href;
				furl = url_add_random(furl);
				goto_furl('/login/', furl);
			  }
			  else if(obj.error == 8){
				alert('您已经领取过100元使用券，去看看下面的活动吧！');
			  }
			  else if(obj.error == 11){
				var furl = location.href;
				furl = url_add_random(furl);
				goto_furl('/openapi/sina/', furl);
			  }
			  else if(obj.error == 10){
				alert('微博授权过期,请点击分享按钮重试。');
				var furl = location.href;
				furl = url_add_random(furl);
				goto_furl('/openapi/sina/', furl);
			  }
			  else if(obj.error > 200 && obj.error < 204){
				alert('微博分享失败,内容重复或发送过于频繁，\n请修改内容或稍后再试。');
			  }
			  else{
				alert(obj.error);
			  }
			   p_sendweibo = false;

		},error:function(xhr){
			alert(xhr.responseText)
			p_sendweibo = false;
		}});
}

function send_weibo_share(msgid){
		if (p_sendweibo)
		{
			alert('wait');
			return;
		}
		var content = $("#content_detail_" + msgid).val();
		var url_content = location.href;
		var pic_content = '';
		if ($("#urlcontent_detail_" + msgid))
			url_content = $("#urlcontent_detail_" + msgid).val();
		if ($("#piccontent_detail_" + msgid))
			pic_content = $("#piccontent_detail_" + msgid).val();

		var follow = '0';
		
		p_sendweibo = true;
		$.cookie('share_content', content);
		$.ajax({url:"/event/sendweibo/send/?" + Math.random(),async:false,data:{content:content, follow:follow, localhref:url_content, pic_content:pic_content, _xsrf:getCookie('_xsrf')},dataType:'json', type:'post', success:function(data){
			  var obj = data;
			  if(obj.error > 999){
				p_sendweibo = false;
				window.open(obj.ourl, '_blank', '');
			  }
			  else if(obj.error > 900 && obj.error < 904){
				old_href = location.href;
				new_href = old_href;
				alert('分享操作成功。');
				//goto_furl('/sharesuccess/?s=' + obj.error + '&w=' + weibo, new_href);
			  }
			  else if(obj.error == 1){
				alert('请先登录或注册');
				var furl = location.href;
				furl = url_add_random(furl, 'shareretry=1');
				goto_furl('/login/', furl);
			  }
			  else if(obj.error == 11){
				var furl = location.href;
				furl = url_add_random_ext(furl, 'shareretry=1');
				goto_furl('/openapi/sina/', furl);
			  }
			  else if(obj.error == 10){
				alert('微博授权过期,请点击分享按钮重试。');
				var furl = location.href;
				furl = url_add_random_ext(furl, 'shareretry=1');
				alert(furl);
				goto_furl('/openapi/sina/', furl);
			  }
			  else if(obj.error > 200 && obj.error < 204){
				alert('微博分享失败,内容重复或发送过于频繁，\n请修改内容或稍后再试。');
			  }
			  else{
				alert(obj.error);
			  }
			   p_sendweibo = false;

		},error:function(xhr){
			alert(xhr.responseText)
			p_sendweibo = false;
		}});
}

function url_add_random(turl){
	old_href_arr = turl.split('#');
	prefix = (old_href_arr[0].indexOf("?") > 0)?'&':'?';
	new_href = old_href_arr[0] + prefix + Math.random();
	for(i=1; i< old_href_arr.length; i++)
		new_href += "#" + old_href_arr[i];
	//alert(new_href);
	return new_href;
}

function url_add_random_ext(turl, ext){
	old_href_arr = turl.split('#');
	prefix = (old_href_arr[0].indexOf("?") > 0)?'&':'?';
	new_href = old_href_arr[0] + prefix + Math.random() + '&' + ext;
	for(i=1; i< old_href_arr.length; i++)
		new_href += "#" + old_href_arr[i];
	//alert(new_href);
	return new_href;
}

/*
login_sessionid('stars.ji@xapp8.com', '123456', '', '1', callbackf);

function callbackf(msg){
	alert(msg);
}
*/


/* 
* 用来遍历指定对象所有的属性名称和值 
* obj 需要遍历的对象 
* author: Jet Mah 
*/ 
function ShowObjProperty( obj ) { 
	// 用来保存所有的属性名称和值 
	var props = "" ; 
	// 开始遍历 
	for ( var p in obj ){ 
		// 方法 
		if ( typeof ( obj [ p ]) == " function " ){ 
			obj [ p ]() ; 
		} else { 
			// p 为属性名称，obj[p]为对应属性的值 
			props += p + " = " + obj [ p ] + " \t\n " ; 
		} 
	} 
	// 最后显示所有的属性 
	alert ( props ) ; 
} 


function clear_red_input(){
		var length = $('.input-nothing').length;
		for(var i=0; i < length; i++){
			$('.input-nothing').eq(i).removeClass('input-nothing');
		}
}

function DataLength(fData)
{
	var intLength = 0;
	for (var i=0;i<fData.length;i++)
	{
		if ((fData.charCodeAt(i) < 0) || (fData.charCodeAt(i) > 255))
			intLength=intLength+2;
		else
			intLength=intLength+1;
	}
	return intLength;
}

var _gaq = _gaq || [];
var _hmt = _hmt || [];

function login_form_openapi(api){
	
	if (api == 'qq')
	{
		_gaq.push(['_trackEvent', 'Register', 'Login', 'QQLogin']);
		_gaq.push(['_setAccount', 'UA-9592313-3']);
		_gaq.push(['_trackPageview', '/register/qqlogin']);

		_hmt.push(['_trackPageview', '/register/qqlogin']);
		_hmt.push(['_trackEvent', 'Register', 'Login', 'QQLogin']);

		window.setTimeout("location.href = '/openapi/" + api + "/'", 500);
	}
	else if (api == 'sina')
	{
		_gaq.push(['_trackEvent', 'Register', 'Login', 'WeiboLogin']);
		_gaq.push(['_setAccount', 'UA-9592313-3']);
		_gaq.push(['_trackPageview', '/register/weibologin']);

		_hmt.push(['_trackPageview', '/register/weibologin']);
		_hmt.push(['_trackEvent', 'Register', 'Login', 'WeiboLogin']);

		window.setTimeout("location.href = '/openapi/" + api + "/'", 500);

	}
	else if (api == 'taobao')
	{
		_gaq.push(['_trackEvent', 'Register', 'Login', 'TBLogin']);
		_gaq.push(['_setAccount', 'UA-9592313-3']);
		_gaq.push(['_trackPageview', '/register/tblogin']);

		_hmt.push(['_trackPageview', '/register/tblogin']);
		_hmt.push(['_trackEvent', 'Register', 'Login', 'TBLogin']);

		window.setTimeout("location.href = '/openapi/" + api + "/'", 500);
	}
	else if (api == 'renren')
	{
		_gaq.push(['_trackEvent', 'Register', 'Login', 'RenrenLogin']);
		_gaq.push(['_setAccount', 'UA-9592313-3']);
		_gaq.push(['_trackPageview', '/register/renrenLogin']);

		_hmt.push(['_trackPageview', '/register/renrenlogin']);
		_hmt.push(['_trackEvent', 'Register', 'Login', 'RenrenLogin']);

		window.setTimeout("location.href = '/openapi/" + api + "/'", 500);
	}
	
	else if (api == 'weixin')
	{
		_gaq.push(['_trackEvent', 'Register', 'Login', 'WeixinLogin']);
		_gaq.push(['_setAccount', 'UA-9592313-3']);
		_gaq.push(['_trackPageview', '/register/weixinLogin']);

		_hmt.push(['_trackPageview', '/register/weixinlogin']);
		_hmt.push(['_trackEvent', 'Register', 'Login', 'WeixinLogin']);

		location_href = location.href;
		window.setTimeout("location.href = '/login/?weixin_scan=1&furl=" + encodeURIComponent(location.protocol + '//' + location.host + '/list/') + "'", 500);
	}
	else{
		window.setTimeout("location.href = '/openapi/" + api + "/'", 500);
	}
}
function checkLogin(){
   var name = $('#loginwin_emailorusername').val();
   var password = $('#loginwin_password').val();
   if( name=="" && password==""){ 
	    $('.tc_login_cq .error').text('请填写用户名和密码');
   }else if(name==""){
	    $('.tc_login_cq .error').text('请填写用户名');
   }else if(password==""){
	    $('.tc_login_cq .error').text('请填写密码');
   }else{
	    $('.tc_login_cq .error').text('');
	    check_loginwin_ls('header');
   }  
   return false ;
}
$(function(){
	$('.login_center_cq .txt').keyup(function(event){
		if (event.keyCode == 13) {  
			checkLogin();  
       }  
	});
	$('.login_center_cq .loginbut').click(function(){
		checkLogin();
	});
});

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
