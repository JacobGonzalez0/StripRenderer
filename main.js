const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const eyeHeight = 6;
const duckHeight = 2.5;
const headMargin = 1;
const kneeHeight = 2;
const hfov = (0.73*H);
const vfov = (.2*H);

class xy{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
}

class xyz{
    constructor(x,y,z){
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Pixel{
    constructor(r,g,b,a){
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    };
}

class CircleBuffer{

    constructor(size){
        this._array = new Array(size);
        this.length = 0;
        this.IndexError = {}
    }

    toString(){
        return '[object CircularBuffer('+this._array.length+') length '+this.length+']';
    }

    get(i){
        if (i<0 || i<this.length-this._array.length){
            return undefined;
        }
        return this._array[i%this._array.length];
    }

    set(i,v){
        if (i<0 || i<this.length-this._array.length){
            throw CircularBuffer.IndexError;
        }
        while (i>this.length) {
            this._array[this.length%this._array.length]= undefined;
            this.length++;
        }
        this._array[i%this._array.length]= v;
        if (i==this.length){
            this.length++;
        }
    }

}

class Surface{
    constructor(){
        this.surface = new Map();

        for(let x = 0; x < W; x++){
            for(let y = 0; y < H; y++){
                this.surface.set(((y*W)+x), new Pixel(55,66,77,255))
            }
        }

        
    }

    pixel(x,y){
        return this.surface.get( ((y*W)+x) )
    }

}

let surface = new Surface();

class Sector{
    constructor(){

        this.floor;
        this.ciel;
        this.xy = new xy(0,0);
        this.neighbors;
        this.npoints;
    }
}
let sectors = [];



class Player{
    constructor(){
        this.angle, anglesin, anglecos, yaw;
        this.sector;
        this.xyz = new xyz(0,0,0);
    }
}

class Utility{

    constructor(){


    }

    /**
     * min: Choose smaller of two scalars.
     */
    min(a,b){
        return (((a) < (b)) ? (a) : (b));
    }

    /**
     * max: Choose greater of two scalars.
     */
    max(a,b){
        return (((a) > (b)) ? (a) : (b));
    }

    /**
     * clamp: Clamp value into set range.
     */
    clamp(a, mi,ma){
        return this.min(this.max(a,mi),ma);
    }

    /**
     * Vector cross project
     */
    vxs(x0,y0, x1,y1){
        ((x0)*(y1) - (x1)*(y0))
    }

    /**
     * Overlap:  Determine whether the two number ranges overlap.
     */
    overlap(a0,a1,b0,b1){
        return (this.min(a0,a1) <= this.max(b0,b1) && this.min(b0,b1) <= this.max(a0,a1))
    }

    /**
     * IntersectBox: Determine whether two 2D-boxes intersect.
     */
    intersectBox(x0,y0, x1,y1, x2,y2, x3,y3){
        return (this.overlap(x0,x1,x2,x3) && this.overlap(y0,y1,y2,y3));
    }

    /**
     * PointSide: Determine which side of a line the point is on. Return value: <0, =0 or >0.
     */
    pointSide(px,py, x0,y0, x1,y1){
        return this.vxs((x1)-(x0), (y1)-(y0), (px)-(x0), (py)-(y0))
    }
    /**
     * Intersect: Calculate the point of intersection between two lines.
     */
    intersect(x1,y1, x2,y2, x3,y3, x4,y4){
       return new xy(
        this.vxs(this.vxs(x1,y1, x2,y2), (x1)-(x2), this.vxs(x3,y3, x4,y4), (x3)-(x4)) / this.vxs((x1)-(x2), (y1)-(y2), (x3)-(x4), (y3)-(y4)),
        this.vxs(this.vxs(x1,y1, x2,y2), (y1)-(y2), this.vxs(x3,y3, x4,y4), (y3)-(y4)) / this.vxs((x1)-(x2), (y1)-(y2), (x3)-(x4), (y3)-(y4))

       )
    }

}
const utliity = new Utility()


function vline(x, y1, y2, top, middle, bottom){
    
    y1 = Utility.clamp(y1, 0, H-1);
    y2 = Utility.clamp(y2, 0, H-1);
    // if(y2 == y1)
    //     pix[y1*W+x] = middle;
    // else if(y2 > y1)
    // {
    //     pix[y1*W+x] = top;
    //     for(int y=y1+1; y<y2; ++y) pix[y*W+x] = middle;
    //     pix[y2*W+x] = bottom;
    // }
}

function clearScreen(){
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height)
}

var image;
var pix = 0;
function draw(sur){
    image = ctx.createImageData(W, H)

        var u = 0;
        for(let i = 0 ; i < sur.surface.size*4; ){
            image.data[i  ] = sur.surface.get(u).r
            image.data[i+1] = sur.surface.get(u).g
            image.data[i+2] = sur.surface.get(u).b
            image.data[i+3] = sur.surface.get(u).a
            u++
            i+=4
        }


    ctx.putImageData(image, 0, 0)

}

function noise(sur){

    
    for(let y = 0; y < H; y++){
        for(let x = 0; x < W; x++){
            
            sur.pixel(x,y).r = Math.floor(Math.random() * 244);
            sur.pixel(x,y).b = Math.floor(Math.random() * 244);
            sur.pixel(x,y).g = Math.floor(Math.random() * 244);
        }
        
    }
}

function vline(x,y1,y2, top, middle,bottom, sur){
    y1 = utliity.clamp(y1, 0, H-1);
    y2 = utliity.clamp(y2, 0, H-1);
    if(y2 == y1)
        sur.surface.set(y1*W+x, middle)
    else if(y2 > y1)
    {
        sur.surface.set(y1*W+x,top);
        for(let y=y1+1; y<y2; ++y) sur.surface.set(y*W+x,middle);
        sur.surface.set(y2*W+x,bottom);
    }
}

function render(surface){




}


function loop(ms){
    // clearScreen();
    render(surface)
    draw(surface);
    

    
 
    
   

    window.requestAnimationFrame(loop);
}

loop()



