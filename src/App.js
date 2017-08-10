import React, { Component } from 'react';
import './App.css';

const requireContext = require.context("./flappybird", true, /^\.\/.*\.png$/);
const keys = requireContext.keys();
const images = keys.map(requireContext);
const map = {};


class bg {
    constructor(config) {
      let canvas = document.getElementById('canvas'),
          ctx = canvas.getContext('2d');
      this.ctx = ctx;
      this.init(config);
    }
    init(config) {
      this.initBg(config);
      config.pipe.forEach( (v) => {
        this.initPipe(v,config.pipespace);
      });
      this.initLand(config);
    }
    initImg(key) {
      return map[key];
    }
    initBg() {
      let img = this.initImg('bg_day');
      this.ctx.drawImage(img,0,0);
    }
    initLand(config) {
      let img = this.initImg('land');
      this.ctx.drawImage(img,config.land,400);
      this.ctx.drawImage(img,config.land + 288,400);
    }
    initPipe(config,pipespace) {
      let img1 = this.initImg('pipe_down');
      let img2 = this.initImg('pipe_up');
      this.ctx.drawImage(img1,config.x,config.y);
      this.ctx.drawImage(img2,config.x,config.y + pipespace.y + 320);
    }
}

class bird {
    constructor(config) {
      config = config || {};
      this.init(config);
    }
    init(config) {
      let x = config.x !== undefined ? config.x : 100,
          y = config.y !== undefined ? config.y : 232,
          width = config.width !== undefined ? config.width : 30,
          height = config.height !== undefined ? config.height : 30,
          img = config.img !== undefined ? config.img : 0,
          rotate = config.rotate !== undefined ? config.rotate : 0,
          canvas = document.getElementById('canvas'),
          ctx = canvas.getContext('2d');
      // this.clear(ctx);
      this.ctx = ctx;
      ctx.fillStyle = "#fff";
      // ctx.fillRect(x,y,width,height);
      img = this.img(img);
      rotate ? this.rotate(img,x,y,rotate) : ctx.drawImage(img, x, y);//绘制小鸟
    }
    clear() {
      this.ctx.clearRect(0,0,288,512);
    }
    img(index) {
      return map[`bird2_${index}`];
    }
    rotate(img,x,y,rotate) {
      this.ctx.save();//保存状态
      this.ctx.translate(x + img.width / 2,y + img.height / 2);//设置画布上的(0,0)位置，也就是旋转的中心点
      this.ctx.rotate(rotate*Math.PI/180);
      this.ctx.drawImage(img,-img.width / 2,-img.height / 2);//把图片绘制在旋转的中心点，
      this.ctx.restore();//恢复状态
    }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 'yyj',
      frames: 60,//帧数
      ratio: 100/1,//地图比例
      land: 0,//地面位置
      pipespace: {//障碍物横纵间距
        x: 118,
        y: 120,
      },
      pipe: [{//障碍物位置
        x: 500,
        y: Math.random() * -260 - 40
      },{
        x: 500 + 118 + 52,
        y: Math.random() * -260 - 40
      },{
        x: 500 + 118 * 2 + 52 * 2,
        y: Math.random() * -260 - 40
      }],
      velocity: 0,//速度
      g: 9.8,//重力加速度
      img: 0,//飞行状态
      pos: {//飞行位置
        top: 232,
        left: 100
      }
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }
  componentDidMount() {
    this.preloadImage(this.initCanvas.bind(this));
  }
  componentWillUpdate() {
    // console.log('update');
    this.birdObj.clear();
    this.bgObj.init({
      land: this.state.land,
      pipespace: this.state.pipespace,
      pipe: this.state.pipe
    });
    this.birdObj.init({
      x:this.state.pos.left,
      y:this.state.pos.top,
      img: this.state.img,
      rotate: this.state.velocity < 0 ? -45 : (this.state.velocity === 0 ? 0 : 45)
    });
  }
  preloadImage(callback,arg) {
    keys.forEach((value,index) => {
      let img = new Image();
      img.src = images[index];
      img.onload = () => {
        map[value.replace('./','').replace('.png','')] = img;
        if(Object.keys(map).length === keys.length) callback(arg);
      };
    });
  }
  initCanvas() {
    this.bgObj = new bg({
      land: this.state.land,
      pipespace: this.state.pipespace,
      pipe: this.state.pipe
    });
    this.birdObj = new bird({x:this.state.pos.left, y:this.state.pos.top, img: this.state.img});//将唯一bird实例birdObj赋予上下文
    this.initEngine();
  }
  initEngine() {//游戏主引擎和操作事件
    window.addEventListener('keyup',this.handleKeyUp);//绑定键盘事件触发拍打翅膀
    this.timer1 = this.setFlyInterval.call(this);//切换翅膀拍动位置
    this.timer2 = this.setRunInterval.call(this);//游戏运行主要方法
  }
  setFlyInterval() {
    return setInterval(() => {
      this.setState({
        img: this.state.img < 2 ? this.state.img + 1 : 0
      });
    },100);
  }
  setRunInterval() {
    let time = 1 / this.state.frames;
    return setInterval(() => {
      let v = this.state.velocity + this.state.g * time;
      let pipe = this.state.pipe;
      if(pipe[0].x >> 0 < -52) {
        pipe.shift();
        pipe.push({
          x: pipe[1].x + this.state.pipespace.x + 52,
          y: Math.random() * -260 - 40
        })
      }
      console.log(this.state.land);
      this.setState({
        land: (this.state.land - 2) >> 0 <= -288 ? 0 : this.state.land - 2,
        pipe: pipe.map((v) => ({x:v.x - 2, y: v.y})),
        velocity: v,
        pos: {
          top: this.state.pos.top + v * this.state.ratio * time,
          left: this.state.pos.left
        }
      });
      if(this.state.pos.left + 38 >= this.state.pipe[0].x && this.checkGameover.call(this)){
        clearInterval(this.timer1);
        clearInterval(this.timer2);
      }
    },time * 1000);
  }
  checkGameover() {
    let gameover = false,
        {left:birdLeft,top:birdTop} = this.state.pos,
        birdPos = {
          top: birdTop + 10,
          bottom: birdTop + 38,
          left: birdLeft + 10,
          right: birdLeft + 38
        },
        pipePos = {};
    for(let i = 0; i < 2; i++){
      let {x,y} = this.state.pipe[i];
      pipePos.top = y + 320;
      pipePos.bottom = y + 320 + this.state.pipespace.y;
      pipePos.left = x;
      pipePos.right = x+52;

      if(birdPos.bottom >= 400){
        console.log(555555);
      }
      if( birdPos.right >= pipePos.left && birdPos.left <= pipePos.right && (birdPos.top <= pipePos.top || //撞在上面管道
          birdPos.bottom >= pipePos.bottom) || //撞在下面管道
          (birdPos.bottom >= 400) //落地
      ){
        gameover = true;
        break;
      }
    }
    return gameover;
  }
  handleChange(event) {
    this.setState({
      value: event.target.value
    });
  }
  handleKeyUp(event) {
    if(event.keyCode === 38) {
      this.setState({
        velocity: -4
      });
    }
  }
  render() {
    return (
      <div className="App" >
        <input value = {this.state.value} onChange = {this.handleChange} />
        <canvas id="canvas" className="game-content" width="288" height="512"></canvas>
      </div>
    );
  }
}

export default App;
