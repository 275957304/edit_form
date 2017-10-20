var idyC = {
	ajaxPost : function(url, data, successCallback){
		$.ajax({
			"type": "POST",
			"url": url,
			"data": data,
			"success": successCallback,
			"error": function(response){
				alert('系统繁忙，请稍后再试！');
			}
		});
	},
	dialogWarningTxt : function(txt){
		var temp = '<img style="display: block; margin: 10px auto 25px;" src="/static/images/exclamation_mark.png" />' + txt;
		return temp;
	},
	
    //分页...自动加标签
    pageListAddLabel: function(){
        var $paginationa = $('.paginationa');
        var sPaginationa = $('.paginationa').html();
        sPaginationa = sPaginationa.replace('..','<span>...</span>');
        $paginationa.html(sPaginationa);
    },

    //分页设置条数
    pageSetNum: function(fn){
		$('.c_paginationa').on('click', '.c_count p', function() {
			$('.c_paginationa').find('.c_count div').show();
			return false;
		});

		$(document).click(function(){
			$('.c_paginationa').find('.c_count div').hide();
		});

		$('.c_paginationa').on('click', '.c_count div span', function() {
			if(fn) fn($(this).attr("data-page"));
			return false;
		});
    },
	
	//去掉所有的html标记
    delHtmlTag: function(str){
    	return str.replace(/<[^>]+>/g,"");	
    },

	//判断汉字的长度	
	getTextLen: function(str){
		var iCount = 0;
		var strArray = str.split('');
		for ( var i = 0; i < strArray.length; i++) {
			if (strArray[i].charCodeAt(0) < 299) {
				iCount++;
			} else {
				iCount += 2;
			}
		}
		return iCount;
	},

	//获取url参数列表
	getUrlQuery: function(name){
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)","i"); 
		var r = window.location.search.substr(1).match(reg); 
		if (r!=null) return (r[2]); return null; 
	},
	//js生成元素
	hover_tip:function(obj,txt){
		$('body').append('<p class="c_hover_tip">'+txt+'</p>');
        $('.c_hover_tip').css({'z-index':'99999999','left':obj.offset().left+obj.outerWidth() + 8,'top':obj.offset().top + (obj.outerHeight() - 29)/2});
        obj.on('mouseleave',function(){
            $('.c_hover_tip').remove();
        });
	},

	hoverTip: function(obj, options){
		var settings = {
			text:'',
			offsetX:0,
			offsetY:0,
			dir:'right',
			width:'auto'
		};
		$.extend( settings , options );
	    obj.hover(function(){
	        $('body').append('<p class="c_hover_tip" style="width:'+settings.width+'">' + settings.text + '</p>');

	    	var iL = 0;
	    	var iT = 0;

	    	if(settings.dir == 'right'){
		        iL = $(this).offset().left + $(this).outerWidth() + 8 + settings.offsetX;
		        iT = $(this).offset().top + ($(this).outerHeight() - 29)/2 + settings.offsetY;
	    	} else if(settings.dir == 'left'){
		        iL = $(this).offset().left - $('.c_hover_tip').outerWidth() - 8 - settings.offsetX;
		        iT = $(this).offset().top + ($(this).outerHeight() - 29)/2 + settings.offsetY;
	    	};
	    	
	    	$('.c_hover_tip').css({'left':iL,'top':iT});
	    }, function(){
	        $('.c_hover_tip').remove();
	    });
	},

	//弹出层的黑色背景
	mark: function(options){
		var settings = {
			opacity: options.opacity || '0.7',
			zIndex:9999900,
			backgroundColor:'000'
		};
		$.extend(settings, options);
        var mark = {};
        var $oMark = $('<div class="c_mark"></div>');
        mark.open = function(){
            $('body').append($oMark);
            $(window).bind("resize",function(){
                $oMark.css({'height':$(window).height(),'opacity':settings.opacity,'z-index':settings.zIndex,'background-color':'#' + settings.backgroundColor});
            });
            $(window).resize();
        };
        mark.remove = function(){
            $oMark.remove();
        };
        return mark;
	},

	loading: function(options){
		var loading = {};
		var settings = {
			text:'加载中'
		};
		$.extend(settings, options);

		var $loading = $('<div class="c_loading"><img style="margin:10px auto;display:block;" src="/static/js/plug-in/load/loading_wb.gif" width="48" height="48" /><p>' + settings.text + '</p></div>');
    	var $mark = new idyC.mark(options);

        loading.open = function(){
        	$mark.open();
            $('body').append($loading);
            $(window).bind("resize",function(){
            	var iLoadH = parseInt($loading.css('height'));
            	var iLoadW = parseInt($loading.css('width'));
            	var iT = ($(window).height() - iLoadH)/2;
            	var iL = ($(window).width() - iLoadW)/2;
            	$loading.css({'left':iL,'top':iT});
            });
            $(window).resize();
        };
        
        loading.remove = function(){
        	$mark.remove();
            $loading.remove();
        };

		return loading;
	}

}
