;(function($) {
		$.fn.extend({   
			  "Tjj":function(ldDiv,Obj){
	
				  $(ldDiv).live("mouseover",function(){
					 $(".tccTx").hide();
					 xsimg = false;
					 var tis = $(this);
					 var id = tis.attr("id");
					 var objTop = 0;
					 if(Obj){
                       objTop = Obj.Top;
					 }
					 var top= tis.offset().top-30-objTop;
					 var left= tis.offset().left;
					 var thiss =$(this);
					 //(top<=0)?top=top-90:top;
					 //(left>=620)?left=620:left;
					 //(left<=0)?left=0:left;
					
					var uid = $(this).attr("id");
					var texts = $(this).attr("name");
					if(texts==undefined){
						texts = $(this).attr("title");
					}
					var widthType = true;

					if(Obj){
                       widthType = Obj.widthType;
					}
					addimg(top,left,texts,$(this).width(),false,widthType);
					
					});
					$(ldDiv).live("mouseout",function(){
						xsimg = true;
						var ks = setTimeout("imggb()",100);
					});
					
					$(ldDiv).live("mouseover",function(){
						xsimg = false;
					});
					
					$(ldDiv).live("mouseout",function(){
						xsimg = true;
						var ks = setTimeout("imggb()",100);
					});	
					$(ldDiv).live("mousedown",function(){	
						xsimg = true;
						var ks = setTimeout("imggb()",100);
					});
					 
			  }
		 });
})(jQuery);
function addimg(top,left,texts,this_w,max_w,widthType){

	if(!max_w){max_w=80};
	var imgcom = $('.Tjj');
	//alert(imgcom.length)
	var tw = texts.length*14;
	if(widthType){(tw>max_w)?tw=max_w:tw=50;}
	
	var tw2 = tw/2;
	(tw2<19)?19:tw2;
	if(imgcom.length==0){
		var tcon =$('<div class="Tjj" style="width:'+tw+'px;">'+
						 '<span>'+texts+'</span>'+
						 '<div class="tj"></div>'+
					'</div>');
		 
		 $("body").append(tcon);
		 var obj_h = tcon.height()-15;
		 
		 $('.Tjj').css({"top":top-obj_h+"px","left":(left-tw2+this_w/2-5)+"px"});
		 $('.tj').css({"top":obj_h+24+"px","left":tw2+"px"});
	}else{

		 imgcom.find("span").text(texts);
		 var imgcom = $('.Tjj');
		 imgcom.css({"width":tw+"px","left":(left-tw2+this_w/2-5)+"px"});
		 
		 var obj_h = imgcom.height()-15;
		 imgcom.css({"top":top-obj_h+"px"});
		 imgcom.find('.tj').css({"top":obj_h+24+"px","left":tw2+"px"});
		 imgcom.show();
	}
	}
	function imggb(){
	if(xsimg){
	$(".Tjj").hide();
	}
}