/* =========================================================
   히어로 배경: 천천히 흐르는 보라→핑크 그라데이션 (WebGL 셰이더)
   - 흰 바탕 위에 포인트 색을 옅게 섞어서, 검은 헤드라인이 잘 읽히게 함
   - 왼쪽 위(헤드라인 자리)는 더 옅고, 오른쪽 아래로 갈수록 조금 진해짐
   - 히어로가 화면에 보일 때만 그림 (안 보이면 멈춰서 배터리 절약)
   - "동작 줄이기" 설정이면 움직이지 않는 한 장면만 그림
   - WebGL을 못 쓰는 브라우저는 CSS 그라데이션으로 대신함 (.hero-bg--off)
   ========================================================= */
(function () {
  var canvas = document.querySelector('.hero-bg');
  if (!canvas) return;

  var gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) {
    canvas.classList.add('hero-bg--off');
    return;
  }

  // 화면 전체를 덮는 사각형 하나 (삼각형 2개)
  var VERTEX = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

  // 색 계산은 전부 여기서: 사인파 몇 개를 겹쳐 흐르는 무늬를 만들고 팔레트 색으로 칠함
  var FRAGMENT = [
    'precision highp float;',
    'uniform vec2 res;uniform float time;',
    'float ss(float a,float b,float v){return smoothstep(a,b,v);}',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/res;',            // 0~1 화면 좌표 (y는 아래가 0)
    '  vec2 p=vec2(uv.x*res.x/res.y,uv.y);',     // 화면 비율을 맞춘 좌표 (무늬가 늘어나지 않게)
    '  float t=time*.18;',                         // 흐르는 속도
    '  vec3 white=vec3(1.);',
    '  vec3 purple=vec3(.655,.278,.965);',         // #A747F6
    '  vec3 mid=vec3(.765,.322,.796);',            // #C352CB
    '  vec3 pink=vec3(.878,.369,.627);',           // #E05EA0
    // 1) 색: 보라와 핑크가 물결처럼 섞이고, 중간색이 한 겹 더 흐름
    '  float flow=sin(uv.x*5.+uv.y*3.+t)+.45*sin(uv.x*8.-uv.y*4.-t*.8);',
    '  vec3 col=mix(purple,pink,ss(-1.,1.,flow));',
    '  col=mix(col,mid,ss(-.4,.9,sin(uv.x*6.-uv.y*4.+t*.7))*.48);',
    // 2) 진하기: 커다란 빛 덩어리가 천천히 떠다님
    '  float blob=sin(p.x*2.3+p.y*1.7+t*.9)+.6*sin(-p.x*1.4+p.y*3.1-t*.7);',
    '  float amount=ss(-1.2,1.6,blob);',
    // 3) 위치: 왼쪽 위는 옅게(헤드라인), 오른쪽 아래는 조금 진하게
    '  float corner=ss(.0,1.1,uv.x*.65+(1.-uv.y)*.55);',
    '  float strength=mix(.14,.55,corner)*(.45+.55*amount);',
    '  vec3 result=mix(white,col,strength);',
    // 4) 아주 옅은 노이즈: 그라데이션 계단 현상(밴딩) 방지
    '  float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;',
    '  result+=grain*.008;',
    '  gl_FragColor=vec4(result,1.);',
    '}'
  ].join('\n');

  // 셰이더 준비. 실패하면 CSS 대체 배경으로
  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  var program, uRes, uTime;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var a = gl.getAttribLocation(program, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    uRes = gl.getUniformLocation(program, 'res');
    uTime = gl.getUniformLocation(program, 'time');
  } catch (e) {
    console.error('히어로 배경:', e);
    canvas.classList.add('hero-bg--off');
    return;
  }

  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var visible = true;
  var raf = 0;

  // 캔버스 해상도를 실제 크기에 맞춤 (레티나는 최대 1.6배까지만: 부드러움 vs 성능)
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    var w = Math.round(canvas.clientWidth * dpr);
    var h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function draw(now) {
    resize();
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, reduced.matches ? 0 : now / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // 매 프레임 그리기. 안 보이거나 "동작 줄이기"면 반복을 멈춤
  function frame(now) {
    draw(now);
    raf = visible && !reduced.matches ? requestAnimationFrame(frame) : 0;
  }
  function start() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  // 히어로가 화면 안에 있을 때만 움직임
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) start();
  }).observe(canvas);

  window.addEventListener('resize', start);
  reduced.addEventListener('change', start);
  start();
})();
