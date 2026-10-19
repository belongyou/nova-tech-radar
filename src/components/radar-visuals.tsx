import {useId} from "react";
import type {NewsCategory} from "../lib/seed-news";

const D=Math.PI/180;
function project(lat:number,lon:number){
 const a=lat*D,b=(lon-70)*D,t=18*D,r=178;
 const x=Math.cos(a)*Math.sin(b),y=Math.sin(a),z=Math.cos(a)*Math.cos(b);
 return {x:Number((350+r*x).toFixed(3)),y:Number((256-r*(y*Math.cos(t)-z*Math.sin(t))).toFixed(3)),z:Number((y*Math.sin(t)+z*Math.cos(t)).toFixed(3))};
}
const land=[
 [[-18,36],[3,37],[15,33],[34,31],[44,12],[50,10],[42,-10],[34,-26],[18,-35],[11,-21],[-1,-5],[-16,15]],
 [[-10,36],[-10,55],[7,72],[30,70],[43,56],[63,72],[100,77],[145,65],[178,62],[162,47],[141,38],[133,32],[120,22],[109,1],[96,6],[81,7],[72,22],[54,25],[40,31],[31,40],[17,42]],
 [[68,25],[89,27],[93,20],[80,7],[73,8]],[[95,21],[106,20],[110,7],[103,-4],[98,6]],
 [[112,-11],[132,-10],[143,-12],[154,-26],[146,-40],[122,-35],[113,-23]],
 [[43,-13],[50,-14],[49,-26],[45,-24]],[[129,32],[141,43],[145,45],[143,35]],
 [[-168,71],[-130,72],[-110,62],[-60,52],[-53,45],[-80,25],[-99,16],[-115,30],[-130,50]],
 [[-82,10],[-65,12],[-35,-7],[-49,-30],[-69,-56],[-77,-24]],
];
function inPoly(lon:number,lat:number,p:number[][]){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const [x,y]=p[i],[xx,yy]=p[j];if((y>lat)!==(yy>lat)&&lon<(xx-x)*(lat-y)/(yy-y)+x)inside=!inside}return inside}
const dots:{x:number;y:number;z:number}[]=[];
for(let lat=-62;lat<79;lat+=2.5)for(let lon=-180;lon<180;lon+=3)if(land.some(p=>inPoly(lon,lat,p))){const q=project(lat,lon);if(q.z>0)dots.push(q)}
function curve(points:{x:number;y:number;z:number}[]){let d="",pen=false;for(const p of points){if(p.z<0){pen=false;continue}d+=(pen?"L":"M")+p.x.toFixed(2)+","+p.y.toFixed(2);pen=true}return d}
const latitudes=Array.from({length:11},(_,i)=>curve(Array.from({length:181},(_,j)=>project(-75+i*15,-180+j*2))));
const longitudes=Array.from({length:24},(_,i)=>curve(Array.from({length:91},(_,j)=>project(-90+j*2,-180+i*15))));

export function RadarGlobe(){
 const id=useId().replaceAll(":","");
 return <svg className="globe-svg" viewBox="0 0 700 512" aria-hidden="true">
  <defs>
   <radialGradient id={id+"halo"}><stop offset="0" stopColor="#f4512f" stopOpacity=".18"/><stop offset=".68" stopColor="#de472c" stopOpacity=".05"/><stop offset="1" stopColor="#ff4d27" stopOpacity="0"/></radialGradient>
   <radialGradient id={id+"sphere"} cx="75%" cy="30%" r="85%"><stop stopColor="#391912"/><stop offset=".5" stopColor="#1a1110"/><stop offset="1" stopColor="#0b0d10"/></radialGradient>
   <linearGradient id={id+"edge"} x1="0" y1="1" x2="1" y2="0"><stop stopColor="#ca5133" stopOpacity=".07"/><stop offset=".5" stopColor="#e46d44" stopOpacity=".65"/><stop offset="1" stopColor="#ffad78" stopOpacity=".9"/></linearGradient>
   <linearGradient id={id+"orbit"}><stop stopColor="#f26542" stopOpacity=".03"/><stop offset=".5" stopColor="#f77b50" stopOpacity=".6"/><stop offset="1" stopColor="#e46b45" stopOpacity=".05"/></linearGradient>
   <filter id={id+"glow"}><feGaussianBlur stdDeviation="4"/></filter>
   <clipPath id={id+"clip"}><circle cx="350" cy="256" r="178"/></clipPath>
  </defs>
  <circle cx="360" cy="255" r="255" fill={"url(#"+id+"halo)"}/>
  {Array.from({length:15},(_,i)=><line key={"v"+i} x1={60+i*43} y1="43" x2={60+i*43} y2="480" stroke="#2c1b18" strokeWidth=".5" opacity=".4"/>)}
  {Array.from({length:11},(_,i)=><line key={"h"+i} x1="65" y1={42+i*42} x2="650" y2={42+i*42} stroke="#2c1b18" strokeWidth=".5" opacity=".4"/>)}
  {Array.from({length:49},(_,i)=><circle key={"star"+i} cx={75+((i*137.51)%550)} cy={42+((i*71.93)%430)} r={i%4===0?1:.5} fill="#e3a490" opacity={.1+(i%5)*.06}/>)}
  <g transform="rotate(-21 350 256)" fill="none"><ellipse cx="350" cy="256" rx="268" ry="80" stroke={"url(#"+id+"orbit)"} strokeWidth=".8"/><ellipse cx="350" cy="256" rx="245" ry="72" stroke="#c35b35" strokeOpacity=".13" strokeWidth=".5" strokeDasharray="2 7"/></g>
  <circle cx="350" cy="256" r="199" fill="none" stroke="#ca653e" strokeWidth=".5" strokeOpacity=".14" strokeDasharray="1 7"/>
  <circle cx="350" cy="256" r="183" fill="none" stroke="#ff8255" strokeWidth="6" strokeOpacity=".08" filter={"url(#"+id+"glow)"}/>
  <circle cx="350" cy="256" r="178" fill={"url(#"+id+"sphere)"} stroke={"url(#"+id+"edge)"} strokeWidth="1.2"/>
  <g clipPath={"url(#"+id+"clip)"}>
   {[...latitudes,...longitudes].map((d,i)=><path key={i} d={d} fill="none" stroke="#d46a45" strokeWidth=".55" opacity=".29"/>)}
   {dots.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={.6+p.z*.6} fill="#ee865a" opacity={.22+p.z*.55}/>)}
   <ellipse cx="350" cy="264" rx="177" ry="27" fill="none" stroke="#f68b59" strokeOpacity=".13"/>
   <path d="M205 197Q354 123 504 250" fill="none" stroke="#fd9561" strokeWidth=".75" strokeOpacity=".7" strokeDasharray="2 4"/>
   <path d="M220 280Q326 206 479 189" fill="none" stroke="#fd9561" strokeWidth=".6" strokeOpacity=".65"/>
  </g>
  <path d="M103 352Q169 395 287 350" fill="none" stroke="#e88553" strokeWidth=".7" opacity=".45"/>
  <path d="M405 200L485 169L557 169M262 341L201 369L129 369" fill="none" stroke="#c57453" strokeWidth=".7" opacity=".7"/>
  {[[405,200],[262,341],[479,189],[220,280]].map((p,i)=><g key={i}><circle cx={p[0]} cy={p[1]} r="8" fill="#ff8959" opacity=".11"/><circle cx={p[0]} cy={p[1]} r="2" fill="#ffad80"/><circle cx={p[0]} cy={p[1]} r="4.5" fill="none" stroke="#ffad80" strokeWidth=".4"/></g>)}
  <g stroke="#bc7259" strokeWidth=".6" opacity=".4"><path d="M137 121h12m-6-6v12M549 392h12m-6-6v12M168 415h7m-3.5-3.5v7M584 113h7m-3.5-3.5v7"/></g>
  <g fill="#9b5d48" fontSize="6" fontFamily="monospace" letterSpacing="1"><text x="151" y="103">SCAN / EARTH</text><text x="495" y="428">SECTOR 06</text></g>
 </svg>
}

export function ArticleVisual({category}:{category:NewsCategory}){
 const id=useId().replaceAll(":",""),accent=({ai:"#b39aef",chips:"#6e9edb",space:"#e2a46a",robotics:"#d79079",bio:"#a994d6",energy:"#70bf9b"})[category]||"#b39aef";
 const gradient=({ai:"#242036",chips:"#142c42",space:"#34261e",robotics:"#33231f",bio:"#242437",energy:"#15372d"})[category]||"#242036";
 return <svg viewBox="0 0 480 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><radialGradient id={id+"bg"} cx="60%" cy="40%" r="70%"><stop stopColor={gradient}/><stop offset="1" stopColor="#0f131b"/></radialGradient><linearGradient id={id+"surface"} x1="0" y1="0" x2="1" y2="1"><stop stopColor={accent} stopOpacity=".5"/><stop offset="1" stopColor={accent} stopOpacity=".02"/></linearGradient><filter id={id+"blur"}><feGaussianBlur stdDeviation="8"/></filter><radialGradient id={id+"planet"} cx="30%" cy="20%" r="80%"><stop stopColor={accent}/><stop offset=".38" stopColor="#755340"/><stop offset=".85" stopColor="#171a23"/><stop offset="1" stopColor="#0d1017"/></radialGradient></defs>
  <rect width="480" height="240" fill={"url(#"+id+"bg)"}/>
  <g stroke={accent} strokeWidth=".4" opacity=".07">{Array.from({length:17},(_,i)=><path key={i} d={"M"+i*30+" 0V240M0 "+i*20+"H480"}/>)}</g>
  {category==="ai"&&<g>
   <ellipse cx="260" cy="208" rx="106" ry="12" fill={accent} opacity=".09" filter={"url(#"+id+"blur)"}/>
   <g stroke={accent} strokeWidth=".8"><path d="M242 30L334 82L334 167L242 220L150 168V83Z" fill={"url(#"+id+"surface)"}/><path d="M242 30V133M150 83L242 133L334 82M242 133V220" opacity=".6" fill="none"/>
   {[0,1,2,3,4].map(i=><g key={i} opacity={.2+i*.05}><path d={"M"+(166+i*15)+" "+(74-i*8)+"L"+(257+i*15)+" "+(125-i*8)+"V"+(209-i*8)} fill="none"/><path d={"M"+(150+i*18)+" "+(100+i*10)+"L"+(242+i*18)+" "+(48+i*10)} fill="none"/></g>)}</g>
   {[[150,83],[242,30],[334,82],[242,133],[334,167],[242,220],[150,168]].map((p,i)=><g key={i}><circle cx={p[0]} cy={p[1]} r="8" fill={accent} opacity=".13"/><circle cx={p[0]} cy={p[1]} r="2" fill="#e0cfff"/></g>)}
   <g stroke={accent} fill="none" strokeWidth=".5" opacity=".4"><path d="M83 152L150 111M334 112L405 72M242 30V9M242 220V240"/><circle cx="78" cy="155" r="4"/><circle cx="410" cy="69" r="4"/></g>
  </g>}
  {category==="chips"&&<g transform="translate(242 119) rotate(-24)">
   {Array.from({length:12},(_,i)=><g key={i} stroke={accent} fill="none" strokeWidth=".75" opacity=".35"><path d={"M-67 "+(-55+i*10)+"H-100L-123 "+(-80+i*14)+"H-175"}/><path d={"M67 "+(-55+i*10)+"H100L123 "+(-80+i*14)+"H175"}/><path d={"M"+(-55+i*10)+" -67V-94L"+(-80+i*14)+" -117V-170"}/><path d={"M"+(-55+i*10)+" 67V94L"+(-80+i*14)+" 117V170"}/></g>)}
   <rect x="-69" y="-69" width="138" height="138" rx="8" fill="#111c2b" stroke={accent} strokeWidth="1"/><rect x="-56" y="-56" width="112" height="112" rx="3" fill={"url(#"+id+"surface)"} stroke={accent} strokeWidth=".6"/><rect x="-42" y="-42" width="84" height="84" rx="2" fill="#182c43" stroke={accent} strokeOpacity=".55"/>
   {Array.from({length:6},(_,i)=><g key={i} fill={accent} opacity=".38">{Array.from({length:6},(_,j)=><rect key={j} x={-31+i*12} y={-31+j*12} width="7" height="7" rx="1"/>)}</g>)}
   <rect x="-12" y="-12" width="24" height="24" fill="#88b6ef" opacity=".3"/><path d="M-7 0H7M0 -7V7" stroke="#c0dfff"/>
  </g>}
  {category==="space"&&<g>
   {Array.from({length:50},(_,i)=><circle key={i} cx={(i*61.7)%480} cy={(i*37.3)%240} r={i%5===0?1:.4} fill="#f1cfb5" opacity={.15+i%4*.13}/>)}
   <circle cx="268" cy="120" r="83" fill={"url(#"+id+"planet)"} stroke="#cf9969" strokeWidth=".6"/>
   <g transform="rotate(-22 268 120)"><ellipse cx="268" cy="120" rx="156" ry="32" fill="none" stroke="#e7b786" strokeWidth="2" strokeOpacity=".35"/><ellipse cx="268" cy="120" rx="144" ry="27" fill="none" stroke="#e7b786" strokeWidth="5" strokeOpacity=".09"/><path d="M112 120A156 32 0 0 0 424 120" fill="none" stroke="#f6c994" strokeWidth="1"/></g>
   <circle cx="111" cy="63" r="12" fill="#4c4b52"/><circle cx="108" cy="60" r="8" fill="#78706a" opacity=".4"/>
   <path d="M336 37L390 18M164 209L119 225" stroke="#c4a591" strokeWidth=".5" opacity=".5"/>
  </g>}
  {category==="robotics"&&<g stroke={accent} fill="none">
   <ellipse cx="249" cy="214" rx="97" ry="14" strokeOpacity=".2"/><path d="M182 207H314L303 191H195Z" fill="#44302a" strokeWidth=".8"/>
   <path d="M219 190L202 132L223 120L249 183Z" fill={"url(#"+id+"surface)"} strokeWidth="1"/>
   <path d="M202 129L270 62L287 81L225 144Z" fill={"url(#"+id+"surface)"} strokeWidth="1"/>
   <path d="M277 62L334 88L326 107L278 89Z" fill={"url(#"+id+"surface)"} strokeWidth="1"/>
   <path d="M329 91L353 90L368 104M329 104L345 117L363 118" strokeWidth="5"/>
   {[[234,185,15],[214,132,17],[278,76,14],[331,98,9]].map((p,i)=><g key={i}><circle cx={p[0]} cy={p[1]} r={p[2]} fill="#251e1d" strokeWidth="1"/><circle cx={p[0]} cy={p[1]} r={p[2]/2} fill={accent} fillOpacity=".15" strokeWidth=".7"/></g>)}
   <path d="M153 53V173H364" strokeOpacity=".2" strokeDasharray="3 6"/><circle cx="366" cy="110" r="29" strokeOpacity=".25" strokeDasharray="2 5"/>
  </g>}
  {category==="bio"&&<g transform="translate(240 120) rotate(26)">
   {Array.from({length:19},(_,i)=>{const y=-130+i*15,x=Number((Math.sin(i*.48)*53).toFixed(3));return <g key={i}><path d={"M"+x+" "+y+"H"+(-x)} stroke={accent} strokeOpacity=".4" strokeWidth="2"/><circle cx={x} cy={y} r="4" fill="#a494db"/><circle cx={-x} cy={y} r="4" fill="#679cba"/></g>})}
   <path d={Array.from({length:100},(_,i)=>(i?"L":"M")+(Math.sin(i*.092)*53).toFixed(3)+","+(i*2.9-130).toFixed(3)).join("")} stroke="#b3a4e9" strokeWidth="2" fill="none" opacity=".65"/><path d={Array.from({length:100},(_,i)=>(i?"L":"M")+(-Math.sin(i*.092)*53).toFixed(3)+","+(i*2.9-130).toFixed(3)).join("")} stroke="#6ca8c3" strokeWidth="2" fill="none" opacity=".65"/>
   {[[130,-60],[-143,40],[103,71],[-120,-80]].map((p,i)=><g key={i} stroke={accent} strokeWidth=".7" fill="none" opacity=".3"><circle cx={p[0]} cy={p[1]} r="18"/><circle cx={p[0]} cy={p[1]} r="10"/><path d={"M"+(p[0]-28)+" "+p[1]+"h56M"+p[0]+" "+(p[1]-28)+"v56"}/></g>)}
  </g>}
  {category==="energy"&&<g>
   <ellipse cx="244" cy="126" rx="107" ry="75" fill="#5bab83" opacity=".06" filter={"url(#"+id+"blur)"}/>
   {[87,68,48].map((r,i)=><ellipse key={i} cx="248" cy="125" rx={r} ry={r*.7} fill="none" stroke={accent} strokeOpacity={.13+i*.05} strokeWidth=".7" transform={"rotate("+i*60+" 248 125)"}/>)}
   <path d="M37 139H146L163 121L182 152L201 93L222 181L249 63L272 162L293 101L316 139H439" fill="none" stroke={accent} strokeWidth="6" opacity=".09" filter={"url(#"+id+"blur)"}/><path d="M37 139H146L163 121L182 152L201 93L222 181L249 63L272 162L293 101L316 139H439" fill="none" stroke="#86d8ae" strokeWidth="1.3" opacity=".85"/>
   <circle cx="249" cy="63" r="4" fill="#b0f7d4"/><circle cx="249" cy="63" r="10" fill={accent} opacity=".14"/><path d="M55 206H425M55 206V193M425 206V193" fill="none" stroke={accent} strokeOpacity=".2"/>
  </g>}
  <path d="M21 207v12h12M447 219h12v-12" stroke={accent} strokeOpacity=".28" strokeWidth=".8" fill="none"/>
 </svg>
}
