import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 4.2);

const canvas = document.createElement('canvas');
canvas.id = 'blob-canvas';
canvas.className = 'fixed inset-0 z-0 w-full h-full pointer-events-auto transition-opacity duration-1000';
document.body.prepend(canvas);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.enableZoom = true;

// --------------------------------------------------------
// BLOB SHADERS & MESH
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

const blobGeometry = new THREE.SphereGeometry(1.5, 256, 256);
const blobMaterial = new THREE.ShaderMaterial({
    vertexShader: blobVertexShader,
    fragmentShader: blobFragmentShader,
    uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) }
    },
    transparent: true
});
const blobMesh = new THREE.Mesh(blobGeometry, blobMaterial);
scene.add(blobMesh);

// --------------------------------------------------------
// RING SHADERS & MESH
// --------------------------------------------------------
const ringVertexShader = `
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
    vec3 getDisplacedPosition(vec3 p, vec3 n) {
        float noiseFreq = 0.65;
        float noiseAmp = 0.32; 
        vec3 noisePos1 = vec3(
            p.x * noiseFreq + uTime * 0.11 + uMouse.x * 0.25,
            p.y * noiseFreq + uTime * 0.13 + uMouse.y * 0.25,
            p.z * noiseFreq + uTime * 0.09
        );
        float n1 = snoise(noisePos1);
        vec3 noisePos2 = vec3(
            p.x * (noiseFreq * 2.2) - uTime * 0.16,
            p.y * (noiseFreq * 2.2) + uTime * 0.12,
            p.z * (noiseFreq * 2.2) - uTime * 0.18
        );
        float n2 = snoise(noisePos2) * 0.38;
        float totalNoise = (n1 + n2) * noiseAmp;
        return p + normalize(n) * totalNoise;
    }
    void main() {
        vUv = uv;
        vec3 localNormal = normalize(normal);
        vec3 tangent = vec3(1.0, 0.0, 0.0);
        if (abs(dot(localNormal, tangent)) > 0.9) {
            tangent = vec3(0.0, 1.0, 0.0);
        }
        vec3 bitangent = normalize(cross(localNormal, tangent));
        tangent = cross(bitangent, localNormal);
        float epsilon = 0.006;
        vec3 p = position;
        vec3 pTangent = position + tangent * epsilon;
        vec3 pBitangent = position + bitangent * epsilon;
        vec3 dp = getDisplacedPosition(p, localNormal);
        vec3 dpTangent = getDisplacedPosition(pTangent, localNormal);
        vec3 dpBitangent = getDisplacedPosition(pBitangent, localNormal);
        vec3 calculatedNormal = normalize(cross(dpTangent - dp, dpBitangent - dp));
        vWorldNormal = normalize((modelMatrix * vec4(calculatedNormal, 0.0)).xyz);
        vNormal = normalMatrix * calculatedNormal;
        vec4 worldPos = modelMatrix * vec4(dp, 1.0);
        vPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

const ringFragmentShader = `
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
        finalColor += rimColor * rimLight * 1.85;
        finalColor += innerColor * innerBand * 0.55;
        finalColor += vec3(1.0, 0.9, 0.7) * extremeRim * 0.65;
        float voidMask = smoothstep(0.15, 0.45, invFresnel);
        finalColor *= voidMask;
        float grain = (random(gl_FragCoord.xy * 0.05 + uTime) - 0.5) * 0.08;
        finalColor += grain;
        finalColor = pow(finalColor, vec3(1.1));
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

const ringGeometry = new THREE.TorusGeometry(1.0, 0.36, 160, 320);
const ringMaterial = new THREE.ShaderMaterial({
    vertexShader: ringVertexShader,
    fragmentShader: ringFragmentShader,
    uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) }
    },
    transparent: true,
    side: THREE.DoubleSide
});
const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
scene.add(ringMesh);

// --------------------------------------------------------
// Visibility & Positioning Management
// --------------------------------------------------------

const blobTargets = [
    { x: -1.0, y: -0.2, scale: 1.0 }, // Section 0: Hero
    { x: 0.0, y: 0.0, scale: 1.0 },   // Section 1: Services (Hidden)
    { x: 0.0, y: 0.0, scale: 1.0 },   // Section 2: Socials (Hidden)
    { x: 0.0, y: 0.0, scale: 2.0 }    // Section 3: CTA (Half Zoomed in)
];

const ringTargets = { x: 0.0, y: 0.0, scale: 1.5 }; // Default Socials scale
let currentRingTarget = { ...ringTargets };

let currentBlobTarget = blobTargets[0];

blobMesh.position.set(currentBlobTarget.x, currentBlobTarget.y, 0);
blobMesh.scale.set(currentBlobTarget.scale, currentBlobTarget.scale, currentBlobTarget.scale);

ringMesh.position.set(currentRingTarget.x, currentRingTarget.y, 0);
ringMesh.scale.set(currentRingTarget.scale, currentRingTarget.scale, currentRingTarget.scale);
ringMesh.visible = false; // Hidden initially

let currentActiveModel = blobMesh;

// Listen for section changes from scrollytelling.js
window.addEventListener('sectionChanged', (e) => {
    const index = e.detail.index;
    
    if (index === 0) {
        // Hero Section -> Show Blob
        canvas.style.opacity = '1';
        blobMesh.visible = true;
        ringMesh.visible = false;
        currentBlobTarget = blobTargets[0];
    } else if (index === 1) {
        // Services Section -> Hide Canvas to show CSS Gradient Background
        canvas.style.opacity = '0'; // Smoothly fades out via Tailwind transition-opacity
    } else if (index === 2) {
        // Socials Section -> Show Ring
        canvas.style.opacity = '1';
        blobMesh.visible = false;
        ringMesh.visible = true;
        currentRingTarget = { x: 0.0, y: 0.0, scale: 1.5 };
    } else if (index === 3) {
        // CTA Section -> Show Ring Zoomed In
        canvas.style.opacity = '1';
        blobMesh.visible = false;
        ringMesh.visible = true;
        currentRingTarget = { x: 0.0, y: 0.0, scale: 3.5 };
    }
});


// --------------------------------------------------------
// Mouse Tracking & Animation
// --------------------------------------------------------
const targetMouse = new THREE.Vector2();
const currentMouse = new THREE.Vector2();

window.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        targetMouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
}, { passive: true });

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
    ringMaterial.uniforms.uTime.value = time;

    currentMouse.lerp(targetMouse, 0.05);
    blobMaterial.uniforms.uMouse.value.copy(currentMouse);
    ringMaterial.uniforms.uMouse.value.copy(currentMouse);

    // Smoothly interpolate the blob's position and scale towards the target
    blobMesh.position.x += (currentBlobTarget.x - blobMesh.position.x) * 0.04;
    blobMesh.position.y += (currentBlobTarget.y - blobMesh.position.y) * 0.04;
    blobMesh.scale.x += (currentBlobTarget.scale - blobMesh.scale.x) * 0.04;
    blobMesh.scale.y += (currentBlobTarget.scale - blobMesh.scale.y) * 0.04;
    blobMesh.scale.z += (currentBlobTarget.scale - blobMesh.scale.z) * 0.04;

    // Smoothly interpolate the ring's scale towards the target
    ringMesh.scale.x += (currentRingTarget.scale - ringMesh.scale.x) * 0.04;
    ringMesh.scale.y += (currentRingTarget.scale - ringMesh.scale.y) * 0.04;
    ringMesh.scale.z += (currentRingTarget.scale - ringMesh.scale.z) * 0.04;

    if (blobMesh.visible) {
        blobMesh.rotation.y += 0.001;
    }

    if (ringMesh.visible) {
        ringMesh.rotation.x += 0.001;
        ringMesh.rotation.y += 0.0025;
        ringMesh.rotation.z += 0.001;
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();
