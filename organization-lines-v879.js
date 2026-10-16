/* Orthogonal reporting lines use the clear space between cards and headings. */
(()=>{
 'use strict';
 const q=n=>Math.round(n*10)/10;
 class Heap{
  constructor(){this.items=[]}
  push(value){const a=this.items;let i=a.length;a.push(value);while(i){const p=(i-1)>>1;if(a[p].cost<=value.cost)break;a[i]=a[p];i=p}a[i]=value}
  pop(){const a=this.items,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].cost<a[c].cost)c++;if(a[c].cost>=last.cost)break;a[i]=a[c];i=c}a[i]=last}return first}
 }
 function prepare(model,includeLabels=true){
  const boxes=model.nodes.map(node=>({left:q(node.x-6),right:q(node.x+node.w+6),top:q(node.y-6),bottom:q(node.y+node.h+6),cx:q(node.x+node.w/2),actualTop:q(node.y),actualBottom:q(node.y+node.h),card:true}));
  if(includeLabels)for(const label of model.labels||[]){
   // Text is centered in a wider heading element; protect its visible text.
   const width=Math.min(label.w,Math.max(30,Array.from(label.text).length*9+8)),height=Math.min(22,Math.max(16,label.h));
   boxes.push({left:q(label.x+(label.w-width)/2-2),right:q(label.x+(label.w+width)/2+2),top:q(label.y-1),bottom:q(label.y+height+1)});
  }
  const xValues=new Set(),yValues=new Set();
  for(const b of boxes){[b.left,b.right,q((b.left+b.right)/2)].forEach(x=>xValues.add(x));[b.top,b.bottom,q((b.top+b.bottom)/2)].forEach(y=>yValues.add(y));if(b.card){yValues.add(b.actualTop);yValues.add(b.actualBottom)}}
  xValues.add(q(Math.min(0,...boxes.map(b=>b.left))-24));xValues.add(q(Math.max(model.width||0,...boxes.map(b=>b.right))+24));
  yValues.add(q(Math.min(60,...boxes.map(b=>b.top))-24));yValues.add(q(Math.max(model.height||0,...boxes.map(b=>b.bottom))+24));
  const xs=[...xValues].sort((a,b)=>a-b),ys=[...yValues].sort((a,b)=>a-b),nx=xs.length,ny=ys.length,blocked=new Uint8Array(nx*ny),xi=new Map(xs.map((x,i)=>[x,i])),yi=new Map(ys.map((y,i)=>[y,i]));
  for(const b of boxes){
   for(let y=0;y<ny;y++)if(ys[y]>b.top&&ys[y]<b.bottom){
    for(let x=0;x<nx;x++)if(xs[x]>b.left&&xs[x]<b.right){
     // Short ports cross only the padded margin at a card's top/bottom center.
     if(b.card&&xs[x]===b.cx&&(ys[y]<=b.actualTop||ys[y]>=b.actualBottom))continue;
     blocked[y*nx+x]=1;
    }
   }
  }
  const port=(node,bottom)=>yi.get(q(node.y+(bottom?node.h:0)))*nx+xi.get(q(node.x+node.w/2));
  return {xs,ys,nx,ny,blocked,port};
 }
 const edgeKey=(a,b)=>a<b?a+':'+b:b+':'+a;
 function search(grid,start,end,shared,occupied){
  const {xs,ys,nx,ny,blocked}=grid,states=nx*ny*2,dist=new Float64Array(states),previous=new Int32Array(states),heap=new Heap();dist.fill(Infinity);previous.fill(-1);
  const ex=end%nx,ey=Math.floor(end/nx),heuristic=vertex=>(Math.abs(xs[vertex%nx]-xs[ex])+Math.abs(ys[Math.floor(vertex/nx)]-ys[ey]))*.6;
  // A heading may touch a port, but no line may enter the card itself.
  if(blocked[start]||blocked[end])return null;
  for(const dir of [0,1]){dist[start*2+dir]=0;heap.push({state:start*2+dir,cost:heuristic(start),distance:0})}
  while(heap.items.length){
   const current=heap.pop();if(current.distance!==dist[current.state])continue;
   const vertex=current.state>>1,dir=current.state&1,x=vertex%nx,y=Math.floor(vertex/nx);
   if(vertex===end){
    const path=[];let cursor=current.state;while(cursor>=0){const v=cursor>>1;path.push({x:xs[v%nx],y:ys[Math.floor(v/nx)],vertex:v});cursor=previous[cursor]}path.reverse();
    for(let i=1;i<path.length;i++)shared.add(edgeKey(path[i-1].vertex,path[i].vertex));
    const points=[];for(const p of path){if(points.length>1){const a=points[points.length-2],b=points[points.length-1];if(a.x===b.x&&b.x===p.x||a.y===b.y&&b.y===p.y)points.pop()}points.push({x:p.x,y:p.y})}
    return {points,vertices:path.map(p=>p.vertex)};
   }
   for(const [dx,dy,nextDir]of [[-1,0,0],[1,0,0],[0,-1,1],[0,1,1]]){
    const xx=x+dx,yy=y+dy;if(xx<0||xx>=nx||yy<0||yy>=ny)continue;
    const next=yy*nx+xx;if(blocked[next])continue;
    const length=Math.abs(xs[xx]-xs[x])+Math.abs(ys[yy]-ys[y]),nextState=next*2+nextDir;
    const cost=current.distance+length*(shared.has(edgeKey(vertex,next))?.6:1)+(dir===nextDir?0:22)+(next!==end&&occupied.has(next)?60:0);
    if(cost>=dist[nextState])continue;dist[nextState]=cost;previous[nextState]=current.state;heap.push({state:nextState,cost:cost+heuristic(next),distance:cost});
   }
  }
  return null;
 }
 function route(model){
  const result=new Map();if(!model.nodes.length)return result;
  const grid=prepare(model),byId=new Map(model.nodes.map((node,index)=>[String(node.employee.id),{node,index}])),families=new Map(),occupied=new Set();
  model.nodes.forEach((node,index)=>{const parent=byId.get(String(node.parent));if(!parent||parent.index===index)return;const id=String(node.parent);if(!families.has(id))families.set(id,[]);families.get(id).push({node,index,parent})});
  // Route upper levels first and reuse a common trunk for each parent's children.
  const sorted=[...families.values()].sort((a,b)=>a[0].parent.node.y-b[0].parent.node.y);
  for(const family of sorted){
   const shared=new Set(),vertices=new Set();family.sort((a,b)=>a.node.y-b.node.y||Math.abs(b.node.x-b.parent.node.x)-Math.abs(a.node.x-a.parent.node.x));
   for(const {node,index,parent}of family){
    const path=search(grid,grid.port(parent.node,true),grid.port(node,false),shared,occupied);
    if(!path)throw Error('พื้นที่ระหว่างกล่องไม่พอสำหรับเส้นเชื่อมของ '+node.employee.id);
    path.vertices.forEach(v=>vertices.add(v));result.set(index,path.points);
   }
   vertices.forEach(v=>occupied.add(v));
  }
  return result;
 }
 window.PPMSOrganizationLines={route,prepare};
})();
