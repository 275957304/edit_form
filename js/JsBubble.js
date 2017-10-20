function JsBubble(){
				this.Tinfo = {};
		  }
		  JsBubble.prototype ={
			  
			     show:function(Obj){

					 var Dx = Obj.obj || $('body');
					 //Dx.css({'position':'relative'});
					 
					 switch(Obj.type || "top"){
						 case "top":
							 var MaT = parseInt(Dx.css('paddingTop'));
							 var MaB = parseInt(Dx.css('paddingBottom'));
							 var Hc =  Dx.height();
							 var Tops = Dx.offset().top+MaT+MaB+Hc+12;
							 var Lefts = Dx.offset().left;
							 var types = "T";
						 break;
						 case "left":
							 var Wc =  Dx.width();
							 var Tops = Dx.offset().top;
							 var Lefts = Dx.offset().left+Wc+10;
							 var types = "L";
						 break;
						 case "bottom":
							 var Tops = Dx.offset().top-10;
							 var Lefts = Dx.offset().left;
						     var types = "B";  
						 break;
						 case "right":
							 var Tops = Dx.offset().top;
							 var Lefts = Dx.offset().left-10;
							 var types = "R";
						 break;
					 }
					 
					 this.Tinfo = {
					 	 id:Obj.id || parseInt(100*Math.random()), //随机ID
						 obj:Dx,
						 title:Obj.title || "无标题！", //内容
						 data:Obj.data || "", //内容
						 jsonData:Obj.jsonData ||false,//json数据输入
						 type:types, //类型
						 url:Obj.url||false,//数据地址
						 loads:Obj.loads||false,//加载方式
						 fun:Obj.fun||false,
						 width:Obj.width || "auto",//宽度
						 isArrow:Obj.isArrow || '',
						 Close:Obj.Close || false, //删除按钮
						 BoColor:Obj.BoColor || "#FEBE8F",   //边框颜色
						 BaColor:Obj.BaColor || "#EFEFEF",  //箭头背景颜色
						 CBaColor:Obj.CBaColor || "#fff",  //内容背景颜色
						 TBaColor:Obj.TBaColor || "#EFEFEF", //标题背景颜色
						 TBoColor:Obj.TBoColor || "#EFEFEF", //标题背景颜色
						 top:Tops + (Obj.pytop || 0), //Y坐标
						 left:Lefts + (Obj.pyleft || 0), //X坐标
						 zIndex:Obj.zIndex || 9900,  //z-index
						 isBindBodyEvent:Obj.isBindBodyEvent || false  //body是否绑定关闭弹窗的事件,添加这个属性主要是为了编辑问卷时，点击右侧逻辑设置（BubR），如果里面还有弹窗的话，点击弹窗会同时关闭右侧逻辑设置的弹窗，为了避免这种情况就要移除body的mouseup事件
				     };
					 
					 //alert(Tinfo.top+"<< >>"+Tinfo.left);
					 this.addCon(this.Tinfo); 
				 },
				 addCon:function(Tinfo){
					 
					 
					 switch(Tinfo.type){
						 
						 case "T":
							 var styleT = "border-color:transparent transparent "+Tinfo.BaColor;
							 var styleB = "border-color:transparent transparent "+Tinfo.BoColor;
						 break;
						 case "L":
							 var styleT = "border-color:transparent "+Tinfo.BaColor+" transparent transparent ";
							 var styleB = "border-color:transparent "+Tinfo.BoColor+" transparent transparent ";  
						 break;
						 case "B":
						     var styleT = "border-color:"+Tinfo.BaColor+" transparent transparent transparent";
							 var styleB = "border-color:"+Tinfo.BoColor+" transparent transparent transparent";  
						 break;
						 case "R":
						     var styleT = "border-color:transparent transparent transparent "+Tinfo.BaColor;
							 var styleB = "border-color:transparent transparent transparent "+Tinfo.BoColor;
						 break;
					 }
                     


					 var Close ={};
					 var Cpar = 0;
					 var $title='';
					 
					 if(Tinfo.Close){
					     $Close = $('<a href="javascript:;" class="jsTip_close"></a>');
						 Cpar = 0;
						 $title='<div class="tipTitle" style="background:'+Tinfo.TBaColor+';border-bottom:1px solid '+Tinfo.TBoColor+';">'+Tinfo.title+'</div>';
					 }
					 
					 var $con = $('<div id="'+this.Tinfo.id+'" class="jsBubble_s" style="width:'+Tinfo.width+';left:'+Tinfo.left+'px; top:'+Tinfo.top+'px;z-index:'+Tinfo.zIndex+'">'+
								   '<div class="arrow'+Tinfo.type+'"><div class="arrowt" style="'+styleT+'"></div><div class="arrowb" style="'+styleB+'"></div></div>'+
								   '<div class="tipCon" style="background:'+Tinfo.CBaColor+'; border-color:'+Tinfo.BoColor+'; padding-right:'+Cpar+'px;">'+           
								        $title+
										'<div class="tipCon_t">'+Tinfo.data+'</div>'+
								   '</div>'+
								   //Close+
							 '</div>');
					 
					 //Tinfo.obj.append($con);//输出内容
					 $('.jsBubble_s').remove();
					 $('body').append($con);//输出内容

					 if(Tinfo.isArrow){$('.jsBubble_s[id="'+this.Tinfo.id+'"] .arrowT').hide();}
					 
					 setTimeout(function(){
						 $con.css({'top':(Tinfo.top+1)+'px'});
					 },1);
                     
					 
					 //异步加载
					 var loading = $('<div class="loading"></div>');
				     if(Tinfo.url != false && Tinfo.loads != false){
						//if(options_.url_css!=false){$('head').append(urlcss)}
						$('.tipCon_t',$con).append(loading);
						
						//$('.jsboxContent',options).append(loading);
						$('.tipCon_t',$con).load(Tinfo.url,function(){
						    loading.hide();											 
						    if(Tinfo.fun != false){
								Tinfo.fun;
								$('.loaddiv').css({"background":"none"});
						    }															   
						});
				     }
                     
                    //ajax/json
				    if(Tinfo.url != false && Tinfo.ajax != false && Tinfo.fun != false){
                        $('.tipCon_t',$con).append(loading);
						$.ajax({
						    url:Tinfo.url,
						    type:'GET',
						    dataType:'json',
						    error:function(){}, 
						    success:function(data){
						    	loading.hide();	
							    Tinfo.fun(data,$con);
							    $('.loaddiv').css({"background":"none"});
							}
			            });

				    }
                    
                    if(Tinfo.jsonData != false && Tinfo.fun != false){
						Tinfo.fun(Tinfo.jsonData,$con);
				    }
					 					 
					 //删除事件
					 if(Tinfo.Close){
						 
                         $con.find('.tipTitle').append($Close);
						 
						 var _this = this;
						 $Close.bind('click',function(){
							 $con.remove();
						 });
						 
					 }
					 
					 //点击空白关闭
					 $con.bind('mouseup',function(){
						  return false;
					 });
					 if(!Tinfo.isBindBodyEvent){
						$('body').bind('mouseup',function(){
						     $con.remove();
						 });
					 }
					 
					 //高度处理
					 if(Tinfo.type == "B"){
						var h = Tinfo.top - $("#"+this.Tinfo.id).height();
					    $("#"+this.Tinfo.id).css({top:h+"px"});
					 }
					 //宽度处理
					 if(Tinfo.type == "R"){
						var w = Tinfo.left - $("#"+this.Tinfo.id).width();
					    $("#"+this.Tinfo.id).css({left:w+"px"});
					 }
					 
					 		 
				 },
				 autoTop:function(){
                    var _this = this;
					$('#'+this.Tinfo.id).css({'top':(_this.Tinfo.obj.offset().top+_this.Tinfo.obj.height()+2)+'px'});
				 }
				 
		  }