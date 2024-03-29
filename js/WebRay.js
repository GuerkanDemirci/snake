WebRay = function ( parameters ) {

	console.log("WebRay()");

	parameters = parameters || {};
	
	var mTo = (new Date()).getTime();
	
	var _canvas = parameters.canvas !== undefined ? parameters.canvas : document.createElement( 'canvas' ),
		_context = parameters.context !== undefined ? parameters.context : null,

		pixelRatio = 1,

		_alpha = parameters.alpha !== undefined ? parameters.alpha : false,
		_depth = parameters.depth !== undefined ? parameters.depth : true,
		_stencil = parameters.stencil !== undefined ? parameters.stencil : false,
		_antialias = parameters.antialias !== undefined ? parameters.antialias : false,
		
		_clearColor = {"r":0.5,"g":0.5,"b":0.5},
		_clearAlpha = 0;
	
	
	var _viewportX = 0,
		_viewportY = 0,
		_viewportWidth = _canvas.width,
		_viewportHeight = _canvas.height;

	// internal properties

	var _this = this;
	
	var _gl;
	try
	{
		var attributes = {
			alpha: _alpha,
			depth: _depth,
			stencil: _stencil,
			antialias: _antialias
		};
		_gl = _canvas.getContext( 'webgl', attributes ) || CNVS.getContext( 'experimental-webgl', attributes );
		if ( _gl === null )
		{
			throw 'No WebGL';
		}
		_canvas.addEventListener( 'webglcontextlost', function ( event ) {

			event.preventDefault();

			console.log( 'WebGL context LOST' );
			//resetGLState();
			setDefaultGLState();

		}, false);				
	}
	catch ( error )
	{
		console.log( 'error: ' + error );
	}

	// public properties

	this.domElement = _canvas;

	// clearing

	this.autoClear = true;
	this.autoClearColor = true;
	this.autoClearDepth = true;
	this.autoClearStencil = true;

	var setDefaultGLState = function () {

		_gl.clearColor( 0, 0, 0, 1 );
		_gl.clearDepth( 1 );
		_gl.clearStencil( 0 );

		_gl.enable( _gl.DEPTH_TEST );
		_gl.depthFunc( _gl.LEQUAL );

		_gl.frontFace( _gl.CCW );
		_gl.cullFace( _gl.BACK );
		_gl.enable( _gl.CULL_FACE );

		_gl.enable( _gl.BLEND );
		_gl.blendEquation( _gl.FUNC_ADD );
		_gl.blendFunc( _gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA );

		_gl.viewport( _viewportX, _viewportY, _viewportWidth, _viewportHeight );

		_gl.clearColor( _clearColor.r, _clearColor.g, _clearColor.b, _clearAlpha );

	};
	
	setDefaultGLState();

	this.clear = function ( color, depth, stencil ) {

		//console.log("WebRay::clear");

		var bits = 0;

		if ( color === undefined || color ) bits |= _gl.COLOR_BUFFER_BIT;
		if ( depth === undefined || depth ) bits |= _gl.DEPTH_BUFFER_BIT;
		if ( stencil === undefined || stencil ) bits |= _gl.STENCIL_BUFFER_BIT;

		_gl.clear( bits );
	};

	this.setSize = function ( width, height, updateStyle ) {

		console.log("WebRay::setSize("+width+", "+height+")");

		_canvas.width = width * pixelRatio;
		_canvas.height = height * pixelRatio;

		if ( updateStyle !== false ) {

			_canvas.style.width = width + 'px';
			_canvas.style.height = height + 'px';

		}

		this.setViewport( 0, 0, width, height );

	};

	this.setViewport = function ( x, y, width, height ) {

		console.log("WebRay::setViewport("+x+", "+y+", "+width+", "+height+")");

		_viewportX = x * pixelRatio;
		_viewportY = y * pixelRatio;

		_viewportWidth = width * pixelRatio;
		_viewportHeight = height * pixelRatio;

		_gl.viewport( _viewportX, _viewportY, _viewportWidth, _viewportHeight );

	};

	// Rendering

	this.render = function ( program, buffer, data, forceClear ) {

		//console.log("WebRay::render()");

		if ( this.autoClear || forceClear ) {
			this.clear( this.autoClearColor, this.autoClearDepth, this.autoClearStencil );
		}

		_gl.activeTexture(_gl.TEXTURE0);
		_gl.bindTexture(_gl.TEXTURE_2D, data);
		
		var time = ((new Date()).getTime() - mTo)/1000.0;

		var l2 = _gl.getUniformLocation( program, "iGlobalTime" ); if( l2!=null ) _gl.uniform1f(  l2, time );
		var l3 = _gl.getUniformLocation( program, "iResolution" ); if( l3!=null ) _gl.uniform3f( l3, _viewportWidth, _viewportHeight, 1.0 );
		var l2 = _gl.getUniformLocation( program, "uSampler"); if ( l2!=null ) _gl.uniform1i( l2, 0);
		var l1 = _gl.getAttribLocation( program, "pos");
		
		_gl.bindBuffer( _gl.ARRAY_BUFFER, buffer);
		_gl.vertexAttribPointer( l1, 2, _gl.FLOAT, false, 0, 0);
		_gl.enableVertexAttribArray( l1 );

		_gl.drawArrays(_gl.TRIANGLES, 0, 6);
		_gl.disableVertexAttribArray(l1);

		_gl.bindTexture(_gl.TEXTURE_2D, null);

	};
	
	this.update = function( tex, data ) {
		_gl.activeTexture(_gl.TEXTURE0);
		_gl.bindTexture(_gl.TEXTURE_2D, tex);
		_gl.texSubImage2D(_gl.TEXTURE_2D, 0, 0, 0, 256, 1, _gl.RGBA, _gl.UNSIGNED_BYTE, data);
		_gl.bindTexture(_gl.TEXTURE_2D, null);
	}

	this.createScreen = function() {
		var vertices = new Float32Array( [ -1.0, -1.0,   1.0, -1.0,    -1.0,  1.0,     1.0, -1.0,    1.0,  1.0,    -1.0,  1.0] );

		var buffer = _gl.createBuffer();
		_gl.bindBuffer(_gl.ARRAY_BUFFER, buffer);
		_gl.bufferData(_gl.ARRAY_BUFFER, vertices, _gl.STATIC_DRAW);
		
		return buffer;
	};
	
	this.createTexture = function() {
		
		// 3x1 pixel 1d texture
		/*
		var data = new Uint8Array([
			255,0,0,255, 
			0,255,0,255,
			0,0,255,255,
			0,0,255,255,
		]);
		*/
		
		var data = new Uint8Array(256*4);
		for ( i = 0; i < 256*4;i++ ) data[i] = 0;
		
		var tex = _gl.createTexture();
		_gl.bindTexture(_gl.TEXTURE_2D, tex);
		_gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, 256, 1, 0, _gl.RGBA, _gl.UNSIGNED_BYTE, data);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
		//_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_W, _gl.CLAMP_TO_EDGE);
		//_gl.bindTexture(_gl.TEXTURE_2D, null);
		return tex;
	};
	
	this.createShader = function ( type, string ) {

		var shader = _gl.createShader( type ); 

		_gl.shaderSource( shader, string );
		_gl.compileShader( shader );

		if ( _gl.getShaderParameter( shader, _gl.COMPILE_STATUS ) === false ) {

			console.log( 'WebGLShader: Shader couldn\'t compile.' );

		}

		if ( _gl.getShaderInfoLog( shader ) !== '' ) {

			console.log( 'WebGLShader: gl.getShaderInfoLog()'+ _gl.getShaderInfoLog( shader ) );

		}

		return shader;

	};
	
	this.createProgram = function() {

		console.log("create program");
		
		var vsSource = [
			"attribute vec2 pos;",
			"void main()",
			"{",
			"  gl_Position = vec4(pos.x,pos.y,0.0,1.0);",
			"}"
		].join("\n");

		var fsSource = [
			"precision highp  float;",
			"uniform sampler2D uSampler;",
			"uniform vec3      iResolution;",
			"uniform float     iGlobalTime;",
			"uniform float     iChannelTime[4];",
			"uniform vec4      iMouse;",
			"uniform vec4      iDate;",
			"uniform vec3      iChannelResolution[4];",
			"",
			"float FOCALLENGTH=1.5;",
			"float PI=3.14159265;",
			"",
			/*
			"float smin( float a, float b, float k )",
			"{",
			"	float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );",
			"	return mix( b, a, h ) - k*h*(1.0-h);",
			"}",
			*/
			/*
			"float smin( float a, float b, float k )",
			"{",
			"	float res = exp( -k*a ) + exp( -k*b );",
			"	return -log( res )/k;",
			"}",
			*/
			"",
			"float sdSphere( in vec3 p, in float s )",
			"{",
			"  return length(p)-s;",
			"}",
			"",
			"float udBox( vec3 p, vec3 b )",
			"{",
			"  return length(max(abs(p)-b,0.0))-0.05;",
			"}",			
			"",
			"float obj(in vec3 p, out vec3 color, out int type)",
			"{ ",
			"  float distance = abs(p.z - 16.0);",
			"  color = vec3(0.0,0.0,0.0);",
			"  type = 0;",
			"",
			"  int len = int(floor(texture2D(uSampler, vec2(0.0,0.0)).x * 255.0));",
			"",
			"  for ( int n = 0; n < 256; n++ ) {",
			"   if ( n == len ) break;",
			"   vec4 nm = texture2D(uSampler, vec2((float(n)+1.5)/256.0,0.0));",
			"   vec3 t = vec3(nm.x*128.0-8.0, nm.y*128.0-8.0+3.0, 6.0);",
			"   vec3 b = vec3(0.20,0.20,0.5+abs(sin(iGlobalTime*3.0+float(n)*PI*2.0/float(len)))*0.2);",
			"   float d = udBox(p-t,b);",
			"   if ( d < distance ) {",
			" 	 color = vec3(nm.z,nm.w,0.0);",
			"    distance = d;",
			"    type = 1;",
			//"    distance = smin(distance,d,32.0);",
			"   }",
			"  }",
			"",
			"  return distance;",
			"}",
			"",
			"float glow(in vec3 p)",
			"{ ",
			"  vec4 nm = texture2D(uSampler, vec2(1.5/256.0,0.0));",
			"  vec3 t = vec3(nm.x*128.0-8.0+0.5, nm.y*128.0-8.0+0.5, 11.0);",
			"  vec3 b = vec3(0.25,0.25,1.5);",
			"  return udBox(p-t,b);",
			"}",
			"",
			"vec3 normal(in vec3 p)",
			"{",
			"  int type;",
			"  vec3 col;",
			"  const float n_er=0.01;",
			"  float v1=obj(vec3(p.x+n_er,p.y-n_er,p.z-n_er), col, type);",
			"  float v2=obj(vec3(p.x-n_er,p.y-n_er,p.z+n_er), col, type);",
			"  float v3=obj(vec3(p.x-n_er,p.y+n_er,p.z-n_er), col, type);",
			"  float v4=obj(vec3(p.x+n_er,p.y+n_er,p.z+n_er), col, type);",
			"  return normalize(vec3(v4+v1-v3-v2,v3+v4-v1-v2,v2+v4-v3-v1));",
			"}",
			"",
			"vec3 ray(vec3 origin, vec3 direction, out float t, out int objfound, out vec3 n, out vec3 p) {",
			"  vec3 color = vec3(1.0,1.0,0.0);",
			"  t=FOCALLENGTH;",
			"  float s=t;",
			"  const float maxd = 60.0;",
			"  for(int i=0;i<256;i++){",
			"    p=origin+direction*t;",
			"    s=obj(p, color, objfound);",
			"    if (abs(s)<0.01||t>maxd) break;",
			"    t+=s;",
			"  }",
			"",
			"  n = normal(p);",
			"  return color;",
			"}",
			"",
			"void main(void){",
			"",
			//"  vec3 cameraPos=vec3(0,0.0,-1.0);",
			//"  vec3 cameraTarget=vec3(0,0.0,0);",
			"  vec3 cameraPos=vec3(0,-6.8,-1.0);",
			"  vec3 cameraTarget=vec3(0,-6.0,0.0);",
			"  vec3 cameraDir=normalize(cameraTarget-cameraPos);",
			"  vec3 cameraUp=vec3(0,1,0);",
			"  vec3 imagePlaneX=normalize(cross(cameraUp,cameraDir));",
			"  vec3 imagePlaneY=cross(cameraDir,imagePlaneX);",
			"",
			"  vec2 uv=-1.0+2.0*gl_FragCoord.xy/iResolution.xy;",
			"  vec3 rayDirection = normalize(cameraDir*FOCALLENGTH+uv.x*imagePlaneX+uv.y*imagePlaneY);",
			"",
			//"	uv.x *= iResolution.x/iResolution.y;",
			"",
			"  float f;",
			"  int objfound;",
			"  vec3 n;",
			"  vec3 p;",
			"  vec3 color = ray(cameraPos, rayDirection, f, objfound, n, p);",
			//"  color = texture2D(uSampler, vec2(0.50, 0.0)).xyz;",
			"",
			"  const vec3 light=vec3(0.2,-9.2,-5.2);",
			"  vec3 lightv=normalize(light-p);",
			"  float diffuse=dot(n,lightv);",
//			"  float g = clamp(glow(p),0.5,1.0);",
//			"  vec3 col = mix(color*diffuse,vec3(0.0,0.0,1.0),1.0-g);",
			"  vec3 col = color*diffuse;",
			"",
			"  float r = p.z-6.0;",
			"  if ( r > 0.0 ) {",
			"    col = col*max(0.5-r*2.0,0.0);",
			"  }",
			/*
			"  if ( objfound == 0 ) {",
			"     rayDirection=reflect(rayDirection,n);",
			"     vec3 color2 = ray(p, rayDirection*0.2, f, objfound, n, p);",
			"     color2=color2*max(1.0-f*.65,0.0);",
//			"     color = mix(color, color2, 0.5);",
			"     col = color2;",
			"  }",
			*/
			"",
			"",
			"  // gamma",
			"  col = pow( clamp(col,0.0,1.0), vec3(0.45) );",
			"",
			"  gl_FragColor=vec4(col,1.0);",
			"}"
		].join("\n");
		
		var program = _gl.createProgram();

		var vs = _this.createShader(_gl.VERTEX_SHADER, vsSource);
		var fs = _this.createShader(_gl.FRAGMENT_SHADER, fsSource);

		_gl.attachShader(program, vs);
		_gl.attachShader(program, fs);

		_gl.deleteShader(vs);
		_gl.deleteShader(fs);

		_gl.linkProgram(program);

		if( _gl.getProgramParameter(program, _gl.LINK_STATUS) === false ) {
			console.log( 'WebGLProgram: Program couldn\'t link.' );
		}

		if ( _gl.getProgramInfoLog( program ) !== '' ) {
			console.log( 'WebGLProgram: gl.getShaderInfoLog()'+ _gl.getProgramInfoLog( program ) );
			//_gl.deleteProgram( program );
		}

		_gl.useProgram( program );
		
		return program;

	};
};
