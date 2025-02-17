import * as THREE from 'three'


const vertexShader = `
    varying vec2 vUv;
    uniform vec2 uResolution;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`

const fragmentShader = `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform sampler2D uNormals;
    uniform float timerRandoms[32];

    varying vec2 vUv;

    float rand(vec2 co){
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float randDispl(float xCoord, float yCoord, float resolutionX, float resolutionY, float factor, vec4 randVariables){
        float randNum = rand(vec2(xCoord, yCoord));
        float disp = ((1.0 + randNum) * (sin(yCoord*resolutionY / randVariables.x)) * factor + (1.0 + randNum) * (sin(yCoord*resolutionY / randVariables.y)) * factor  + (1.0 + randNum) * (sin(yCoord*resolutionY / randVariables.z)) * factor  + (1.0 + randNum) * (sin(yCoord*resolutionY / randVariables.w)) * factor) / 4.0;
        return disp;
    }

    float valueAtPoint(sampler2D image, vec2 coord, vec2 texel, vec2 point) {
        vec3 luma = vec3(0.299, 0.587, 0.114);
        // here we have a rand so we have the pencil line effect
        // 2.0*rand(coord)*
        return dot(texture2D(image, coord + texel * point).xyz, luma);
    }

    float diffuseValue(float x, float y) {
        return valueAtPoint(tDiffuse, vUv, vec2(1.0 / uResolution.x, 1.0 / uResolution.y), vec2(x, y)) * 0.6;
    }
    float normalValue(float x, float y) {
        return valueAtPoint(uNormals, vUv, vec2(1.0 / uResolution.x, 1.0 / uResolution.y), vec2(x, y)) * 0.4;
    }

    float getValue(float x, float y) {
        return diffuseValue(x, y) + normalValue(x, y);
    }

    float combinedSobelValue() {
        // kernel definition (in glsl matrices are filled in column-major order)
        const mat3 Gx = mat3(-1, -2, -1, 0, 0, 0, 1, 2, 1);// x direction kernel
        const mat3 Gy = mat3(-1, 0, 1, -2, 0, 2, -1, 0, 1);// y direction kernel

        // fetch the 3x3 neighbourhood of a fragment

        // first column
        float xDisp = randDispl(vUv.x, vUv.y, uResolution.x, uResolution.y, 1.5, vec4(22.0, 13.0, 37.0, 89.0));
        float yDisp = randDispl(vUv.y, vUv.x, uResolution.y, uResolution.x, 1.5, vec4(22.0, 13.0, 37.0, 89.0));

        float tx0y0 = getValue(-1.0+ xDisp, -1.0 + yDisp);
        float tx0y1 = getValue(-1.0+ xDisp, 0.0 + yDisp);
        float tx0y2 = getValue(-1.0+ xDisp, 1.0 + yDisp);

        // second column
        float tx1y0 = getValue(0.0+ xDisp, -1.0 + yDisp);
        float tx1y1 = getValue(0.0+ xDisp, 0.0 + yDisp);
        float tx1y2 = getValue(0.0+ xDisp, 1.0 + yDisp);

        // third column
        float tx2y0 = getValue(1.0+ xDisp, -1.0 + yDisp);
        float tx2y1 = getValue(1.0+ xDisp, 0.0 + yDisp);
        float tx2y2 = getValue(1.0+ xDisp, 1.0 + yDisp);

        // gradient value in x direction
        float valueGx = Gx[0][0] * tx0y0 + Gx[1][0] * tx1y0 + Gx[2][0] * tx2y0 +
        Gx[0][1] * tx0y1 + Gx[1][1] * tx1y1 + Gx[2][1] * tx2y1 +
        Gx[0][2] * tx0y2 + Gx[1][2] * tx1y2 + Gx[2][2] * tx2y2;

        // gradient value in y direction
        float valueGy = Gy[0][0] * tx0y0 + Gy[1][0] * tx1y0 + Gy[2][0] * tx2y0 +
        Gy[0][1] * tx0y1 + Gy[1][1] * tx1y1 + Gy[2][1] * tx2y1 +
        Gy[0][2] * tx0y2 + Gy[1][2] * tx1y2 + Gy[2][2] * tx2y2;

        // magnitude of the total gradient
        float G = (valueGx * valueGx) + (valueGy * valueGy);
        return clamp(G, 0.0, 1.0);
    }

    float luma(vec4 color){
        return 0.2126*color.x + 0.7152*color.y + 0.0722*color.z;
    }
    vec3 czm_saturation(vec3 rgb, float adjustment)
    {
        // Algorithm from Chapter 16 of OpenGL Shading Language
        const vec3 W = vec3(0.2125, 0.7154, 0.0721);
        vec3 intensity = vec3(dot(rgb, W));
        return mix(intensity, rgb, adjustment);
    }



    void main() {
        float sobelValue = combinedSobelValue();
        sobelValue = smoothstep(0.01, 0.03, sobelValue);

        vec4 lineColor = vec4(0.0, 0.0, 0.0, 1.0);

        if (sobelValue > 0.1) {
            gl_FragColor = lineColor;
        } else {
            vec4 normalColor = texture2D(uNormals, vUv);

            // now we make the texture
            if (normalColor.x > 2000.0 && normalColor.y > 2000.0 && normalColor.z > 2000.0){
                gl_FragColor = vec4(240.0/255.0, 234.0/255.0, 214.0/255.0, 1.0);
            }else if (normalColor.x > 100.0 && normalColor.y > 100.0 && normalColor.z > 100.0){
                gl_FragColor = vec4(czm_saturation((texture2D(tDiffuse, vUv) * 0.5 + vec4(240.0/255.0, 234.0/255.0, 214.0/255.0, 1.0) * 0.5).xyz, 0.4), 1.0);
            }else{
                // we will also need to distort the texture a bit


                float xDisps[5] = float[](randDispl(vUv.x, vUv.y, uResolution.x, uResolution.y, 1.5 / uResolution.x, vec4(22.0, 13.0, 37.0, 89.0)), randDispl(vUv.x, vUv.y, uResolution.x, uResolution.y, 1.5 / uResolution.x, vec4(timerRandoms[0], timerRandoms[1], timerRandoms[2], timerRandoms[3])), randDispl(vUv.x, vUv.y, uResolution.x, uResolution.y, 1.5 / uResolution.x, vec4(timerRandoms[4], timerRandoms[5], timerRandoms[6], timerRandoms[7])), randDispl(vUv.x, vUv.y, uResolution.x, uResolution.y, 1.5 / uResolution.x, vec4(timerRandoms[8], timerRandoms[9], timerRandoms[10], timerRandoms[11])), randDispl(vUv.x, vUv.y, uResolution.x, uResolution.y, 1.5 / uResolution.x, vec4(timerRandoms[12], timerRandoms[13], timerRandoms[14], timerRandoms[15])));

                float yDisps[5] = float[](randDispl(vUv.y, vUv.x, uResolution.y, uResolution.x, 1.5 / uResolution.y, vec4(22.0, 13.0, 37.0, 89.0)), randDispl(vUv.y, vUv.x, uResolution.y, uResolution.x, 1.5 / uResolution.y, vec4(timerRandoms[16], timerRandoms[17], timerRandoms[18], timerRandoms[19])), randDispl(vUv.y, vUv.x, uResolution.y, uResolution.x, 1.5 / uResolution.y, vec4(timerRandoms[20], timerRandoms[21], timerRandoms[22], timerRandoms[23])), randDispl(vUv.y, vUv.x, uResolution.y, uResolution.x, 1.5 / uResolution.y, vec4(timerRandoms[24], timerRandoms[25], timerRandoms[26], timerRandoms[7])), randDispl(vUv.y, vUv.x, uResolution.y, uResolution.x, 1.5 / uResolution.y, vec4(timerRandoms[28], timerRandoms[29], timerRandoms[30], timerRandoms[31])));


                vec2 vUvNew = vUv + vec2(xDisps[0], yDisps[0]);
                gl_FragColor =  vec4(czm_saturation(texture2D(tDiffuse, vUvNew).xyz, 0.3), 1.0);

                vec4 pixelColor = texture2D(tDiffuse, vUvNew);
                float pixelLuma = luma(pixelColor);
                if (pixelLuma <= 0.32){
                    float stripe = mod((vUv.y * uResolution.y + vUv.x * uResolution.x) / 17.7, 4.0);
                    if (stripe <= 1.0){
                        vec2 vUvStripe = vUv + vec2(xDisps[1], yDisps[1]);
                        if (mod(vUvStripe.x * uResolution.x, 17.7) <=1.5){
                            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                        }
                    }else if (stripe <= 2.0){
                        vec2 vUvStripe = vUv + vec2(xDisps[2], yDisps[2]);
                        if (mod(vUvStripe.x * uResolution.x, 17.7) <=1.5){
                            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                        }
                    }
                    else if (stripe <= 3.0){
                        vec2 vUvStripe = vUv + vec2(xDisps[2], yDisps[2]);
                        if (mod(vUvStripe.x * uResolution.x, 17.7) <=1.5){
                            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                        }
                    }
                    else if (stripe <= 4.0){
                        vec2 vUvStripe = vUv + vec2(xDisps[3], yDisps[3]);
                        if (mod(vUvStripe.x * uResolution.x, 17.7) <=1.5){
                            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                        }
                    }
                }
                // if (pixelLuma <= 0.48){
                //     float stripe = mod((vUv.y * uResolution.y + vUv.x * uResolution.x) / 17.7, 4.0);
                //     if (stripe <= 1.0){
                //         vec2 vUvStripe = vUv + vec2(xDisps[1], yDisps[1]);
                //         if (mod(vUvStripe.y * uResolution.y, 17.7) <=1.5){
                //             gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                //         }
                //     }else if (stripe <= 2.0){
                //         vec2 vUvStripe = vUv + vec2(xDisps[2], yDisps[2]);
                //         if (mod(vUvStripe.y * uResolution.y, 17.7) <=1.5){
                //             gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                //         }
                //     }
                //     else if (stripe <= 3.0){
                //         vec2 vUvStripe = vUv + vec2(xDisps[2], yDisps[2]);
                //         if (mod(vUvStripe.y * uResolution.y, 17.7) <=1.5){
                //             gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                //         }
                //     }
                //     else if (stripe <= 4.0){
                //         vec2 vUvStripe = vUv + vec2(xDisps[3], yDisps[3]);
                //         if (mod(vUvStripe.y * uResolution.y, 17.7) <=1.5){
                //             gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                //         }
                //     }
                // }
                // if (pixelLuma <= 0.64){
                //     float stripe = mod((-vUv.y * uResolution.y + vUv.x * uResolution.x) / (17.7 + 5.0 * sin(-vUv.y * uResolution.y + vUv.x * uResolution.x)), 4.0);
                //     if (stripe <= 1.0){
                //         vec2 vUvStripe = vUv + vec2(xDisps[1], yDisps[1]);
                //         if (mod(-vUvStripe.y * uResolution.y + vUvStripe.x * uResolution.x, 17.7) <=1.5){
                //             gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                //         }
                //     }else if (stripe <= 2.0){
                //         vec2 vUvStripe = vUv + vec2(xDisps[2], yDisps[2]);
                //         if (mod(-vUvStripe.y * uResolution.y + vUvStripe.x * uResolution.x, 17.7) <=1.5){
                //             gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                //         }
                //     }
                //     else if (stripe <= 3.0){
                //         vec2 vUvStripe = vUv + vec2(xDisps[2], yDisps[2]);
                //         if (mod(-vUvStripe.y * uResolution.y + vUvStripe.x * uResolution.x, 17.7) <=1.5){
                //             gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                //         }
                //     }
                //     else if (stripe <= 4.0){
                //         vec2 vUvStripe = vUv + vec2(xDisps[3], yDisps[3]);
                //         if (mod(-vUvStripe.y * uResolution.y + vUvStripe.x * uResolution.x, 17.7) <=1.5){
                //             gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                //         }
                //     }
                // }
                // if (pixelLuma <= 0.75){
                //     float stripe = mod((vUv.y * uResolution.y + vUv.x * uResolution.x) / (17.7 + 5.0 * sin(vUv.y * uResolution.y + vUv.x * uResolution.x)), 4.0);
                //     if (stripe <= 1.0){
                //         vec2 vUvStripe = vUv + vec2(xDisps[1], yDisps[1]);
                //         if (mod(vUvStripe.y * uResolution.y + vUvStripe.x * uResolution.x, 17.7) <=1.5){
                //             gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                //         }
                //     }else if (stripe <= 2.0){
                //         vec2 vUvStripe = vUv + vec2(xDisps[2], yDisps[2]);
                //         if (mod(vUvStripe.y * uResolution.y + vUvStripe.x * uResolution.x, 17.7) <=1.5){
                //             gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                //         }
                //     }
                //     else if (stripe <= 3.0){
                //         vec2 vUvStripe = vUv + vec2(xDisps[2], yDisps[2]);
                //         if (mod(vUvStripe.y * uResolution.y + vUvStripe.x * uResolution.x, 17.7) <=1.5){
                //             gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                //         }
                //     }
                //     else if (stripe <= 4.0){
                //         vec2 vUvStripe = vUv + vec2(xDisps[3], yDisps[3]);
                //         if (mod(vUvStripe.y * uResolution.y + vUvStripe.x * uResolution.x, 17.7) <=1.){
                //             gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                //         }
                //     }
                // }
                // if (pixelLuma > 0.75){
                //     gl_FragColor = vec4(czm_saturation((texture2D(tDiffuse, vUv) * 0.7 + vec4(240.0/255.0, 234.0/255.0, 214.0/255.0, 1.0) * 0.3).xyz, 0.4), 1.0);
                // }
            }
        }
    }
`

export class MoebiusMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            uniforms: {
                tDiffuse: { value: null },
                uNormals: { value: null },
                timerRandoms: {value: []},
                uResolution: {
                    value: new THREE.Vector2(1, 1)
                }
            },
            fragmentShader,
            vertexShader
        })
    }
}
