function fallback(){
  function banBackSpace(e){     
    var ev = e || window.event;//获取event对象     
    var obj = ev.target || ev.srcElement;//获取事件源     
      
    var t = obj.type || obj.getAttribute('type');//获取事件源类型    
      
    //获取作为判断条件的事件类型  
    var vReadOnly = obj.getAttribute('readonly');  
    var vEnabled = obj.getAttribute('enabled');  
    //处理null值情况  
    vReadOnly = (vReadOnly == null) ? false : vReadOnly;  
    vEnabled = (vEnabled == null) ? true : vEnabled;  
      
     
    //当敲Backspace键时，事件源类型非密码或单行、多行文本的，则退格键失效  
    var flag2=( t != "password" && t != "text" && t != "textarea" && $('.zon_edit').length == 0)  
                ?true:false;          
      
    //判断  
    if(ev.keyCode == 8 && flag2){ 
        fallbacklayer();
        return false; 
    }

}  
  
//禁止后退键 作用于Firefox、Opera  
document.onkeypress=banBackSpace;  
//禁止后退键  作用于IE、Chrome  
document.onkeydown=banBackSpace;


  // var inputblur = false;
  // $(document).keydown(function(event){
  //     var elem = event.relatedTarget || event.srcElement || event.target ||event.currentTarget;
  //     if(event.keyCode==8){

  //         if($('.zon_edit').length == 0 || inputblur==true ) {
  //           fallbacklayer();
  //           event.preventDefault();
  //           var elem = event.srcElement || event.currentTarget;   
  //           var name = elem.nodeName;
  //           if(name!='INPUT' && name!='TEXTAREA'){  
  //               return _stopIt(event);
  //           }
  //           var type_e = elem.type.toUpperCase();
  //           if(name=='INPUT' && (type_e!='TEXT' && type_e!='TEXTAREA' && type_e!='PASSWORD' && type_e!='FILE')){
  //               return _stopIt(event);  
  //           }
  //           if(name=='INPUT' && (elem.readOnly==true || elem.disabled ==true)){  
  //               return _stopIt(event);  
  //           }

  //         }
  //     }
  // });
  // function _stopIt(e){ 
  //   if(e.returnValue){  
  //       e.returnValue = false ;  
  //   }  
  //   if(e.preventDefault ){  
  //       e.preventDefault();  
  //   }      
  //   return false;  
  // }
  function fallbacklayer(){
     $('.fallback_layer').remove();
     var str = '<div class="fallback_layer"><div class="fallback" style="width:360px;"><h3>离开确认 </h3><i id="fallback_close"></i><p>确定离开此页吗？</p><div class="btn"><a href="/list/" class="sure_btn" style="background-color: #ccc;">确定</a><a id="fallback_closeT"  style="background-color: #53a4f4;">取消</a></div></div></div>';
    $('body').append(str);
    
    $('#fallback_close,#fallback_closeT').die().live('click',function(){
      $('.fallback_layer').remove();
    });
  }
}
function save_cq(){  
  $('.btn .save_zt,.btn .ceng').fadeIn(200); 
  setTimeout(function(){
        $('.btn .save_zt,.btn .ceng').fadeOut(200,function(){
          $('.btn .save_zt,.btn .ceng').remove();
        });
  },1500); 
}
function click_cq(){ 
  //判断点击对象  
  var _idThis=$('.right_operate').attr('oid');  
  setTimeout(function(){
    var _class=$('#question_box').attr('_class');
    var _name=$('#question_box').attr('_name');
    var _idUl=$('#question_box').attr('_id');
    var _html=$('#question_box').attr('_html');   
    if(_idUl){
      if(_html){
        $('#'+_idUl).html(_html);
      }
      //单选下拉式菜单焦点
      if($('#'+_idUl).parents('ul').hasClass('xllist')){ 
        $('#'+_idUl).parents('ul').prev('.drop_zon').find('.bj_drop').click();  
        $('#'+_idUl).click();
      }else if($('#'+_idUl).hasClass('option_Fill')){ 
        $('#'+_idUl).find('input,textarea').focus();
      }else{  
        $('#'+_idUl).click();
      } 
      /*else if($('#'+_idUl).find('#'+_idUl)){
        //$('#'+_idUl).find('#'+_idUl).click();
      }*/
    }else{
      if(_html){
        $('#question_box li[oid='+_idThis+'] div[name='+_name+']').html(_html);
      } 
      //title
      $('#question_box li[oid='+_idThis+'] div[name='+_name+']').click();
    }     
  },200);  
}
//右侧悬浮滚动
function moveTop(obj, offsetTop){
    var offTop=offsetTop ? offsetTop : $(obj).offset().top;
    var scrTop=$(window).scrollTop(); 
    var winHeight=$(window).outerHeight();
    var cliTop=offTop-scrTop;
    var xfHeight=$('.right_operate').outerHeight(); 
    var top=0,chaH=0,_topCha=0;  
    if(offTop+26>(winHeight+scrTop)){ 
        $('.jt').css({
            'top':offTop-125
        });
    }else{
        $('.jt').css({
            'top':offTop-117
        });
    }
    //悬浮窗是否显示
    if(!$('.right_operate').hasClass('show')){ 
        //题目设置展开时，右下角的锁消失
        // hideIco(".btn_ico_unlock");
        if(cliTop < (winHeight/3)){
            //document.title = '上部分' ;
            top=scrTop-123; 
            if(cliTop+50>xfHeight){ 
                $('.right_operate').css('top',offTop-123).stop(true,true).animate({
                   'right':0
                },300,function(){$('.jt').fadeIn(100);});  
            }else{
                if(top>0){ 
                   $('.right_operate').css('top',top).stop(true,true).animate({
                       'right':0
                   },300,function(){$('.jt').fadeIn(100);});   
                }else{ 
                   $('.right_operate').css('top',0).stop(true,true).animate({
                       'right':0
                   },300,function(){$('.jt').fadeIn(100);});  
                }
            }  
        }else if( cliTop>(winHeight/3) && cliTop<((winHeight/3)*2) ){
            //document.title = '中部分' ;
            chaH=winHeight-xfHeight;
            top=scrTop-123; 
            _topCha=winHeight-cliTop;
            //点击位置距离底部的距离是否大于悬浮高度
            if(_topCha>xfHeight){ 
               $('.right_operate').css('top',offTop-123).stop(true,true).animate({
                   'right':0
               },300,function(){$('.jt').fadeIn(100);});  
            }else{
                //window高度是否大于悬浮窗高度
                if(chaH>0){ 
                   $('.right_operate').css('top',top+chaH).stop(true,true).animate({
                       'right':0
                   },300,function(){$('.jt').fadeIn(100);});  
                }else{ 
                   $('.right_operate').css('top',top).stop(true,true).animate({
                       'right':0
                   },300,function(){$('.jt').fadeIn(100);});   
                } 
            } 
        }else{
            //document.title = '下部分' ;
            chaH=winHeight-xfHeight;
            top=scrTop-123; 
            _topCha=winHeight-cliTop;
            //点击位置距离底部的距离是否大于悬浮高度
            if(_topCha+50>xfHeight){ 
               $('.right_operate').css('top',offTop-123).stop(true,true).animate({
                   'right':0
               },300,function(){$('.jt').fadeIn(100);});  
            }else{
                //window高度是否大于悬浮窗高度
                if(chaH>0){ 
                   $('.right_operate').css('top',top+chaH).stop(true,true).animate({
                       'right':0
                   },300,function(){$('.jt').fadeIn(100);});  
                }else{ 
                   $('.right_operate').css('top',top).stop(true,true).animate({
                       'right':0
                   },300,function(){$('.jt').fadeIn(100);});   
                } 
            } 
        } 
        $('.right_operate').addClass('show');  
    }else{
        if(cliTop < (winHeight/3)){
            //document.title = '上部分' ;
            top=scrTop-123;
            if(cliTop+50>xfHeight){
                $('.right_operate').stop(true,true).animate({
                   'top':offTop-123
                },300,function(){$('.jt').fadeIn(100);});  
            }else{
                if(top>0){ 
                   $('.right_operate').stop(true,true).animate({
                       'top':top
                   },300,function(){$('.jt').fadeIn(100);});   
                }else{ 
                   $('.right_operate').stop(true,true).animate({
                       'top':0
                   },300,function(){$('.jt').fadeIn(100);});  
                }   
            }  
        }else if( cliTop>(winHeight/3) && cliTop<((winHeight/3)*2) ){
            //document.title = '中部分' ;
            chaH=winHeight-xfHeight;
            top=scrTop-123; 
            _topCha=winHeight-cliTop;
            //点击位置距离底部的距离是否大于悬浮高度
            if(_topCha>xfHeight){ 
               $('.right_operate').stop(true,true).animate({
                   'top':offTop-123
               },300,function(){$('.jt').fadeIn(100);});  
            }else{
                //window高度是否大于悬浮窗高度
                if(chaH>0){ 
                   $('.right_operate').stop(true,true).animate({
                       'top':top+chaH
                   },300,function(){$('.jt').fadeIn(100);});  
                }else{ 
                   $('.right_operate').stop(true,true).animate({
                       'top':top
                   },300,function(){$('.jt').fadeIn(100);});   
                } 
            } 
        }else{
            //document.title = '下部分' ;
            chaH=winHeight-xfHeight;
            top=scrTop-123; 
            var _topCha=winHeight-cliTop;
            //点击位置距离底部的距离是否大于悬浮高度
            if(_topCha+50>xfHeight){ 
               $('.right_operate').stop(true,true).animate({
                   'top':offTop-123
               },300,function(){$('.jt').fadeIn(100);});  
            }else{
                //window高度是否大于悬浮窗高度
                if(chaH>0){ 
                   $('.right_operate').stop(true,true).animate({
                       'top':top+chaH
                   },300,function(){$('.jt').fadeIn(100);});  
                }else{ 
                   $('.right_operate').stop(true,true).animate({
                       'top':top
                   },300,function(){$('.jt').fadeIn(100);});   
                } 
            } 
        }  
    }  
}
//关闭
function moveLeft(){
    $('.jt').fadeOut(100);
    $('.right_operate').stop(true,true).animate({
        'right':'350px'
    },350,function(){
        $('.right_operate').css('top',0);
        $(".right_operate .setup").html('');
        $('#question_box').attr('_class','');
        $('#question_box').attr('_name','');
        $('#question_box').attr('_id','');
    }).removeClass('show'); 
}
//显示宽度判断
function changeWid(){
    var winW=$(window).outerWidth();
    var winH=$(window).outerHeight();
    if(winW>=1440){
        $('#css_url').attr('href','/static/css/edit_cq_v2.css');
    }else if(winW<1440){
        $('#css_url').attr('href','/static/css/edit_cq.css');
    }
    $('.cq_content,.rows2').css("min-height",winH-123);
}
//end
$(window).resize(function(){
    changeWid();
});
$(function(){
  $('.right_operate').delegate('.sel_cq','click',function(){
      if($('.cq_dx').hasClass('active')){  
        loadMack({off:'on',Limg:0,text:'本题题型为多选，选项布局不能改为下拉菜单',set:2800});
        $(this).parents('dl').find('.vertical').click(); 
      } 
  });
  $('.right_operate').delegate('.cq_dx','click',function(){
      if($('.sel_cq').hasClass('active')){  
        loadMack({off:'on',Limg:0,text:'本题选项布局为下拉式菜单，题型不能改为多选',set:2800});
        $(this).prev().click(); 
      } 
  });
  //js响应式
  changeWid(); 
  //统一hover样式
  var txt="",left=0,top=0,now=0; 
    function pophover_cq(e,obj){ 
      $("#pophover").remove();
      left=$(obj).parent('.setup-group').offset().left;
      top=$(obj).parent('.setup-group').offset().top;
      now=$(obj).index(); 
      if($(obj).hasClass('cq_fgx')){
        var pophover='<div id="pophover" style="display:none;position:absolute;left:-15px;top: 23px;width:85px;z-index:1000"><span style="background-color:#454545;font-size:14px; padding:5px 0px; border-radius:5px; color:#fff;opacity:0.9;display:block;text-align:center">删除分割线</span></div>';
      }else{
        var pophover='<div id="pophover" style="display:none;position:absolute;left:-15px;top: 23px;width:70px;z-index:1000"><span style="background-color:#454545;font-size:14px; padding:5px 0px; border-radius:5px; color:#fff;opacity:0.9;display:block;text-align:center">'+txt+'</span></div>';
      } 
      $('body').append(pophover);
      $("#pophover").css({"top":top+(now*30),"left":left+40});
      $("#pophover").show();
    }  
    function pophover_cq2(obj){ 
      $("#pophover").remove();
      left=$(obj).parent('.operationH').offset().left;
      top=$(obj).parent('.operationH').offset().top;
      now=$(obj).index(); 
      var pophover='<div id="pophover" style="display:none;position:absolute;left:-15px;top: 23px;width:70px;z-index:1000"><span style="background-color:#454545;font-size:14px; padding:5px 0px; border-radius:5px; color:#fff;opacity:0.9;display:block;text-align:center">'+txt+'</span></div>';
      $('body').append(pophover);
      $("#pophover").css({"top":top+25,"left":left+(now*28)-20});
      $("#pophover").show();
    }
    function pophover_cq3(obj){ 
      $("#pophover").remove();
      left=$(obj).parent('.operationV').offset().left;
      top=$(obj).parent('.operationV').offset().top;
      now=$(obj).index(); 
      var pophover='<div id="pophover" style="display:none;position:absolute;left:-15px;top: 23px;width:70px;z-index:1000"><span style="background-color:#454545;font-size:14px; padding:5px 0px; border-radius:5px; color:#fff;opacity:0.9;display:block;text-align:center">'+txt+'</span></div>';
      $('body').append(pophover);
      $("#pophover").css({"top":top+(now*27)-6,"left":left+25});
      $("#pophover").show();
    }  
    function pophover_cq4(obj){
      $("#pophover").remove();
      var pophover='<div id="pophover" style="display:none;position:absolute;left:50%;top: 45px;z-index:1000"><span style="background-color:#454545;font-size:14px;padding:5px 10px; border-radius:5px; color:#fff;opacity:0.9;display:block;text-align:center">'+txt+'</span></div>';
      $('body').append(pophover);  
      $(obj).live("mousemove",function(e){
        left=e.clientX;top=e.clientY+$(window).scrollTop();
        if($(obj).hasClass('q_title') || $(obj).parents('.module').hasClass('paging') || $(obj).parents('.module').hasClass('split_line')){
          $("#pophover").css({"left":left+10,'top':top+8});
        }else{
          $("#pophover").css({"left":left+16,'top':top+20});
        } 
      });
      $("#pophover").show();
    }
    $(".setup-group a,.rows1 ul li").live('click',function(){
      $("#pophover").remove();
    }); 
    $(".setup-group a.up_cq").live('mouseenter',function(e){
      txt="上移本题"; 
      pophover_cq(e,this); 
    });  
    $(".setup-group a.down_cq").live('mouseenter',function(e){
      txt="下移本题"; 
      pophover_cq(e,this);  
    });  
    $(".setup-group a.Bub").live('mouseenter',function(e){
      txt="复制题目"; 
      pophover_cq(e,this); 
    });  
    $(".setup-group a.Del").live('mouseenter',function(e){
      txt="删除题目"; 
      pophover_cq(e,this); 
    });   
    $(".setup-group a.DelPaging").live('mouseenter',function(e){
      txt="删除分页"; 
      pophover_cq(e,this); 
    });   
    $('.operationH .cq_add').live('mouseenter',function(e){
      $(this).show();
      txt="添加选项"; 
      pophover_cq2(this); 
    });
    $('.operationH .Bub').live('mouseenter',function(e){
      $(this).show();
      txt="批量添加"; 
      pophover_cq2(this); 
    });
    $('.operationV .cq_add').live('mouseenter',function(e){
      $(this).show();
      txt="添加选项"; 
      pophover_cq3(this); 
    });
    $('.operationV .Bub').live('mouseenter',function(e){
      $(this).show();
      txt="批量添加"; 
      pophover_cq3(this); 
    });
    $(".module .q_title").live('mouseenter',function(e){ 
      txt="按住拖动题目排序"; 
      pophover_cq4(this); 
    });
    $(".cq_lj_ts").live('mouseenter',function(e){ 
      $("#pophover").remove();
      txt="逻辑设置"; 
      left=$(this).offset().left;
      top=$(this).offset().top;
      now=$(this).index(); 
      var pophover='<div id="pophover" style="display:none;position:absolute;left:-15px;top: 23px;width:70px;z-index:1000"><span style="background-color:#454545;font-size:14px; padding:5px 0px; border-radius:5px; color:#fff;opacity:0.9;display:block;text-align:center">'+txt+'</span></div>';
      $('body').append(pophover);
      $("#pophover").css({"top":top-5,"left":left+42});
      $("#pophover").show(); 
    });
    $(".cq_qt_ts").live('mouseenter',function(e){ 
      $("#pophover").remove();
      txt="配额设置"; 
      left=$(this).offset().left;
      top=$(this).offset().top;
      now=$(this).index(); 
      var pophover='<div id="pophover" style="display:none;position:absolute;left:-15px;top: 23px;width:70px;z-index:1000"><span style="background-color:#454545;font-size:14px; padding:5px 0px; border-radius:5px; color:#fff;opacity:0.9;display:block;text-align:center">'+txt+'</span></div>';
      $('body').append(pophover);
      $("#pophover").css({"top":top-5,"left":left+42});
      $("#pophover").show(); 
    });
    $(".Lock_ico").live('mouseenter',function(e){
      $("#pophover").remove();
      $(this).attr('title',''); 
      txt="本题仅表单制作者可见,对普通填写者不显示";  
      var pophover='<div id="pophover" style="display:none;position:absolute;left:50%;top: 45px;z-index:1000"><span style="background-color:#454545;font-size:14px;padding:5px 10px; border-radius:5px; color:#fff;opacity:0.9;display:block;text-align:left; width:270px;">'+txt+'</span></div>';
      $('body').append(pophover);  
      $(this).live("mousemove",function(e){
        left=e.clientX;top=e.clientY+$(window).scrollTop();
        if($(window).outerWidth()<$(this).offset().left+270){
          $("#pophover").css({"left":left-270,'top':top+15});
        }else{
          $("#pophover").css({"left":left+15,'top':top+15});
        } 
      });
      $("#pophover").show();
    }); 
    $(".cq_ts_wh").live('mouseenter',function(e){
      $("#pophover").remove();
      $(this).attr('title','');
      txt="唯一性检查，填写内容不能与已提交的内容重复"; 
      var pophover='<div id="pophover" style="display:none;position:absolute;left:50%;top: 45px;z-index:1000"><span style="background-color:#454545;font-size:14px;padding:5px 10px; border-radius:5px; color:#fff;opacity:0.9;display:block;text-align:left; width:296px;">'+txt+'</span></div>';
      $('body').append(pophover);  
      $(this).live("mousemove",function(e){
        left=e.clientX;top=e.clientY+$(window).scrollTop();
        if($(window).outerWidth()<$(this).offset().left+320){
          $("#pophover").css({"left":left-320,'top':top+15});
        }else{
          $("#pophover").css({"left":left+15,'top':top+15});
        }
      });
      $("#pophover").show();
    }); 
    $("#question_box .paging .topic_type_con,.split_line .topic_type_con").live('mouseenter',function(e){ 
      txt="按住拖动排序"; 
      pophover_cq4(this); 
    }); 
    /*$(".uploader").live('mouseenter',function(e){ 
      txt="添加图片";  
      pophover_cq4(this); 
    }); */ 
    $('.setup-group a,.module .q_title,.cq_lj_ts,.cq_qt_ts,.operationH a,.Lock_ico,.cq_ts_wh,.operationV a,.paging .topic_type_con,.split_line .topic_type_con').live('mouseleave',function(){
        $("#pophover").remove();
    }); 
    //focus
    $('.cq_content .right_operate input[type="text"]').live('focus',function(){  
      $(this).css('border','1px solid #53a4f4');
    });
    $('.right_operate input[type="text"]').live('blur',function(){ 
      $(this).css('border','1px solid #e2e2e2'); 
    }); 
    //click 
    $('.T_edit_td,.T_edit,.T_edit_min').live('click',function(e){
        //$('.btn .ceng,.save_zt').remove(); 
        $('#question_box').attr('_html','');
        $('.jt').hide();
        var _class=$(this).attr('class');
        var _name=$(this).attr('name');
        var _id; 
        if( $(this).parent().hasClass('option_Fill')){
          _id=$(this).parents('.option_Fill').attr('id');
        }else{
          _id = $(this).attr('id');
        } 
        $(this).parents('#question_box').attr('_class',_class);
        $(this).parents('#question_box').attr('_name',_name); 
        if(_id){
            $(this).parents('#question_box').attr('_id',_id);
        }else{
            $(this).parents('#question_box').attr('_id',''); 
        } 
        $('.right_operate').show(); 
        var _index=$(this).parents('.module').index();
        if($(this).hasClass('p_title') || $(this).hasClass('p_end_desc') ||$(this).hasClass('p_begin_desc') ){
            moveLeft();  
        }else{
            //点击题目右侧悬浮跳动 
            var _this= this ;
            var offetTop = $(_this).offset().top;
            setTimeout(function(){
                if($('.right_operate dl.way dd').length>0){
                    $('.right_operate dl.way').show();
                }  
                if($('.way dd .column').hasClass('active')){
                  $('#disp_type_column').show();
                }
                if(!initRightOperate()) {
                    moveTop(_this, offetTop);
                }  
            },300); 
        } 
        e.stopPropagation(); 
    }); 　 
    //冒泡
    $(document).click(function(){
        moveLeft();    
        $('.operationH .Bub,.operationV .Bub,.BubR').attr('title','');
    });    
    $(document).mouseup(function(){
      $('.pophover').remove();
    });
    //阻止冒泡 
    $('.jsbox,.jsBubble_s,.jsboxContent,#maptss,#lightBox,.bj_drop').live('click',function(e){
        e.stopPropagation();
    });
    $('.add_edit').live('focus',function(){inputblur=false;});
    $('.right_operate').click(function(e){
        inputblur=true;
        e.stopPropagation();
    });
    $('.jsbox_close').live('click',function(e){
      $('.btn .ceng,.save_zt').remove(); 
      click_cq();
      e.stopPropagation();
    });
    //动态更新位置
    $('.right_operate').delegate('ul li','click',function(){ 
        setTimeout(function(){ 
            var hei_xf = $('.right_operate').outerHeight();
            var top_xf = $('.right_operate').offset().top;
            var hei_do = $(document).height();
            if((top_xf+hei_xf)>hei_do){
                $('.right_operate').animate({
                    'top':hei_do-hei_xf-132
                },300);
            }
        },100);
    });
    //save
    $('.right_operate').on('click', '.btn a.save', function(){
        if ($(".right_operate .cq_dx").hasClass('active_initial') && !$(".right_operate .cq_dx").hasClass('active') && project.version>1){
            var ajax_c = $.ajax({
              url: '/report/ajax/get_question_version/',
              type: 'POST',
              dataType: 'json',
              data: {pid: project._id.$oid,qid:$('.right_operate').attr('oid'),_xsrf:getCookie('_xsrf')},
              success:function(ret){
                  if (ret.status == 200){
                      if (ret.q_version != project.version){
                          jsConfirm({
                              title: '题型变更确认',
                              obj: save_fn,
                              content: '多选题变更为单选题，<span style="color:#ef6262;">会导致题目数据丢失</span>！',
                              conw: 400
                          });
                      }else{
                          save_fn();
                      }
                  }else{
                      save_fn();
                  }
              },
            });
        }else{
          save_fn();
        }
    });
    //save_fn
    function save_fn(){
    　 if($('.btn .save_zt').length==0){ 
          $('.btn').append('<p class="save_zt">已保存</p><p class="ceng">保存</p>');
        }
        $('.SavePrompt').hide();
        if (validation()){  
            save_form(); 
            $('.SavePrompt').hide();
        }else{
          return false;
        }     
        click_cq();
    }
    //close
    $('.right_operate .close').click(function(){
        moveLeft();
        $('.SavePrompt').hide();
        $('.zon_edit').remove(); 
    });　  
    $('.module').live('mouseup',function(){
      $('.pophover').remove();
    });
    $('.module').live('mouseenter',function(){
      $('.pophover').remove();
    });
    $('body').delegate('.add_edit','keyup',function(){
      var _html = $(this).html();
      $('#question_box').attr('_html',_html);
    });
    //结束语默认居中
    if($('#end_desc').length > 0){
      var endDescStr = $('#end_desc').html().replaceAll('\n','');
      var tempSurveyStr = '您已完成本次问卷，感谢您的帮助与支持';
      var tempFormStr = '表单已成功提交，谢谢您的参与';
      if(endDescStr === tempSurveyStr || endDescStr === tempFormStr){
        var str = '<p style="text-align:center;">'+endDescStr+'</p>';
        $('#end_desc').html(str);
        $('#question_box').attr('_html',str);
        $('#end_desc.T_edit').trigger('click');
        $('body').trigger('click');
      }
    }

  //应用购买入口
  //抽奖
  $('.rk_btn').on('click', '.luck_draw', function(){
    _hmt.push(['_trackEvent', 'pluginShow', 'click', 'lucky_draw_pluginShow']);
    var pid = $(this).attr('pid');
    $.ajax({
            url : '/enterprise/check_member_permission/?permission_type=plugin&project_id='+pid,
            type : 'GET',
            dataType : 'json',
            success : function(ret){
                if(ret.status == 200){
                    if(ret.code == 1){
                      luckyDrawPlugin = new pluginCenterIframe.init({"type":"lucky_draw","string":"luckyDrawPlugin","project_id": project._id.$oid});
                    }else if(ret.code == 2){ 
                      loadMack({ off: 'on', Limg: 1, text:'您没有权限使用，请联系项目所有者', set: 1000 });
                    }
                }else{
                    check_permission = false;
                    loadMack({ off: 'on', Limg: 1, text:'请稍后再试', set: 1000 });
                }
            }
        });
    // PluginApp_buy_info("lucky_draw");
  });
  //微信红包
  $('.rk_btn').on('click', '.wechat_red', function(){
    _hmt.push(['_trackEvent', 'pluginShow', 'click', 'wx_signin_pluginShow']);
    var pid = $(this).attr('pid');
    $.ajax({
            url : '/enterprise/check_member_permission/?permission_type=plugin&project_id='+pid,
            type : 'GET',
            dataType : 'json',
            success : function(ret){
                if(ret.status == 200){
                    if(ret.code == 1){
                      envelopePlugin = new pluginCenterIframe.init({"type":"envelope","string":"envelopePlugin","project_id": project._id.$oid});
                    }else if(ret.code == 2){ 
                      loadMack({ off: 'on', Limg: 1, text:'您没有权限使用，请联系项目所有者', set: 1000 });
                    }
                }else{
                    check_permission = false;
                    loadMack({ off: 'on', Limg: 1, text:'请稍后再试', set: 1000 });
                }
            }
        });
    // PluginApp_buy_info("envelope");
  });
  //隐藏logo
  $('.rk_btn').on('click', '.hide_logo', function(){
    _hmt.push(['_trackEvent', 'pluginShow', 'click', 'hide_logo_pluginShow']);
    hideLogoPlugin = new pluginCenterIframe.init({"type":"hide_logo","string":"hideLogoPlugin","project_id": project._id.$oid});
  });

  $(window).scroll(function() {
    showGoTop();
  });
  $("body").on({
    "mouseover": function(){
      $(this).siblings("span").stop(true).fadeIn();
    },"mouseout": function(){
      $(this).siblings("span").stop(true).fadeOut();
    }
  }, ".btn_ico i");

  $("body").on("click", ".btn_go_top", function(){
    $(this).find("span").stop(true).hide();
    $("html,body").animate({scrollTop:0},200);
    hideIco(".btn_go_top");
  });

  $("body").append('<div class="fixed_right"><a class="btn_ico btn_go_top"><i></i><span>返回顶部</span></a></div>');
  // 编辑问卷上传题添加提示
  $(".upFile .upBut").live("mouseenter", function(){
    idyC.hover_tip($(this), "发布后，答题者可以上传附件");
  });
});

function showUnlockBtn(isHasUnlockQ, unlockQTypenum){
  //判断是否含有未解锁题型
  var isHasUnlockQ = isHasUnlockQ;
  if(isHasUnlockQ){
    //解锁题型的个数
    var unlockQnum = 1;
    if (unlockQTypenum) {
      unlockQnum = unlockQTypenum;
    }
    var $btnUnlock = $(".btn_ico_unlock");
    $btnUnlock.append('<em>'+ unlockQnum +'</em>')
    showIco(".btn_ico_unlock");
    $btnUnlock.click(function(){
      $(this).find("span").stop(true).fadeOut();
      maptss("解锁题型",'/edit/ajax/unlock_qtype/'+project._id.$oid+'/?qid=all&ts=' + (new Date()).getTime(),'740');
      _hmt.push(['_trackEvent', 'edit', 'click', 'unlock_question_btn']);
      return false;
    });
  }else{
    hideIco(".btn_ico_unlock");
  }
}

function showGoTop(){
  if(parseInt($(window).scrollTop()) > 400){
    showIco(".btn_go_top");
  }else{
    hideIco(".btn_go_top");
  }
}

function showIco(obj){
  $(obj).stop(true).animate({"height": "44px"}, 300, function(){ $(this).stop(true).animate({"right": "0px"}, 300); });
}

function hideIco(obj){
  $(obj).stop(true).animate({"right": "-54px"}, 300, function(){ $(this).stop(true).animate({"height": "0px"}, 300); });
}

function unlockCostQ(obj){
    maptss("解锁题型",'/edit/ajax/unlock_qtype/'+project._id.$oid+'/?qid=' + $(obj).attr('qid') + '&ts=' + (new Date()).getTime(),'740');
    // 统计埋点
    var disp_type = $(obj).attr('disp-type');
    if(disp_type){
        _hmt.push(['_trackEvent', 'edit', 'click', 'unlock_publish_' + disp_type]);
    }
    return false;
}


//题型相关
//打分题
function pt_score_star(qid){
  var question_obj = $(".question[oid="+qid+"]:last");
  var score_display = question_obj.attr("score_display");
  var score_title = question_obj.find(".score_title");
  var minnum = question_obj.attr("minnum");
  var maxnum = question_obj.attr("maxnum");
  var option_num = parseInt(maxnum) - parseInt(minnum)+1;
  if (score_display == "op_slider"){
      question_obj.find(".s_tag_m").css("width", 50/(option_num-1)+"%");
      question_obj.find(".s_tag_c").css("width", 100/(option_num-1)+"%");
      score_title.css("margin-left", "20px");
      return false;
  }
  var grade_text_width = question_obj.find(".grade_text_v2:first").width();
  var icon_width = question_obj.find(".div_float:first .score_i").width();
  var margin_width = grade_text_width/option_num-icon_width;
  var score_title_width = grade_text_width - margin_width;
  score_title.css({
    "width": score_title_width,
    "margin-left": 20+margin_width/2
  });
}