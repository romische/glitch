const canvas = document.getElementById('canvas-webgl');
const videosrc = document.getElementById('src-video');

var caputer;

var glitchstart;
var glitchend;

document.getElementById('the-file-input').onchange = function() {
  console.log('loaded', this.files[0].name)
  var reader = new FileReader();
		reader.onload = function(event){
      var the_url = event.target.result
      var source = document.createElement('source');
      source.setAttribute('src', the_url);
      source.setAttribute('type', 'video/mp4')
      videosrc.appendChild(source);

      videosrc.addEventListener( "loadedmetadata", function (e) {
        console.log('loaded')
        init()
      }, false );
		}
		reader.readAsDataURL(this.files[0]);
};


// start when we can fetch the video size
// videosrc.addEventListener( "loadedmetadata", function (e) {
//   console.log('loaded')
//   init()
// }, false );

class PostEffect {
  constructor(texture, width, height) {
    this.uniforms = {
      time: {
        type: 'f',
        value: 0,
      },
      resolution: {
        type: 'v2',
        value: new THREE.Vector2(width, height),
      },
      texture: {
        type: 't',
        value: texture,
      },
      strength: {
        type: 'f',
        value: 0,
      }
    };
    this.obj = this.createObj();
  }
  render(time, strength) {
    this.uniforms.time.value = time;
    this.uniforms.strength.value = strength;
  }
  createObj() {
    return new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2, 2),
      new THREE.RawShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: `attribute vec3 position;
          attribute vec2 uv;
          
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `precision highp float;
        
          uniform float time;
          uniform float strength;
          uniform vec2 resolution;
          uniform sampler2D texture;
          
          varying vec2 vUv;
          
          float random(vec2 c){
            return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
          }

          //
          // Description : Array and textureless GLSL 2D/3D/4D simplex
          //               noise functions.
          //      Author : Ian McEwan, Ashima Arts.
          //  Maintainer : ijm
          //     Lastmod : 20110822 (ijm)
          //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
          //               Distributed under the MIT License. See LICENSE file.
          //               https://github.com/ashima/webgl-noise
          //

          vec3 mod289(vec3 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
          }

          vec4 mod289(vec4 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
          }

          vec4 permute(vec4 x) {
               return mod289(((x*34.0)+1.0)*x);
          }

          vec4 taylorInvSqrt(vec4 r)
          {
            return 1.79284291400159 - 0.85373472095314 * r;
          }

          float snoise3(vec3 v)
            {
            const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
            const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

          // First corner
            vec3 i  = floor(v + dot(v, C.yyy) );
            vec3 x0 =   v - i + dot(i, C.xxx) ;

          // Other corners
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min( g.xyz, l.zxy );
            vec3 i2 = max( g.xyz, l.zxy );

            //   x0 = x0 - 0.0 + 0.0 * C.xxx;
            //   x1 = x0 - i1  + 1.0 * C.xxx;
            //   x2 = x0 - i2  + 2.0 * C.xxx;
            //   x3 = x0 - 1.0 + 3.0 * C.xxx;
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
            vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

          // Permutations
            i = mod289(i);
            vec4 p = permute( permute( permute(
                       i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                     + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                     + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

          // Gradients: 7x7 points over a square, mapped onto an octahedron.
          // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
            float n_ = 0.142857142857; // 1.0/7.0
            vec3  ns = n_ * D.wyz - D.xzx;

            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);

            vec4 b0 = vec4( x.xy, y.xy );
            vec4 b1 = vec4( x.zw, y.zw );

            //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
            //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));

            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);

          //Normalise gradients
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;

          // Mix final noise value
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                          dot(p2,x2), dot(p3,x3) ) );
            }
                    
          const float interval = 5.0;
          
          void main(void){

            vec2 shake = vec2(strength * 8.0 + 0.5) * vec2(
              random(vec2(time)) * 2.0 - 1.0,
              random(vec2(time * 2.0)) * 2.0 - 1.0
            ) / resolution;
          
            float y = vUv.y * resolution.y;
            float rgbWave = (
                snoise3(vec3(0.0, y * 0.01, time * 400.0)) * (2.0 + strength * 32.0)
                * snoise3(vec3(0.0, y * 0.02, time * 200.0)) * (1.0 + strength * 4.0)
                + step(0.9995, sin(y * 0.005 + time * 1.6)) * 12.0
                + step(0.9999, sin(y * 0.005 + time * 2.0)) * -18.0
              ) / resolution.x;
            float rgbDiff = (6.0 + sin(time * 500.0 + vUv.y * 40.0) * (20.0 * strength + 1.0)) / resolution.x;
            float rgbUvX = vUv.x + rgbWave;
            float r = texture2D(texture, vec2(rgbUvX + rgbDiff, vUv.y) + shake).r;
            float g = texture2D(texture, vec2(rgbUvX, vUv.y) + shake).g;
            float b = texture2D(texture, vec2(rgbUvX - rgbDiff, vUv.y) + shake).b;
          
            float whiteNoise = (random(vUv + mod(time, 10.0)) * 2.0 - 1.0) * (0.15 + strength * 0.15);
          
            float bnTime = floor(time * 20.0) * 200.0;
            float noiseX = step((snoise3(vec3(0.0, vUv.x * 3.0, bnTime)) + 1.0) / 2.0, 0.12 + strength * 0.3);
            float noiseY = step((snoise3(vec3(0.0, vUv.y * 3.0, bnTime)) + 1.0) / 2.0, 0.12 + strength * 0.3);
            float bnMask = noiseX * noiseY;
            float bnUvX = vUv.x + sin(bnTime) * 0.2 + rgbWave;
            float bnR = texture2D(texture, vec2(bnUvX + rgbDiff, vUv.y)).r * bnMask;
            float bnG = texture2D(texture, vec2(bnUvX, vUv.y)).g * bnMask;
            float bnB = texture2D(texture, vec2(bnUvX - rgbDiff, vUv.y)).b * bnMask;
            vec4 blockNoise = vec4(bnR, bnG, bnB, 1.0);
          
            float bnTime2 = floor(time * 25.0) * 300.0;
            float noiseX2 = step((snoise3(vec3(0.0, vUv.x * 2.0, bnTime2)) + 1.0) / 2.0, 0.12 + strength * 0.5);
            float noiseY2 = step((snoise3(vec3(0.0, vUv.y * 8.0, bnTime2)) + 1.0) / 2.0, 0.12 + strength * 0.3);
            float bnMask2 = noiseX2 * noiseY2;
            float bnR2 = texture2D(texture, vec2(bnUvX + rgbDiff, vUv.y)).r * bnMask2;
            float bnG2 = texture2D(texture, vec2(bnUvX, vUv.y)).g * bnMask2;
            float bnB2 = texture2D(texture, vec2(bnUvX - rgbDiff, vUv.y)).b * bnMask2;
            vec4 blockNoise2 = vec4(bnR2, bnG2, bnB2, 1.0);
          
            float waveNoise = (sin(vUv.y * 1200.0) + 1.0) / 2.0 * (0.15 + strength * 0.2);
                      
            gl_FragColor = vec4(r, g, b, 1.0) * (1.0 - bnMask - bnMask2) + (whiteNoise + blockNoise + blockNoise2 - waveNoise);
          }
        `,
      })
    );
  }
}

const getBgShader = () => {
  return new THREE.RawShaderMaterial({
    uniforms: {
      texture: {
        type: 't',
        value: new THREE.VideoTexture( videosrc ),
      },
    },
    vertexShader: `attribute vec3 position;
      attribute vec2 uv;
      varying vec2 vUv;

      void main(void) {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `precision highp float;
      uniform sampler2D texture;
      varying vec2 vUv;

      void main(void) {
        gl_FragColor = texture2D(texture, vUv);
      }
    `,
  })
}

const setupForm = () => {
  // video input

  // the slider
  var slider = document.getElementById('slider');
  slider.style.width = videosrc.videoWidth*0.9;
  noUiSlider.create(slider, {
    start: [videosrc.duration/4, videosrc.duration/2],
    connect: [false, true, false],
    range: {
        'min': 0,
        'max': videosrc.duration
    },
    keyboardSupport: true,
    pips: {
      mode: 'count',
      values: 6,
      density: 4
    }
  });

  // the form above
  var starttime = document.getElementById('glitchstarttime');
  var endtime = document.getElementById('glitchendtime');
  var startnow = document.getElementById('startnow');
  var endnow = document.getElementById('endnow');

  // listeners
  slider.noUiSlider.on('update', function (values, handle) {
    if ( +values[0] !== glitchstart ) {
      glitchstart = +values[0];
      starttime.value = values[0];
      videosrc.currentTime = +values[0]
    } else {
      glitchend = +values[1];
      endtime.value = +values[1];
      videosrc.currentTime = +values[1]
    }
  });
  function setStart(x) { slider.noUiSlider.set([x, null]) }
  function setEnd(x) { slider.noUiSlider.set([null, x]) }
  starttime.onchange = function(e) { setStart( e.target.value ) };
  endtime.onchange = function(e) { setEnd( e.target.value ) };
  startnow.onclick = function(e) { 
    e.preventDefault();
    setStart( videosrc.currentTime );
  };
  endnow.onclick = function(e) {
    e.preventDefault();
    setEnd( videosrc.currentTime )
  };

  // download btn
  capturer = new CCapture( {
    format: 'webm',
    framerate: 24,
    name: 'video-result',
    timeLimit: videosrc.duration,
  } );
  document.getElementById('downloadbtn').onclick = function (e) {
    videosrc.currentTime = 0;
    document.getElementById('downloadinfo').style.visibility = 'visible';
    videosrc.pause()
    // capturer.start()
    videosrc.addEventListener('play', function (e) {
      console.log('starting capturer', videosrc.currentTime)
      capturer.start();
      // videosrc.play()
    });
  }
}


const getRender = (width, height) => {

  // scene, camera, render for the background image
  const sceneBack = new THREE.Scene();
  const cameraBack = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const renderBuffer = new THREE.WebGLRenderTarget(width, height);
  const bgImgMesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 2),
    getBgShader()
  );
  sceneBack.add(bgImgMesh);
  
  // scene, camera, renderer for the posteffect
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setSize(width, height);
  renderer.setClearColor(0x111111, 1.0);
  
  // an image and the associated shader
  const postEffect = new PostEffect(renderBuffer.texture, width, height);
  scene.add(postEffect.obj);

  // render function
  const render = (time, strength) => {
    renderer.render(sceneBack, cameraBack, renderBuffer);
    postEffect.render(time, strength);
    renderer.render(scene, camera);
  }
  
  return render;
}



const init = () => {
  console.log('init')
  videosrc.muted = true;
  videosrc.autoplay = true;
  
  var [ width, height ] = [ videosrc.videoWidth, videosrc.videoHeight ]

  // display video informations & setup form
  document.getElementById('showdur').innerHTML= videosrc.duration;
  document.getElementById('showwidth').innerHTML = width;
  document.getElementById('showheight').innerHTML = height;
  setupForm()
  const render = getRender(width, height)

  const showtime = document.getElementById('showtime');
  const showglitchval = document.getElementById('showglitchval');
  
  videosrc.currentTime = 0

  // loop & start
  videosrc.onplay = function (e) {
    const renderLoop = () => {
      const time = videosrc.currentTime;
      var strength;
      // if ( time > glitchstart && time < glitchend) {
      //   strength = 1.0; 
      // } else {
      //   strength = 0.0;
      // }

      // progressive? 
      const glitchdur = (glitchend - glitchstart);
      const glitchmid = glitchstart + glitchdur/2;
      if ( time > glitchstart && time < glitchmid) {
        strength = (time - glitchstart) / (glitchdur/2); 
      } else if (time > glitchmid && time < glitchend) {
        strength = - (time-glitchend) / (glitchdur/2);
      } else {
        strength = 0.0;
      }
      strength = strength*3.0;

      // show that
      showtime.innerHTML = time.toFixed(3) + 's';
      showglitchval.innerHTML = strength.toFixed(2);

      render(time, strength)
      requestAnimationFrame(renderLoop);
      capturer.capture( canvas );
    }
    renderLoop();
  }
}
