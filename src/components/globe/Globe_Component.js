import React, { Component } from "react";
import * as THREE from "three";
import dayMap from "../../assets/img/earth_daymap.jpg";
import nightMap from "../../assets/img/earth_nightmap.jpg";

// For interactions
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

class GlobeComp extends Component {
    componentDidMount() {
        // Size
        const sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        const textureLoader = new THREE.TextureLoader();
        this.scene = new THREE.Scene();

        //Add Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(sizes.width, sizes.height);
        this.mount.appendChild(this.renderer.domElement);

        //add Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            sizes.width / sizes.height,
            0.1,
            1000
        );
        this.camera.position.z = 12.5;

        //Camera Controls
        // const controls = new OrbitControls(this.camera, this.renderer.domElement);

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
        this.scene.add(stars);

        // Lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 3, -4.5);

        // Globe
        const globe = new THREE.Mesh(
            new THREE.SphereGeometry(5, 50, 50),
            new THREE.ShaderMaterial({
                vertexShader: this.vertexShader(),
                fragmentShader: this.fragmentShader(),
                uniforms: {
                    sunPosition: { type: "v3", value: light.position },
                    dayTexture: {
                        type: "t",
                        value: textureLoader.load(dayMap),
                    },
                    nightTexture: {
                        type: "t",
                        value: textureLoader.load(nightMap),
                    },
                },
            })
        );

        // Atmosphere
        const atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(5, 50, 50),
            new THREE.ShaderMaterial({
                vertexShader: this.atmosphereVertexShader(),
                fragmentShader: this.atmosphereFragmentShader(),
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
            })
        );
        atmosphere.scale.set(1.1, 1.1, 1.1);

        // Group globe atmosphere and lighting
        this.group = new THREE.Group();
        this.group.add(globe);
        this.group.add(atmosphere);
        this.group.add(light);
        this.scene.add(this.group);

        this.renderScene();
        //start animation
        this.start();

        window.addEventListener("resize", () => {
            // Update sizes
            sizes.width = window.innerWidth;
            sizes.height = window.innerHeight;
            console.log(sizes);
            // Update camera
            this.camera.aspect = sizes.width / sizes.height;
            this.camera.updateProjectionMatrix();

            // Update renderer
            this.renderer.setSize(sizes.width, sizes.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        this.mouseX = 0;
        this.mouseY = 0;

        this.targetX = 0;
        this.targetY = 0;

        this.clock = new THREE.Clock();
        const windowX = window.innerWidth / 2;
        const windowY = window.innerHeight / 2;

        const onDocumentMouseMove = (event) => {
            this.mouseX = event.clientX - windowX;
            this.mouseY = event.clientY - windowY;
        };
        document.addEventListener("mousemove", onDocumentMouseMove);
    }

    componentWillUnmount() {
        this.stop();
        this.mount.removeChild(this.renderer.domElement);
    }
    start = () => {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate);
        }
    };
    stop = () => {
        cancelAnimationFrame(this.frameId);
    };
    animate = () => {
        //Rotate Models
        // this.targetX = this.mouseX * 0.001
        // this.targetY = this.mouseY * 0.001

        const elapsedTime = this.clock.getElapsedTime();

        // Update objects
        this.group.rotation.y = 0.15 * elapsedTime;
        // this.group.rotation.y += 0.5 * (this.targetX - this.group.rotation.y)
        // this.group.rotation.x += 0.05 * (this.targetY - this.group.rotation.x)
        // this.group.position.z += -0.05 * (this.targetY - this.group.rotation.x)

        this.renderScene();
        this.frameId = window.requestAnimationFrame(this.animate);
    };
    renderScene = () => {
        if (this.renderer) this.renderer.render(this.scene, this.camera);
    };

    /**
     * Globe Vertex Shader
     */
    vertexShader() {
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
    }

    /**
     * Globe Fragment Shader
     */
    fragmentShader() {
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
    }

    /**
     * Atmosphere Vertex Shader
     */
    atmosphereVertexShader() {
        return `
      varying vec3 vertextNormal;
      void main() {
          vertextNormal = normalize(normalMatrix * normal); // default variable given by threejs
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      } 
    `;
    }

    /**
     * Atmosphere Fragment Shader
     */
    atmosphereFragmentShader() {
        return `
      varying vec3 vertextNormal;
      void main() {
          float intensity = pow(0.6 - dot(vertextNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
      }
    `;
    }

    render() {
        return (
            <div
                ref={(mount) => {
                    this.mount = mount;
                }}
            />
        );
    }
}
export default Globe;
