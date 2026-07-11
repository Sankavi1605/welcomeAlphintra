import * as THREE from 'three';

// 1. Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 5);

const canvas = document.createElement('canvas');
canvas.id = 'blob-canvas';
canvas.className = 'fixed inset-0 z-0 w-full h-full pointer-events-auto transition-opacity duration-1000';
document.body.prepend(canvas);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --------------------------------------------------------
// BLOB SHADERS (Unchanged from original)
// --------------------------------------------------------
const blobVertexShader = `
    uniform float uTime;
    uniform vec2 uMouse;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute( permute( permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 1.0/7.0;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }
    vec3 getDisplacedPosition(vec3 p) {
        float noiseFreq = 0.6;
        float noiseAmp = 0.45;
        vec3 noisePos = vec3(
            p.x * noiseFreq + uTime * 0.15 + uMouse.x * 0.3,
            p.y * noiseFreq + uTime * 0.15 + uMouse.y * 0.3,
            p.z * noiseFreq + uTime * 0.1
        );
        float n = snoise(noisePos) * noiseAmp;
        return p + normalize(p) * n;
    }
    void main() {
        vUv = uv;
        float offset = 0.02;
        vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
        if (length(tangent) < 0.1) tangent = normalize(cross(normal, vec3(1.0, 0.0, 0.0)));
        vec3 bitangent = cross(normal, tangent);
        vec3 p = position;
        vec3 p1 = position + tangent * offset;
        vec3 p2 = position + bitangent * offset;
        vec3 dp = getDisplacedPosition(p);
        vec3 dp1 = getDisplacedPosition(p1);
        vec3 dp2 = getDisplacedPosition(p2);
        vec3 newNormal = normalize(cross(dp1 - dp, dp2 - dp));
        vWorldNormal = normalize((modelMatrix * vec4(newNormal, 0.0)).xyz);
        vNormal = normalMatrix * newNormal;
        vec4 worldPos = modelMatrix * vec4(dp, 1.0);
        vPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

const blobFragmentShader = `
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    void main() {
        vec3 normal = normalize(vNormal);
        vec3 worldN = normalize(vWorldNormal);
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float fresnel = max(0.0, dot(viewDir, normal));
        float invFresnel = clamp(1.0 - fresnel, 0.0, 1.0);
        float rimLight = pow(invFresnel, 1.8);
        float extremeRim = pow(invFresnel, 4.0);
        
        // Original Deep Blue/Purple palette
        vec3 colorDeepBlue = vec3(0.0, 0.1, 0.9);
        vec3 colorPurple   = vec3(0.6, 0.0, 1.0);
        vec3 colorCyan     = vec3(0.2, 0.5, 1.0);
        
        vec3 rimColor = colorDeepBlue;
        float mixX = smoothstep(-0.6, 0.8, worldN.x);
        rimColor = mix(rimColor, colorCyan, mixX);
        float mixY = smoothstep(-0.4, 0.8, worldN.y);
        rimColor = mix(rimColor, colorPurple, mixY * (1.0 - mixX * 0.4));
        
        vec3 innerColor = mix(vec3(0.2, 0.0, 0.6), colorCyan, mixX);
        float innerBand = smoothstep(0.1, 0.5, invFresnel) * smoothstep(0.8, 0.4, invFresnel);
        
        vec3 finalColor = vec3(0.0);
        finalColor += rimColor * rimLight * 1.8;
        finalColor += innerColor * innerBand * 0.5;
        finalColor += vec3(1.0, 0.9, 0.7) * extremeRim * 0.6;
        
        float voidMask = smoothstep(0.15, 0.45, invFresnel);
        finalColor *= voidMask;
        
        float grain = (random(gl_FragCoord.xy * 0.05 + uTime) - 0.5) * 0.1;
        finalColor += grain;
        
        finalColor = pow(finalColor, vec3(1.1));
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

// --------------------------------------------------------
// 3D BLOB SWARM CREATION
// --------------------------------------------------------
const blobGeometry = new THREE.SphereGeometry(1.2, 128, 128);
const blobMaterial = new THREE.ShaderMaterial({
    vertexShader: blobVertexShader,
    fragmentShader: blobFragmentShader,
    uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) }
    },
    transparent: true
});

const NUM_BLOBS = 2;
const blobs = [];
const blobTargets = [];

// Base targets for each section scroll state
// State 0: Hero, State 1: Services, State 2: Socials, State 3: CTA
const layoutTargets = [
    // Section 0 (Hero): Main blob left, other scattered behind
    [
        { x: -1.2, y: 0.2, z: 0, s: 2.0 }, // Main
        { x: 3.0, y: 2.0, z: -4, s: 1.4 }
    ],
    // Section 1 (Services): Main blob right, other converges
    [
        { x: 1.5, y: -0.3, z: 0, s: 2.2 }, // Main
        { x: -3.0, y: -1.0, z: -4, s: 1.5 }
    ],
    // Section 2 (Socials): Main blob centered large, other spreads out
    [
        { x: 0.0, y: 0.0, z: -1, s: 2.6 }, // Main
        { x: -4.0, y: -3.0, z: -6, s: 1.8 }
    ],
    // Section 3 (CTA): Main blob zoomed in background, other floats around
    [
        { x: 0.0, y: 0.5, z: -2, s: 4.0 }, // Main
        { x: 3.0, y: 1.5, z: -3, s: 1.2 }
    ]
];

for (let i = 0; i < NUM_BLOBS; i++) {
    const mesh = new THREE.Mesh(blobGeometry, blobMaterial);
    
    // Initial setup from Section 0
    const target = layoutTargets[0][i];
    mesh.position.set(target.x, target.y, target.z);
    mesh.scale.set(target.s, target.s, target.s);
    
    // Give each blob a random rotation offset so they look unique
    mesh.rotation.x = Math.random() * Math.PI * 2;
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.rotation.z = Math.random() * Math.PI * 2;
    
    scene.add(mesh);
    blobs.push({
        mesh: mesh,
        rotSpeedX: (Math.random() - 0.5) * 0.002,
        rotSpeedY: (Math.random() - 0.5) * 0.002 + 0.001
    });
    blobTargets.push({ ...target });
}

// Listen for section changes from scrollytelling.js
window.addEventListener('sectionChanged', (e) => {
    const index = e.detail.index;
    if (layoutTargets[index]) {
        for (let i = 0; i < NUM_BLOBS; i++) {
            blobTargets[i] = { ...layoutTargets[index][i] };
        }
    }
});


// --------------------------------------------------------
// PARTICLE SYSTEM
// --------------------------------------------------------
const particleCount = 1500;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i++) {
    // Spread widely across X, Y, Z
    particlePositions[i] = (Math.random() - 0.5) * 25;
}
particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

// Create a soft glowing dot texture for particles
const pCanvas = document.createElement('canvas');
pCanvas.width = 32;
pCanvas.height = 32;
const pCtx = pCanvas.getContext('2d');
const gradient = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
pCtx.fillStyle = gradient;
pCtx.fillRect(0, 0, 32, 32);
const particleTexture = new THREE.CanvasTexture(pCanvas);

const particleMaterial = new THREE.PointsMaterial({
    size: 0.08,
    map: particleTexture,
    transparent: true,
    opacity: 0.5,
    color: 0x66aaff, // subtle cyan/blue
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);


// --------------------------------------------------------
// Mouse Tracking & Animation
// --------------------------------------------------------
const targetMouse = new THREE.Vector2();
const currentMouse = new THREE.Vector2();

window.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const time = clock.getElapsedTime();
    blobMaterial.uniforms.uTime.value = time;

    currentMouse.lerp(targetMouse, 0.05);
    blobMaterial.uniforms.uMouse.value.copy(currentMouse);

    // Parallax & Smooth Transitions for all blobs
    blobs.forEach((blobObj, i) => {
        const mesh = blobObj.mesh;
        const target = blobTargets[i];
        
        // Smoothly interpolate position and scale
        mesh.position.x += (target.x - mesh.position.x) * 0.03;
        mesh.position.y += (target.y - mesh.position.y) * 0.03;
        mesh.position.z += (target.z - mesh.position.z) * 0.03;
        mesh.scale.x += (target.s - mesh.scale.x) * 0.03;
        mesh.scale.y += (target.s - mesh.scale.y) * 0.03;
        mesh.scale.z += (target.s - mesh.scale.z) * 0.03;

        // Apply continuous rotation
        mesh.rotation.x += blobObj.rotSpeedX;
        mesh.rotation.y += blobObj.rotSpeedY;
    });

    // Slowly drift particles
    particles.rotation.y = time * 0.02;
    particles.rotation.x = time * 0.01;

    renderer.render(scene, camera);
}

animate();
