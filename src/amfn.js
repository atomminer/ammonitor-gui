// let color1 = "rgb(20,60,200)";
// let color2 = "rgba(20,60,200,0.67423)";
// let color3 = "#67DAF0";
// let color4 = "#5567DAF0";
// let color5 = "#F3A";
// let color6 = "#F3A9";
// let color7 = "rgb(200,60,20)";
// let color8 = "rgba(200,60,20,0.98631)";

// /*** Log Blending ***/
// // Shade (Lighten or Darken)
// colorOp ( 0.42, color1 ); // rgb(20,60,200) + [42% Lighter] => rgb(166,171,225)
// colorOp ( -0.4, color5 ); // #F3A + [40% Darker] => #c62884
// colorOp ( 0.42, color8 ); // rgba(200,60,20,0.98631) + [42% Lighter] => rgba(225,171,166,0.98631)

// // Shade with Conversion (use "c" as your "to" color)
// colorOp ( 0.42, color2, "c" ); // rgba(20,60,200,0.67423) + [42% Lighter] + [Convert] => #a6abe1ac

// // RGB2Hex & Hex2RGB Conversion Only (set percentage to zero)
// colorOp ( 0, color6, "c" ); // #F3A9 + [Convert] => rgba(255,51,170,0.6)

// // Blending
// colorOp ( -0.5, color2, color8 ); // rgba(20,60,200,0.67423) + rgba(200,60,20,0.98631) + [50% Blend] => rgba(142,60,142,0.83)
// colorOp ( 0.7, color2, color7 ); // rgba(20,60,200,0.67423) + rgb(200,60,20) + [70% Blend] => rgba(168,60,111,0.67423)
// colorOp ( 0.25, color3, color7 ); // #67DAF0 + rgb(200,60,20) + [25% Blend] => rgb(134,191,208)
// colorOp ( 0.75, color7, color3 ); // rgb(200,60,20) + #67DAF0 + [75% Blend] => #86bfd0

// /*** Linear Blending ***/
// // Shade (Lighten or Darken)
// colorOp ( 0.42, color1, false, true ); // rgb(20,60,200) + [42% Lighter] => rgb(119,142,223)
// colorOp ( -0.4, color5, false, true ); // #F3A + [40% Darker] => #991f66
// colorOp ( 0.42, color8, false, true ); // rgba(200,60,20,0.98631) + [42% Lighter] => rgba(223,142,119,0.98631)

// // Shade with Conversion (use "c" as your "to" color)
// colorOp ( 0.42, color2, "c", true ); // rgba(20,60,200,0.67423) + [42% Lighter] + [Convert] => #778edfac

// // RGB2Hex & Hex2RGB Conversion Only (set percentage to zero)
// colorOp ( 0, color6, "c", true ); // #F3A9 + [Convert] => rgba(255,51,170,0.6)

// // Blending
// colorOp ( -0.5, color2, color8, true ); // rgba(20,60,200,0.67423) + rgba(200,60,20,0.98631) + [50% Blend] => rgba(110,60,110,0.83)
// colorOp ( 0.7, color2, color7, true ); // rgba(20,60,200,0.67423) + rgb(200,60,20) + [70% Blend] => rgba(146,60,74,0.67423)
// colorOp ( 0.25, color3, color7, true ); // #67DAF0 + rgb(200,60,20) + [25% Blend] => rgb(127,179,185)
// colorOp ( 0.75, color7, color3, true ); // rgb(200,60,20) + #67DAF0 + [75% Blend] => #7fb3b9

// /*** Other Stuff ***/
// // Error Checking
// colorOp ( 0.42, "#FFBAA" ); // #FFBAA + [42% Lighter] => null  (Invalid Input Color)
// colorOp ( 42, color1, color5 ); // rgb(20,60,200) + #F3A + [4200% Blend] => null  (Invalid Percentage Range)
// colorOp ( 0.42, {} ); // [object Object] + [42% Lighter] => null  (Strings Only for Color)
// colorOp ( "42", color1 ); // rgb(20,60,200) + ["42"] => null  (Numbers Only for Percentage)
// colorOp ( 0.42, "salt" ); // salt + [42% Lighter] => null  (A Little Salt is No Good...)

// // Error Check Fails (Some Errors are not Caught)
// colorOp ( 0.42, "#salt" ); // #salt + [42% Lighter] => #a5a5a500  (...and a Pound of Salt is Jibberish)

// // Ripping
// colorOp ( color4 ); // #5567DAF0 + [Rip] => [object Object] => {'r':85,'g':103,'b':218,'a':0.941}

var amfn = {
	formatHashrate(i, precision=1) {
		var s = '';
		if(i >= 1000*1000*1000*1000*1000)
			s = (i/1000/1000/1000/1000/1000).toFixed(precision) +" P";
		else if(i >= 1000*1000*1000*1000)
			s = (i/1000/1000/1000/1000).toFixed(precision) +" T";
		else if(i >= 1000*1000*1000)
			s = (i/1000/1000/1000).toFixed(precision) +" G";
		else if(i >= 1000*1000)
			s = (i/1000/1000).toFixed(precision) +" M";
		else if(i >= 1000)
			s = (i/1000).toFixed(precision) +" k";
		else
			s = (i).toFixed(precision);

		return s;
	},
	formatAMPM(date) {
	  var hours = date.getHours();
	  var minutes = date.getMinutes();
	  var ampm = hours >= 12 ? 'pm' : 'am';
	  hours = hours % 12;
	  hours = hours ? hours : 12; // the hour '0' should be '12'
	  minutes = minutes < 10 ? '0'+minutes : minutes;
	  var strTime = hours + ':' + minutes + ' ' + ampm;
	  return strTime;
	},
	colorOp(p,c0,c1,l) {
		let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=typeof(c1)=="string";
		if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
		if(!this.pcolorOp)this.pcolorOp=(d)=>{
			let n=d.length,x={};
			if(n>9){
				[r,g,b,a]=d=d.split(","),n=d.length;
				if(n<3||n>4)return null;
				x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
			}else{
				if(n==8||n==6||n<4)return null;
				if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
				d=i(d.slice(1),16);
				if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=m((d&255)/0.255)/1000;
				else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
			}return x};
		h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=this.pcolorOp(c0),P=p<0,t=c1&&c1!="c"?this.pcolorOp(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
		if(!f||!t)return null;
		if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
		else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
		a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
		if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
		else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
	},
	hexToRGB(a,e){
		var n=parseInt(a.slice(1,3),16),o=parseInt(a.slice(3,5),16),s=parseInt(a.slice(5,7),16);return e?"rgba("+n+", "+o+", "+s+", "+e+")":"rgb("+n+", "+o+", "+s+")"
	},
	yesno(v){
		return v ? "Yes" : "No";
	},
	formatTimespanFromSeconds(t) {
      var d = parseInt(t/86400); 
      return ((d > 0) ? (d +'d ') : '') +(new Date(t%86400*1000)).toUTCString().replace(/.*(\d{2}):(\d{2}):(\d{2}).*/, "$1:$2:$3");
    },
    tempToF(celsius) {
		return celsius * 9 / 5 + 32;
    },
}

export default amfn