import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import dayMap from "../../assets/img/earth_daymap.jpg";
import nightMap from "../../assets/img/earth_nightmap.jpg";

function Globe() {
    const mountRef = useRef(null);

    /**
     * Globe Vertex Shader
     */
    const vertexShader = () => {
        return `
            varying vec2 vPosition;
            varying vec3 vNormal;
            varying vec3 vVertToLight;
            uniform vec3 sunPosition;

            void main() {
                vPosition = uv;
                vNormal = normalMatrix * normal;
                vec4 worldPosition = modelViewMatrix * vec4(position, 1.0);
                vVertToLight = normalize(sunPosition - worldPosition.xyz);
                gl_Position = projectionMatrix * worldPosition;
            }
        `;
    };

    /**
     * Globe Fragment Shader
     */
    const fragmentShader = () => {
        return `
            uniform sampler2D dayTexture;
            uniform sampler2D nightTexture;
            varying vec2 vPosition;
            varying vec3 vNormal;
            varying vec3 vVertToLight;

            void main( void ) {
                vec3 dayColor = texture2D(dayTexture, vPosition).rgb;
                vec3 nightColor = texture2D(nightTexture, vPosition).rgb;
                vec3 fragToLight = normalize(vVertToLight);
                float cosineAngleSunToNormal = dot(normalize(vNormal), fragToLight);
                cosineAngleSunToNormal = clamp(cosineAngleSunToNormal * 10.0, -1.0, 1.0);
                float mixAmount = cosineAngleSunToNormal * 0.5 + 0.5;
                vec3 color = mix(nightColor, dayColor, mixAmount);

                gl_FragColor = vec4( color, 1.0 );

            }
        `;
    };

    /**
     * Atmosphere Vertex Shader
     */
    const atmosphereVertexShader = () => {
        return `
            varying vec3 vertextNormal;
            void main() {
                vertextNormal = normalize(normalMatrix * normal); // default variable given by threejs
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            } 
        `;
    };

    /**
     * Atmosphere Fragment Shader
     */
    const atmosphereFragmentShader = () => {
        return `
            varying vec3 vertextNormal;
            void main() {
                float intensity = pow(0.6 - dot(vertextNormal, vec3(0, 0, 1.0)), 2.0);
                gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
            }
        `;
    };

    useEffect(() => {
        // Scence and Camera
        const scene = new THREE.Scene();
        const group = new THREE.Group();
        const mount = mountRef.current;

        // Loading Manager for Textures
        const getTextures = () =>
            new Promise((resolve, reject) => {
                const manager = new THREE.LoadingManager(() =>
                    resolve(textures)
                );
                const loader = new THREE.TextureLoader(manager);

                const textures = {
                    day: dayMap,
                    night: nightMap,
                };

                Object.keys(textures).map(function (key, index) {
                    return (textures[key] = loader.load(textures[key]));
                });
            });

        getTextures().then((result) => {
            // hide loader
            const loadingScreen = document.getElementById("loading-screen");
            loadingScreen.classList.add("fade-out");

            // Lighting
            const light = new THREE.DirectionalLight(0xffffff, 1);
            light.position.set(5, 3, -4.5);

            // Globe
            const globe = new THREE.Mesh(
                new THREE.SphereGeometry(5, 50, 50),
                new THREE.ShaderMaterial({
                    vertexShader: vertexShader(),
                    fragmentShader: fragmentShader(),
                    uniforms: {
                        sunPosition: { type: "v3", value: light.position },
                        dayTexture: { type: "t", value: result.day },
                        nightTexture: { type: "t", value: result.night },
                    },
                })
            );

            // Atmosphere
            const atmosphere = new THREE.Mesh(
                new THREE.SphereGeometry(5, 50, 50),
                new THREE.ShaderMaterial({
                    vertexShader: atmosphereVertexShader(),
                    fragmentShader: atmosphereFragmentShader(),
                    blending: THREE.AdditiveBlending,
                    side: THREE.BackSide,
                })
            );
            atmosphere.scale.set(1.1, 1.1, 1.1);

            // Group globe atmosphere and lighting
            group.add(globe);
            group.add(atmosphere);
            group.add(light);
            scene.add(group);

            // Stars
            const starGeometry = new THREE.BufferGeometry();
            const starMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
            });

            // generate stars position
            const starVertices = [];
            for (let i = 0; i < 5000; i++) {
                // behind front
                const x = (Math.random() - 0.5) * 2000;
                const y = (Math.random() - 0.5) * 2000;
                const z = Math.random() * 2000;
                starVertices.push(x, y, z);

                // behind stars
                const x2 = (Math.random() - 0.5) * 2000;
                const y2 = (Math.random() - 0.5) * 2000;
                const z2 = -Math.random() * 2000;
                starVertices.push(x2, y2, z2);
            }

            starGeometry.setAttribute(
                "position",
                new THREE.Float32BufferAttribute(starVertices, 3)
            );

            const stars = new THREE.Points(starGeometry, starMaterial);
            scene.add(stars);
        });

        // Size
        const sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        window.addEventListener("resize", () => {
            // Update sizes
            sizes.width = window.innerWidth;
            sizes.height = window.innerHeight;

            // Update camera
            camera.aspect = sizes.width / sizes.height;
            camera.updateProjectionMatrix();

            // Update renderer
            renderer.setSize(sizes.width, sizes.height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        // Camera
        const camera = new THREE.PerspectiveCamera(
            75,
            sizes.width / sizes.height,
            0.1,
            1000
        );
        camera.position.z = 12.5;

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(sizes.width, sizes.height);
        mountRef.current.appendChild(renderer.domElement);

        // Controls
        // const controls = new OrbitControls(camera, canvas)
        // controls.enableDamping = true

        // Animate
        // for Interactions
        // let mouseX = 0
        // let mouseY = 0

        // let targetX = 0
        // let targetY = 0

        // const windowX = window.innerWidth / 2;
        // const windowY = window.innerHeight / 2;

        // const onDocumentMouseMove = (event) => {
        //     mouseX = (event.clientX - windowX)
        //     mouseY = (event.clientY - windowY)
        // }
        // document.addEventListener('mousemove', onDocumentMouseMove)

        // Move sphere to top slowing while scrolling
        // const updateSphere = (event) => {
        //   group.position.y = window.scrollY * 0.001
        // }
        // window.addEventListener('scroll', updateSphere)

        const clock = new THREE.Clock();
        const tick = () => {
            // targetX = mouseX * 0.001
            // targetY = mouseY * 0.001

            const elapsedTime = clock.getElapsedTime();

            // Update objects
            group.rotation.y = 0.15 * elapsedTime;
            // group.rotation.y += 0.5 * (targetX - group.rotation.y)
            // group.rotation.x += 0.05 * (targetY - group.rotation.x)
            // group.position.z += -0.05 * (targetY - group.rotation.x)

            // Render
            renderer.render(scene, camera);

            // Call tick again on the next frame
            window.requestAnimationFrame(tick);
        };

        tick();

        return () => {
            mountRef.current = mount;
        };
    }, []);

    return (
        <div>
            <section id="loading-screen">
                <div id="loader"></div>
            </section>

            <div ref={mountRef}></div>
        </div>
    );
}

export default Globe;
